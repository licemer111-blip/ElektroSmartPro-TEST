"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { acceptTeamInvitation, declineTeamInvitation } from "@/app/dashboard/team/actions";
import { TEAM_ROLE_LABELS, TeamRole } from "@/app/dashboard/team/constants";
import { Check, X, Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export interface PendingInvitation {
    id: string;
    team_id: string;
    role: "admin" | "kierownik" | "elektryk";
    created_at: string;
    teams?: { name: string };
    inviter?: { full_name: string | null; email: string };
}

interface PendingInvitationsProps {
    invitations: PendingInvitation[];
}

export function PendingInvitations({ invitations }: PendingInvitationsProps) {
    const [processingId, setProcessingId] = useState<string | null>(null);
    const router = useRouter();

    if (!invitations || invitations.length === 0) return null;

    const handleAction = async (id: string, action: 'accept' | 'decline') => {
        setProcessingId(id);

        try {
            const result = action === 'accept'
                ? await acceptTeamInvitation(id)
                : await declineTeamInvitation(id);

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(action === 'accept' ? "Dołączyłeś do zespołu!" : "Zaproszenie odrzucone");
                router.refresh();
            }
        } catch (error: unknown) {
            console.error(`[PendingInvitations] CRITICAL ERROR during ${action}:`, error);
            // Handle "Server Action not found" error (happens after deployment)
            const errorMessage = error instanceof Error ? error.message : "";
            if (errorMessage.includes("Failed to find Server Action") || 
                errorMessage.includes("Server Action")) {
                toast.error("Strona wymaga odświeżenia. Kliknij OK i odśwież stronę.", {
                    duration: 5000,
                    action: {
                        label: "Odśwież",
                        onClick: () => window.location.reload(),
                    },
                });
            } else {
                toast.error("Wystąpił błąd. Spróbuj odświeżyć stronę.");
            }
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 shadow-lg animate-in fade-in duration-500">
            <CardHeader className="pb-3 px-4 sm:px-6">
                <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                    <Mail className="w-5 h-5" />
                    Oczekujące zapроszenia ({invitations.length})
                </CardTitle>
                <CardDescription>
                    Zostałeś zaproszony do współpracy w następujących zespołach:
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 px-4 sm:px-6 pb-4">
                {invitations.map((invite) => (
                    <div
                        key={invite.id}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border border-amber-100 dark:border-amber-900 shadow-sm transition-all hover:shadow-md gap-4"
                    >
                        <div className="space-y-1">
                            <p className="font-bold text-lg text-slate-900 dark:text-slate-100">
                                {invite.teams?.name || "Zespół"}
                            </p>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full text-[11px] font-medium uppercase">
                                    {TEAM_ROLE_LABELS[invite.role as TeamRole] || invite.role}
                                </span>
                                <span className="text-xs">
                                    Od: {invite.inviter?.full_name || invite.inviter?.email || "Nieznany"}
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <Button
                                onClick={() => handleAction(invite.id, 'accept')}
                                disabled={processingId !== null}
                                className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                            >
                                {processingId === invite.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <Check className="w-4 h-4 mr-2" />
                                        Akceptuj
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => handleAction(invite.id, 'decline')}
                                disabled={processingId !== null}
                                className="flex-1 sm:flex-none border-red-200 hover:bg-red-50 text-red-600 dark:hover:bg-red-950/30"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
