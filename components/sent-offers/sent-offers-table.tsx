"use client";

import { useState } from "react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Mail, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ExternalLink,
  Filter,
  Calendar,
  Trash2
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { deleteEmailLog } from "@/app/dashboard/sent-offers/actions";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EmailLog {
  id: string;
  user_id: string;
  project_id: string;
  recipient_email: string;
  recipient_name: string | null;
  subject: string;
  template_type: string;
  status: string;
  resend_id: string | null;
  error_message: string | null;
  sent_at: string;
  opened_at: string | null;
  created_at: string;
  projects?: {
    id: string;
    name: string;
    status: string;
  } | null;
}

interface SentOffersTableProps {
  emailLogs: EmailLog[];
}

export function SentOffersTable({ emailLogs }: SentOffersTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const handleDelete = (emailLogId: string) => {
    setPendingDeleteId(emailLogId);
  };

  const executeDelete = async () => {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    setPendingDeleteId(null);

    setDeletingId(id);

    try {
      const result = await deleteEmailLog(id);

      if (result.success) {
        toast({
          title: "Usunięto wpis",
          description: "Wpis został usunięty z historii wysłanych ofert",
        });
      } else {
        toast({
          title: "Błąd",
          description: result.error || "Nie udało się usunąć wpisu",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Wystąpił nieoczekiwany błąd",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  // Filter logs based on search and status
  const filteredLogs = emailLogs.filter((log) => {
    const matchesSearch = 
      log.recipient_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.projects?.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || log.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return (
          <Badge className="gap-1 bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-950 dark:text-green-400">
            <CheckCircle2 className="w-3 h-3" />
            Wysłano
          </Badge>
        );
      case "failed":
        return (
          <Badge className="gap-1 bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-950 dark:text-red-400">
            <XCircle className="w-3 h-3" />
            Błąd
          </Badge>
        );
      case "opened":
        return (
          <Badge className="gap-1 bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-400">
            <Mail className="w-3 h-3" />
            Otwarto
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1">
            <Clock className="w-3 h-3" />
            {status}
          </Badge>
        );
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "d MMM yyyy, HH:mm", { locale: pl });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="offers-search"
              name="offers-search"
              aria-label="Szukaj wysłanych ofert"
              placeholder="Szukaj po odbiorcy, projekcie lub temacie..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filtruj status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie</SelectItem>
                <SelectItem value="sent">Wysłane</SelectItem>
                <SelectItem value="failed">Błędy</SelectItem>
                <SelectItem value="opened">Otwarte</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Table */}
      {filteredLogs.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              {searchTerm || statusFilter !== "all" ? "Brak pasujących ofert" : "Brak wysłanych ofert"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-4">
              {searchTerm || statusFilter !== "all"
                ? "Zmień filtry wyszukiwania, aby zobaczyć więcej wyników"
                : "Otwórz projekt, dodaj email klienta i wyślij ofertę PDF bezpośrednio z kreatora"}
            </p>
            {!searchTerm && statusFilter === "all" && (
              <Link href="/dashboard/projects" className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                Przejdź do projektów
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-slate-50 dark:bg-slate-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Data wysłania
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Odbiorca
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Projekt
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Temat
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Akcje
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredLogs.map((log) => (
                  <tr 
                    key={log.id} 
                    className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                  >
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-slate-900 dark:text-slate-100">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {formatDate(log.sent_at)}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {log.recipient_name || "—"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {log.recipient_email}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {log.projects ? (
                        <Link 
                          href={`/dashboard/projects/${log.project_id}`}
                          className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                          {log.projects.name}
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      ) : (
                        <span className="text-sm text-muted-foreground">Usunięty projekt</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-slate-900 dark:text-slate-100 line-clamp-2">
                        {log.subject}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {getStatusBadge(log.status)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {log.projects && (
                          <Button
                            size="sm"
                            asChild
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <Link href={`/dashboard/projects/${log.project_id}`}>
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Otwórz
                            </Link>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(log.id)}
                          disabled={deletingId === log.id}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/30"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Results count */}
      {filteredLogs.length > 0 && (
        <div className="text-sm text-muted-foreground text-center">
          Wyświetlono {filteredLogs.length} z {emailLogs.length} ofert
        </div>
      )}
      <AlertDialog open={!!pendingDeleteId} onOpenChange={(open) => !open && setPendingDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usuń wpis z historii</AlertDialogTitle>
            <AlertDialogDescription>Czy na pewno chcesz usunąć ten wpis z historii wysyłek?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-red-600 hover:bg-red-700 text-white">Usuń</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
