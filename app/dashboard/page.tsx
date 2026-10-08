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
  Calendar,
} from 'lucide-react';
import Link from 'next/link';
import { AppShell } from '@/components/soli/app-shell';
import { GlassCard, StatCard, SoliBadge, StatusIndicator } from '@/components/soli/glass-card';
import { PageHeader, FadeIn } from '@/components/soli/charts';
import { Button } from '@/components/ui/button';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Solinera } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { getBusinessProfile } from '@/lib/profile';

export default function DashboardPage() {
  const [solinera, setSolinera] = React.useState<Solinera | null>(null);
  const [loadingProfile, setLoadingProfile] = React.useState(true);
  const [user, setUser] = React.useState<any>(null);

  // Cargar usuario y solinera
  React.useEffect(() => {
    const load = async () => {
      const u = await getCurrentUser();
      setUser(u);
      if (!u || !u.id) {
        setLoadingProfile(false);
        return;
      }
      const profile = await getBusinessProfile(u.id);
      setSolinera(profile);
      setLoadingProfile(false);
    };
    load();
  }, []);

  // Datos en vivo desde Dexie
  const queue = useLiveQuery(
    () => db.queue.orderBy('createdAt').reverse().toArray(),
    []
  ) || [];

  const reservations = useLiveQuery(
    () => db.reservations.orderBy('createdAt').reverse().toArray(),
    []
  ) || [];

  const transactions = useLiveQuery(
    () => db.transactions.orderBy('createdAt').reverse().toArray(),
    []
  ) || [];

  // ===== MÉTRICAS REALES =====
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTs = today.getTime();

  // Ingresos hoy = reservas completadas + transacciones
  const todayCompletedReservations = reservations.filter(
    (r) => r.status === 'completed' && r.createdAt >= todayTs
  );
  const todayTransactions = transactions.filter((t) => t.createdAt >= todayTs);

  const todayRevenue =
    todayCompletedReservations.reduce((sum, r) => sum + r.amount, 0) +
    todayTransactions.reduce((sum, t) => sum + t.amount, 0);

  // Energía vendida (estimado: 0.2 kWh por CUP)
  const todayKwh = Math.round(todayRevenue / 5);

  // Clientes hoy
  const todayClients =
    todayCompletedReservations.length + todayTransactions.length;

  // Carga promedio
  const doneItems = queue.filter((q) => q.status === 'done' && q.chargeTime > 0);
  const avgChargeTime =
    doneItems.length > 0
      ? Math.round(
        doneItems.reduce((sum, q) => sum + q.chargeTime, 0) / doneItems.length
      )
      : 0;

  // Reservas pendientes (por aceptar)
  const pendingReservations = reservations.filter(
    (r) => r.status === 'pending'
  );

  // Reservas confirmadas (esperando llegada)
  const confirmedReservations = reservations.filter(
    (r) => r.status === 'confirmed'
  );

  // Cola activa
  const activeQueue = queue.filter(
    (q) => q.status === 'waiting' || q.status === 'charging'
  );

  // Datos de ingresos por hora (agrupados)
  const revenueByHour = React.useMemo(() => {
    const hours = ['6am', '8am', '10am', '12pm', '2pm', '4pm', '6pm', '8pm'];
    const hourMap: Record<string, number> = {};
    hours.forEach((h) => (hourMap[h] = 0));

    todayCompletedReservations.forEach((r) => {
      const hour = new Date(r.createdAt).getHours();
      let label = '';
      if (hour >= 6 && hour < 8) label = '6am';
      else if (hour >= 8 && hour < 10) label = '8am';
      else if (hour >= 10 && hour < 12) label = '10am';
      else if (hour >= 12 && hour < 14) label = '12pm';
      else if (hour >= 14 && hour < 16) label = '2pm';
      else if (hour >= 16 && hour < 18) label = '4pm';
      else if (hour >= 18 && hour < 20) label = '6pm';
      else if (hour >= 20 && hour < 22) label = '8pm';
      if (label) hourMap[label] += r.amount;
    });

    todayTransactions.forEach((t) => {
      const hour = new Date(t.createdAt).getHours();
      let label = '';
      if (hour >= 6 && hour < 8) label = '6am';
      else if (hour >= 8 && hour < 10) label = '8am';
      else if (hour >= 10 && hour < 12) label = '10am';
      else if (hour >= 12 && hour < 14) label = '12pm';
      else if (hour >= 14 && hour < 16) label = '2pm';
      else if (hour >= 16 && hour < 18) label = '4pm';
      else if (hour >= 18 && hour < 20) label = '6pm';
      else if (hour >= 20 && hour < 22) label = '8pm';
      if (label) hourMap[label] += t.amount;
    });

    return hours.map((h) => ({ hour: h, value: hourMap[h] }));
  }, [todayCompletedReservations, todayTransactions]);

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Dashboard"
          subtitle={`${solinera?.name || 'Mi Solinera'} · Hoy, ${new Date().toLocaleDateString(
            'es-ES',
            { day: 'numeric', month: 'long' }
          )}`}
          action={
            <>
              <Button variant="outline" size="sm" asChild>
                <Link href="/reportes">
                  <TrendingUp className="mr-2 h-4 w-4" /> Ver reportes
                </Link>
              </Button>
              <Button
                size="sm"
                className="gradient-solar text-white hover:opacity-90"
                asChild
              >
                <Link href="/cola">
                  <Plus className="mr-2 h-4 w-4" /> Nuevo cliente
                </Link>
              </Button>
            </>
          }
        />

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Ingresos hoy"
            value={todayRevenue.toLocaleString()}
            unit="CUP"
            icon={<DollarSign className="h-5 w-5" />}
            trend={
              todayRevenue > 0
                ? { value: 'Activo', positive: true }
                : { value: 'Sin ventas', positive: false }
            }
            gradient="solar"
            delay={0}
          />
          <StatCard
            label="Energía vendida"
            value={todayKwh.toString()}
            unit="kWh"
            icon={<Zap className="h-5 w-5" />}
            trend={{ value: 'Estimado', positive: true }}
            gradient="tech"
            delay={0.1}
          />
          <StatCard
            label="Clientes hoy"
            value={todayClients.toString()}
            icon={<Users className="h-5 w-5" />}
            trend={{ value: 'Hoy', positive: true }}
            gradient="success"
            delay={0.2}
          />
          <StatCard
            label="Carga promedio"
            value={avgChargeTime.toString()}
            unit="min"
            icon={<Clock className="h-5 w-5" />}
            trend={{ value: 'Promedio', positive: true }}
            gradient="solar"
            delay={0.3}
          />
        </div>

        {/* Alerta de reservas pendientes */}
        {pendingReservations.length > 0 && (
          <FadeIn delay={0.05}>
            <GlassCard className="border-info/40 bg-info/5 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-info text-white">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold">
                      Tienes {pendingReservations.length} reserva
                      {pendingReservations.length > 1 ? 's' : ''} pendiente
                      {pendingReservations.length > 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Ve a la cola para aceptar o rechazar
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="gradient-solar text-white"
                  asChild
                >
                  <Link href="/cola">Ver cola</Link>
                </Button>
              </div>
            </GlassCard>
          </FadeIn>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Revenue Chart */}
          <FadeIn delay={0.2} className="lg:col-span-2">
            <GlassCard className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Ingresos por hora</h3>
                  <p className="text-sm text-muted-foreground">
                    Día actual · CUP
                  </p>
                </div>
                <SoliBadge variant={todayRevenue > 0 ? 'success' : 'default'}>
                  <TrendingUp className="h-3 w-3" />
                  {todayRevenue > 0
                    ? `+${todayRevenue} CUP`
                    : 'Sin datos hoy'}
                </SoliBadge>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={revenueByHour}>
                  <defs>
                    <linearGradient
                      id="revGrad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
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

          {/* Estado de baterías (placeholder honesto) */}
          <FadeIn delay={0.3}>
            <GlassCard className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Estado de baterías</h3>
                <Battery className="h-5 w-5 text-primary" />
              </div>
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Battery className="h-8 w-8 text-muted-foreground" />
                </div>
                <h4 className="text-sm font-semibold">
                  Sin datos del inversor
                </h4>
                <p className="mt-1 max-w-[200px] text-xs text-muted-foreground">
                  Conecta tu inversor solar para ver el estado de las baterías
                  en tiempo real
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  disabled
                >
                  Próximamente
                </Button>
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
                  <h3 className="text-lg font-semibold">
                    Cola en tiempo real
                  </h3>
                  <StatusIndicator
                    online
                    label={`${activeQueue.length} activos`}
                  />
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/cola">
                    Ver todo <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="space-y-3">
                {activeQueue.length === 0 && (
                  <div className="py-8 text-center text-muted-foreground">
                    <Car className="mx-auto mb-2 h-10 w-10 opacity-40" />
                    <p className="text-sm">No hay vehículos en cola</p>
                    <p className="mt-1 text-xs">
                      Los vehículos aparecerán cuando los aceptes desde reservas
                    </p>
                  </div>
                )}
                {activeQueue.slice(0, 3).map((item, idx) => (
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
                        <p className="text-xs text-muted-foreground">
                          {item.car} · {item.plate}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {item.status === 'charging'
                            ? `${item.chargeTime} min`
                            : `${item.waitTime} min`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.status === 'charging' ? 'cargando' : 'espera'}
                        </p>
                      </div>
                      <SoliBadge
                        variant={
                          item.status === 'charging' ? 'success' : 'warning'
                        }
                      >
                        {item.status === 'charging'
                          ? 'Cargando'
                          : 'En espera'}
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
                <QuickAction
                  icon={<Plus className="h-5 w-5" />}
                  label="Nuevo cliente"
                  href="/cola"
                />
                <QuickAction
                  icon={<Wallet className="h-5 w-5" />}
                  label="Cobrar"
                  href="/cola"
                />
                <QuickAction
                  icon={<TrendingUp className="h-5 w-5" />}
                  label="Reportes"
                  href="/reportes"
                />
                <QuickAction
                  icon={<Users className="h-5 w-5" />}
                  label="Ajustes"
                  href="/configuracion"
                />
              </div>
              <div className="mt-4 rounded-xl border border-border/50 bg-gradient-to-br from-success/10 to-transparent p-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-success" />
                  <span className="text-sm font-medium">
                    Sistema operativo
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {activeQueue.length} vehículos activos ·{' '}
                  {pendingReservations.length} reservas pendientes
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