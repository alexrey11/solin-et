'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Sun,
    Car,
    Zap,
    ArrowRight,
    Mail,
    Lock,
    User,
    Phone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GlassCard } from '@/components/soli/glass-card';
import { registerUser } from '@/lib/auth';
import { saveDriverProfile, saveBusinessProfile } from '@/lib/profile';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function RegisterPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialRole = (searchParams.get('role') as 'driver' | 'business') || 'driver';

    const [role, setRole] = React.useState<'driver' | 'business'>(initialRole);
    const [name, setName] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [phone, setPhone] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [password2, setPassword2] = React.useState('');
    const [saving, setSaving] = React.useState(false);

    const handleRegister = async () => {
        // Validaciones
        if (!name.trim()) return toast.error('Escribe tu nombre');
        if (!email.trim() || !email.includes('@'))
            return toast.error('Correo inválido');
        if (password.length < 4) return toast.error('Contraseña muy corta (mín. 4)');
        if (password !== password2) return toast.error('Las contraseñas no coinciden');

        setSaving(true);
        try {
            const user = await registerUser({
                role,
                name,
                email,
                phone,
                password,
            });

            // Crear perfil asociado
            if (role === 'driver') {
                await saveDriverProfile(user.id!, {
                    name,
                    phone,
                    plate: '',
                    car: 'Triciclo Eléctrico',
                });
                router.push('/mapa');
            } else {
                await saveBusinessProfile(user.id!, {
                    name: `${name}`,
                    owner: name,
                    email,
                    address: '',
                });
                router.push('/onboarding');
            }

            toast.success('¡Cuenta creada!');
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || 'Error al registrar');
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
                    className="mb-6 w-full text-center"
                >
                    <h1 className="text-2xl font-bold tracking-tight">Crear cuenta</h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Elige tu rol y completa tus datos
                    </p>
                </motion.div>

                {/* Selector de rol */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-4 grid w-full grid-cols-2 gap-3"
                >
                    <RoleButton
                        active={role === 'driver'}
                        icon={<Car className="h-5 w-5" />}
                        label="Conductor"
                        sub="Buscar y reservar"
                        onClick={() => setRole('driver')}
                        color="info"
                    />
                    <RoleButton
                        active={role === 'business'}
                        icon={<Zap className="h-5 w-5" />}
                        label="Negocio"
                        sub="Dueño de solinera"
                        onClick={() => setRole('business')}
                        color="primary"
                    />
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
                                    <User className="mr-2 inline h-4 w-4" /> Nombre completo
                                </Label>
                                <Input
                                    placeholder="Ej: Pedro Hernández"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>
                                    <Mail className="mr-2 inline h-4 w-4" /> Correo
                                </Label>
                                <Input
                                    type="email"
                                    placeholder="tucorreo@ejemplo.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>
                                    <Phone className="mr-2 inline h-4 w-4" /> Teléfono
                                    <span className="ml-1 text-xs text-muted-foreground">
                                        (opcional)
                                    </span>
                                </Label>
                                <Input
                                    placeholder="+53 5 123 4567"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>
                                    <Lock className="mr-2 inline h-4 w-4" /> Contraseña
                                </Label>
                                <Input
                                    type="password"
                                    placeholder="Mínimo 4 caracteres"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>
                                    <Lock className="mr-2 inline h-4 w-4" /> Confirmar contraseña
                                </Label>
                                <Input
                                    type="password"
                                    placeholder="Repite la contraseña"
                                    value={password2}
                                    onChange={(e) => setPassword2(e.target.value)}
                                />
                            </div>
                        </div>

                        <Button
                            className={cn(
                                'mt-6 w-full text-white hover:opacity-90',
                                role === 'driver' ? 'gradient-tech' : 'gradient-solar'
                            )}
                            onClick={handleRegister}
                            disabled={saving}
                        >
                            {saving ? 'Creando cuenta...' : 'Crear cuenta'}
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>

                        <div className="mt-4 text-center">
                            <p className="text-xs text-muted-foreground">
                                ¿Ya tienes cuenta?{' '}
                                <Link
                                    href="/auth/login"
                                    className="font-medium text-primary hover:underline"
                                >
                                    Inicia sesión
                                </Link>
                            </p>
                        </div>
                    </GlassCard>
                </motion.div>
            </div>
        </div>
    );
}

function RoleButton({
    active,
    icon,
    label,
    sub,
    onClick,
    color,
}: {
    active: boolean;
    icon: React.ReactNode;
    label: string;
    sub: string;
    onClick: () => void;
    color: 'primary' | 'info';
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                'flex flex-col items-center gap-2 rounded-2xl border p-4 transition-all',
                active
                    ? color === 'primary'
                        ? 'border-primary bg-primary/10'
                        : 'border-info bg-info/10'
                    : 'border-border/50 bg-card/30 hover:border-border'
            )}
        >
            <div
                className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-xl text-white',
                    color === 'primary' ? 'gradient-solar' : 'gradient-tech'
                )}
            >
                {icon}
            </div>
            <span className="text-sm font-semibold">{label}</span>
            <span className="text-xs text-muted-foreground">{sub}</span>
        </button>
    );
}