"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Star, MessageCircleHeart, ThumbsUp, BarChart3,
  Mail, Clock, Bug, Lightbulb, MessageSquare,
  Archive, Eye, CheckCircle2,
} from "lucide-react";
import type {
  SurveyStats,
  SurveyWithUser,
  FeedbackItem,
} from "@/app/dashboard/feedback/survey-actions";
import { updateFeedbackStatus } from "@/app/dashboard/feedback/survey-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface FeedbackDashboardProps {
  stats: SurveyStats;
  surveys: SurveyWithUser[];
  feedback: FeedbackItem[];
}

const FEEDBACK_TYPE_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  bug: { label: "Bug", icon: <Bug className="w-3.5 h-3.5" />, color: "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400" },
  feature: { label: "Funkcja", icon: <Lightbulb className="w-3.5 h-3.5" />, color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400" },
  contact: { label: "Kontakt", icon: <MessageSquare className="w-3.5 h-3.5" />, color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400" },
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  new: { label: "Nowy", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  read: { label: "Przeczytany", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  archived: { label: "Archiwum", color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
};

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-3.5 h-3.5 ${
            s <= value ? "text-amber-400 fill-amber-400" : "text-slate-300 dark:text-slate-600"
          }`}
        />
      ))}
    </div>
  );
}

function RatingBar({ rating, count, maxCount }: { rating: number; count: number; maxCount: number }) {
  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-3 text-right font-medium">{rating}</span>
      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
      <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-400 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-6 text-right text-muted-foreground">{count}</span>
    </div>
  );
}

export function FeedbackDashboard({ stats, surveys, feedback }: FeedbackDashboardProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const router = useRouter();

  const maxRatingCount = Math.max(...Object.values(stats.ratingDistribution), 1);
  const sortedFeatures = Object.entries(stats.featurePopularity)
    .sort(([, a], [, b]) => b - a);

  const handleStatusChange = async (id: string, status: "new" | "read" | "archived") => {
    setUpdatingId(id);
    try {
      const result = await updateFeedbackStatus(id, status);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Status zaktualizowany");
        router.refresh();
      }
    } catch {
      toast.error("Wystąpił błąd");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <MessageCircleHeart className="w-6 h-6 text-blue-600" />
          Opinie i Ankiety
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Przegląd opinii, ocen i ankiet od użytkowników ElektroSmart
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalSurveys}</p>
                <p className="text-xs text-muted-foreground">Ankiet</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.avgRating || "—"}</p>
                <p className="text-xs text-muted-foreground">Średnia ocena</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <ThumbsUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.npsScore}%</p>
                <p className="text-xs text-muted-foreground">NPS Score</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalFeedback}</p>
                <p className="text-xs text-muted-foreground">Zgłoszeń</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Rating distribution */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Rozkład ocen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[5, 4, 3, 2, 1].map((r) => (
              <RatingBar
                key={r}
                rating={r}
                count={stats.ratingDistribution[r] || 0}
                maxCount={maxRatingCount}
              />
            ))}
          </CardContent>
        </Card>

        {/* Feature popularity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Popularne funkcje</CardTitle>
          </CardHeader>
          <CardContent>
            {sortedFeatures.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Brak danych — ankiety jeszcze nie zostały wypełnione
              </p>
            ) : (
              <div className="space-y-2">
                {sortedFeatures.map(([feature, count]) => {
                  const totalVotes = sortedFeatures.reduce((s, [, c]) => s + c, 0);
                  const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                  return (
                    <div key={feature} className="flex items-center gap-2 text-xs">
                      <span className="w-24 font-medium truncate">{feature}</span>
                      <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-12 text-right text-muted-foreground">
                        {count} ({pct}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Surveys & Feedback */}
      <Tabs defaultValue="surveys" className="space-y-4">
        <TabsList>
          <TabsTrigger value="surveys" className="gap-1.5">
            <Star className="w-3.5 h-3.5" />
            Ankiety ({surveys.length})
          </TabsTrigger>
          <TabsTrigger value="feedback" className="gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" />
            Opinie ({feedback.length})
          </TabsTrigger>
        </TabsList>

        {/* Surveys tab */}
        <TabsContent value="surveys">
          {surveys.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Star className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">Brak ankiet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {surveys.map((s) => (
                <Card key={s.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <StarRating value={s.overall_rating} />
                          <span className="text-sm font-semibold">{s.overall_rating}/5</span>
                          {s.would_recommend === true && (
                            <Badge className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                              Poleca
                            </Badge>
                          )}
                          {s.would_recommend === false && (
                            <Badge className="text-[10px] bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                              Nie poleca
                            </Badge>
                          )}
                          {s.favorite_feature && (
                            <Badge variant="outline" className="text-[10px]">
                              {s.favorite_feature}
                            </Badge>
                          )}
                        </div>
                        {s.improvement_suggestion && (
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            &ldquo;{s.improvement_suggestion}&rdquo;
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {s.user_email || "—"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(s.created_at).toLocaleDateString("pl-PL", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Feedback tab */}
        <TabsContent value="feedback">
          {feedback.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageSquare className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">Brak zgłoszeń</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {feedback.map((f) => {
                const typeInfo = FEEDBACK_TYPE_LABELS[f.type] || FEEDBACK_TYPE_LABELS.contact;
                const statusInfo = STATUS_LABELS[f.status] || STATUS_LABELS.new;
                return (
                  <Card key={f.id} className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={`text-[10px] gap-1 ${typeInfo.color}`}>
                              {typeInfo.icon}
                              {typeInfo.label}
                            </Badge>
                            <Badge className={`text-[10px] ${statusInfo.color}`}>
                              {statusInfo.label}
                            </Badge>
                          </div>
                          <p className="text-sm line-clamp-3">{f.message}</p>
                          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                            {f.contact_email && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {f.contact_email}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(f.created_at).toLocaleDateString("pl-PL", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                        {/* Status actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          {f.status !== "read" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs gap-1"
                              disabled={updatingId === f.id}
                              onClick={() => handleStatusChange(f.id, "read")}
                            >
                              <Eye className="w-3 h-3" />
                              Przeczytane
                            </Button>
                          )}
                          {f.status !== "archived" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs gap-1"
                              disabled={updatingId === f.id}
                              onClick={() => handleStatusChange(f.id, "archived")}
                            >
                              <Archive className="w-3 h-3" />
                              Archiwizuj
                            </Button>
                          )}
                          {f.status === "archived" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs gap-1"
                              disabled={updatingId === f.id}
                              onClick={() => handleStatusChange(f.id, "new")}
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              Przywróć
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
