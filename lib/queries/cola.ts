'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useSolineraActiva } from './solinera';

// ===== TIPOS =====

export interface QueueItemRemote {
    id: string;
    client_uuid: string;
    solinera_id: number;
    name: string;
    plate: string;
    car: string;
    status: 'waiting' | 'charging' | 'done';
    amount: number | null;
    point_id: string | null;
    duration_min: number | null;
    charge_started_at: string | null;
    charge_finished_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface CreateQueueItemData {
    name: string;
    plate: string;
    car: string;
    amount?: number;
}

export interface StartChargeData {
    queueItemId: string;
    pointId: string;
    durationMin: number;
    amount: number;
}

export interface CompleteChargeData {
    queueItemId: string;
    amount: number;
    method: 'transfermovil' | 'enzona' | 'efectivo';
    driverName: string;
    plate: string;
    durationMin: number;
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

// Leer la cola activa de la solinera
export function useQueue() {
    const supabase = createClient();
    const { data: solinera } = useSolineraActiva();

    return useQuery({
        queryKey: ['queue', solinera?.id],
        queryFn: async () => {
            if (!solinera?.id) return [];

            const { data, error } = await supabase
                .from('queue_items')
                .select('*')
                .eq('solinera_id', solinera.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return (data || []) as QueueItemRemote[];
        },
        enabled: !!solinera?.id,
    });
}

// Añadir vehículo a la cola
export function useAddToQueue() {
    const queryClient = useQueryClient();
    const supabase = createClient();
    const { data: solinera } = useSolineraActiva();

    return useMutation({
        mutationFn: async (data: CreateQueueItemData) => {
            if (!solinera?.id) throw new Error('No hay solinera activa');

            const clientUuid = generateClientUuid();

            const { data: result, error } = await supabase
                .from('queue_items')
                .upsert(
                    {
                        client_uuid: clientUuid,
                        solinera_id: solinera.id,
                        name: data.name,
                        plate: data.plate,
                        car: data.car,
                        amount: data.amount || 0,
                        status: 'waiting',
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: 'client_uuid', ignoreDuplicates: true }
                )
                .select()
                .single();

            if (error) throw error;
            return result as QueueItemRemote;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['queue'] });
        },
    });
}

// Iniciar carga
export function useStartCharge() {
    const queryClient = useQueryClient();
    const supabase = createClient();

    return useMutation({
        mutationFn: async (data: StartChargeData) => {
            const { data: result, error } = await supabase
                .from('queue_items')
                .update({
                    status: 'charging',
                    point_id: data.pointId,
                    duration_min: data.durationMin,
                    amount: data.amount,
                    charge_started_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .eq('id', data.queueItemId)
                .select()
                .single();

            if (error) throw error;
            return result as QueueItemRemote;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['queue'] });
        },
    });
}

// Completar carga y cobrar
export function useCompleteCharge() {
    const queryClient = useQueryClient();
    const supabase = createClient();
    const { data: solinera } = useSolineraActiva();

    return useMutation({
        mutationFn: async (data: CompleteChargeData) => {
            if (!solinera?.id) throw new Error('No hay solinera activa');

            // 1. Actualizar queue_item a 'done'
            const { error: queueError } = await supabase
                .from('queue_items')
                .update({
                    status: 'done',
                    amount: data.amount,
                    charge_finished_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .eq('id', data.queueItemId);

            if (queueError) throw queueError;

            // 2. Crear transacción con client_uuid idempotente
            const clientUuid = generateClientUuid();

            const { data: transaction, error: txError } = await supabase
                .from('transactions')
                .upsert(
                    {
                        client_uuid: clientUuid,
                        solinera_id: solinera.id,
                        queue_item_id: data.queueItemId,
                        driver_name: data.driverName,
                        plate: data.plate,
                        duration_min: data.durationMin,
                        amount: data.amount,
                        method: data.method,
                    },
                    { onConflict: 'client_uuid', ignoreDuplicates: true }
                )
                .select()
                .single();

            if (txError) throw txError;
            return transaction;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['queue'] });
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
        },
    });
}

// Eliminar item de la cola
export function useRemoveFromQueue() {
    const queryClient = useQueryClient();
    const supabase = createClient();

    return useMutation({
        mutationFn: async (queueItemId: string) => {
            const { error } = await supabase
                .from('queue_items')
                .delete()
                .eq('id', queueItemId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['queue'] });
        },
    });
}

// Leer transacciones del día
export function useTodayTransactions() {
    const supabase = createClient();
    const { data: solinera } = useSolineraActiva();

    return useQuery({
        queryKey: ['transactions', solinera?.id, 'today'],
        queryFn: async () => {
            if (!solinera?.id) return [];

            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);

            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('solinera_id', solinera.id)
                .gte('created_at', todayStart.toISOString())
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        },
        enabled: !!solinera?.id,
    });
}