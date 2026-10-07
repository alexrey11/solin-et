'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Sun, Car, ArrowRight, Zap, Users, DollarSign } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GlassCard } from '@/components/soli/glass-card';
import { Button } from '@/components/ui/button';
import { getCurrentUser } from '@/lib/auth';

export default function SelectModePage() {
    const router = useRouter();
    const [checking, setChecking] = React.useState(true);

    // Si ya hay sesión, redirigir
    React.useEffect(() => {
        const check = async () => {
            const user = await getCurrentUser();
            if (user) {
                router.replace(user.role === 'driver' ? '/mapa' : '/dashboard');
                return;
            }
            setChecking(false);
        };
        check();
    }, [router]);

    if (checking) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-solar shadow-glow-orange">
                        <Sun className="h-9 w-9 text-white" />
                    </div>
                    <p className="text-sm text-muted-foreground">Cargando SoliNet...</p>
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

            <div className="relative mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-4 py-8">
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', damping: 12 }}
                    className="mb-8 flex items-center gap-3"
                >
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-solar shadow-glow-orange">
                        <Sun className="h-9 w-9 text-white" />
                    </div>
                    <span className="text-4xl font-bold tracking-tight">SoliNet</span>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-3 text-center text-3xl font-bold tracking-tight sm:text-4xl"
                >
                    ¿Cómo vas a usar SoliNet?
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-10 max-w-md text-center text-muted-foreground"
                >
                    Elige tu rol para crear una cuenta, o inicia sesión si ya tienes una.
                </motion.p>

                <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <Link href="/auth/register?role=business">
                            <GlassCard
                                hover
                                className="group h-full cursor-pointer p-8 transition-all hover:border-primary/40"
                            >
                                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl gradient-solar shadow-glow-orange">
                                    <Zap className="h-8 w-8 text-white" />
                                </div>
                                <h2 className="mb-2 text-2xl font-bold">Dueño de Solinera</h2>
                                <p className="mb-6 text-sm text-muted-foreground">
                                    Gestiona tu negocio de carga solar: cola de clientes, cobros,
                                    reportes y configuración.
                                </p>

                                <div className="mb-6 space-y-2">
                                    <FeatureItem icon={<Users className="h-4 w-4" />} text="Gestiona la cola de vehículos" />
                                    <FeatureItem icon={<DollarSign className="h-4 w-4" />} text="Cobra con Transfermóvil y EnZona" />
                                    <FeatureItem icon={<Zap className="h-4 w-4" />} text="Reportes de ingresos y energía" />
                                </div>

                                <Button className="w-full gradient-solar text-white hover:opacity-90">
                                    Crear cuenta de Negocio <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </GlassCard>
                        </Link>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <Link href="/auth/register?role=driver">
                            <GlassCard
                                hover
                                className="group h-full cursor-pointer p-8 transition-all hover:border-info/40"
                            >
                                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl gradient-tech shadow-glow-blue">
                                    <Car className="h-8 w-8 text-white" />
                                </div>
                                <h2 className="mb-2 text-2xl font-bold">Soy Conductor</h2>
                                <p className="mb-6 text-sm text-muted-foreground">
                                    Encuentra solineras cercanas, reserva tu carga y paga sin
                                    hacer cola.
                                </p>

                                <div className="mb-6 space-y-2">
                                    <FeatureItem icon={<Zap className="h-4 w-4" />} text="Mapa de solineras en tiempo real" />
                                    <FeatureItem icon={<Users className="h-4 w-4" />} text="Reserva tu turno de carga" />
                                    <FeatureItem icon={<DollarSign className="h-4 w-4" />} text="Paga desde la app" />
                                </div>

                                <Button className="w-full gradient-tech text-white hover:opacity-90">
                                    Crear cuenta de Conductor <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </GlassCard>
                        </Link>
                    </motion.div>
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="mt-8 text-center"
                >
                    <p className="text-sm text-muted-foreground">
                        ¿Ya tienes una cuenta?{' '}
                        <Link
                            href="/auth/login"
                            className="font-medium text-primary hover:underline"
                        >
                            Inicia sesión aquí
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}

function FeatureItem({
    icon,
    text,
}: {
    icon: React.ReactNode;
    text: string;
}) {
    return (
        <div className="flex items-center gap-2 text-sm">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-secondary text-muted-foreground">
                {icon}
            </div>
            <span className="text-muted-foreground">{text}</span>
        </div>
    );
}