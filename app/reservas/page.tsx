'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Car, Clock, Zap, X } from 'lucide-react';
import Link from 'next/link';
import { AppShell } from '@/components/soli/app-shell';
import { GlassCard, SoliBadge } from '@/components/soli/glass-card';
import { PageHeader, FadeIn } from '@/components/soli/charts';
import { Button } from '@/components/ui/button';
import { getCurrentUser } from '@/lib/auth';
import {
    getDriverProfile,
    getReservationsByDriver,
    cancelReservation,
} from '@/lib/profile';
import { Reservation } from '@/lib/db';
import { toast } from 'sonner';

export default function ReservasPage() {
    const [loading, setLoading] = React.useState(true);
    const [driverId, setDriverId] = React.useState<number | null>(null);
    const [reservations, setReservations] = React.useState<Reservation[]>([]);
    const [refreshKey, setRefreshKey] = React.useState(0);

    // Cargar reservas
    React.useEffect(() => {
        let mounted = true;
        const load = async () => {
            const user = await getCurrentUser();
            if (!user || user.role !== 'driver') {
                if (mounted) setLoading(false);
                return;
            }

            const driver = await getDriverProfile(user.id!);
            if (!driver || !driver.id) {
                if (mounted) setLoading(false);
                return;
            }

            if (mounted) setDriverId(driver.id);

            const res = await getReservationsByDriver(driver.id);
            if (mounted) {
                setReservations(res);
                setLoading(false);
            }
        };
        load();
        return () => {
            mounted = false;
        };
    }, [refreshKey]);

    const handleCancel = async (id: number) => {
        await cancelReservation(id);
        toast.success('Reserva cancelada');
        setRefreshKey((k) => k + 1);
    };

    const active = reservations.filter(
        (r) => r.status === 'pending' || r.status === 'confirmed'
    );
    const history = reservations.filter(
        (r) => r.status === 'completed' || r.status === 'cancelled'
    );

    if (loading) {
        return (
            <AppShell>
                <div className="flex h-96 items-center justify-center text-muted-foreground">
                    Cargando reservas...
                </div>
            </AppShell>
        );
    }

    if (!driverId) {
        return (
            <AppShell>
                <div className="space-y-6">
                    <PageHeader
                        title="Mis Reservas"
                        subtitle="No has iniciado sesión como conductor"
                    />
                    <GlassCard className="p-12 text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl gradient-tech text-white">
                            <Car className="h-8 w-8" />
                        </div>
                        <h2 className="text-xl font-bold">No tienes perfil de conductor</h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Necesitas una cuenta de conductor para ver tus reservas
                        </p>
                        <Button className="mt-6 gradient-tech text-white" asChild>
                            <Link href="/select-mode">Ir al inicio</Link>
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
                    subtitle="Aquí verás tus reservas activas y su historial"
                />

                {/* Reservas activas */}
                <FadeIn delay={0.1}>
                    <GlassCard className="p-6">
                        <div className="mb-4 flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-primary" />
                            <h3 className="text-lg font-semibold">Reservas activas</h3>
                            <SoliBadge variant="info">{active.length}</SoliBadge>
                        </div>

                        {active.length === 0 ? (
                            <div className="py-12 text-center text-muted-foreground">
                                <Car className="mx-auto mb-2 h-10 w-10 opacity-40" />
                                <p>No tienes reservas activas</p>
                                <Button variant="outline" size="sm" className="mt-4" asChild>
                                    <Link href="/mapa">
                                        <Zap className="mr-2 h-4 w-4" /> Buscar solinera
                                    </Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {active.map((r, idx) => (
                                    <motion.div
                                        key={r.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="flex items-center justify-between rounded-xl border border-border/50 bg-card/30 p-4"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-solar text-white">
                                                <Zap className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <p className="font-medium">{r.solineraName}</p>
                                                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" /> Hoy a las {r.slot}
                                                    </span>
                                                    <span>·</span>
                                                    <span className="uppercase">{r.method}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-semibold text-primary">
                                                {r.amount} CUP
                                            </span>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => r.id && handleCancel(r.id)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </GlassCard>
                </FadeIn>

                {/* Historial */}
                <FadeIn delay={0.2}>
                    <GlassCard className="p-6">
                        <div className="mb-4 flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                            <h3 className="text-lg font-semibold">Historial</h3>
                        </div>

                        {history.length === 0 ? (
                            <p className="py-6 text-center text-sm text-muted-foreground">
                                Aún no tienes reservas completadas
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {history.map((r) => (
                                    <div
                                        key={r.id}
                                        className="flex items-center justify-between rounded-xl border border-border/50 bg-card/20 p-3 opacity-60"
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
                                            {r.status === 'completed' ? 'Completada' : 'Cancelada'}
                                        </SoliBadge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </GlassCard>
                </FadeIn>
            </div>
        </AppShell>
    );
}