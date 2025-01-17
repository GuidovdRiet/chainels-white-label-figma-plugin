import {
  SemanticColors,
  StatusColors,
  ThemeColor,
  ThemeColors,
} from "../../types";

const createInitialData = (): ThemeColors => ({
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

  console.log("Normalizing variant:", { input: variant, normalized: lower });

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

  console.log("Defaulting variant:", variant, "to 'default'");
  return "default";
}

export function colorDataTransformer(color: string, hexValue: string) {
  console.log("\n=== Color Transformer ===");
  console.log("Input:", { color, hexValue });

  // Split and analyze the color name parts
  const parts = color.split("/").map((part) => part.trim().toLowerCase());
  console.log("Name parts:", parts);

  // Handle different naming conventions
  let category, variant;

  if (parts.length >= 2) {
    if (parts[0] === "brand") {
      // Handle brand/primary/light format
      category = parts[1];
      variant = parts[2];
    } else {
      // Handle semantic/positive/light or status/open/light format
      category = parts[0];
      if (parts.length === 3) {
        variant = parts[2];
      } else {
        variant = parts[1];
      }
    }
  } else {
    console.log("⚠️ Invalid color name format:", color);
    return transformedData;
  }

  console.log("Parsed name:", {
    category,
    variant,
    parts,
  });

  if (!category) {
    console.log("⚠️ Missing category");
    return transformedData;
  }

  // For primary and accent colors
  if (category === "primary" || category === "accent") {
    const normalizedVariant = normalizeVariant(variant || "default");
    console.log("🎨 Processing color:", {
      category,
      variant: normalizedVariant,
      hexValue,
      currentData: transformedData[category],
    });

    transformedData[category] = {
      ...transformedData[category],
      [normalizedVariant]: hexValue,
    };

    console.log(`Updated ${category}.${normalizedVariant} to ${hexValue}`);
    console.log("New state:", transformedData[category]);
  }
  // For semantic colors
  else if (parts[0] === "semantic" && parts[1]) {
    const semanticKey = parts[1] as keyof SemanticColors;
    const normalizedVariant = normalizeVariant(parts[2] || "default");
    console.log("🎨 Processing semantic color:", {
      category: parts[0],
      semanticKey,
      variant: normalizedVariant,
      hexValue,
    });
    transformedData.semantic[semanticKey] = {
      ...transformedData.semantic[semanticKey],
      [normalizedVariant]: hexValue,
    };
  }
  // For status colors
  else if (parts[0] === "status" && parts[1]) {
    const statusKey = parts[1] as keyof StatusColors;
    const normalizedVariant = normalizeVariant(parts[2] || "default");
    console.log("🎨 Processing status color:", {
      category: parts[0],
      statusKey,
      variant: normalizedVariant,
      hexValue,
    });

    transformedData.status[statusKey] = {
      ...transformedData.status[statusKey],
      [normalizedVariant]: hexValue,
    };

    // If this is an 'open' color, also set it as the 'error' color
    if (statusKey === "open") {
      console.log("Setting error color to match open color");
      transformedData.status.error = {
        ...transformedData.status.open,
      };
    }
  } else {
    console.log("⚠️ Unhandled color category:", category);
  }

  return transformedData;
}
