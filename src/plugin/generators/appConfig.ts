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
  figmaVariables: { [key: string]: { [key: string]: string } }
): Promise<string> {
  // Helper function to get the first available value from any column
  function getFirstAvailableValue(key: string): string {
    if (!figmaVariables[key]) return "";
    const values = Object.values(figmaVariables[key]);
    return values.find((value) => value) || "";
  }

  // Helper function to get store config values for all languages
  function getStoreConfigValues(baseKey: string): StoreTranslation[] {
    const translations: StoreTranslation[] = [];

    // Get the values for each language column
    if (figmaVariables[baseKey]) {
      Object.entries(figmaVariables[baseKey]).forEach(([columnName, value]) => {
        translations.push({
          language: columnName, // Use the exact column name as the language
          value: value,
        });
      });
    }

    return translations;
  }

  const config: AppConfig = {
    app_config: {
      brand_id: getFirstAvailableValue("Brand id"),
      subdomain: getFirstAvailableValue("Subdomain"),
      app_name: getFirstAvailableValue("App name"),
      brand_name: getFirstAvailableValue("Brand name"),
      slogan: getFirstAvailableValue("Slogan"),
      splash_screen_color:
        getFirstAvailableValue("splashscreen background") || "#FFFFFF",
      provider_name: getFirstAvailableValue("Provider"),
      google_drive: getFirstAvailableValue("Google Drive"),
    },
    store_config: {
      store_name: getStoreConfigValues("App Store name"),
      description: getStoreConfigValues("Store Description"),
      keywords: getStoreConfigValues("Store keywords"),
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
