"use server";

import type { SemanticIntent, SemanticProfile } from "@/lib/services/semantic-classifier";
import type { ResolvedMaterialBill } from "@/lib/services/materials-catalog";

export interface ItemMaterialBill {
  itemId: string;
  itemName: string;
  itemQty: number;
  intent: SemanticIntent;
  profile: SemanticProfile;
  bill: ResolvedMaterialBill;
}

export interface MaterialBrainResult {
  bills: ItemMaterialBill[];
  totalNet: number;
  totalGross: number;
  error?: string;
}

export interface SaveMaterialItem {
  name: string;
  slug: string;
  unit: string;
  qtyRaw: number;
  qtyDiscrete: number;
  basePrice: number;
  wasteFactor: number;
  marginPct: number;
  vatRate: number;
  totalNet: number;
  totalGross: number;
  calcLog: string;
  displayHint?: string;
}

export interface SaveMaterialsResult {
  success: boolean;
  saved: number;
  error?: string;
}

/** Material kits are not guessed. The estimate only keeps rows the electrician wrote. */
export async function getMaterialBillForProject(
  projectId: string
): Promise<MaterialBrainResult> {
  void projectId;
  return { bills: [], totalNet: 0, totalGross: 0 };
}

export async function saveProjectMaterials(
  projectId: string,
  laborItemId: string,
  items: SaveMaterialItem[]
): Promise<SaveMaterialsResult> {
  void projectId;
  void laborItemId;
  void items;
  return {
    success: false,
    saved: 0,
    error: "Automatyczny komplet materiałów jest wyłączony. Dopisz pozycję z cennika.",
  };
}

export async function revalidateProjectMaterialsPage(projectId: string): Promise<void> {
  void projectId;
}
