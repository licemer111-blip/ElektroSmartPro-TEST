"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Receipt } from "lucide-react";
import { toast } from "sonner";
import type { Payment } from "@/lib/types/database";

interface AdminPaymentsTableProps {
  payments: Payment[];
}

function getStatusBadgeClass(status: string): string {
  if (status === "succeeded") return "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200 border-green-200 dark:border-green-800";
  if (status === "pending") return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800";
  return "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200 border-red-200 dark:border-red-800";
}

function getStatusLabel(status: string): string {
  if (status === "succeeded") return "Opłacono";
  if (status === "pending") return "Oczekuje";
  if (status === "refunded") return "Zwrócono";
  return "Błąd";
}

function getVatBadgeClass(vatRate: number): string {
  return vatRate === 8
    ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300"
    : "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300";
}

export function AdminPaymentsTable({ payments }: AdminPaymentsTableProps) {
  const handleExportCSV = () => {
    try {
      const headers = [
        "Data",
        "Email",
        "Kwota Brutto (PLN)",
        "Stawka VAT (%)",
        "Kwota Netto (PLN)",
        "VAT (PLN)",
        "Status",
        "Opis",
        "Stripe Invoice ID",
      ];

      const rows = payments.map((payment) => [
        new Date(payment.created_at).toLocaleString("pl-PL"),
        payment.user_email,
        (payment.amount_total / 100).toFixed(2),
        payment.vat_rate.toString(),
        (payment.amount_net / 100).toFixed(2),
        (payment.amount_vat / 100).toFixed(2),
        payment.status,
        payment.description || "",
        payment.stripe_invoice_id || "",
      ]);

      const csvContent = [headers.join(";"), ...rows.map((row) => row.join(";"))].join("\n");
      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `platnosci_${new Date().toISOString().split("T")[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Raport CSV został pobrany");
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast.error("Błąd eksportu CSV");
    }
  };

  return (
    <Card className="border-slate-200 dark:border-slate-800">
      <CardHeader className="border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
              <Receipt className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <CardTitle className="text-xl">Historia Transakcji</CardTitle>
              <CardDescription className="mt-1">Wszystkie płatności z systemu Stripe</CardDescription>
            </div>
          </div>
          <Button
            onClick={handleExportCSV}
            disabled={payments.length === 0}
            className="bg-green-600 hover:bg-green-700 text-white"
            size="sm"
          >
            <Download className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Pobierz Raport CSV</span>
            <span className="md:hidden">CSV</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {payments.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-slate-500 dark:text-slate-400">Brak transakcji w systemie</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
              Płatności pojawią się tutaj po pierwszej subskrypcji
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Data</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Email</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Brutto</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">VAT</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Netto</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Kwota VAT</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr
                      key={payment.id}
                      className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3 px-4 text-sm text-slate-900 dark:text-slate-100">
                        {new Date(payment.created_at).toLocaleDateString("pl-PL", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">{payment.user_email}</td>
                      <td className="py-3 px-4 text-sm text-right font-semibold text-slate-900 dark:text-slate-100">
                        {(payment.amount_total / 100).toFixed(2)} zł
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant="outline" className={getVatBadgeClass(payment.vat_rate)}>
                          {payment.vat_rate}%
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-right text-slate-600 dark:text-slate-400">
                        {(payment.amount_net / 100).toFixed(2)} zł
                      </td>
                      <td className="py-3 px-4 text-sm text-right text-slate-600 dark:text-slate-400">
                        {(payment.amount_vat / 100).toFixed(2)} zł
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getStatusBadgeClass(payment.status)}>
                          {getStatusLabel(payment.status)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {payments.map((payment) => (
                <Card key={payment.id} className="border-slate-200 dark:border-slate-800">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Email</p>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                          {payment.user_email}
                        </p>
                      </div>
                      <Badge className={getStatusBadgeClass(payment.status)}>
                        {getStatusLabel(payment.status)}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Data transakcji</p>
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        {new Date(payment.created_at).toLocaleDateString("pl-PL", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Kwota brutto</p>
                        <p className="text-base font-bold text-slate-900 dark:text-slate-100">
                          {(payment.amount_total / 100).toFixed(2)} zł
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Stawka VAT</p>
                        <Badge variant="outline" className={getVatBadgeClass(payment.vat_rate)}>
                          {payment.vat_rate}%
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Netto</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300">
                          {(payment.amount_net / 100).toFixed(2)} zł
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Kwota VAT</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300">
                          {(payment.amount_vat / 100).toFixed(2)} zł
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
