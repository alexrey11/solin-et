'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  MapPin,
  Zap,
  Star,
  Filter,
  Search,
  Navigation,
  Sun,
  Battery,
  Check,
  Calendar,
  Smartphone,
  CreditCard,
} from 'lucide-react';
import Link from 'next/link';
import { AppShell } from '@/components/soli/app-shell';
import { GlassCard, SoliBadge, StatusIndicator } from '@/components/soli/glass-card';
import { PageHeader, FadeIn } from '@/components/soli/charts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Solinera, Driver } from '@/lib/db';
import { createReservation, getDriverProfile } from '@/lib/profile';
import { getCurrentUser } from '@/lib/auth';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';

export default function MapaPage() {
  const solineras = useLiveQuery(() => db.solineras.toArray(), []) || [];

  const [selected, setSelected] = React.useState<Solinera | null>(null);
  const [reserveOpen, setReserveOpen] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [selectedSlot, setSelectedSlot] = React.useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = React.useState<
    'transfermovil' | 'enzona' | null
  >(null);
  const [driver, setDriver] = React.useState<Driver | null>(null);

  React.useEffect(() => {
    const load = async () => {
      const user = await getCurrentUser();
      if (user && user.id) {
        const d = await getDriverProfile(user.id);
        setDriver(d);
      }
    };
    load();
  }, []);

  const openReserve = (s: Solinera) => {
    setSelected(s);
    setReserveOpen(true);
  };

  const confirmReserve = async () => {
    if (!selected || !selectedSlot || !paymentMethod) return;

    try {
      const user = await getCurrentUser();
      if (!user || user.role !== 'driver') {
        toast.error('Debes iniciar sesión como conductor');
        return;
      }

      const d = await getDriverProfile(user.id!);
      if (!d || !d.id) {
        toast.error('Completa tu perfil primero');
        return;
      }

      await createReservation({
        driverId: d.id,
        solineraId: selected.id || 0,
        solineraName: selected.name,
        slot: selectedSlot,
        amount: 20 * (selected.pricePerKwh || 5),
        method: paymentMethod,
      });

      toast.success(`Reserva confirmada con ${paymentMethod}`);
      setReserveOpen(false);
      setConfirmOpen(true);
    } catch (err) {
      console.error(err);
      toast.error('Error al crear la reserva');
    }
  };

  const slots = [
    '09:00',
    '09:30',
    '10:00',
    '10:30',
    '11:00',
    '11:30',
    '14:00',
    '14:30',
    '15:00',
  ];

  const positions = [
    { x: 35, y: 30 },
    { x: 20, y: 45 },
    { x: 55, y: 55 },
    { x: 40, y: 68 },
    { x: 12, y: 25 },
    { x: 70, y: 40 },
    { x: 25, y: 60 },
    { x: 65, y: 70 },
    { x: 45, y: 20 },
    { x: 80, y: 55 },
  ];

  if (solineras.length === 0) {
    return (
      <AppShell>
        <div className="space-y-6">
          <PageHeader
            title="Mapa Consumer"
            subtitle="Encuentra solineras cercanas y reserva tu carga"
          />
          <GlassCard className="p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl gradient-solar text-white">
              <MapPin className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold">No hay solineras aún</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Aún no hay solineras registradas en el sistema. Vuelve más tarde.
            </p>
          </GlassCard>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Mapa Consumer"
          subtitle="Encuentra solineras cercanas y reserva tu carga"
          action={
            <div className="flex items-center gap-2">
              <StatusIndicator online label="GPS activo" />
            </div>
          }
        />

        <FadeIn delay={0.1}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o dirección..."
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" /> Filtros
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <FilterChip active>Todos</FilterChip>
            <FilterChip>Disponibles ahora</FilterChip>
            <FilterChip>Carga rápida (22kW+)</FilterChip>
            <FilterChip>Menor precio</FilterChip>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <FadeIn delay={0.2} className="lg:col-span-3">
            <GlassCard className="relative overflow-hidden p-0">
              <div
                className="relative h-[400px] w-full overflow-hidden rounded-2xl sm:h-[520px]"
                style={{
                  background:
                    'linear-gradient(135deg, hsl(222 47% 8%) 0%, hsl(222 40% 12%) 100%)',
                }}
              >
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: `
                      linear-gradient(hsl(var(--border)) 1px, transparent 1px),
                      linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)
                    `,
                    backgroundSize: '40px 40px',
                  }}
                />

                <svg
                  className="absolute inset-0 h-full w-full opacity-30"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M 0 200 Q 200 180 400 220 T 800 200"
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth="3"
                    fill="none"
                  />
                  <path
                    d="M 150 0 L 180 400"
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth="2"
                    fill="none"
                  />
                  <path
                    d="M 450 0 L 420 400"
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth="2"
                    fill="none"
                  />
                </svg>

                {solineras.map((s, idx) => {
                  const pos = positions[idx % positions.length];
                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelected(s)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && setSelected(s)}
                      className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                      style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                    >
                      <motion.div
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.9 }}
                        className="relative"
                      >
                        <span className="absolute -inset-2 animate-pulse-ring rounded-full bg-success/30" />
                        <div
                          className={cn(
                            'flex h-10 w-10 items-center justify-center rounded-full border-2 shadow-lg',
                            selected?.id === s.id
                              ? 'border-primary bg-primary text-white'
                              : 'border-success/50 bg-success/20 text-success'
                          )}
                        >
                          <Zap className="h-5 w-5" />
                        </div>
                        {selected?.id === s.id && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute left-1/2 top-full z-10 mt-2 w-44 -translate-x-1/2 rounded-xl border border-border bg-popover p-3 shadow-xl"
                          >
                            <p className="text-xs font-semibold">{s.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {s.points} puntos · {s.pricePerKwh} CUP/kWh
                            </p>
                            <Button
                              size="sm"
                              className="mt-2 h-7 w-full gradient-solar text-white"
                              onClick={(e) => {
                                e.stopPropagation();
                                openReserve(s);
                              }}
                            >
                              Reservar
                            </Button>
                          </motion.div>
                        )}
                      </motion.div>
                    </div>
                  );
                })}

                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="relative">
                    <span className="absolute -inset-3 animate-pulse-ring rounded-full bg-info/30" />
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-info text-white ring-4 ring-info/30">
                      <Navigation className="h-3 w-3" />
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-lg glass px-3 py-2">
                  <Sun className="h-4 w-4 text-accent" />
                  <span className="text-xs">Producción solar: 4.2 kW</span>
                </div>
                <div className="absolute bottom-4 right-4 flex items-center gap-2 rounded-lg glass px-3 py-2">
                  <Battery className="h-4 w-4 text-success" />
                  <span className="text-xs">
                    {solineras.length} estaciones
                  </span>
                </div>
              </div>
            </GlassCard>
          </FadeIn>

          <FadeIn delay={0.3} className="lg:col-span-2">
            <div className="space-y-3 scrollbar-hide lg:max-h-[520px] lg:overflow-y-auto">
              {solineras.map((s, idx) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + idx * 0.1 }}
                >
                  <GlassCard hover className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{s.name}</h4>
                          <SoliBadge variant="success">Abierto</SoliBadge>
                        </div>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" /> {s.address}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-accent" /> 4.8
                          </span>
                          <span className="flex items-center gap-1">
                            <Zap className="h-3 w-3 text-primary" /> {s.points}{' '}
                            puntos
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-sm font-medium text-primary">
                        {s.pricePerKwh} CUP/kWh
                      </span>
                      <Button
                        size="sm"
                        className="gradient-solar text-white hover:opacity-90"
                        onClick={() => openReserve(s)}
                      >
                        Reservar
                      </Button>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </FadeIn>
        </div>
      </div>

      {/* Reserve Dialog */}
      <Dialog open={reserveOpen} onOpenChange={setReserveOpen}>
        <DialogContent className="glass-strong max-w-md border-border/50">
          <DialogHeader>
            <DialogTitle>Reservar carga</DialogTitle>
            <DialogDescription>
              {selected?.name} · {selected?.address}
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between rounded-xl border border-border/50 bg-card/30 p-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-solar text-white">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {selected.points} puntos
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selected.pricePerKwh} CUP/kWh
                    </p>
                  </div>
                </div>
                <SoliBadge variant="success">
                  <Check className="h-3 w-3" /> {selected.points} libres
                </SoliBadge>
              </div>

              <div className="space-y-2">
                <Label icon={<Calendar className="h-4 w-4" />}>
                  Selecciona un horario
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {slots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setSelectedSlot(slot)}
                      className={cn(
                        'rounded-lg border px-3 py-2 text-sm font-medium transition-all',
                        selectedSlot === slot
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border/50 hover:border-primary/30 hover:bg-muted'
                      )}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label icon={<CreditCard className="h-4 w-4" />}>
                  Método de pago
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <PaymentButton
                    active={paymentMethod === 'transfermovil'}
                    onClick={() => setPaymentMethod('transfermovil')}
                    icon={<Smartphone className="h-5 w-5" />}
                    label="Transfermóvil"
                  />
                  <PaymentButton
                    active={paymentMethod === 'enzona'}
                    onClick={() => setPaymentMethod('enzona')}
                    icon={<CreditCard className="h-5 w-5" />}
                    label="EnZona"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-primary/30 bg-primary/5 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Estimado (20 kWh)
                  </span>
                  <span className="font-bold text-primary">
                    {20 * (selected.pricePerKwh || 5)} CUP
                  </span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReserveOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="gradient-solar text-white hover:opacity-90"
              disabled={!selectedSlot || !paymentMethod}
              onClick={confirmReserve}
            >
              Confirmar reserva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog with QR */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="glass-strong max-w-sm border-border/50">
          <DialogHeader>
            <DialogTitle className="sr-only">Reserva confirmada</DialogTitle>
            <DialogDescription className="sr-only">
              Muestra este código QR al llegar a la solinera
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center py-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 12 }}
              className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/15"
            >
              <Check className="h-8 w-8 text-success" />
            </motion.div>
            <h3 className="text-lg font-bold">Reserva confirmada</h3>
            <p className="mt-1 text-center text-sm text-muted-foreground">
              {selected?.name} · Hoy a las {selectedSlot}
            </p>

            <div className="mt-4 rounded-xl border border-border/50 bg-white p-4">
              <QRCodeSVG
                value={JSON.stringify({
                  type: 'solinet-reservation',
                  solineraId: selected?.id,
                  solineraName: selected?.name,
                  driverId: driver?.id,
                  driverName: driver?.name,
                  plate: driver?.plate,
                  car: driver?.car,
                  slot: selectedSlot,
                  amount: 20 * (selected?.pricePerKwh || 5),
                  method: paymentMethod,
                  ts: Date.now(),
                })}
                size={200}
                level="M"
              />
            </div>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Muestra este código al llegar a la solinera
            </p>

            <div className="mt-4 flex w-full gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setConfirmOpen(false)}
              >
                Cerrar
              </Button>
              <Button
                className="flex-1 gradient-tech text-white hover:opacity-90"
                asChild
              >
                <Link href="/reservas">Ver mis reservas</Link>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function FilterChip({
  children,
  active,
}: {
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <button
      className={cn(
        'rounded-full border px-3 py-1 text-xs font-medium transition-all',
        active
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border/50 text-muted-foreground hover:border-primary/30 hover:text-foreground'
      )}
    >
      {children}
    </button>
  );
}

function Label({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-center gap-2 text-sm font-medium">
      {icon}
      {children}
    </label>
  );
}

function PaymentButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium transition-all',
        active
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border/50 hover:border-primary/30 hover:bg-muted'
      )}
    >
      {icon}
      {label}
    </button>
  );
}