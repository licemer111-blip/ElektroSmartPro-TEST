"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText, Loader2, Trash2, Package, ArrowRight, Clock, TrendingUp,
  Eye, MoreVertical, Edit2, Files,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ProjectTemplate, TemplateItem } from "@/app/dashboard/templates/actions";

export interface TemplateCardProps {
  template: ProjectTemplate;
  onUse: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onRename?: () => void;
  onPreview?: () => void;
  deleting?: boolean;
  duplicating?: boolean;
  formatPrice: (items: TemplateItem[]) => string;
  isOwner?: boolean;
}

export function TemplateCard({
  template,
  onUse,
  onDelete,
  onDuplicate,
  onRename,
  onPreview,
  deleting,
  duplicating,
  formatPrice,
  isOwner,
}: TemplateCardProps) {
  const itemCount = (template.items || []).length;

  return (
    <Card className="group hover:shadow-md transition-all hover:border-blue-200 dark:hover:border-blue-800">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-500 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold truncate">{template.name}</h3>
              {template.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{template.description}</p>
              )}
            </div>
          </div>
          {isOwner && (onDelete || onDuplicate || onRename) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                  disabled={deleting || duplicating}
                >
                  {deleting || duplicating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <MoreVertical className="w-3.5 h-3.5" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {onRename && (
                  <DropdownMenuItem onClick={onRename}>
                    <Edit2 className="w-3.5 h-3.5 mr-2" />
                    Zmień nazwę
                  </DropdownMenuItem>
                )}
                {onDuplicate && (
                  <DropdownMenuItem onClick={onDuplicate}>
                    <Files className="w-3.5 h-3.5 mr-2" />
                    Duplikuj
                  </DropdownMenuItem>
                )}
                {(onRename || onDuplicate) && onDelete && <DropdownMenuSeparator />}
                {onDelete && (
                  <DropdownMenuItem onClick={onDelete} className="text-red-600 focus:text-red-600">
                    <Trash2 className="w-3.5 h-3.5 mr-2" />
                    Usuń
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Badge variant="outline" className="text-[10px]">
            <Package className="w-2.5 h-2.5 mr-1" />
            {itemCount} pozycji
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            VAT {template.vat_rate}%
          </Badge>
          {template.use_count > 0 && (
            <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-200">
              <TrendingUp className="w-2.5 h-2.5 mr-1" />
              Użyto {template.use_count}x
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between mb-2">
          {/* Iron Rule: ceny zawsze widoczne dla właściciela szablonu, blur dla public/free */}
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            {formatPrice(template.items || [])}
          </span>
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" />
            {new Date(template.created_at).toLocaleDateString("pl-PL")}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {onPreview && (
            <Button size="sm" variant="outline" onClick={onPreview} className="h-7 text-xs flex-1 gap-1">
              <Eye className="w-3 h-3" />
              Podgląd
            </Button>
          )}
          <Button
            size="sm"
            onClick={onUse}
            className="h-7 text-xs flex-1 bg-blue-600 hover:bg-blue-700 text-white gap-1"
          >
            <ArrowRight className="w-3 h-3" />
            Użyj
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
