'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Car,
  Clock,
  Zap,
  DollarSign,
  CheckCircle2,
  X,
  Plus,
  Timer,
  PlayCircle,
  QrCode,
  Calendar,
  Smartphone,
  CreditCard,
  Check,
  AlarmClock,
  TrendingUp,
  History,
  Gauge,
  Banknote,
  Calculator,
  Loader2,
} from 'lucide-react';
import { AppShell } from '@/components/soli/app-shell';
import {
  GlassCard,
  SoliBadge,
  StatusIndicator,
} from '@/components/soli/glass-card';
import { PageHeader, FadeIn } from '@/components/soli/charts';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  useQueue,
  useAddToQueue,
  useStartCharge,
  useCompleteCharge,
  useRemoveFromQueue,
  useTodayTransactions,
  QueueItemRemote,
} from '@/lib/queries/cola';
import { useSolineraActiva } from '@/lib/queries/solinera';
import {
  useSolineraReservations,
  useAcceptReservation,
  useRejectReservation,
  ReservationRemote,
} from '@/lib/queries/reservas';
import { ChargePointConfig } from '@/lib/db';

// ===== COUNTDOWN =====
function CountdownTimer({
  startedAt,
  durationMin,
}: {
  startedAt: number;
  durationMin: number;
}) {
  const [remaining, setRemaining] = React.useState(durationMin * 60);

  React.useEffect(() => {
    const update = () => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const total = durationMin * 60;
      setRemaining(Math.max(0, total - elapsed));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startedAt, durationMin]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const isLow = remaining <= 300 && remaining > 0;
  const isDone = remaining === 0;

  return (
    <div className="flex items-center gap-2">
      <Timer
        className={cn(
          'h-4 w-4',
          isDone
            ? 'text-primary'
            : isLow
              ? 'animate-pulse text-destructive'
              : 'text-success'
        )}
      />
      <span
        className={cn(
          'font-mono font-semibold',
          isDone
            ? 'text-primary'
            : isLow
              ? 'animate-pulse text-destructive'
              : 'text-success'
        )}
      >
        {isDone
          ? 'COMPLETA'
          : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`}
      </span>
    </div>
  );
}

function ChargeProgress({
  startedAt,
  durationMin,
}: {
  startedAt: number;
  durationMin: number;
}) {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const update = () => {
      const elapsed = Date.now() - startedAt;
      const total = durationMin * 60 * 1000;
      setProgress(Math.min(100, (elapsed / total) * 100));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startedAt, durationMin]);

  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={cn(
          'h-full rounded-full transition-all duration-1000',
          progress >= 100
            ? 'bg-primary'
            : progress > 80
              ? 'bg-gradient-to-r from-warning to-destructive'
              : 'bg-gradient-to-r from-success to-emerald-500'
        )}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

function calculateAmount(
  power: number,
  minutes: number,
  pricePerKwh: number
): number {
  const kwh = power * (minutes / 60);
  return Math.round(kwh * pricePerKwh);
}

export default function ColaPage() {
  // ===== HOOKS DE SUPABASE =====
  const { data: solinera, isLoading: loadingSolinera } = useSolineraActiva();
  const { data: queue = [], isLoading: loadingQueue } = useQueue();
  const { data: todayTransactions = [] } = useTodayTransactions();
  const { data: reservations = [] } = useSolineraReservations();

  const addToQueue = useAddToQueue();
  const startCharge = useStartCharge();
  const completeCharge = useCompleteCharge();
  const removeFromQueue = useRemoveFromQueue();
  const acceptReservation = useAcceptReservation();
  const rejectReservation = useRejectReservation();

  // ===== RESERVAS FILTRADAS =====
  const pendingReservations = reservations.filter(
    (r) => r.status === 'pending'
  );
  const confirmedReservations = reservations.filter(
    (r) => r.status === 'confirmed'
  );

  // ===== PUNTOS =====
  const CHARGE_POINTS = React.useMemo<ChargePointConfig[]>(() => {
    if (solinera?.points_config && Array.isArray(solinera.points_config)) {
      return solinera.points_config;
    }
    if (solinera?.points && solinera.points > 0) {
      return Array.from({ length: solinera.points }).map((_, i) => ({
        id: `P${i + 1}`,
        label: `Punto ${i + 1}`,
        power: i < 2 ? 7.4 : 22,
        pricePerKwh: i < 2 ? 5 : 7.5,
      }));
    }
    return [];
  }, [solinera?.points_config, solinera?.points]);

  // ===== ESTADOS DE UI =====
  const [collectOpen, setCollectOpen] = React.useState(false);
  const [collectItem, setCollectItem] = React.useState<QueueItemRemote | null>(
    null
  );
  const [collectAmount, setCollectAmount] = React.useState('');
  const [collectMethod, setCollectMethod] = React.useState<
    'transfermovil' | 'enzona' | 'efectivo'
  >('transfermovil');

  const [startOpen, setStartOpen] = React.useState(false);
  const [startItem, setStartItem] = React.useState<QueueItemRemote | null>(
    null
  );
  const [startDuration, setStartDuration] = React.useState(60);
  const [customDuration, setCustomDuration] = React.useState('');
  const [selectedPoint, setSelectedPoint] = React.useState<string | null>(null);

  const [addOpen, setAddOpen] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const [newCar, setNewCar] = React.useState('Triciclo Eléctrico');
  const [newPlate, setNewPlate] = React.useState('');

  // ===== PUNTOS LIBRES/OCUPADOS =====
  const occupiedPoints = queue
    .filter((q) => q.status === 'charging' && q.point_id)
    .map((q) => q.point_id as string);

  const freePoints = CHARGE_POINTS.filter(
    (cp) => !occupiedPoints.includes(cp.id)
  );

  const chargePointsWithStatus = CHARGE_POINTS.map((cp) => ({
    ...cp,
    active: occupiedPoints.includes(cp.id),
  }));

  const getPointById = (id: string) =>
    CHARGE_POINTS.find((p) => p.id === id);

  // ===== ACCIONES DE RESERVAS (OFFLINE-FIRST) =====
  const handleAcceptReservation = (r: ReservationRemote) => {
    acceptReservation.mutate(r.id, {
      onSuccess: () => {
        console.log('✅ Reserva aceptada y sincronizada');
      },
      onError: (err: any) => {
        console.error('Error al sincronizar:', err);
        toast.error('Se sincronizará cuando vuelva la conexión');
      },
    });

    // Feedback inmediato
    toast.success('Reserva aceptada. Conductor notificado.');
  };

  const handleRejectReservation = (r: ReservationRemote) => {
    rejectReservation.mutate(r.id, {
      onSuccess: () => {
        console.log('✅ Reserva rechazada y sincronizada');
      },
      onError: (err: any) => {
        console.error('Error al sincronizar:', err);
        toast.error('Se sincronizará cuando vuelva la conexión');
      },
    });

    toast.info('Reserva rechazada');
  };

  // ===== INICIAR CARGA =====
  const openStartDialog = (item: QueueItemRemote) => {
    if (freePoints.length === 0) {
      toast.error('No hay puntos de carga libres');
      return;
    }
    setStartItem(item);
    setStartDuration(60);
    setCustomDuration('');
    setSelectedPoint(freePoints[0].id);
    setStartOpen(true);
  };

  const calculateEstimated = () => {
    if (!selectedPoint) return { kwh: 0, amount: 0 };
    const point = getPointById(selectedPoint);
    if (!point) return { kwh: 0, amount: 0 };
    const duration =
      customDuration && parseInt(customDuration) > 0
        ? parseInt(customDuration)
        : startDuration;
    const kwh = point.power * (duration / 60);
    const amount = Math.round(kwh * point.pricePerKwh);
    return { kwh: Math.round(kwh * 10) / 10, amount };
  };

  const confirmStart = () => {
    if (!startItem) return;
    if (!selectedPoint) {
      toast.error('Selecciona un punto de carga');
      return;
    }

    const duration =
      customDuration && parseInt(customDuration) > 0
        ? parseInt(customDuration)
        : startDuration;

    if (duration <= 0) {
      toast.error('La duración debe ser mayor a 0');
      return;
    }

    const point = getPointById(selectedPoint);
    if (!point) return;

    const estimated = calculateAmount(point.power, duration, point.pricePerKwh);

    // ✅ Offline-first
    startCharge.mutate(
      {
        queueItemId: startItem.id,
        pointId: selectedPoint,
        durationMin: duration,
        amount: estimated,
      },
      {
        onSuccess: () => {
          console.log('✅ Carga iniciada y sincronizada');
        },
        onError: (err: any) => {
          console.error('Error al sincronizar:', err);
          toast.error('Se sincronizará cuando vuelva la conexión');
        },
      }
    );

    // Feedback inmediato
    toast.success(`Carga iniciada en ${selectedPoint} (${point.power}kW)`);
    setStartOpen(false);
    setStartItem(null);
    setSelectedPoint(null);
  };

  // ===== COBRAR =====
  const openCollectDialog = (item: QueueItemRemote) => {
    setCollectItem(item);

    let realAmount = item.amount || 0;

    if (item.charge_started_at && item.point_id) {
      const point = getPointById(item.point_id);
      if (point) {
        const minutes = Math.max(
          1,
          Math.round(
            (Date.now() - new Date(item.charge_started_at).getTime()) / 60000
          )
        );
        realAmount = calculateAmount(point.power, minutes, point.pricePerKwh);
      }
    }

    setCollectAmount(String(realAmount));
    setCollectMethod('transfermovil');
    setCollectOpen(true);
  };

  const confirmCollect = () => {
    if (!collectItem) return;

    const finalAmount = parseInt(collectAmount) || collectItem.amount || 0;

    let durationMin = collectItem.duration_min || 0;
    if (collectItem.charge_started_at) {
      durationMin = Math.max(
        1,
        Math.round(
          (Date.now() - new Date(collectItem.charge_started_at).getTime()) /
          60000
        )
      );
    }

    // ✅ Offline-first: fire and forget
    completeCharge.mutate(
      {
        queueItemId: collectItem.id,
        amount: finalAmount,
        method: collectMethod,
        driverName: collectItem.name,
        plate: collectItem.plate,
        durationMin,
      },
      {
        onSuccess: () => {
          console.log('✅ Cobro sincronizado');
        },
        onError: (err: any) => {
          console.error('Error al sincronizar cobro:', err);
          toast.error('Se sincronizará cuando vuelva la conexión');
        },
      }
    );

    // Feedback inmediato
    toast.success(`Cobro registrado: ${finalAmount} CUP (${collectMethod})`);
    setCollectOpen(false);
    setCollectItem(null);
  };

  // ===== AÑADIR VEHÍCULO =====
  const resetAddForm = () => {
    setNewName('');
    setNewCar('Triciclo Eléctrico');
    setNewPlate('');
  };

  const handleAddVehicle = () => {
    if (!newName.trim()) {
      toast.error('Escribe el nombre del cliente');
      return;
    }
    if (!newPlate.trim()) {
      toast.error('Escribe la matrícula');
      return;
    }

    // ✅ Offline-first
    addToQueue.mutate(
      {
        name: newName.trim(),
        car: newCar.trim() || 'Vehículo Eléctrico',
        plate: newPlate.trim().toUpperCase(),
        amount: 0,
      },
      {
        onSuccess: () => {
          console.log('✅ Vehículo sincronizado');
        },
        onError: (err: any) => {
          console.error('Error al sincronizar:', err);
          toast.error('Se sincronizará cuando vuelva la conexión');
        },
      }
    );

    // Feedback inmediato
    toast.success(`${newName.trim()} añadido a la cola`);
    resetAddForm();
    setAddOpen(false);
  };

  // ===== ELIMINAR =====
  const handleRemove = (id: string) => {
    removeFromQueue.mutate(id, {
      onSuccess: () => {
        console.log('✅ Eliminado y sincronizado');
      },
      onError: (err: any) => {
        console.error('Error al sincronizar:', err);
      },
    });
  };

  // ===== STATS =====
  const charging = queue.filter((q) => q.status === 'charging').length;
  const waiting = queue.filter((q) => q.status === 'waiting').length;
  const done = queue.filter((q) => q.status === 'done').length;

  const todayRevenue = todayTransactions.reduce(
    (sum: number, t: any) => sum + Number(t.amount || 0),
    0
  );

  const formatTime = (ts: string) => {
    return new Date(ts).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const estimated = calculateEstimated();
  const selectedPointData = selectedPoint
    ? getPointById(selectedPoint)
    : null;

  const collectPointData = collectItem?.point_id
    ? getPointById(collectItem.point_id)
    : null;
  const collectMinutes =
    collectItem?.charge_started_at
      ? Math.max(
        1,
        Math.round(
          (Date.now() - new Date(collectItem.charge_started_at).getTime()) /
          60000
        )
      )
      : 0;

  // ===== LOADING =====
  if (loadingSolinera) {
    return (
      <AppShell>
        <div className="flex h-96 flex-col items-center justify-center gap-4 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Cargando solinera...</p>
        </div>
      </AppShell>
    );
  }

  if (!solinera) {
    return (
      <AppShell>
        <div className="space-y-6">
          <PageHeader
            title="Gestión de Cola"
            subtitle="Configura tu solinera primero"
          />
          <GlassCard className="p-12 text-center">
            <h2 className="text-xl font-bold">No tienes solinera configurada</h2>
            <Button className="mt-4 gradient-solar" asChild>
              <Link href="/onboarding">Configurar ahora</Link>
            </Button>
          </GlassCard>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Gestión de Cola"
          subtitle="Cola en vivo, cobros y registro del día"
          action={
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/escanear">
                  <QrCode className="mr-2 h-4 w-4" /> Escanear QR
                </Link>
              </Button>
              <Button
                className="gradient-solar text-white hover:opacity-90"
                size="sm"
                onClick={() => setAddOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" /> Añadir vehículo
              </Button>
            </div>
          }
        />

        {/* Ingresos del día */}
        <FadeIn delay={0.03}>
          <GlassCard className="border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-solar text-white shadow-glow-orange">
                  <TrendingUp className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Ingresos de hoy
                  </p>
                  <p className="text-3xl font-bold text-primary">
                    {todayRevenue.toLocaleString()}{' '}
                    <span className="text-base font-medium text-muted-foreground">
                      CUP
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {todayTransactions.length} carga
                    {todayTransactions.length !== 1 ? 's' : ''} completada
                    {todayTransactions.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 sm:gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-success">{charging}</p>
                  <p className="text-[10px] uppercase text-muted-foreground">
                    Cargando
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-warning">{waiting}</p>
                  <p className="text-[10px] uppercase text-muted-foreground">
                    En espera
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{done}</p>
                  <p className="text-[10px] uppercase text-muted-foreground">
                    Completados
                  </p>
                </div>
              </div>
            </div>
          </GlassCard>
        </FadeIn>

        {/* Solicitudes de reserva */}
        {pendingReservations.length > 0 && (
          <FadeIn delay={0.05}>
            <GlassCard className="border-info/30 bg-info/5 p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-info" />
                  <h3 className="text-lg font-semibold">
                    Solicitudes de reserva
                  </h3>
                  <SoliBadge variant="info">
                    {pendingReservations.length}
                  </SoliBadge>
                </div>
              </div>

              <div className="space-y-3">
                {pendingReservations.map((r, idx) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex flex-col gap-3 rounded-xl border border-border/50 bg-card/40 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-tech text-white">
                        <Car className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {r.driver_profile?.name || 'Conductor'}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {r.slot}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" /> {r.amount} CUP
                          </span>
                          <span className="flex items-center gap-1 uppercase">
                            {r.payment_method === 'transfermovil' ? (
                              <Smartphone className="h-3 w-3" />
                            ) : (
                              <CreditCard className="h-3 w-3" />
                            )}
                            {r.payment_method}
                          </span>
                          {r.driver_profile?.plate && (
                            <span className="font-mono">
                              {r.driver_profile.plate}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleRejectReservation(r)}
                      >
                        <X className="mr-1 h-4 w-4" /> Rechazar
                      </Button>
                      <Button
                        size="sm"
                        className="gradient-solar text-white hover:opacity-90"
                        onClick={() => handleAcceptReservation(r)}
                      >
                        <Check className="mr-1 h-4 w-4" /> Aceptar
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </FadeIn>
        )}

        {/* Esperando llegada */}
        {confirmedReservations.length > 0 && (
          <FadeIn delay={0.08}>
            <GlassCard className="border-success/30 bg-success/5 p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-success" />
                  <h3 className="text-lg font-semibold">Esperando llegada</h3>
                  <SoliBadge variant="success">
                    {confirmedReservations.length}
                  </SoliBadge>
                </div>
              </div>

              <div className="space-y-3">
                {confirmedReservations.map((r, idx) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex flex-col gap-3 rounded-xl border border-border/50 bg-card/40 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-solar text-white">
                        <Check className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {r.driver_profile?.name || 'Conductor'}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {r.slot}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" /> {r.amount} CUP
                          </span>
                          {r.short_code && (
                            <span className="font-mono font-bold text-primary">
                              {r.short_code}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive"
                        onClick={() => handleRejectReservation(r)}
                      >
                        <X className="mr-1 h-4 w-4" /> No llegó
                      </Button>
                      <Button
                        size="sm"
                        className="gradient-solar text-white hover:opacity-90"
                        asChild
                      >
                        <Link href="/escanear">
                          <QrCode className="mr-1 h-4 w-4" /> Escanear llegada
                        </Link>
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </FadeIn>
        )}

        {/* Puntos de carga */}
        <FadeIn delay={0.15}>
          <GlassCard className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground">
                Puntos de carga
              </h3>
              <span className="text-xs text-muted-foreground">
                {freePoints.length} de {CHARGE_POINTS.length} libres
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {chargePointsWithStatus.map((cp) => (
                <div
                  key={cp.id}
                  className={cn(
                    'flex flex-col gap-2 rounded-xl border p-3 transition-all',
                    cp.active
                      ? 'border-success/40 bg-success/5 shadow-sm'
                      : 'border-border/50 bg-card/30'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-lg',
                        cp.active
                          ? 'bg-success/15 text-success'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      <Zap className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-mono text-primary">
                      {cp.pricePerKwh} CUP/kWh
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{cp.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {cp.power} kW · {cp.active ? 'Ocupado' : 'Libre'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </FadeIn>

        {/* Lista de vehículos */}
        <FadeIn delay={0.2}>
          <GlassCard className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold">Vehículos en cola</h3>
                <StatusIndicator online label="En vivo" />
              </div>
            </div>
            <div className="space-y-3">
              <AnimatePresence>
                {loadingQueue && (
                  <div className="py-12 text-center text-muted-foreground">
                    <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin opacity-40" />
                    <p>Cargando cola...</p>
                  </div>
                )}
                {!loadingQueue &&
                  queue.map((item, idx) => {
                    const pointInfo = item.point_id
                      ? getPointById(item.point_id)
                      : null;
                    return (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ delay: idx * 0.05 }}
                        className={cn(
                          'rounded-xl border bg-card/30 p-4 transition-all',
                          item.status === 'charging'
                            ? 'border-success/40 bg-success/5'
                            : item.status === 'done'
                              ? 'border-border/30 opacity-60'
                              : 'border-border/50'
                        )}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
                              <Car className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{item.name}</p>
                                <SoliBadge
                                  variant={
                                    item.status === 'charging'
                                      ? 'success'
                                      : item.status === 'waiting'
                                        ? 'warning'
                                        : 'default'
                                  }
                                >
                                  {item.status === 'charging'
                                    ? 'Cargando'
                                    : item.status === 'waiting'
                                      ? 'En espera'
                                      : 'Completado'}
                                </SoliBadge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {item.car} · {item.plate}
                                {item.point_id && pointInfo && (
                                  <span className="ml-1">
                                    · {item.point_id} ({pointInfo.power}kW)
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 sm:gap-4">
                            {item.status === 'charging' &&
                              item.charge_started_at &&
                              item.duration_min && (
                                <CountdownTimer
                                  startedAt={new Date(
                                    item.charge_started_at
                                  ).getTime()}
                                  durationMin={item.duration_min}
                                />
                              )}
                            {item.status === 'waiting' && (
                              <div className="flex items-center gap-2 text-warning">
                                <Clock className="h-4 w-4" />
                                <span className="text-sm font-medium">
                                  Esperando
                                </span>
                              </div>
                            )}
                            {item.status === 'done' && (
                              <div className="flex items-center gap-2 text-primary">
                                <DollarSign className="h-4 w-4" />
                                <span className="text-sm font-semibold">
                                  {item.amount} CUP
                                </span>
                              </div>
                            )}

                            {item.status === 'waiting' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openStartDialog(item)}
                                disabled={freePoints.length === 0}
                              >
                                <PlayCircle className="mr-1 h-4 w-4" /> Iniciar
                              </Button>
                            )}
                            {item.status === 'charging' && (
                              <Button
                                size="sm"
                                className="gradient-solar text-white hover:opacity-90"
                                onClick={() => openCollectDialog(item)}
                              >
                                <DollarSign className="mr-1 h-4 w-4" /> Cobrar
                              </Button>
                            )}
                            {item.status === 'done' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemove(item.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {item.status === 'charging' &&
                          item.charge_started_at &&
                          item.duration_min && (
                            <div className="mt-3">
                              <ChargeProgress
                                startedAt={new Date(
                                  item.charge_started_at
                                ).getTime()}
                                durationMin={item.duration_min}
                              />
                            </div>
                          )}
                      </motion.div>
                    );
                  })}
              </AnimatePresence>
              {!loadingQueue && queue.length === 0 && (
                <div className="py-12 text-center text-muted-foreground">
                  <Car className="mx-auto mb-2 h-10 w-10 opacity-40" />
                  <p>No hay vehículos en la cola</p>
                  <p className="mt-1 text-xs">
                    Añade uno manualmente o espera una reserva
                  </p>
                </div>
              )}
            </div>
          </GlassCard>
        </FadeIn>

        {/* Registro del día */}
        <FadeIn delay={0.3}>
          <GlassCard className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <History className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Registro del día</h3>
                <SoliBadge variant="solar">
                  {todayTransactions.length}
                </SoliBadge>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Total hoy</p>
                <p className="text-lg font-bold text-primary">
                  {todayRevenue.toLocaleString()} CUP
                </p>
              </div>
            </div>

            {todayTransactions.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <History className="mx-auto mb-2 h-10 w-10 opacity-40" />
                <p className="text-sm">No hay cargas registradas hoy</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50 text-left text-xs text-muted-foreground">
                      <th className="pb-2 pr-4 font-medium">Hora</th>
                      <th className="pb-2 pr-4 font-medium">Cliente</th>
                      <th className="pb-2 pr-4 font-medium">Matrícula</th>
                      <th className="pb-2 pr-4 font-medium">Duración</th>
                      <th className="pb-2 pr-4 font-medium">Método</th>
                      <th className="pb-2 text-right font-medium">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todayTransactions.map((t: any) => (
                      <tr
                        key={t.id}
                        className="border-b border-border/30 text-sm hover:bg-muted/30"
                      >
                        <td className="py-3 pr-4 font-mono text-xs">
                          {formatTime(t.created_at)}
                        </td>
                        <td className="py-3 pr-4 font-medium">
                          {t.driver_name}
                        </td>
                        <td className="py-3 pr-4 font-mono text-xs">
                          {t.plate}
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {t.duration_min} min
                        </td>
                        <td className="py-3 pr-4">
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
                        </td>
                        <td className="py-3 text-right font-semibold text-primary">
                          {t.amount} CUP
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>
        </FadeIn>
      </div>

      {/* ===== DIÁLOGO INICIAR CARGA ===== */}
      <Dialog open={startOpen} onOpenChange={setStartOpen}>
        <DialogContent className="glass-strong max-w-lg border-border/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlarmClock className="h-5 w-5 text-primary" />
              Iniciar carga
            </DialogTitle>
            <DialogDescription>
              {startItem?.name} · {startItem?.car} · {startItem?.plate}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Gauge className="h-4 w-4" /> Elige el punto de carga
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {freePoints.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPoint(p.id)}
                    className={cn(
                      'flex flex-col gap-1 rounded-xl border p-3 text-left transition-all',
                      selectedPoint === p.id
                        ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                        : 'border-border/50 hover:border-primary/30'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">{p.label}</span>
                      <span className="text-xs font-mono text-primary">
                        {p.pricePerKwh} CUP
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {p.power} kW de potencia
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Duración de la carga</Label>
              <div className="grid grid-cols-4 gap-2">
                {[30, 60, 90, 120].map((d) => (
                  <button
                    key={d}
                    onClick={() => {
                      setStartDuration(d);
                      setCustomDuration('');
                    }}
                    className={cn(
                      'rounded-lg border px-2 py-2 text-sm font-medium transition-all',
                      startDuration === d && !customDuration
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border/50 hover:border-primary/30'
                    )}
                  >
                    {d < 60 ? `${d}m` : `${d / 60}h`}
                  </button>
                ))}
              </div>
              <div className="mt-2">
                <Label className="text-xs text-muted-foreground">
                  O personalizado (minutos):
                </Label>
                <Input
                  type="number"
                  placeholder="Ej: 45"
                  value={customDuration}
                  onChange={(e) => setCustomDuration(e.target.value)}
                  min="1"
                  className="mt-1"
                />
              </div>
            </div>

            {selectedPointData && (
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold text-primary">
                    CÁLCULO ESTIMADO
                  </span>
                </div>
                <div className="space-y-1 font-mono text-xs text-muted-foreground">
                  <p>
                    {selectedPointData.power} kW ×{' '}
                    {(
                      (customDuration
                        ? parseInt(customDuration)
                        : startDuration) / 60
                    ).toFixed(1)}{' '}
                    h = {estimated.kwh} kWh
                  </p>
                  <p>
                    {estimated.kwh} kWh × {selectedPointData.pricePerKwh}{' '}
                    CUP/kWh
                  </p>
                </div>
                <p className="mt-2 text-lg font-bold text-primary">
                  ≈ {estimated.amount} CUP
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStartOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="gradient-solar text-white hover:opacity-90"
              onClick={confirmStart}
              disabled={!selectedPoint}
            >
              <PlayCircle className="mr-2 h-4 w-4" />
              Iniciar carga
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== DIÁLOGO COBRAR ===== */}
      <Dialog open={collectOpen} onOpenChange={setCollectOpen}>
        <DialogContent className="glass-strong border-border/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Cobrar carga
            </DialogTitle>
            <DialogDescription>
              {collectItem?.name} · {collectItem?.car} · {collectItem?.plate}
            </DialogDescription>
          </DialogHeader>
          {collectItem && (
            <div className="space-y-4 py-2">
              {collectPointData && collectMinutes > 0 && (
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-primary" />
                    <span className="text-xs font-semibold text-primary">
                      DESGLOSE DEL CÁLCULO
                    </span>
                  </div>
                  <div className="space-y-1 font-mono text-xs text-muted-foreground">
                    <p>
                      {collectPointData.power} kW ×{' '}
                      {(collectMinutes / 60).toFixed(2)} h ={' '}
                      {(
                        collectPointData.power *
                        (collectMinutes / 60)
                      ).toFixed(1)}{' '}
                      kWh
                    </p>
                    <p className="text-muted-foreground">
                      Tiempo total: {collectMinutes} min
                    </p>
                  </div>
                  <p className="mt-2 text-xl font-bold text-primary">
                    = {collectAmount} CUP
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Monto final (CUP)</Label>
                <Input
                  type="number"
                  value={collectAmount}
                  onChange={(e) => setCollectAmount(e.target.value)}
                  className="text-2xl font-bold text-primary"
                />
              </div>

              <div className="space-y-2">
                <Label>Método de pago</Label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setCollectMethod('transfermovil')}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-xs font-medium transition-all',
                      collectMethod === 'transfermovil'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border/50'
                    )}
                  >
                    <Smartphone className="h-5 w-5" />
                    Transfermóvil
                  </button>
                  <button
                    onClick={() => setCollectMethod('enzona')}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-xs font-medium transition-all',
                      collectMethod === 'enzona'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border/50'
                    )}
                  >
                    <CreditCard className="h-5 w-5" />
                    EnZona
                  </button>
                  <button
                    onClick={() => setCollectMethod('efectivo')}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-xs font-medium transition-all',
                      collectMethod === 'efectivo'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border/50'
                    )}
                  >
                    <Banknote className="h-5 w-5" />
                    Efectivo
                  </button>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCollectOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="gradient-solar text-white hover:opacity-90"
              onClick={confirmCollect}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Confirmar cobro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== DIÁLOGO AÑADIR VEHÍCULO ===== */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="glass-strong border-border/50">
          <DialogHeader>
            <DialogTitle>Añadir vehículo a la cola</DialogTitle>
            <DialogDescription>
              Registra un cliente que llegó sin reserva.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label htmlFor="cust-name">Nombre del cliente</Label>
              <Input
                id="cust-name"
                placeholder="Ej: Pedro Hernández"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cust-car">Tipo de vehículo</Label>
              <select
                id="cust-car"
                value={newCar}
                onChange={(e) => setNewCar(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
              >
                <option>Triciclo Eléctrico</option>
                <option>Motorina</option>
                <option>Auto Eléctrico</option>
                <option>Scooter Eléctrico</option>
                <option>Otro</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cust-plate">Matrícula</Label>
              <Input
                id="cust-plate"
                placeholder="T-123456"
                value={newPlate}
                onChange={(e) => setNewPlate(e.target.value.toUpperCase())}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                resetAddForm();
                setAddOpen(false);
              }}
            >
              Cancelar
            </Button>
            <Button
              className="gradient-solar text-white hover:opacity-90"
              onClick={handleAddVehicle}
              disabled={!newName.trim() || !newPlate.trim()}
            >
              <Plus className="mr-2 h-4 w-4" />
              Añadir a la cola
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}