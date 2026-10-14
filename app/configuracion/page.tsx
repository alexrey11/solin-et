'use client';

import * as React from 'react';
import {
  Settings,
  DollarSign,
  Bell,
  Sun,
  Save,
  Plus,
  Building,
  Zap,
  Trash2,
  Gauge,
  Loader2,
} from 'lucide-react';
import { AppShell } from '@/components/soli/app-shell';
import { GlassCard } from '@/components/soli/glass-card';
import { PageHeader, FadeIn } from '@/components/soli/charts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useSolineraActiva, useSaveSolinera } from '@/lib/queries/solinera';
import {
  ChargePointConfig,
  POWER_OPTIONS,
  getPointType,
} from '@/lib/db';

export default function ConfiguracionPage() {
  const { data: solinera, isLoading } = useSolineraActiva();
  const saveSolinera = useSaveSolinera();

  const [form, setForm] = React.useState({
    name: '',
    address: '',
    openingHours: '06:00',
    closingHours: '22:00',
    phone: '',
    pricePerKwh: '5',
    pointsConfig: [] as ChargePointConfig[],
  });
  const [hydrated, setHydrated] = React.useState(false);

  // Hidratar form cuando llega la solinera
  React.useEffect(() => {
    if (solinera && !hydrated) {
      const points: ChargePointConfig[] =
        Array.isArray(solinera.points_config) && solinera.points_config.length > 0
          ? solinera.points_config
          : Array.from({ length: solinera.points || 4 }).map((_, i) => ({
            id: `P${i + 1}`,
            label: `Punto ${i + 1}`,
            power: i < 2 ? 7.4 : 22,
            pricePerKwh: i < 2 ? 5 : 7.5,
          }));

      setForm({
        name: solinera.name || '',
        address: solinera.address || '',
        openingHours: solinera.opening_hours || '06:00',
        closingHours: solinera.closing_hours || '22:00',
        phone: solinera.phone || '',
        pricePerKwh: String(solinera.price_per_kwh || 5),
        pointsConfig: points,
      });
      setHydrated(true);
    }
  }, [solinera, hydrated]);

  const update = (key: string, value: any) =>
    setForm((f) => ({ ...f, [key]: value }));

  const updatePoint = (
    index: number,
    updates: Partial<ChargePointConfig>
  ) => {
    const newConfig = form.pointsConfig.map((p, i) =>
      i === index ? { ...p, ...updates } : p
    );
    setForm((f) => ({ ...f, pointsConfig: newConfig }));
  };

  const addPoint = () => {
    if (form.pointsConfig.length >= 10) {
      toast.error('Máximo 10 puntos');
      return;
    }
    const n = form.pointsConfig.length + 1;
    const basePrice = parseFloat(form.pricePerKwh) || 5;
    setForm((f) => ({
      ...f,
      pointsConfig: [
        ...f.pointsConfig,
        {
          id: `P${n}`,
          label: `Punto ${n}`,
          power: 7.4,
          pricePerKwh: basePrice,
        },
      ],
    }));
  };

  const removePoint = (index: number) => {
    if (form.pointsConfig.length <= 1) {
      toast.error('Debe haber al menos 1 punto');
      return;
    }
    const newConfig = form.pointsConfig
      .filter((_, i) => i !== index)
      .map((p, i) => ({
        ...p,
        id: `P${i + 1}`,
        label: `Punto ${i + 1}`,
      }));
    setForm((f) => ({ ...f, pointsConfig: newConfig }));
  };

  const handleSave = async () => {
    if (!solinera) return;

    try {
      await saveSolinera.mutateAsync({
        name: form.name.trim() || 'Mi Solinera',
        address: form.address.trim() || 'Sin dirección',
        lat: solinera.lat,
        lng: solinera.lng,
        pricePerKwh: parseFloat(form.pricePerKwh) || 5,
        points: form.pointsConfig.length,
        pointsConfig: form.pointsConfig,
        openingHours: form.openingHours,
        closingHours: form.closingHours,
        phone: form.phone,
      });

      toast.success('Cambios guardados');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error al guardar');
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex h-96 flex-col items-center justify-center gap-4 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Cargando configuración...</p>
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
          title="Configuración"
          subtitle="Gestiona tu solinera, tarifas y preferencias"
          action={
            <Button
              className="gradient-solar text-white hover:opacity-90"
              size="sm"
              onClick={handleSave}
              disabled={saveSolinera.isPending}
            >
              {saveSolinera.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar cambios
                </>
              )}
            </Button>
          }
        />

        <Tabs defaultValue="business">
          <TabsList className="bg-card/40 backdrop-blur">
            <TabsTrigger value="business">
              <Building className="mr-2 h-4 w-4" /> Negocio
            </TabsTrigger>
            <TabsTrigger value="tariffs">
              <DollarSign className="mr-2 h-4 w-4" /> Tarifas
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="mr-2 h-4 w-4" /> Notificaciones
            </TabsTrigger>
          </TabsList>

          {/* Business */}
          <TabsContent value="business" className="space-y-6">
            <FadeIn delay={0.1}>
              <GlassCard className="p-6">
                <div className="mb-5 flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-solar shadow-glow-orange">
                    <Sun className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">
                      {form.name || 'Mi Solinera'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Plan Pro · Activa
                    </p>
                  </div>
                </div>
                <Separator className="mb-5" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field
                    label="Nombre de la solinera"
                    value={form.name}
                    onChange={(v) => update('name', v)}
                  />
                  <Field
                    label="Teléfono"
                    value={form.phone}
                    onChange={(v) => update('phone', v)}
                  />
                  <div className="sm:col-span-2">
                    <Field
                      label="Dirección"
                      value={form.address}
                      onChange={(v) => update('address', v)}
                    />
                  </div>
                  <Field
                    label="Apertura"
                    value={form.openingHours}
                    onChange={(v) => update('openingHours', v)}
                  />
                  <Field
                    label="Cierre"
                    value={form.closingHours}
                    onChange={(v) => update('closingHours', v)}
                  />
                </div>
              </GlassCard>
            </FadeIn>

            <FadeIn delay={0.2}>
              <GlassCard className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Puntos de carga</h3>
                    <p className="text-sm text-muted-foreground">
                      Configura la potencia y tarifa de cada punto
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addPoint}
                    disabled={form.pointsConfig.length >= 10}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Añadir
                  </Button>
                </div>

                <div className="space-y-3">
                  {form.pointsConfig.map((point, i) => {
                    const type = getPointType(point.power);
                    return (
                      <div
                        key={point.id}
                        className={cn(
                          'rounded-xl border p-4',
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
                          {form.pointsConfig.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => removePoint(i)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </GlassCard>
            </FadeIn>
          </TabsContent>

          {/* Tariffs */}
          <TabsContent value="tariffs" className="space-y-6">
            <FadeIn delay={0.1}>
              <GlassCard className="p-6">
                <h3 className="mb-4 text-lg font-semibold">
                  Tarifa base de referencia
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field
                    label="Tarifa base por kWh (CUP)"
                    value={form.pricePerKwh}
                    onChange={(v) => update('pricePerKwh', v)}
                    type="number"
                  />
                </div>
                <div className="mt-4 rounded-xl border border-info/30 bg-info/5 p-4">
                  <div className="flex items-center gap-2">
                    <Gauge className="h-4 w-4 text-info" />
                    <span className="text-sm font-medium">
                      Cada punto tiene su propia tarifa
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    El precio final se calcula: potencia (kW) × tiempo (h) ×
                    tarifa del punto
                  </p>
                </div>
              </GlassCard>
            </FadeIn>

            <FadeIn delay={0.2}>
              <GlassCard className="p-6">
                <h3 className="mb-4 text-lg font-semibold">
                  Horarios especiales
                </h3>
                <div className="space-y-3">
                  <ToggleRow
                    label="Tarifa reducida en horas valle (22:00 - 6:00)"
                    description="20% de descuento en horas de baja demanda"
                    defaultChecked
                  />
                  <ToggleRow
                    label="Tarifa premium en horas pico (12:00 - 14:00)"
                    description="Recargo del 10% en horas de máxima demanda"
                  />
                </div>
              </GlassCard>
            </FadeIn>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="space-y-6">
            <FadeIn delay={0.1}>
              <GlassCard className="p-6">
                <h3 className="mb-4 text-lg font-semibold">
                  Preferencias de notificaciones
                </h3>
                <div className="space-y-3">
                  <ToggleRow
                    label="Nueva reserva recibida"
                    description="Notificación cuando un cliente reserva una carga"
                    defaultChecked
                  />
                  <ToggleRow
                    label="Cliente en cola"
                    description="Alerta cuando un vehículo se une a la cola"
                    defaultChecked
                  />
                  <ToggleRow
                    label="Carga completada"
                    description="Aviso cuando una sesión de carga termina"
                    defaultChecked
                  />
                </div>
              </GlassCard>
            </FadeIn>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
      />
    </div>
  );
}

function ToggleRow({
  label,
  description,
  defaultChecked,
}: {
  label: string;
  description: string;
  defaultChecked?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/50 bg-card/30 p-4">
      <div className="pr-4">
        <p className="font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch defaultChecked={defaultChecked} />
    </div>
  );
}