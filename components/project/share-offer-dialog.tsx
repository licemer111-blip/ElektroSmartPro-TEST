"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Link2,
  Copy,
  Check,
  Loader2,
  ExternalLink,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Share2,
  QrCode,
  ArrowLeftRight,
  Send,
  BookOpen,
  Timer,
  Palette,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { createOfferLink, getOfferLinks, deleteOfferLink } from "@/app/dashboard/projects/[id]/offer-link-actions";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { NegotiationReviewDialog } from "@/components/project/negotiation-review-dialog";

interface ShareOfferDialogProps {
  projectId: string;
  projectName?: string;
  clientName?: string | null;
  clientEmail?: string | null;
  disabled?: boolean;
  projectTotal?: number;
  userProfile?: {
    full_name?: string;
    company_name?: string;
    phone?: string;
    email?: string;
  };
}

interface OfferLink {
  id: string;
  token: string;
  recipient_name: string | null;
  recipient_email: string | null;
  status: string;
  viewed_at: string | null;
  signed_at: string | null;
  responded_at: string | null;
  created_at: string;
  proposed_changes: Record<string, unknown> | null;
  negotiation_round: number;
}

export function ShareOfferDialog({ projectId, projectName, clientName, clientEmail, disabled, projectTotal, userProfile }: ShareOfferDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [links, setLinks] = useState<OfferLink[]>([]);
  const [name, setName] = useState(clientName || "");
  const [email, setEmail] = useState(clientEmail || "");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [portalShowKnr, setPortalShowKnr] = useState(false);
  const [portalShowRg, setPortalShowRg] = useState(false);
  const [portalShowColors, setPortalShowColors] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleSendEmail = async (url: string, recipientEmail: string, recipientName: string) => {
    if (!recipientEmail) {
      toast({ title: "Brak adresu email", description: "Wpisz email klienta, aby wysłać wiadomość", variant: "destructive" });
      return;
    }
    setSendingEmail(true);
    try {
      const res = await fetch("/api/send-offer-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: recipientEmail, name: recipientName, offerUrl: url }),
      });
      if (res.ok) {
        toast({ title: "✅ Email wysłany!", description: `Oferta wysłana na ${recipientEmail}` });
      } else {
        const data = await res.json().catch(() => ({}));
        toast({ title: "Błąd", description: data.error || "Nie udało się wysłać emaila", variant: "destructive" });
      }
    } catch {
      toast({ title: "Błąd", description: "Nie udało się wysłać emaila", variant: "destructive" });
    }
    setSendingEmail(false);
  };

  const loadLinks = async () => {
    setLoading(true);
    const data = await getOfferLinks(projectId);
    setLinks(data as OfferLink[]);
    setLoading(false);
  };

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      loadLinks();
      setGeneratedUrl(null);
    }
  };

  const handleCreate = async () => {
    setCreating(true);
    const result = await createOfferLink(projectId, name, email, {
      showKnr: portalShowKnr,
      showRg: portalShowRg,
      showColors: portalShowColors,
    });
    if (result.error) {
      toast({ title: "Błąd", description: result.error, variant: "destructive" });
    } else if (result.url) {
      setGeneratedUrl(result.url);
      toast({ title: "✅ Link utworzony", description: "Skopiuj i wyślij klientowi" });
      loadLinks();
    }
    setCreating(false);
  };

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast({ title: "Skopiowano!", description: "Link skopiowany do schowka" });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (linkId: string) => {
    const result = await deleteOfferLink(linkId);
    if (result.error) {
      toast({ title: "Błąd", description: result.error, variant: "destructive" });
    } else {
      setLinks(prev => prev.filter(l => l.id !== linkId));
    }
  };

  const getStatusBadge = (link: OfferLink) => {
    switch (link.status) {
      case "accepted":
        return <Badge className="text-[9px] bg-green-100 text-green-700 gap-0.5 px-1.5"><CheckCircle2 className="w-2.5 h-2.5" />Zaakceptowana</Badge>;
      case "rejected":
        return <Badge className="text-[9px] bg-red-100 text-red-700 gap-0.5 px-1.5"><XCircle className="w-2.5 h-2.5" />Odrzucona</Badge>;
      case "negotiating":
        return <Badge className="text-[9px] bg-orange-100 text-orange-700 gap-0.5 px-1.5"><ArrowLeftRight className="w-2.5 h-2.5" />Negocjacja</Badge>;
      case "viewed":
        return <Badge className="text-[9px] bg-blue-100 text-blue-700 gap-0.5 px-1.5"><Eye className="w-2.5 h-2.5" />Wyświetlona</Badge>;
      default:
        return <Badge variant="outline" className="text-[9px] gap-0.5 px-1.5"><Clock className="w-2.5 h-2.5" />Oczekuje</Badge>;
    }
  };

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className={cn(
            "h-7 sm:h-8 text-[11px] sm:text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white border-0 flex-shrink-0 rounded-md transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/40",
            !disabled && "shadow-[0_0_12px_rgba(59,130,246,0.6)] ring-1 ring-blue-400/50"
          )}
          disabled={disabled}
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Portal klienta</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Share2 className="w-5 h-5 text-blue-600" />
            Udostępnij ofertę klientowi
          </DialogTitle>
          <DialogDescription className="sr-only">
            Generowanie i zarządzanie linkami do portalu klienta.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Shared inputs */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="offer-client-name" className="text-[10px] text-slate-500">Imię klienta</Label>
              <Input
                id="offer-client-name"
                name="offer-client-name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Jan Kowalski"
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label htmlFor="offer-client-email" className="text-[10px] text-slate-500">Email klienta</Label>
              <Input
                id="offer-client-email"
                name="offer-client-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="jan@example.com"
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* Portal link option */}
          <div className="p-3 rounded-xl border-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900">
                <Link2 className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Portal klienta</p>
                <p className="text-[10px] text-slate-500">Link interaktywny</p>
              </div>
            </div>
            <ul className="text-[10px] text-slate-500 space-y-0.5 pl-1">
              <li>• Kosztorys online + portfolio</li>
              <li>• Akceptacja / odrzucenie</li>
              <li>• Podpis elektroniczny</li>
            </ul>

            {/* Ustawienia widoku portalu */}
            <div className="border-t border-blue-200/60 dark:border-blue-800/40 pt-2.5 space-y-2">
              <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Ustawienia widoku</p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
                  <div>
                    <p className="text-[11px] font-medium text-slate-700 dark:text-slate-200">Pokaż kody KNR</p>
                    <p className="text-[9px] text-slate-400">Wyświetla kody norm KNR na portalu.</p>
                  </div>
                </div>
                <Switch
                  id="portal-show-knr"
                  name="portal-show-knr"
                  aria-label="Pokaż kody KNR"
                  checked={portalShowKnr}
                  onCheckedChange={setPortalShowKnr}
                  className="scale-75 origin-right data-[state=checked]:bg-violet-600"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Timer className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  <div>
                    <p className="text-[11px] font-medium text-slate-700 dark:text-slate-200">Pokaż roboczogodziny (r-g)</p>
                    <p className="text-[9px] text-slate-400">Wyświetla czas pracy dla pozycji.</p>
                  </div>
                </div>
                <Switch
                  id="portal-show-rg"
                  name="portal-show-rg"
                  aria-label="Pokaż roboczogodziny"
                  checked={portalShowRg}
                  onCheckedChange={setPortalShowRg}
                  className="scale-75 origin-right data-[state=checked]:bg-emerald-600"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                  <div>
                    <p className="text-[11px] font-medium text-slate-700 dark:text-slate-200">Włącz kolory (Expert Coloring)</p>
                    <p className="text-[9px] text-slate-400">Oznacza robociznę i materiały kolorami na portalu.</p>
                  </div>
                </div>
                <Switch
                  id="portal-show-colors"
                  name="portal-show-colors"
                  aria-label="Włącz kolory Expert Coloring"
                  checked={portalShowColors}
                  onCheckedChange={setPortalShowColors}
                  className="scale-75 origin-right data-[state=checked]:bg-indigo-600"
                />
              </div>
            </div>

            <Button
              size="sm"
              className="w-full h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
              onClick={async () => {
                await handleCreate();
              }}
              disabled={creating}
            >
              {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
              Generuj link
            </Button>
          </div>

          {/* Generated URL — shown after creating */}
          {generatedUrl && (
            <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-xl border border-green-200 dark:border-green-800 space-y-2">
              <p className="text-xs font-medium text-green-700 dark:text-green-300 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                Link gotowy!
              </p>
              <div className="flex gap-1.5">
                <Input
                  id="offer-generated-url"
                  name="offer-generated-url"
                  value={generatedUrl}
                  readOnly
                  aria-label="Wygenerowany link do portalu klienta"
                  className="h-8 text-xs font-mono bg-white dark:bg-slate-900"
                  onClick={e => (e.target as HTMLInputElement).select()}
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-2.5 flex-shrink-0"
                  onClick={() => handleCopy(generatedUrl, "new")}
                >
                  {copiedId === "new" ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-2.5 flex-shrink-0"
                  onClick={() => setShowQr(!showQr)}
                  title="QR kod"
                >
                  <QrCode className="w-3.5 h-3.5" />
                </Button>
              </div>
              {showQr && (
                <div className="flex flex-col items-center gap-2 pt-2">
                  <div className="bg-white p-3 rounded-lg border shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(generatedUrl)}&format=svg`}
                      alt="QR kod oferty"
                      width={200}
                      height={200}
                      className="w-[200px] h-[200px]"
                    />
                  </div>
                </div>
              )}
              <Button
                size="sm"
                className="w-full mt-3 h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => window.open(generatedUrl, "_blank", "noopener,noreferrer")}
              >
                <Eye className="w-3.5 h-3.5" />
                Podgląd oferty
              </Button>
              {email && (
                <Button
                  size="sm"
                  className="w-full h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                  onClick={() => handleSendEmail(generatedUrl, email, name)}
                  disabled={sendingEmail}
                >
                  {sendingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Wyślij link na {email}
                </Button>
              )}
            </div>
          )}

          {/* History */}
          {links.length > 0 && (
            <div className="space-y-2 border-t border-slate-200 dark:border-slate-700 pt-3">
              <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Historia ({links.length})
              </h4>
              <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-3">
                    <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                  </div>
                ) : (
                  links.map(link => (
                    <div key={link.id} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">
                            {link.recipient_name || link.recipient_email || clientName || projectName || "Bez nazwy"}
                          </span>
                          {getStatusBadge(link)}
                        </div>
                        <span className="text-[9px] text-slate-400">
                          {format(new Date(link.created_at), "d MMM yyyy, HH:mm", { locale: pl })}
                          {link.viewed_at && " · wyświetlono"}
                          {link.signed_at && " · podpisano"}
                        </span>
                      </div>
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        {link.status === "negotiating" && (
                          <NegotiationReviewDialog
                            offerId={link.id}
                            token={link.token}
                            clientName={link.recipient_name || "Klient"}
                            projectName={projectName || "Projekt"}
                          />
                        )}
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopy(`${baseUrl}/offer/${link.token}`, link.id)} title="Kopiuj link">
                          {copiedId === link.id ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                          <a href={`/offer/${link.token}`} target="_blank" rel="noopener noreferrer" title="Otwórz portal">
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(link.id)} title="Usuń">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
