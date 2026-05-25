"use client";

import Link from "next/link";
import { Menu, Zap, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { HeaderMobileNavItem } from "@/components/header-mobile-nav-item";
import { MobileNavLink } from "@/components/mobile-nav-link";
import { SzybkaWycenaNavLink } from "@/components/szybka-wycena-nav-link";

interface HeaderMobileMenuProps {
  isAuthenticated: boolean;
  isPro: boolean;
}

const SHEET_CONTENT_CLASS = "w-72 [&>button]:right-3 [&>button]:top-4 [&>button]:rounded-full [&>button]:w-8 [&>button]:h-8 [&>button]:flex [&>button]:items-center [&>button]:justify-center [&>button]:bg-slate-100 [&>button]:dark:bg-slate-800 [&>button]:hover:bg-slate-200 [&>button]:dark:hover:bg-slate-700 [&>button]:transition-all [&>button]:duration-200 [&>button]:hover:scale-110 [&>button]:shadow-sm";

export function HeaderMobileMenu({ isAuthenticated, isPro }: HeaderMobileMenuProps) {

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="xl:hidden mr-1 md:mr-2">
          <Menu className="w-5 h-5" />
          <span className="sr-only">Otwórz menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className={SHEET_CONTENT_CLASS}>
        {isAuthenticated ? (
          <>
            <SheetHeader className="pr-14">
              <SheetTitle>
                <SheetClose asChild>
                  <Link href="/dashboard/projects" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <Zap className="w-10 h-10 text-blue-600 fill-blue-600" />
                    <span className="text-base font-bold">ElektroSmart</span>
                    <span className={`${isPro ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-slate-400 dark:bg-slate-600'} text-white px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5`}>
                      {isPro && <Crown className="w-2.5 h-2.5" />}
                      PRO
                    </span>
                  </Link>
                </SheetClose>
              </SheetTitle>
              <SheetDescription className="sr-only">
                Menu nawigacji aplikacji
              </SheetDescription>
            </SheetHeader>
            <nav className="flex flex-col gap-3 mt-6 overflow-y-auto max-h-[calc(100vh-120px)] pb-24">
              {/* Kosztorysy */}
              <div className="space-y-0.5">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3 mb-1.5">
                  Kosztorysy
                </p>
                <HeaderMobileNavItem href="/dashboard/projects" icon="PenTool" variant="glow-blue" desc="Kosztorys elektryczny — ostatni edytowany projekt">
                  Kreator
                </HeaderMobileNavItem>
                <SheetClose asChild>
                  <div className="px-0">
                    <SzybkaWycenaNavLink className="w-full justify-start" />
                  </div>
                </SheetClose>
                <HeaderMobileNavItem href="/dashboard" icon="FolderKanban">
                  Projekty
                </HeaderMobileNavItem>
              </div>

              {/* Baza i Narzędzia */}
              <div className="space-y-0.5 border-t border-slate-200 dark:border-slate-700/50 pt-3">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3 mb-1.5">
                  Baza i Narzędzia
                </p>
                <HeaderMobileNavItem href="/dashboard/catalog" icon="PackageSearch">
                  Katalog
                </HeaderMobileNavItem>
                <HeaderMobileNavItem href="/dashboard/assemblies" icon="Boxes" desc="Gniazdo = urządzenie + puszka + kabel + bruzda">
                  Zestawy
                </HeaderMobileNavItem>
                <HeaderMobileNavItem href="/dashboard/tools" icon="Wrench">
                  Kalkulatory
                </HeaderMobileNavItem>
                <HeaderMobileNavItem href="/dashboard/panel-configurator" icon="LayoutGrid" desc="Konfigurator tablic DIN — moduły, balans faz">
                  Rozdzielnica
                </HeaderMobileNavItem>
                <HeaderMobileNavItem href="/dashboard/templates" icon="Copy">
                  Szablony
                </HeaderMobileNavItem>
                <HeaderMobileNavItem href="/dashboard/analytics" icon="BarChart2">
                  Analityka
                </HeaderMobileNavItem>
                <HeaderMobileNavItem href="/dashboard/time" icon="Clock">
                  Czas pracy
                </HeaderMobileNavItem>
                <HeaderMobileNavItem href="/dashboard/team" icon="Users">
                  Zespół
                </HeaderMobileNavItem>
                <HeaderMobileNavItem href="/dashboard/portfolio" icon="Briefcase">
                  Portfolio
                </HeaderMobileNavItem>
              </div>

              {/* Konto */}
              <div className="space-y-0.5 border-t border-slate-200 dark:border-slate-700/50 pt-3">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3 mb-1.5">
                  Konto
                </p>
                <HeaderMobileNavItem href="/dashboard/settings" icon="Settings">
                  Ustawienia
                </HeaderMobileNavItem>
                <HeaderMobileNavItem href="/dashboard/market" icon="TrendingUp">
                  Rynek
                </HeaderMobileNavItem>
              </div>

            </nav>
          </>
        ) : (
          <>
            <SheetHeader className="pr-14">
              <SheetTitle>
                <SheetClose asChild>
                  <Link href="/" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
                    <Zap className="w-4 h-4 text-blue-600 fill-blue-600" />
                    <span className="text-sm font-bold">ElektroSmart</span>
                  </Link>
                </SheetClose>
              </SheetTitle>
              <SheetDescription className="sr-only">
                Menu nawigacji strony głównej
              </SheetDescription>
            </SheetHeader>
            <nav className="flex flex-col gap-2 mt-8 overflow-y-auto max-h-[calc(100vh-120px)] pb-24">
              <MobileNavLink href="/#features" icon="Zap">
                Funkcje
              </MobileNavLink>
              <MobileNavLink href="/blog" icon="FileText">
                Blog
              </MobileNavLink>
              <MobileNavLink href="/o-nas" icon="Users">
                O nas
              </MobileNavLink>
              <MobileNavLink href="/kontakt" icon="Mail">
                Kontakt
              </MobileNavLink>
            </nav>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
