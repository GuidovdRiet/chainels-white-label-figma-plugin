import { ThemeColors, ThemeColor } from "../../types";
import { getColorName } from "../utils/getColorName";

export async function generateScss(
  transformedData: ThemeColors,
  whiteLabelName: string
) {
  return createTemplate(transformedData, whiteLabelName);
}

function generateColorMap(
  colorVariants: ThemeColor,
  hexValue: string,
  whiteLabelName: string
): string {
  if (Object.keys(colorVariants).length === 0) return "";

  const colorName = getColorName(hexValue, whiteLabelName);
  const entries = Object.entries(colorVariants) as [keyof ThemeColor, string][];

  return `
$${colorName}: (
  ${entries.map(([tint, value]) => `'${tint}': ${value}`).join(",\n  ")}
);`;
}

async function createTemplate(
  transformedData: ThemeColors,
  whiteLabelName: string
): Promise<string> {
  const colorMaps = new Map<string, string>();

  // Helper function to process a color
  const processColor = (colorVariants: ThemeColor) => {
    if (Object.keys(colorVariants).length === 0) return;
    const defaultHex = colorVariants.default;
    if (!defaultHex) return;

    const colorName = getColorName(defaultHex, whiteLabelName);
    if (!colorMaps.has(colorName)) {
      colorMaps.set(
        colorName,
        generateColorMap(colorVariants, defaultHex, whiteLabelName)
      );
    }
  };

  // Process primary and accent
  processColor(transformedData.primary);
  processColor(transformedData.accent);

  // Process semantic colors (excluding neutral)
  Object.entries(transformedData.semantic)
    .filter(([key]) => key !== "neutral")
    .forEach(([_, colorVariants]) => {
      processColor(colorVariants);
    });

  // Process status colors (excluding closed)
  Object.entries(transformedData.status)
    .filter(([key]) => key !== "closed")
    .forEach(([_, colorVariants]) => {
      processColor(colorVariants);
    });

  return `// ${whiteLabelName} Theme Colors
${Array.from(colorMaps.values()).join("\n")}`;
}
