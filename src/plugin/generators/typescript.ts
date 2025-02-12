import { ThemeColors, ThemeColor } from "../../types";
import { getColorName } from "../utils/getColorName";

export async function generateTypescript(
  transformedData: ThemeColors,
  whiteLabelName: string
) {
  return createTemplate(transformedData, whiteLabelName);
}

function generateColorExport(
  colorVariants: ThemeColor,
  hexValue: string,
  whiteLabelName: string
): string {
  if (Object.keys(colorVariants).length === 0) return "";

  const colorName = getColorName(hexValue, whiteLabelName);
  const entries = Object.entries(colorVariants) as [keyof ThemeColor, string][];

  return `
export const ${colorName} = {
  ${entries.map(([tint, value]) => `${tint}: "${value}"`).join(",\n  ")}
};`;
}

async function createTemplate(
  transformedData: ThemeColors,
  whiteLabelName: string
): Promise<string> {
  const colorExports = new Map<string, string>();
  const assignments: string[] = [];

  // Helper function to process a color
  const processColor = (colorVariants: ThemeColor, category: string) => {
    if (Object.keys(colorVariants).length === 0) return;
    const defaultHex = colorVariants.default;
    if (!defaultHex) return;

    const colorName = getColorName(defaultHex, whiteLabelName);
    if (!colorExports.has(colorName)) {
      colorExports.set(
        colorName,
        generateColorExport(colorVariants, defaultHex, whiteLabelName)
      );
    }
    assignments.push(`  themeVariables.colors.${category} = ${colorName};`);
  };

  // Process primary and accent
  processColor(transformedData.primary, "primary");
  processColor(transformedData.accent, "accent");

  // Process semantic colors (excluding neutral)
  Object.entries(transformedData.semantic)
    .filter(([key]) => key !== "neutral")
    .forEach(([key, colorVariants]) => {
      processColor(colorVariants, `${key}`);
    });

  // Process status colors (excluding closed)
  Object.entries(transformedData.status)
    .filter(([key]) => key !== "closed")
    .forEach(([key, colorVariants]) => {
      processColor(colorVariants, `${key}`);
    });

  return `import { Theme } from '@emotion/react';

${Array.from(colorExports.values()).join("\n")}

export function ${whiteLabelName}Theme(themeVariables: Theme): Theme {
${assignments.join("\n")}

  return themeVariables;
}

export default ${whiteLabelName}Theme;`;
}
