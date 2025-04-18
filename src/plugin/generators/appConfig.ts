import { ThemeColors } from "../../types";

interface StoreTranslation {
  language: string;
  value: string;
}

interface ThemeColorVariants {
  lighter?: string;
  light?: string;
  default?: string;
  dark?: string;
  darker?: string;
}

interface AppTheme {
  [key: string]: ThemeColorVariants;
}

interface AppConfig {
  app_config: {
    brand_id: string;
    subdomain: string;
    app_name: string;
    brand_name: string;
    slogan: string;
    splash_screen_color: string;
    provider_name: string;
    google_drive: string;
  };
  store_config: {
    store_name: StoreTranslation[];
    description: StoreTranslation[];
    keywords: StoreTranslation[];
  };
  colors: Array<{
    name: string;
    hex: string;
  }>;
  theme: AppTheme;
}

function getColorNameForApp(colorType: string, variant: string): string {
  // Convert variant names to numbers based on Figma's system
  const variantMap: { [key: string]: string } = {
    lighter: "50",
    light: "100",
    default: "200",
    dark: "300",
    darker: "400",
  };

  const variantNumber = variantMap[variant] || "200";
  return `${colorType}_${variantNumber}`;
}

export async function generateAppConfig(
  transformedData: ThemeColors,
  figmaVariables: { [key: string]: string }
): Promise<string> {
  // Helper function to get store config value with fallback
  function getStoreConfigValue(
    enKey: string,
    nlKey: string
  ): { en: string; nl: string } {
    const enValue = figmaVariables[enKey] || "";
    const nlValue = figmaVariables[nlKey] || "";
    return {
      en: enValue,
      nl: nlValue || enValue, // Use English value as fallback if Dutch is empty
    };
  }

  const config: AppConfig = {
    app_config: {
      brand_id: figmaVariables["Brand id"] || "",
      subdomain: figmaVariables["Subdomain"] || "",
      app_name: figmaVariables["App name"] || "",
      brand_name: figmaVariables["Brand name"] || "",
      slogan: figmaVariables["Slogan"] || "",
      splash_screen_color: transformedData.primary.default || "#FFFFFF",
      provider_name: figmaVariables["Provider"] || "",
      google_drive: figmaVariables["Google Drive"] || "",
    },
    store_config: {
      store_name: [
        {
          language: "en",
          value: figmaVariables["App Store name"] || "",
        },
        {
          language: "nl",
          value:
            figmaVariables["App Store name NL"] ||
            figmaVariables["App Store name"] ||
            "", // Fallback to EN
        },
      ],
      description: [
        {
          language: "en",
          value: figmaVariables["Store Description"] || "",
        },
        {
          language: "nl",
          value:
            figmaVariables["Store Description NL"] ||
            figmaVariables["Store Description"] ||
            "", // Fallback to EN
        },
      ],
      keywords: [
        {
          language: "en",
          value: figmaVariables["Store keywords"] || "",
        },
        {
          language: "nl",
          value:
            figmaVariables["Store keywords NL"] ||
            figmaVariables["Store keywords"] ||
            "", // Fallback to EN
        },
      ],
    },
    colors: [],
    theme: {
      primary: {},
      accent: {},
      positive: {},
      warning: {},
      negative: {},
      open: {},
      done: {},
      progress: {},
      error: {},
    },
  };

  function processColorVariant(colorObj: any, colorType: string) {
    if (!colorObj) return;

    Object.entries(colorObj).forEach(([variant, hex]) => {
      if (typeof hex === "string") {
        const colorName = getColorNameForApp(colorType, variant);

        // Add to colors array if not already present
        if (!config.colors.some((color) => color.name === colorName)) {
          config.colors.push({
            name: colorName,
            hex: hex,
          });
        }

        // Add reference to theme
        if (!config.theme[colorType]) {
          config.theme[colorType] = {};
        }
        config.theme[colorType][variant as keyof ThemeColorVariants] =
          colorName;
      }
    });
  }

  // Process primary and accent
  processColorVariant(transformedData.primary, "primary");
  processColorVariant(transformedData.accent, "accent");

  // Process semantic colors
  processColorVariant(transformedData.semantic.positive, "positive");
  processColorVariant(transformedData.semantic.warning, "warning");
  processColorVariant(transformedData.semantic.negative, "negative");

  // Process status colors
  processColorVariant(transformedData.status.open, "open");
  processColorVariant(transformedData.status.done, "done");
  processColorVariant(transformedData.status.progress, "progress");
  processColorVariant(transformedData.status.error, "error");

  return JSON.stringify(config, null, 2);
}
