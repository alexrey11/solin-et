'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    Camera,
    Check,
    X,
    AlertCircle,
    Clock,
    Zap,
    DollarSign,
    Keyboard,
    RefreshCw,
} from 'lucide-react';
import { AppShell } from '@/components/soli/app-shell';
import { GlassCard, SoliBadge } from '@/components/soli/glass-card';
import { PageHeader, FadeIn } from '@/components/soli/charts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { db, Reservation } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { toast } from 'sonner';

interface ReservationData {
    type: string;
    solineraId: number;
    solineraName: string;
    driverId: number;
    driverName: string;
    plate: string;
    car: string;
    slot: string;
    amount: number;
    method: 'transfermovil' | 'enzona';
    ts: number;
}

export default function EscanearPage() {
    const router = useRouter();

    const [scannerReady, setScannerReady] = React.useState(false);
    const [scannerActive, setScannerActive] = React.useState(false);
    const [scanned, setScanned] = React.useState<ReservationData | null>(null);
    const [matchedReservation, setMatchedReservation] =
        React.useState<Reservation | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const [processing, setProcessing] = React.useState(false);
    const [manualMode, setManualMode] = React.useState(false);
    const [shortCode, setShortCode] = React.useState('');
    const [checkingAccess, setCheckingAccess] = React.useState(true);
    const [resetKey, setResetKey] = React.useState(0);

    const scannerRef = React.useRef<any>(null);
    const scannerId = `qr-scanner-region-${resetKey}`;

    // ===== VERIFICAR ROL =====
    React.useEffect(() => {
        const checkRole = async () => {
            const user = await getCurrentUser();
            if (!user) {
                router.replace('/select-mode');
                return;
            }
            if (user.role === 'driver') {
                toast.error('Solo los negocios pueden dar entrada');
                router.replace('/mapa');
                return;
            }
            setCheckingAccess(false);
        };
        checkRole();
    }, [router]);

    // ===== INICIAR SCANNER =====
    React.useEffect(() => {
        if (checkingAccess) return;
        if (manualMode) return;
        if (scanned || matchedReservation) return;
        if (error) return;

        let mounted = true;
        let scanner: any = null;

        const initScanner = async () => {
            try {
                const { Html5Qrcode } = await import('html5-qrcode');

                scanner = new Html5Qrcode(scannerId);
                scannerRef.current = scanner;

                await scanner.start(
                    { facingMode: 'environment' },
                    { fps: 10, qrbox: { width: 250, height: 250 } },
                    (decodedText: string) => {
                        if (!mounted) return;
                        handleScanQR(decodedText);
                        try {
                            scanner.stop().catch(() => { });
                        } catch (e) { }
                        setScannerActive(false);
                    },
                    () => { }
                );

                if (mounted) {
                    setScannerReady(true);
                    setScannerActive(true);
                }
            } catch (err: any) {
                console.error('Error iniciando cámara:', err);
                if (mounted) {
                    // Si falla la cámara, pasar directo a modo manual
                    setError(
                        'No se pudo acceder a la cámara. Usa el código de reserva.'
                    );
                    setScannerReady(true);
                    setScannerActive(false);
                    // Auto-switch a modo manual después de 1s
                    setTimeout(() => {
                        if (mounted) {
                            setManualMode(true);
                            setError(null);
                        }
                    }, 1200);
                }
            }
        };

        initScanner();

        return () => {
            mounted = false;
            if (scannerRef.current && scannerActive) {
                try {
                    scannerRef.current.stop().catch(() => { });
                } catch (e) { }
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [checkingAccess, manualMode, scanned, matchedReservation, resetKey, error]);

    // ===== PROCESAR QR =====
    const handleScanQR = async (text: string) => {
        try {
            const data: ReservationData = JSON.parse(text);
            if (data.type !== 'solinet-reservation') {
                setError('El código QR no es una reserva de SoliNet');
                return;
            }

            const confirmed = await db.reservations
                .filter(
                    (r) =>
                        r.status === 'confirmed' &&
                        r.slot === data.slot &&
                        r.solineraName === data.solineraName
                )
                .first();

            if (!confirmed) {
                setError('Esta reserva no está confirmada o ya fue procesada.');
                return;
            }

            setScanned(data);
            setMatchedReservation(confirmed);
            setError(null);
        } catch (err) {
            setError('El código QR no es válido');
        }
    };

    // ===== PROCESAR CÓDIGO CORTO =====
    const handleManualSubmit = async () => {
        const code = shortCode.trim().toUpperCase();
        if (!code) {
            toast.error('Escribe el código de reserva');
            return;
        }

        try {
            const reservation = await db.reservations
                .where('shortCode')
                .equals(code)
                .first();

            if (!reservation) {
                setError('Código no encontrado. Verifica que esté bien escrito.');
                return;
            }

            if (reservation.status !== 'confirmed') {
                setError(
                    'Esta reserva no está confirmada. Acéptala primero desde la cola.'
                );
                return;
            }

            const driver = await db.drivers.get(reservation.driverId);

            setScanned({
                type: 'solinet-reservation',
                solineraId: reservation.solineraId,
                solineraName: reservation.solineraName,
                driverId: reservation.driverId,
                driverName: driver?.name || 'Conductor',
                plate: driver?.plate || 'N/A',
                car: driver?.car || 'Vehículo Eléctrico',
                slot: reservation.slot,
                amount: reservation.amount,
                method: reservation.method,
                ts: reservation.createdAt,
            });
            setMatchedReservation(reservation);
            setError(null);
        } catch (err) {
            console.error(err);
            setError('Error buscando la reserva');
        }
    };

    // ===== CONFIRMAR ENTRADA =====
    const handleConfirm = async () => {
        if (!scanned || !matchedReservation) return;
        setProcessing(true);

        try {
            if (matchedReservation.id) {
                await db.reservations.update(matchedReservation.id, {
                    status: 'completed',
                    syncStatus: 'pending',
                });
            }

            await db.queue.add({
                name: scanned.driverName || 'Conductor',
                car: scanned.car || 'Vehículo Eléctrico',
                plate: scanned.plate || 'N/A',
                waitTime: 0,
                chargeTime: 0,
                status: 'waiting',
                amount: scanned.amount,
                point: undefined,
                createdAt: Date.now(),
            });

            toast.success(`${scanned.driverName} añadido a la cola`);
            router.push('/cola');
        } catch (err) {
            console.error(err);
            toast.error('Error al procesar la reserva');
            setProcessing(false);
        }
    };

    // ===== RESET LIMPIO (SIN RECARGAR) =====
    const handleReset = () => {
        // Detener scanner si está activo
        if (scannerRef.current && scannerActive) {
            try {
                scannerRef.current.stop().catch(() => { });
            } catch (e) { }
        }
        setScanned(null);
        setMatchedReservation(null);
        setError(null);
        setShortCode('');
        setScannerReady(false);
        setScannerActive(false);
        setManualMode(false);
        // Forzar reinicialización del scanner
        setResetKey((k) => k + 1);
    };

    if (checkingAccess) {
        return (
            <AppShell>
                <div className="flex h-96 items-center justify-center text-muted-foreground">
                    Verificando acceso...
                </div>
            </AppShell>
        );
    }

    return (
        <AppShell>
            <div className="space-y-6">
                <PageHeader
                    title="Dar entrada"
                    subtitle="Escanea el QR o escribe el código del conductor"
                    action={
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setManualMode(!manualMode);
                                    setError(null);
                                    setShortCode('');
                                }}
                            >
                                {manualMode ? (
                                    <>
                                        <Camera className="mr-2 h-4 w-4" /> Usar cámara
                                    </>
                                ) : (
                                    <>
                                        <Keyboard className="mr-2 h-4 w-4" /> Usar código
                                    </>
                                )}
                            </Button>
                            {(scanned || error) && (
                                <Button variant="ghost" size="sm" onClick={handleReset}>
                                    <RefreshCw className="mr-2 h-4 w-4" /> Reiniciar
                                </Button>
                            )}
                        </div>
                    }
                />

                <FadeIn delay={0.1}>
                    <GlassCard className="p-6">
                        {/* ===== MODO CÓDIGO CORTO ===== */}
                        {manualMode && !scanned && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Keyboard className="h-5 w-5 text-primary" />
                                    <h3 className="text-lg font-semibold">
                                        Escribe el código del conductor
                                    </h3>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    El conductor verá un código de 6 caracteres debajo de su QR.
                                    Pídeselo y escríbelo aquí.
                                </p>
                                <div className="space-y-2">
                                    <Label>Código de reserva</Label>
                                    <Input
                                        placeholder="Ej: A3F9K2"
                                        value={shortCode}
                                        onChange={(e) =>
                                            setShortCode(e.target.value.toUpperCase())
                                        }
                                        onKeyDown={(e) =>
                                            e.key === 'Enter' && handleManualSubmit()
                                        }
                                        className="text-center font-mono text-2xl uppercase tracking-[0.3em]"
                                        maxLength={6}
                                        autoFocus
                                    />
                                </div>
                                <Button
                                    className="w-full gradient-solar text-white hover:opacity-90"
                                    onClick={handleManualSubmit}
                                    disabled={shortCode.trim().length < 6}
                                >
                                    <Check className="mr-2 h-4 w-4" /> Buscar reserva
                                </Button>
                            </div>
                        )}

                        {/* ===== MODO CÁMARA ===== */}
                        {!manualMode && !scanned && !error && (
                            <>
                                <div className="mb-4 flex items-center gap-3">
                                    <Camera className="h-5 w-5 text-primary" />
                                    <h3 className="text-lg font-semibold">
                                        Apunta la cámara al QR del conductor
                                    </h3>
                                </div>
                                <div
                                    id={scannerId}
                                    className="mx-auto aspect-square w-full max-w-md overflow-hidden rounded-2xl border-2 border-dashed border-border/50 bg-card/30"
                                />
                                {!scannerReady && (
                                    <p className="mt-4 text-center text-sm text-muted-foreground">
                                        Iniciando cámara...
                                    </p>
                                )}
                            </>
                        )}

                        {/* ===== ERROR ===== */}
                        {error && !scanned && (
                            <div className="flex flex-col items-center py-8 text-center">
                                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/15">
                                    <AlertCircle className="h-8 w-8 text-destructive" />
                                </div>
                                <h3 className="text-lg font-bold">Error</h3>
                                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                                    {error}
                                </p>
                                <div className="mt-6 flex flex-wrap justify-center gap-2">
                                    <Button variant="outline" onClick={() => router.push('/cola')}>
                                        Volver a la cola
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setError(null);
                                            setManualMode(true);
                                        }}
                                    >
                                        <Keyboard className="mr-2 h-4 w-4" /> Modo código
                                    </Button>
                                    <Button
                                        className="gradient-solar text-white"
                                        onClick={handleReset}
                                    >
                                        <RefreshCw className="mr-2 h-4 w-4" /> Reintentar
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* ===== DATOS CONFIRMADOS ===== */}
                        {scanned && matchedReservation && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="space-y-4"
                            >
                                <div className="flex flex-col items-center">
                                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
                                        <Check className="h-8 w-8 text-success" />
                                    </div>
                                    <h3 className="text-lg font-bold">Reserva encontrada</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Confirma los datos del conductor
                                    </p>
                                </div>

                                <div className="space-y-3 rounded-xl border border-border/50 bg-card/30 p-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">
                                            Código
                                        </span>
                                        <span className="font-mono font-bold tracking-widest text-primary">
                                            {matchedReservation.shortCode}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">
                                            Conductor
                                        </span>
                                        <span className="font-medium">{scanned.driverName}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">
                                            Matrícula
                                        </span>
                                        <span className="font-mono font-medium">
                                            {scanned.plate}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">
                                            Vehículo
                                        </span>
                                        <span className="font-medium">{scanned.car}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">
                                            Horario
                                        </span>
                                        <span className="flex items-center gap-1 font-medium">
                                            <Clock className="h-3 w-3" /> {scanned.slot}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between border-t border-border/50 pt-3">
                                        <span className="font-medium">Total a cobrar</span>
                                        <span className="text-lg font-bold text-primary">
                                            {scanned.amount} CUP
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={handleReset}
                                    >
                                        <X className="mr-2 h-4 w-4" /> Cancelar
                                    </Button>
                                    <Button
                                        className="flex-1 gradient-solar text-white hover:opacity-90"
                                        onClick={handleConfirm}
                                        disabled={processing}
                                    >
                                        <Check className="mr-2 h-4 w-4" />
                                        {processing ? 'Añadiendo...' : 'Dar entrada a la cola'}
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </GlassCard>
                </FadeIn>
            </div>
        </AppShell>
    );
}