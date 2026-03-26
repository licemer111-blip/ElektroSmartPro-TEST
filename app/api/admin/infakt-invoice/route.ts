import { NextResponse } from "next/server";
import { isAdmin } from "@/app/dashboard/settings/finance-actions";

export async function GET(request: Request) {
  const admin = await isAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const apiKey = process.env.INFAKT_API_KEY!;
  const headers = { "X-inFakt-ApiKey": apiKey, "Accept": "application/json", "Content-Type": "application/json" };

  // ?last=1 — fetch last 10 invoices
  if (searchParams.get("last") === "1") {
    const res = await fetch("https://api.infakt.pl/api/v3/invoices.json?per_page=10&page=1", { headers });
    const text = await res.text();
    try {
      const data = JSON.parse(text);
      const invoices = (data.entities ?? data.invoices ?? data) as Array<Record<string, unknown>>;
      const summary = invoices.map((inv: Record<string, unknown>) => ({
        id: inv.id, uuid: inv.uuid, number: inv.number,
        number_series_id: inv.number_series_id, status: inv.status, paid_date: inv.paid_date,
      }));
      return NextResponse.json({ status: res.status, summary });
    } catch { return NextResponse.json({ status: res.status, raw: text.slice(0, 500) }); }
  }

  // ?id=UUID_or_ID — fetch invoice
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "?id=UUID or ?last=1 required" });

  const res = await fetch(`https://api.infakt.pl/api/v3/invoices/${id}.json`, { headers });
  const text = await res.text();
  try { return NextResponse.json({ status: res.status, invoice: JSON.parse(text) }); }
  catch { return NextResponse.json({ status: res.status, raw: text.slice(0, 500) }); }
}
