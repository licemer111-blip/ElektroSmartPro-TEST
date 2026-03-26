"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, Loader2, Mail, Send } from "lucide-react";
import { deleteSubscriptionInvoice } from "./_actions/invoice-delete";
import { resendInvoiceEmail } from "./_actions/invoice-resend";
import { useRouter } from "next/navigation";

interface InvoiceActionsProps {
  invoiceId: string;
  invoiceNumber: string;
  userEmail: string | null;
}

export function InvoiceActions({ invoiceId, invoiceNumber, userEmail }: InvoiceActionsProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  function showToast(type: "ok" | "err", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleResend() {
    setResending(true);
    const res = await resendInvoiceEmail(invoiceId);
    setResending(false);
    if (res.error) {
      showToast("err", res.error);
    } else {
      showToast("ok", "Faktura wysłana ponownie");
    }
  }

  async function handleDelete() {
    setDeletingId(invoiceId);
    const res = await deleteSubscriptionInvoice(invoiceId);
    setDeletingId(null);
    if (res.error) {
      showToast("err", res.error);
    } else {
      showToast("ok", "Faktura usunięta");
      router.refresh();
    }
  }

  return (
    <div className="flex items-center gap-2 relative flex-shrink-0">
      {/* Toast */}
      {toast && (
        <div
          className={`absolute -top-10 right-0 z-50 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shadow-lg ${
            toast.type === "ok"
              ? "bg-emerald-600 text-white"
              : "bg-rose-600 text-white"
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Email sent indicator */}
      {userEmail && (
        <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
          <Mail className="h-3 w-3 flex-shrink-0" />
          <span className="hidden sm:inline">Wysłano na: {userEmail}</span>
          <span className="sm:hidden">Wysłano</span>
        </span>
      )}

      {/* Resend button */}
      <Button
        size="sm"
        variant="outline"
        className="h-8 text-xs px-2 gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 border-blue-200 dark:border-blue-800"
        onClick={handleResend}
        disabled={resending}
        title="Wyślij ponownie na e-mail"
      >
        {resending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Send className="h-3 w-3" />
        )}
      </Button>

      {/* Delete with confirm */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs px-2 gap-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-200 dark:border-rose-800"
            disabled={deletingId === invoiceId}
            title="Usuń fakturę"
          >
            {deletingId === invoiceId ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Trash2 className="h-3 w-3" />
            )}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usunąć fakturę?</AlertDialogTitle>
            <AlertDialogDescription>
              Faktura <strong>{invoiceNumber}</strong> zostanie usunięta z systemu.
              Tej operacji nie można cofnąć. Dokument w inFakt pozostanie nienaruszony.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-rose-600 hover:bg-rose-700"
            >
              Usuń fakturę
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
