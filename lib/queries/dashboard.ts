'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useSolineraActiva } from './solinera';

// ===== HOOKS =====

// Todas las transacciones del mes de la solinera
export function useMonthTransactions() {
    const supabase = createClient();
    const { data: solinera } = useSolineraActiva();

    return useQuery({
        queryKey: ['transactions', solinera?.id, 'month'],
        queryFn: async () => {
            if (!solinera?.id) return [];

            const monthAgo = new Date();
            monthAgo.setDate(monthAgo.getDate() - 30);

            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('solinera_id', solinera.id)
                .gte('created_at', monthAgo.toISOString())
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        },
        enabled: !!solinera?.id,
    });
}

// Todas las reservas de la solinera (para stats de dashboard)
export function useAllReservations() {
    const supabase = createClient();
    const { data: solinera } = useSolineraActiva();

    return useQuery({
        queryKey: ['all-reservations', solinera?.id],
        queryFn: async () => {
            if (!solinera?.id) return [];

            const { data, error } = await supabase
                .from('charge_requests')
                .select('*')
                .eq('solinera_id', solinera.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        },
        enabled: !!solinera?.id,
    });
}