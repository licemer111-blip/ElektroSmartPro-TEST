"use client";

import { useState } from "react";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";
import { useAnalytics } from "@/hooks/use-analytics";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PageContainer } from "@/components/layout/page-container";

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<"week" | "month" | "quarter" | "year">("month");
  const { data, loading, error, refresh } = useAnalytics(timeRange);

  if (loading) {
    return (
      <PageContainer maxWidth="xl">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer maxWidth="xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Nie udało się załadować analityki: {error}
            <button
              onClick={refresh}
              className="ml-2 underline hover:no-underline"
            >
              Spróbuj ponownie
            </button>
          </AlertDescription>
        </Alert>
      </PageContainer>
    );
  }

  if (!data) {
    return (
      <PageContainer maxWidth="xl">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Brak danych analitycznych. Zacznij tworzyć projekty, aby zobaczyć statystyki.
          </AlertDescription>
        </Alert>
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="xl">
      <AnalyticsDashboard
        data={data}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
      />
    </PageContainer>
  );
}
