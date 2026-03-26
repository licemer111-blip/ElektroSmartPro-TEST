"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical, Pencil, Trash2, ZoomIn, Download,
  ExternalLink, FileText, File, Eye,
} from "lucide-react";
import {
  getUserName,
  formatTime,
  formatFileSize,
  isImageAttachment,
  isPdfAttachment,
  type TeamMessage,
} from "@/lib/chat-utils";

interface ChatMessageProps {
  message: TeamMessage;
  currentUserId: string;
  onEdit: (message: TeamMessage) => void;
  onDelete: (message: TeamMessage) => void;
  onOpenViewer: (message: TeamMessage) => void;
  onDownload: (url: string, filename: string) => void;
}

function ChatMessageInner({
  message,
  currentUserId,
  onEdit,
  onDelete,
  onOpenViewer,
  onDownload,
}: ChatMessageProps) {
  const isOwn = message.user_id === currentUserId;
  const isEdited = message.updated_at && message.updated_at !== message.created_at;
  const userName = getUserName(message);
  const userInitial = userName.charAt(0).toUpperCase();

  const renderAttachment = () => {
    if (!message.attachment_url) return null;

    if (isImageAttachment(message.attachment_type)) {
      return (
        <div className="mt-2 relative group/attachment">
          <div className="cursor-pointer relative" onClick={() => onOpenViewer(message)}>
            <img
              src={message.attachment_url}
              alt={message.attachment_filename || "Obrazek"}
              className="max-w-[200px] max-h-[200px] rounded-lg object-cover hover:opacity-90 transition-opacity"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/attachment:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
              <Button
                size="sm" variant="secondary" className="h-8 w-8 p-0"
                onClick={(e) => { e.stopPropagation(); onOpenViewer(message); }}
                title="Powiększ"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                size="sm" variant="secondary" className="h-8 w-8 p-0"
                onClick={(e) => { e.stopPropagation(); onDownload(message.attachment_url!, message.attachment_filename || "image"); }}
                title="Pobierz"
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button
                size="sm" variant="secondary" className="h-8 w-8 p-0"
                onClick={(e) => { e.stopPropagation(); window.open(message.attachment_url, "_blank"); }}
                title="Otwórz w nowej karcie"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </div>
          {message.attachment_filename && (
            <div className={`text-[10px] mt-1 truncate max-w-[200px] ${isOwn ? "text-indigo-200" : "text-muted-foreground"}`}>
              {message.attachment_filename}
            </div>
          )}
        </div>
      );
    }

    const isPdf = isPdfAttachment(message.attachment_type);
    const fileExt = message.attachment_filename?.split(".").pop()?.toUpperCase() || "FILE";

    return (
      <div className="mt-2 rounded-lg overflow-hidden bg-white/90 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 shadow-sm">
        <button
          className="w-full flex items-center gap-3 p-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
          onClick={() => onOpenViewer(message)}
          title="Kliknij aby podejrzeć"
        >
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isPdf ? "bg-red-500/15 text-red-500" : "bg-blue-500/15 text-blue-500"}`}>
            {isPdf ? <FileText className="w-5 h-5" /> : <File className="w-5 h-5" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium truncate text-slate-900 dark:text-slate-100">
              {message.attachment_filename}
            </div>
            <div className="text-xs flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${isPdf ? "bg-red-500/15 text-red-500" : "bg-blue-500/15 text-blue-500"}`}>
                {fileExt}
              </span>
              {message.attachment_size ? <span>{formatFileSize(message.attachment_size)}</span> : null}
            </div>
          </div>
          <Eye className="w-4 h-4 flex-shrink-0 text-slate-400" />
        </button>
        <div className="flex border-t border-slate-200 dark:border-slate-600">
          <button
            className="flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            onClick={() => onOpenViewer(message)}
          >
            <Eye className="w-3.5 h-3.5" /> Podgląd
          </button>
          <button
            className="flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1.5 border-l border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            onClick={() => onDownload(message.attachment_url!, message.attachment_filename || "file")}
          >
            <Download className="w-3.5 h-3.5" /> Pobierz
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={`flex ${isOwn ? "flex-row-reverse" : "flex-row"} gap-2 group`}>
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-semibold ${
          isOwn
            ? "bg-gradient-to-br from-indigo-500 to-purple-600"
            : "bg-gradient-to-br from-blue-500 to-cyan-600"
        }`}
        title={userName}
      >
        {userInitial}
      </div>

      <div className="relative max-w-[75%]">
        {/* Sender name */}
        <div className={`text-xs font-medium mb-1 ${isOwn ? "text-right" : "text-left"} ${isOwn ? "text-indigo-600 dark:text-indigo-400" : "text-blue-600 dark:text-blue-400"}`}>
          {isOwn ? "Ty" : userName}
        </div>

        <div className={`rounded-lg p-3 ${isOwn ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800"}`}>
          {message.content && !(message.attachment_url && /^📎\s/.test(message.content)) && (
            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
          )}
          {renderAttachment()}
          <div className={`text-xs mt-1 flex items-center gap-1 ${isOwn ? "text-indigo-200 justify-end" : "text-muted-foreground"}`}>
            {formatTime(message.created_at)}
            {isEdited && <span>(edytowano)</span>}
          </div>
        </div>

        {/* Actions — own messages only */}
        {isOwn && (
          <div className="absolute -left-8 top-6 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreVertical className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(message)}>
                  <Pencil className="w-4 h-4 mr-2" /> Edytuj
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600" onClick={() => onDelete(message)}>
                  <Trash2 className="w-4 h-4 mr-2" /> Usuń
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </div>
  );
}

export const ChatMessage = React.memo(ChatMessageInner);
