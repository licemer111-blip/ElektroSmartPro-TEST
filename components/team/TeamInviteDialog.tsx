"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { UserPlus, Mail, Loader2, Trash2 } from "lucide-react";

interface OutgoingInvitation {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
}

interface TeamInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inviteEmail: string;
  inviting: boolean;
  cancelingInvite: string | null;
  outgoingInvitations: OutgoingInvitation[];
  setInviteEmail: (v: string) => void;
  onInvite: () => void;
  onCancelInvite: (id: string) => void;
}

export function TeamInviteDialog({
  open, onOpenChange, inviteEmail, inviting, cancelingInvite,
  outgoingInvitations, setInviteEmail, onInvite, onCancelInvite,
}: TeamInviteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            Zaproś do zespołu
          </DialogTitle>
          <DialogDescription>
            Wprowadź email osoby, którą chcesz zaprosić. Osoba musi mieć konto w ElektroSmart.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email</Label>
            <div className="flex gap-2">
              <Input
                id="invite-email"
                name="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="jan@example.com"
                onKeyDown={(e) => { if (e.key === "Enter") onInvite(); }}
                className="flex-1"
              />
              <Button
                onClick={onInvite}
                disabled={inviting || !inviteEmail.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {outgoingInvitations.length > 0 && (
            <div className="space-y-2 border-t pt-3">
              <Label className="text-xs text-muted-foreground">
                Wysłane zaproszenia ({outgoingInvitations.length})
              </Label>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {outgoingInvitations.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="truncate text-xs">{inv.email}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onCancelInvite(inv.id)}
                      disabled={cancelingInvite === inv.id}
                      className="h-6 w-6 p-0"
                    >
                      {cancelingInvite === inv.id
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : <Trash2 className="w-3 h-3 text-red-500" />
                      }
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
