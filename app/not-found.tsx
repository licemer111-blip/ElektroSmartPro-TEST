import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full" />
            <FileQuestion className="w-24 h-24 text-blue-600 relative" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
            404
          </h1>
          <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300">
            Strona nie została znaleziona
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Przepraszamy, nie możemy znaleźć strony, której szukasz.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link href="/dashboard">
              Wróć do Dashboard
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">
              Strona główna
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
