'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Sun,
  Zap,
  Users,
  BarChart3,
  MapPin,
  Settings,
  ArrowRight,
  Check,
  Moon,
  Lightbulb,
  Wifi,
  Battery,
  Car,
  DollarSign,
  Clock,
  Star,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard, SoliBadge, StatusIndicator } from '@/components/soli/glass-card';
import { CircularProgress, BatteryGauge, FadeIn } from '@/components/soli/charts';
import { useTheme } from '@/components/theme-provider';
import { cn } from '@/lib/utils';

export default function Home() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background">
      {/* Background decorations */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-60 -top-60 h-[500px] w-[500px] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -left-60 top-1/3 h-[400px] w-[400px] rounded-full bg-info/5 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-[300px] w-[300px] rounded-full bg-success/5 blur-3xl" />
      </div>

      <div className="relative">
        {/* Nav */}
        <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-border/30 bg-background/60 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-12">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-solar shadow-glow-orange">
              <Sun className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">SoliNet</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/50 hover:bg-muted"
            >
              {theme === 'dark' ? <Lightbulb className="h-4 w-4 text-accent" /> : <Moon className="h-4 w-4" />}
            </button>
            <Button size="sm" variant="outline" asChild>
              <Link href="/dashboard">
                Probar demo <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </nav>

        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 pt-16 pb-12 sm:px-6 lg:px-12 lg:pt-24">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <SoliBadge variant="solar" className="mb-4">
                  <Zap className="h-3 w-3" /> Sistema operativo solar
                </SoliBadge>
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                  Energía solar <br />
                  <span className="gradient-solar-text">al alcance de todos</span>
                </h1>
                <p className="mt-5 max-w-md text-lg text-muted-foreground">
                  SoliNet conecta dueños de solineras con conductores de vehículos eléctricos en Cuba. Gestiona cargas, cobra digitalmente y visualiza tu energía en tiempo real.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button size="lg" className="gradient-solar text-white hover:opacity-90" asChild>
                    <Link href="/dashboard">
                      <Zap className="mr-2 h-5 w-5" /> SoliNet Business
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/mapa">
                      <MapPin className="mr-2 h-5 w-5" /> SoliNet Consumer
                    </Link>
                  </Button>
                </div>
                <div className="mt-6 flex items-center gap-4">
                  <StatusIndicator online label="Plataforma activa" />
                  <span className="text-sm text-muted-foreground">· Funciona con conectividad limitada</span>
                </div>
              </motion.div>
            </div>

            {/* Hero preview card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <GlassCard glow="orange" className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Ingresos de hoy</p>
                    <p className="text-3xl font-bold">2,840 <span className="text-base text-muted-foreground">CUP</span></p>
                  </div>
                  <SoliBadge variant="success">
                    <TrendingUp className="h-3 w-3" /> +18%
                  </SoliBadge>
                </div>
                <div className="mb-4 flex items-center justify-center">
                  <CircularProgress value={58} size={130} label="58%" sublabel="Baterías" />
                </div>
                <div className="space-y-2">
                  <BatteryGauge level={87} label="Banco A" />
                  <BatteryGauge level={64} label="Banco B" />
                  <BatteryGauge level={23} label="Banco C" />
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </section>

        {/* Screens preview */}
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-12">
          <FadeIn>
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold tracking-tight">Pantallas principales</h2>
              <p className="mt-2 text-muted-foreground">Navega por el prototipo completo</p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { href: '/dashboard', icon: BarChart3, title: 'Dashboard Business', desc: 'Métricas, ingresos y estado en tiempo real', color: 'from-orange-500/20 to-yellow-500/5' },
              { href: '/cola', icon: Users, title: 'Gestión de Cola', desc: 'Asigna puntos, controla tiempos y cobra', color: 'from-blue-500/20 to-cyan-500/5' },
              { href: '/mapa', icon: MapPin, title: 'Mapa Consumer', desc: 'Encuentra solineras y reserva carga', color: 'from-green-500/20 to-emerald-500/5' },
              { href: '/reportes', icon: BarChart3, title: 'Reportes', desc: 'Gráficos de ingresos y energía vendida', color: 'from-orange-500/20 to-amber-500/5' },
              { href: '/configuracion', icon: Settings, title: 'Configuración', desc: 'Tarifas, usuarios y notificaciones', color: 'from-blue-500/20 to-indigo-500/5' },
              { href: '/onboarding', icon: Sun, title: 'Onboarding', desc: 'Configuración inicial paso a paso', color: 'from-green-500/20 to-teal-500/5' },
            ].map((screen, i) => (
              <motion.div
                key={screen.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Link href={screen.href}>
                  <GlassCard hover className={cn('h-full p-6 bg-gradient-to-br', screen.color)}>
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl gradient-solar text-white">
                      <screen.icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-semibold">{screen.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{screen.desc}</p>
                    <div className="mt-3 flex items-center text-sm text-primary">
                      Explorar <ArrowRight className="ml-1 h-4 w-4" />
                    </div>
                  </GlassCard>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Design System */}
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-12">
          <FadeIn>
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold tracking-tight">Sistema de diseño</h2>
              <p className="mt-2 text-muted-foreground">Componentes, colores y tipografía</p>
            </div>
          </FadeIn>

          {/* Colors */}
          <FadeIn delay={0.1}>
            <GlassCard className="mb-6 p-6">
              <h3 className="mb-4 text-lg font-semibold">Paleta de colores</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <ColorSwatch name="Solar" hex="#FF8C00" className="gradient-solar" />
                <ColorSwatch name="Tecnológico" hex="#0A192F" className="gradient-tech" />
                <ColorSwatch name="Sostenible" hex="#10B981" className="gradient-success" />
                <ColorSwatch name="Acento" hex="#FFD700" style={{ background: 'hsl(var(--accent))' }} />
                <ColorSwatch name="Card" hex="--card" style={{ background: 'hsl(var(--card))' }} />
                <ColorSwatch name="Fondo" hex="--background" style={{ background: 'hsl(var(--background))' }} />
              </div>
            </GlassCard>
          </FadeIn>

          {/* Components */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <FadeIn delay={0.2}>
              <GlassCard className="p-6">
                <h3 className="mb-4 text-lg font-semibold">Botones</h3>
                <div className="flex flex-wrap gap-3">
                  <Button className="gradient-solar text-white hover:opacity-90">Primario</Button>
                  <Button variant="outline">Secundario</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="destructive">Destructivo</Button>
                  <Button size="sm" className="gradient-solar text-white">Pequeño</Button>
                  <Button size="lg" className="gradient-solar text-white">Grande</Button>
                </div>
              </GlassCard>
            </FadeIn>

            <FadeIn delay={0.3}>
              <GlassCard className="p-6">
                <h3 className="mb-4 text-lg font-semibold">Badges y estados</h3>
                <div className="flex flex-wrap gap-2">
                  <SoliBadge variant="default">Default</SoliBadge>
                  <SoliBadge variant="success"><Check className="h-3 w-3" /> Success</SoliBadge>
                  <SoliBadge variant="warning">Warning</SoliBadge>
                  <SoliBadge variant="destructive">Error</SoliBadge>
                  <SoliBadge variant="info">Info</SoliBadge>
                  <SoliBadge variant="solar"><Zap className="h-3 w-3" /> Solar</SoliBadge>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-3">
                    <StatusIndicator online label="En línea" />
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusIndicator online={false} label="Sin conexión" />
                  </div>
                </div>
              </GlassCard>
            </FadeIn>

            <FadeIn delay={0.4}>
              <GlassCard className="p-6">
                <h3 className="mb-4 text-lg font-semibold">Tipografía</h3>
                <div className="space-y-2">
                  <p className="text-3xl font-bold tracking-tight">Título H1</p>
                  <p className="text-2xl font-semibold">Subtítulo H2</p>
                  <p className="text-lg font-medium">Texto destacado</p>
                  <p className="text-base">Texto normal</p>
                  <p className="text-sm text-muted-foreground">Texto secundario</p>
                  <p className="text-xs text-muted-foreground">Texto auxiliar</p>
                </div>
              </GlassCard>
            </FadeIn>

            <FadeIn delay={0.5}>
              <GlassCard className="p-6">
                <h3 className="mb-4 text-lg font-semibold">Indicadores</h3>
                <div className="flex items-center gap-6">
                  <CircularProgress value={75} size={100} label="75%" sublabel="Carga" />
                  <div className="flex-1 space-y-3">
                    <BatteryGauge level={87} label="Banco A" />
                    <BatteryGauge level={45} label="Banco B" />
                    <BatteryGauge level={18} label="Banco C" />
                  </div>
                </div>
              </GlassCard>
            </FadeIn>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-12">
          <FadeIn>
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold tracking-tight">Diseñado para Cuba</h2>
              <p className="mt-2 text-muted-foreground">Optimizado para conectividad limitada y uso móvil</p>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Wifi, title: 'Modo offline', desc: 'Indicadores de conexión visibles en todo momento' },
              { icon: Zap, title: 'Carga inteligente', desc: 'Gestión de múltiples puntos simultáneos' },
              { icon: DollarSign, title: 'Pagos digitales', desc: 'Transfermóvil y EnZona integrados' },
              { icon: Battery, title: 'Energía solar', desc: 'Monitoreo de baterías y producción' },
            ].map((f, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <GlassCard hover className="p-6 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl gradient-solar text-white">
                    <f.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold">{f.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
                </GlassCard>
              </FadeIn>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
          <FadeIn>
            <GlassCard glow="orange" className="p-8 text-center sm:p-12">
              <h2 className="text-3xl font-bold tracking-tight">Empieza a generar ingresos con tu solinera</h2>
              <p className="mx-auto mt-3 max-w-md text-muted-foreground">
                Configura tu negocio en minutos y únete a la red de energía solar de Cuba
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Button size="lg" className="gradient-solar text-white hover:opacity-90" asChild>
                  <Link href="/onboarding">
                    Comenzar onboarding <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/dashboard">Ver dashboard</Link>
                </Button>
              </div>
            </GlassCard>
          </FadeIn>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/30 px-4 py-8 sm:px-6 lg:px-12">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-solar">
                <Sun className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold">SoliNet</span>
              <span className="text-sm text-muted-foreground">· Energía Solar Inteligente</span>
            </div>
            <p className="text-sm text-muted-foreground">Hecho para Cuba · 2026</p>
          </div>
        </footer>
      </div>
    </div>
  );
}

function ColorSwatch({
  name,
  hex,
  className,
  style,
}: {
  name: string;
  hex: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className="text-center">
      <div
        className={cn('mx-auto mb-2 h-16 w-16 rounded-xl border border-border/30', className)}
        style={style}
      />
      <p className="text-xs font-medium">{name}</p>
      <p className="text-xs text-muted-foreground">{hex}</p>
    </div>
  );
}
