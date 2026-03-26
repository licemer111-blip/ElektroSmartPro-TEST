import { logger } from "@/lib/logger";
/**
 * InFakt API Integration
 * Official documentation: https://www.infakt.pl/developers
 */

const INFAKT_API_BASE = "https://api.infakt.pl/api/v3";

interface InFaktClient {
  company_name?: string;
  first_name?: string;
  last_name?: string;
  nip?: string;
  street?: string;
  street_number?: string;
  city?: string;
  post_code?: string;
  country?: string;
  email?: string | null;
}

/**
 * Parse address line (e.g. "Aleja Stanów Zjednoczonych 32") into street + street_number.
 * inFakt requires them separately.
 */
export function parseAddressLine(line: string): { street: string; street_number: string } {
  const trimmed = line.trim();
  // Match trailing house/apt number: digits optionally followed by /digit or letter
  const match = trimmed.match(/^(.+?)\s+(\d+(?:[/\\]\d+)?[a-zA-Z]?)$/);
  if (match) {
    return { street: match[1].trim(), street_number: match[2].trim() };
  }
  return { street: trimmed, street_number: "" };
}

interface InFaktInvoiceItem {
  name: string;
  quantity: number;
  unit: string;
  unit_net_price: number; // in grosze (integer, e.g. 200 = 2.00 PLN) — per inFakt API docs
  tax_symbol: string;    // "23", "8", "0", "zw" — per inFakt API docs
  flat_rate_tax_symbol?: string; // ryczałt per-item override: "8.5", "5.5" etc.
}

interface InFaktInvoicePayload {
  client: InFaktClient;
  items: InFaktInvoiceItem[];
  invoice_date?: string; // YYYY-MM-DD
  sale_date?: string; // YYYY-MM-DD
  payment_date?: string; // YYYY-MM-DD
  payment_method?: string; // "transfer", "cash", "card"
  status?: string; // "draft", "sent", "issued"
  notes?: string;
  kind?: string; // "vat" (default), "proforma", "correction"
  seller_name?: string; // override seller display name on PDF
  number_series_id?: number; // explicit numbering series (e.g. FV-)
  // flat_rate_tax_symbol is set per-item in InFaktInvoiceItem
}

interface InFaktInvoiceResponse {
  id: number;
  uuid?: string; // InFakt v3 UUID — used for mark_as_paid, deliver etc.
  number: string; // "FV/2026/01/001"
  client_id: number;
  invoice_date: string;
  sale_date: string;
  payment_date: string;
  net_price: string;
  tax_price: string;
  gross_price: string;
  status: string;
  pdf_url: string | null;
  public_pdf_url: string | null; // public link, no login required
  view_url: string | null;
}

interface InFaktClientResponse {
  id: number;
  company_name: string;
  nip: string;
  // ... other fields
}

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * InFakt API Client
 */
