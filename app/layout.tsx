import type { Metadata, Viewport } from "next";
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
  description: "Kosztorys elektryczny: robocizna i materiał osobno. Godziny normy ES × stawka × województwo, VAT 8% albo 23%, zestawy punktów, PDF. DEMO: jeden projekt i znak wodny.",
  keywords: [
    "kosztorys elektryczny",
    "kosztorys instalacji elektrycznej",
    "kosztorys elektryczny online",
    "wycena instalacji elektrycznej",
    "wycena elektryczna",
    "wycena prac elektrycznych",
    "program do kosztorysów elektrycznych",
    "program dla elektryków",
    "oferta elektryczna PDF",
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
    title: "ElektroSmart PRO — kosztorys elektryczny: godzina × Twoja stawka",
    description: "Kosztorys elektryczny: robocizna i materiał osobno, godziny normy ES × Twoja stawka, województwo tylko na robociznę, VAT 8%/23%, PDF.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "ElektroSmart PRO — kosztorys elektryczny dla elektryka",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ElektroSmart PRO — program do kosztorysu dla elektryka",
    description: "Program dla elektryków: robocizna osobno od materiału, norma ES, 16 województw, VAT 8/23%, 12 kalkulatorów, PDF.",
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
