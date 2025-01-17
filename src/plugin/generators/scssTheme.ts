import { ThemeColors } from "../../types";
import { getColorName } from "../utils/getColorName";

export async function generateScssTheme(
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
  const positive = processColor(
    transformedData.semantic.positive.default || ""
  );
  const warning = processColor(transformedData.semantic.warning.default || "");
  const negative = processColor(
    transformedData.semantic.negative.default || ""
  );
  const open = processColor(transformedData.status.open.default || "");
  const done = processColor(transformedData.status.done.default || "");
  const progress = processColor(transformedData.status.progress.default || "");

  // Use open color for error as per previous logic
  const error =
    processColor(transformedData.status.error?.default || "") || open;

  return `@import '../../patterns/common/colors';
@import '../../patterns/common/theme-variables';
@import 'colors';

$theme-colors: (
  'primary': $${primary},
  'accent': $${accent},
  'positive': $${positive},
  'warning': $${warning},
  'negative': $${negative},
  'neutral': $chainelsNeutralGray,
  'open': $${open},
  'done': $${done},
  'progress': $${progress},
  'closed': $chainelsNeutralGray,
  'error': $${error}
);

$color-email-accent: themeColor('accent', 'default');
$color-email-primary: themeColor('primary', 'default');

@import '../../email/email';`;
}