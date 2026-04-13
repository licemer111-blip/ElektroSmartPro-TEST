"use client";

import Link from "next/link";
import { UserCircle, Crown, MapPin, CreditCard, LayoutDashboard, Lightbulb, LightbulbOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/logout-button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useHints } from "@/hooks/useHints";

interface UserNavProps {
    user: { email?: string } | null;
    isPro?: boolean;
}

export function UserNav({ user, isPro = false }: UserNavProps) {
    const { hintsEnabled, toggle: toggleHints } = useHints();
    if (!user) {
        return (
            <Button asChild className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-md hover:shadow-lg transition-all">
                <Link href="/login">Zaloguj się</Link>
            </Button>
        );
    }

    const initials = user.email
        ? user.email.slice(0, 2).toUpperCase()
        : "U";

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                    {/* Avatar circle */}
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-bold shadow-md ring-2 ring-white dark:ring-slate-800 hover:ring-indigo-300 transition-all">
                        {initials}
                    </div>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
                {/* User info header */}
                <DropdownMenuLabel className="pb-2">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-sm font-bold">
                            {initials}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5">
                                <p className="text-sm font-semibold leading-none text-slate-900 dark:text-slate-100">
                                    Moje Konto
                                </p>
                                {isPro ? (
                                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] px-1.5 py-0 h-4 border-0 shrink-0">
                                        <Crown className="w-2.5 h-2.5 mr-0.5" />
                                        PRO
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 shrink-0 text-slate-500">
                                        Free
                                    </Badge>
                                )}
                            </div>
                            <p className="text-xs leading-none text-muted-foreground truncate mt-0.5">{user.email}</p>
                        </div>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="cursor-pointer">
                        <LayoutDashboard className="mr-2 h-4 w-4 text-slate-500" />
                        Dashboard
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings?tab=konto" className="cursor-pointer">
                        <UserCircle className="mr-2 h-4 w-4 text-slate-500" />
                        Moje Konto
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings" className="cursor-pointer">
                        <MapPin className="mr-2 h-4 w-4 text-slate-500" />
                        <div className="flex flex-col">
                            <span>Ustawienia</span>
                            <span className="text-[10px] text-muted-foreground font-normal">Województwo, miasto, stawki</span>
                        </div>
                    </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings?tab=subscription" className="cursor-pointer">
                        <CreditCard className="mr-2 h-4 w-4 text-slate-500" />
                        <div className="flex flex-col">
                            <span>Subskrypcja</span>
                            <span className={`text-[10px] font-normal ${isPro ? "text-amber-500" : "text-muted-foreground"}`}>
                                {isPro ? "Plan PRO — aktywny" : "Plan Free — ulepsz do PRO"}
                            </span>
                        </div>
                    </Link>
                </DropdownMenuItem>

                {!isPro && (
                    <DropdownMenuItem asChild>
                        <Link href="/dashboard/subscription/checkout" className="cursor-pointer">
                            <Crown className="mr-2 h-4 w-4 text-amber-500" />
                            <span className="font-semibold text-amber-600 dark:text-amber-400">Kup PRO</span>
                        </Link>
                    </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={(e) => { e.preventDefault(); toggleHints(); }}
                    className="cursor-pointer"
                >
                    {hintsEnabled ? (
                        <><LightbulbOff className="mr-2 h-4 w-4 text-amber-400" />
                        <div className="flex flex-col">
                            <span>Ukryj podpowiedzi</span>
                            <span className="text-[10px] text-muted-foreground font-normal">Wyłącz ikony ❓ w interfejsie</span>
                        </div></>
                    ) : (
                        <><Lightbulb className="mr-2 h-4 w-4 text-slate-400" />
                        <div className="flex flex-col">
                            <span>Pokaż podpowiedzi</span>
                            <span className="text-[10px] text-muted-foreground font-normal">Włącz ikony ❓ z objaśnieniami</span>
                        </div></>
                    )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <LogoutButton />
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
