import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import { getSubscriptionInvoices } from "./actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, XCircle, FileText, Receipt, Crown, CreditCard, Zap, Download } from "lucide-react";
import { InvoiceActions } from "./invoice-actions-client";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Subskrypcja i Faktury — ElektroSmart PRO",
  description: "Faktury za subskrypcję ElektroSmart PRO — historia płatności, statusy i pobieranie dokumentów PDF",
};

export default async function InvoicesPage() {
  const subscriptionInvoicesResult = await getSubscriptionInvoices();
  const subscriptionInvoices = subscriptionInvoicesResult.invoices || [];
  const userEmail = subscriptionInvoicesResult.userEmail ?? null;

  return (
    <div className="min-h-screen py-6 md:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 md:p-3 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/20">
              <Receipt className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Subskrypcja i Faktury
              </h1>
              <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400">
                Faktury za subskrypcję ElektroSmart PRO • Historia płatności • Pobieranie PDF
              </p>
            </div>
          </div>

          {/* Plan status card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-2">
            <Card className="border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center flex-shrink-0">
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium uppercase tracking-wide">Twój plan</p>
                  <p className="text-sm font-bold text-amber-900 dark:text-amber-100">ElektroSmart PRO</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[10px] text-blue-700 dark:text-blue-400 font-medium uppercase tracking-wide">Faktury</p>
                  <p className="text-sm font-bold text-blue-900 dark:text-blue-100">{subscriptionInvoices.length} dokumentów</p>
                </div>
              </CardContent>
            </Card>
            <Link href="/dashboard/subscription/checkout" className="block">
              <Card className="border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-4 flex items-center gap-3 h-full">
                  <div className="w-9 h-9 rounded-lg bg-green-600 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] text-green-700 dark:text-green-400 font-medium uppercase tracking-wide">Zarządzaj</p>
                    <p className="text-sm font-bold text-green-900 dark:text-green-100">Portal Stripe →</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="p-4 pb-3">
            <CardTitle className="text-base">Faktury subskrypcyjne</CardTitle>
            <CardDescription className="text-xs">
              Faktury za subskrypcję ElektroSmart PRO Premium — wystawiane automatycznie po każdej płatności
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {subscriptionInvoices.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center mb-4">
                  <Download className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-base font-semibold mb-2 text-slate-900 dark:text-slate-100">Brak faktur</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto mb-4">
                  Faktury za subskrypcję pojawią się tutaj automatycznie po płatności.
                </p>
                <Link href="/dashboard/subscription/checkout">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Crown className="w-4 h-4 mr-2" />
                    Aktywuj ElektroSmart PRO
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {subscriptionInvoices.map((invoice: {
                  id: string;
                  invoice_number: string;
                  status: string;
                  description?: string;
                  amount_gross: number;
                  amount_net: number;
                  issue_date: string;
                }) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors gap-3"
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg flex-shrink-0">
                        <Receipt className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="font-semibold text-sm">{invoice.invoice_number}</h4>
                          <InvoiceStatusBadge status={invoice.status} />
                        </div>
                        {invoice.description && (
                          <p className="text-xs text-muted-foreground mb-0.5 truncate">{invoice.description}</p>
                        )}
                        <p className="text-[10px] text-muted-foreground">
                          Wystawiono: {new Date(invoice.issue_date).toLocaleDateString("pl-PL")}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-base">{Number(invoice.amount_gross).toFixed(2)} zł</p>
                        <p className="text-[10px] text-muted-foreground">netto: {Number(invoice.amount_net).toFixed(2)} zł</p>
                      </div>
                    </div>
                    <InvoiceActions
                      invoiceId={invoice.id}
                      invoiceNumber={invoice.invoice_number}
                      userEmail={userEmail}
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="rounded-xl border border-blue-200 dark:border-blue-800/50 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-4 mt-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-blue-900 dark:text-blue-100">
                Faktury subskrypcyjne ElektroSmart PRO
              </p>
              <p className="text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed">
                Faktury są generowane automatycznie po każdej płatności za subskrypcję.
                Możesz pobrać każdą fakturę w formacie PDF lub przesłać ją mailem.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InvoiceStatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: React.ComponentType<{ className?: string }>;
  }> = {
    draft:     { label: "Szkic",           variant: "secondary",   icon: Clock },
    sent:      { label: "Wysłano",         variant: "default",     icon: FileText },
    paid:      { label: "Opłacono",        variant: "default",     icon: CheckCircle },
    overdue:   { label: "Przeterminowano", variant: "destructive", icon: XCircle },
    cancelled: { label: "Anulowano",       variant: "outline",     icon: XCircle },
  };

  const config = statusConfig[status] ?? statusConfig.draft;
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="gap-1 text-[10px] px-1.5 py-0.5">
      <Icon className="h-2.5 w-2.5" />
      {config.label}
    </Badge>
  );
}
