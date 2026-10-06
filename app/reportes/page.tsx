'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Download,
  DollarSign,
  Zap,
  Users,
  Smartphone,
  CreditCard,
  Calendar,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from 'recharts';
import { AppShell } from '@/components/soli/app-shell';
import { GlassCard, StatCard, SoliBadge } from '@/components/soli/glass-card';
import { PageHeader, FadeIn } from '@/components/soli/charts';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

const dailyData = [
  { day: 'Lun', ingresos: 2400, kwh: 128 },
  { day: 'Mar', ingresos: 1800, kwh: 95 },
  { day: 'Mié', ingresos: 3200, kwh: 165 },
  { day: 'Jue', ingresos: 2800, kwh: 142 },
  { day: 'Vie', ingresos: 4100, kwh: 210 },
  { day: 'Sáb', ingresos: 5200, kwh: 268 },
  { day: 'Dom', ingresos: 3800, kwh: 195 },
];

const weeklyData = [
  { week: 'Sem 1', ingresos: 18000, kwh: 920 },
  { week: 'Sem 2', ingresos: 22000, kwh: 1080 },
  { week: 'Sem 3', ingresos: 19500, kwh: 980 },
  { week: 'Sem 4', ingresos: 26500, kwh: 1320 },
];

const monthlyData = [
  { month: 'May', ingresos: 68000, kwh: 3400 },
  { month: 'Jun', ingresos: 72000, kwh: 3600 },
  { month: 'Jul', ingresos: 85000, kwh: 4100 },
  { month: 'Ago', ingresos: 79000, kwh: 3900 },
  { month: 'Sep', ingresos: 92000, kwh: 4500 },
  { month: 'Oct', ingresos: 61000, kwh: 2980 },
];

const paymentMethods = [
  { name: 'Transfermóvil', value: 45, color: 'hsl(28 100% 50%)' },
  { name: 'EnZona', value: 30, color: 'hsl(217 91% 60%)' },
  { name: 'Efectivo', value: 15, color: 'hsl(160 84% 39%)' },
  { name: 'Bandes', value: 10, color: 'hsl(45 100% 50%)' },
];

const pieColors = ['hsl(28 100% 50%)', 'hsl(217 91% 60%)', 'hsl(160 84% 39%)', 'hsl(45 100% 50%)'];

export default function ReportesPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Reportes"
          subtitle="Analiza el rendimiento de tu solinera"
          action={
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" /> Exportar
            </Button>
          }
        />

        {/* Summary Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Ingresos del mes" value="61,000" unit="CUP" icon={<DollarSign className="h-5 w-5" />} trend={{ value: '8%', positive: true }} gradient="solar" delay={0} />
          <StatCard label="Energía vendida" value="2,980" unit="kWh" icon={<Zap className="h-5 w-5" />} trend={{ value: '5%', positive: false }} gradient="tech" delay={0.1} />
          <StatCard label="Clientes únicos" value="187" icon={<Users className="h-5 w-5" />} trend={{ value: '22%', positive: true }} gradient="success" delay={0.2} />
          <StatCard label="Ticket promedio" value="126" unit="CUP" icon={<TrendingUp className="h-5 w-5" />} trend={{ value: '3%', positive: true }} gradient="solar" delay={0.3} />
        </div>

        <Tabs defaultValue="daily">
          <TabsList className="bg-card/40 backdrop-blur">
            <TabsTrigger value="daily">Día</TabsTrigger>
            <TabsTrigger value="weekly">Semana</TabsTrigger>
            <TabsTrigger value="monthly">Mes</TabsTrigger>
          </TabsList>

          {/* Daily */}
          <TabsContent value="daily" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <FadeIn delay={0.1} className="lg:col-span-2">
                <GlassCard className="p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Ingresos y energía por día</h3>
                    <SoliBadge variant="solar">Última semana</SoliBadge>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={dailyData}>
                      <defs>
                        <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="kwhGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--chart-3))" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="hsl(var(--chart-3))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Area type="monotone" dataKey="ingresos" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#incGrad)" name="Ingresos (CUP)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </GlassCard>
              </FadeIn>

              <FadeIn delay={0.2}>
                <GlassCard className="p-6">
                  <h3 className="mb-4 text-lg font-semibold">Métodos de pago</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={paymentMethods}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {paymentMethods.map((_, i) => (
                          <Cell key={i} fill={pieColors[i]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 pt-2">
                    {paymentMethods.map((m, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ background: pieColors[i] }} />
                          <span>{m.name}</span>
                        </div>
                        <span className="font-medium">{m.value}%</span>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </FadeIn>
            </div>

            <FadeIn delay={0.3}>
              <GlassCard className="p-6">
                <h3 className="mb-4 text-lg font-semibold">Energía vendida por día (kWh)</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="kwh" fill="hsl(var(--chart-3))" radius={[8, 8, 0, 0]} name="kWh" />
                  </BarChart>
                </ResponsiveContainer>
              </GlassCard>
            </FadeIn>
          </TabsContent>

          {/* Weekly */}
          <TabsContent value="weekly" className="space-y-6">
            <FadeIn delay={0.1}>
              <GlassCard className="p-6">
                <h3 className="mb-4 text-lg font-semibold">Ingresos semanales</h3>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="ingresos" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} name="Ingresos (CUP)" />
                  </BarChart>
                </ResponsiveContainer>
              </GlassCard>
            </FadeIn>
          </TabsContent>

          {/* Monthly */}
          <TabsContent value="monthly" className="space-y-6">
            <FadeIn delay={0.1}>
              <GlassCard className="p-6">
                <h3 className="mb-4 text-lg font-semibold">Tendencia mensual</h3>
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="monthGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area type="monotone" dataKey="ingresos" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#monthGrad)" name="Ingresos (CUP)" />
                  </AreaChart>
                </ResponsiveContainer>
              </GlassCard>
            </FadeIn>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

const tooltipStyle = {
  background: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '12px',
  color: 'hsl(var(--foreground))',
  fontSize: '12px',
};
