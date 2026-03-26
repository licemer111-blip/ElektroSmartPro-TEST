"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MessageSquare, RefreshCw, Loader2, Pencil } from "lucide-react";
import {
  sendTeamMessage,
  editTeamMessage,
  deleteTeamMessage,
  sendTeamMessageWithAttachment,
} from "@/app/dashboard/team/chat-actions";
import { toast } from "sonner";
import { useChatRealtime } from "@/hooks/useChatRealtime";
import { ChatMessage } from "@/components/team/chat/ChatMessage";
import { ChatInput } from "@/components/team/chat/ChatInput";
import { AttachmentViewer } from "@/components/team/chat/AttachmentViewer";
import { isImageAttachment, type TeamMessage } from "@/lib/chat-utils";

interface TeamChatProps {
  teamId: string;
  currentUserId: string;
  teamName?: string;
  isOwner?: boolean;
}

interface ViewingFile {
  url: string;
  filename: string;
}

export function TeamChat({ teamId, currentUserId, teamName, isOwner }: TeamChatProps) {
  const { messages, loading, fetchMessages } = useChatRealtime(teamId);

  // Input state
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Edit dialog state
  const [editingMessage, setEditingMessage] = useState<TeamMessage | null>(null);
  const [editContent, setEditContent] = useState("");

  // Attachment viewer state
  const [viewingFile, setViewingFile] = useState<ViewingFile | null>(null);

  // Scroll ref
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Listen for navigation events from AttachmentViewer
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<ViewingFile>).detail;
      setViewingFile(detail);
    };
    window.addEventListener("chat-viewer-navigate", handler);
    return () => window.removeEventListener("chat-viewer-navigate", handler);
  }, []);

  // ─── Upload helper ──────────────────────────────────────────────────────────

  const uploadFileToStorage = async (
    file: File
  ): Promise<{ url: string; filename: string; type: string; size: number } | null> => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("teamId", teamId);
      const response = await fetch("/api/team/upload", { method: "POST", body: formData });
      const result = await response.json();
      if (!response.ok || result.error) {
        toast.error(result.error || "Błąd przesyłania pliku", { duration: 5000 });
        return null;
      }
      return { url: result.url, filename: result.filename, type: result.type, size: result.size };
    } catch {
      toast.error("Błąd połączenia podczas przesyłania pliku");
      return null;
    }
  };

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleSend = async () => {
    if (!newMessage.trim() && !selectedFile) return;
    setSending(true);
    try {
      let attachmentData: { url: string; filename: string; type: string; size: number } | undefined;

      if (selectedFile) {
        setUploading(true);
        const uploaded = await uploadFileToStorage(selectedFile);
        setUploading(false);
        if (!uploaded) { setSending(false); return; }
        attachmentData = uploaded;
      }

      const result = attachmentData
        ? await sendTeamMessageWithAttachment(
            teamId,
            newMessage.trim() || `📎 ${attachmentData.filename}`,
            attachmentData
          )
        : await sendTeamMessage(teamId, newMessage.trim());

      if (result.error) {
        toast.error(result.error);
      } else {
        setNewMessage("");
        setSelectedFile(null);
        fetchMessages();
      }
    } catch {
      toast.error("Wystąpił błąd podczas wysyłania wiadomości");
    } finally {
      setSending(false);
      setUploading(false);
    }
  };

  const handleEdit = async () => {
    if (!editingMessage || !editContent.trim()) return;
    const result = await editTeamMessage(editingMessage.id, editContent);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Wiadomość zaktualizowana");
      setEditingMessage(null);
      setEditContent("");
      fetchMessages();
    }
  };

  const [pendingDeleteMsg, setPendingDeleteMsg] = useState<TeamMessage | null>(null);

  const handleDelete = (message: TeamMessage) => {
    setPendingDeleteMsg(message);
  };

  const executeDelete = async () => {
    if (!pendingDeleteMsg) return;
    const msg = pendingDeleteMsg;
    setPendingDeleteMsg(null);
    const result = await deleteTeamMessage(msg.id, teamId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Wiadomość usunięta");
      fetchMessages();
    }
  };

  const handleFileSelect = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Plik jest zbyt duży (max 10MB)");
      return;
    }
    setSelectedFile(file);
  };

  const handleOpenViewer = (message: TeamMessage) => {
    if (!message.attachment_url) return;
    setViewingFile({
      url: message.attachment_url,
      filename: message.attachment_filename || "Plik",
    });
  };

  const handlePreviewFile = (file: File) => {
    setViewingFile({ url: URL.createObjectURL(file), filename: file.name });
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      toast.success("Plik pobrany");
    } catch {
      window.open(url, "_blank");
    }
  };

  // All messages that have attachments (for viewer navigation)
  const allAttachments = messages.filter((m) => m.attachment_url);
  const imageAttachments = allAttachments.filter((m) => isImageAttachment(m.attachment_type));

  return (
    <Card
      className={`h-[400px] flex flex-col ${
        isOwner !== undefined
          ? isOwner
            ? "border-amber-200 dark:border-amber-800"
            : "border-blue-200 dark:border-blue-800"
          : ""
      }`}
    >
      <CardHeader className="pb-2 px-3 pt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <MessageSquare
              className={`w-4 h-4 flex-shrink-0 ${isOwner ? "text-amber-600" : "text-blue-600"}`}
            />
            <div className="min-w-0">
              <CardTitle className="text-sm font-medium truncate">
                {teamName ? `Czat: ${teamName}` : "Czat zespołu"}
              </CardTitle>
              {isOwner !== undefined && (
                <p className={`text-xs ${isOwner ? "text-amber-600" : "text-blue-600"}`}>
                  {isOwner ? "Twoja drużyna" : "Zaproszony"}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="ghost" size="sm"
            onClick={fetchMessages}
            disabled={loading}
            className="h-7 w-7 p-0"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col overflow-hidden">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          </div>
        ) : (
          <>
            {/* Messages list */}
            <div className="flex-1 overflow-y-auto pr-2" ref={scrollRef}>
              <div className="space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p>Brak wiadomości. Rozpocznij rozmowę!</p>
                    <p className="text-xs mt-1">Możesz też przesyłać pliki i zdjęcia</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      currentUserId={currentUserId}
                      onEdit={(msg) => { setEditingMessage(msg); setEditContent(msg.content); }}
                      onDelete={handleDelete}
                      onOpenViewer={handleOpenViewer}
                      onDownload={handleDownload}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Input area */}
            <ChatInput
              value={newMessage}
              onChange={setNewMessage}
              onSend={handleSend}
              onFileSelect={handleFileSelect}
              onRemoveFile={() => setSelectedFile(null)}
              onPreviewFile={handlePreviewFile}
              selectedFile={selectedFile}
              sending={sending}
              uploading={uploading}
            />
          </>
        )}
      </CardContent>

      {/* Edit dialog */}
      <Dialog open={!!editingMessage} onOpenChange={() => setEditingMessage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5" /> Edytuj wiadomość
            </DialogTitle>
          </DialogHeader>
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={4}
            className="mt-2"
          />
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setEditingMessage(null)}>Anuluj</Button>
            <Button
              onClick={handleEdit}
              disabled={!editContent.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Zapisz
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Attachment viewer */}
      <AttachmentViewer
        viewing={viewingFile}
        onClose={() => setViewingFile(null)}
        allAttachments={imageAttachments}
      />
      <AlertDialog open={!!pendingDeleteMsg} onOpenChange={(open) => !open && setPendingDeleteMsg(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usuń wiadomość</AlertDialogTitle>
            <AlertDialogDescription>Czy na pewno chcesz usunąć tę wiadomość?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-red-600 hover:bg-red-700 text-white">Usuń</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
