import {
  transformedData,
  createInitialData,
} from "./utils/colorDataTransformer";
import { processCollection } from "./utils/variableExtractor";

/**
 * Reset the transformed data structure to empty state
 * Primary and accent are static, semantic and status are dynamic
 */
function resetTransformedData(): void {
  const initialData = createInitialData();

  // Reset primary and accent (static - always present)
  transformedData.primary = {};
  transformedData.accent = {};

  // Reset semantic colors (dynamic - iterates over initial data)
  Object.keys(initialData.semantic).forEach((key) => {
    transformedData.semantic[key as keyof typeof initialData.semantic] = {};
  });

  // Reset status colors (dynamic - iterates over initial data)
  Object.keys(initialData.status).forEach((key) => {
    transformedData.status[key as keyof typeof initialData.status] = {};
  });
}

export async function generateTheme() {
  resetTransformedData();

  const collections = figma.variables.getLocalVariableCollections();
  const colorCollection: ReturnType<
    typeof import("./utils/colorUtils").createColorData
  >[] = [];

  // Process each collection
  collections.forEach((collection) => {
    const { colorEntries } = processCollection(collection);
    colorCollection.push(...colorEntries);
  });

  return {
    colorCollection,
    transformedData,
  };
}