export class InFaktAPI {
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("InFakt API key is required");
    }
    this.apiKey = apiKey;
  }

  private async request<T>(
    endpoint: string,
    method: string = "GET",
    data?: Record<string, unknown>
  ): Promise<T> {
    // Insert .json before query string (e.g. /clients.json?q[nip_eq]=...)
    const [path, qs] = endpoint.split("?");
    const url = `${INFAKT_API_BASE}${path}.json${qs ? `?${qs}` : ""}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "X-inFakt-ApiKey": this.apiKey,
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (data && (method === "POST" || method === "PUT" || method === "PATCH")) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      logger.error("InFakt API Error:", {}, {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      throw new Error(`InFakt API error: ${response.status} - ${errorText}`);
    }

    // 204 No Content or empty body (e.g. mark_as_paid, deliver_via_email)
    const contentLength = response.headers.get("content-length");
    const contentType = response.headers.get("content-type") || "";
    if (
      response.status === 204 ||
      contentLength === "0" ||
      !contentType.includes("application/json")
    ) {
      return {} as T;
    }

    const text = await response.text();
    if (!text.trim()) return {} as T;
    return JSON.parse(text) as T;
  }

  /**
   * Create or get existing client
   */
  async createOrGetClient(clientData: InFaktClient): Promise<InFaktClientResponse> {
    try {
      // 1. Try to find existing client by NIP
      if (clientData.nip) {
        const byNip = await this.request<{ clients?: InFaktClientResponse[] }>(
          `/clients?q[nip_eq]=${encodeURIComponent(clientData.nip)}`,
          "GET"
        );
        if (byNip.clients && byNip.clients.length > 0) {
          logger.info("[InFakt] Found existing client by NIP", { nip: clientData.nip, id: byNip.clients[0].id });
          return byNip.clients[0];
        }
      }

      // 2. Try to find existing client by email
      if (clientData.email) {
        const byEmail = await this.request<{ clients?: InFaktClientResponse[] }>(
          `/clients?q[email_eq]=${encodeURIComponent(clientData.email)}`,
          "GET"
        );
        if (byEmail.clients && byEmail.clients.length > 0) {
          logger.info("[InFakt] Found existing client by email", { email: clientData.email, id: byEmail.clients[0].id });
          return byEmail.clients[0];
        }
      }

      // 3. Create new client — log full raw response to diagnose shape issues
      logger.info("[InFakt] Creating new client", { email: clientData.email, nip: clientData.nip });
      const rawResponse = await this.request<Record<string, unknown>>(
        "/clients",
        "POST",
        { client: clientData }
      );
      logger.info("[InFakt] createOrGetClient raw response:", { raw: JSON.stringify(rawResponse).slice(0, 300) });

      // inFakt can return the client object directly OR wrapped in {client:{...}} or {clients:[...]}
      const created: InFaktClientResponse | undefined =
        typeof rawResponse.id === "number"
          ? (rawResponse as unknown as InFaktClientResponse)              // direct object
          : (rawResponse.client as InFaktClientResponse | undefined)      // wrapped {client:{...}}
            ?? (rawResponse.clients as InFaktClientResponse[] | undefined)?.[0]; // wrapped {clients:[...]}

      if (!created || !created.id) {
        throw new Error(
          `[InFakt] Unexpected response — no client.id. Email: ${clientData.email ?? "unknown"}. Raw: ${JSON.stringify(rawResponse).slice(0, 300)}`
        );
      }

      return created;
    } catch (error) {
      logger.error("[InFakt] createOrGetClient failed:", {}, error);
      throw error;
    }
  }

  /**
   * Create invoice (VAT invoice)
   */
  async createInvoice(payload: InFaktInvoicePayload): Promise<InFaktInvoiceResponse> {
    try {
      // Ensure client exists
      const client = await this.createOrGetClient(payload.client);

      if (!client || !client.id) {
        throw new Error(
          `[InFakt] Failed to identify client for invoice: ${payload.client.email ?? payload.client.company_name ?? "unknown"}`
        );
      }

      // Calculate gross price to set paid_price = full amount (PDF shows Zapłacono: X PLN)
      const grossPrice = payload.items.reduce((sum, item) => {
        const net = Math.round(item.unit_net_price) * item.quantity;
        const vatRate = parseFloat(String(item.tax_symbol)) || 0;
        return sum + Math.round(net * (1 + vatRate / 100));
      }, 0);

      // Prepare invoice data
      const invoiceData = {
        invoice: {
          client_id: client.id,
          invoice_date: payload.invoice_date || new Date().toISOString().split("T")[0],
          sale_date: payload.sale_date || new Date().toISOString().split("T")[0],
          payment_date: payload.payment_date || this.getPaymentDate(14), // 14 days default
          payment_method: payload.payment_method || "transfer",
          status: payload.status || "sent",
          kind: payload.kind || "vat",
          notes: payload.notes || "",
          paid_price: grossPrice, // marks invoice as fully paid in PDF
          ...(payload.seller_name ? { seller_name: payload.seller_name } : {}),
          ...(payload.number_series_id ? { number_series_id: payload.number_series_id } : {}),
          services: payload.items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            unit_net_price: Math.round(item.unit_net_price), // grosze integer per inFakt docs
            tax_symbol: String(item.tax_symbol),            // "23", "8", "0", "zw"
            ...(item.flat_rate_tax_symbol ? { flat_rate_tax_symbol: item.flat_rate_tax_symbol } : {}),
          })),
        },
      };

      logger.info("[InFakt] createInvoice payload:", { payload: JSON.stringify(invoiceData).slice(0, 500) });

      // Sync invoice creation — POST /invoices.json
      const rawInvoiceResponse = await this.request<Record<string, unknown>>(
        "/invoices",
        "POST",
        invoiceData
      );
      logger.info("[InFakt] createInvoice raw response:", { raw: JSON.stringify(rawInvoiceResponse).slice(0, 300) });

      // inFakt may return invoice directly OR wrapped in {invoice:{...}}
      const invoice: InFaktInvoiceResponse | undefined =
        typeof rawInvoiceResponse.id === "number"
          ? (rawInvoiceResponse as unknown as InFaktInvoiceResponse)
          : (rawInvoiceResponse.invoice as InFaktInvoiceResponse | undefined);

      if (!invoice || !invoice.id) {
        throw new Error(
          `[InFakt] Unexpected invoice response — no invoice.id. Raw: ${JSON.stringify(rawInvoiceResponse).slice(0, 300)}`
        );
      }

      logger.info("[InFakt] createInvoice done:", { invoiceId: invoice.id, invoiceUuid: invoice.uuid ?? "(none)", number: invoice.number });
      return invoice;
    } catch (error) {
      logger.error("Error creating InFakt invoice:", {}, error);
      throw error;
    }
  }

  /**
   * Get invoice by ID
   */
  async getInvoice(invoiceId: number): Promise<InFaktInvoiceResponse | null> {
    try {
      const raw = await this.request<Record<string, unknown>>(
        `/invoices/${invoiceId}`,
        "GET"
      );

      if (!raw) {
        logger.error("[InFakt] getInvoice returned empty response", { invoiceId });
        return null;
      }

      logger.info("[InFakt] getInvoice raw:", { invoiceId, raw: JSON.stringify(raw).slice(0, 400) });

      // inFakt may return invoice directly OR wrapped in {invoice:{...}}
      const invoice: InFaktInvoiceResponse | null =
        typeof raw.id === "number"
          ? (raw as unknown as InFaktInvoiceResponse)
          : ((raw.invoice as InFaktInvoiceResponse | undefined) ?? null);

      if (!invoice?.id) {
        logger.error("[InFakt] getInvoice — no invoice.id in response", { invoiceId, raw: JSON.stringify(raw).slice(0, 300) });
        return null;
      }

      return invoice;
    } catch (error) {
      logger.error("[InFakt] getInvoice error:", { invoiceId }, error);
      return null;
    }
  }

  /**
   * Update invoice status
   */
  async updateInvoiceStatus(
    invoiceId: number,
    status: "draft" | "sent" | "paid"
  ): Promise<InFaktInvoiceResponse> {
    try {
      const response = await this.request<{ invoice: InFaktInvoiceResponse }>(
        `/invoices/${invoiceId}`,
        "PUT",
        {
          invoice: { status },
        }
      );
      return response.invoice;
    } catch (error) {
      logger.error("Error updating InFakt invoice status:", {}, error);
      throw error;
    }
  }

  /**
   * Mark invoice as paid via PUT /api/v3/invoices/{uuid}.json
   * PUT /api/v3/invoices/{uuid}.json with status:paid works from any status (draft/sent).
   */
  async markAsPaid(invoiceUuid: string, paidDate: string): Promise<void> {
    try {
      logger.info("[InFakt] Marking invoice as paid:", { invoiceUuid, paidDate });
      // payment_method:transfer makes extensions.payments.available=true
      // which is required for mark_as_paid endpoint to work
      await this.request(`/invoices/${invoiceUuid}`, "PUT", {
        invoice: { payment_method: "transfer" },
      });
      await this.request(`/invoices/${invoiceUuid}/mark_as_paid?paid_date=${paidDate}`, "PUT");
      logger.info("[InFakt] Invoice marked as paid:", { invoiceUuid });
    } catch (error) {
      logger.error("[InFakt] markAsPaid failed:", {}, error);
      throw error;
    }
  }

  /**
   * Deliver invoice via InFakt email (POST /api/v3/invoices/{id}/deliver_via_email.json)
   * Sends PDF attachment to the client email on record in InFakt.
   */
  async deliverInvoice(invoiceRef: number | string): Promise<void> {
    try {
      logger.info("[InFakt] Delivering invoice via email:", { invoiceRef });
      await this.request(`/invoices/${invoiceRef}/deliver_via_email`, "POST");
      logger.info("[InFakt] Invoice delivered successfully:", { invoiceRef });
    } catch (error) {
      logger.error("[InFakt] deliverInvoice failed:", {}, error);
      throw error;
    }
  }

  /**
   * Send invoice via email (InFakt sends it automatically if status is "sent")
   * @deprecated Use deliverInvoice() instead
   */
  async sendInvoiceEmail(invoiceId: number): Promise<void> {
    try {
      await this.request(
        `/invoices/${invoiceId}/deliver_via_email`,
        "POST"
      );
    } catch (error) {
      logger.error("Error sending InFakt invoice email:", {}, error);
      throw error;
    }
  }

  /**
   * Get all invoices (with pagination and filtering)
   */
  async getInvoices(params?: {
    page?: number;
    limit?: number;
    status?: string; // "draft", "sent", "paid", "overdue"
    q?: Record<string, string | number | boolean>; // Advanced filtering
  }): Promise<{
    invoices: InFaktInvoiceResponse[];
    total: number;
    page: number;
    pages: number;
  }> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.limit) queryParams.append("limit", params.limit.toString());
      if (params?.status) queryParams.append("q[status_eq]", params.status);
      
      // Add custom query params
      if (params?.q) {
        Object.entries(params.q).forEach(([key, value]) => {
          queryParams.append(`q[${key}]`, value.toString());
        });
      }

      const endpoint = `/invoices${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      
      const response = await this.request<{
        invoices: InFaktInvoiceResponse[];
        meta?: {
          total_count: number;
          current_page: number;
          total_pages: number;
        };
      }>(endpoint, "GET");

      return {
        invoices: response.invoices || [],
        total: response.meta?.total_count || response.invoices.length,
        page: response.meta?.current_page || 1,
        pages: response.meta?.total_pages || 1,
      };
    } catch (error) {
      logger.error("Error getting InFakt invoices:", {}, error);
      throw error;
    }
  }

  /**
   * Get next invoice number suggestion
   */
  async getNextInvoiceNumber(): Promise<string> {
    try {
      // Get recent invoices to determine next number
      const result = await this.getInvoices({ limit: 1 });
      
      if (!result.invoices || result.invoices.length === 0) {
        // First invoice - suggest FV/YYYY/MM/001
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        return `FV/${year}/${month}/001`;
      }

      // Parse last invoice number and increment
      const lastNumber = result.invoices[0].number;
      const match = lastNumber.match(/FV\/(\d{4})\/(\d{2})\/(\d+)/);
      
      if (match) {
        const [, year, month, num] = match;
        const now = new Date();
        const currentYear = now.getFullYear().toString();
        const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
        
        // If same month, increment number
        if (year === currentYear && month === currentMonth) {
          const nextNum = String(parseInt(num) + 1).padStart(3, "0");
          return `FV/${year}/${month}/${nextNum}`;
        } else {
          // New month, start from 001
          return `FV/${currentYear}/${currentMonth}/001`;
        }
      }

      // Fallback
      const now = new Date();
      return `FV/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/001`;
    } catch (error) {
      logger.error("Error getting next invoice number:", {}, error);
      // Fallback to default format
      const now = new Date();
      return `FV/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/001`;
    }
  }

  /**
   * Check payment status and update if overdue
   */
  async checkPaymentStatus(invoiceId: number): Promise<{
    status: "draft" | "sent" | "paid" | "overdue";
    daysOverdue?: number;
  }> {
    try {
      const invoice = await this.getInvoice(invoiceId);

      if (!invoice) {
        throw new Error(`[InFakt] getInvoice returned null for id ${invoiceId}`);
      }

      // If already paid, return paid status
      if (invoice.status === "paid") {
        return { status: "paid" };
      }

      // Check if overdue
      const paymentDate = new Date(invoice.payment_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      paymentDate.setHours(0, 0, 0, 0);

      if (paymentDate < today && invoice.status === "sent") {
        const diffTime = today.getTime() - paymentDate.getTime();
        const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return {
          status: "overdue",
          daysOverdue,
        };
      }

      return {
        status: invoice.status as "draft" | "sent" | "paid" | "overdue",
      };
    } catch (error) {
      logger.error("Error checking payment status:", {}, error);
      throw error;
    }
  }

  /**
   * Helper: Calculate payment date (days from today)
   */
  private getPaymentDate(daysFromNow: number): string {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split("T")[0];
  }
}

/**
 * Get InFakt API instance for a specific user
 * @param userApiKey - User's InFakt API key from their profile
 */
export function getInFaktAPI(userApiKey?: string): InFaktAPI {
  if (!userApiKey) {
    throw new Error(
      "InFakt API key is required. Please configure your InFakt API key in Settings → Faktury."
    );
  }

  return new InFaktAPI(userApiKey);
}

/**
 * Helper: Calculate VAT amount
 */
export function calculateVAT(netAmount: number, vatRate: number): number {
  return Math.round((netAmount * vatRate) / 100 * 100) / 100;
}

/**
 * Helper: Calculate gross amount
 */
export function calculateGross(netAmount: number, vatRate: number): number {
  return Math.round((netAmount * (1 + vatRate / 100)) * 100) / 100;
}
