'use client';

import * as React from 'react';
import { User, Phone, Car, Save, IdCard, Loader2 } from 'lucide-react';
import { AppShell } from '@/components/soli/app-shell';
import { GlassCard } from '@/components/soli/glass-card';
import { PageHeader, FadeIn } from '@/components/soli/charts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDriverProfile, useUpdateDriverProfile } from '@/lib/queries/perfil';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type IdType = 'matricula' | 'carnet';

export default function PerfilPage() {
    // ✅ TanStack Query hooks
    const { data: profile, isLoading, error } = useDriverProfile();
    const updateProfile = useUpdateDriverProfile();

    // Estado local del formulario
    const [form, setForm] = React.useState({
        name: '',
        phone: '',
        plate: '',
        car: 'Triciclo Eléctrico',
    });
    const [idType, setIdType] = React.useState<IdType>('matricula');
    const [hydrated, setHydrated] = React.useState(false);

    // Hidratar form cuando llega el profile
    React.useEffect(() => {
        if (profile && !hydrated) {
            setForm({
                name: profile.name || '',
                phone: profile.phone || '',
                plate: profile.plate || '',
                car: profile.car || 'Triciclo Eléctrico',
            });
            if (profile.plate && profile.plate.toUpperCase().startsWith('CI-')) {
                setIdType('carnet');
            }
            setHydrated(true);
        }
    }, [profile, hydrated]);

    // Valor visible en el input (sin el prefijo CI-)
    const displayPlate =
        idType === 'carnet' && form.plate.startsWith('CI-')
            ? form.plate.replace(/^CI-/, '')
            : form.plate;

    const handleSave = async () => {
        // Validaciones
        if (!form.name.trim()) {
            toast.error('Escribe tu nombre');
            return;
        }
        if (!form.plate.trim()) {
            toast.error(
                idType === 'carnet'
                    ? 'Escribe tu número de carnet'
                    : 'Escribe tu matrícula'
            );
            return;
        }

        // Normalizar el valor según el tipo
        let finalPlate = form.plate.trim().toUpperCase();
        if (idType === 'carnet' && !finalPlate.startsWith('CI-')) {
            finalPlate = `CI-${finalPlate}`;
        } else if (idType === 'matricula' && finalPlate.startsWith('CI-')) {
            finalPlate = finalPlate.replace(/^CI-/, '');
        }

        try {
            await updateProfile.mutateAsync({
                name: form.name.trim(),
                phone: form.phone.trim(),
                plate: finalPlate,
                car: form.car,
            });

            // Actualizar el form con el valor normalizado
            setForm({ ...form, plate: finalPlate });

            toast.success('Perfil actualizado');
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || 'Error al guardar');
        }
    };

    // ===== ESTADOS DE CARGA Y ERROR =====

    if (isLoading) {
        return (
            <AppShell>
                <div className="flex h-96 flex-col items-center justify-center gap-4 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p>Cargando perfil...</p>
                </div>
            </AppShell>
        );
    }

    if (error) {
        return (
            <AppShell>
                <div className="flex h-96 items-center justify-center text-destructive">
                    Error al cargar perfil: {(error as Error).message}
                </div>
            </AppShell>
        );
    }

    if (!profile) {
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
                            disabled={updateProfile.isPending}
                        >
                            {updateProfile.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Guardar
                                </>
                            )}
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
                                    {form.name || 'Conductor'}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {profile.plate || 'Sin identificación'}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>
                                    <User className="mr-2 inline h-4 w-4" /> Nombre
                                </Label>
                                <Input
                                    value={form.name}
                                    onChange={(e) =>
                                        setForm({ ...form, name: e.target.value })
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>
                                    <Phone className="mr-2 inline h-4 w-4" /> Teléfono
                                </Label>
                                <Input
                                    value={form.phone}
                                    onChange={(e) =>
                                        setForm({ ...form, phone: e.target.value })
                                    }
                                />
                            </div>

                            <div className="space-y-2 sm:col-span-2">
                                <Label>Identificación del vehículo</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIdType('matricula')}
                                        className={cn(
                                            'flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium transition-all',
                                            idType === 'matricula'
                                                ? 'border-primary bg-primary/10 text-primary'
                                                : 'border-border/50 hover:border-primary/30'
                                        )}
                                    >
                                        <Car className="h-4 w-4" /> Tiene matrícula
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIdType('carnet')}
                                        className={cn(
                                            'flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium transition-all',
                                            idType === 'carnet'
                                                ? 'border-primary bg-primary/10 text-primary'
                                                : 'border-border/50 hover:border-primary/30'
                                        )}
                                    >
                                        <IdCard className="h-4 w-4" /> Sin matrícula (carnet)
                                    </button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {idType === 'matricula'
                                        ? 'Usa la matrícula oficial del vehículo'
                                        : 'Si tu triciclo no tiene matrícula, usa tu número de carnet'}
                                </p>
                            </div>

                            <div className="space-y-2 sm:col-span-2">
                                <Label>
                                    {idType === 'matricula' ? (
                                        <>
                                            <Car className="mr-2 inline h-4 w-4" /> Matrícula
                                        </>
                                    ) : (
                                        <>
                                            <IdCard className="mr-2 inline h-4 w-4" /> Número de carnet
                                        </>
                                    )}
                                </Label>
                                <Input
                                    value={displayPlate}
                                    onChange={(e) =>
                                        setForm({ ...form, plate: e.target.value })
                                    }
                                    placeholder={
                                        idType === 'matricula' ? 'T-123456' : '89051234567'
                                    }
                                />
                            </div>

                            <div className="space-y-2 sm:col-span-2">
                                <Label>Tipo de vehículo</Label>
                                <select
                                    value={form.car}
                                    onChange={(e) =>
                                        setForm({ ...form, car: e.target.value })
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