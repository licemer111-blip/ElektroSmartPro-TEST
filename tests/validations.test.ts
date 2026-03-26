import { describe, it, expect } from "vitest";
import {
  validate,
  projectSettingsSchema,
  projectItemUpdateSchema,
  clientDataSchema,
  catalogItemSchema,
  catalogItemUpdateSchema,
  createAssemblySchema,
  profileSchema,
  teamInviteSchema,
  feedbackSchema,
  createInvoiceSchema,
  importItemSchema,
  importItemsSchema,
  uuidSchema,
  nipSchema,
  emailSchema,
  priceSchema,
  quantitySchema,
  unitSchema,
} from "@/lib/validations";

// ============================================
// COMMON SCHEMAS
// ============================================

describe("uuidSchema", () => {
  it("accepts valid UUIDs", () => {
    expect(uuidSchema.safeParse("550e8400-e29b-41d4-a716-446655440000").success).toBe(true);
  });
  it("rejects invalid UUIDs", () => {
    expect(uuidSchema.safeParse("not-a-uuid").success).toBe(false);
    expect(uuidSchema.safeParse("").success).toBe(false);
  });
});

describe("emailSchema", () => {
  it("accepts valid emails", () => {
    expect(emailSchema.safeParse("test@example.com").success).toBe(true);
    expect(emailSchema.safeParse("jan.kowalski@firma.pl").success).toBe(true);
  });
  it("rejects invalid emails", () => {
    expect(emailSchema.safeParse("not-an-email").success).toBe(false);
    expect(emailSchema.safeParse("").success).toBe(false);
  });
});

describe("priceSchema", () => {
  it("accepts valid prices", () => {
    expect(priceSchema.safeParse(0).success).toBe(true);
    expect(priceSchema.safeParse(99.99).success).toBe(true);
    expect(priceSchema.safeParse(999999.99).success).toBe(true);
  });
  it("rejects negative prices", () => {
    expect(priceSchema.safeParse(-1).success).toBe(false);
  });
  it("rejects too high prices", () => {
    expect(priceSchema.safeParse(1000000).success).toBe(false);
  });
});

describe("quantitySchema", () => {
  it("accepts valid quantities", () => {
    expect(quantitySchema.safeParse(1).success).toBe(true);
    expect(quantitySchema.safeParse(0.5).success).toBe(true);
    expect(quantitySchema.safeParse(100).success).toBe(true);
  });
  it("rejects zero", () => {
    expect(quantitySchema.safeParse(0).success).toBe(false);
  });
  it("rejects negative", () => {
    expect(quantitySchema.safeParse(-1).success).toBe(false);
  });
});

describe("unitSchema", () => {
  it("accepts preset units", () => {
    const validUnits = ["szt", "mb", "m2", "m3", "kpl", "godz", "kg", "op"];
    validUnits.forEach((u) => {
      expect(unitSchema.safeParse(u).success).toBe(true);
    });
  });
  it("accepts custom units from AI imports", () => {
    expect(unitSchema.safeParse("pom").success).toBe(true);
    expect(unitSchema.safeParse("szt.").success).toBe(true);
    expect(unitSchema.safeParse("piece").success).toBe(true);
    expect(unitSchema.safeParse("h").success).toBe(true);
  });
  it("rejects empty or too-long units", () => {
    expect(unitSchema.safeParse("").success).toBe(false);
    expect(unitSchema.safeParse("a".repeat(21)).success).toBe(false);
  });
});

// ============================================
// PROJECT SCHEMAS
// ============================================

