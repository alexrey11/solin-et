'use client';

import * as React from 'react';
import {
  Settings,
  DollarSign,
  Bell,
  Users,
  Sun,
  Save,
  Plus,
  Building,
  Zap,
} from 'lucide-react';
import { AppShell } from '@/components/soli/app-shell';
import { GlassCard, SoliBadge } from '@/components/soli/glass-card';
import { PageHeader, FadeIn } from '@/components/soli/charts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getCurrentUser } from '@/lib/auth';
import { getBusinessProfile, saveBusinessProfile } from '@/lib/profile';
import { Solinera } from '@/lib/db';
import { toast } from 'sonner';

export default function ConfiguracionPage() {
  const [profile, setProfile] = React.useState<Solinera | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [userId, setUserId] = React.useState<number | null>(null);

  // Cargar usuario y su solinera
  React.useEffect(() => {
    const load = async () => {
      const user = await getCurrentUser();
      if (!user || !user.id) {
        setLoading(false);
        return;
      }
      setUserId(user.id);
      const p = await getBusinessProfile(user.id);
      if (p) {
        setProfile(p);
      } else {
        // Crear solinera vacía si no existe
        await saveBusinessProfile(user.id, {
          name: `${user.name}`,
          owner: user.name,
          email: user.email,
          address: '',
        });
        const created = await getBusinessProfile(user.id);
        setProfile(created);
      }
      setLoading(false);
    };
    load();
  }, []);

  // ⚠️ HOOKS SIEMPRE ARRIBA, ANTES DE CUALQUIER RETURN
  const points = React.useMemo(() => {
    if (!profile) return [];
    const count = profile.points || 0;
    return Array.from({ length: count }).map((_, i) => ({
      name: `Punto ${i + 1}`,
      power: i < 2 ? '7.4 kW' : '22 kW',
      type: i < 2 ? 'Tipo 2' : 'CCS',
    }));
  }, [profile]);

  const update = (key: keyof Solinera, value: any) => {
    if (!profile) return;
    setProfile({ ...profile, [key]: value });
  };

  const handleSave = async () => {
    if (!profile || !userId) return;
    setSaving(true);
    try {
      await saveBusinessProfile(userId, profile);
      toast.success('Cambios guardados');
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex h-96 items-center justify-center text-muted-foreground">
          Cargando configuración...
        </div>
      </AppShell>
    );
  }

  if (!profile) {
    return (
      <AppShell>
        <div className="flex h-96 items-center justify-center text-muted-foreground">
          No se pudo cargar la configuración
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
              disabled={saving}
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Guardando...' : 'Guardar cambios'}
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
            <TabsTrigger value="users">
              <Users className="mr-2 h-4 w-4" /> Usuarios
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
                      {profile.name || 'Mi Solinera'}
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
                    value={profile.name || ''}
                    onChange={(v) => update('name', v)}
                  />
                  <Field
                    label="Propietario"
                    value={profile.owner || ''}
                    onChange={(v) => update('owner', v)}
                  />
                  <Field
                    label="Correo electrónico"
                    value={profile.email || ''}
                    onChange={(v) => update('email', v)}
                  />
                  <Field
                    label="Teléfono"
                    value={profile.phone || ''}
                    onChange={(v) => update('phone', v)}
                  />
                  <Field
                    label="Dirección"
                    value={profile.address || ''}
                    onChange={(v) => update('address', v)}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Field
                      label="Apertura"
                      value={profile.openingHours || '06:00'}
                      onChange={(v) => update('openingHours', v)}
                    />
                    <Field
                      label="Cierre"
                      value={profile.closingHours || '22:00'}
                      onChange={(v) => update('closingHours', v)}
                    />
                  </div>
                </div>
              </GlassCard>
            </FadeIn>

            <FadeIn delay={0.2}>
              <GlassCard className="p-6">
                <h3 className="mb-4 text-lg font-semibold">Puntos de carga</h3>
                <div className="space-y-3">
                  {points.map((p) => (
                    <div
                      key={p.name}
                      className="flex items-center justify-between rounded-xl border border-border/50 bg-card/30 p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                          <Zap className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{p.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {p.power} · {p.type}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => update('points', (profile.points || 0) + 1)}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Añadir punto de carga
                  </Button>
                </div>
              </GlassCard>
            </FadeIn>
          </TabsContent>

          {/* Tariffs */}
          <TabsContent value="tariffs" className="space-y-6">
            <FadeIn delay={0.1}>
              <GlassCard className="p-6">
                <h3 className="mb-4 text-lg font-semibold">
                  Estructura de tarifas
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field
                    label="Tarifa base por kWh (CUP)"
                    value={String(profile.pricePerKwh || '')}
                    onChange={(v) => update('pricePerKwh', parseFloat(v) || 0)}
                    type="number"
                  />
                  <Field
                    label="Costo de reserva (CUP)"
                    value={String(profile.reservationFee || '')}
                    onChange={(v) =>
                      update('reservationFee', parseFloat(v) || 0)
                    }
                    type="number"
                  />
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

          {/* Users */}
          <TabsContent value="users" className="space-y-6">
            <FadeIn delay={0.1}>
              <GlassCard className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Usuarios del sistema</h3>
                  <Button size="sm" variant="outline">
                    <Plus className="mr-2 h-4 w-4" /> Invitar usuario
                  </Button>
                </div>
                <div className="space-y-3">
                  {[
                    {
                      name: 'Ana Castillo',
                      email: 'ana@solinet.cu',
                      role: 'Administradora',
                      initials: 'AC',
                    },
                    {
                      name: 'Luis Fernández',
                      email: 'luis@solinet.cu',
                      role: 'Operador',
                      initials: 'LF',
                    },
                  ].map((u) => (
                    <div
                      key={u.email}
                      className="flex items-center justify-between rounded-xl border border-border/50 bg-card/30 p-4"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="gradient-solar text-white">
                            {u.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{u.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {u.email}
                          </p>
                        </div>
                      </div>
                      <SoliBadge
                        variant={u.role === 'Administradora' ? 'solar' : 'info'}
                      >
                        {u.role}
                      </SoliBadge>
                    </div>
                  ))}
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