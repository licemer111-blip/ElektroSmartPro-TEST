"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  ArrowLeft, Edit, Building2, User, Mail, Phone, MapPin, 
  FileText, TrendingUp, Calendar, Tag, FolderOpen, ExternalLink
} from "lucide-react";
import type { ClientWithProjects, ProjectWithRelations } from "@/lib/types/database";
import { ClientDialog } from "@/components/clients/client-dialog";
import { ClientInteractionLog } from "@/components/clients/client-interaction-log";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ClientDetailsClientProps {
  client: ClientWithProjects;
}

const TAG_COLORS: Record<string, string> = {
  vip: "bg-amber-500",
  regular: "bg-blue-500",
  problematic: "bg-red-500",
  new: "bg-green-500",
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "Wersja robocza", color: "bg-amber-500" },
  final: { label: "Ukończony", color: "bg-green-500" },
  archived: { label: "Zarchiwizowany", color: "bg-slate-500" },
};

export function ClientDetailsClient({ client }: ClientDetailsClientProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const router = useRouter();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pl-PL", {
      style: "currency",
      currency: "PLN",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pl-PL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Wróć do listy klientów">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              client.type === "company" ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"
            }`}>
              {client.type === "company" ? (
                <Building2 className="w-6 h-6" />
              ) : (
                <User className="w-6 h-6" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{client.name}</h1>
              {client.company_name && (
                <p className="text-muted-foreground">{client.company_name}</p>
              )}
            </div>
          </div>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <Edit className="w-4 h-4 mr-2" />
          Edytuj
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Client Info */}
        <div className="space-y-6">
          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dane kontaktowe</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {client.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <a href={`mailto:${client.email}`} className="text-blue-600 hover:underline">
                    {client.email}
                  </a>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <a href={`tel:${client.phone}`} className="hover:underline">
                    {client.phone}
                  </a>
                </div>
              )}
              {(client.address || client.city) && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    {client.address && <p>{client.address}</p>}
                    {client.city && (
                      <p className="text-muted-foreground">
                        {client.postal_code} {client.city}
                      </p>
                    )}
                  </div>
                </div>
              )}
              {!client.email && !client.phone && !client.address && (
                <p className="text-muted-foreground text-sm">Brak danych kontaktowych</p>
              )}
            </CardContent>
          </Card>

          {/* Business Info */}
          {client.type === "company" && (client.nip || client.regon) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dane firmowe</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {client.nip && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">NIP</span>
                    <span className="font-mono">{client.nip}</span>
                  </div>
                )}
                {client.regon && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">REGON</span>
                    <span className="font-mono">{client.regon}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Tagi
              </CardTitle>
            </CardHeader>
            <CardContent>
              {client.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {client.tags.map((tag) => (
                    <Badge 
                      key={tag}
                      className={`${TAG_COLORS[tag] || "bg-slate-500"} text-white`}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Brak tagów</p>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {client.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Notatki
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{client.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Statystyki
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Projekty</span>
                <span className="font-bold">{client.total_projects}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Łączna wartość</span>
                <span className="font-bold text-blue-600">
                  {formatCurrency(client.total_revenue)}
                </span>
              </div>
              {client.last_project_date && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ostatni projekt</span>
                  <span className="text-sm">{formatDate(client.last_project_date)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Klient od</span>
                <span className="text-sm">{formatDate(client.created_at)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Interaction Log */}
          <ClientInteractionLog clientId={client.id} clientName={client.name} />
        </div>

        {/* Right Column - Projects */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="w-5 h-5" />
                  Projekty klienta ({client.projects?.length || 0})
                </CardTitle>
                <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <Link href={`/dashboard/projects?client=${client.id}`}>
                    Nowy projekt
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!client.projects || client.projects.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Brak projektów dla tego klienta</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Projekt</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {client.projects.map((project: ProjectWithRelations) => (
                      <TableRow key={project.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{project.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {project.regions?.name || "Polska"} • {project.object_types?.name || "Standard"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${STATUS_LABELS[project.status]?.color} text-white`}>
                            {STATUS_LABELS[project.status]?.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(project.created_at)}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" asChild aria-label="Otwórz projekt">
                            <Link href={`/dashboard/projects/${project.id}`}>
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <ClientDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) router.refresh();
        }}
        client={client}
      />
    </div>
  );
}
