"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { 
  Users, Plus, Search, MoreVertical, Edit, Trash2, 
  Building2, User, Mail, Phone, MapPin, FileText,
  TrendingUp, FolderOpen, Tag
} from "lucide-react";
import type { Client } from "@/lib/types/database";
import { ClientDialog } from "@/components/clients/client-dialog";
import { deleteClient } from "./actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ClientsPageClientProps {
  initialClients: Client[];
  stats: {
    totalClients: number;
    totalRevenue: number;
    totalProjects: number;
    tagCounts: Record<string, number>;
    avgRevenuePerClient: number;
  } | null;
}

const TAG_COLORS: Record<string, string> = {
  vip: "bg-amber-500",
  regular: "bg-blue-500",
  problematic: "bg-red-500",
  new: "bg-green-500",
};

export function ClientsPageClient({ initialClients, stats }: ClientsPageClientProps) {
  const [clients, setClients] = useState(initialClients);

  // Sync state when server data changes (after router.refresh)
  useEffect(() => {
    setClients(initialClients);
  }, [initialClients]);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const router = useRouter();

  const filteredClients = clients.filter(client => {
    const query = searchQuery.toLowerCase();
    return (
      client.name.toLowerCase().includes(query) ||
      (client.company_name?.toLowerCase().includes(query)) ||
      (client.email?.toLowerCase().includes(query)) ||
      (client.nip?.includes(query))
    );
  });

  const handleDelete = (clientId: string) => {
    setPendingDeleteId(clientId);
  };

  const executeDelete = async () => {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    setPendingDeleteId(null);
    setDeleting(id);
    const result = await deleteClient(id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Klient usunięty");
      setClients(clients.filter(c => c.id !== id));
    }
    setDeleting(null);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingClient(null);
    router.refresh();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pl-PL", {
      style: "currency",
      currency: "PLN",
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="min-h-screen py-6 md:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 md:p-3 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/20">
            <Users className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Klienci
            </h1>
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400">
              Zarządzaj bazą klientów i ich projektami
            </p>
          </div>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Dodaj klienta
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Klienci</p>
                  <p className="text-2xl font-bold">{stats.totalClients}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Projekty</p>
                  <p className="text-2xl font-bold">{stats.totalProjects}</p>
                </div>
                <FolderOpen className="w-8 h-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Łączna wartość</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-amber-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Śr. na klienta</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.avgRevenuePerClient)}</p>
                </div>
                <User className="w-8 h-8 text-purple-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="clients-search"
              name="clients-search"
              aria-label="Szukaj klientów"
              placeholder="Szukaj klientów (nazwa, email, NIP...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">Lista klientów ({filteredClients.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          {filteredClients.length === 0 ? (
            <div className="text-center py-14">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">
                {searchQuery ? "Brak pasujących klientów" : "Brak klientów"}
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-4">
                {searchQuery
                  ? "Zmień zapytanie wyszukiwania"
                  : "Dodaj pierwszego klienta — wszystkie ich projekty i historia będą w jednym miejscu"}
              </p>
              {!searchQuery && (
                <Button size="sm" onClick={() => setDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Dodaj pierwszego klienta
                </Button>
              )}
            </div>
          ) : (
            <>
            {/* Mobile Scroll Hint */}
            <div className="md:hidden px-3 py-1.5 bg-blue-50 dark:bg-blue-950/30 border-b border-blue-200 dark:border-blue-800">
              <p className="text-[10px] text-blue-700 dark:text-blue-300 text-center">
                ← Przesuń w bok, aby zobaczyć więcej →
              </p>
            </div>
            <div className="overflow-x-auto">
            <Table className="min-w-[700px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs sm:text-sm">Klient</TableHead>
                  <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Kontakt</TableHead>
                  <TableHead className="text-xs sm:text-sm hidden md:table-cell">Tagi</TableHead>
                  <TableHead className="text-center text-xs sm:text-sm">Proj.</TableHead>
                  <TableHead className="text-right text-xs sm:text-sm">Wartość</TableHead>
                  <TableHead className="w-[40px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <TableCell>
                      <Link href={`/dashboard/clients/${client.id}`} className="block">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            client.type === "company" ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"
                          }`}>
                            {client.type === "company" ? (
                              <Building2 className="w-5 h-5" />
                            ) : (
                              <User className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{client.name}</p>
                            {client.company_name && (
                              <p className="text-sm text-muted-foreground">{client.company_name}</p>
                            )}
                            {client.nip && (
                              <p className="text-xs text-muted-foreground">NIP: {client.nip}</p>
                            )}
                          </div>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {client.email && (
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="w-3 h-3 text-muted-foreground" />
                            <span>{client.email}</span>
                          </div>
                        )}
                        {client.phone && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="w-3 h-3 text-muted-foreground" />
                            <span>{client.phone}</span>
                          </div>
                        )}
                        {client.city && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            <span>{client.city}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {client.tags.map((tag) => (
                          <Badge 
                            key={tag} 
                            variant="secondary"
                            className={`text-xs ${TAG_COLORS[tag] || "bg-slate-500"} text-white`}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-medium">{client.total_projects}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-medium text-blue-600">
                        {formatCurrency(client.total_revenue)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Otwórz menu klienta">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(client)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edytuj
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/clients/${client.id}`}>
                              <FileText className="w-4 h-4 mr-2" />
                              Szczegóły
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDelete(client.id)}
                            className="text-red-600"
                            disabled={deleting === client.id}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Usuń
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Info Banner */}
      <div className="rounded-xl border border-blue-200 dark:border-blue-800/50 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-4 mt-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-blue-900 dark:text-blue-100">
              Baza klientów CRM
            </p>
            <p className="text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed">
              Dodaj klientów, aby automatycznie przypisywać ich do projektów. 
              Kliknij klienta, aby zobaczyć historię projektów i szczegółowe dane kontaktowe.
              Wartość klienta obliczana jest na podstawie wszystkich przypisanych kosztorysów.
            </p>
          </div>
        </div>
      </div>

      {/* Client Dialog */}
      <ClientDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        client={editingClient}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!pendingDeleteId} onOpenChange={(open) => !open && setPendingDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usuń klienta</AlertDialogTitle>
            <AlertDialogDescription>
              Czy na pewno chcesz usunąć tego klienta? Tej operacji nie można cofnąć.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </div>
  );
}
