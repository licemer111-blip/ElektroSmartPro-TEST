"use server";

import { revalidatePath } from "next/cache";
import { tryAuth } from "@/lib/auth";
import { getInFaktAPI, calculateVAT, calculateGross } from "@/lib/infakt-api";
import { createInvoiceSchema, validate } from "@/lib/validations";
import { logger } from "@/lib/logger";

interface CreateProjectInvoiceInput {
  projectId: string;
  clientName: string;
  clientNip?: string;
  clientAddress?: string;
  clientCity?: string;
  clientPostalCode?: string;
  clientEmail?: string;
  paymentDays?: number;
  paymentMethod?: "transfer" | "cash" | "card";
  notes?: string;
  vatRate?: number;
  status?: "draft" | "sent";
}

interface ProjectItemRow {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  final_material_price?: number | null;
  final_labor_price?: number | null;
  material_price?: number | null;
  labor_price?: number | null;
  is_lump_sum?: boolean | null;
  is_assembly_child?: boolean | null;
  parent_assembly_id?: string | null;
  confidence_level?: string | null;
  is_investor_material?: boolean | null;
}

export async function createProjectInvoice(input: CreateProjectInvoiceInput) {
  try {
    const { error: validationError } = validate(createInvoiceSchema, input);
    if (validationError) return { success: false, error: validationError };

    const { user, supabase } = await tryAuth();
    if (!user || !supabase) return { success: false, error: "Musisz być zalogowany" };

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select(`*, regions(price_modifier), project_items ( id, name, quantity, unit, material_price, labor_price, final_material_price, final_labor_price, is_lump_sum, is_assembly_child, parent_assembly_id, confidence_level, is_investor_material )`)
      .eq("id", input.projectId)
      .eq("user_id", user.id)
      .single();

    if (projectError || !project) return { success: false, error: "Nie znaleziono projektu" };

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_name, nip, street, city, postal_code, bank_account, infakt_api_key")
      .eq("id", user.id)
      .single();

    if (!profile || !profile.nip) {
      return { success: false, error: "Uzupełnij dane firmy w Ustawieniach (NIP wymagany)" };
    }
    if (!profile.infakt_api_key) {
      return { success: false, error: "Skonfiguruj swój klucz API InFakt w Ustawieniach → Faktury" };
    }

    const priced = project as {
      vat_rate?: number | null;
      adjustment_percentage?: number | null;
      mat_markup_pct?: number | null;
      lab_markup_pct?: number | null;
      complexity_factor?: number | null;
      materials_owned_by_customer?: boolean | null;
      regions?: { price_modifier?: number | null } | { price_modifier?: number | null }[] | null;
      project_items?: ProjectItemRow[] | null;
    };
    const vatRate = input.vatRate === 8 || input.vatRate === 23
      ? input.vatRate
      : (Number(priced.vat_rate) === 8 ? 8 : 23);
    const regionJoin = priced.regions;
    const regionModifier = Number(Array.isArray(regionJoin) ? regionJoin[0]?.price_modifier : regionJoin?.price_modifier) || 1;
    const adjustment = 1 + (Number(priced.adjustment_percentage) || 0) / 100;
    const matMarkup = 1 + (Number(priced.mat_markup_pct) || 0) / 100;
    const labMarkup = 1 + (Number(priced.lab_markup_pct) || 0) / 100;
    const complexity = Number(priced.complexity_factor) || 1;
    const materialsOwned = priced.materials_owned_by_customer === true;
    const rows = priced.project_items || [];
    const parentIds = new Set(
      rows.filter((row) => row.is_assembly_child).map((row) => row.parent_assembly_id).filter(Boolean),
    );

    let totalNet = 0;
    const invoiceItems = rows.flatMap((item) => {
      if (parentIds.has(item.id)) return [];
      const qty = item.is_lump_sum ? 1 : Number(item.quantity) || 0;
      if (qty <= 0) return [];
      const manual = item.confidence_level === "manual";
      const region = manual ? 1 : regionModifier;
      const material = materialsOwned || item.is_investor_material
        ? 0
        : Number(item.final_material_price ?? item.material_price) || 0;
      const labor = Number(item.final_labor_price ?? item.labor_price) || 0;
      const unitNet = material * matMarkup * adjustment + labor * region * labMarkup * complexity * adjustment;
      const lineNet = Math.round(unitNet * qty * 100) / 100;
      if (lineNet <= 0) return [];
      totalNet += lineNet;
      return [{
        name: item.name,
        quantity: qty,
        unit: item.unit,
        net_price: Math.round((lineNet / qty) * 100) / 100,
        tax_rate: vatRate,
      }];
    });

    if (invoiceItems.length === 0) {
      return { success: false, error: "Kosztorys nie ma pozycji z kwotą. Najpierw wycen projekt." };
    }

    const totalVat = calculateVAT(totalNet, vatRate);
    const totalGross = calculateGross(totalNet, vatRate);

    const infakt = getInFaktAPI(profile.infakt_api_key);
    const today = new Date().toISOString().split("T")[0];
    const paymentDate = new Date();
    paymentDate.setDate(paymentDate.getDate() + (input.paymentDays || 14));
    const invoiceStatus = input.status || "sent";

    const infaktInvoice = await infakt.createInvoice({
      client: {
        company_name: input.clientName,
        nip: input.clientNip,
        street: input.clientAddress,
        city: input.clientCity,
        post_code: input.clientPostalCode,
        email: input.clientEmail,
        country: "PL",
      },
      items: invoiceItems,
      invoice_date: today,
      sale_date: today,
      payment_date: paymentDate.toISOString().split("T")[0],
      payment_method: input.paymentMethod || "transfer",
      notes: input.notes,
      status: invoiceStatus,
    });

    const { data: invoice, error: insertError } = await supabase
      .from("project_invoices")
      .insert({
        user_id: user.id,
        project_id: input.projectId,
        infakt_invoice_id: infaktInvoice.id.toString(),
        infakt_client_id: infaktInvoice.client_id.toString(),
        invoice_number: infaktInvoice.number,
        issue_date: infaktInvoice.invoice_date,
        sale_date: infaktInvoice.sale_date,
        payment_date: infaktInvoice.payment_date,
        client_name: input.clientName,
        client_nip: input.clientNip,
        client_address: input.clientAddress,
        client_city: input.clientCity,
        client_postal_code: input.clientPostalCode,
        client_email: input.clientEmail,
        amount_net: totalNet,
        amount_vat: totalVat,
        amount_gross: totalGross,
        vat_rate: vatRate,
        status: invoiceStatus,
        payment_status: invoiceStatus === "draft" ? "draft" : "open",
        pdf_url: infaktInvoice.pdf_url,
        payment_method: input.paymentMethod || "transfer",
        notes: input.notes,
      })
      .select()
      .single();

    if (insertError) {
      logger.error("Error saving invoice", {}, insertError);
      return { success: false, error: "Błąd zapisywania faktury" };
    }

    if (invoice) {
      const itemsToInsert = invoiceItems.map(
        (item: { name: string; quantity: number; unit: string; net_price: number; tax_rate: number }, index: number) => ({
          invoice_id: invoice.id,
          project_item_id: project.project_items[index].id,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          unit_price_net: item.net_price,
          vat_rate: item.tax_rate,
          total_net: item.net_price * item.quantity,
          total_vat: calculateVAT(item.net_price * item.quantity, item.tax_rate),
          total_gross: calculateGross(item.net_price * item.quantity, item.tax_rate),
        })
      );
      await supabase.from("project_invoice_items").insert(itemsToInsert);
    }

    revalidatePath("/dashboard/invoices");
    revalidatePath(`/dashboard/projects/${input.projectId}`);

    return {
      success: true,
      invoiceId: invoice.id,
      invoiceNumber: infaktInvoice.number,
      pdfUrl: infaktInvoice.pdf_url,
    };
  } catch (error) {
    logger.error("createProjectInvoice error", {}, error);
    return { success: false, error: error instanceof Error ? error.message : "Nieoczekiwany błąd" };
  }
}

export async function createInvoiceDraft(input: CreateProjectInvoiceInput & { status?: "draft" }) {
  try {
    const { user, supabase } = await tryAuth();
    if (!user || !supabase) return { success: false, error: "Musisz być zalogowany" };
    return { success: true, message: "Draft functionality to be implemented" };
  } catch (error) {
    logger.error("createInvoiceDraft error", {}, error);
    return { success: false, error: error instanceof Error ? error.message : "Nieoczekiwany błąd" };
  }
}