describe("projectSettingsSchema", () => {
  it("accepts valid project settings", () => {
    const result = projectSettingsSchema.safeParse({
      name: "Mieszkanie na Mokotowie",
      vat_rate: 8,
      region_id: "550e8400-e29b-41d4-a716-446655440000",
      object_type_id: null,
    });
    expect(result.success).toBe(true);
  });

  it("accepts 23% VAT", () => {
    const result = projectSettingsSchema.safeParse({
      name: "Biurowiec",
      vat_rate: 23,
      region_id: null,
      object_type_id: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = projectSettingsSchema.safeParse({
      name: "",
      vat_rate: 8,
      region_id: null,
      object_type_id: null,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid VAT rate", () => {
    const result = projectSettingsSchema.safeParse({
      name: "Test",
      vat_rate: 15,
      region_id: null,
      object_type_id: null,
    });
    expect(result.success).toBe(false);
  });
});

describe("projectItemUpdateSchema", () => {
  it("accepts partial update", () => {
    expect(projectItemUpdateSchema.safeParse({ quantity: 5 }).success).toBe(true);
    expect(projectItemUpdateSchema.safeParse({ name: "Kabel YDY 3x2.5" }).success).toBe(true);
  });

  it("accepts full update", () => {
    expect(
      projectItemUpdateSchema.safeParse({
        name: "Kabel",
        quantity: 10,
        unit: "mb",
        final_material_price: 5.5,
        final_labor_price: 12.0,
      }).success
    ).toBe(true);
  });

  it("rejects negative prices", () => {
    expect(projectItemUpdateSchema.safeParse({ final_material_price: -5 }).success).toBe(false);
  });
});

describe("clientDataSchema", () => {
  it("accepts valid client data", () => {
    expect(
      clientDataSchema.safeParse({
        client_name: "Jan Kowalski",
        client_address: "ul. Kwiatowa 5",
        client_nip: "1234567890",
      }).success
    ).toBe(true);
  });

  it("accepts NIP with dashes", () => {
    const result = clientDataSchema.safeParse({
      client_name: "Firma",
      client_nip: "123-456-78-90",
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty/null fields", () => {
    expect(clientDataSchema.safeParse({}).success).toBe(true);
  });
});

// ============================================
// CATALOG SCHEMAS
// ============================================

describe("catalogItemSchema", () => {
  it("accepts valid catalog item", () => {
    expect(
      catalogItemSchema.safeParse({
        name: "Puszka podtynkowa Ø60",
        unit: "szt",
        base_labor_price: 8,
        base_material_price: 2.5,
      }).success
    ).toBe(true);
  });

  it("rejects empty name", () => {
    expect(
      catalogItemSchema.safeParse({
        name: "",
        unit: "szt",
        base_labor_price: 8,
        base_material_price: 2.5,
      }).success
    ).toBe(false);
  });
});

// ============================================
// ASSEMBLY SCHEMAS
// ============================================

describe("createAssemblySchema", () => {
  it("accepts valid assembly", () => {
    expect(
      createAssemblySchema.safeParse({
        name: "Punkt gniazdka",
        items: [
          { name: "Puszka", unit: "szt", type: "material", price: 3, quantity: 1 },
          { name: "Montaż", unit: "szt", type: "labor", price: 25, quantity: 1 },
        ],
      }).success
    ).toBe(true);
  });

  it("rejects empty items array", () => {
    expect(
      createAssemblySchema.safeParse({
        name: "Pusty zestaw",
        items: [],
      }).success
    ).toBe(false);
  });

  it("rejects invalid item type", () => {
    expect(
      createAssemblySchema.safeParse({
        name: "Test",
        items: [{ name: "X", unit: "szt", type: "invalid", price: 1, quantity: 1 }],
      }).success
    ).toBe(false);
  });
});

// ============================================
// PROFILE SCHEMAS
// ============================================

describe("profileSchema", () => {
  it("accepts valid profile", () => {
    expect(
      profileSchema.safeParse({
        company_name: "ElektroBud Sp. z o.o.",
        nip: "1234567890",
        city: "Warszawa",
        postal_code: "00-001",
        email: "firma@elektrobud.pl",
      }).success
    ).toBe(true);
  });

  it("rejects invalid postal code", () => {
    expect(
      profileSchema.safeParse({
        postal_code: "12345",
      }).success
    ).toBe(false);
  });

  it("accepts empty profile", () => {
    expect(profileSchema.safeParse({}).success).toBe(true);
  });
});

// ============================================
// TEAM SCHEMAS
// ============================================

describe("teamInviteSchema", () => {
  it("accepts valid invite", () => {
    expect(
      teamInviteSchema.safeParse({
        email: "jan@firma.pl",
        role: "elektryk",
      }).success
    ).toBe(true);
  });

  it("rejects invalid role", () => {
    expect(
      teamInviteSchema.safeParse({
        email: "jan@firma.pl",
        role: "superadmin",
      }).success
    ).toBe(false);
  });
});

// ============================================
// FEEDBACK SCHEMAS
// ============================================

describe("feedbackSchema", () => {
  it("accepts valid feedback", () => {
    expect(
      feedbackSchema.safeParse({
        type: "bug",
        message: "Nie działa eksport PDF",
      }).success
    ).toBe(true);
  });

  it("rejects empty message", () => {
    expect(
      feedbackSchema.safeParse({
        type: "bug",
        message: "",
      }).success
    ).toBe(false);
  });

  it("rejects too long message", () => {
    expect(
      feedbackSchema.safeParse({
        type: "feature",
        message: "x".repeat(5001),
      }).success
    ).toBe(false);
  });
});

// ============================================
// INVOICE SCHEMAS
// ============================================

describe("createInvoiceSchema", () => {
  it("accepts valid invoice", () => {
    expect(
      createInvoiceSchema.safeParse({
        projectId: "550e8400-e29b-41d4-a716-446655440000",
        clientName: "Jan Kowalski",
        clientNip: "1234567890",
        paymentDays: 14,
        paymentMethod: "transfer",
      }).success
    ).toBe(true);
  });

  it("rejects missing project ID", () => {
    expect(
      createInvoiceSchema.safeParse({
        clientName: "Jan Kowalski",
      }).success
    ).toBe(false);
  });
});

// ============================================
// IMPORT SCHEMAS
// ============================================

describe("importItemsSchema", () => {
  it("accepts valid import items", () => {
    expect(
      importItemsSchema.safeParse([
        { name: "Kabel YDY", unit: "mb", quantity: 100, material_price: 5, labor_price: 10 },
      ]).success
    ).toBe(true);
  });

  it("rejects empty array", () => {
    expect(importItemsSchema.safeParse([]).success).toBe(false);
  });
});

// ============================================
// VALIDATE HELPER
// ============================================

describe("validate helper", () => {
  it("returns data on success", () => {
    const result = validate(feedbackSchema, { type: "bug", message: "Test" });
    expect(result.error).toBeNull();
    expect(result.data).toEqual({ type: "bug", message: "Test" });
  });

  it("returns Polish error message on failure", () => {
    const result = validate(feedbackSchema, { type: "bug", message: "" });
    expect(result.data).toBeNull();
    expect(result.error).toBeTruthy();
    expect(typeof result.error).toBe("string");
  });

  it("returns first error message only", () => {
    const result = validate(projectSettingsSchema, {});
    expect(result.data).toBeNull();
    expect(result.error).toBeTruthy();
  });
});
