'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  Zap,
  Users,
  Battery,
  TrendingUp,
  Clock,
  Car,
  ArrowRight,
  Plus,
  Wallet,
  Activity,
} from 'lucide-react';
import Link from 'next/link';
import { AppShell } from '@/components/soli/app-shell';
import { GlassCard, StatCard, SoliBadge, StatusIndicator } from '@/components/soli/glass-card';
import { CircularProgress, BatteryGauge, PageHeader, FadeIn } from '@/components/soli/charts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const revenueData = [
  { hour: '6am', value: 120 },
  { hour: '8am', value: 340 },
  { hour: '10am', value: 580 },
  { hour: '12pm', value: 890 },
  { hour: '2pm', value: 720 },
  { hour: '4pm', value: 950 },
  { hour: '6pm', value: 1240 },
  { hour: '8pm', value: 680 },
];

const queue = [
  { id: 1, name: 'Carlos Pérez', car: 'Nissan Leaf', wait: '12 min', status: 'Cargando' },
  { id: 2, name: 'María González', car: 'BYD Dolphin', wait: '5 min', status: 'En espera' },
  { id: 3, name: 'José Martínez', car: 'Tesla Model 3', wait: '20 min', status: 'En espera' },
];

const batteries = [
  { name: 'Banco A', level: 87 },
  { name: 'Banco B', level: 64 },
  { name: 'Banco C', level: 23 },
];

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Dashboard"
          subtitle="Solinera Centro Habana · Hoy, 6 de octubre"
          action={
            <>
              <Button variant="outline" size="sm" asChild>
                <Link href="/reportes">
                  <TrendingUp className="mr-2 h-4 w-4" /> Ver reportes
                </Link>
              </Button>
              <Button size="sm" className="gradient-solar text-white hover:opacity-90" asChild>
                <Link href="/cola">
                  <Plus className="mr-2 h-4 w-4" /> Nuevo cliente
                </Link>
              </Button>
            </>
          }
        />

        {/* Stat Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Ingresos hoy"
            value="2,840"
            unit="CUP"
            icon={<DollarSign className="h-5 w-5" />}
            trend={{ value: '18%', positive: true }}
            gradient="solar"
            delay={0}
          />
          <StatCard
            label="Energía vendida"
            value="148"
            unit="kWh"
            icon={<Zap className="h-5 w-5" />}
            trend={{ value: '12%', positive: true }}
            gradient="tech"
            delay={0.1}
          />
          <StatCard
            label="Clientes hoy"
            value="24"
            icon={<Users className="h-5 w-5" />}
            trend={{ value: '6%', positive: false }}
            gradient="success"
            delay={0.2}
          />
          <StatCard
            label="Carga promedio"
            value="38"
            unit="min"
            icon={<Clock className="h-5 w-5" />}
            trend={{ value: '4%', positive: true }}
            gradient="solar"
            delay={0.3}
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Revenue Chart */}
          <FadeIn delay={0.2} className="lg:col-span-2">
            <GlassCard className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Ingresos por hora</h3>
                  <p className="text-sm text-muted-foreground">Día actual · CUP</p>
                </div>
                <SoliBadge variant="success">
                  <TrendingUp className="h-3 w-3" /> +18%
                </SoliBadge>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="hour"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      color: 'hsl(var(--foreground))',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#revGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </GlassCard>
          </FadeIn>

          {/* Battery Status */}
          <FadeIn delay={0.3}>
            <GlassCard className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Estado de baterías</h3>
                <Battery className="h-5 w-5 text-primary" />
              </div>
              <div className="flex justify-center py-4">
                <CircularProgress
                  value={58}
                  size={140}
                  label="58%"
                  sublabel="Promedio"
                  color="hsl(var(--primary))"
                />
              </div>
              <div className="space-y-3 pt-2">
                {batteries.map((b) => (
                  <BatteryGauge key={b.name} level={b.level} label={b.name} />
                ))}
              </div>
            </GlassCard>
          </FadeIn>
        </div>

        {/* Queue Preview & Quick Actions */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Queue */}
          <FadeIn delay={0.4} className="lg:col-span-2">
            <GlassCard className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold">Cola en tiempo real</h3>
                  <StatusIndicator online label="3 activos" />
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/cola">
                    Ver todo <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="space-y-3">
                {queue.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + idx * 0.1 }}
                    className="flex items-center justify-between rounded-xl border border-border/50 bg-card/30 p-4 transition-colors hover:border-primary/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                        <Car className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.car}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{item.wait}</p>
                        <p className="text-xs text-muted-foreground">espera</p>
                      </div>
                      <SoliBadge variant={item.status === 'Cargando' ? 'success' : 'warning'}>
                        {item.status}
                      </SoliBadge>
                    </div>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </FadeIn>

          {/* Quick Actions */}
          <FadeIn delay={0.5}>
            <GlassCard className="p-6">
              <h3 className="mb-4 text-lg font-semibold">Accesos rápidos</h3>
              <div className="grid grid-cols-2 gap-3">
                <QuickAction icon={<Plus className="h-5 w-5" />} label="Nuevo cliente" href="/cola" />
                <QuickAction icon={<Wallet className="h-5 w-5" />} label="Cobrar" href="/cola" />
                <QuickAction icon={<BarChart3Icon />} label="Reportes" href="/reportes" />
                <QuickAction icon={<SettingsIcon />} label="Ajustes" href="/configuracion" />
              </div>
              <div className="mt-4 rounded-xl border border-border/50 bg-gradient-to-br from-success/10 to-transparent p-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-success" />
                  <span className="text-sm font-medium">Sistema operativo</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Todos los puntos de carga activos. Producción solar: 4.2 kW
                </p>
              </div>
            </GlassCard>
          </FadeIn>
        </div>
      </div>
    </AppShell>
  );
}

function QuickAction({
  icon,
  label,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="flex flex-col items-center gap-2 rounded-xl border border-border/50 bg-card/30 p-4 text-center transition-colors hover:border-primary/30"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-solar text-white">
          {icon}
        </div>
        <span className="text-xs font-medium">{label}</span>
      </motion.div>
    </Link>
  );
}

function BarChart3Icon() {
  return <TrendingUp className="h-5 w-5" />;
}

function SettingsIcon() {
  return <Users className="h-5 w-5" />;
}
