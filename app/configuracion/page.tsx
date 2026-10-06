'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  User,
  DollarSign,
  Bell,
  Users,
  Sun,
  Save,
  Trash2,
  Plus,
  Building,
  Zap,
  Clock,
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

export default function ConfiguracionPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Configuración"
          subtitle="Gestiona tu solinera, tarifas y preferencias"
          action={
            <Button className="gradient-solar text-white hover:opacity-90" size="sm">
              <Save className="mr-2 h-4 w-4" /> Guardar cambios
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
                    <h3 className="text-lg font-semibold">Solinera Centro Habana</h3>
                    <p className="text-sm text-muted-foreground">Plan Pro · Activa desde Mayo 2025</p>
                  </div>
                </div>
                <Separator className="mb-5" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Nombre de la solinera" defaultValue="Solinera Centro Habana" />
                  <Field label="Propietario" defaultValue="Ana Castillo" />
                  <Field label="Correo electrónico" defaultValue="ana@solinet.cu" />
                  <Field label="Teléfono" defaultValue="+53 5 123 4567" />
                  <Field label="Dirección" defaultValue="Calle 23, Vedado, Habana" />
                  <Field label="Horario de operación" defaultValue="6:00 - 22:00" />
                </div>
              </GlassCard>
            </FadeIn>

            <FadeIn delay={0.2}>
              <GlassCard className="p-6">
                <h3 className="mb-4 text-lg font-semibold">Puntos de carga</h3>
                <div className="space-y-3">
                  {[
                    { name: 'Punto 1', power: '7.4 kW', type: 'Tipo 2' },
                    { name: 'Punto 2', power: '7.4 kW', type: 'Tipo 2' },
                    { name: 'Punto 3', power: '22 kW', type: 'CCS' },
                    { name: 'Punto 4', power: '22 kW', type: 'CCS' },
                  ].map((p) => (
                    <div key={p.name} className="flex items-center justify-between rounded-xl border border-border/50 bg-card/30 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                          <Zap className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.power} · {p.type}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full">
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
                <h3 className="mb-4 text-lg font-semibold">Estructura de tarifas</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Tarifa base por kWh (CUP)" defaultValue="5.00" />
                    <Field label="Tarifa carga rápida por kWh (CUP)" defaultValue="7.50" />
                    <Field label="Costo de reserva (CUP)" defaultValue="10.00" />
                    <Field label="Penalización por no-show (CUP)" defaultValue="5.00" />
                  </div>
                  <Separator />
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Descuentos por volumen</p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <DiscountField label="10+ kWh" value="5%" />
                      <DiscountField label="20+ kWh" value="10%" />
                      <DiscountField label="50+ kWh" value="15%" />
                    </div>
                  </div>
                </div>
              </GlassCard>
            </FadeIn>

            <FadeIn delay={0.2}>
              <GlassCard className="p-6">
                <h3 className="mb-4 text-lg font-semibold">Horarios especiales</h3>
                <div className="space-y-3">
                  <ToggleRow label="Tarifa reducida en horas valle (22:00 - 6:00)" description="20% de descuento en horas de baja demanda" defaultChecked />
                  <ToggleRow label="Tarifa premium en horas pico (12:00 - 14:00)" description="Recargo del 10% en horas de máxima demanda" />
                  <ToggleRow label="Descuento para clientes frecuentes" description="15% después de 10 cargas en el mes" defaultChecked />
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
                    { name: 'Ana Castillo', email: 'ana@solinet.cu', role: 'Administradora', initials: 'AC' },
                    { name: 'Luis Fernández', email: 'luis@solinet.cu', role: 'Operador', initials: 'LF' },
                    { name: 'Carmen Díaz', email: 'carmen@solinet.cu', role: 'Cajera', initials: 'CD' },
                  ].map((u) => (
                    <div key={u.email} className="flex items-center justify-between rounded-xl border border-border/50 bg-card/30 p-4">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="gradient-solar text-white">{u.initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{u.name}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <SoliBadge variant={u.role === 'Administradora' ? 'solar' : 'info'}>{u.role}</SoliBadge>
                        <Button variant="ghost" size="icon">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
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
                <h3 className="mb-4 text-lg font-semibold">Preferencias de notificaciones</h3>
                <div className="space-y-3">
                  <ToggleRow label="Nueva reserva recibida" description="Notificación cuando un cliente reserva una carga" defaultChecked />
                  <ToggleRow label="Cliente en cola" description="Alerta cuando un vehículo se une a la cola" defaultChecked />
                  <ToggleRow label="Carga completada" description="Aviso cuando una sesión de carga termina" defaultChecked />
                  <ToggleRow label="Batería baja" description="Alerta cuando el banco de baterías baja del 30%" defaultChecked />
                  <ToggleRow label="Reporte diario" description="Resumen de ingresos y actividad cada día a las 22:00" />
                  <ToggleRow label="Conexión perdida" description="Alerta crítica cuando se pierde la conectividad" defaultChecked />
                </div>
              </GlassCard>
            </FadeIn>

            <FadeIn delay={0.2}>
              <GlassCard className="p-6">
                <h3 className="mb-4 text-lg font-semibold">Canales de notificación</h3>
                <div className="space-y-3">
                  <ToggleRow label="Notificaciones push" description="Recibe alertas en tu teléfono" defaultChecked />
                  <ToggleRow label="SMS" description="Mensajes de texto para alertas críticas" defaultChecked />
                  <ToggleRow label="Correo electrónico" description="Resúmenes y reportes por email" />
                </div>
              </GlassCard>
            </FadeIn>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

function Field({ label, defaultValue }: { label: string; defaultValue: string }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input defaultValue={defaultValue} />
    </div>
  );
}

function DiscountField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input defaultValue={value} />
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
