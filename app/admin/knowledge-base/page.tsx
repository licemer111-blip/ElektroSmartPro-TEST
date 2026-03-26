import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/utils/admin";
import { listKbFiles, getKnrReferenceFiles } from "./actions";
import { KbManager } from "./kb-manager";
import { Brain } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function KnowledgeBasePage() {
  const userIsAdmin = await isAdmin();
  if (!userIsAdmin) redirect("/dashboard");

  const [{ files, error }, knrCategories] = await Promise.all([
    listKbFiles(),
    getKnrReferenceFiles(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg shrink-0">
            <Brain className="w-4 h-4 text-indigo-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Baza Wiedzy ES-Engine
          </h1>
        </div>
        <p className="text-xs text-slate-500 ml-9">
          Pliki JSON z normami KNR i konfiguracjami — dynamicznie wstrzykiwane do ES-Engine jako kontekst RAG.
        </p>
        {error && (
          <div className="mt-2 ml-9 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            ⚠️ Błąd ładowania plików: {error}. Sprawdź bucket <code>ai-knowledge-base</code> w Supabase Storage.
          </div>
        )}
      </div>

      <KbManager initialFiles={files} knrCategories={knrCategories} />
    </div>
  );
}
