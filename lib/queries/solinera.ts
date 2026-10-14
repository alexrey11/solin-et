'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

// ===== TIPOS =====

export interface SolineraRemote {
    id: number;
    user_id: string;
    client_uuid: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
    price_per_kwh: number;
    points: number;
    points_config: any;
    opening_hours: string | null;
    closing_hours: string | null;
    phone: string | null;
    updated_at: string;
}

export interface UpdateSolineraData {
    name: string;
    address: string;
    lat: number;
    lng: number;
    pricePerKwh: number;
    points: number;
    pointsConfig: any;
    openingHours: string;
    closingHours: string;
    phone?: string;
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

// Solinera activa del usuario logueado
export function useSolineraActiva() {
    const supabase = createClient();

    return useQuery({
        queryKey: ['solinera-activa'],
        queryFn: async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) return null;

            const { data, error } = await supabase
                .from('solineras')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();

            if (error) throw error;
            return data as SolineraRemote | null;
        },
    });
}

// Todas las solineras (para el mapa del conductor)
export function useAllSolineras() {
    const supabase = createClient();

    return useQuery({
        queryKey: ['solineras-all'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('solineras')
                .select('*')
                .order('updated_at', { ascending: false });

            if (error) throw error;
            return (data || []) as SolineraRemote[];
        },
    });
}

// Guardar/actualizar solinera
export function useSaveSolinera() {
    const queryClient = useQueryClient();
    const supabase = createClient();

    return useMutation({
        mutationFn: async (data: UpdateSolineraData) => {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) throw new Error('No autenticado');

            // Ver si existe
            const { data: existing } = await supabase
                .from('solineras')
                .select('id, client_uuid')
                .eq('user_id', user.id)
                .maybeSingle();

            const clientUuid = existing?.client_uuid || generateClientUuid();

            const payload = {
                client_uuid: clientUuid,
                user_id: user.id,
                name: data.name,
                address: data.address,
                lat: data.lat,
                lng: data.lng,
                price_per_kwh: data.pricePerKwh,
                points: data.points,
                points_config: data.pointsConfig,
                opening_hours: data.openingHours,
                closing_hours: data.closingHours,
                phone: data.phone || null,
                updated_at: new Date().toISOString(),
            };

            let result;
            if (existing && existing.id) {
                result = await supabase
                    .from('solineras')
                    .update(payload)
                    .eq('id', existing.id)
                    .select()
                    .single();
            } else {
                result = await supabase
                    .from('solineras')
                    .insert(payload)
                    .select()
                    .single();
            }

            if (result.error) throw result.error;
            return result.data as SolineraRemote;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['solinera-activa'] });
            queryClient.invalidateQueries({ queryKey: ['solineras-all'] });
        },
    });
}