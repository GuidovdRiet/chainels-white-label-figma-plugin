const express = require('express');
const multer = require('multer');
const { generateFaviconFiles, generateFaviconHtml, initFaviconIconSettings } = require('@realfavicongenerator/generate-favicon');
const { getNodeImageAdapter, loadAndConvertToSvg } = require('@realfavicongenerator/image-adapter-node');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Enable CORS for Figma plugin
app.use(cors());
app.use(express.json());

// Temporary directory for processing
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

/**
 * Generate favicons from uploaded image
 */
app.post('/api/generate-favicons', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const siteName = req.body.siteName || 'Site';
    const tempFilePath = path.join(tempDir, `input-${Date.now()}.${req.file.originalname.split('.').pop()}`);
    
    // Write uploaded file to temp location
    fs.writeFileSync(tempFilePath, req.file.buffer);

    try {
      // Load and convert image to SVG
      const svg = await loadAndConvertToSvg(tempFilePath);
      
      // Create MasterIcon object
      const masterIcon = {
        icon: svg,
      };

      // Initialize favicon settings with defaults
      const iconSettings = initFaviconIconSettings();
      
      // Update web app manifest settings with site name
      if (iconSettings.webAppManifest && iconSettings.webAppManifest.manifest) {
        iconSettings.webAppManifest.manifest.name = siteName;
        iconSettings.webAppManifest.manifest.short_name = siteName;
      }

      // Create favicon settings object
      const faviconSettings = {
        icon: iconSettings,
        path: '/',
      };

      // Get image adapter for generation (it returns a Promise)
      const imageAdapter = await getNodeImageAdapter();

      // Generate favicon files
      const result = await generateFaviconFiles(masterIcon, faviconSettings, imageAdapter);
      const htmlMarkupResult = generateFaviconHtml(faviconSettings);

      // Convert files to base64 for response
      // result is already FaviconFiles (object with filename -> content mapping)
      const files = {};
      if (!result || typeof result !== 'object') {
        throw new Error('Invalid result from generateFaviconFiles');
      }
      for (const [filename, content] of Object.entries(result)) {
        if (Buffer.isBuffer(content)) {
          files[filename] = {
            content: content.toString('base64'),
            mimeType: getMimeType(filename),
            encoding: 'base64',
          };
        } else if (typeof content === 'string') {
          files[filename] = {
            content: content,
            mimeType: getMimeType(filename),
          };
        } else {
          // Handle other types (shouldn't happen, but just in case)
          files[filename] = {
            content: String(content),
            mimeType: getMimeType(filename),
          };
        }
      }

      // Convert HTML markup result to string (join all markups)
      const htmlMarkup = htmlMarkupResult.markups.join('\n');

      // Clean up temp file
      fs.unlinkSync(tempFilePath);

      res.json({
        success: true,
        files,
        html: htmlMarkup,
      });
    } catch (error) {
      // Clean up temp file on error
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      throw error;
    }
  } catch (error) {
    console.error('Error generating favicons:', error);
    res.status(500).json({
      error: 'Failed to generate favicons',
      message: error.message,
    });
  }
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

function getMimeType(filename) {
  const ext = filename.split('.').pop()?.toLowerCase();
  const mimeTypes = {
    ico: 'image/x-icon',
    png: 'image/png',
    svg: 'image/svg+xml',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    json: 'application/json',
    xml: 'application/xml',
    html: 'text/html',
    webmanifest: 'application/manifest+json',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Favicon generation server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

