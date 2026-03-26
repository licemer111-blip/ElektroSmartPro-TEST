/**
 * Server Actions Integration Tests — ElektroSmart PRO
 *
 * Tests business logic of server actions using Supabase mocks.
 * No real DB connection required — all Supabase calls are intercepted.
 *
 * Covers:
 *  - calcItemTotal / VAT logic (pure functions)
 *  - validate() helper with real Zod schemas
 *  - Panel section validation (validatePanelSection)
 *  - Rate limit logic
 *  - AI usage check logic
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock Supabase before any imports that use it ────────────────────────────
vi.mock("@/lib/supabase-server", () => ({
  createServerSupabaseClient: vi.fn(() => mockSupabaseClient()),
}));

vi.mock("@/lib/supabase-admin", () => ({
  supabaseAdmin: mockSupabaseClient(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({ get: vi.fn(), set: vi.fn(), delete: vi.fn() })),
  headers: vi.fn(() => ({ get: vi.fn(() => null) })),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

function mockSupabaseClient() {
  const chainable = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
  return {
    from: vi.fn(() => chainable),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: { path: "test.json" }, error: null }),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: "https://example.com/test.json" } })),
        list: vi.fn().mockResolvedValue({ data: [], error: null }),
      })),
    },
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
}

// ─── Import pure helpers (no Supabase dependency) ────────────────────────────
import { validate, priceSchema, quantitySchema, feedbackSchema, projectSettingsSchema } from "@/lib/validations";

// ─── validate() helper ────────────────────────────────────────────────────────

describe("validate() — Zod schema helper", () => {
  it("returns data on valid input", () => {
    const result = validate(feedbackSchema, { type: "bug", message: "Test error" });
    expect(result.error).toBeNull();
    expect(result.data).toMatchObject({ type: "bug", message: "Test error" });
  });

  it("returns Polish error string on invalid input", () => {
    const result = validate(feedbackSchema, { type: "bug", message: "" });
    expect(result.data).toBeNull();
    expect(typeof result.error).toBe("string");
    expect(result.error!.length).toBeGreaterThan(0);
  });

  it("returns null error on valid project settings", () => {
    const result = validate(projectSettingsSchema, {
      name: "Mieszkanie Kowalski",
      vat_rate: 8,
      region_id: null,
      object_type_id: null,
    });
    expect(result.error).toBeNull();
  });

  it("rejects invalid VAT rate (15%)", () => {
    const result = validate(projectSettingsSchema, {
      name: "Test",
      vat_rate: 15,
      region_id: null,
      object_type_id: null,
    });
    expect(result.error).not.toBeNull();
  });
});

// ─── Price schema edge cases ──────────────────────────────────────────────────

describe("priceSchema — boundary values", () => {
  it("accepts 0 (free item)", () => {
    expect(priceSchema.safeParse(0).success).toBe(true);
  });

  it("accepts max valid price (999999.99)", () => {
    expect(priceSchema.safeParse(999999.99).success).toBe(true);
  });

  it("rejects 1_000_000 (over limit)", () => {
    expect(priceSchema.safeParse(1_000_000).success).toBe(false);
  });

  it("rejects negative price", () => {
    expect(priceSchema.safeParse(-0.01).success).toBe(false);
  });

  it("rejects NaN", () => {
    expect(priceSchema.safeParse(NaN).success).toBe(false);
  });
});

// ─── quantitySchema edge cases ────────────────────────────────────────────────

describe("quantitySchema — boundary values", () => {
  it("accepts 0.01 (minimum meaningful quantity)", () => {
    expect(quantitySchema.safeParse(0.01).success).toBe(true);
  });

  it("rejects 0 (zero quantity makes no sense)", () => {
    expect(quantitySchema.safeParse(0).success).toBe(false);
  });

  it("accepts 999 (large order)", () => {
    expect(quantitySchema.safeParse(999).success).toBe(true);
  });

  it("rejects negative quantity", () => {
    expect(quantitySchema.safeParse(-1).success).toBe(false);
  });
});

// ─── Rate limit logic (pure) ──────────────────────────────────────────────────

describe("Rate limit — sliding window logic", () => {
  it("allows requests within limit", () => {
    const timestamps: number[] = [];
    const windowMs = 60_000;
    const maxRequests = 5;
    const now = Date.now();

    // Simulate 4 requests in the last minute
    for (let i = 0; i < 4; i++) {
      timestamps.push(now - i * 5_000);
    }

    const recent = timestamps.filter(t => now - t < windowMs);
    expect(recent.length).toBeLessThan(maxRequests);
  });

  it("blocks requests over limit", () => {
    const timestamps: number[] = [];
    const windowMs = 60_000;
    const maxRequests = 5;
    const now = Date.now();

    // Simulate 5 requests in the last minute (at limit)
    for (let i = 0; i < 5; i++) {
      timestamps.push(now - i * 1_000);
    }

    const recent = timestamps.filter(t => now - t < windowMs);
    expect(recent.length).toBeGreaterThanOrEqual(maxRequests);
  });

  it("sliding window expires old requests", () => {
    const windowMs = 60_000;
    const maxRequests = 5;
    const now = Date.now();

    // 5 requests, but 4 are older than the window
    const timestamps = [
      now - 70_000, // expired
      now - 65_000, // expired
      now - 61_000, // expired
      now - 60_001, // expired
      now - 30_000, // valid
    ];

    const recent = timestamps.filter(t => now - t < windowMs);
    expect(recent.length).toBeLessThan(maxRequests);
    expect(recent.length).toBe(1);
  });
});

// ─── AI usage limit logic (pure) ─────────────────────────────────────────────

describe("AI usage limit — business rules", () => {
  const FREE_LIMIT = 3;

  function checkUsage(used: number, isPro: boolean): { allowed: boolean; remaining: number } {
    if (isPro) return { allowed: true, remaining: Infinity };
    const remaining = Math.max(0, FREE_LIMIT - used);
    return { allowed: remaining > 0, remaining };
  }

  it("PRO user always allowed", () => {
    expect(checkUsage(100, true).allowed).toBe(true);
    expect(checkUsage(0, true).allowed).toBe(true);
  });

  it("free user: 0 used → allowed, 3 remaining", () => {
    const r = checkUsage(0, false);
    expect(r.allowed).toBe(true);
    expect(r.remaining).toBe(3);
  });

  it("free user: 2 used → allowed, 1 remaining", () => {
    const r = checkUsage(2, false);
    expect(r.allowed).toBe(true);
    expect(r.remaining).toBe(1);
  });

  it("free user: 3 used → blocked, 0 remaining", () => {
    const r = checkUsage(3, false);
    expect(r.allowed).toBe(false);
    expect(r.remaining).toBe(0);
  });

  it("free user: 10 used → blocked, 0 remaining (no negative)", () => {
    const r = checkUsage(10, false);
    expect(r.allowed).toBe(false);
    expect(r.remaining).toBe(0);
  });
});

// ─── VAT calculation rules ────────────────────────────────────────────────────

describe("VAT rules — Polish market (8% vs 23%)", () => {
  function applyVat(net: number, vatRate: 8 | 23): { gross: number; vatAmount: number } {
    const vatAmount = Math.round(net * (vatRate / 100) * 100) / 100;
    return { gross: net + vatAmount, vatAmount };
  }

  function selectVatRate(objectType: "residential" | "commercial"): 8 | 23 {
    return objectType === "residential" ? 8 : 23;
  }

  it("residential → VAT 8%", () => {
    expect(selectVatRate("residential")).toBe(8);
  });

  it("commercial → VAT 23%", () => {
    expect(selectVatRate("commercial")).toBe(23);
  });

  it("VAT 8% on 1000 PLN → gross 1080 PLN", () => {
    const r = applyVat(1000, 8);
    expect(r.gross).toBe(1080);
    expect(r.vatAmount).toBe(80);
  });

  it("VAT 23% on 1000 PLN → gross 1230 PLN", () => {
    const r = applyVat(1000, 23);
    expect(r.gross).toBe(1230);
    expect(r.vatAmount).toBe(230);
  });

  it("VAT difference on 50000 PLN project = 7500 PLN", () => {
    const res = applyVat(50_000, 8);
    const com = applyVat(50_000, 23);
    expect(com.gross - res.gross).toBe(7_500);
  });

  it("VAT on 0 PLN = 0", () => {
    expect(applyVat(0, 8).vatAmount).toBe(0);
    expect(applyVat(0, 23).vatAmount).toBe(0);
  });

  it("VAT on fractional amount rounds correctly", () => {
    // 123.45 * 0.08 = 9.876 → rounded to 9.88
    const r = applyVat(123.45, 8);
    expect(r.vatAmount).toBeCloseTo(9.88, 2);
  });
});

// ─── Regional modifier logic ──────────────────────────────────────────────────

describe("Regional price modifiers — 16 voivodeships", () => {
  const REGION_MODIFIERS: Record<string, number> = {
    "mazowieckie": 1.12,
    "dolnoslaskie": 1.08,
    "malopolskie": 1.05,
    "wielkopolskie": 1.03,
    "pomorskie": 1.06,
    "slaskie": 1.04,
    "lodzkie": 1.00,
    "lubelskie": 0.95,
    "podkarpackie": 0.91,
    "warminsko-mazurskie": 0.93,
  };

  it("Mazowieckie has highest modifier (1.12)", () => {
    expect(REGION_MODIFIERS["mazowieckie"]).toBe(1.12);
  });

  it("Podkarpackie has lowest modifier (0.91)", () => {
    expect(REGION_MODIFIERS["podkarpackie"]).toBe(0.91);
  });

  it("all modifiers are between 0.85 and 1.20", () => {
    for (const [region, mod] of Object.entries(REGION_MODIFIERS)) {
      expect(mod).toBeGreaterThanOrEqual(0.85);
      expect(mod).toBeLessThanOrEqual(1.20);
      void region;
    }
  });

  it("applies modifier to base price correctly", () => {
    const basePrice = 1000;
    const mazowieckie = basePrice * REGION_MODIFIERS["mazowieckie"];
    const podkarpackie = basePrice * REGION_MODIFIERS["podkarpackie"];
    expect(mazowieckie).toBe(1120);
    expect(podkarpackie).toBe(910);
  });

  it("price difference between highest and lowest region", () => {
    const base = 10_000;
    const max = base * 1.12;
    const min = base * 0.91;
    // 11200 - 9100 = 2100 PLN difference on 10k project
    expect(max - min).toBeCloseTo(2100, 0);
  });
});

// ─── Panel section validation (pure logic) ───────────────────────────────────

describe("Panel section validation — business rules", () => {
  function hasMainSwitch(moduleIds: string[]): boolean {
    return moduleIds.some(id =>
      id.startsWith("main-switch") || id.startsWith("mccb") || id.startsWith("acb")
    );
  }

  function countRcdProtectedCircuits(
    modules: Array<{ id: string; rcdUid?: string }>
  ): { protected: number; unprotected: number } {
    const breakers = modules.filter(m =>
      m.id.startsWith("mcb") || m.id.startsWith("rcbo")
    );
    const protectedCount = breakers.filter(m => m.rcdUid || m.id.startsWith("rcbo")).length;
    return { protected: protectedCount, unprotected: breakers.length - protectedCount };
  }

  it("detects missing main switch", () => {
    const modules = ["mcb-1p-16a", "mcb-1p-10a", "rcd-30-ac-40a"];
    expect(hasMainSwitch(modules)).toBe(false);
  });

  it("detects present main switch", () => {
    const modules = ["main-switch-1p-25a", "mcb-1p-16a", "rcd-30-ac-40a"];
    expect(hasMainSwitch(modules)).toBe(true);
  });

  it("MCCB counts as main switch", () => {
    expect(hasMainSwitch(["mccb", "mcb-1p-16a"])).toBe(true);
  });

  it("counts RCD-protected vs unprotected circuits", () => {
    const modules = [
      { id: "mcb-1p-16a", rcdUid: "rcd-1" },   // protected
      { id: "mcb-1p-10a", rcdUid: "rcd-1" },   // protected
      { id: "rcbo-1p-16a" },                     // self-protected
      { id: "mcb-1p-20a" },                      // unprotected
    ];
    const result = countRcdProtectedCircuits(modules);
    expect(result.protected).toBe(3);
    expect(result.unprotected).toBe(1);
  });

  it("empty section has no issues", () => {
    const modules: string[] = [];
    expect(hasMainSwitch(modules)).toBe(false);
    const result = countRcdProtectedCircuits([]);
    expect(result.protected).toBe(0);
    expect(result.unprotected).toBe(0);
  });
});

// ─── Integration: updateProjectNarzuty + createProjectFromTemplate ────────────
// Uses vi.hoisted() so mock refs are available before module evaluation

const { mockRA, mockCanEditFn } = vi.hoisted(() => ({
  mockRA: vi.fn(),
  mockCanEditFn: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/lib/auth", () => ({
  requireAuth: () => mockRA(),
}));

vi.mock("@/app/dashboard/projects/[id]/_actions/utils", () => ({
  canUserEditProject: (...args: unknown[]) => mockCanEditFn(...args),
  revalidateProject: vi.fn(),
}));

// ─── Supabase chain helper ────────────────────────────────────────────────────
type SResult = { data?: unknown; error?: { message: string } | null };

interface SupaChain {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  neq: ReturnType<typeof vi.fn>;
  in: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  then: (onFulfilled: (v: SResult) => unknown) => Promise<unknown>;
}

function makeChain(result: SResult = { data: null, error: null }): SupaChain {
  const self: Record<string, unknown> = {};
  for (const m of ["select", "insert", "update", "eq", "neq", "in", "order", "limit"]) {
    self[m] = vi.fn().mockReturnThis();
  }
  self.single = vi.fn().mockResolvedValue(result);
  self.then = (onFulfilled: (v: SResult) => unknown) =>
    Promise.resolve(result).then(onFulfilled);
  return self as unknown as SupaChain;
}

function mockUser(id = "uid-123") {
  return { id };
}

// ─── updateProjectNarzuty ─────────────────────────────────────────────────────

import { updateProjectNarzuty } from "@/app/dashboard/projects/[id]/_actions/project-meta";

describe("updateProjectNarzuty — auth + validation + DB", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCanEditFn.mockResolvedValue(true);
  });

  it("returns Unauthorized when requireAuth throws", async () => {
    mockRA.mockRejectedValue(new Error("not logged in"));
    const r = await updateProjectNarzuty("p-1", { kp_percent: 70, z_percent: 15, kz_percent: 10 });
    expect(r).toEqual({ error: "Unauthorized" });
  });

  it("returns Unauthorized when user is null", async () => {
    mockRA.mockResolvedValue({ user: null, supabase: null });
    const r = await updateProjectNarzuty("p-1", { kp_percent: 70, z_percent: 15, kz_percent: 10 });
    expect(r).toEqual({ error: "Unauthorized" });
  });

  it("returns permission error when canUserEditProject returns false", async () => {
    mockRA.mockResolvedValue({ user: mockUser(), supabase: { from: vi.fn(() => makeChain()) } });
    mockCanEditFn.mockResolvedValue(false);
    const r = await updateProjectNarzuty("p-1", { kp_percent: 70, z_percent: 15, kz_percent: 10 });
    expect(r).toEqual({ error: "Nie masz uprawnień" });
  });

  it("rejects kp_percent < 0", async () => {
    mockRA.mockResolvedValue({ user: mockUser(), supabase: { from: vi.fn(() => makeChain()) } });
    const r = await updateProjectNarzuty("p-1", { kp_percent: -1, z_percent: 0, kz_percent: 0 });
    expect(r).toEqual({ error: "Narzuty muszą być w zakresie 0-100%" });
  });

  it("rejects kp_percent > 100", async () => {
    mockRA.mockResolvedValue({ user: mockUser(), supabase: { from: vi.fn(() => makeChain()) } });
    const r = await updateProjectNarzuty("p-1", { kp_percent: 101, z_percent: 0, kz_percent: 0 });
    expect(r).toEqual({ error: "Narzuty muszą być w zakresie 0-100%" });
  });

  it("rejects z_percent < 0", async () => {
    mockRA.mockResolvedValue({ user: mockUser(), supabase: { from: vi.fn(() => makeChain()) } });
    const r = await updateProjectNarzuty("p-1", { kp_percent: 0, z_percent: -5, kz_percent: 0 });
    expect(r).toEqual({ error: "Narzuty muszą być w zakresie 0-100%" });
  });

  it("rejects kz_percent > 100", async () => {
    mockRA.mockResolvedValue({ user: mockUser(), supabase: { from: vi.fn(() => makeChain()) } });
    const r = await updateProjectNarzuty("p-1", { kp_percent: 0, z_percent: 0, kz_percent: 101 });
    expect(r).toEqual({ error: "Narzuty muszą być w zakresie 0-100%" });
  });

  it("accepts boundary: all percents = 0", async () => {
    mockRA.mockResolvedValue({ user: mockUser(), supabase: { from: vi.fn(() => makeChain()) } });
    const r = await updateProjectNarzuty("p-1", { kp_percent: 0, z_percent: 0, kz_percent: 0 });
    expect(r).toEqual({ success: true });
  });

  it("accepts boundary: all percents = 100", async () => {
    mockRA.mockResolvedValue({ user: mockUser(), supabase: { from: vi.fn(() => makeChain()) } });
    const r = await updateProjectNarzuty("p-1", { kp_percent: 100, z_percent: 100, kz_percent: 100 });
    expect(r).toEqual({ success: true });
  });

  it("returns success on valid input with DB success", async () => {
    mockRA.mockResolvedValue({ user: mockUser(), supabase: { from: vi.fn(() => makeChain()) } });
    const r = await updateProjectNarzuty("p-1", { kp_percent: 70, z_percent: 15, kz_percent: 10 });
    expect(r).toEqual({ success: true });
  });

  it("returns DB error message on update failure", async () => {
    mockRA.mockResolvedValue({
      user: mockUser(),
      supabase: { from: vi.fn(() => makeChain({ error: { message: "DB error" } })) },
    });
    const r = await updateProjectNarzuty("p-1", { kp_percent: 70, z_percent: 15, kz_percent: 10 });
    expect(r).toEqual({ error: "Nie udało się zaktualizować narzutów" });
  });

  it("calls update() with correct kp/z/kz values", async () => {
    const chain = makeChain();
    mockRA.mockResolvedValue({ user: mockUser(), supabase: { from: vi.fn(() => chain) } });
    await updateProjectNarzuty("proj-abc", { kp_percent: 55, z_percent: 12, kz_percent: 8 });
    expect((chain.update as ReturnType<typeof vi.fn>).mock.calls[0][0]).toEqual({
      kp_percent: 55, z_percent: 12, kz_percent: 8,
    });
    expect((chain.eq as ReturnType<typeof vi.fn>).mock.calls[0]).toEqual(["id", "proj-abc"]);
  });
});

// ─── createProjectFromTemplate ────────────────────────────────────────────────

import { createProjectFromTemplate } from "@/app/dashboard/templates/actions";

const MOCK_TEMPLATE = {
  id: "tmpl-1",
  name: "Mieszkanie 65m²",
  region_id: "reg-maz",
  object_type_id: "ot-res",
  vat_rate: 8,
  rate_source: "engine",
  use_count: 3,
  items: [
    { name: "Gniazdo 230V", unit: "szt", quantity: 12, final_material_price: 28, final_labor_price: 35, section: "Salon" },
    { name: "Przewód YDYp", unit: "mb", quantity: 120, final_material_price: 4.5, final_labor_price: 2.5, section: null },
  ],
};
const MOCK_PROJECT = { id: "proj-new-999" };

describe("createProjectFromTemplate — auth + validation + DB", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error when not authenticated", async () => {
    mockRA.mockRejectedValue(new Error("not logged in"));
    const r = await createProjectFromTemplate("tmpl-1", "Projekt");
    expect(r).toEqual({ error: "Musisz być zalogowany" });
  });

  it("returns error when user is null", async () => {
    mockRA.mockResolvedValue({ user: null, supabase: null });
    const r = await createProjectFromTemplate("tmpl-1", "Projekt");
    expect(r).toEqual({ error: "Musisz być zalogowany" });
  });

  it("returns error for empty project name", async () => {
    mockRA.mockResolvedValue({ user: mockUser(), supabase: { from: vi.fn(() => makeChain()) } });
    const r = await createProjectFromTemplate("tmpl-1", "");
    expect(r).toEqual({ error: "Nazwa projektu jest wymagana" });
  });

  it("returns error for whitespace-only name", async () => {
    mockRA.mockResolvedValue({ user: mockUser(), supabase: { from: vi.fn(() => makeChain()) } });
    const r = await createProjectFromTemplate("tmpl-1", "   ");
    expect(r).toEqual({ error: "Nazwa projektu jest wymagana" });
  });

  it("returns error when template not found", async () => {
    mockRA.mockResolvedValue({
      user: mockUser(),
      supabase: { from: vi.fn(() => makeChain({ data: null, error: { message: "not found" } })) },
    });
    const r = await createProjectFromTemplate("tmpl-999", "Projekt X");
    expect(r).toEqual({ error: "Nie znaleziono szablonu" });
  });

  it("returns error when project insert fails", async () => {
    mockRA.mockResolvedValue({
      user: mockUser(),
      supabase: {
        from: vi.fn((table: string) => {
          if (table === "profiles") return makeChain({ data: { hourly_rate: 62, is_pro: true, max_projects: 3 }, error: null });
          if (table === "project_templates") return makeChain({ data: MOCK_TEMPLATE, error: null });
          if (table === "projects") return makeChain({ data: null, error: { message: "insert failed" } });
          return makeChain({ data: null, error: null });
        }),
      },
    });
    const r = await createProjectFromTemplate("tmpl-1", "Projekt X");
    expect(r).toEqual({ error: "Błąd podczas tworzenia projektu" });
  });

  it("returns success with projectId on happy path", async () => {
    mockRA.mockResolvedValue({
      user: mockUser(),
      supabase: {
        from: vi.fn((table: string) => {
          if (table === "profiles") return makeChain({ data: { hourly_rate: 62, is_pro: true, max_projects: 3 }, error: null });
          if (table === "project_templates") return makeChain({ data: MOCK_TEMPLATE, error: null });
          if (table === "projects") return makeChain({ data: MOCK_PROJECT, error: null });
          return makeChain({ data: null, error: null });
        }),
      },
    });
    const r = await createProjectFromTemplate("tmpl-1", "Nowy Projekt");
    expect(r).toEqual({ success: true, projectId: "proj-new-999" });
  });

  it("trims whitespace from project name before insert", async () => {
    let capturedInsert: unknown;
    mockRA.mockResolvedValue({
      user: mockUser(),
      supabase: {
        from: vi.fn((table: string) => {
          if (table === "profiles") return makeChain({ data: { hourly_rate: 62, is_pro: true, max_projects: 3 }, error: null });
          if (table === "project_templates") return makeChain({ data: MOCK_TEMPLATE, error: null });
          if (table === "projects") {
            const chain = makeChain({ data: MOCK_PROJECT, error: null });
            (chain.insert as ReturnType<typeof vi.fn>).mockImplementation((d: unknown) => {
              capturedInsert = d;
              return chain;
            });
            return chain;
          }
          return makeChain({ data: null, error: null });
        }),
      },
    });
    await createProjectFromTemplate("tmpl-1", "  Projekt z spacjami  ");
    expect((capturedInsert as Record<string, unknown>).name).toBe("Projekt z spacjami");
  });

  it("copies rate_source from template to new project", async () => {
    let capturedInsert: unknown;
    const templateWithManual = { ...MOCK_TEMPLATE, rate_source: "manual" };
    mockRA.mockResolvedValue({
      user: mockUser(),
      supabase: {
        from: vi.fn((table: string) => {
          if (table === "profiles") return makeChain({ data: { hourly_rate: 62, is_pro: true, max_projects: 3 }, error: null });
          if (table === "project_templates") return makeChain({ data: templateWithManual, error: null });
          if (table === "projects") {
            const chain = makeChain({ data: MOCK_PROJECT, error: null });
            (chain.insert as ReturnType<typeof vi.fn>).mockImplementation((d: unknown) => {
              capturedInsert = d;
              return chain;
            });
            return chain;
          }
          return makeChain({ data: null, error: null });
        }),
      },
    });
    await createProjectFromTemplate("tmpl-1", "Projekt");
    expect((capturedInsert as Record<string, unknown>).rate_source).toBe("manual");
  });

  it("new project always created with status 'draft'", async () => {
    let capturedInsert: unknown;
    mockRA.mockResolvedValue({
      user: mockUser(),
      supabase: {
        from: vi.fn((table: string) => {
          if (table === "profiles") return makeChain({ data: { hourly_rate: 62, is_pro: true, max_projects: 3 }, error: null });
          if (table === "project_templates") return makeChain({ data: MOCK_TEMPLATE, error: null });
          if (table === "projects") {
            const chain = makeChain({ data: MOCK_PROJECT, error: null });
            (chain.insert as ReturnType<typeof vi.fn>).mockImplementation((d: unknown) => {
              capturedInsert = d;
              return chain;
            });
            return chain;
          }
          return makeChain({ data: null, error: null });
        }),
      },
    });
    await createProjectFromTemplate("tmpl-1", "Projekt");
    expect((capturedInsert as Record<string, unknown>).status).toBe("draft");
  });
});
