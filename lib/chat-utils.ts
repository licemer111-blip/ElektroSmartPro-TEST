import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";

// ─── Shared types ─────────────────────────────────────────────────────────────

export interface TeamMessage {
  id: string;
  team_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at?: string;
  attachment_url?: string;
  attachment_filename?: string;
  attachment_type?: string;
  attachment_size?: number;
  profiles?: {
    full_name: string | null;
    email: string | null;
  };
}

export interface ParsedAttachment {
  url: string;
  filename: string;
  type: string;
  size: number;
}

// ─── MIME map helper ──────────────────────────────────────────────────────────

const EXT_MIME: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  txt: "text/plain",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
};

// ─── Attachment parsing ───────────────────────────────────────────────────────

export function parseAttachmentFromContent(content: string): {
  cleanContent: string;
  attachment: ParsedAttachment | null;
} {
  // Structured marker: <!--ATTACHMENT:{...}-->
  const structuredMatch = content.match(/<!--ATTACHMENT:([\s\S]*?)-->/);
  if (structuredMatch) {
    try {
      const attachment = JSON.parse(structuredMatch[1]) as ParsedAttachment;
      const cleanContent = content.replace(/\n?<!--ATTACHMENT:[\s\S]*?-->/, "").trim();
      return { cleanContent, attachment };
    } catch {
      // fall through
    }
  }

  // Legacy: 📎 Załącznik: filename\nhttps://...
  const legacyMatch = content.match(/📎\s*Załącznik:\s*(.+?)\n(https?:\/\/\S+)/);
  if (legacyMatch) {
    const filename = legacyMatch[1].trim();
    const url = legacyMatch[2].trim();
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    const cleanContent = content
      .replace(/\n?\n?📎\s*Załącznik:\s*.+?\nhttps?:\/\/\S+/, "")
      .trim();
    return {
      cleanContent,
      attachment: { url, filename, type: EXT_MIME[ext] || "application/octet-stream", size: 0 },
    };
  }

  // Fallback: any Supabase storage URL in content
  const supabaseUrlMatch = content.match(
    /(https?:\/\/[^\s]+supabase[^\s]*\/storage\/[^\s]+)/
  );
  if (supabaseUrlMatch) {
    const url = supabaseUrlMatch[1];
    const parts = url.split("/");
    const filenameFromUrl = parts[parts.length - 1] || "file";
    const ext = filenameFromUrl.split(".").pop()?.toLowerCase() || "";
    const cleanContent = content.replace(url, "").replace(/📎\s*/, "").trim();
    return {
      cleanContent,
      attachment: {
        url,
        filename: filenameFromUrl,
        type: EXT_MIME[ext] || "application/octet-stream",
        size: 0,
      },
    };
  }

  return { cleanContent: content, attachment: null };
}

export function enrichMessageWithAttachment(msg: TeamMessage): TeamMessage {
  if (msg.attachment_url) return msg;
  const { cleanContent, attachment } = parseAttachmentFromContent(msg.content);
  if (attachment) {
    return {
      ...msg,
      content: cleanContent || `📎 ${attachment.filename}`,
      attachment_url: attachment.url,
      attachment_filename: attachment.filename,
      attachment_type: attachment.type,
      attachment_size: attachment.size,
    };
  }
  return msg;
}

// ─── Display helpers ──────────────────────────────────────────────────────────

export function getUserName(message: TeamMessage): string {
  if (message.profiles?.full_name) return message.profiles.full_name;
  if (message.profiles?.email) return message.profiles.email.split("@")[0];
  return "Użytkownik";
}

export function formatTime(dateString: string): string {
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: pl });
  } catch {
    return "";
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isImageAttachment(type?: string): boolean {
  return !!type?.startsWith("image/");
}

export function isPdfAttachment(type?: string): boolean {
  return type === "application/pdf";
}

// ─── File download helper ─────────────────────────────────────────────────────

export async function downloadAttachment(url: string, filename: string): Promise<void> {
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
  } catch {
    window.open(url, "_blank");
  }
}
