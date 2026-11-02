import { describe, expect, it } from "vitest";
import { parseTableOrText } from "@/lib/project-import-utils";

describe("pasted estimate list", () => {
  it("reads quantity and unit and leaves prices empty", () => {
    const items = parseTableOrText(
      [
        "12 szt Gniazdo podwójne z uziemieniem",
        "8 szt Łącznik schodowy",
        "50 mb Przewód YDYp 3x2,5",
        "3 szt Wyłącznik nadprądowy B16",
      ].join("\n"),
    );

    expect(items).toEqual([
      { name: "Gniazdo podwójne z uziemieniem", unit: "szt", quantity: 12, material_price: 0, labor_price: 0 },
      { name: "Łącznik schodowy", unit: "szt", quantity: 8, material_price: 0, labor_price: 0 },
      { name: "Przewód YDYp 3x2,5", unit: "mb", quantity: 50, material_price: 0, labor_price: 0 },
      { name: "Wyłącznik nadprądowy B16", unit: "szt", quantity: 3, material_price: 0, labor_price: 0 },
    ]);
  });
});
