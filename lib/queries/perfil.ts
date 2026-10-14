'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

// ===== TIPOS =====

export interface DriverProfile {
    id: number;
    user_id: string;
    client_uuid: string;
    plate: string | null;
    car: string | null;
    name: string | null;
    phone: string | null;
    updated_at: string;
}

export interface UserProfile {
    id: string;
    role: 'driver' | 'business';
    name: string | null;
    email: string | null;
    phone: string | null;
}

export interface UpdateDriverData {
    name: string;
    phone: string;
    plate: string;
    car: string;
}

// ===== UTILS =====

function generateClientUuid(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

// ===== HOOKS =====

export function useDriverProfile() {
    const supabase = createClient();

    return useQuery({
        queryKey: ['driver-profile'],
        queryFn: async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) return null;

            const { data, error } = await supabase
                .from('driver_profiles')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();

            if (error) throw error;
            return data as DriverProfile | null;
        },
    });
}

export function useUpdateDriverProfile() {
    const queryClient = useQueryClient();
    const supabase = createClient();

    return useMutation({
        mutationFn: async (updates: UpdateDriverData) => {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) throw new Error('No autenticado');

            // 1. Actualizar profiles (name, phone)
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert(
                    {
                        id: user.id,
                        role: user.user_metadata?.role || 'driver',
                        name: updates.name,
                        email: user.email,
                        phone: updates.phone || null,
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: 'id' }
                );

            if (profileError) {
                console.error('Error en profiles:', profileError);
                throw new Error('Error al guardar perfil: ' + profileError.message);
            }

            // 2. Ver si existe driver_profile
            const { data: existing } = await supabase
                .from('driver_profiles')
                .select('id, client_uuid')
                .eq('user_id', user.id)
                .maybeSingle();

            // 3. Actualizar o insertar driver_profiles
            const clientUuid = existing?.client_uuid || generateClientUuid();
            const payload = {
                client_uuid: clientUuid,
                user_id: user.id,
                name: updates.name,
                phone: updates.phone || null,
                plate: updates.plate || '',
                car: updates.car,
                updated_at: new Date().toISOString(),
            };

            let result;
            if (existing && existing.id) {
                result = await supabase
                    .from('driver_profiles')
                    .update(payload)
                    .eq('id', existing.id)
                    .select()
                    .single();
            } else {
                result = await supabase
                    .from('driver_profiles')
                    .insert(payload)
                    .select()
                    .single();
            }

            if (result.error) {
                console.error('Error en driver_profiles:', result.error);
                throw new Error(result.error.message);
            }

            return result.data as DriverProfile;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['driver-profile'] });
        },
    });
}