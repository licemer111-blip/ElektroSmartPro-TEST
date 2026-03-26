"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircleHeart, X, Star, Send, Loader2,
  CheckCircle2, ThumbsUp, ThumbsDown,
} from "lucide-react";
import { submitSurvey, shouldShowSurvey } from "@/app/dashboard/feedback/survey-actions";
import { cn } from "@/lib/utils";

const FEATURE_OPTIONS = [
  "Kreator",
  "ES Import",
  "Szybka Wycena",
  "Kalkulatory",
  "Katalog",
  "Zestawy",
  "Szablony",
  "Zespół",
  "Inne",
];

const DISMISS_KEY = "survey_dismissed_at";
const SESSION_HIDE_KEY = "survey_hidden_session";

export function SurveyWidget() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form state
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [favoriteFeature, setFavoriteFeature] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);

  useEffect(() => {
    checkVisibility();
  }, []);

  const checkVisibility = async () => {
    // Check session dismiss
    if (typeof window !== "undefined") {
      if (sessionStorage.getItem(SESSION_HIDE_KEY)) return;

      // Check 7-day dismiss
      const dismissedAt = localStorage.getItem(DISMISS_KEY);
      if (dismissedAt) {
        const dismissed = new Date(dismissedAt);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        if (dismissed > sevenDaysAgo) return;
      }
    }

    try {
      const show = await shouldShowSurvey();
      if (show) {
        // Small delay before showing to avoid layout shift on page load
        setTimeout(() => setVisible(true), 3000);
      }
    } catch {
      // Silently fail
    }
  };

  const handleDismiss = () => {
    setExpanded(false);
    setVisible(false);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(SESSION_HIDE_KEY, "1");
      localStorage.setItem(DISMISS_KEY, new Date().toISOString());
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    try {
      const result = await submitSurvey({
        overall_rating: rating,
        favorite_feature: favoriteFeature || undefined,
        improvement_suggestion: suggestion || undefined,
        would_recommend: wouldRecommend ?? undefined,
      });

      if (result.success) {
        setSubmitted(true);
        setTimeout(() => {
          setExpanded(false);
          setVisible(false);
        }, 2500);
      }
    } catch {
      // Silently fail
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
      {/* Expanded survey panel */}
      {expanded ? (
        <div className="w-[340px] sm:w-[380px] max-h-[85vh] overflow-y-auto rounded-2xl border border-border bg-background shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-300">
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between p-4 pb-3 border-b bg-background rounded-t-2xl">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <MessageCircleHeart className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold">Twoja opinia</h3>
                <p className="text-[10px] text-muted-foreground">Pomóż nam ulepszać ElektroSmart</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleDismiss}
              aria-label="Zamknij ankietę"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {submitted ? (
            /* Thank you state */
            <div className="p-6 text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-green-600 dark:text-green-400" />
              </div>
              <h4 className="text-base font-bold">Dziękujemy!</h4>
              <p className="text-sm text-muted-foreground">
                Twoja opinia jest dla nas bardzo cenna. Pracujemy nad ciągłym ulepszaniem ElektroSmart.
              </p>
            </div>
          ) : (
            /* Survey form */
            <div className="p-4 space-y-4">
              {/* Star rating */}
              <div className="space-y-2">
                <label className="text-sm font-semibold">
                  Jak oceniasz ElektroSmart? <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      className="p-0.5 transition-transform hover:scale-110"
                      aria-label={`Ocena ${star} z 5`}
                    >
                      <Star
                        className={cn(
                          "w-7 h-7 transition-colors",
                          (hoveredStar || rating) >= star
                            ? "text-amber-400 fill-amber-400"
                            : "text-slate-300 dark:text-slate-600"
                        )}
                      />
                    </button>
                  ))}
                  {rating > 0 && (
                    <span className="ml-2 text-sm font-medium text-muted-foreground">
                      {rating}/5
                    </span>
                  )}
                </div>
              </div>

              {/* Favorite feature */}
              <div className="space-y-2">
                <label className="text-sm font-semibold">
                  Ulubiona funkcja?
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {FEATURE_OPTIONS.map((feature) => (
                    <Badge
                      key={feature}
                      variant={favoriteFeature === feature ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer text-xs transition-all",
                        favoriteFeature === feature
                          ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                          : "hover:bg-muted"
                      )}
                      onClick={() =>
                        setFavoriteFeature(favoriteFeature === feature ? "" : feature)
                      }
                    >
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Would recommend */}
              <div className="space-y-2">
                <label className="text-sm font-semibold">
                  Poleciłbyś ElektroSmart innym?
                </label>
                <div className="flex gap-2">
                  <Button
                    variant={wouldRecommend === true ? "default" : "outline"}
                    size="sm"
                    onClick={() => setWouldRecommend(wouldRecommend === true ? null : true)}
                    className={cn(
                      "flex-1 gap-1.5",
                      wouldRecommend === true && "bg-green-600 hover:bg-green-700 text-white border-green-600"
                    )}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    Tak
                  </Button>
                  <Button
                    variant={wouldRecommend === false ? "default" : "outline"}
                    size="sm"
                    onClick={() => setWouldRecommend(wouldRecommend === false ? null : false)}
                    className={cn(
                      "flex-1 gap-1.5",
                      wouldRecommend === false && "bg-red-500 hover:bg-red-600 text-white border-red-500"
                    )}
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                    Nie
                  </Button>
                </div>
              </div>

              {/* Improvement suggestion */}
              <div className="space-y-2">
                <label htmlFor="survey-suggestion" className="text-sm font-semibold">
                  Co możemy poprawić?
                </label>
                <Textarea
                  id="survey-suggestion"
                  name="survey-suggestion"
                  aria-label="Sugestie dotyczące ulepszen"
                  value={suggestion}
                  onChange={(e) => setSuggestion(e.target.value.slice(0, 500))}
                  placeholder="Opisz swoje pomysły lub uwagi..."
                  className="min-h-[70px] text-sm resize-none"
                />
                <p className="text-[10px] text-muted-foreground text-right">
                  {suggestion.length}/500
                </p>
              </div>

              {/* Submit */}
              <Button
                onClick={handleSubmit}
                disabled={rating === 0 || submitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Wysyłanie...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Wyślij opinię
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* Collapsed bubble */
        <button
          onClick={() => setExpanded(true)}
          className="group relative w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all hover:scale-110 active:scale-95 flex items-center justify-center"
          aria-label="Oceń ElektroSmart"
        >
          <MessageCircleHeart className="w-5 h-5" />
          {/* Pulse animation */}
          <span className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-20" />
        </button>
      )}
    </div>
  );
}
