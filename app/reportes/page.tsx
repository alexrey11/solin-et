'use client';

import * as React from 'react';
import {
  TrendingUp,
  Download,
  DollarSign,
  Zap,
  Users,
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
} from 'recharts';
import { AppShell } from '@/components/soli/app-shell';
import { GlassCard, StatCard, SoliBadge } from '@/components/soli/glass-card';
import { PageHeader, FadeIn } from '@/components/soli/charts';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Reservation } from '@/lib/db';

const tooltipStyle = {
  background: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '12px',
  color: 'hsl(var(--foreground))',
  fontSize: '12px',
};

const pieColors = ['hsl(28 100% 50%)', 'hsl(217 91% 60%)', 'hsl(160 84% 39%)', 'hsl(45 100% 50%)'];

export default function ReportesPage() {
  const reservations = useLiveQuery(
    () => db.reservations.orderBy('createdAt').reverse().toArray(),
    []
  ) || [];

  const transactions = useLiveQuery(
    () => db.transactions.orderBy('createdAt').reverse().toArray(),
    []
  ) || [];

  // ===== CÁLCULOS REALES =====

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTs = today.getTime();

  const weekAgo = todayTs - 7 * 24 * 60 * 60 * 1000;
  const monthAgo = todayTs - 30 * 24 * 60 * 60 * 1000;

  // Ingresos del mes (reservas completadas + transacciones)
  const monthReservations = reservations.filter(
    (r) => r.status === 'completed' && r.createdAt >= monthAgo
  );
  const monthTransactions = transactions.filter(
    (t) => t.createdAt >= monthAgo
  );

  const monthRevenue =
    monthReservations.reduce((sum, r) => sum + r.amount, 0) +
    monthTransactions.reduce((sum, t) => sum + t.amount, 0);

  const monthKwh = Math.round(monthRevenue / 5);

  const monthClients = new Set([
    ...monthReservations.map((r) => r.driverId),
    ...monthTransactions.map((t) => t.queueItemId),
  ]).size;

  const avgTicket =
    monthReservations.length + monthTransactions.length > 0
      ? Math.round(
        monthRevenue / (monthReservations.length + monthTransactions.length)
      )
      : 0;

  // Datos por día (últimos 7 días)
  const dailyData = React.useMemo(() => {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const dayMap: Record<string, { ingresos: number; kwh: number }> = {};

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = days[d.getDay()];
      dayMap[dayName] = { ingresos: 0, kwh: 0 };
    }

    reservations
      .filter((r) => r.status === 'completed' && r.createdAt >= weekAgo)
      .forEach((r) => {
        const d = new Date(r.createdAt);
        const dayName = days[d.getDay()];
        if (dayMap[dayName]) {
          dayMap[dayName].ingresos += r.amount;
          dayMap[dayName].kwh += Math.round(r.amount / 5);
        }
      });

    transactions
      .filter((t) => t.createdAt >= weekAgo)
      .forEach((t) => {
        const d = new Date(t.createdAt);
        const dayName = days[d.getDay()];
        if (dayMap[dayName]) {
          dayMap[dayName].ingresos += t.amount;
          dayMap[dayName].kwh += Math.round(t.amount / 5);
        }
      });

    return Object.entries(dayMap).map(([day, data]) => ({
      day,
      ...data,
    }));
  }, [reservations, transactions, weekAgo]);

  // Métodos de pago
  const paymentMethods = React.useMemo(() => {
    const methods = { transfermovil: 0, enzona: 0 };
    monthReservations.forEach((r) => {
      if (r.method === 'transfermovil') methods.transfermovil += r.amount;
      if (r.method === 'enzona') methods.enzona += r.amount;
    });
    const total = methods.transfermovil + methods.enzona || 1;
    return [
      {
        name: 'Transfermóvil',
        value: Math.round((methods.transfermovil / total) * 100),
        amount: methods.transfermovil,
      },
      {
        name: 'EnZona',
        value: Math.round((methods.enzona / total) * 100),
        amount: methods.enzona,
      },
    ];
  }, [monthReservations]);

  // Estados de las reservas
  const statusData = React.useMemo(() => {
    const pending = reservations.filter((r) => r.status === 'pending').length;
    const confirmed = reservations.filter(
      (r) => r.status === 'confirmed'
    ).length;
    const completed = reservations.filter(
      (r) => r.status === 'completed'
    ).length;
    const cancelled = reservations.filter(
      (r) => r.status === 'cancelled'
    ).length;

    return [
      { name: 'Completadas', value: completed },
      { name: 'Confirmadas', value: confirmed },
      { name: 'Pendientes', value: pending },
      { name: 'Canceladas', value: cancelled },
    ].filter((s) => s.value > 0);
  }, [reservations]);

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
          <StatCard
            label="Ingresos del mes"
            value={monthRevenue.toLocaleString()}
            unit="CUP"
            icon={<DollarSign className="h-5 w-5" />}
            trend={{
              value: monthRevenue > 0 ? 'Activo' : 'Sin datos',
              positive: monthRevenue > 0,
            }}
            gradient="solar"
            delay={0}
          />
          <StatCard
            label="Energía vendida"
            value={monthKwh.toLocaleString()}
            unit="kWh"
            icon={<Zap className="h-5 w-5" />}
            trend={{ value: 'Mes actual', positive: true }}
            gradient="tech"
            delay={0.1}
          />
          <StatCard
            label="Clientes únicos"
            value={monthClients.toString()}
            icon={<Users className="h-5 w-5" />}
            trend={{ value: 'Mes actual', positive: true }}
            gradient="success"
            delay={0.2}
          />
          <StatCard
            label="Ticket promedio"
            value={avgTicket.toLocaleString()}
            unit="CUP"
            icon={<TrendingUp className="h-5 w-5" />}
            trend={{ value: 'Mes actual', positive: true }}
            gradient="solar"
            delay={0.3}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <FadeIn delay={0.1} className="lg:col-span-2">
            <GlassCard className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Ingresos últimos 7 días
                </h3>
                <SoliBadge variant="solar">
                  <Calendar className="h-3 w-3" /> Esta semana
                </SoliBadge>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={dailyData}>
                  <defs>
                    <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0.4}
                      />
                      <stop
                        offset="100%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    opacity={0.3}
                  />
                  <XAxis
                    dataKey="day"
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
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area
                    type="monotone"
                    dataKey="ingresos"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#incGrad)"
                    name="Ingresos (CUP)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </GlassCard>
          </FadeIn>

          <FadeIn delay={0.2}>
            <GlassCard className="p-6">
              <h3 className="mb-4 text-lg font-semibold">Métodos de pago</h3>
              {paymentMethods.every((m) => m.value === 0) ? (
                <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                  Sin datos de pagos aún
                </div>
              ) : (
                <>
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
                      <div
                        key={i}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ background: pieColors[i] }}
                          />
                          <span>{m.name}</span>
                        </div>
                        <span className="font-medium">{m.value}%</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </GlassCard>
          </FadeIn>
        </div>

        <FadeIn delay={0.3}>
          <GlassCard className="p-6">
            <h3 className="mb-4 text-lg font-semibold">
              Energía vendida (kWh)
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dailyData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  opacity={0.3}
                />
                <XAxis
                  dataKey="day"
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
                <Tooltip contentStyle={tooltipStyle} />
                <Bar
                  dataKey="kwh"
                  fill="hsl(var(--chart-3, 200 100% 50%))"
                  radius={[8, 8, 0, 0]}
                  name="kWh"
                />
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>
        </FadeIn>

        {/* Estado de reservas */}
        <FadeIn delay={0.4}>
          <GlassCard className="p-6">
            <h3 className="mb-4 text-lg font-semibold">
              Estado de reservas (total)
            </h3>
            {statusData.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                Aún no hay reservas
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {statusData.map((s, i) => (
                  <div
                    key={s.name}
                    className="rounded-xl border border-border/50 bg-card/30 p-4 text-center"
                  >
                    <p
                      className="text-3xl font-bold"
                      style={{ color: pieColors[i % pieColors.length] }}
                    >
                      {s.value}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {s.name}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </FadeIn>
      </div>
    </AppShell>
  );
}