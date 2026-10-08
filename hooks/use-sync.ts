'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { runSync } from '@/lib/sync';

export function useSync(intervalMs: number = 10000) {
    const syncInProgress = useRef(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const channelRef = useRef<any>(null);

    useEffect(() => {
        const doSync = async () => {
            if (syncInProgress.current) return;
            if (!navigator.onLine) return;

            syncInProgress.current = true;
            try {
                await runSync();
            } catch (err) {
                console.error('[useSync] Error:', err);
            } finally {
                syncInProgress.current = false;
            }
        };

        // Sync inicial
        doSync();

        // Sync periódico (cada 10s por defecto)
        intervalRef.current = setInterval(doSync, intervalMs);

        // Sync al recuperar conexión
        const handleOnline = () => {
            console.log('[useSync] Conexión recuperada, sincronizando...');
            doSync();
        };
        window.addEventListener('online', handleOnline);

        // ===== SUPABASE REALTIME =====
        // Escuchar cambios en tiempo real para sync inmediato
        const setupRealtime = async () => {
            try {
                const supabase = createClient();
                const channel = supabase
                    .channel('solinet-changes')
                    .on(
                        'postgres_changes',
                        { event: '*', schema: 'public', table: 'charge_requests' },
                        (payload) => {
                            console.log('[Realtime] charge_requests cambió:', payload.eventType);
                            doSync();
                        }
                    )
                    .on(
                        'postgres_changes',
                        { event: '*', schema: 'public', table: 'solineras' },
                        (payload) => {
                            console.log('[Realtime] solineras cambió:', payload.eventType);
                            doSync();
                        }
                    )
                    .on(
                        'postgres_changes',
                        { event: '*', schema: 'public', table: 'driver_profiles' },
                        (payload) => {
                            console.log('[Realtime] driver_profiles cambió:', payload.eventType);
                            doSync();
                        }
                    )
                    .subscribe();

                channelRef.current = channel;
            } catch (err) {
                console.error('[Realtime] Error al suscribirse:', err);
            }
        };

        setupRealtime();

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            window.removeEventListener('online', handleOnline);
            if (channelRef.current) {
                channelRef.current.unsubscribe();
            }
        };
    }, [intervalMs]);
}