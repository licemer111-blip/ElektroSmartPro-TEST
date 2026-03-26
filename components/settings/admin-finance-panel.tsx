"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import {
  getAllUsers,
  getSubscriptionStats,
  toggleUserProStatus,
  toggleUserAdminRole,
  getPayments,
} from "@/app/dashboard/settings/finance-actions";
import { toast } from "sonner";
import type { Profile, Payment } from "@/lib/types/database";
import { AdminStatsCards } from "@/components/settings/_parts/AdminStatsCards";
import { AdminUsersTable } from "@/components/settings/_parts/AdminUsersTable";
import { AdminPaymentsTable } from "@/components/settings/_parts/AdminPaymentsTable";

interface Stats {
  totalUsers: number;
  proUsers: number;
  freeUsers: number;
  monthlyRevenue: number;
}

export function AdminFinancePanel() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<Profile[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);
  const [togglingAdminUserId, setTogglingAdminUserId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [statsResult, usersResult, paymentsResult] = await Promise.all([
        getSubscriptionStats(),
        getAllUsers(),
        getPayments(),
      ]);

      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data);
      } else {
        toast.error("Błąd ładowania statystyk");
      }

      if (usersResult.success && usersResult.data) {
        setUsers(usersResult.data);
      } else {
        toast.error("Błąd ładowania użytkowników");
      }

      if (paymentsResult.success && paymentsResult.data) {
        setPayments(paymentsResult.data);
      } else {
        toast.error("Błąd ładowania płatności");
      }
    } catch (error) {
      console.error("Error fetching admin data:", error);
      toast.error("Błąd ładowania danych administratora");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleToggleProStatus = async (userId: string, currentStatus: boolean) => {
    setTogglingUserId(userId);
    try {
      const result = await toggleUserProStatus(userId, currentStatus);
      
      if (result.success) {
        toast.success(
          currentStatus 
            ? "Użytkownik przełączony na plan FREE" 
            : "Użytkownik przełączony na plan PRO"
        );
        await fetchData(); // Refresh data
      } else {
        toast.error(result.error || "Błąd zmiany statusu");
      }
    } catch (error) {
      console.error("Error toggling PRO status:", error);
      toast.error("Błąd zmiany statusu użytkownika");
    } finally {
      setTogglingUserId(null);
    }
  };

  const handleToggleAdminRole = async (userId: string, currentRole: string) => {
    setTogglingAdminUserId(userId);
    try {
      const result = await toggleUserAdminRole(userId, currentRole);
      
      if (result.success) {
        toast.success(
          result.newRole === 'admin'
            ? "Użytkownik otrzymał prawa administratora" 
            : "Prawa administratora zostały odebrane"
        );
        await fetchData(); // Refresh data
      } else {
        toast.error(result.error || "Błąd zmiany roli");
      }
    } catch (error) {
      console.error("Error toggling admin role:", error);
      toast.error("Błąd zmiany roli użytkownika");
    } finally {
      setTogglingAdminUserId(null);
    }
  };

  const handleExportCSV = () => {
    try {
      // CSV Header with Polish column names
      const headers = [
        "Data",
        "Email",
        "Kwota Brutto (PLN)",
        "Stawka VAT (%)",
        "Kwota Netto (PLN)",
        "VAT (PLN)",
        "Status",
        "Opis",
        "Stripe Invoice ID"
      ];

      // Convert payments to CSV rows
      const rows = payments.map(payment => [
        new Date(payment.created_at).toLocaleString("pl-PL"),
        payment.user_email,
        (payment.amount_total / 100).toFixed(2),
        payment.vat_rate.toString(),
        (payment.amount_net / 100).toFixed(2),
        (payment.amount_vat / 100).toFixed(2),
        payment.status,
        payment.description || "",
        payment.stripe_invoice_id || ""
      ]);

      // Combine headers and rows
      const csvContent = [
        headers.join(";"),
        ...rows.map(row => row.join(";"))
      ].join("\n");

      // Add BOM for proper Polish characters in Excel
      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });

      // Create download link
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

  if (loading) {
    return (
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <AdminStatsCards stats={stats} />
      <AdminUsersTable
        users={users}
        refreshing={refreshing}
        togglingUserId={togglingUserId}
        togglingAdminUserId={togglingAdminUserId}
        onRefresh={handleRefresh}
        onTogglePro={handleToggleProStatus}
        onToggleAdmin={handleToggleAdminRole}
      />
      <AdminPaymentsTable payments={payments} />
    </div>
  );
}
