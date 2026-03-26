import Link from "next/link";
import { Plus, Lightbulb, FolderKanban, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

/**
 * Project Not Found Page
 * 
 * Shown when user tries to access a project that doesn't exist
 * User can navigate to dashboard or project list
 */
export default function ProjectNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full shadow-xl border-2 border-blue-100 dark:border-blue-900">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto mb-6 bg-gradient-to-br from-blue-500 to-indigo-600 w-20 h-20 rounded-full flex items-center justify-center shadow-lg">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Kreator czeka na Twój projekt!
            </CardTitle>
            <CardDescription className="text-base mt-3 text-slate-600 dark:text-slate-400">
              Aby rozpocząć pracę w Kreatorze, musisz najpierw utworzyć nowy projekt.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Info Alert */}
            <Alert className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30">
              <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <AlertTitle className="text-blue-900 dark:text-blue-100 font-semibold">
                💡 Jak to działa?
              </AlertTitle>
              <AlertDescription className="text-blue-800 dark:text-blue-200 mt-2">
                <ol className="space-y-2 text-sm">
                  <li><strong>1.</strong> Kliknij przycisk <strong>"+ Nowy Projekt"</strong> poniżej</li>
                  <li><strong>2.</strong> Podaj nazwę projektu i dane klienta</li>
                  <li><strong>3.</strong> System automatycznie otworzy Kreator</li>
                  <li><strong>4.</strong> Dodawaj pozycje z katalogu lub zestawy gotowe do użycia!</li>
                </ol>
              </AlertDescription>
            </Alert>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <Button asChild size="lg" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg">
                <Link href="/dashboard">
                  <Plus className="w-5 h-5 mr-2" />
                  + Nowy Projekt
                </Link>
              </Button>
              
              <Button asChild variant="outline" size="lg" className="w-full border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
                <Link href="/dashboard">
                  <FolderKanban className="w-5 h-5 mr-2" />
                  Zobacz Wszystkie Projekty
                </Link>
              </Button>
            </div>

            {/* Help Text */}
            <div className="text-center pt-4 border-t border-slate-200 dark:border-slate-800">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                <strong className="text-slate-900 dark:text-slate-100">Szybka pomoc:</strong> Kreator to narzędzie do tworzenia kosztorysów. 
                Każdy kosztorys potrzebuje projektu, w którym będzie zapisany.
              </p>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}
