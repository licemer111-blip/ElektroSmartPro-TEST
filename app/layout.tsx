import type { Metadata, Viewport } from "next";
import { SYSTEM_STATS_FALLBACK } from "@/constants/system";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { ModalProvider } from "@/components/providers/modal-provider";
import { KeyboardShortcutsProvider } from "@/components/keyboard-shortcuts-provider";
import { CommandPaletteProvider } from "@/components/command-palette-provider";
import { PWAProvider } from "@/components/pwa/pwa-provider";
import { VersionChecker } from "@/components/shared/version-checker";
import { Toaster as SonnerToaster } from "sonner";
import { WebVitals } from "@/components/analytics/web-vitals";

const inter = Inter({ subsets: ["latin", "latin-ext"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://elektrosmart.pro"),
  title: {
    default: "Program do kosztorysowania robót elektrycznych online - ElektroSmart PRO",
    template: "%s | ElektroSmart PRO — Program dla Elektryków",
  },
  description: "Automatyczne kosztorysy elektryczne z silnikiem ES-Engine, normami KNR i cenami regionalnymi 16 województw. Konfigurator rozdzielnic 120+ modułów DIN, zestawy 360°, VAT 8%/23%, eksport PDF. Zgodność z PN-HD 60364.",
  keywords: [
    // ===== PRIMARY KEYWORDS (Highest Search Volume) =====
    "kosztorys elektryczny",
    "kosztorys instalacji elektrycznej",
    "wycena instalacji elektrycznej",
    "wycena elektryczna",
    "kosztorysowanie elektryczne",
    "program do kosztorysów elektrycznych",
    "program dla elektryków",
    
    // ===== FEATURE KEYWORDS (v4.0) =====
    "kosztorys elektryczny online",
    "program dla elektryków online",
    "oprogramowanie dla elektryków",
    "aplikacja dla elektryków",
    "generator kosztorysów elektrycznych",
    "kalkulator elektryczny online",
    "wycena prac elektrycznych",
    
    // ===== AI & TECHNOLOGY KEYWORDS =====
    "schemat jednokreskowy AI",
    "program do schematów jednokreskowych",
    "KNR 5-08",
    "normy KNR 5-08",
    "projektowanie rozdzielnic",
    "kalkulator rozdzielnic elektrycznych",
    "ES-Engine kosztorysowanie",
    "kosztorys elektryczny ES",
    "automatyczny kosztorys elektryczny",
    "ekspertowy system kosztorysów elektrycznych",
    "import dokumentów ES Lab",
    "liczenie gniazdek automatyczne",
    
    // ===== CRM & BUSINESS KEYWORDS =====
    "CRM dla elektryków",
    "zarządzanie klientami elektryk",
    "analityka biznesowa elektryk",
    "współpraca zespołowa elektrycy",
    "fakturowanie dla elektryków",
    
    // ===== PRICING KEYWORDS =====
    "cennik usług elektrycznych 2026",
    "stawki robocizny elektryk 2026",
    "ceny materiałów elektrycznych 2026",
    "ile kosztuje punkt elektryczny",
    "cena instalacji elektrycznej",
    "cennik elektryka 2026",
    "wycena elektryka za punkt",
    
    // ===== VAT & TAX KEYWORDS =====
    "VAT 8% budownictwo mieszkaniowe",
    "VAT 23% instalacje elektryczne",
    "stawki VAT elektryk 2026",
    
    // ===== CALCULATOR KEYWORDS =====
    "kalkulator przekroju kabla",
    "kalkulator prądu zwarcia",
    "kalkulator spadku napięcia",
    "kalkulator fotowoltaiki",
    "kalkulator oświetlenia",
    "kalkulator mocy",
    "kalkulator uziemienia",
    "kalkulator ładowarki EV",
    
    // ===== LOCATION KEYWORDS (16 Voivodeships) =====
    "kosztorys elektryczny warszawa",
    "kosztorys elektryczny kraków",
    "kosztorys elektryczny wrocław",
    "kosztorys elektryczny poznań",
    "kosztorys elektryczny gdańsk",
    "kosztorys elektryczny łódź",
    "kosztorys elektryczny katowice",
    "kosztorys elektryczny szczecin",
    "kosztorys elektryczny lublin",
    "kosztorys elektryczny białystok",
    "kosztorys elektryczny rzeszów",
    "kosztorys elektryczny bydgoszcz",
    "kosztorys elektryczny olsztyn",
    "kosztorys elektryczny kielce",
    "kosztorys elektryczny opole",
    "kosztorys elektryczny zielona góra",
    "elektryk mazowieckie",
    "elektryk śląskie",
    "elektryk małopolskie",
    "elektryk wielkopolskie",
    
    // ===== LONG-TAIL KEYWORDS =====
    "jak zrobić kosztorys instalacji elektrycznej",
    "ile kosztuje instalacja elektryczna w domu",
    "ile kosztuje instalacja elektryczna w mieszkaniu",
    "oferta elektryczna PDF",
    "wzór kosztorysu elektrycznego",
    "szablon kosztorysu elektrycznego",
    "eksport kosztorysu do PDF",
    "zestawy materiałów elektrycznych",
    
    // ===== COMPETITOR ALTERNATIVE KEYWORDS =====
    "alternatywa dla excel kosztorys",
    "program zamiast excel elektryk",
    "nowoczesny kosztorys elektryczny",
  ],
  authors: [{ name: "ElektroSmart PRO" }],
  creator: "ElektroSmart PRO",
  publisher: "ElektroSmart PRO",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "pl_PL",
    url: "/",
    siteName: "ElektroSmart PRO",
    title: "ElektroSmart PRO — Ekspertowy Kosztorys Elektryczny | ES-Engine",
    description: "Profesjonalny system kosztorysowania instalacji elektrycznych z ES-Engine. Podział Robocizna/Materiał, normy KNR, Zestawy 360°, konfigurator rozdzielnic 120+ modułów DIN, ceny dla 16 województw, VAT 8%/23%, eksport PDF.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "ElektroSmart PRO - Program do Kosztorysowania Elektrycznego z AI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ElektroSmart PRO — Kosztorys Elektryczny z ES-Engine | Program dla Elektryków",
    description: `Profesjonalny system dla elektryków: ES-Engine, normy KNR, Zestawy 360°, ${SYSTEM_STATS_FALLBACK.normsLabelPlus} norm w ${SYSTEM_STATS_FALLBACK.categoriesLabel} kategoriach, 12 kalkulatorów, ceny 16 województw, VAT 8/23%, eksport PDF.`,
    images: ["/opengraph-image"],
    creator: "@elektrosmartpro",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/apple-touch-icon.png",
  },
  manifest: "/manifest.webmanifest?v=5",
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION && {
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    },
  }),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <head>
        {/* Preconnect for LCP — tells browser to open connections early */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://jbxveulddoznswyeihda.supabase.co" />
        <link rel="dns-prefetch" href="https://upwctgdpuckreoquofiu.supabase.co" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://vitals.vercel-insights.com" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ElektroSmart" />
      </head>
        <body className={`${inter.className} mesh-gradient-hero min-h-screen`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <PWAProvider>
            <ModalProvider />
            <KeyboardShortcutsProvider />
            <CommandPaletteProvider />
            {children}
            <WebVitals />
            <VersionChecker />
            <Toaster />
            <SonnerToaster richColors position="bottom-right" />
          </PWAProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
