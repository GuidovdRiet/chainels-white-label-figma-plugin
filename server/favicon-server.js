// Load environment variables from .env file if it exists
// Look for .env in the server directory (where this file is)
require("dotenv").config({ path: require("path").join(__dirname, ".env") });

const express = require("express");
const multer = require("multer");
const {
  generateFaviconFiles,
  generateFaviconHtml,
  initFaviconIconSettings,
} = require("@realfavicongenerator/generate-favicon");
const {
  getNodeImageAdapter,
  loadAndConvertToSvg,
} = require("@realfavicongenerator/image-adapter-node");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Security: API Key from environment variable
const API_KEY = process.env.FAVICON_API_KEY || "change-me-in-production";
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["https://www.figma.com"];

// CORS configuration - only allow specific origins
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin or "null" origin
      // This happens with:
      // - Figma plugins (iframe context sends "null")
      // - Direct fetch from file://
      // - Postman/curl
      if (!origin || origin === "null") {
        console.log(
          "🔓 Allowing request with null/missing origin (Figma plugin or direct request)"
        );
        return callback(null, true);
      }

      // Check if origin is in allowed list
      if (ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGINS.includes("*")) {
        callback(null, true);
      } else {
        // Log the origin for debugging
        console.log(`CORS blocked origin: ${origin}`);
        console.log(`Allowed origins: ${ALLOWED_ORIGINS.join(", ")}`);
        // For development, allow localhost
        if (
          origin.startsWith("http://localhost:") ||
          origin.startsWith("https://localhost:")
        ) {
          return callback(null, true);
        }
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

// Simple API key middleware
// Skip API key check for localhost (development only)
const apiKeyMiddleware = (req, res, next) => {
  // Allow requests from localhost without API key (development)
  const isLocalhost =
    req.hostname === "localhost" ||
    req.hostname === "127.0.0.1" ||
    req.get("host")?.includes("localhost") ||
    req.get("host")?.includes("127.0.0.1");

  if (isLocalhost) {
    // Development mode - no API key required for localhost
    console.log(
      "🔓 Development mode: Allowing localhost request without API key"
    );
    return next();
  }

  // Production mode - require API key
  const apiKey = req.headers["x-api-key"] || req.query.apiKey;

  if (!apiKey || apiKey !== API_KEY) {
    return res.status(401).json({
      error: "Unauthorized",
      message:
        "Invalid or missing API key. Include X-API-Key header or apiKey query parameter.",
    });
  }

  next();
};

// Temporary directory for processing
const tempDir = path.join(__dirname, "temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

/**
 * Generate favicons from uploaded image
 * Protected with API key authentication
 */
app.post(
  "/api/generate-favicons",
  apiKeyMiddleware,
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      const siteName = req.body.siteName || "Site";
      const tempFilePath = path.join(
        tempDir,
        `input-${Date.now()}.${req.file.originalname.split(".").pop()}`
      );

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
        if (
          iconSettings.webAppManifest &&
          iconSettings.webAppManifest.manifest
        ) {
          iconSettings.webAppManifest.manifest.name = siteName;
          iconSettings.webAppManifest.manifest.short_name = siteName;
        }

        // Create favicon settings object
        const faviconSettings = {
          icon: iconSettings,
          path: "/",
        };

        // Get image adapter for generation (it returns a Promise)
        const imageAdapter = await getNodeImageAdapter();

        // Generate favicon files
        const result = await generateFaviconFiles(
          masterIcon,
          faviconSettings,
          imageAdapter
        );
        const htmlMarkupResult = generateFaviconHtml(faviconSettings);

        // Convert files to base64 for response
        // result is already FaviconFiles (object with filename -> content mapping)
        const files = {};
        if (!result || typeof result !== "object") {
          throw new Error("Invalid result from generateFaviconFiles");
        }
        for (const [filename, content] of Object.entries(result)) {
          if (Buffer.isBuffer(content)) {
            files[filename] = {
              content: content.toString("base64"),
              mimeType: getMimeType(filename),
              encoding: "base64",
            };
          } else if (typeof content === "string") {
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
        const htmlMarkup = htmlMarkupResult.markups.join("\n");

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
      console.error("Error generating favicons:", error);
      res.status(500).json({
        error: "Failed to generate favicons",
        message: error.message,
      });
    }
  }
);

/**
 * Health check endpoint
 */
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

function getMimeType(filename) {
  const ext = filename.split(".").pop()?.toLowerCase();
  const mimeTypes = {
    ico: "image/x-icon",
    png: "image/png",
    svg: "image/svg+xml",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    json: "application/json",
    xml: "application/xml",
    html: "text/html",
    webmanifest: "application/manifest+json",
  };
  return mimeTypes[ext] || "application/octet-stream";
}

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Favicon generation server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API Key required: Set FAVICON_API_KEY environment variable`);
  console.log(
    `Current API Key: ${
      API_KEY === "change-me-in-production"
        ? "⚠️  DEFAULT (CHANGE THIS!)"
        : "✅ Set"
    }`
  );
  console.log(`API Key value: ${API_KEY.substring(0, 8)}... (first 8 chars)`);
  console.log(`Allowed origins: ${ALLOWED_ORIGINS.join(", ")}`);
  console.log(
    `\n💡 Tip: If CORS errors occur, check the console for the actual origin being sent.`
  );
});
