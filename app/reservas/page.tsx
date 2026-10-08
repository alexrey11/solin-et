'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
    Calendar,
    Car,
    Clock,
    Zap,
    X,
    Check,
    AlertTriangle,
    MapPin,
    QrCode,
    Bell,
    RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { AppShell } from '@/components/soli/app-shell';
import { GlassCard, SoliBadge } from '@/components/soli/glass-card';
import { PageHeader, FadeIn } from '@/components/soli/charts';
import { Button } from '@/components/ui/button';
import { QRCodeSVG } from 'qrcode.react';
import { getCurrentUser } from '@/lib/auth';
import {
    getDriverProfile,
    getReservationsByDriver,
    cancelReservation,
} from '@/lib/profile';
import { db, Reservation, Driver } from '@/lib/db';
import { toast } from 'sonner';

export default function ReservasPage() {
    const [loading, setLoading] = React.useState(true);
    const [driver, setDriver] = React.useState<Driver | null>(null);
    const [reservations, setReservations] = React.useState<Reservation[]>([]);
    const [refreshKey, setRefreshKey] = React.useState(0);
    const seenConfirmedRef = React.useRef<Set<number>>(new Set());
    const [expandedQR, setExpandedQR] = React.useState<number | null>(null);
    const [waitingForDriver, setWaitingForDriver] = React.useState(false);

    // ===== CARGAR RESERVAS =====
    React.useEffect(() => {
        let mounted = true;

        const load = async () => {
            const user = await getCurrentUser();
            if (!user || user.role !== 'driver') {
                if (mounted) setLoading(false);
                return;
            }

            const d = await getDriverProfile(user.id!);
            if (!d || !d.id) {
                // El driver aún no está. Esperar a que el sync lo baje.
                if (mounted) {
                    setWaitingForDriver(true);
                    setTimeout(() => {
                        if (mounted) setRefreshKey((k) => k + 1);
                    }, 3000);
                }
                return;
            }

            if (mounted) {
                setDriver(d);
                setWaitingForDriver(false);
            }

            const res = await getReservationsByDriver(d.id);

            if (mounted) {
                res.forEach((r) => {
                    if (
                        r.status === 'confirmed' &&
                        r.id &&
                        !seenConfirmedRef.current.has(r.id)
                    ) {
                        seenConfirmedRef.current.add(r.id);
                        toast.success(
                            `¡Tu reserva para las ${r.slot} fue ACEPTADA! Ve a la solinera.`,
                            { duration: 8000 }
                        );
                    }
                });
                setReservations(res);
                setLoading(false);
            }
        };

        load();
        return () => {
            mounted = false;
        };
    }, [refreshKey]);

    // Refrescar cada 15s
    React.useEffect(() => {
        if (!driver || !driver.id) return;
        const interval = setInterval(() => {
            setRefreshKey((k) => k + 1);
        }, 15000);
        return () => clearInterval(interval);
    }, [driver]);

    const handleCancel = async (id: number) => {
        await cancelReservation(id);
        toast.success('Reserva cancelada');
        setRefreshKey((k) => k + 1);
    };

    const pending = reservations.filter((r) => r.status === 'pending');
    const confirmed = reservations.filter((r) => r.status === 'confirmed');
    const history = reservations.filter(
        (r) => r.status === 'completed' || r.status === 'cancelled'
    );

    if (loading) {
        return (
            <AppShell>
                <div className="flex h-96 flex-col items-center justify-center gap-4 text-muted-foreground">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                    <p>
                        {waitingForDriver
                            ? 'Sincronizando tu perfil...'
                            : 'Cargando reservas...'}
                    </p>
                    {waitingForDriver && (
                        <p className="text-xs">Esperando que llegue tu perfil desde el servidor</p>
                    )}
                </div>
            </AppShell>
        );
    }

    if (!driver) {
        return (
            <AppShell>
                <div className="space-y-6">
                    <PageHeader title="Mis Reservas" subtitle="No has iniciado sesión" />
                    <GlassCard className="p-12 text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl gradient-tech text-white">
                            <Car className="h-8 w-8" />
                        </div>
                        <h2 className="text-xl font-bold">No tienes perfil de conductor</h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Ve a tu perfil para completarlo
                        </p>
                        <Button className="mt-6 gradient-tech text-white" asChild>
                            <Link href="/perfil">Ir a mi perfil</Link>
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
                    title="Mis Reservas"
                    subtitle="Aquí verás el estado de tus solicitudes de carga"
                    action={
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setRefreshKey((k) => k + 1)}
                        >
                            <RefreshCw className="mr-2 h-4 w-4" /> Actualizar
                        </Button>
                    }
                />

                {/* ===== RESERVAS CONFIRMADAS ===== */}
                {confirmed.length > 0 && (
                    <FadeIn delay={0.05}>
                        <div className="space-y-4">
                            {confirmed.map((r) => (
                                <motion.div
                                    key={r.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                >
                                    <GlassCard className="overflow-hidden border-success/40 bg-success/5 p-0">
                                        <div className="bg-success/20 px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <motion.div
                                                    animate={{ scale: [1, 1.15, 1] }}
                                                    transition={{ repeat: Infinity, duration: 2 }}
                                                    className="flex h-10 w-10 items-center justify-center rounded-full bg-success text-white"
                                                >
                                                    <Bell className="h-5 w-5" />
                                                </motion.div>
                                                <div>
                                                    <h3 className="font-bold text-success-foreground">
                                                        ¡Reserva aceptada!
                                                    </h3>
                                                    <p className="text-sm text-success-foreground/80">
                                                        Ve a la solinera a las {r.slot}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-6">
                                            <div className="mb-4 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <MapPin className="h-4 w-4" /> Solinera
                                                    </span>
                                                    <span className="font-semibold">
                                                        {r.solineraName}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <Clock className="h-4 w-4" /> Hora
                                                    </span>
                                                    <span className="font-semibold">{r.slot}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <Zap className="h-4 w-4" /> Monto
                                                    </span>
                                                    <span className="font-semibold text-primary">
                                                        {r.amount} CUP
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="mb-4 flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4">
                                                <AlertTriangle className="h-5 w-5 flex-shrink-0 text-warning" />
                                                <div>
                                                    <p className="text-sm font-semibold text-warning-foreground">
                                                        Importante
                                                    </p>
                                                    <p className="mt-1 text-xs text-muted-foreground">
                                                        Si no llegas a la hora reservada, se le dará
                                                        entrada a otro vehículo y tu reserva será
                                                        cancelada. Por favor, sé puntual.
                                                    </p>
                                                </div>
                                            </div>

                                            {expandedQR === r.id ? (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    className="rounded-xl border border-border/50 bg-white p-6"
                                                >
                                                    <div className="flex flex-col items-center">
                                                        <QRCodeSVG
                                                            value={JSON.stringify({
                                                                type: 'solinet-reservation',
                                                                solineraId: r.solineraId,
                                                                solineraName: r.solineraName,
                                                                driverId: driver.id,
                                                                driverName: driver.name,
                                                                plate: driver.plate,
                                                                car: driver.car,
                                                                slot: r.slot,
                                                                amount: r.amount,
                                                                method: r.method,
                                                                ts: r.createdAt,
                                                            })}
                                                            size={220}
                                                            level="M"
                                                        />
                                                        <p className="mt-4 text-center text-xs text-muted-foreground">
                                                            Muestra este QR o el código de abajo al llegar
                                                        </p>
                                                    </div>

                                                    <div className="mt-4 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 p-4 text-center">
                                                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                                            Código de reserva
                                                        </p>
                                                        <p className="mt-1 text-3xl font-bold tracking-[0.3em] text-primary">
                                                            {r.shortCode}
                                                        </p>
                                                        <p className="mt-1 text-xs text-muted-foreground">
                                                            Si el negocio no tiene cámara, dale este código
                                                        </p>
                                                    </div>

                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="mt-2 w-full"
                                                        onClick={() => setExpandedQR(null)}
                                                    >
                                                        Ocultar
                                                    </Button>
                                                </motion.div>
                                            ) : (
                                                <Button
                                                    className="w-full gradient-solar text-white hover:opacity-90"
                                                    onClick={() => setExpandedQR(r.id!)}
                                                >
                                                    <QrCode className="mr-2 h-4 w-4" /> Mostrar mi QR y
                                                    código
                                                </Button>
                                            )}
                                        </div>
                                    </GlassCard>
                                </motion.div>
                            ))}
                        </div>
                    </FadeIn>
                )}

                {/* ===== RESERVAS PENDIENTES ===== */}
                {pending.length > 0 && (
                    <FadeIn delay={0.1}>
                        <GlassCard className="p-6">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-info/15">
                                    <Clock className="h-5 w-5 text-info" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold">
                                        Esperando aprobación
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        El negocio revisará tu solicitud en breve
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {pending.map((r) => (
                                    <div
                                        key={r.id}
                                        className="flex items-center justify-between rounded-xl border border-border/50 bg-card/30 p-4"
                                    >
                                        <div>
                                            <p className="font-medium">{r.solineraName}</p>
                                            <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" /> {r.slot}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Zap className="h-3 w-3" /> {r.amount} CUP
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <SoliBadge variant="info">
                                                <Clock className="h-3 w-3" /> Pendiente
                                            </SoliBadge>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => r.id && handleCancel(r.id)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </GlassCard>
                    </FadeIn>
                )}

                {/* ===== SIN RESERVAS ===== */}
                {pending.length === 0 && confirmed.length === 0 && (
                    <FadeIn delay={0.15}>
                        <GlassCard className="p-12 text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl gradient-tech text-white">
                                <Car className="h-8 w-8" />
                            </div>
                            <h2 className="text-xl font-bold">No tienes reservas activas</h2>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Explora el mapa para encontrar una solinera cercana
                            </p>
                            <Button className="mt-6 gradient-tech text-white" asChild>
                                <Link href="/mapa">
                                    <Zap className="mr-2 h-4 w-4" /> Buscar solinera
                                </Link>
                            </Button>
                        </GlassCard>
                    </FadeIn>
                )}

                {/* ===== HISTORIAL ===== */}
                {history.length > 0 && (
                    <FadeIn delay={0.2}>
                        <GlassCard className="p-6">
                            <div className="mb-4 flex items-center gap-3">
                                <Calendar className="h-5 w-5 text-muted-foreground" />
                                <h3 className="text-lg font-semibold">Historial</h3>
                            </div>

                            <div className="space-y-2">
                                {history.map((r) => (
                                    <div
                                        key={r.id}
                                        className="flex items-center justify-between rounded-xl border border-border/50 bg-card/20 p-3 opacity-70"
                                    >
                                        <div>
                                            <p className="text-sm font-medium">{r.solineraName}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {r.slot} · {r.amount} CUP
                                            </p>
                                        </div>
                                        <SoliBadge
                                            variant={
                                                r.status === 'completed' ? 'success' : 'destructive'
                                            }
                                        >
                                            {r.status === 'completed' ? (
                                                <>
                                                    <Check className="h-3 w-3" /> Completada
                                                </>
                                            ) : (
                                                <>
                                                    <X className="h-3 w-3" /> Cancelada
                                                </>
                                            )}
                                        </SoliBadge>
                                    </div>
                                ))}
                            </div>
                        </GlassCard>
                    </FadeIn>
                )}
            </div>
        </AppShell>
    );
}