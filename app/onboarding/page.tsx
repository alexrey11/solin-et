'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  Sun,
  Zap,
  Users,
  DollarSign,
  ArrowRight,
  Check,
  Building,
  Battery,
  MapPin,
  Gauge,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GlassCard } from '@/components/soli/glass-card';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useSaveSolinera, useSolineraActiva } from '@/lib/queries/solinera';
import {
  ChargePointConfig,
  POWER_OPTIONS,
  getPointType,
} from '@/lib/db';

const RealMapDynamic = dynamic(
  () => import('@/components/soli/real-map').then((m) => m.RealMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 w-full items-center justify-center rounded-xl bg-card/30">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ),
  }
);

const steps = [
  { id: 0, label: 'Bienvenida', icon: Sun },
  { id: 1, label: 'Tu solinera', icon: Building },
  { id: 2, label: 'Ubicación', icon: MapPin },
  { id: 3, label: 'Puntos', icon: Zap },
  { id: 4, label: 'Tarifas', icon: DollarSign },
  { id: 5, label: 'Listo', icon: Check },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { data: existingSolinera, isLoading } = useSolineraActiva();
  const saveSolinera = useSaveSolinera();

  const [step, setStep] = React.useState(0);
  const [hydrated, setHydrated] = React.useState(false);

  const [name, setName] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [openingHours, setOpeningHours] = React.useState('06:00');
  const [closingHours, setClosingHours] = React.useState('22:00');
  const [phone, setPhone] = React.useState('');
  const [pricePerKwh, setPricePerKwh] = React.useState('5.00');
  const [reservationFee, setReservationFee] = React.useState('10.00');
  const [location, setLocation] = React.useState<{ lat: number; lng: number } | null>(null);
  const [pointsConfig, setPointsConfig] = React.useState<ChargePointConfig[]>([
    { id: 'P1', label: 'Punto 1', power: 7.4, pricePerKwh: 5 },
    { id: 'P2', label: 'Punto 2', power: 7.4, pricePerKwh: 5 },
    { id: 'P3', label: 'Punto 3', power: 22, pricePerKwh: 7.5 },
    { id: 'P4', label: 'Punto 4', power: 22, pricePerKwh: 7.5 },
  ]);

  // Si ya tiene solinera, precargar
  React.useEffect(() => {
    if (existingSolinera && !hydrated) {
      setName(existingSolinera.name || '');
      setAddress(existingSolinera.address || '');
      setOpeningHours(existingSolinera.opening_hours || '06:00');
      setClosingHours(existingSolinera.closing_hours || '22:00');
      setPhone(existingSolinera.phone || '');
      setPricePerKwh(String(existingSolinera.price_per_kwh || 5));
      setLocation({ lat: existingSolinera.lat, lng: existingSolinera.lng });

      if (
        Array.isArray(existingSolinera.points_config) &&
        existingSolinera.points_config.length > 0
      ) {
        setPointsConfig(existingSolinera.points_config);
      }
      setHydrated(true);
    }
  }, [existingSolinera, hydrated]);

  const next = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const updatePoint = (index: number, updates: Partial<ChargePointConfig>) => {
    setPointsConfig((prev) =>
      prev.map((p, i) => (i === index ? { ...p, ...updates } : p))
    );
  };

  const addPoint = () => {
    if (pointsConfig.length >= 10) {
      toast.error('Máximo 10 puntos');
      return;
    }
    const n = pointsConfig.length + 1;
    const basePrice = parseFloat(pricePerKwh) || 5;
    setPointsConfig([
      ...pointsConfig,
      {
        id: `P${n}`,
        label: `Punto ${n}`,
        power: 7.4,
        pricePerKwh: basePrice,
      },
    ]);
  };

  const removePoint = (index: number) => {
    if (pointsConfig.length <= 1) {
      toast.error('Debe haber al menos 1 punto');
      return;
    }
    const newConfig = pointsConfig
      .filter((_, i) => i !== index)
      .map((p, i) => ({
        ...p,
        id: `P${i + 1}`,
        label: `Punto ${i + 1}`,
      }));
    setPointsConfig(newConfig);
  };

  const handleFinish = async () => {
    if (!location) {
      toast.error('Marca la ubicación de tu solinera en el mapa');
      setStep(2);
      return;
    }
    if (pointsConfig.length === 0) {
      toast.error('Configura al menos un punto de carga');
      setStep(3);
      return;
    }

    try {
      await saveSolinera.mutateAsync({
        name: name.trim() || 'Mi Solinera',
        address: address.trim() || 'Sin dirección',
        lat: location.lat,
        lng: location.lng,
        pricePerKwh: parseFloat(pricePerKwh) || 5,
        points: pointsConfig.length,
        pointsConfig: pointsConfig,
        openingHours,
        closingHours,
        phone: phone.trim(),
      });

      toast.success('Solinera guardada');
      router.push('/dashboard');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error al guardar');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-info/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-8 sm:px-6">
        <div className="mb-8 flex items-center justify-center gap-2.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-solar shadow-glow-orange">
            <Sun className="h-7 w-7 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight">SoliNet</span>
        </div>

        <div className="mb-8 flex items-center justify-center gap-2">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all',
                  i <= step
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground'
                )}
              >
                {i < step ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <s.icon className="h-4 w-4" />
                )}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 w-8 rounded-full transition-all',
                    i < step ? 'bg-primary' : 'bg-border'
                  )}
                />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            className="flex-1"
          >
            {step === 0 && (
              <div className="flex flex-col items-center text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 12 }}
                  className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl gradient-solar shadow-glow-orange"
                >
                  <Sun className="h-12 w-12 text-white" />
                </motion.div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Bienvenido a SoliNet
                </h1>
                <p className="mt-3 max-w-md text-muted-foreground">
                  El sistema operativo de la energía solar privada en Cuba.
                  Configura tu solinera en minutos.
                </p>
                <div className="mt-8 grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
                  <FeatureCard
                    icon={<Zap className="h-5 w-5" />}
                    title="Carga inteligente"
                    desc="Gestiona múltiples puntos"
                  />
                  <FeatureCard
                    icon={<Users className="h-5 w-5" />}
                    title="Cola en vivo"
                    desc="Organiza a tus clientes"
                  />
                  <FeatureCard
                    icon={<DollarSign className="h-5 w-5" />}
                    title="Cobros digitales"
                    desc="Transfermóvil y EnZona"
                  />
                </div>
              </div>
            )}

            {step === 1 && (
              <GlassCard className="p-6">
                <h2 className="text-xl font-bold">Cuéntanos sobre tu solinera</h2>
                <p className="mb-5 text-sm text-muted-foreground">
                  Esta información aparecerá en el mapa para los conductores
                </p>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nombre de la solinera</Label>
                    <Input
                      placeholder="Ej: Solinera Centro Habana"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Dirección</Label>
                    <Input
                      placeholder="Ej: Calle 23, Vedado, Habana"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Apertura</Label>
                      <Input
                        value={openingHours}
                        onChange={(e) => setOpeningHours(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Cierre</Label>
                      <Input
                        value={closingHours}
                        onChange={(e) => setClosingHours(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Teléfono de contacto</Label>
                    <Input
                      placeholder="+53 5 123 4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>
              </GlassCard>
            )}

            {step === 2 && (
              <GlassCard className="p-6">
                <h2 className="text-xl font-bold">Ubica tu solinera</h2>
                <p className="mb-5 text-sm text-muted-foreground">
                  Toca el mapa en la ubicación exacta de tu solinera
                </p>
                <div className="h-80 w-full overflow-hidden rounded-xl border border-border/50">
                  <RealMapDynamic
                    solineras={[]}
                    onSelect={() => { }}
                    onReserve={() => { }}
                    interactive={true}
                    onLocationSelect={(lat, lng) => setLocation({ lat, lng })}
                    markerPosition={location ? [location.lat, location.lng] : null}
                    initialCenter={location ? [location.lat, location.lng] : undefined}
                    initialZoom={location ? 16 : 12}
                  />
                </div>
                {location && (
                  <div className="mt-3 rounded-lg border border-success/30 bg-success/5 p-3">
                    <p className="text-xs text-success">
                      ✓ Ubicación marcada: {location.lat.toFixed(5)},{' '}
                      {location.lng.toFixed(5)}
                    </p>
                  </div>
                )}
              </GlassCard>
            )}

            {step === 3 && (
              <GlassCard className="p-6">
                <h2 className="text-xl font-bold">Configura tus puntos</h2>
                <p className="mb-5 text-sm text-muted-foreground">
                  Elige la potencia de cada punto. Los de mayor potencia cobran más.
                </p>

                <div className="space-y-3">
                  {pointsConfig.map((point, i) => {
                    const type = getPointType(point.power);
                    return (
                      <motion.div
                        key={point.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={cn(
                          'rounded-xl border p-4 transition-all',
                          type === 'ultra'
                            ? 'border-destructive/30 bg-destructive/5'
                            : type === 'rápido'
                              ? 'border-warning/30 bg-warning/5'
                              : 'border-info/30 bg-info/5'
                        )}
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-solar text-white">
                              <Zap className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-medium">{point.label}</p>
                              <p className="text-xs text-muted-foreground">
                                {point.power} kW · {type}
                              </p>
                            </div>
                          </div>
                          {pointsConfig.length > 1 && (
                            <button
                              onClick={() => removePoint(i)}
                              className="rounded-lg px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
                            >
                              Eliminar
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Potencia</Label>
                            <select
                              value={point.power}
                              onChange={(e) =>
                                updatePoint(i, {
                                  power: parseFloat(e.target.value),
                                })
                              }
                              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                            >
                              {POWER_OPTIONS.map((o) => (
                                <option key={o.power} value={o.power}>
                                  {o.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">CUP/kWh</Label>
                            <Input
                              type="number"
                              step="0.5"
                              value={point.pricePerKwh}
                              onChange={(e) =>
                                updatePoint(i, {
                                  pricePerKwh: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="h-[38px]"
                            />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={addPoint}
                    disabled={pointsConfig.length >= 10}
                  >
                    + Añadir punto de carga
                  </Button>
                </div>
              </GlassCard>
            )}

            {step === 4 && (
              <GlassCard className="p-6">
                <h2 className="text-xl font-bold">Define tus tarifas</h2>
                <p className="mb-5 text-sm text-muted-foreground">
                  Tarifa base (los puntos con más potencia aplican multiplicador)
                </p>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Tarifa base por kWh (CUP)</Label>
                    <Input
                      type="number"
                      value={pricePerKwh}
                      onChange={(e) => setPricePerKwh(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Costo de reserva (CUP)</Label>
                    <Input
                      type="number"
                      value={reservationFee}
                      onChange={(e) => setReservationFee(e.target.value)}
                    />
                  </div>
                  <div className="rounded-xl border border-success/30 bg-success/5 p-4">
                    <div className="flex items-center gap-2">
                      <Battery className="h-4 w-4 text-success" />
                      <span className="text-sm font-medium">
                        Configuración actual
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {pointsConfig.length} puntos configurados. Ejemplo: 20 kWh
                      en un punto rápido ={' '}
                      {Math.round((parseFloat(pricePerKwh) || 5) * 20 * 1.5)} CUP
                    </p>
                  </div>
                </div>
              </GlassCard>
            )}

            {step === 5 && (
              <div className="flex flex-col items-center text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 12 }}
                  className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-success/15"
                >
                  <Check className="h-12 w-12 text-success" />
                </motion.div>
                <h1 className="text-3xl font-bold">Todo listo</h1>
                <p className="mt-3 max-w-md text-muted-foreground">
                  Tu solinera está configurada y lista para recibir clientes.
                </p>
                <div className="mt-8 grid w-full grid-cols-2 gap-3">
                  <SummaryItem
                    icon={<Building className="h-4 w-4" />}
                    label="Solinera"
                    value={name || 'Sin nombre'}
                  />
                  <SummaryItem
                    icon={<MapPin className="h-4 w-4" />}
                    label="Ubicación"
                    value={location ? 'Marcada' : 'Sin marcar'}
                  />
                  <SummaryItem
                    icon={<Gauge className="h-4 w-4" />}
                    label="Puntos"
                    value={`${pointsConfig.length} configurados`}
                  />
                  <SummaryItem
                    icon={<DollarSign className="h-4 w-4" />}
                    label="Tarifa base"
                    value={`${pricePerKwh} CUP/kWh`}
                  />
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex items-center justify-between">
          {step > 0 && step < 5 ? (
            <Button variant="outline" onClick={prev}>
              Atrás
            </Button>
          ) : (
            <div />
          )}
          {step < 5 ? (
            <Button
              className="gradient-solar text-white hover:opacity-90"
              onClick={next}
              disabled={step === 2 && !location}
            >
              {step === 0 ? 'Empezar' : 'Continuar'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              className="gradient-solar text-white hover:opacity-90"
              onClick={handleFinish}
              disabled={saveSolinera.isPending}
            >
              {saveSolinera.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  Ir al Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-card/30 p-4 text-center">
      <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl gradient-solar text-white">
        {icon}
      </div>
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </div>
  );
}

function SummaryItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/30 p-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
        {icon}
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}