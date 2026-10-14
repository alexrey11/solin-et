'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Zap, MapPin, Shield, Wifi, Sun, Car, DollarSign, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/soli/glass-card';
import { getCurrentUser } from '@/lib/auth';
import Image from 'next/image';

export default function HomePage() {
  const router = useRouter();

  // Si ya hay sesión, redirigir
  useEffect(() => {
    const check = async () => {
      const user = await getCurrentUser();
      if (user) {
        router.replace(user.role === 'driver' ? '/mapa' : '/dashboard');
      }
    };
    check();
  }, [router]);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-border/30 bg-background/60 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-12">
        <div className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="SoliNet" width={40} height={40} className="rounded-lg" />
          <span className="text-xl font-bold tracking-tight">SoliNet</span>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" asChild>
            <Link href="/auth/login">Iniciar sesión</Link>
          </Button>
          <Button size="sm" className="gradient-solar text-white" asChild>
            <Link href="/select-mode">Empezar <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-16 pb-12 text-center sm:px-6 lg:px-12 lg:pt-24">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-sm text-primary mb-6">
          <Sun className="h-4 w-4" />
          Sistema operativo solar para Cuba
        </div>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-7xl">
          Gestiona tu solinera
          <br />
          <span className="bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">
            como un negocio profesional
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Colas digitales, reservas, cobros con Transfermóvil y EnZona, todo desde tu móvil.
          Funciona sin internet. Diseñado para Cuba.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button size="lg" className="gradient-solar text-white hover:opacity-90" asChild>
            <Link href="/auth/register?role=business">
              <Zap className="mr-2 h-5 w-5" /> Soy dueño de solinera
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/auth/register?role=driver">
              <Car className="mr-2 h-5 w-5" /> Soy conductor
            </Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-12">
        <h2 className="text-center text-3xl font-bold mb-12">Todo lo que necesitas</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Feature icon={<Zap />} title="Cola digital" desc="Gestiona los vehículos sin libretas ni gritos" />
          <Feature icon={<MapPin />} title="Mapa en tiempo real" desc="Tus clientes te encuentran sin llamarte" />
          <Feature icon={<DollarSign />} title="Cobros digitales" desc="Transfermóvil y EnZona integrados" />
          <Feature icon={<Wifi />} title="Funciona offline" desc="Los apagones no detienen tu negocio" />
          <Feature icon={<Shield />} title="Datos seguros" desc="Backup automático en la nube" />
          <Feature icon={<Sun />} title="Reportes inteligentes" desc="Sabe cuánto ganas cada día" />
        </div>
      </section>

      {/* CTA final */}
      <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
        <GlassCard className="p-8 sm:p-12">
          <h2 className="text-3xl font-bold">¿Listo para digitalizar tu solinera?</h2>
          <p className="mt-4 text-muted-foreground">
            Configura tu negocio en 3 minutos. Sin tarjetas, sin compromiso.
          </p>
          <Button size="lg" className="mt-8 gradient-solar text-white" asChild>
            <Link href="/select-mode">
              Empezar ahora <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </GlassCard>
      </section>

      <footer className="border-t border-border/30 px-4 py-8 text-center text-sm text-muted-foreground">
        <p>© 2026 SoliNet · Hecho en Cuba con ☀️</p>
      </footer>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <GlassCard hover className="p-6">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl gradient-solar text-white">
        {icon}
      </div>
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </GlassCard>
  );
}