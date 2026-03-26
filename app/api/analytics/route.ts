import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") || "30d";

  // Determine how many data points based on range
  const days = range === "7d" ? 7 : range === "14d" ? 14 : range === "90d" ? 90 : 30;

  const salesChart = Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    return {
      date: date.toISOString().split("T")[0],
      value: Math.round(Math.random() * 5000 + 1000),
    };
  });

  return NextResponse.json({
    totalRevenue: 42150,
    activeProjects: 8,
    completedProjects: 23,
    salesChart,
  });
}
