import "./utils/setImmediatePolyfill";
import { generateTheme } from "./themeGenerator";
import { generateTypescript } from "./generators/typescript";
import { generateScss } from "./generators/scss";
import { generateScssTheme } from "./generators/scssTheme";
import { generateAppConfig } from "./generators/appConfig";
import { createPullRequests } from "./utils/createPullRequests";

figma.showUI(__html__, { width: 350, height: 500 });

figma.ui.onmessage = async (msg) => {
  if (msg.type === "generate-theme") {
    try {
      const { transformedData } = await generateTheme();

      // Get all variables from Figma
      const figmaVariables: { [key: string]: { [key: string]: string } } = {};

      // Get all collections and their variables
      const collections = figma.variables.getLocalVariableCollections();

      collections.forEach((collection) => {
        const { modes, variableIds } = collection;
        console.log("Collection:", {
          name: collection.name,
          modes: modes.map((m) => m.name),
          variableCount: variableIds.length,
        });

        // Process each variable in the collection
        variableIds.forEach((variableId) => {
          const variable = figma.variables.getVariableById(variableId);
          if (variable) {
            const { name: varName, valuesByMode } = variable;

            // Initialize the variable object if it doesn't exist
            if (!figmaVariables[varName]) {
              figmaVariables[varName] = {};
            }

            // Map each mode's value to its corresponding language
            modes.forEach((mode) => {
              const value = valuesByMode[mode.modeId];
              if (typeof value === "string") {
                // Use the mode name as the language key
                figmaVariables[varName][mode.name] = value;
              }
            });

            console.log("Variable processed:", {
              name: varName,
              modes: Object.keys(valuesByMode).map((modeId) => {
                const mode = modes.find((m) => m.modeId === modeId);
                return {
                  name: mode?.name,
                  value: valuesByMode[modeId],
                };
              }),
            });
          }
        });
      });

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
      const appConfig = await generateAppConfig(
        transformedData,
        figmaVariables
      );

      // Send the generated files back to the UI
      figma.ui.postMessage({
        type: "theme-generated",
        data: {
          typescript,
          scss,
          scssTheme: scssOutput.theme,
          scssEmail: scssOutput.email,
          appConfig,
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
