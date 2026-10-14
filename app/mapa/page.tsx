'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import {
  MapPin,
  Zap,
  Star,
  Filter,
  Search,
  Check,
  Calendar,
  Smartphone,
  CreditCard,
  Share2,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { AppShell } from '@/components/soli/app-shell';
import {
  GlassCard,
  SoliBadge,
  StatusIndicator,
} from '@/components/soli/glass-card';
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
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import { useAllSolineras, SolineraRemote } from '@/lib/queries/solinera';
import {
  useCreateReservation,
  useMyReservations,
} from '@/lib/queries/reservas';
import { createClient } from '@/lib/supabase/client';

const RealMapDynamic = dynamic(
  () => import('@/components/soli/real-map').then((m) => m.RealMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center rounded-2xl bg-card/30">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ),
  }
);

export default function MapaPage() {
  const { data: solineras = [], isLoading } = useAllSolineras();
  const createReservation = useCreateReservation();

  const [selected, setSelected] = React.useState<SolineraRemote | null>(null);
  const [reserveOpen, setReserveOpen] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [selectedSlot, setSelectedSlot] = React.useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = React.useState<
    'transfermovil' | 'enzona' | null
  >(null);
  const [driverProfile, setDriverProfile] = React.useState<any>(null);
  const [lastReservation, setLastReservation] = React.useState<any>(null);

  // Cargar driver profile
  React.useEffect(() => {
    const loadDriver = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('driver_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      setDriverProfile(data);
    };
    loadDriver();
  }, []);

  const openReserve = (s: SolineraRemote) => {
    setSelected(s);
    setReserveOpen(true);
  };

  const shareSolinera = (s: SolineraRemote) => {
    const text = `⚡ Mira esta solinera: ${s.name} - ${s.address}. Reserva tu carga en SoliNet: https://www.solinet.de5.net/mapa`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const confirmReserve = async () => {
    if (!selected || !selectedSlot || !paymentMethod) return;

    try {
      const reservation = await createReservation.mutateAsync({
        solineraId: selected.id,
        slot: selectedSlot,
        amount: 20 * (selected.price_per_kwh || 5),
        method: paymentMethod,
      });

      setLastReservation({
        ...reservation,
        solineraName: selected.name,
      });
      toast.success(`Reserva confirmada con ${paymentMethod}`);
      setReserveOpen(false);
      setConfirmOpen(true);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error al reservar');
    }
  };

  const slots = [
    '8:00 AM',
    '9:00 AM',
    '9:30 AM',
    '10:00 AM',
    '11:00 AM',
    '12:00 PM',
    '2:00 PM',
    '3:00 PM',
    '4:00 PM',
    '5:00 PM',
  ];

  const validSolineras = solineras.filter(
    (s) => s.lat != null && s.lng != null
  );

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex h-96 flex-col items-center justify-center gap-4 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Cargando solineras...</p>
        </div>
      </AppShell>
    );
  }

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
              Aún no hay solineras registradas. Vuelve más tarde.
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
              <div className="relative h-[400px] w-full overflow-hidden rounded-2xl sm:h-[520px]">
                <RealMapDynamic
                  solineras={validSolineras.map((s) => ({
                    id: s.id,
                    name: s.name,
                    address: s.address,
                    lat: s.lat,
                    lng: s.lng,
                    pricePerKwh: s.price_per_kwh,
                    points: s.points,
                  }))}
                  selectedId={selected?.id}
                  onSelect={(s) => {
                    const full = solineras.find((x) => x.id === s.id);
                    if (full) setSelected(full);
                  }}
                  onReserve={(s) => {
                    const full = solineras.find((x) => x.id === s.id);
                    if (full) openReserve(full);
                  }}
                  showDownloadControl={true}
                />
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
                  <GlassCard
                    hover
                    className={cn(
                      'p-4 transition-all',
                      selected?.id === s.id && 'border-primary/50 bg-primary/5'
                    )}
                  >
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
                        {s.price_per_kwh} CUP/kWh
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => shareSolinera(s)}
                          title="Compartir por WhatsApp"
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          className="gradient-solar text-white hover:opacity-90"
                          onClick={() => openReserve(s)}
                        >
                          Reservar
                        </Button>
                      </div>
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
                      {selected.price_per_kwh} CUP/kWh
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
                        'rounded-lg border px-2 py-2 text-xs font-medium transition-all',
                        selectedSlot === slot
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border/50 hover:border-primary/30 hover:bg-muted'
                      )}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
                <div className="mt-2">
                  <label className="text-xs text-muted-foreground">
                    O elige otra hora:
                  </label>
                  <input
                    type="time"
                    onChange={(e) => {
                      if (e.target.value) {
                        const [h, m] = e.target.value.split(':');
                        const hour = parseInt(h);
                        const ampm = hour >= 12 ? 'PM' : 'AM';
                        const h12 = hour % 12 || 12;
                        setSelectedSlot(`${h12}:${m} ${ampm}`);
                      }
                    }}
                    className="mt-1 w-full rounded-lg border border-border/50 bg-card px-3 py-2 text-sm"
                  />
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
                    {20 * (selected.price_per_kwh || 5)} CUP
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
              disabled={
                !selectedSlot ||
                !paymentMethod ||
                createReservation.isPending
              }
              onClick={confirmReserve}
            >
              {createReservation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                'Confirmar reserva'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmación con QR */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="glass-strong max-w-sm border-border/50">
          <DialogHeader>
            <DialogTitle className="sr-only">Reserva confirmada</DialogTitle>
            <DialogDescription className="sr-only">
              Muestra este código al llegar
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
              {lastReservation?.solineraName} · {selectedSlot}
            </p>

            {lastReservation && (
              <>
                <div className="mt-4 rounded-xl border border-border/50 bg-white p-4">
                  <QRCodeSVG
                    value={JSON.stringify({
                      type: 'solinet-reservation',
                      reservationId: lastReservation.id,
                      shortCode: lastReservation.short_code,
                      solineraId: lastReservation.solinera_id,
                      solineraName: lastReservation.solineraName,
                      driverId: lastReservation.driver_id,
                      driverName: driverProfile?.name,
                      plate: driverProfile?.plate,
                      car: driverProfile?.car,
                      slot: lastReservation.slot,
                      amount: lastReservation.amount,
                      method: lastReservation.payment_method,
                    })}
                    size={200}
                    level="M"
                  />
                </div>

                <div className="mt-4 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 p-4 text-center">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Código de reserva
                  </p>
                  <p className="mt-1 text-3xl font-bold tracking-[0.3em] text-primary">
                    {lastReservation.short_code}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Muestra este código al llegar
                  </p>
                </div>
              </>
            )}

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