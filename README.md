# Chainels White Label Figma Plugin

A Figma plugin that generates white label theme files for Chainels applications. This plugin extracts design tokens from your Figma file and generates all necessary theme files for web and mobile applications.

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

## Prerequisites

Before you begin, ensure you have installed:

- [Figma Desktop App](https://www.figma.com/downloads/)
- [Node.js](https://nodejs.org/) (version 14 or higher)
- [npm](https://www.npmjs.com/) (comes with Node.js)

## Development Setup

1. Clone this repository:

   ```bash
   git clone https://github.com/GuidovdRiet/chainels-white-label-figma-plugin.git
   cd chainels-white-label-figma-plugin
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the TypeScript compiler in watch mode:
   ```bash
   npm run dev
   ```

## Installing the Plugin in Figma

1. Clone this repository:

   ```bash
   git clone https://github.com/GuidovdRiet/chainels-white-label-figma-plugin.git
   cd chainels-white-label-figma-plugin
   npm install
   npm run build:ts
   ```
2. Open the Figma desktop app
3. Go to Menu > Plugins > Development > Import plugin from manifest
4. Navigate to your cloned repository and select the `manifest.json` file

For detailed instructions on plugin development and setup, see the [Figma Plugin Development Guide](https://www.figma.com/plugin-docs/plugin-quickstart-guide/).

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
