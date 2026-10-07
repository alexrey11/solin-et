'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sun, ArrowRight, Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GlassCard } from '@/components/soli/glass-card';
import { loginUser } from '@/lib/auth';
import { toast } from 'sonner';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [saving, setSaving] = React.useState(false);

    const handleLogin = async () => {
        if (!email.trim() || !password) {
            return toast.error('Completa los campos');
        }

        setSaving(true);
        try {
            const user = await loginUser(email, password);
            toast.success(`¡Hola, ${user.name}!`);

            if (user.role === 'driver') {
                router.push('/mapa');
            } else {
                router.push('/dashboard');
            }
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || 'Error al iniciar sesión');
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
                <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-info/10 blur-3xl" />
            </div>

            <div className="relative mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 py-8">
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', damping: 12 }}
                    className="mb-6 flex items-center gap-3"
                >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-solar shadow-glow-orange">
                        <Sun className="h-7 w-7 text-white" />
                    </div>
                    <span className="text-2xl font-bold tracking-tight">SoliNet</span>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="mb-6 text-center"
                >
                    <h1 className="text-2xl font-bold tracking-tight">Iniciar sesión</h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Bienvenido de vuelta a SoliNet
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="w-full"
                >
                    <GlassCard className="p-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>
                                    <Mail className="mr-2 inline h-4 w-4" /> Correo
                                </Label>
                                <Input
                                    type="email"
                                    placeholder="tucorreo@ejemplo.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>
                                    <Lock className="mr-2 inline h-4 w-4" /> Contraseña
                                </Label>
                                <Input
                                    type="password"
                                    placeholder="Tu contraseña"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                                />
                            </div>
                        </div>

                        <Button
                            className="mt-6 w-full gradient-solar text-white hover:opacity-90"
                            onClick={handleLogin}
                            disabled={saving}
                        >
                            {saving ? 'Entrando...' : 'Entrar'}
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>

                        <div className="mt-4 text-center">
                            <p className="text-xs text-muted-foreground">
                                ¿No tienes cuenta?{' '}
                                <Link
                                    href="/select-mode"
                                    className="font-medium text-primary hover:underline"
                                >
                                    Regístrate
                                </Link>
                            </p>
                        </div>
                    </GlassCard>
                </motion.div>
            </div>
        </div>
    );
}