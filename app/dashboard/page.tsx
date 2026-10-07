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
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, seedIfEmpty } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { getBusinessProfile } from '@/lib/profile';
import { Solinera } from '@/lib/db';

// Estado de baterías (por ahora estático)
const batteries = [
  { name: 'Banco A', level: 87 },
  { name: 'Banco B', level: 64 },
  { name: 'Banco C', level: 23 },
];

export default function DashboardPage() {
  const [solinera, setSolinera] = React.useState<Solinera | null>(null);
  const [loadingProfile, setLoadingProfile] = React.useState(true);

  // Cargar la solinera del usuario logueado
  React.useEffect(() => {
    const load = async () => {
      const user = await getCurrentUser();
      if (!user || !user.id) {
        setLoadingProfile(false);
        return;
      }
      const profile = await getBusinessProfile(user.id);
      setSolinera(profile);
      setLoadingProfile(false);
    };
    load();
  }, []);

  // Datos en vivo
  const queue = useLiveQuery(
    () => db.queue.orderBy('createdAt').reverse().toArray(),
    []
  ) || [];

  const transactions = useLiveQuery(
    () => db.transactions.orderBy('createdAt').reverse().toArray(),
    []
  ) || [];

  React.useEffect(() => {
    seedIfEmpty();
  }, []);

  // Métricas
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTs = today.getTime();

  const todayTransactions = transactions.filter((t) => t.createdAt >= todayTs);
  const todayRevenue = todayTransactions.reduce((sum, t) => sum + t.amount, 0);
  const todayKwh = transactions
    .filter((t) => t.createdAt >= todayTs)
    .reduce((sum, t) => sum + Math.round(t.amount / 5), 0);
  const todayClients = todayTransactions.length;

  const avgChargeTime =
    todayTransactions.length > 0
      ? Math.round(
        queue
          .filter((q) => q.status === 'done' && q.chargeTime > 0)
          .reduce((sum, q) => sum + q.chargeTime, 0) /
        Math.max(1, queue.filter((q) => q.status === 'done').length)
      )
      : 0;

  const activeQueue = queue.filter(
    (q) => q.status === 'waiting' || q.status === 'charging'
  );

  const revenueByHour = React.useMemo(() => {
    const hours = ['6am', '8am', '10am', '12pm', '2pm', '4pm', '6pm', '8pm'];
    const hourMap: Record<string, number> = {};
    hours.forEach((h) => (hourMap[h] = 0));

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
  }, [todayTransactions]);

  const revenueTrend =
    todayRevenue > 2000
      ? { value: '18%', positive: true }
      : { value: '5%', positive: false };

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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Ingresos hoy"
            value={todayRevenue.toLocaleString()}
            unit="CUP"
            icon={<DollarSign className="h-5 w-5" />}
            trend={revenueTrend}
            gradient="solar"
            delay={0}
          />
          <StatCard
            label="Energía vendida"
            value={todayKwh.toString()}
            unit="kWh"
            icon={<Zap className="h-5 w-5" />}
            trend={{ value: '12%', positive: true }}
            gradient="tech"
            delay={0.1}
          />
          <StatCard
            label="Clientes hoy"
            value={todayClients.toString()}
            icon={<Users className="h-5 w-5" />}
            trend={{ value: '6%', positive: true }}
            gradient="success"
            delay={0.2}
          />
          <StatCard
            label="Carga promedio"
            value={avgChargeTime.toString()}
            unit="min"
            icon={<Clock className="h-5 w-5" />}
            trend={{ value: '4%', positive: true }}
            gradient="solar"
            delay={0.3}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
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
                  {todayRevenue > 0 ? `+${todayRevenue} CUP` : 'Sin datos hoy'}
                </SoliBadge>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={revenueByHour}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
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
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      asChild
                    >
                      <Link href="/cola">
                        <Plus className="mr-2 h-4 w-4" /> Añadir cliente
                      </Link>
                    </Button>
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
                        {item.status === 'charging' ? 'Cargando' : 'En espera'}
                      </SoliBadge>
                    </div>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </FadeIn>

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
                  {todayTransactions.length} cobros hoy
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