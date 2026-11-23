import { describe, expect, it } from "vitest";
import { isColumnLabel, parseTableOrText, smartParseExcel, splitImportGrid } from "@/lib/project-import-utils";

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

  it("does not import a column title as a work item", () => {
    expect(isColumnLabel("Opis pozycji / Materiał")).toBe(true);
    const items = parseTableOrText(
      ["Opis pozycji / Materiał", "12 szt Gniazdo podwójne"].join("\n"),
    );
    expect(items.map((item) => item.name)).toEqual(["Gniazdo podwójne"]);
  });

  it("skips a repeated header under the sheet title", () => {
    const grid = [
      ["Kosztorys instalacji"],
      ["Lp", "Opis pozycji / Materiał", "j.m.", "Ilość"],
      ["1", "Gniazdo pojedyncze", "szt", "12"],
      ["Lp", "Opis pozycji / Materiał", "j.m.", "Ilość"],
    ];
    const { headers, data } = splitImportGrid(grid);
    const rows = smartParseExcel(headers, data);
    expect(rows.map((row) => row.name)).toEqual(["Gniazdo pojedyncze"]);
  });

  it("keeps chapter titles as sections and skips totals", () => {
    const grid = [
      ["KOSZTORYS PRAC I MATERIAŁÓW"],
      ["Lp.", "Opis pozycji / Materiał", "Ilość", "Cena jedn. (zł)", "Wartość (zł)"],
      ["MONTAŻ I PODŁĄCZENIE URZĄDZEŃ DALI", "", "", "", ""],
      ["1", "PRZYCISK ŚCIENNY ANTUMBRA", "18", "", "0"],
      ["4", "MODUŁ OPRAW E27", "13", "", "0"],
      ["RAZEM (MONTAŻ I PODŁĄCZENIE URZĄDZEŃ DALI)", "", "", "", "0"],
      ["ODDYMIANIE", "", "", "", ""],
      ["6", "PRZEWÓD NHXH-J FE180/E90 3x1,5", "400", "", "0"],
      ["", "   * w cenie uwzględniona cena za montaż tras na OZ", "", "", ""],
      ["RAZEM (ODDYMIANIE)", "", "", "", "0"],
      ["SUMA CAŁKOWITA (ŁĄCZNIE)", "", "", "", "0"],
    ];
    const { headers, data } = splitImportGrid(grid);
    const rows = smartParseExcel(headers, data);
    expect(rows.map((row) => `${row.section} | ${row.name} | ${row.quantity}`)).toEqual([
      "MONTAŻ I PODŁĄCZENIE URZĄDZEŃ DALI | PRZYCISK ŚCIENNY ANTUMBRA | 18",
      "MONTAŻ I PODŁĄCZENIE URZĄDZEŃ DALI | MODUŁ OPRAW E27 | 13",
      "ODDYMIANIE | PRZEWÓD NHXH-J FE180/E90 3x1,5 | 400",
    ]);
  });
});
