'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Sun,
  Zap,
  Users,
  DollarSign,
  ArrowRight,
  Check,
  Building,
  Battery,
  Wifi,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GlassCard } from '@/components/soli/glass-card';
import { cn } from '@/lib/utils';
import { getCurrentUser } from '@/lib/auth';
import { saveBusinessProfile } from '@/lib/profile';
import { toast } from 'sonner';

const steps = [
  { id: 0, label: 'Bienvenida', icon: Sun },
  { id: 1, label: 'Tu solinera', icon: Building },
  { id: 2, label: 'Puntos de carga', icon: Zap },
  { id: 3, label: 'Tarifas', icon: DollarSign },
  { id: 4, label: 'Listo', icon: Check },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [saving, setSaving] = React.useState(false);

  const [name, setName] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [openingHours, setOpeningHours] = React.useState('06:00');
  const [closingHours, setClosingHours] = React.useState('22:00');
  const [phone, setPhone] = React.useState('');
  const [chargePoints, setChargePoints] = React.useState(2);
  const [pricePerKwh, setPricePerKwh] = React.useState('5.00');
  const [reservationFee, setReservationFee] = React.useState('10.00');

  const next = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const handleFinish = async () => {
    setSaving(true);
    try {
      const user = await getCurrentUser();
      if (!user || !user.id) {
        toast.error('Sesión no encontrada');
        router.push('/select-mode');
        return;
      }

      await saveBusinessProfile(user.id, {
        name: name.trim() || 'Mi Solinera',
        owner: user.name,
        email: user.email,
        address: address.trim() || 'Sin dirección',
        phone: phone.trim() || undefined,
        openingHours,
        closingHours,
        points: chargePoints,
        pricePerKwh: parseFloat(pricePerKwh) || 5,
        reservationFee: parseFloat(reservationFee) || 10,
      });

      toast.success('Solinera creada');
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar');
      setSaving(false);
    }
  };

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

        {/* Progress */}
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
                  Configura tu solinera en minutos y empieza a ofrecer carga de
                  vehículos eléctricos.
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
                      <Label>Horario de apertura</Label>
                      <Input
                        value={openingHours}
                        onChange={(e) => setOpeningHours(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Horario de cierre</Label>
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
                <h2 className="text-xl font-bold">
                  Configura tus puntos de carga
                </h2>
                <p className="mb-5 text-sm text-muted-foreground">
                  ¿Cuántos puntos de carga tiene tu solinera?
                </p>

                <div className="mb-6 flex items-center justify-center gap-6">
                  <button
                    onClick={() => setChargePoints(Math.max(1, chargePoints - 1))}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-border hover:bg-muted"
                  >
                    -
                  </button>
                  <span className="text-4xl font-bold text-primary">
                    {chargePoints}
                  </span>
                  <button
                    onClick={() =>
                      setChargePoints(Math.min(10, chargePoints + 1))
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-border hover:bg-muted"
                  >
                    +
                  </button>
                </div>

                <div className="space-y-3">
                  {Array.from({ length: chargePoints }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/30 p-4"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-solar text-white">
                        <Zap className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Punto {i + 1}</p>
                      </div>
                      <select className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm">
                        <option>7.4 kW · Tipo 2</option>
                        <option>11 kW · Tipo 2</option>
                        <option>22 kW · CCS</option>
                        <option>50 kW · CCS</option>
                      </select>
                    </motion.div>
                  ))}
                </div>
              </GlassCard>
            )}

            {step === 3 && (
              <GlassCard className="p-6">
                <h2 className="text-xl font-bold">Define tus tarifas</h2>
                <p className="mb-5 text-sm text-muted-foreground">
                  Puedes ajustarlas más adelante
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
                        Producción solar estimada
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Con 6 paneles de 450W puedes generar ~21 kWh/día,
                      suficiente para ~4 cargas completas
                    </p>
                  </div>
                </div>
              </GlassCard>
            )}

            {step === 4 && (
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
                    icon={<Zap className="h-4 w-4" />}
                    label="Puntos"
                    value={`${chargePoints} activos`}
                  />
                  <SummaryItem
                    icon={<DollarSign className="h-4 w-4" />}
                    label="Tarifa"
                    value={`${pricePerKwh} CUP/kWh`}
                  />
                  <SummaryItem
                    icon={<Wifi className="h-4 w-4" />}
                    label="Estado"
                    value="En línea"
                  />
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex items-center justify-between">
          {step > 0 && step < 4 ? (
            <Button variant="outline" onClick={prev}>
              Atrás
            </Button>
          ) : (
            <div />
          )}
          {step < 4 ? (
            <Button
              className="gradient-solar text-white hover:opacity-90"
              onClick={next}
            >
              {step === 0 ? 'Empezar' : 'Continuar'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              className="gradient-solar text-white hover:opacity-90"
              onClick={handleFinish}
              disabled={saving}
            >
              {saving ? 'Guardando...' : 'Ir al Dashboard'}
              <ArrowRight className="ml-2 h-4 w-4" />
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