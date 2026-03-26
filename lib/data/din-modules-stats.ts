import { DIN_MODULES } from "./din-modules-catalog";

export const DIN_MODULES_COUNT = DIN_MODULES.length;
export const DIN_MODULES_CATEGORIES = [...new Set(DIN_MODULES.map((m) => m.category as string))].length;
