const esbuild = require("esbuild");
const { spawn } = require("child_process");
const path = require("path");

const isWatch = process.argv.includes("--watch");
const startServer = process.argv.includes("--server") || isWatch; // Auto-start server in watch mode

/** @type {import('esbuild').BuildOptions} */
const commonConfig = {
  target: "es6",
  bundle: true,
  minify: !isWatch,
  sourcemap: true,
  platform: "browser",
  format: "iife",
};

let serverProcess = null;

// Start the favicon server
function startFaviconServer() {
  if (serverProcess) {
    console.log("✅ Favicon server already running");
    return;
  }

  console.log("🚀 Starting favicon server...");
  serverProcess = spawn("node", [path.join(__dirname, "server", "favicon-server.js")], {
    stdio: "inherit",
    cwd: __dirname,
  });

  serverProcess.on("error", (error) => {
    console.error("❌ Failed to start server:", error.message);
    console.log("💡 Make sure you have node installed and server dependencies are installed");
  });

  serverProcess.on("exit", (code) => {
    if (code !== null && code !== 0) {
      console.error(`❌ Server exited with code ${code}`);
    }
    serverProcess = null;
  });

  // Give server a moment to start
  setTimeout(() => {
    if (serverProcess && !serverProcess.killed) {
      console.log("✅ Favicon server running on http://localhost:3001");
    }
  }, 1000);
}

// Cleanup function
function cleanup() {
  if (serverProcess) {
    console.log("\n🛑 Stopping favicon server...");
    serverProcess.kill();
    serverProcess = null;
  }
}

// Handle process termination
process.on("SIGINT", () => {
  cleanup();
  process.exit(0);
});

process.on("SIGTERM", () => {
  cleanup();
  process.exit(0);
});

async function build() {
  try {
    // Start server if needed
    if (startServer) {
      startFaviconServer();
    }

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
      console.log("👀 Watching for plugin changes...");
      console.log("💡 Favicon server is running - upload favicons in Figma!");
    } else {
      await pluginContext.rebuild();
      await pluginContext.dispose();
      // Don't cleanup server on one-time build if it was already running
    }
  } catch (error) {
    console.error("Build failed:", error);
    cleanup();
    process.exit(1);
  }
}

build();
