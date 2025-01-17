import { GetColorName } from "hex-color-to-color-name";
import { capitilizeFirstLetter } from "./capitilizeFirstLetter";

export function getColorName(hexValue: string, whiteLabelName: string): string {
  const colorName = GetColorName(hexValue);
  return `${whiteLabelName}${capitilizeFirstLetter(colorName)}`;
}
