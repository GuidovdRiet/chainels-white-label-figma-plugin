import { ThemeColors } from "../../types";
import { getColorName } from "../utils/getColorName";

export async function generateScssWhiteLabelName(
  transformedData: ThemeColors,
  whiteLabelName: string
): Promise<string> {
  // Helper function to process a color and get its variable name
  const processColor = (defaultHex: string) => {
    if (!defaultHex) return null;
    return getColorName(defaultHex, whiteLabelName);
  };

  // Get color names for each category
  const primary = processColor(transformedData.primary.default || "");
  const accent = processColor(transformedData.accent.default || "");

  // Process semantic colors
  const positive = processColor(
    transformedData.semantic.positive.default || ""
  );
  const warning = processColor(transformedData.semantic.warning.default || "");
  const negative = processColor(
    transformedData.semantic.negative.default || ""
  );

  // Process status colors
  const open = processColor(transformedData.status.open.default || "");
  const done = processColor(transformedData.status.done.default || "");
  const progress = processColor(transformedData.status.progress.default || "");

  // Process error color with fallback to open
  let error = processColor(transformedData.status.error?.default || "");

  // If error color is not defined, use open color
  if (!error) {
    console.log("Error color not found in Figma, using open color as fallback");
    error = open;
  }

  return `@import '../../patterns/common/colors';
@import '../../patterns/common/theme-variables';
@import 'colors';

$theme-colors: (
  'primary': $${primary},
  'accent': $${accent},
  'positive': $${positive},
  'warning': $${warning},
  'negative': $${negative},
  'open': $${open},
  'done': $${done},
  'progress': $${progress},
  'error': $${error}
);

@include setCssVariables();
`;
}
