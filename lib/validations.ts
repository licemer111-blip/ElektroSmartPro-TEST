/**
 * Zod validation schemas for ElektroSmart PRO server actions.
 * 
 * Usage in server actions:
 *   import { projectSettingsSchema, feedbackSchema } from "@/lib/validations";
 *   
 *   export async function updateProjectSettings(input: unknown) {
 *     const parsed = projectSettingsSchema.safeParse(input);
 *     if (!parsed.success) return { error: parsed.error.issues[0].message };
 *     // use parsed.data safely
 *   }
 */

import { z } from "zod";

// ============================================
// COMMON SCHEMAS
// ============================================

/** UUID format validation */
export const uuidSchema = z.string().uuid("Nieprawidłowy identyfikator");

/** Polish NIP validation (10 digits, optional dashes) */
export const nipSchema = z
  .string()
  .transform((val) => val.replace(/[-\s]/g, ""))
  .pipe(z.string().regex(/^\d{10}$/, "NIP musi mieć 10 cyfr"))
  .optional()
  .or(z.literal(""))
  .or(z.literal(null));

/** Email validation */
export const emailSchema = z
  .string()
  .email("Nieprawidłowy adres email")
  .max(255, "Email jest za długi");

/** Non-empty string */
export const requiredString = (field: string) =>
  z.string().min(1, `${field} jest wymagane`).max(500, `${field} jest za długie`);

/** Price field (non-negative number) */
export const priceSchema = z
  .number()
  .min(0, "Cena nie może być ujemna")
  .max(999999.99, "Cena jest za wysoka");

/** Hourly rate (PLN/rbh) — must be positive, realistic range */
export const hourlyRateSchema = z
  .number()
  .min(1, "Stawka godzinowa musi być większa od 0")
  .max(2000, "Stawka godzinowa jest za wysoka (max 2000 PLN/rbh)");

/** Quantity field (positive number) */
export const quantitySchema = z
  .number()
  .min(0.01, "Ilość musi być większa od 0")
  .max(999999, "Ilość jest za duża");

/** Common unit presets (for UI dropdowns / datalists) */
export const UNIT_PRESETS = ["szt", "mb", "m2", "m3", "kpl", "godz", "kg", "op", "h", "pom"] as const;

/** Unit type — accepts any non-empty string (AI imports may use custom units) */
export const unitSchema = z
  .string()
  .min(1, "Jednostka jest wymagana")
  .max(20, "Jednostka jest za długa");

// ============================================
// PROJECT SCHEMAS
// ============================================

export const projectSettingsSchema = z.object({
  name: requiredString("Nazwa projektu"),
  vat_rate: z.number().refine((v) => v === 8 || v === 23, {
    message: "Stawka VAT musi wynosić 8% lub 23%",
  }),
  region_id: uuidSchema.nullable(),
  object_type_id: uuidSchema.nullable(),
});

export const projectItemUpdateSchema = z.object({
  name: z.string().min(1).max(500).optional(),
  quantity: quantitySchema.optional(),
  unit: unitSchema.optional(),
  final_material_price: priceSchema.optional(),
  final_labor_price: priceSchema.optional(),
  section: z.string().max(100).nullable().optional(),
  confidence_level: z.enum(["verified", "analog", "estimated", "uncertain", "manual"]).nullable().optional(),
  labor_norm: z.number().min(0).nullable().optional(),
  knr_code: z.string().max(100).nullable().optional(),
});

export const clientDataSchema = z.object({
  client_name: z.string().max(200).nullable().optional(),
  client_address: z.string().max(500).nullable().optional(),
  client_nip: nipSchema,
});

export const importItemSchema = z.object({
  name: requiredString("Nazwa pozycji"),
  unit: z.string().min(1, "Jednostka jest wymagana"),
  quantity: quantitySchema,
  material_price: priceSchema,
  labor_price: priceSchema,
});

export const importItemsSchema = z.array(importItemSchema).min(1, "Wymagana co najmniej jedna pozycja");

// ============================================
// CATALOG SCHEMAS
// ============================================

export const catalogItemSchema = z.object({
  name: requiredString("Nazwa pozycji"),
  unit: z.string().min(1, "Jednostka jest wymagana"),
  base_labor_price: priceSchema,
  base_material_price: priceSchema,
  category_id: z.string().optional(),
  visibility: z.enum(["personal", "team"]).optional(),
  team_id: uuidSchema.optional(),
});

export const catalogItemUpdateSchema = z.object({
  name: requiredString("Nazwa pozycji"),
  unit: z.string().min(1, "Jednostka jest wymagana"),
  base_labor_price: priceSchema,
  base_material_price: priceSchema,
  category_id: z.string().optional(),
});

// ============================================
// ASSEMBLY SCHEMAS
// ============================================

export const assemblyItemSchema = z.object({
  name: requiredString("Nazwa elementu"),
  unit: z.string().min(1),
  type: z.enum(["material", "labor"]),
  price: priceSchema,
  quantity: quantitySchema,
});

