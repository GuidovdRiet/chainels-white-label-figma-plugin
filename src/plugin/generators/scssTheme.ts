import { ThemeColors } from "../../types";
import { getColorName } from "../utils/getColorName";

interface ScssThemeOutput {
  theme: string;
  email: string;
}

export async function generateScssTheme(
  transformedData: ThemeColors,
  whiteLabelName: string
): Promise<ScssThemeOutput> {
  // Convert whiteLabelName to start with lowercase
  const lowerCaseWhiteLabelName =
    whiteLabelName.charAt(0).toLowerCase() + whiteLabelName.slice(1);

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
  const error =
    processColor(transformedData.status.error?.default || "") || open;

  // Common theme colors configuration
  const themeColorsConfig = `$theme-colors: (
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
);`;

  // Common imports
  const commonImports = `@import '../../patterns/common/colors';
@import '../../patterns/common/theme-variables';
@import './${lowerCaseWhiteLabelName}.colors';`;

  // Generate theme SCSS
  const themeScss = `${commonImports}

${themeColorsConfig}

@include setCssVariables();`;

  // Generate email SCSS
  const emailScss = `${commonImports}

${themeColorsConfig}

$color-email-accent: themeColor('primary', 'default');
$color-email-primary: themeColor('primary', 'default');

@import '../../email/email';`;

  return {
    theme: themeScss,
    email: emailScss,
  };
}
