import { GetColorName } from "hex-color-to-color-name";
import { capitilizeFirstLetter } from "./capitilizeFirstLetter";

export function getColorName(hexValue: string, whiteLabelName: string): string {
  const colorName = GetColorName(hexValue);
  // Convert whiteLabelName to start with lowercase
  const lowerCaseWhiteLabelName =
    whiteLabelName.charAt(0).toLowerCase() + whiteLabelName.slice(1);
  // Keep the color name capitalized for camelCase
  const capitalizedColorName = capitilizeFirstLetter(colorName);
  return `${lowerCaseWhiteLabelName}${capitalizedColorName}`;
}
