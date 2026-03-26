"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { createTeam } from "@/app/dashboard/team/actions";
import {
  Users, Plus, Loader2, Crown, Shield, Wrench,
  Zap, MessageSquare, Database, BarChart3, ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function CreateTeamCard() {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const router = useRouter();

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Podaj nazwę zespołu");
      return;
    }

    setLoading(true);
    try {
      const result = await createTeam(name, description);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Zespół utworzony!");
        router.refresh();
      }
    } catch {
      toast.error("Wystąpił błąd");
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: <Users className="w-5 h-5 text-blue-500" />,
      title: "Zarządzaj zespołem",
      description: "Zapraszaj elektryków i przypisuj role",
      gradient: "from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20",
    },
    {
      icon: <MessageSquare className="w-5 h-5 text-violet-500" />,
      title: "Czat zespołowy",
      description: "Komunikuj się w czasie rzeczywistym",
      gradient: "from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/20",
    },
    {
      icon: <Database className="w-5 h-5 text-emerald-500" />,
      title: "Wspólny katalog",
      description: "Dziel się pozycjami i zestawami",
      gradient: "from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20",
    },
    {
      icon: <BarChart3 className="w-5 h-5 text-orange-500" />,
      title: "Raporty i statystyki",
      description: "Śledź aktywność i postępy",
      gradient: "from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/20",
    },
  ];

  if (showForm) {
    return (
      <div className="max-w-md mx-auto">
        <div className="rounded-2xl border bg-card p-6 sm:p-8 shadow-sm">
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <Users className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-lg font-bold">Utwórz zespół</h2>
            <p className="text-sm text-muted-foreground">Nazwa będzie widoczna dla wszystkich członków</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="team-name">Nazwa zespołu *</Label>
              <Input
                id="team-name"
                name="team-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="np. ElektroBudowa Sp. z o.o."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && name.trim()) handleCreate();
                }}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team-description">Opis (opcjonalnie)</Label>
              <Textarea
                id="team-description"
                name="team-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Krótki opis zespołu..."
                rows={2}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowForm(false)}
                className="flex-1"
              >
                Anuluj
              </Button>
              <Button
                onClick={handleCreate}
                disabled={loading || !name.trim()}
                className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Tworzenie...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Utwórz
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero section */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-violet-950/20 p-6 sm:p-10">
        {/* Decorative background */}
        <div className="absolute top-0 right-0 w-72 h-72 opacity-[0.05]">
          <Users className="w-full h-full" />
        </div>

        <div className="relative text-center max-w-lg mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
            Pracuj w zespole
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mb-6 leading-relaxed">
            Utwórz zespół, zaproś współpracowników i korzystajcie ze wspólnego katalogu,
            czatu i raportów aktywności.
          </p>
          <Button
            onClick={() => setShowForm(true)}
            size="lg"
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 px-8"
          >
            <Plus className="w-5 h-5 mr-2" />
            Utwórz zespół
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Features grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {features.map((feature, i) => (
          <div
            key={i}
            className={`rounded-xl border p-4 bg-gradient-to-br ${feature.gradient} transition-all hover:shadow-md`}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-background/80 flex items-center justify-center flex-shrink-0 shadow-sm">
                {feature.icon}
              </div>
              <div>
                <h3 className="text-sm font-semibold">{feature.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{feature.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Roles info - compact */}
      <div className="rounded-xl border p-4 bg-card">
        <h3 className="text-sm font-semibold mb-3">Role w zespole</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20">
            <Crown className="w-4 h-4 text-amber-500" />
            <div>
              <p className="text-xs font-medium">Administrator</p>
              <p className="text-[10px] text-muted-foreground">Pełny dostęp</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20">
            <Shield className="w-4 h-4 text-blue-500" />
            <div>
              <p className="text-xs font-medium">Kierownik</p>
              <p className="text-[10px] text-muted-foreground">Projekty + raporty</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
            <Wrench className="w-4 h-4 text-emerald-500" />
            <div>
              <p className="text-xs font-medium">Elektryk</p>
              <p className="text-[10px] text-muted-foreground">Praca nad projektami</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
