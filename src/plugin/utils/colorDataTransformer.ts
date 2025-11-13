import {
  SemanticColors,
  StatusColors,
  ThemeColor,
  ThemeColors,
} from "../../types";
import { parseColorName } from "./colorNameParser";

export const createInitialData = (): ThemeColors => ({
  primary: {} as ThemeColor,
  accent: {} as ThemeColor,
  semantic: {
    positive: {} as ThemeColor,
    warning: {} as ThemeColor,
    negative: {} as ThemeColor,
    neutral: {} as ThemeColor,
  },
  status: {
    open: {} as ThemeColor,
    done: {} as ThemeColor,
    progress: {} as ThemeColor,
    closed: {} as ThemeColor,
    error: {} as ThemeColor,
  },
});

export let transformedData = createInitialData();

// Helper function to normalize variant names based on Figma's numbering system
function normalizeVariant(variant: string): keyof ThemeColor {
  if (!variant) return "default";

  // Convert to lowercase and remove any spaces for consistent comparison
  const lower = variant.toLowerCase().trim();

  // Map Figma's number system to our variant names
  if (lower === "50" || lower === "100") return "lighter";
  if (lower === "200" || lower === "300") return "light";
  if (lower === "400" || lower === "500" || lower === "600") return "default";
  if (lower === "700" || lower === "800" || lower === "custom-1") return "dark";
  if (lower === "900" || lower === "custom-2") return "darker";

  // Handle direct variant names
  const directVariants = ["lighter", "light", "default", "dark", "darker"];
  if (directVariants.includes(lower)) {
    return lower as keyof ThemeColor;
  }

  // Handle descriptive names
  if (lower.includes("light")) {
    if (lower.includes("er") || lower.includes("est")) return "lighter";
    return "light";
  }
  if (lower.includes("dark")) {
    if (lower.includes("er") || lower.includes("est")) return "darker";
    return "dark";
  }

  return "default";
}

export function colorDataTransformer(color: string, hexValue: string) {
  const parsed = parseColorName(color);

  if (!parsed) {
    return transformedData;
  }

  const normalizedVariant = normalizeVariant(parsed.variant);

  // Handle primary and accent colors
  if (parsed.category === "primary" || parsed.category === "accent") {
    transformedData[parsed.category] = {
      ...transformedData[parsed.category],
      [normalizedVariant]: hexValue,
    };
    return transformedData;
  }

  // Handle semantic colors
  if (parsed.category === "semantic" && parsed.subCategory) {
    const semanticKey = parsed.subCategory as keyof SemanticColors;
    transformedData.semantic[semanticKey] = {
      ...transformedData.semantic[semanticKey],
      [normalizedVariant]: hexValue,
    };
    return transformedData;
  }

  // Handle status colors
  if (parsed.category === "status" && parsed.subCategory) {
    const statusKey = parsed.subCategory as keyof StatusColors;
    transformedData.status[statusKey] = {
      ...transformedData.status[statusKey],
      [normalizedVariant]: hexValue,
    };

    // If this is an 'open' color, also set it as the 'error' color
    if (statusKey === "open") {
      transformedData.status.error = {
        ...transformedData.status.open,
      };
    }
    return transformedData;
  }

  return transformedData;
}
