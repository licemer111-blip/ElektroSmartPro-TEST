"use client";

import { useEffect, useState } from "react";
import { Lightbulb, Zap, TrendingUp, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Suggestion {
  id: string;
  type: "cost" | "material" | "efficiency" | "warning";
  title: string;
  description: string;
  impact: "low" | "medium" | "high";
  action?: {
    label: string;
    onClick: () => void;
  };
  data?: Record<string, string | number>;
}

interface SmartSuggestionsProps {
  projectData: {
    items: { name: string; [key: string]: unknown }[];
    totalCost: number;
    region: string;
    object_type: string;
  };
  onApplySuggestion?: (suggestion: Suggestion) => void;
}

export function SmartSuggestions({ projectData, onApplySuggestion }: SmartSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    analyzeProject();
  }, [projectData]);

  const analyzeProject = async () => {
    setIsAnalyzing(true);
    
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const newSuggestions: Suggestion[] = [];

    // Cost optimization suggestions
    if (projectData.totalCost > 50000) {
      newSuggestions.push({
        id: "bulk-discount",
        type: "cost",
        title: "Potencjalna zniżka hurtowa",
        description: "Przy takiej wartości projektu możesz negocjować zniżki hurtowe u dostawców",
        impact: "high",
        action: {
          label: "Zobacz dostawców",
          onClick: () => {},
        },
      });
    }

    // Material suggestions based on patterns
    const cableCount = projectData.items.filter(item => 
      item.name.toLowerCase().includes("kabel") || 
      item.name.toLowerCase().includes("przewód")
    ).length;

    if (cableCount > 5) {
      newSuggestions.push({
        id: "cable-optimization",
        type: "efficiency",
        title: "Optymalizacja okablowania",
        description: "Możesz zmniejszyć ilość różnych typów kabli o 15% poprzez ustandaryzowanie",
        impact: "medium",
        action: {
          label: "Zoptymalizuj",
          onClick: () => {},
        },
      });
    }

    // Warning for missing items
    const hasGrounding = projectData.items.some(item => 
      item.name.toLowerCase().includes("uziemienie") ||
      item.name.toLowerCase().includes("wyrównawczy")
    );

    if (!hasGrounding) {
      newSuggestions.push({
        id: "missing-grounding",
        type: "warning",
        title: "Brak uzemnienia",
        description: "Pamiętaj o dodaniu przewodów ochronnych i uziemiających",
        impact: "high",
        action: {
          label: "Dodaj pozycje",
          onClick: () => {},
        },
      });
    }

    // Suggest based on region
    if (projectData.region === "mazowieckie") {
      newSuggestions.push({
        id: "warsaw-premium",
        type: "material",
        title: "Materiały premium dla Warszawy",
        description: "W Warszawie klienci często wybierają materiały wyższej jakości",
        impact: "medium",
        action: {
          label: "Zobacz ofertę",
          onClick: () => {},
        },
      });
    }

    // Energy efficiency suggestion
    const hasLED = projectData.items.some(item => 
      item.name.toLowerCase().includes("led")
    );

    if (!hasLED) {
      newSuggestions.push({
        id: "led-upgrade",
        type: "efficiency",
        title: "Modernizacja do LED",
        description: "Zamiana tradycyjnych opraw na LED może zmniejszyć zużycie energii o 60%",
        impact: "high",
        data: {
          savings: "60%",
          roi: "18 miesięcy",
        },
      });
    }

    setSuggestions(newSuggestions);
    setIsAnalyzing(false);
  };

  const getIcon = (type: Suggestion["type"]) => {
    switch (type) {
      case "cost":
        return <TrendingUp className="h-4 w-4" />;
      case "material":
        return <Zap className="h-4 w-4" />;
      case "efficiency":
        return <Lightbulb className="h-4 w-4" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getImpactColor = (impact: Suggestion["impact"]) => {
    switch (impact) {
      case "low":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
    }
  };

  if (isAnalyzing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            ES-Engine analizuje projekt...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Sugestie AI
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Brak sugestii dla tego projektu. Dodaj więcej pozycji aby uzyskać rekomendacje.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Sugestie AI ({suggestions.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className={cn(
              "p-3 rounded-lg border transition-all hover:shadow-md",
              suggestion.type === "warning" && "border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/20"
            )}
          >
            <div className="flex items-start gap-3">
              <div className={cn(
                "p-2 rounded-full",
                suggestion.type === "cost" && "bg-green-100 dark:bg-green-900/20",
                suggestion.type === "material" && "bg-blue-100 dark:bg-blue-900/20",
                suggestion.type === "efficiency" && "bg-purple-100 dark:bg-purple-900/20",
                suggestion.type === "warning" && "bg-orange-100 dark:bg-orange-900/20"
              )}>
                {getIcon(suggestion.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-medium">{suggestion.title}</h4>
                  <Badge className={cn("text-xs", getImpactColor(suggestion.impact))}>
                    {suggestion.impact === "low" && "Niski"}
                    {suggestion.impact === "medium" && "Średni"}
                    {suggestion.impact === "high" && "Wysoki"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {suggestion.description}
                </p>
                
                {suggestion.data && (
                  <div className="flex gap-4 text-xs text-muted-foreground mb-2">
                    {Object.entries(suggestion.data).map(([key, value]) => (
                      <span key={key}>
                        {key}: <strong>{String(value)}</strong>
                      </span>
                    ))}
                  </div>
                )}
                
                {suggestion.action && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      suggestion.action!.onClick();
                      onApplySuggestion?.(suggestion);
                    }}
                    className="text-xs"
                  >
                    {suggestion.action.label}
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
