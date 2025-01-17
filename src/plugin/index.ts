import { generateTheme } from "./themeGenerator";
import { generateTypescript } from "./generators/typescript";
import { generateScss } from "./generators/scss";
import { generateScssWhiteLabelName } from "./generators/scssTheme";

figma.showUI(__html__, { width: 320, height: 480 });

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
      const scssWhiteLabelName = await generateScssWhiteLabelName(
        transformedData,
        msg.whiteLabelName
      );

      // Send the generated files back to the UI
      figma.ui.postMessage({
        type: "theme-generated",
        data: {
          typescript,
          scss,
          scssWhiteLabelName,
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
};
