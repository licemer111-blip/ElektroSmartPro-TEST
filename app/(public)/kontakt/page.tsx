"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Send, Clock, Users, CheckCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { submitContactForm } from "./actions";

export default function KontaktPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      toast({
        title: "Błąd",
        description: "Wypełnij wszystkie pola",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const result = await submitContactForm(formData);
      
      if (result.success) {
        toast({
          title: "Wiadomość wysłana!",
          description: "Odpowiemy najszybciej jak to możliwe",
        });
        setFormData({ name: "", email: "", message: "" });
      } else {
        toast({
          title: "Błąd",
          description: result.error || "Nie udało się wysłać wiadomości",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Wystąpił nieoczekiwany błąd",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Powrót do strony głównej
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 rounded-lg bg-gradient-to-br from-green-600 to-green-800">
            <Mail className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              Kontakt
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Masz pytania? Jesteśmy tu, aby pomóc!
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Column - Info Cards */}
          <div className="space-y-6">
            {/* General Contact */}
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                    <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle>Kontakt Ogólny</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">
                    Masz pytania? Chcesz poznać więcej szczegółów? Pisz śmiało!
                  </p>
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                      📧 E-mail
                    </p>
                    <a 
                      href="mailto:elektrosmartpro@gmail.com" 
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                      elektrosmartpro@gmail.com
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Support Times */}
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/50">
                    <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <CardTitle>Czas Odpowiedzi</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                      Użytkownicy PRO
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Odpowiadamy w ciągu <strong className="text-green-600 dark:text-green-400">24 godzin</strong> (dni robocze)
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                      Użytkownicy FREE
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Odpowiadamy w ciągu <strong className="text-blue-600 dark:text-blue-400">48 godzin</strong> (dni robocze)
                    </p>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    💡 <strong>Tip:</strong> Im bardziej szczegółowo opiszesz problem, tym szybciej pomożemy!
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* What to Write About */}
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50">
                    <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <CardTitle>O Co Możesz Pytać?</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span>Pytania o funkcjonalność systemu</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                    <span>Problemy techniczne i wsparcie</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 dark:text-purple-400 mt-0.5">•</span>
                    <span>Pytania o subskrypcję i płatności</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 dark:text-orange-400 mt-0.5">•</span>
                    <span>Sugestie nowych funkcji</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 dark:text-red-400 mt-0.5">•</span>
                    <span>Współpraca i partnerstwa</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Contact Form */}
          <div>
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle>Wyślij Wiadomość</CardTitle>
                <CardDescription>
                  Wypełnij formularz, a my odpowiemy najszybciej jak to możliwe
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name Field */}
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Imię i Nazwisko / Nazwa Firmy <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      placeholder="Jan Kowalski"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      disabled={isSubmitting}
                      className="dark:bg-slate-800 dark:border-slate-700"
                    />
                  </div>

                  {/* Email Field */}
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      E-mail <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="jan@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      disabled={isSubmitting}
                      className="dark:bg-slate-800 dark:border-slate-700"
                    />
                  </div>

                  {/* Message Field */}
                  <div className="space-y-2">
                    <Label htmlFor="message">
                      Wiadomość <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="message"
                      name="message"
                      placeholder="Opisz swoje pytanie lub problem..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                      disabled={isSubmitting}
                      rows={6}
                      className="dark:bg-slate-800 dark:border-slate-700 resize-none"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Im bardziej szczegółowy opis, tym lepiej!
                    </p>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Wysyłanie...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Wyślij Wiadomość
                      </>
                    )}
                  </Button>

                  {/* Info */}
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-xs text-blue-800 dark:text-blue-300">
                      🔒 Twoje dane są bezpieczne i nie będą udostępniane osobom trzecim. 
                      Używamy ich wyłącznie do kontaktu z Tobą.
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ Quick Links */}
        <Card className="mt-8 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-center">Sprawdź Najpierw</CardTitle>
            <CardDescription className="text-center">
              Może odpowiedź na Twoje pytanie jest już gotowa?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <Link 
                href="/regulamin"
                className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors text-center"
              >
                <p className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                  📄 Regulamin
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Warunki korzystania z systemu
                </p>
              </Link>

              <Link 
                href="/polityka-prywatnosci"
                className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-green-500 dark:hover:border-green-500 transition-colors text-center"
              >
                <p className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                  🛡️ Polityka Prywatności
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Ochrona danych osobowych (RODO)
                </p>
              </Link>

              <Link 
                href="/dashboard"
                className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-purple-500 dark:hover:border-purple-500 transition-colors text-center"
              >
                <p className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                  🚀 Demo
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Wypróbuj aplikację za darmo
                </p>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
