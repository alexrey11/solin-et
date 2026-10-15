'use client';

import * as React from 'react';
import {
  TrendingUp,
  Download,
  DollarSign,
  Zap,
  Users,
  Calendar,
  Smartphone,
  CreditCard,
  Banknote,
  Loader2,
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
import { exportReportPDF } from '@/lib/export-pdf';
import { toast } from 'sonner';
import { useSolineraActiva } from '@/lib/queries/solinera';
import {
  useMonthTransactions,
  useAllReservations,
} from '@/lib/queries/dashboard';

const tooltipStyle = {
  background: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '12px',
  color: 'hsl(var(--foreground))',
  fontSize: '12px',
};

const pieColors = [
  'hsl(28 100% 50%)',
  'hsl(217 91% 60%)',
  'hsl(160 84% 39%)',
];

export default function ReportesPage() {
  const { data: solinera, isLoading } = useSolineraActiva();
  const { data: transactions = [] } = useMonthTransactions();
  const { data: reservations = [] } = useAllReservations();

  // ===== CÁLCULOS =====
  const monthRevenue = transactions.reduce(
    (sum: number, t: any) => sum + Number(t.amount || 0),
    0
  );
  const monthKwh = transactions.reduce(
    (sum: number, t: any) => sum + Math.round(Number(t.amount || 0) / 5),
    0
  );
  const monthClients = new Set(transactions.map((t: any) => t.plate)).size;
  const avgTicket =
    transactions.length > 0
      ? Math.round(monthRevenue / transactions.length)
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

    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    transactions
      .filter((t: any) => new Date(t.created_at).getTime() >= weekAgo)
      .forEach((t: any) => {
        const d = new Date(t.created_at);
        const dayName = days[d.getDay()];
        if (dayMap[dayName]) {
          dayMap[dayName].ingresos += Number(t.amount || 0);
          dayMap[dayName].kwh += Math.round(Number(t.amount || 0) / 5);
        }
      });

    return Object.entries(dayMap).map(([day, data]) => ({
      day,
      ...data,
    }));
  }, [transactions]);

  // Métodos de pago
  const paymentMethods = React.useMemo(() => {
    const methods = { transfermovil: 0, enzona: 0, efectivo: 0 };
    transactions.forEach((t: any) => {
      if (t.method === 'transfermovil') methods.transfermovil += Number(t.amount || 0);
      if (t.method === 'enzona') methods.enzona += Number(t.amount || 0);
      if (t.method === 'efectivo') methods.efectivo += Number(t.amount || 0);
    });

    const total =
      methods.transfermovil + methods.enzona + methods.efectivo || 1;

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
      {
        name: 'Efectivo',
        value: Math.round((methods.efectivo / total) * 100),
        amount: methods.efectivo,
      },
    ];
  }, [transactions]);

  const hasPaymentData = paymentMethods.some((m) => m.amount > 0);

  // Estados de reservas
  const statusData = React.useMemo(() => {
    const pending = reservations.filter((r: any) => r.status === 'pending').length;
    const confirmed = reservations.filter(
      (r: any) => r.status === 'confirmed'
    ).length;
    const completed = reservations.filter(
      (r: any) => r.status === 'completed'
    ).length;
    const cancelled = reservations.filter(
      (r: any) => r.status === 'cancelled'
    ).length;

    return [
      { name: 'Completadas', value: completed, color: 'hsl(160 84% 39%)' },
      { name: 'Confirmadas', value: confirmed, color: 'hsl(217 91% 60%)' },
      { name: 'Pendientes', value: pending, color: 'hsl(45 100% 50%)' },
      { name: 'Canceladas', value: cancelled, color: 'hsl(0 84% 60%)' },
    ].filter((s) => s.value > 0);
  }, [reservations]);

  // Top clientes
  const topClients = React.useMemo(() => {
    const map = new Map<
      string,
      { plate: string; name: string; count: number; total: number }
    >();

    transactions.forEach((t: any) => {
      const existing = map.get(t.plate);
      if (existing) {
        existing.count += 1;
        existing.total += Number(t.amount || 0);
      } else {
        map.set(t.plate, {
          plate: t.plate,
          name: t.driver_name,
          count: 1,
          total: Number(t.amount || 0),
        });
      }
    });

    return Array.from(map.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [transactions]);

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex h-96 flex-col items-center justify-center gap-4 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Cargando reportes...</p>
        </div>
      </AppShell>
    );
  }

  if (!solinera) {
    return (
      <AppShell>
        <div className="flex h-96 items-center justify-center text-muted-foreground">
          No tienes solinera configurada
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Reportes"
          subtitle="Analiza el rendimiento de tu solinera"
          action={
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              onClick={async () => {
                if (!solinera) return;
                try {
                  await exportReportPDF({
                    solinera: {
                      name: solinera.name,
                      address: solinera.address,
                      phone: solinera.phone,
                    },
                    transactions: transactions.map((t: any) => ({
                      created_at: t.created_at,
                      driver_name: t.driver_name,
                      plate: t.plate,
                      duration_min: t.duration_min,
                      amount: Number(t.amount),
                      method:
                        t.method === 'transfermovil'
                          ? 'Transfermóvil'
                          : t.method === 'enzona'
                            ? 'EnZona'
                            : 'Efectivo',
                    })),
                    monthLabel: new Date().toLocaleDateString('es-ES', {
                      month: 'long',
                      year: 'numeric',
                    }),
                    totalRevenue: monthRevenue,
                  });
                } catch (err) {
                  console.error(err);
                  toast.error('Error al exportar');
                }
              }}
            >
              <Download className="mr-2 h-4 w-4" /> Exportar PDF
            </Button>
          }
        />

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
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

        {/* Ingresos + Métodos de pago */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
          <FadeIn delay={0.1} className="lg:col-span-2">
            <GlassCard className="p-4 sm:p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-semibold sm:text-lg">
                  Ingresos últimos 7 días
                </h3>
                <SoliBadge variant="solar">
                  <Calendar className="h-3 w-3" /> Esta semana
                </SoliBadge>
              </div>
              <div className="-ml-2 sm:ml-0">
                <ResponsiveContainer width="100%" height={240}>
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
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      width={40}
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
              </div>
            </GlassCard>
          </FadeIn>

          <FadeIn delay={0.2}>
            <GlassCard className="p-4 sm:p-6">
              <h3 className="mb-4 text-base font-semibold sm:text-lg">
                Métodos de pago
              </h3>
              {!hasPaymentData ? (
                <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                  Sin datos de pagos aún
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={paymentMethods.filter((m) => m.amount > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {paymentMethods
                          .filter((m) => m.amount > 0)
                          .map((_, i) => (
                            <Cell key={i} fill={pieColors[i]} />
                          ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 pt-3">
                    {paymentMethods
                      .filter((m) => m.amount > 0)
                      .map((m, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between gap-2 text-sm"
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <div
                              className="h-3 w-3 shrink-0 rounded-full"
                              style={{ background: pieColors[i] }}
                            />
                            <span className="truncate">{m.name}</span>
                          </div>
                          <div className="flex shrink-0 items-baseline gap-2">
                            <span className="font-medium">{m.value}%</span>
                            <span className="text-xs text-muted-foreground">
                              {m.amount.toLocaleString()} CUP
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </>
              )}
            </GlassCard>
          </FadeIn>
        </div>

        {/* Energía vendida */}
        <FadeIn delay={0.3}>
          <GlassCard className="p-4 sm:p-6">
            <h3 className="mb-4 text-base font-semibold sm:text-lg">
              Energía vendida (kWh)
            </h3>
            <div className="-ml-2 sm:ml-0">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dailyData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    opacity={0.3}
                  />
                  <XAxis
                    dataKey="day"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    width={40}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar
                    dataKey="kwh"
                    fill="hsl(28 100% 50%)"
                    radius={[8, 8, 0, 0]}
                    name="kWh"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </FadeIn>

        {/* Estados + Top clientes */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
          <FadeIn delay={0.4}>
            <GlassCard className="p-4 sm:p-6">
              <h3 className="mb-4 text-base font-semibold sm:text-lg">
                Estado de reservas
              </h3>
              {statusData.length === 0 ? (
                <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                  Aún no hay reservas
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {statusData.map((s) => (
                    <div
                      key={s.name}
                      className="rounded-xl border border-border/50 bg-card/30 p-3 text-center sm:p-4"
                    >
                      <p
                        className="text-2xl font-bold sm:text-3xl"
                        style={{ color: s.color }}
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

          <FadeIn delay={0.5}>
            <GlassCard className="p-4 sm:p-6">
              <h3 className="mb-4 text-base font-semibold sm:text-lg">
                Top 5 clientes del mes
              </h3>
              {topClients.length === 0 ? (
                <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                  Aún no hay clientes
                </div>
              ) : (
                <div className="space-y-2.5">
                  {topClients.map((c, i) => (
                    <div
                      key={c.plate}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-card/30 p-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                          {i + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {c.name}
                          </p>
                          <p className="truncate font-mono text-xs text-muted-foreground">
                            {c.plate} · {c.count} carga
                            {c.count !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <p className="shrink-0 text-sm font-semibold text-primary">
                        {c.total.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </FadeIn>
        </div>

        {/* Historial del mes */}
        <FadeIn delay={0.6}>
          <GlassCard className="p-4 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-semibold sm:text-lg">
                Historial del mes ({transactions.length})
              </h3>
            </div>

            {transactions.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No hay transacciones este mes
              </div>
            ) : (
              <>
                {/* Desktop: tabla */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/50 text-left text-xs text-muted-foreground">
                        <th className="pb-2 pr-4 font-medium">Fecha</th>
                        <th className="pb-2 pr-4 font-medium">Cliente</th>
                        <th className="pb-2 pr-4 font-medium">Matrícula</th>
                        <th className="pb-2 pr-4 font-medium">Duración</th>
                        <th className="pb-2 pr-4 font-medium">Método</th>
                        <th className="pb-2 text-right font-medium">Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.slice(0, 50).map((t: any) => (
                        <tr
                          key={t.id}
                          className="border-b border-border/30 text-sm hover:bg-muted/30"
                        >
                          <td className="py-2 pr-4 font-mono text-xs">
                            {new Date(t.created_at).toLocaleDateString(
                              'es-ES',
                              { day: '2-digit', month: 'short' }
                            )}{' '}
                            {new Date(t.created_at).toLocaleTimeString(
                              'es-ES',
                              { hour: '2-digit', minute: '2-digit' }
                            )}
                          </td>
                          <td className="py-2 pr-4">{t.driver_name}</td>
                          <td className="py-2 pr-4 font-mono text-xs">
                            {t.plate}
                          </td>
                          <td className="py-2 pr-4 text-muted-foreground">
                            {t.duration_min} min
                          </td>
                          <td className="py-2 pr-4">
                            <SoliBadge
                              variant={
                                t.method === 'transfermovil'
                                  ? 'solar'
                                  : t.method === 'enzona'
                                    ? 'info'
                                    : 'default'
                              }
                            >
                              {t.method === 'transfermovil' ? (
                                <>
                                  <Smartphone className="h-3 w-3" />
                                  Transfermóvil
                                </>
                              ) : t.method === 'enzona' ? (
                                <>
                                  <CreditCard className="h-3 w-3" />
                                  EnZona
                                </>
                              ) : (
                                <>
                                  <Banknote className="h-3 w-3" />
                                  Efectivo
                                </>
                              )}
                            </SoliBadge>
                          </td>
                          <td className="py-2 text-right font-semibold text-primary">
                            {t.amount} CUP
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile: cards */}
                <div className="space-y-2.5 md:hidden">
                  {transactions.slice(0, 50).map((t: any) => (
                    <div
                      key={t.id}
                      className="rounded-xl border border-border/50 bg-card/30 p-3"
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="font-mono text-xs text-muted-foreground">
                          {new Date(t.created_at).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                          })}{' '}
                          ·{' '}
                          {new Date(t.created_at).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <SoliBadge
                          variant={
                            t.method === 'transfermovil'
                              ? 'solar'
                              : t.method === 'enzona'
                                ? 'info'
                                : 'default'
                          }
                        >
                          {t.method === 'transfermovil'
                            ? 'Transfermóvil'
                            : t.method === 'enzona'
                              ? 'EnZona'
                              : 'Efectivo'}
                        </SoliBadge>
                      </div>
                      <div className="flex items-end justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {t.driver_name}
                          </p>
                          <p className="truncate font-mono text-xs text-muted-foreground">
                            {t.plate} · {t.duration_min} min
                          </p>
                        </div>
                        <p className="shrink-0 text-base font-bold text-primary">
                          {t.amount} CUP
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </GlassCard>
        </FadeIn>
      </div>
    </AppShell>
  );
}