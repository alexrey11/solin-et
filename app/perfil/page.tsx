'use client';

import * as React from 'react';
import { User, Phone, Car, Save } from 'lucide-react';
import { AppShell } from '@/components/soli/app-shell';
import { GlassCard } from '@/components/soli/glass-card';
import { PageHeader, FadeIn } from '@/components/soli/charts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getCurrentUser } from '@/lib/auth';
import { getDriverProfile, saveDriverProfile } from '@/lib/profile';
import { User as UserType, Driver } from '@/lib/db';
import { toast } from 'sonner';

export default function PerfilPage() {
    const [user, setUser] = React.useState<UserType | null>(null);
    const [profile, setProfile] = React.useState<Driver | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);

    React.useEffect(() => {
        const load = async () => {
            const u = await getCurrentUser();
            if (!u) {
                setLoading(false);
                return;
            }
            setUser(u);
            const p = await getDriverProfile(u.id!);
            if (p) {
                setProfile(p);
            } else {
                // Crear perfil vacío si no existe
                const newId = await saveDriverProfile(u.id!, {
                    name: u.name,
                    phone: u.phone || '',
                    plate: '',
                    car: 'Triciclo Eléctrico',
                });
                const created = await getDriverProfile(u.id!);
                setProfile(created);
            }
            setLoading(false);
        };
        load();
    }, []);

    const handleSave = async () => {
        if (!user || !profile) return;
        setSaving(true);
        try {
            await saveDriverProfile(user.id!, {
                name: profile.name,
                phone: profile.phone,
                plate: profile.plate,
                car: profile.car,
            });
            toast.success('Perfil actualizado');
        } catch (err) {
            toast.error('Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <AppShell>
                <div className="flex h-96 items-center justify-center text-muted-foreground">
                    Cargando perfil...
                </div>
            </AppShell>
        );
    }

    if (!user || !profile) {
        return (
            <AppShell>
                <div className="flex h-96 items-center justify-center text-muted-foreground">
                    No se pudo cargar el perfil
                </div>
            </AppShell>
        );
    }

    return (
        <AppShell>
            <div className="space-y-6">
                <PageHeader
                    title="Mi Perfil"
                    subtitle="Tus datos como conductor"
                    action={
                        <Button
                            className="gradient-tech text-white hover:opacity-90"
                            size="sm"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            <Save className="mr-2 h-4 w-4" />
                            {saving ? 'Guardando...' : 'Guardar'}
                        </Button>
                    }
                />

                <FadeIn delay={0.1}>
                    <GlassCard className="p-6">
                        <div className="mb-6 flex items-center gap-4">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-tech shadow-glow-blue">
                                <User className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold">
                                    {profile.name || user.name}
                                </h3>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>
                                    <User className="mr-2 inline h-4 w-4" /> Nombre
                                </Label>
                                <Input
                                    value={profile.name}
                                    onChange={(e) =>
                                        setProfile({ ...profile, name: e.target.value })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>
                                    <Phone className="mr-2 inline h-4 w-4" /> Teléfono
                                </Label>
                                <Input
                                    value={profile.phone}
                                    onChange={(e) =>
                                        setProfile({ ...profile, phone: e.target.value })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>
                                    <Car className="mr-2 inline h-4 w-4" /> Matrícula
                                </Label>
                                <Input
                                    value={profile.plate}
                                    onChange={(e) =>
                                        setProfile({
                                            ...profile,
                                            plate: e.target.value.toUpperCase(),
                                        })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Tipo de vehículo</Label>
                                <select
                                    value={profile.car}
                                    onChange={(e) =>
                                        setProfile({ ...profile, car: e.target.value })
                                    }
                                    className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                                >
                                    <option>Triciclo Eléctrico</option>
                                    <option>Motorina</option>
                                    <option>Auto Eléctrico</option>
                                    <option>Scooter Eléctrico</option>
                                    <option>Otro</option>
                                </select>
                            </div>
                        </div>
                    </GlassCard>
                </FadeIn>
            </div>
        </AppShell>
    );
}