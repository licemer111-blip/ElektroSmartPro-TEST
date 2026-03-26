"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle, XCircle, Info, Bell, Clock, ExternalLink, X, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { deleteNotification, clearAllNotifications } from "@/app/dashboard/actions";
import { useToast } from "@/hooks/use-toast";

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  action_url?: string;
  data?: Record<string, unknown>;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "teraz";
  if (mins < 60) return `${mins} min temu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h temu`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d temu`;
  return new Date(dateStr).toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
}

function getIcon(type: string) {
  switch (type) {
    case "success":
      return <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />;
    case "error":
      return <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />;
    case "warning":
      return <Clock className="h-4 w-4 text-amber-500 flex-shrink-0" />;
    default:
      return <Info className="h-4 w-4 text-blue-500 flex-shrink-0" />;
  }
}

function getBadge(title: string) {
  const lower = title.toLowerCase();
  if (lower.includes("zaakceptow") || lower.includes("accept")) {
    return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px] px-1.5 py-0">Akceptacja</Badge>;
  }
  if (lower.includes("odrzuc") || lower.includes("reject")) {
    return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px] px-1.5 py-0">Odrzucenie</Badge>;
  }
  if (lower.includes("podpis") || lower.includes("sign")) {
    return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-[10px] px-1.5 py-0">Podpis</Badge>;
  }
  return <Badge variant="outline" className="text-[10px] px-1.5 py-0">Info</Badge>;
}

export function ClientActivityWidget({ activities: initialActivities }: { activities: ActivityItem[] }) {
  const [activities, setActivities] = useState(initialActivities);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleDelete = (id: string) => {
    setActivities(prev => prev.filter(a => a.id !== id));
    startTransition(async () => {
      const result = await deleteNotification(id);
      if (!result.success) {
        setActivities(initialActivities);
        toast({ title: "Błąd", description: result.error || "Nie udało się usunąć powiadomienia", variant: "destructive" });
      }
    });
  };

  const handleClearAll = () => {
    setActivities([]);
    startTransition(async () => {
      const result = await clearAllNotifications();
      if (!result.success) {
        setActivities(initialActivities);
        toast({ title: "Błąd", description: result.error || "Nie udało się wyczyścić powiadomień", variant: "destructive" });
      }
    });
  };

  if (activities.length === 0) {
    return (
      <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-600/10 dark:bg-blue-500/15">
              <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-base text-slate-900 dark:text-slate-100">
              Aktywność klientów
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center py-6">
            <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Brak aktywności
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Tutaj zobaczysz gdy klient zaakceptuje lub odrzuci ofertę
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const unreadCount = activities.filter(a => !a.read).length;

  return (
    <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-600/10 dark:bg-blue-500/15">
              <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-base text-slate-900 dark:text-slate-100">
              Aktywność klientów
            </CardTitle>
            {unreadCount > 0 && (
              <Badge className="bg-blue-600 text-white text-[10px] px-1.5 py-0">
                {unreadCount} nowe
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-[10px] text-slate-500 hover:text-red-600 gap-1"
            onClick={handleClearAll}
            disabled={isPending}
          >
            <Trash2 className="w-3 h-3" />
            Wyczyść wszystko
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="max-h-[280px] overflow-y-auto space-y-1 pr-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
          {activities.map((item) => (
            <div
              key={item.id}
              className={cn(
                "group flex items-start gap-2.5 p-2.5 rounded-lg transition-colors relative",
                !item.read
                  ? "bg-blue-50/70 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30"
                  : "hover:bg-slate-50 dark:hover:bg-slate-800/30"
              )}
            >
              <div className="mt-0.5">{getIcon(item.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {item.title}
                  </span>
                  {getBadge(item.title)}
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">
                  {item.message}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                    {timeAgo(item.created_at)}
                  </span>
                  {item.action_url && (
                    <Link
                      href={item.action_url}
                      className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
                    >
                      Otwórz
                      <ExternalLink className="w-2.5 h-2.5" />
                    </Link>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDelete(item.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 flex-shrink-0"
                title="Usuń powiadomienie"
                disabled={isPending}
              >
                <X className="w-3.5 h-3.5" />
              </button>
              {!item.read && (
                <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
              )}
            </div>
          ))}
        </div>
        {activities.length > 3 && (
          <div className="text-center mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-400">{activities.length} powiadomień</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
