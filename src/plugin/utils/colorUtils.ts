/**
 * Color utility functions for converting between color formats
 */

export const RGB2HEX = (r: number, g: number, b: number): string =>
  "#" +
  ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();

export const rgbToHex = (color: {
  r: number;
  g: number;
  b: number;
}): string => {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  return RGB2HEX(r, g, b);
};

export const isColorValue = (
  value: unknown
): value is { r: number; g: number; b: number } => {
  return (
    value !== null &&
    typeof value === "object" &&
    "r" in value &&
    "g" in value &&
    "b" in value
  );
};

export const createColorData = (
  name: string,
  value: { r: number; g: number; b: number },
  variableId: string,
  mode: string
) => {
  const hex = rgbToHex(value);
  const r = Math.round(value.r * 255);
  const g = Math.round(value.g * 255);
  const b = Math.round(value.b * 255);

  return {
    type: "SOLID" as const,
    name,
    rgb: `rgb(${r}, ${g}, ${b})`,
    rgba: `rgba(${r}, ${g}, ${b}, 1)`,
    hex,
    opacity: 1,
    variableId,
    mode,
  };
};
