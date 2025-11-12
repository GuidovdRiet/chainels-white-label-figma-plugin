const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("📦 Packaging Figma plugin for distribution...\n");

// Step 1: Build the plugin
console.log("1️⃣  Building plugin...");
try {
  execSync("npm run build", { stdio: "inherit" });
  console.log("✅ Build complete!\n");
} catch (error) {
  console.error("❌ Build failed!");
  process.exit(1);
}

// Step 2: Create zip file
console.log("2️⃣  Creating distribution package...");
const pluginName = "chainels-white-label-figma-plugin";
const zipFileName = `${pluginName}.zip`;

// Clean up any existing zip
if (fs.existsSync(zipFileName)) {
  fs.unlinkSync(zipFileName);
}

// Verify required files exist
const requiredFiles = ["manifest.json", "ui.html", "dist"];
requiredFiles.forEach((file) => {
  if (!fs.existsSync(path.join(__dirname, file))) {
    console.error(`❌ Error: ${file} not found!`);
    process.exit(1);
  }
});

// Create zip file with only the required files
try {
  execSync(`zip -r ${zipFileName} manifest.json ui.html dist/`, {
    stdio: "inherit",
    cwd: __dirname,
  });
  console.log(`✅ Package created: ${zipFileName}\n`);
} catch (error) {
  console.error(
    "❌ Failed to create zip file. Make sure 'zip' command is available."
  );
  process.exit(1);
}

console.log("🎉 Plugin packaged successfully!");
console.log(`\n📎 Share this file with designers: ${zipFileName}`);
console.log("\n📖 Installation instructions:");
console.log("   1. Unzip the file");
console.log("   2. Open Figma Desktop");
console.log("   3. Go to Plugins > Development > Import plugin from manifest");
console.log("   4. Select the manifest.json file from the unzipped folder");
