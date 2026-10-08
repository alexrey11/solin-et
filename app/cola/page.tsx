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
} from 'lucide-react';
import { AppShell } from '@/components/soli/app-shell';
import { GlassCard, SoliBadge, StatusIndicator } from '@/components/soli/glass-card';
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
import { useLiveQuery } from 'dexie-react-hooks';
import { db, QueueItem, Reservation } from '@/lib/db';
import { toast } from 'sonner';

// Puntos de carga
const CHARGE_POINTS = [
  { id: 'P1', label: 'Punto 1' },
  { id: 'P2', label: 'Punto 2' },
  { id: 'P3', label: 'Punto 3' },
  { id: 'P4', label: 'Punto 4' },
];

export default function ColaPage() {
  // ===== DATOS EN VIVO =====
  const queue = useLiveQuery(
    () => db.queue.orderBy('createdAt').reverse().toArray(),
    []
  ) || [];

  const pendingReservations = useLiveQuery(
    () => db.reservations.where('status').equals('pending').reverse().toArray(),
    []
  ) || [];

  const confirmedReservations = useLiveQuery(
    () =>
      db.reservations.where('status').equals('confirmed').reverse().toArray(),
    []
  ) || [];


  // ===== ESTADOS DE UI =====
  const [collectOpen, setCollectOpen] = React.useState(false);
  const [collectItem, setCollectItem] = React.useState<QueueItem | null>(null);
  const [addOpen, setAddOpen] = React.useState(false);

  const [newName, setNewName] = React.useState('');
  const [newCar, setNewCar] = React.useState('');
  const [newPlate, setNewPlate] = React.useState('');

  // ===== PUNTOS DE CARGA =====
  const occupiedPoints = queue
    .filter((q) => q.status === 'charging' && q.point)
    .map((q) => q.point as string);

  const freePoints = CHARGE_POINTS.filter(
    (cp) => !occupiedPoints.includes(cp.id)
  );

  const chargePointsWithStatus = CHARGE_POINTS.map((cp) => ({
    ...cp,
    active: occupiedPoints.includes(cp.id),
  }));

  // ===== ACCIONES DE LA COLA =====

  const startCharge = async (id: number) => {
    if (freePoints.length === 0) {
      toast.error('No hay puntos de carga libres');
      return;
    }

    const assignedPoint = freePoints[0].id;

    await db.queue.update(id, {
      status: 'charging',
      chargeTime: 1,
      point: assignedPoint,
    });

    toast.success(`Asignado ${assignedPoint}`);
  };

  const finishCharge = (item: QueueItem) => {
    setCollectItem(item);
    setCollectOpen(true);
  };

  const confirmCollect = async () => {
    if (collectItem && collectItem.id) {
      const now = Date.now();
      const chargeMinutes = Math.max(
        1,
        Math.round((now - collectItem.createdAt) / 60000)
      );

      await db.queue.update(collectItem.id, {
        status: 'done',
        chargeTime: chargeMinutes,
        finishedAt: now,
        point: undefined,
      });

      await db.transactions.add({
        queueItemId: collectItem.id,
        amount: collectItem.amount,
        method: 'transfermovil',
        createdAt: now,
        synced: 0,
      });

      toast.success(`Cobro registrado: ${collectItem.amount} CUP`);
    }
    setCollectOpen(false);
    setCollectItem(null);
  };

  const removeItem = async (id: number) => {
    await db.queue.delete(id);
  };

  const addVehicle = async () => {
    if (!newName.trim()) return;
    await db.queue.add({
      name: newName.trim(),
      car: newCar.trim() || 'Vehículo Eléctrico',
      plate: newPlate.trim() || `P-${Math.floor(Math.random() * 99999)}`,
      waitTime: 0,
      chargeTime: 0,
      status: 'waiting',
      amount: 300,
      createdAt: Date.now(),
    });
    setNewName('');
    setNewCar('');
    setNewPlate('');
    setAddOpen(false);
    toast.success('Vehículo añadido a la cola');
  };

  // ===== ACCIONES DE RESERVAS =====

  const acceptReservation = async (reservation: Reservation) => {
    if (!reservation.id) return;
    await db.reservations.update(reservation.id, {
      status: 'confirmed',
      confirmedAt: Date.now(),
      syncStatus: 'pending',
    });
    toast.success('Reserva aceptada. El conductor fue notificado.');
  };

  const rejectReservation = async (reservation: Reservation) => {
    if (!reservation.id) return;
    await db.reservations.update(reservation.id, {
      status: 'cancelled',
      syncStatus: 'pending',
    });
    toast.info('Reserva rechazada');
  };

  // ===== MÉTRICAS =====
  const charging = queue.filter((q) => q.status === 'charging').length;
  const waiting = queue.filter((q) => q.status === 'waiting').length;
  const done = queue.filter((q) => q.status === 'done').length;

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Gestión de Cola"
          subtitle="Reservas, entrada de vehículos y control de carga"
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

        {/* ===== SOLICITUDES DE RESERVA (PENDIENTES) ===== */}
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
                <span className="text-xs text-muted-foreground">
                  Acepta o rechaza las solicitudes de los conductores
                </span>
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
                          {r.solineraName || 'Reserva'}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {r.slot}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" /> {r.amount} CUP
                          </span>
                          <span className="flex items-center gap-1 uppercase">
                            {r.method === 'transfermovil' ? (
                              <Smartphone className="h-3 w-3" />
                            ) : (
                              <CreditCard className="h-3 w-3" />
                            )}
                            {r.method}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => rejectReservation(r)}
                      >
                        <X className="mr-1 h-4 w-4" /> Rechazar
                      </Button>
                      <Button
                        size="sm"
                        className="gradient-solar text-white hover:opacity-90"
                        onClick={() => acceptReservation(r)}
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

        {/* ===== RESERVAS CONFIRMADAS (ESPERANDO LLEGADA) ===== */}
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
                <span className="text-xs text-muted-foreground">
                  Escanea el QR del conductor cuando llegue
                </span>
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
                        <p className="font-medium">{r.solineraName}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {r.slot}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" /> {r.amount} CUP
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      className="gradient-solar text-white hover:opacity-90"
                      asChild
                    >
                      <Link href="/escanear">
                        <QrCode className="mr-1 h-4 w-4" /> Escanear llegada
                      </Link>
                    </Button>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </FadeIn>
        )}

        {/* ===== STATS ===== */}
        <div className="grid grid-cols-3 gap-4">
          <FadeIn delay={0}>
            <GlassCard className="p-4 text-center">
              <p className="text-3xl font-bold text-success">{charging}</p>
              <p className="text-xs text-muted-foreground">Cargando</p>
            </GlassCard>
          </FadeIn>
          <FadeIn delay={0.1}>
            <GlassCard className="p-4 text-center">
              <p className="text-3xl font-bold text-warning">{waiting}</p>
              <p className="text-xs text-muted-foreground">En espera</p>
            </GlassCard>
          </FadeIn>
          <FadeIn delay={0.2}>
            <GlassCard className="p-4 text-center">
              <p className="text-3xl font-bold text-primary">{done}</p>
              <p className="text-xs text-muted-foreground">Completados</p>
            </GlassCard>
          </FadeIn>
        </div>

        {/* ===== PUNTOS DE CARGA ===== */}
        <FadeIn delay={0.3}>
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
                  className={`flex items-center gap-2 rounded-xl border p-3 ${cp.active
                    ? 'border-success/30 bg-success/5'
                    : 'border-border/50 bg-card/30'
                    }`}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${cp.active
                      ? 'bg-success/15 text-success'
                      : 'bg-muted text-muted-foreground'
                      }`}
                  >
                    <Zap className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{cp.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {cp.active ? 'Ocupado' : 'Libre'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </FadeIn>

        {/* ===== LISTA DE VEHÍCULOS EN COLA ===== */}
        <FadeIn delay={0.4}>
          <GlassCard className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold">Lista de vehículos</h3>
                <StatusIndicator online label="En vivo" />
              </div>
            </div>
            <div className="space-y-3">
              <AnimatePresence>
                {queue.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex flex-col gap-3 rounded-xl border border-border/50 bg-card/30 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
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
                          {item.point && ` · ${item.point}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-4">
                      {item.status === 'charging' && (
                        <div className="flex items-center gap-2 text-success">
                          <Timer className="h-4 w-4" />
                          <span className="text-sm font-mono font-semibold">
                            {item.chargeTime}:00
                          </span>
                        </div>
                      )}
                      {item.status === 'waiting' && (
                        <div className="flex items-center gap-2 text-warning">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            {item.waitTime} min
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
                          onClick={() => item.id && startCharge(item.id)}
                          disabled={freePoints.length === 0}
                        >
                          <PlayCircle className="mr-1 h-4 w-4" /> Iniciar
                        </Button>
                      )}
                      {item.status === 'charging' && (
                        <Button
                          size="sm"
                          className="gradient-solar text-white hover:opacity-90"
                          onClick={() => finishCharge(item)}
                        >
                          <DollarSign className="mr-1 h-4 w-4" /> Cobrar
                        </Button>
                      )}
                      {item.status === 'done' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => item.id && removeItem(item.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {queue.length === 0 && (
                <div className="py-12 text-center text-muted-foreground">
                  <Car className="mx-auto mb-2 h-10 w-10 opacity-40" />
                  <p>No hay vehículos en la cola</p>
                </div>
              )}
            </div>
          </GlassCard>
        </FadeIn>
      </div>

      {/* ===== COLLECT DIALOG ===== */}
      <Dialog open={collectOpen} onOpenChange={setCollectOpen}>
        <DialogContent className="glass-strong border-border/50">
          <DialogHeader>
            <DialogTitle>Cobrar carga</DialogTitle>
            <DialogDescription>
              {collectItem?.name} · {collectItem?.car}
            </DialogDescription>
          </DialogHeader>
          {collectItem && (
            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between rounded-xl border border-border/50 bg-card/30 p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm">Tiempo de carga</span>
                </div>
                <span className="font-mono font-semibold">
                  {collectItem.chargeTime} min
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <span className="font-medium">Total a cobrar</span>
                </div>
                <span className="text-xl font-bold text-primary">
                  {collectItem.amount} CUP
                </span>
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
              <CheckCircle2 className="mr-2 h-4 w-4" /> Confirmar cobro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== ADD VEHICLE DIALOG ===== */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="glass-strong border-border/50">
          <DialogHeader>
            <DialogTitle>Añadir vehículo a la cola</DialogTitle>
            <DialogDescription>
              Registra un nuevo cliente para carga
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="cust-car">Vehículo</Label>
                <Input
                  id="cust-car"
                  placeholder="Ej: Nissan Leaf"
                  value={newCar}
                  onChange={(e) => setNewCar(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cust-plate">Matrícula</Label>
                <Input
                  id="cust-plate"
                  placeholder="P-00000"
                  value={newPlate}
                  onChange={(e) => setNewPlate(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="gradient-solar text-white hover:opacity-90"
              onClick={addVehicle}
              disabled={!newName.trim()}
            >
              <Plus className="mr-2 h-4 w-4" /> Añadir a la cola
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}