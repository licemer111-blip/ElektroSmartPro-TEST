"use client";

import Link from "next/link";
import { Settings, Zap, TrendingUp, FileText, Crown, LayoutGrid, BarChart2, Clock, Users, Briefcase } from "lucide-react";
import { SzybkaWycenaNavLink } from "@/components/szybka-wycena-nav-link";
import { Button } from "@/components/ui/button";
import { HeaderNewProjectButton } from "@/components/header-new-project-button";
import { NavLink } from "@/components/nav-link";
import { KreatorNavLink } from "@/components/kreator-nav-link";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HeaderMobileMenu } from "@/components/header-mobile-menu";
import { PendingInvitationsDropdown } from "@/components/project/pending-invitations-dropdown";
import { ModeToggle } from "@/components/mode-toggle";
import { UserNav } from "@/components/user-nav";

interface HeaderClientProps {
    user: { email?: string } | null;
    isPro: boolean;
    isDashboard?: boolean;
}

export default function HeaderClient({ user, isPro, isDashboard = true }: HeaderClientProps) {
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-slate-900/95 dark:border-slate-800 dark:supports-[backdrop-filter]:bg-slate-900/60">
            <div className="flex h-16 items-center px-2 md:px-6">
                {/* MOBILE MENU BUTTON - Client Component */}
                <HeaderMobileMenu isAuthenticated={!!user} isPro={isPro} />

                {/* PREMIUM LOGO - links to dashboard if logged in, otherwise to homepage */}
                {user ? (
                    <Link href="/dashboard/projects" className="flex items-center gap-1.5 md:gap-1.5 hover:opacity-90 transition-opacity mr-2 md:mr-4">
                        <Zap className="w-7 h-7 md:w-7 md:h-7 text-blue-600 fill-blue-600 dark:text-blue-500 dark:fill-blue-500" />
                        <span className="font-extrabold text-xl md:text-2xl tracking-tighter text-slate-900 dark:text-slate-100">
                            ElektroSmart
                        </span>
                        <span className={`${isPro ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-slate-400 dark:bg-slate-600'} text-white px-1 md:px-1.5 py-0.5 rounded-md text-xs md:text-sm font-bold ml-0.5 md:ml-1 self-center flex items-center gap-0.5 md:gap-1`}>
                            {isPro && <Crown className="w-2.5 h-2.5 md:w-3 md:h-3" />}
                            PRO
                        </span>
                    </Link>
                ) : (
                    <Link href="/" className="flex items-center gap-1.5 md:gap-1.5 hover:opacity-90 transition-opacity mr-2 md:mr-4">
                        <Zap className="w-7 h-7 md:w-7 md:h-7 text-blue-600 fill-blue-600 dark:text-blue-500 dark:fill-blue-500" />
                        <span className="font-extrabold text-xl md:text-2xl tracking-tighter text-slate-900 dark:text-slate-100">
                            ElektroSmart
                        </span>
                    </Link>
                )}

                {/* Navigation Logic */}
                {user ? (
                    <>
                        {/* NEW PROJECT CTA (only for logged in users) */}
                        <HeaderNewProjectButton />

                        {/* DASHBOARD NAVIGATION (Desktop) */}
                        <nav className="hidden xl:flex items-center gap-1 text-sm font-medium">
                            {/* Kreator — primary action, first position */}
                            <KreatorNavLink />

                            <NavLink href="/dashboard" icon="FolderKanban" title="Lista wszystkich kosztorysów i wycen">
                                Projekty
                            </NavLink>

                            <NavLink href="/dashboard/catalog" icon="PackageSearch" title="Katalog pozycji elektrycznych z cenami materiałów i robocizny">
                                Katalog
                            </NavLink>

                            <NavLink href="/dashboard/assemblies" icon="Boxes" title="Zestawy montażowe — jeden klik dodaje: urządzenie + puszka + kabel + bruzda + robocizna">
                                Zestawy
                            </NavLink>

                            <SzybkaWycenaNavLink />

                            <NavLink href="/dashboard/tools" icon="Wrench" title="12 kalkulatorów inżynierskich: kable, zabezpieczenia, spadek napięcia, PV, oświetlenie...">
                                Kalkulatory
                            </NavLink>

                            {/* Więcej — compact secondary items */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="flex items-center gap-1.5 px-3 py-2 rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-sm font-medium h-auto">
                                        <Settings className="w-4 h-4 text-slate-700 dark:text-slate-200" />
                                        Więcej
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-52">
                                    <DropdownMenuItem asChild>
                                        <Link href="/dashboard/panel-configurator" className="flex items-center gap-2 cursor-pointer">
                                            <LayoutGrid className="w-4 h-4" />
                                            Rozdzielnica
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/dashboard/templates" className="flex items-center gap-2 cursor-pointer">
                                            <FileText className="w-4 h-4" />
                                            Szablony
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/dashboard/market" className="flex items-center gap-2 cursor-pointer">
                                            <TrendingUp className="w-4 h-4" />
                                            Rynek
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/dashboard/analytics" className="flex items-center gap-2 cursor-pointer">
                                            <BarChart2 className="w-4 h-4" />
                                            Analityka
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/dashboard/time" className="flex items-center gap-2 cursor-pointer">
                                            <Clock className="w-4 h-4" />
                                            Czas pracy
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/dashboard/team" className="flex items-center gap-2 cursor-pointer">
                                            <Users className="w-4 h-4" />
                                            Zespół
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/dashboard/portfolio" className="flex items-center gap-2 cursor-pointer">
                                            <Briefcase className="w-4 h-4" />
                                            Portfolio
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link href="/dashboard/settings" className="flex items-center gap-2 cursor-pointer">
                                            <Settings className="w-4 h-4" />
                                            Ustawienia
                                        </Link>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </nav>
                    </>
                ) : (
                    <>
                        {/* PUBLIC NAVIGATION (for non-logged in users) */}
                        <nav className="hidden md:flex items-center gap-1 text-sm font-medium ml-auto mr-4">
                            <NavLink href="/#features" icon="Zap">
                                Funkcje
                            </NavLink>

                            <NavLink href="/blog" icon="FileText">
                                Blog
                            </NavLink>

                            <NavLink href="/o-nas" icon="Users">
                                O nas
                            </NavLink>

                            <NavLink href="/kontakt" icon="Mail">
                                Kontakt
                            </NavLink>
                        </nav>
                    </>
                )}

                {/* USER PROFILE & ACTIONS */}
                <div className="ml-auto flex items-center gap-2 md:gap-3">
                    {user && !isPro && (
                        <Link href="/dashboard/subscription/checkout">
                            <button className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all">
                                <Crown className="w-3.5 h-3.5" />
                                Kup PRO
                            </button>
                        </Link>
                    )}
                    {user && <PendingInvitationsDropdown />}
                    <ModeToggle />
                    <UserNav user={user} isPro={isPro} />
                </div>
            </div>
        </header>
    );
}
