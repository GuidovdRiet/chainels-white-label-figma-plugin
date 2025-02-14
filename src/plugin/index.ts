import "./utils/setImmediatePolyfill";
import { generateTheme } from "./themeGenerator";
import { generateTypescript } from "./generators/typescript";
import { generateScss } from "./generators/scss";
import { generateScssTheme } from "./generators/scssTheme";
import { createPullRequests } from "./utils/createPullRequests";

figma.showUI(__html__, { width: 350, height: 500 });

figma.ui.onmessage = async (msg) => {
  if (msg.type === "generate-theme") {
    try {
      const { transformedData } = await generateTheme();

      // Generate all files
      const typescript = await generateTypescript(
        transformedData,
        msg.whiteLabelName
      );
      const scss = await generateScss(transformedData, msg.whiteLabelName);
      const scssOutput = await generateScssTheme(
        transformedData,
        msg.whiteLabelName
      );

      // Send the generated files back to the UI
      figma.ui.postMessage({
        type: "theme-generated",
        data: {
          typescript,
          scss,
          scssTheme: scssOutput.theme,
          scssEmail: scssOutput.email,
          themeData: transformedData,
        },
      });
    } catch (error: unknown) {
      console.error("Error generating theme:", error);
      figma.ui.postMessage({
        type: "error",
        message:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  }
  if (msg.type === "create-prs") {
    try {
      await createPullRequests(msg.whiteLabelName, msg.files, msg.credentials);
      figma.ui.postMessage({
        type: "prs-created",
        message: "🚀 Pull requests created successfully!",
      });
    } catch (error) {
      figma.ui.postMessage({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to create pull requests",
      });
    }
  }
};
