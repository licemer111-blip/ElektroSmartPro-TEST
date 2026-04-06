"use server";

import { tryAuth } from "@/lib/auth";
import { getInFaktAPI } from "@/lib/infakt-api";
import { logger } from "@/lib/logger";

export async function getProjectInvoices() {
  try {
    const { user, supabase } = await tryAuth();
    if (!user || !supabase) return { success: false, error: "Musisz być zalogowany", invoices: [] };

    const { data: invoices, error } = await supabase
      .from("project_invoices")
      .select(`*, projects ( name )`)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Error fetching invoices", {}, error);
      return { success: false, error: "Błąd pobierania faktur", invoices: [] };
    }

    return { success: true, invoices: invoices || [] };
  } catch (error) {
    logger.error("getProjectInvoices error", {}, error);
    return { success: false, error: "Nieoczekiwany błąd", invoices: [] };
  }
}

export async function getSubscriptionInvoices() {
  try {
    const { user, supabase } = await tryAuth();
    if (!user || !supabase) return { success: false, error: "Musisz być zalogowany", invoices: [] };

    const { data: invoices, error } = await supabase
      .from("subscription_invoices")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Error fetching subscription invoices", {}, error);
      return { success: false, error: "Błąd pobierania faktur", invoices: [] };
    }

    return { success: true, invoices: invoices || [], userEmail: user.email ?? null };
  } catch (error) {
    logger.error("getSubscriptionInvoices error", {}, error);
    return { success: false, error: "Nieoczekiwany błąd", invoices: [], userEmail: null };
  }
}

export async function getOverdueInvoices() {
  try {
    const { user, supabase } = await tryAuth();
    if (!user || !supabase) return { success: false, error: "Musisz być zalogowany", invoices: [] };

    const today = new Date().toISOString().split("T")[0];

    const { data: overdueInvoices, error } = await supabase
      .from("project_invoices")
      .select(`*, projects ( name )`)
      .eq("user_id", user.id)
      .eq("payment_status", "open")
      .lt("payment_date", today)
      .order("payment_date", { ascending: true });

    if (error) {
      logger.error("Error fetching overdue invoices", {}, error);
      return { success: false, error: "Błąd pobierania faktur", invoices: [] };
    }

    const invoicesWithDays = (overdueInvoices || []).map((invoice: typeof overdueInvoices[number]) => {
      const paymentDate = new Date(invoice.payment_date);
      const todayDate = new Date(today);
      const diffTime = todayDate.getTime() - paymentDate.getTime();
      const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return { ...invoice, daysOverdue };
    });

    return { success: true, invoices: invoicesWithDays };
  } catch (error) {
    logger.error("getOverdueInvoices error", {}, error);
    return { success: false, error: "Nieoczekiwany błąd", invoices: [] };
  }
}

export async function getNextInvoiceNumber() {
  try {
    const { user, supabase } = await tryAuth();
    if (!user || !supabase) return { success: false, error: "Musisz być zalogowany", number: null };

    const { data: profile } = await supabase
      .from("profiles")
      .select("infakt_api_key")
      .eq("id", user.id)
      .single();

    if (!profile?.infakt_api_key) {
      const { data: lastInvoice } = await supabase
        .from("project_invoices")
        .select("invoice_number")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!lastInvoice) {
        const now = new Date();
        return { success: true, number: `FV/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/001` };
      }

      const match = lastInvoice.invoice_number.match(/FV\/(\d{4})\/(\d{2})\/(\d+)/);
      if (match) {
        const [, year, month, num] = match;
        const now = new Date();
        const currentYear = now.getFullYear().toString();
        const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
        if (year === currentYear && month === currentMonth) {
          return { success: true, number: `FV/${year}/${month}/${String(parseInt(num) + 1).padStart(3, "0")}` };
        }
        return { success: true, number: `FV/${currentYear}/${currentMonth}/001` };
      }
    }

    if (profile && profile.infakt_api_key) {
      const infakt = getInFaktAPI(profile.infakt_api_key);
      const number = await infakt.getNextInvoiceNumber();
      return { success: true, number };
    }

    const now = new Date();
    return { success: true, number: `FV/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/001` };
  } catch (error) {
    logger.error("getNextInvoiceNumber error", {}, error);
    const now = new Date();
    return { success: true, number: `FV/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/001` };
  }
}

export async function getInFaktInvoices(params?: { page?: number; limit?: number; status?: string }) {
  try {
    const { user, supabase } = await tryAuth();
    if (!user || !supabase) return { success: false, error: "Musisz być zalogowany", invoices: [] };

    const { data: profile } = await supabase
      .from("profiles")
      .select("infakt_api_key")
      .eq("id", user.id)
      .single();

    if (!profile?.infakt_api_key) {
      return { success: false, error: "Skonfiguruj klucz API InFakt w Ustawieniach", invoices: [] };
    }

    const infakt = getInFaktAPI(profile.infakt_api_key);
    const result = await infakt.getInvoices(params);

    return { success: true, invoices: result.invoices, total: result.total, page: result.page, pages: result.pages };
  } catch (error) {
    logger.error("getInFaktInvoices error", {}, error);
    return { success: false, error: error instanceof Error ? error.message : "Nieoczekiwany błąd", invoices: [] };
  }
}