export const createAssemblySchema = z.object({
  name: requiredString("Nazwa zestawu"),
  description: z.string().max(1000).optional(),
  category_id: z.string().nullable().optional(),
  building_type: z.string().nullable().optional(),
  items: z.array(assemblyItemSchema).min(1, "Zestaw musi mieć co najmniej jeden element"),
  visibility: z.enum(["personal", "team"]).optional(),
  team_id: uuidSchema.optional(),
});

export const updateAssemblySchema = z.object({
  name: requiredString("Nazwa zestawu").optional(),
  description: z.string().max(1000).optional(),
  category_id: z.string().nullable().optional(),
  building_type: z.string().nullable().optional(),
  items: z.array(assemblyItemSchema).optional(),
  visibility: z.enum(["personal", "team"]).optional(),
  team_id: uuidSchema.optional(),
});

// ============================================
// PROFILE / SETTINGS SCHEMAS
// ============================================

export const profileSchema = z.object({
  company_name: z.string().max(200).optional(),
  nip: nipSchema,
  regon: z.string().max(14).optional(),
  address: z.string().max(500).optional(),
  street: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  postal_code: z
    .string()
    .regex(/^\d{2}-\d{3}$/, "Kod pocztowy w formacie XX-XXX")
    .optional()
    .or(z.literal("")),
  phone: z.string().max(20).optional(),
  email: emailSchema.optional().or(z.literal("")),
  bank_account: z.string().max(50).optional(),
  logo_url: z.string().url().optional().or(z.literal("")).or(z.literal(null)),
  hourly_rate: hourlyRateSchema.optional(),
  use_custom_rates: z.boolean().optional(),
  custom_labor_rate: z.number().min(0).max(9999).nullable().optional(),
});

// ============================================
// TEAM SCHEMAS
// ============================================

export const teamUpdateSchema = z.object({
  name: z.string().min(1, "Nazwa zespołu jest wymagana").max(100).optional(),
  description: z.string().max(500).optional(),
});

export const teamInviteSchema = z.object({
  email: emailSchema,
  role: z.enum(["admin", "kierownik", "elektryk"], {
    error: "Nieprawidłowa rola",
  }),
});

// ============================================
// FEEDBACK SCHEMAS
// ============================================

export const feedbackSchema = z.object({
  type: z.enum(["bug", "feature", "contact"], {
    error: "Nieprawidłowy typ wiadomości",
  }),
  message: z
    .string()
    .min(1, "Wiadomość nie może być pusta")
    .max(5000, "Wiadomość jest za długa (max 5000 znaków)"),
  contactEmail: emailSchema.optional().or(z.literal("")),
  metadata: z.record(z.string(), z.string()).optional(),
});

// ============================================
// INVOICE SCHEMAS
// ============================================

export const createInvoiceSchema = z.object({
  projectId: uuidSchema,
  clientName: requiredString("Nazwa klienta"),
  clientNip: nipSchema,
  clientAddress: z.string().max(500).optional(),
  clientCity: z.string().max(100).optional(),
  clientPostalCode: z
    .string()
    .regex(/^\d{2}-\d{3}$/, "Kod pocztowy w formacie XX-XXX")
    .optional()
    .or(z.literal("")),
  clientEmail: emailSchema.optional().or(z.literal("")),
  paymentDays: z.number().min(1).max(365).optional(),
  paymentMethod: z.enum(["transfer", "cash", "card"]).optional(),
  notes: z.string().max(2000).optional(),
  vatRate: z.number().min(0).max(100).optional(),
  status: z.enum(["draft", "sent"]).optional(),
});

// ============================================
// TEMPLATE SCHEMAS
// ============================================

export const templateUpdateSchema = z.object({
  name: requiredString("Nazwa szablonu").optional(),
  description: z.string().max(1000).optional(),
});

// ============================================
// HELPER: Safe parse with Polish error message
// ============================================

/**
 * Validate input with a Zod schema and return a formatted error string if invalid.
 * 
 * Usage:
 *   const { data, error } = validate(feedbackSchema, rawInput);
 *   if (error) return { error };
 *   // data is typed and safe
 */
export function validate<T>(
  schema: z.ZodType<T>,
  input: unknown
): { data: T; error: null } | { data: null; error: string } {
  const result = schema.safeParse(input);
  if (result.success) {
    return { data: result.data, error: null };
  }
  const firstIssue = result.error.issues[0];
  return { data: null, error: firstIssue.message };
}

// Type exports for use in components
export type ProjectSettings = z.infer<typeof projectSettingsSchema>;
export type CatalogItemInput = z.infer<typeof catalogItemSchema>;
export type CreateAssemblyInput = z.infer<typeof createAssemblySchema>;
export type FeedbackInput = z.infer<typeof feedbackSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type TeamInviteInput = z.infer<typeof teamInviteSchema>;
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
