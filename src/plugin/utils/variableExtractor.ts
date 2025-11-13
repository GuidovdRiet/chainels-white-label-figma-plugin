/**
 * Extract and process color variables from Figma collections
 */

import { rgbToHex, isColorValue, createColorData } from "./colorUtils";
import { colorDataTransformer } from "./colorDataTransformer";

export interface CollectionInfo {
  name: string;
  modes: string[];
  variableCount: number;
}

/**
 * Process a collection and extract color variables
 */
export function processCollection(collection: VariableCollection): {
  info: CollectionInfo;
  colorEntries: Array<ReturnType<typeof createColorData>>;
} {
  const { modes, variableIds, name } = collection;
  const colorEntries: Array<ReturnType<typeof createColorData>> = [];
  const firstMode = modes[0];

  variableIds.forEach((variableId) => {
    const variable = figma.variables.getVariableById(variableId);
    if (!variable || variable.resolvedType !== "COLOR") {
      return;
    }

    const { name: varName, valuesByMode, id } = variable;

    // Process first mode for transformedData
    if (firstMode) {
      const firstValue = valuesByMode[firstMode.modeId];
      if (isColorValue(firstValue)) {
        const hex = rgbToHex(firstValue);
        colorDataTransformer(varName, hex);
      }
    }

    // Create entries for all modes
    modes.forEach((mode) => {
      const value = valuesByMode[mode.modeId];
      if (isColorValue(value)) {
        colorEntries.push(createColorData(varName, value, id, mode.name));
      }
    });
  });

  return {
    info: {
      name,
      modes: modes.map((m) => m.name),
      variableCount: variableIds.length,
    },
    colorEntries,
  };
}
