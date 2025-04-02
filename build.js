const esbuild = require("esbuild");

const isWatch = process.argv.includes("--watch");

/** @type {import('esbuild').BuildOptions} */
const commonConfig = {
  target: "es6",
  bundle: true,
  minify: !isWatch,
  sourcemap: true,
  platform: "browser",
  format: "iife",
};

async function build() {
  try {
    // Build the plugin code
    const pluginContext = await esbuild.context({
      ...commonConfig,
      entryPoints: ["src/plugin/index.ts"],
      outfile: "dist/plugin/index.js",
      define: {
        "process.env.NODE_ENV": '"production"',
      },
    });

    if (isWatch) {
      await pluginContext.watch();
      console.log("👀 Watching for changes...");
    } else {
      await pluginContext.rebuild();
      await pluginContext.dispose();
    }
  } catch (error) {
    console.error("Build failed:", error);
    process.exit(1);
  }
}

build();
