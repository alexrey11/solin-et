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
    Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { AppShell } from '@/components/soli/app-shell';
import { GlassCard, SoliBadge } from '@/components/soli/glass-card';
import { PageHeader, FadeIn } from '@/components/soli/charts';
import { Button } from '@/components/ui/button';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import {
    useMyReservations,
    useCancelReservation,
    ReservationRemote,
} from '@/lib/queries/reservas';
import { createClient } from '@/lib/supabase/client';

export default function ReservasPage() {
    const { data: reservations = [], isLoading, refetch } = useMyReservations();
    const cancelReservation = useCancelReservation();

    const [driverProfile, setDriverProfile] = React.useState<any>(null);
    const [expandedQR, setExpandedQR] = React.useState<string | null>(null);
    const seenConfirmedRef = React.useRef<Set<string>>(new Set());

    // ✅ QR responsive
    const [qrSize, setQrSize] = React.useState(200);
    React.useEffect(() => {
        const update = () => {
            const w = window.innerWidth;
            if (w < 360) setQrSize(160);
            else if (w < 400) setQrSize(180);
            else if (w < 480) setQrSize(200);
            else setQrSize(220);
        };
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);

    // Cargar driver profile (offline-safe)
    React.useEffect(() => {
        const loadDriver = async () => {
            const supabase = createClient();
            const {
                data: { session },
            } = await supabase.auth.getSession();
            if (!session?.user) return;

            const { data } = await supabase
                .from('driver_profiles')
                .select('*')
                .eq('user_id', session.user.id)
                .maybeSingle();

            setDriverProfile(data);
        };
        loadDriver();
    }, []);

    // Notificar cuando una reserva pasa a 'confirmed'
    React.useEffect(() => {
        reservations.forEach((r) => {
            if (r.status === 'confirmed' && !seenConfirmedRef.current.has(r.id)) {
                seenConfirmedRef.current.add(r.id);
                toast.success(
                    `¡Tu reserva para las ${r.slot} fue ACEPTADA! Ve a la solinera.`,
                    { duration: 8000 }
                );
            }
        });
    }, [reservations]);

    const handleCancel = (id: string) => {
        cancelReservation.mutate(id, {
            onSuccess: () => {
                console.log('✅ Cancelación sincronizada');
            },
            onError: (err: any) => {
                console.error('Error al sincronizar:', err);
            },
        });

        toast.success('Reserva cancelada');
    };

    const pending = reservations.filter((r) => r.status === 'pending');
    const confirmed = reservations.filter((r) => r.status === 'confirmed');
    const history = reservations.filter(
        (r) => r.status === 'completed' || r.status === 'cancelled'
    );

    if (isLoading) {
        return (
            <AppShell>
                <div className="flex h-96 flex-col items-center justify-center gap-4 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p>Cargando reservas...</p>
                </div>
            </AppShell>
        );
    }

    return (
        <AppShell>
            <div className="space-y-5 sm:space-y-6">
                <PageHeader
                    title="Mis Reservas"
                    subtitle="Aquí verás el estado de tus solicitudes de carga"
                    action={
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full sm:w-auto"
                            onClick={() => refetch()}
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            <span>Actualizar</span>
                        </Button>
                    }
                />

                {/* Reservas confirmadas */}
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
                                        <div className="bg-success/20 px-4 py-3 sm:px-6 sm:py-4">
                                            <div className="flex items-center gap-3">
                                                <motion.div
                                                    animate={{ scale: [1, 1.15, 1] }}
                                                    transition={{ repeat: Infinity, duration: 2 }}
                                                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success text-white sm:h-10 sm:w-10"
                                                >
                                                    <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                                                </motion.div>
                                                <div className="min-w-0">
                                                    <h3 className="text-sm font-bold text-success-foreground sm:text-base">
                                                        ¡Reserva aceptada!
                                                    </h3>
                                                    <p className="truncate text-xs text-success-foreground/80 sm:text-sm">
                                                        Ve a la solinera a las {r.slot}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-4 sm:p-6">
                                            <div className="mb-4 space-y-3">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="flex items-center gap-2 text-xs text-muted-foreground sm:text-sm">
                                                        <MapPin className="h-4 w-4 shrink-0" /> Solinera
                                                    </span>
                                                    <span className="truncate text-right font-semibold text-sm sm:text-base">
                                                        {r.solinera?.name || 'Solinera'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="flex items-center gap-2 text-xs text-muted-foreground sm:text-sm">
                                                        <Clock className="h-4 w-4 shrink-0" /> Hora
                                                    </span>
                                                    <span className="font-semibold text-sm sm:text-base">
                                                        {r.slot}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="flex items-center gap-2 text-xs text-muted-foreground sm:text-sm">
                                                        <Zap className="h-4 w-4 shrink-0" /> Monto
                                                    </span>
                                                    <span className="font-semibold text-primary text-sm sm:text-base">
                                                        {r.amount} CUP
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="mb-4 flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 p-3 sm:p-4">
                                                <AlertTriangle className="h-5 w-5 shrink-0 text-warning" />
                                                <div className="min-w-0">
                                                    <p className="text-xs font-semibold text-warning-foreground sm:text-sm">
                                                        Importante
                                                    </p>
                                                    <p className="mt-1 text-[11px] text-muted-foreground sm:text-xs">
                                                        Si no llegas a la hora reservada, se le dará entrada
                                                        a otro vehículo.
                                                    </p>
                                                </div>
                                            </div>

                                            {expandedQR === r.id ? (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    className="rounded-xl border border-border/50 bg-white p-3 sm:p-6"
                                                >
                                                    <div className="flex flex-col items-center">
                                                        <QRCodeSVG
                                                            value={JSON.stringify({
                                                                type: 'solinet-reservation',
                                                                reservationId: r.id,
                                                                shortCode: r.short_code,
                                                                solineraId: r.solinera_id,
                                                                solineraName: r.solinera?.name,
                                                                driverId: r.driver_id,
                                                                driverName: driverProfile?.name,
                                                                plate: driverProfile?.plate,
                                                                car: driverProfile?.car,
                                                                slot: r.slot,
                                                                amount: r.amount,
                                                                method: r.payment_method,
                                                            })}
                                                            size={qrSize}
                                                            level="M"
                                                        />
                                                        <p className="mt-3 text-center text-[11px] text-muted-foreground sm:text-xs">
                                                            Muestra este QR o el código de abajo al llegar
                                                        </p>
                                                    </div>

                                                    <div className="mt-4 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 p-3 text-center sm:p-4">
                                                        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground sm:text-xs">
                                                            Código de reserva
                                                        </p>
                                                        <p className="mt-1 text-2xl font-bold tracking-[0.25em] text-primary sm:text-3xl sm:tracking-[0.3em]">
                                                            {r.short_code}
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
                                                    onClick={() => setExpandedQR(r.id)}
                                                >
                                                    <QrCode className="mr-2 h-4 w-4" /> Mostrar QR y código
                                                </Button>
                                            )}
                                        </div>
                                    </GlassCard>
                                </motion.div>
                            ))}
                        </div>
                    </FadeIn>
                )}

                {/* Reservas pendientes */}
                {pending.length > 0 && (
                    <FadeIn delay={0.1}>
                        <GlassCard className="p-4 sm:p-6">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-info/15 sm:h-10 sm:w-10">
                                    <Clock className="h-4 w-4 text-info sm:h-5 sm:w-5" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-base font-semibold sm:text-lg">
                                        Esperando aprobación
                                    </h3>
                                    <p className="truncate text-xs text-muted-foreground">
                                        El negocio revisará tu solicitud en breve
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {pending.map((r) => (
                                    <div
                                        key={r.id}
                                        className="rounded-xl border border-border/50 bg-card/30 p-3 sm:p-4"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate font-medium">
                                                    {r.solinera?.name || 'Solinera'}
                                                </p>
                                                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" /> {r.slot}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Zap className="h-3 w-3" /> {r.amount} CUP
                                                    </span>
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleCancel(r.id)}
                                                className="shrink-0"
                                                aria-label="Cancelar reserva"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="mt-2 sm:mt-0 sm:absolute sm:right-12 sm:top-1/2">
                                            {/* Badge pendiente: en móvil lo ponemos abajo */}
                                        </div>
                                        <div className="mt-2 flex justify-end">
                                            <SoliBadge variant="info">
                                                <Clock className="h-3 w-3" /> Pendiente
                                            </SoliBadge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </GlassCard>
                    </FadeIn>
                )}

                {/* Sin reservas */}
                {pending.length === 0 && confirmed.length === 0 && (
                    <FadeIn delay={0.15}>
                        <GlassCard className="p-8 text-center sm:p-12">
                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl gradient-tech text-white sm:h-16 sm:w-16">
                                <Car className="h-7 w-7 sm:h-8 sm:w-8" />
                            </div>
                            <h2 className="text-lg font-bold sm:text-xl">
                                No tienes reservas activas
                            </h2>
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

                {/* Historial */}
                {history.length > 0 && (
                    <FadeIn delay={0.2}>
                        <GlassCard className="p-4 sm:p-6">
                            <div className="mb-4 flex items-center gap-3">
                                <Calendar className="h-5 w-5 text-muted-foreground" />
                                <h3 className="text-base font-semibold sm:text-lg">Historial</h3>
                            </div>

                            <div className="space-y-2">
                                {history.map((r) => (
                                    <div
                                        key={r.id}
                                        className="flex items-center justify-between gap-2 rounded-xl border border-border/50 bg-card/20 p-3 opacity-70"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium">
                                                {r.solinera?.name || 'Solinera'}
                                            </p>
                                            <p className="truncate text-xs text-muted-foreground">
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