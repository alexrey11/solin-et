'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useSolineraActiva } from './solinera';

// ===== TIPOS =====

export interface ReservationRemote {
    id: string;
    client_uuid: string;
    driver_id: number;
    solinera_id: number;
    slot: string;
    amount: number;
    payment_method: 'transfermovil' | 'enzona';
    status: 'pending' | 'confirmed' | 'rejected' | 'completed' | 'cancelled';
    short_code: string;
    created_at: string;
    confirmed_at: string | null;
    completed_at: string | null;
    // Para mostrar info del driver
    driver_profile?: {
        id: number;
        name: string | null;
        phone: string | null;
        plate: string | null;
        car: string | null;
    };
    solinera?: {
        id: number;
        name: string;
        address: string;
    };
}

// ===== UTILS =====

function generateShortCode(): string {
    const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return code;
}

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

// ===== HOOKS CONDUCTOR =====

// Reservas del conductor actual
export function useMyReservations() {
    const supabase = createClient();

    return useQuery({
        queryKey: ['my-reservations'],
        queryFn: async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) return [];

            // Obtener el driver_profile del usuario
            const { data: driver } = await supabase
                .from('driver_profiles')
                .select('id')
                .eq('user_id', user.id)
                .maybeSingle();

            if (!driver?.id) return [];

            const { data, error } = await supabase
                .from('charge_requests')
                .select(
                    `
          *,
          solinera:solineras(id, name, address)
        `
                )
                .eq('driver_id', driver.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return (data || []) as ReservationRemote[];
        },
    });
}

// Crear reserva
export function useCreateReservation() {
    const queryClient = useQueryClient();
    const supabase = createClient();

    return useMutation({
        mutationFn: async (data: {
            solineraId: number;
            slot: string;
            amount: number;
            method: 'transfermovil' | 'enzona';
        }) => {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) throw new Error('No autenticado');

            // Obtener driver_profile
            const { data: driver } = await supabase
                .from('driver_profiles')
                .select('id')
                .eq('user_id', user.id)
                .maybeSingle();

            if (!driver?.id) throw new Error('Completa tu perfil primero');

            const clientUuid = generateClientUuid();
            const shortCode = generateShortCode();

            const { data: result, error } = await supabase
                .from('charge_requests')
                .upsert(
                    {
                        client_uuid: clientUuid,
                        driver_id: driver.id,
                        solinera_id: data.solineraId,
                        slot: data.slot,
                        amount: data.amount,
                        payment_method: data.method,
                        status: 'pending',
                        short_code: shortCode,
                    },
                    { onConflict: 'client_uuid', ignoreDuplicates: true }
                )
                .select()
                .single();

            if (error) throw error;
            return result as ReservationRemote;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-reservations'] });
        },
    });
}

// Cancelar reserva
export function useCancelReservation() {
    const queryClient = useQueryClient();
    const supabase = createClient();

    return useMutation({
        mutationFn: async (reservationId: string) => {
            const { error } = await supabase
                .from('charge_requests')
                .update({ status: 'cancelled' })
                .eq('id', reservationId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-reservations'] });
        },
    });
}

// ===== HOOKS NEGOCIO =====

// Reservas para la solinera activa (pendientes y confirmadas)
export function useSolineraReservations() {
    const supabase = createClient();
    const { data: solinera } = useSolineraActiva();

    return useQuery({
        queryKey: ['solinera-reservations', solinera?.id],
        queryFn: async () => {
            if (!solinera?.id) return [];

            const { data, error } = await supabase
                .from('charge_requests')
                .select(
                    `
          *,
          driver_profile:driver_profiles(id, name, phone, plate, car)
        `
                )
                .eq('solinera_id', solinera.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return (data || []) as ReservationRemote[];
        },
        enabled: !!solinera?.id,
        refetchInterval: 5000, // refrescar cada 5s
    });
}

// Aceptar reserva
export function useAcceptReservation() {
    const queryClient = useQueryClient();
    const supabase = createClient();

    return useMutation({
        mutationFn: async (reservationId: string) => {
            const { error } = await supabase
                .from('charge_requests')
                .update({
                    status: 'confirmed',
                    confirmed_at: new Date().toISOString(),
                })
                .eq('id', reservationId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['solinera-reservations'] });
        },
    });
}

// Rechazar reserva
export function useRejectReservation() {
    const queryClient = useQueryClient();
    const supabase = createClient();

    return useMutation({
        mutationFn: async (reservationId: string) => {
            const { error } = await supabase
                .from('charge_requests')
                .update({ status: 'cancelled' })
                .eq('id', reservationId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['solinera-reservations'] });
        },
    });
}

// Marcar como completada (cuando se escanea)
export function useCompleteReservation() {
    const queryClient = useQueryClient();
    const supabase = createClient();

    return useMutation({
        mutationFn: async (reservationId: string) => {
            const { error } = await supabase
                .from('charge_requests')
                .update({
                    status: 'completed',
                    completed_at: new Date().toISOString(),
                })
                .eq('id', reservationId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['solinera-reservations'] });
        },
    });
}

// Buscar reserva por código corto (para el negocio)
export function useReservationByShortCode() {
    const supabase = createClient();

    return async (shortCode: string): Promise<ReservationRemote | null> => {
        const { data, error } = await supabase
            .from('charge_requests')
            .select(
                `
        *,
        driver_profile:driver_profiles(id, name, phone, plate, car),
        solinera:solineras(id, name, address)
      `
            )
            .eq('short_code', shortCode.toUpperCase())
            .eq('status', 'confirmed')
            .maybeSingle();

        if (error) throw error;
        return data as ReservationRemote | null;
    };
}