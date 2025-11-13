/**
 * Structured parser for color variable names
 * Handles various naming conventions in a maintainable way
 */

import { SemanticColors, StatusColors, ThemeColor } from "../../types";

export interface ParsedColorName {
  category: "primary" | "accent" | "semantic" | "status";
  subCategory?: keyof SemanticColors | keyof StatusColors;
  variant: string;
}

// Category definitions
const DIRECT_CATEGORIES = ["primary", "accent"] as const;
const SEMANTIC_CATEGORIES = ["positive", "warning", "negative", "neutral"] as const;
const STATUS_CATEGORIES = ["open", "done", "progress", "closed", "error"] as const;

type DirectCategory = typeof DIRECT_CATEGORIES[number];
type SemanticCategory = typeof SEMANTIC_CATEGORIES[number];
type StatusCategory = typeof STATUS_CATEGORIES[number];

/**
 * Parse a color variable name into structured components
 */
export function parseColorName(colorName: string): ParsedColorName | null {
  const parts = colorName.split("/").map((part) => part.trim().toLowerCase());

  // Pattern 1: brand/primary/variant (3 parts)
  if (parts.length === 3 && parts[0] === "brand") {
    const category = parts[1];
    if (DIRECT_CATEGORIES.includes(category as DirectCategory)) {
      return {
        category: category as "primary" | "accent",
        variant: parts[2],
      };
    }
  }

  // Pattern 2: semantic/positive/variant (3 parts)
  if (parts.length === 3 && parts[0] === "semantic") {
    const subCategory = parts[1];
    if (SEMANTIC_CATEGORIES.includes(subCategory as SemanticCategory)) {
      return {
        category: "semantic",
        subCategory: subCategory as keyof SemanticColors,
        variant: parts[2],
      };
    }
  }

  // Pattern 3: status/open/variant (3 parts)
  if (parts.length === 3 && parts[0] === "status") {
    const subCategory = parts[1];
    if (STATUS_CATEGORIES.includes(subCategory as StatusCategory)) {
      return {
        category: "status",
        subCategory: subCategory as keyof StatusColors,
        variant: parts[2],
      };
    }
  }

  // Pattern 4: category/variant (2 parts) - most common
  if (parts.length === 2) {
    const [category, variant] = parts;

    // Direct categories: primary/variant, accent/variant
    if (DIRECT_CATEGORIES.includes(category as DirectCategory)) {
      return {
        category: category as "primary" | "accent",
        variant,
      };
    }

    // Semantic categories: positive/variant, warning/variant, etc.
    if (SEMANTIC_CATEGORIES.includes(category as SemanticCategory)) {
      return {
        category: "semantic",
        subCategory: category as keyof SemanticColors,
        variant,
      };
    }

    // Status categories: done/variant, open/variant, etc.
    if (STATUS_CATEGORIES.includes(category as StatusCategory)) {
      return {
        category: "status",
        subCategory: category as keyof StatusColors,
        variant,
      };
    }
  }

  // Pattern 5: single part - category only (default variant)
  if (parts.length === 1) {
    const category = parts[0];

    if (DIRECT_CATEGORIES.includes(category as DirectCategory)) {
      return {
        category: category as "primary" | "accent",
        variant: "default",
      };
    }

    if (SEMANTIC_CATEGORIES.includes(category as SemanticCategory)) {
      return {
        category: "semantic",
        subCategory: category as keyof SemanticColors,
        variant: "default",
      };
    }

    if (STATUS_CATEGORIES.includes(category as StatusCategory)) {
      return {
        category: "status",
        subCategory: category as keyof StatusColors,
        variant: "default",
      };
    }

    // Try to extract category from concatenated name (e.g., "primarylighter")
    const allCategories = [
      ...DIRECT_CATEGORIES,
      ...SEMANTIC_CATEGORIES,
      ...STATUS_CATEGORIES,
    ];

    for (const cat of allCategories) {
      if (category.startsWith(cat)) {
        const variantPart = category.substring(cat.length);
        if (DIRECT_CATEGORIES.includes(cat as DirectCategory)) {
          return {
            category: cat as "primary" | "accent",
            variant: variantPart || "default",
          };
        }
        // For semantic/status, we'd need the variant part, but it's ambiguous
        // So we default to the category with default variant
        if (SEMANTIC_CATEGORIES.includes(cat as SemanticCategory)) {
          return {
            category: "semantic",
            subCategory: cat as keyof SemanticColors,
            variant: "default",
          };
        }
      }
    }
  }

  return null;
}

