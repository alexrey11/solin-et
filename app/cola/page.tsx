'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Car,
  Clock,
  Zap,
  DollarSign,
  DollarSign,
  CheckCircle2,
  X,
  Plus,
  Timer,
  Battery,
  PlayCircle,
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

interface QueueItem {
  id: number;
  name: string;
  car: string;
  plate: string;
  waitTime: number;
  chargeTime: number;
  status: 'waiting' | 'charging' | 'done';
  amount: number;
  point?: string;
}

const initialQueue: QueueItem[] = [
  { id: 1, name: 'Carlos Pérez', car: 'Nissan Leaf', plate: 'P-12345', waitTime: 0, chargeTime: 18, status: 'charging', amount: 120, point: 'P1' },
  { id: 2, name: 'María González', car: 'BYD Dolphin', plate: 'P-67890', waitTime: 5, chargeTime: 0, status: 'waiting', amount: 0 },
  { id: 3, name: 'José Martínez', car: 'Tesla Model 3', plate: 'P-24680', waitTime: 20, chargeTime: 0, status: 'waiting', amount: 0 },
  { id: 4, name: 'Ana Rodríguez', car: 'JAC iEVS4', plate: 'P-13579', waitTime: 0, chargeTime: 42, status: 'done', amount: 180 },
];

const chargePoints = [
  { id: 'P1', label: 'Punto 1', active: true },
  { id: 'P2', label: 'Punto 2', active: false },
  { id: 'P3', label: 'Punto 3', active: false },
  { id: 'P4', label: 'Punto 4', active: true },
];

export default function ColaPage() {
  const [queue, setQueue] = React.useState<QueueItem[]>(initialQueue);
  const [collectOpen, setCollectOpen] = React.useState(false);
  const [collectItem, setCollectItem] = React.useState<QueueItem | null>(null);
  const [addOpen, setAddOpen] = React.useState(false);

  const startCharge = (id: number) => {
    setQueue((q) =>
      q.map((item) =>
        item.id === id
          ? { ...item, status: 'charging', chargeTime: 1, point: 'P2' }
          : item
      )
    );
  };

  const finishCharge = (item: QueueItem) => {
    setCollectItem(item);
    setCollectOpen(true);
  };

  const confirmCollect = () => {
    if (collectItem) {
      setQueue((q) =>
        q.map((item) =>
          item.id === collectItem.id ? { ...item, status: 'done' } : item
        )
      );
    }
    setCollectOpen(false);
  };

  const removeItem = (id: number) => {
    setQueue((q) => q.filter((item) => item.id !== id));
  };

  const charging = queue.filter((q) => q.status === 'charging').length;
  const waiting = queue.filter((q) => q.status === 'waiting').length;
  const done = queue.filter((q) => q.status === 'done').length;

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Gestión de Cola"
          subtitle="Asigna puntos de carga y cobra a tus clientes"
          action={
            <Button className="gradient-solar text-white hover:opacity-90" size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Añadir vehículo
            </Button>
          }
        />

        {/* Stats */}
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

        {/* Charge Points */}
        <FadeIn delay={0.3}>
          <GlassCard className="p-5">
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Puntos de carga</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {chargePoints.map((cp) => (
                <div
                  key={cp.id}
                  className={`flex items-center gap-2 rounded-xl border p-3 ${
                    cp.active
                      ? 'border-success/30 bg-success/5'
                      : 'border-border/50 bg-card/30'
                  }`}
                >
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${cp.active ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'}`}>
                    <Zap className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{cp.label}</p>
                    <p className="text-xs text-muted-foreground">{cp.active ? 'Ocupado' : 'Libre'}</p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </FadeIn>

        {/* Queue List */}
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
                          <span className="text-sm font-mono font-semibold">{item.chargeTime}:00</span>
                        </div>
                      )}
                      {item.status === 'waiting' && (
                        <div className="flex items-center gap-2 text-warning">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm font-medium">{item.waitTime} min</span>
                        </div>
                      )}
                      {item.status === 'done' && (
                        <div className="flex items-center gap-2 text-primary">
                          <DollarSign className="h-4 w-4" />
                          <span className="text-sm font-semibold">{item.amount} CUP</span>
                        </div>
                      )}

                      {item.status === 'waiting' && (
                        <Button size="sm" variant="outline" onClick={() => startCharge(item.id)}>
                          <PlayCircle className="mr-1 h-4 w-4" /> Iniciar
                        </Button>
                      )}
                      {item.status === 'charging' && (
                        <Button size="sm" className="gradient-solar text-white hover:opacity-90" onClick={() => finishCharge(item)}>
                          <DollarSign className="mr-1 h-4 w-4" /> Cobrar
                        </Button>
                      )}
                      {item.status === 'done' && (
                        <Button size="sm" variant="ghost" onClick={() => removeItem(item.id)}>
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

      {/* Collect Dialog */}
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
                <span className="font-mono font-semibold">{collectItem.chargeTime} min</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border/50 bg-card/30 p-4">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm">Energía consumida</span>
                </div>
                <span className="font-mono font-semibold">{Math.round(collectItem.chargeTime * 0.4)} kWh</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <span className="font-medium">Total a cobrar</span>
                </div>
                <span className="text-xl font-bold text-primary">{collectItem.amount} CUP</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCollectOpen(false)}>Cancelar</Button>
            <Button className="gradient-solar text-white hover:opacity-90" onClick={confirmCollect}>
              <CheckCircle2 className="mr-2 h-4 w-4" /> Confirmar cobro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Vehicle Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="glass-strong border-border/50">
          <DialogHeader>
            <DialogTitle>Añadir vehículo a la cola</DialogTitle>
            <DialogDescription>Registra un nuevo cliente para carga</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label htmlFor="cust-name">Nombre del cliente</Label>
              <Input id="cust-name" placeholder="Ej: Pedro Hernández" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="cust-car">Vehículo</Label>
                <Input id="cust-car" placeholder="Ej: Nissan Leaf" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cust-plate">Matrícula</Label>
                <Input id="cust-plate" placeholder="P-00000" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancelar</Button>
            <Button
              className="gradient-solar text-white hover:opacity-90"
              onClick={() => {
                setAddOpen(false);
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Añadir a la cola
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
