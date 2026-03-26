"use client";

import { Star, Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const testimonials = [
  {
    name: "Marek Kowalski",
    role: "Elektryk, własna firma",
    location: "Warszawa",
    avatar: "MK",
    rating: 5,
    text: "Wcześniej kosztorys zajmował mi 3 godziny. Teraz robię to w 15 minut. Import z rzutu to game changer - wgrywam PDF i mam gotową listą materiałów!",
    highlight: "3h → 15 min",
  },
  {
    name: "Tomasz Nowak",
    role: "Właściciel firmy elektrycznej",
    location: "Kraków",
    avatar: "TN",
    rating: 5,
    text: "Profesjonalne PDF-y z moim logo robią wrażenie na klientach. Wygrałem więcej przetargów odkąd używam ElektroSmart PRO.",
    highlight: "+40% wygranych ofert",
  },
  {
    name: "Piotr Wiśniewski",
    role: "Elektryk instalator",
    location: "Wrocław",
    avatar: "PW",
    rating: 5,
    text: "Ceny regionalne to strzał w dziesiątkę. Nie muszę już szukać ile brać za punkt w moim województwie - system wie to za mnie.",
    highlight: "Ceny dla 16 województw",
  },
  {
    name: "Adam Zieliński",
    role: "Kierownik ekipy",
    location: "Poznań",
    avatar: "AZ",
    rating: 5,
    text: "Współpraca zespołowa działa świetnie. Moi chłopaki mogą edytować projekty w terenie, a ja widzę zmiany na żywo w biurze.",
    highlight: "Real-time współpraca",
  },
];

export function TestimonialsSection() {
  return (
    <section className="relative py-20 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 border-amber-200 dark:border-amber-800">
            <Star className="w-3 h-3 mr-1 fill-amber-500" />
            Opinie użytkowników
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Co mówią <span className="gradient-text-pro">elektrycy</span>
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Dołącz do 500+ profesjonalistów, którzy już używają ElektroSmart PRO
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {testimonials.map((testimonial, idx) => (
            <Card
              key={idx}
              className="group relative overflow-hidden border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10"
            >
              <CardContent className="p-6">
                {/* Quote Icon */}
                <Quote className="absolute top-4 right-4 w-8 h-8 text-slate-200 dark:text-slate-700 group-hover:text-blue-200 dark:group-hover:text-blue-800 transition-colors" />
                
                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>

                {/* Text */}
                <p className="text-slate-700 dark:text-slate-300 mb-4 leading-relaxed">
                  "{testimonial.text}"
                </p>

                {/* Highlight Badge */}
                <Badge className="mb-4 bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 border-green-200 dark:border-green-800">
                  ✓ {testimonial.highlight}
                </Badge>

                {/* Author */}
                <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-semibold text-sm">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">
                      {testimonial.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {testimonial.role} • {testimonial.location}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats Row */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: "500+", label: "Aktywnych użytkowników" },
            { value: "15 000+", label: "Utworzonych kosztorysów" },
            { value: "4.9/5", label: "Średnia ocena" },
            { value: "98%", label: "Poleca znajomym" },
          ].map((stat, idx) => (
            <div key={idx} className="text-center">
              <p className="text-3xl md:text-4xl font-bold gradient-text-pro">
                {stat.value}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
