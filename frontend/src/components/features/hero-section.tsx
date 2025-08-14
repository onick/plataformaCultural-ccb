"use client"

import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users } from "lucide-react";
import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-ccb-blue via-ccb-lightblue to-ccb-blue">
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative px-4 py-24 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Centro Cultural
            <span className="block text-ccb-gold">Banreservas</span>
          </h1>
          <p className="max-w-3xl mx-auto mt-6 text-xl text-gray-100">
            Descubre experiencias culturales únicas. Desde cinema dominicano hasta 
            experiencias 3D inmersivas, talleres creativos y conciertos inolvidables.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="bg-ccb-gold hover:bg-ccb-gold/90 text-ccb-blue">
              <Link href="/events">
                <Calendar className="w-5 h-5 mr-2" />
                Explorar Eventos
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-white border-white hover:bg-white hover:text-ccb-blue">
              <Link href="/about">
                <MapPin className="w-5 h-5 mr-2" />
                Conoce el Centro
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div className="text-center">
            <div className="text-4xl font-bold text-ccb-gold">500+</div>
            <div className="mt-2 text-lg text-gray-100">Eventos al año</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-ccb-gold">50,000+</div>
            <div className="mt-2 text-lg text-gray-100">Visitantes anuales</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-ccb-gold">8</div>
            <div className="mt-2 text-lg text-gray-100">Categorías culturales</div>
          </div>
        </div>
      </div>

      {/* Decorative shapes */}
      <div className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2">
        <div className="w-96 h-96 bg-ccb-gold/10 rounded-full blur-3xl" />
      </div>
      <div className="absolute bottom-0 left-0 transform -translate-x-1/2 translate-y-1/2">
        <div className="w-96 h-96 bg-white/10 rounded-full blur-3xl" />
      </div>
    </section>
  );
}
