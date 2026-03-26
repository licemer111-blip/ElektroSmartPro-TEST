import Link from "next/link";
import { Zap } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-slate-200/50 dark:border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center shadow-md">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-slate-900 dark:text-slate-100">ElektroSmart PRO</span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-500">
              Profesjonalne kosztorysowanie elektryczne dla polskiego rynku.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Produkt</h3>
            <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-500">
              <li><Link href="/#features" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Funkcje</Link></li>
              <li><Link href="/dashboard" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Demo</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Firma</h3>
            <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-500">
              <li><Link href="/o-nas" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">O nas</Link></li>
              <li><Link href="/kontakt" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Kontakt</Link></li>
              <li><Link href="/blog" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Blog</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Prawne</h3>
            <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-500">
              <li><Link href="/polityka-prywatnosci" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Polityka prywatności</Link></li>
              <li><Link href="/regulamin" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Regulamin</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-800/50 mt-12 pt-8 text-center text-sm text-slate-600 dark:text-slate-400">
          <p className="font-medium">&copy; 2026 ElektroSmart PRO. Wszystkie prawa zastrzeżone.</p>
        </div>
      </div>
    </footer>
  );
}
