"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  BarChart3, TrendingUp, FolderOpen, CheckCircle, FileText,
  Users, Package, DollarSign, Activity, ArrowUpRight
} from "lucide-react";
import type { AnalyticsData } from "./actions";
import Link from "next/link";

interface AnalyticsDashboardProps {
  data: AnalyticsData;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "Wersja robocza", color: "bg-amber-500" },
  final: { label: "Ukończony", color: "bg-green-500" },
  archived: { label: "Zarchiwizowany", color: "bg-slate-500" },
};

export function AnalyticsDashboard({ data }: AnalyticsDashboardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pl-PL", {
      style: "currency",
      currency: "PLN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pl-PL", {
      day: "numeric",
      month: "short",
    });
  };

  // Calculate max revenue for chart scaling
  const maxRevenue = Math.max(...data.monthlyRevenue.map(m => m.revenue), 1);

  return (
    <div className="min-h-screen py-6 md:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 md:p-3 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/20">
          <BarChart3 className="w-5 h-5 md:w-6 md:h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Analityka
          </h1>
          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400">
            Przegląd wyników i statystyk Twojej działalności
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Wszystkie projekty</p>
                <p className="text-2xl sm:text-3xl font-bold">{data.totalProjects}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <FolderOpen className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm">
              <Badge variant="outline" className="text-green-600 border-green-300">
                {data.activeProjects} aktywnych
              </Badge>
              <Badge variant="outline" className="text-blue-600 border-blue-300">
                {data.completedProjects} ukończonych
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Łączna wartość</p>
                <p className="text-2xl sm:text-3xl font-bold text-blue-600">{formatCurrency(data.totalRevenue)}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Z ukończonych projektów
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Średnia wartość</p>
                <p className="text-2xl sm:text-3xl font-bold">{formatCurrency(data.avgProjectValue)}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-amber-600" />
              </div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Na projekt
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ukończone</p>
                <p className="text-2xl sm:text-3xl font-bold text-green-600">{data.completedProjects}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {data.totalProjects > 0 
                ? `${Math.round((data.completedProjects / data.totalProjects) * 100)}% wszystkich`
                : "Brak projektów"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Przychody miesięczne
            </CardTitle>
            <CardDescription>Wartość ukończonych projektów (ostatnie 6 miesięcy)</CardDescription>
          </CardHeader>
          <CardContent>
            {data.monthlyRevenue.length > 0 ? (
              <div className="space-y-4">
                {data.monthlyRevenue.map((month, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{month.month}</span>
                      <span className="text-muted-foreground">
                        {formatCurrency(month.revenue)} ({month.projects} proj.)
                      </span>
                    </div>
                    <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${(month.revenue / maxRevenue) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Brak danych</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Clients */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-green-600" />
              Top klienci
            </CardTitle>
            <CardDescription>Według wartości projektów</CardDescription>
          </CardHeader>
          <CardContent>
            {data.topClients.length > 0 ? (
              <div className="space-y-4">
                {data.topClients.map((client, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                        index === 0 ? "bg-amber-500" : index === 1 ? "bg-slate-400" : index === 2 ? "bg-amber-700" : "bg-blue-500"
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{client.name}</p>
                        <p className="text-sm text-muted-foreground">{client.projects} projektów</p>
                      </div>
                    </div>
                    <p className="font-bold text-blue-600">{formatCurrency(client.revenue)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Brak danych o klientach</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-600" />
              Najpopularniejsze pozycje
            </CardTitle>
            <CardDescription>Najczęściej używane materiały i usługi</CardDescription>
          </CardHeader>
          <CardContent>
            {data.topItems.length > 0 ? (
              <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pozycja</TableHead>
                    <TableHead className="text-center">Ilość</TableHead>
                    <TableHead className="text-right">Wartość</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.topItems.slice(0, 5).map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium max-w-[150px] sm:max-w-[200px] truncate">
                        {item.name}
                      </TableCell>
                      <TableCell className="text-center">{item.count}</TableCell>
                      <TableCell className="text-right text-blue-600">
                        {formatCurrency(item.revenue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Brak danych</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Projects */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              Ostatnie projekty
            </CardTitle>
            <CardDescription>Twoje najnowsze projekty</CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentProjects.length > 0 ? (
              <div className="space-y-3">
                {data.recentProjects.map((project) => (
                  <Link 
                    key={project.id} 
                    href={`/dashboard/projects/${project.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium group-hover:text-blue-600 transition-colors">
                          {project.name}
                        </p>
                        <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-blue-600" />
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={`${STATUS_LABELS[project.status]?.color} text-white text-xs`}>
                          {STATUS_LABELS[project.status]?.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(project.created_at)}
                        </span>
                      </div>
                    </div>
                    <p className="font-bold text-blue-600">{formatCurrency(project.total)}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Brak projektów</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}
