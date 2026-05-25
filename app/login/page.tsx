"use client";

import { useState, Suspense } from "react";
import { useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { login, signup } from "@/app/auth/actions";
import { Zap, Mail, Lock, AlertCircle, CheckCircle } from "lucide-react";
import Link from "next/link";

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  
  return (
    <Button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-300" disabled={pending}>
      {pending ? "Ładowanie..." : children}
    </Button>
  );
}

function LoginForm() {
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(formData: FormData) {
    setError(null);
    const result = await login(formData);
    if (result?.error) {
      setError(result.error);
    }
  }

  return (
    <form action={handleLogin} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="login-email" className="text-slate-700 dark:text-slate-300">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <Input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="jan.kowalski@example.com"
            className="pl-10 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="login-password" className="text-slate-700 dark:text-slate-300">Hasło</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <Input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            className="pl-10 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
            required
          />
        </div>
      </div>

      <SubmitButton>Zaloguj się</SubmitButton>

      <div className="text-center text-sm text-slate-600 dark:text-slate-400">
        <Link href="/reset-password" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline transition-colors">
          Zapomniałeś hasła?
        </Link>
      </div>
    </form>
  );
}

function SignupForm() {
  const [error, setError] = useState<string | null>(null);

  async function handleSignup(formData: FormData) {
    setError(null);
    const result = await signup(formData);
    if (result?.error) {
      setError(result.error);
    }
  }

  return (
    <form action={handleSignup} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="signup-email" className="text-slate-700 dark:text-slate-300">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <Input
            id="signup-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="jan.kowalski@example.com"
            className="pl-10 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-password" className="text-slate-700 dark:text-slate-300">Hasło</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <Input
            id="signup-password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="Minimum 6 znaków"
            className="pl-10 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
            required
            minLength={6}
          />
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">Minimum 6 znaków</p>
      </div>

      <SubmitButton>Utwórz konto</SubmitButton>

      <div className="text-center text-xs text-slate-600 dark:text-slate-400">
        Rejestrując się, akceptujesz nasz{" "}
        <Link href="/regulamin" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline transition-colors">
          Regulamin
        </Link>{" "}
        i{" "}
        <Link href="/polityka-prywatnosci" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline transition-colors">
          Politykę Prywatności
        </Link>
      </div>
    </form>
  );
}

function LoginPageContent() {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") === "signup" ? "signup" : "login";
  const message = searchParams.get("message");

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Email confirmation banner */}
        {message === "confirm-email" && (
          <div className="flex items-start gap-3 p-4 mb-6 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl">
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">Sprawdź swoją skrzynkę email</p>
              <p className="text-emerald-700">Wysłaliśmy link potwierdzający. Kliknij go, aby aktywować konto i zalogować się.</p>
            </div>
          </div>
        )}
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-2 group">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 via-blue-500 to-violet-600 rounded-xl flex items-center justify-center shadow-xl shadow-indigo-500/30 group-hover:scale-110 transition-transform duration-300">
              <Zap className="w-8 h-8 text-white fill-white" />
            </div>
            <div className="text-left">
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">ElektroSmart PRO</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400 font-medium">Powered by ES-Engine</span>
            </div>
          </Link>
          <p className="text-slate-600 dark:text-slate-400 mt-3 text-sm">
            Ekspertowy system kosztorysowy — <span className="font-semibold text-indigo-600 dark:text-indigo-400">Normy KNR | Nakłady r-g | ES-Engine | 16 Województw</span>
          </p>
        </div>

        {/* Auth Card */}
        <Card className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-2xl border border-indigo-100 dark:border-indigo-900/50 rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/50 dark:to-violet-950/50 border-b border-indigo-100 dark:border-indigo-900/50">
            <CardTitle className="text-2xl text-center text-slate-900 dark:text-white">Witaj ponownie!</CardTitle>
            <CardDescription className="text-center text-slate-600 dark:text-slate-400">
              Zaloguj się lub utwórz nowe konto
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Tabs defaultValue={defaultTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-slate-100 dark:bg-slate-800">
                <TabsTrigger value="login" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Logowanie</TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Rejestracja</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <LoginForm />
              </TabsContent>

              <TabsContent value="signup">
                <SignupForm />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Features Highlight */}
        {/* Powered by Badge */}
        <div className="mt-6 flex justify-center">
          <div className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-700 border border-slate-700 dark:border-slate-600 shadow-lg">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-slate-300">Powered by</span>
            <span className="text-xs font-bold text-white tracking-wide">ES-Engine</span>
            <span className="text-[10px] text-slate-400 border-l border-slate-600 pl-2.5">PN-HD 60364</span>
          </div>
        </div>

        {/* Value Props */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="text-center p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <div className="text-lg">⚡</div>
            <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">Robocizna / Materiał (KNR)</div>
          </div>
          <div className="text-center p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <div className="text-lg">📐</div>
            <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">Stawki r-g / 16 Wojew.</div>
          </div>
          <div className="text-center p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <div className="text-lg">🛡️</div>
            <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">VAT 8% / 23% + Portal Klienta</div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors inline-flex items-center gap-1 group">
            <span className="group-hover:-translate-x-1 transition-transform">←</span> Powrót do strony głównej
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>}>
      <LoginPageContent />
    </Suspense>
  );
}
