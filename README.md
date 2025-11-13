# Chainels White Label Figma Plugin

A Figma plugin that generates white label theme files for Chainels applications. This plugin extracts design tokens from your Figma file and generates all necessary theme files for web and mobile applications.

## 🎨 Install as a Designer (No Technical Knowledge Required)

If you're a designer and just want to use this plugin, follow these simple steps:

### Option 1: Using a Pre-built Package (Recommended)

1. **Get the plugin package**: Download it from the [latest release](https://github.com/GuidovdRiet/chainels-white-label-figma-plugin/releases) check for the latest version and download: `
chainels-white-label-figma-plugin.zip `

2. **Unzip the file**: Double-click the zip file to extract it. You'll see a folder with these files:
   - `manifest.json`
   - `ui.html`
   - `dist/` folder

3. **Install in Figma**:
   - Open the **Figma Desktop App** (this won't work in the browser version)
   - Open or create a Figma file
   - Go to **Menu** → **Plugins** → **Development** → **Import plugin from manifest...**
   - Navigate to the unzipped folder and select the `manifest.json` file
   - The plugin is now installed! 🎉

4. **Use the plugin**:
   - Go to **Plugins** → **Development** → **White Label Theme Generator**
   - Follow the on-screen instructions to generate your theme files

### Option 2: If You Have the Source Files

If you received the source files instead of a zip:

1. **Make sure you have Node.js installed** (ask developer if you're not sure)
2. **Open Terminal** (on Mac) or **Command Prompt** (on Windows)
3. **Navigate to the plugin folder** and run:
   ```bash
   npm install
   npm run build
   ```
4. Then follow steps 3-4 from Option 1 above

**That's it!** No need to install Git, Homebrew, or any other developer tools. Just unzip and import! 🚀

---

## Generated Files

The plugin generates the following files:

### Theme Files

- `[whiteLabelName].brand.ts`: TypeScript theme configuration with color assignments
- `[whiteLabelName].colors.scss`: SCSS color variables
- `[whiteLabelName].scss`: Main theme file with color assignments
- `[whiteLabelName]-email.scss`: Email-specific theme styles

### App Configuration

- `[whiteLabelName].config.json`: Application configuration file containing:
  - App configuration (brand ID, subdomain, app name, etc.)
  - Store configuration (multilingual store details)
  - Color definitions with semantic naming (e.g., `primary_50`, `primary_100`, etc.)
  - Theme configuration linking colors to their semantic roles

### Favicons (Beta)

- `favicon.ico`: Main favicon file
- `favicon-192x192.png`: PWA icon for modern devices
- `favicon-512x512.png`: Large PWA icon for high-resolution devices
- `manifest.json`: Web app manifest for PWA support

## 👨‍💻 For Developers

### Prerequisites

Before you begin, ensure you have installed:

- [Figma Desktop App](https://www.figma.com/downloads/)
- [Node.js](https://nodejs.org/) (version 14 or higher)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [Git](https://git-scm.com/) (for cloning the repository)

### Development Setup

1. Clone this repository, install dependencies and build:

   ```bash
   git clone https://github.com/GuidovdRiet/chainels-white-label-figma-plugin.git
   cd chainels-white-label-figma-plugin
   npm install
   npm run build
   ```

3. Making changes

   ```bash
   npm run build
   ```

### Installing the Plugin in Figma (Development)

1. Clone this repository, install dependencies and build:

   ```bash
   git clone https://github.com/GuidovdRiet/chainels-white-label-figma-plugin.git
   cd chainels-white-label-figma-plugin
   npm install
   npm run build
   ```

2. Open the Figma desktop app
3. Make a draft of the Figma file
4. Make sure dev mode is turned off
5. Go to **Menu** → **Plugins** → **Development** → **Import plugin from manifest**
6. Navigate to your cloned repository and select the `manifest.json` file

For detailed instructions on plugin development and setup, see the [Figma Plugin Development Guide](https://www.figma.com/plugin-docs/plugin-quickstart-guide/).

### Creating a Distribution Package

To create a zip file that designers can use without any technical setup:

```bash
npm run package
```

This will:
1. Build the plugin
2. Package everything into `chainels-white-label-figma-plugin.zip`
3. The zip file contains everything needed - just share it with designers!

The zip file includes:
- `manifest.json`
- `ui.html`
- `dist/` folder with compiled plugin code

## Using the Plugin

1. Open your Figma file containing the white label design tokens
2. Run the plugin from the Plugins menu
3. Enter your white label name (e.g., "ChainelsWhiteLabel")
4. (Optional) Upload a favicon image
5. Click "Generate Theme Files"
6. Use the download buttons to get the generated files

## File Structure

```
src/
├── plugin/
│   ├── generators/
│   │   ├── appConfig.ts     # App configuration generator
│   │   ├── scss.ts          # SCSS file generator
│   │   ├── scssTheme.ts     # Theme SCSS generator
│   │   └── typescript.ts    # TypeScript file generator
│   ├── utils/
│   │   ├── colorDataTransformer.ts  # Color processing
│   │   ├── createColorTint.ts       # Color variant generation
│   │   ├── getColorName.ts          # Color naming utility
│   │   └── createPullRequests.ts    # PR creation utility
│   └── index.ts             # Plugin entry point
└── types/
    └── index.ts             # TypeScript type definitions
```

## Building for Production

To build the plugin for production:

```bash
npm run build
```

This will:

1. Compile TypeScript files
2. Bundle the plugin
3. Generate production-ready files in the `dist` directory

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
