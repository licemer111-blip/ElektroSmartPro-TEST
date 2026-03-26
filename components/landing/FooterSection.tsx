import React from "react";
import { Zap } from "lucide-react";
import Link from "next/link";

function FooterSectionInner() {
  return (
    <footer className="relative border-t border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-xl gradient-text-pro">ElektroSmart PRO</span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Profesjonalne kosztorysowanie elektryczne dla polskiego rynku.
            </p>
          </div>

          {/* Produkt */}
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Produkt</h3>
            <ul className="space-y-3 text-sm">
              {[
                { href: "/#features", label: "Funkcje" },
                { href: "/dashboard/subscription", label: "Cennik" },
                { href: "/dashboard", label: "Demo" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Firma */}
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Firma</h3>
            <ul className="space-y-3 text-sm">
              {[
                { href: "/o-nas", label: "O nas" },
                { href: "/kontakt", label: "Kontakt" },
                { href: "/login?tab=signup", label: "Utwórz konto" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Prawne */}
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Prawne</h3>
            <ul className="space-y-3 text-sm">
              {[
                { href: "/polityka-prywatnosci", label: "Polityka prywatności" },
                { href: "/regulamin", label: "Regulamin" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-200 dark:border-slate-800 mt-12 pt-8 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            &copy; 2026 ElektroSmart PRO. Wszystkie prawa zastrzeżone.
          </p>
        </div>
      </div>
    </footer>
  );
}

export const FooterSection = React.memo(FooterSectionInner);
