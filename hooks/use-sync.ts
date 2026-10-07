'use client';

import { useEffect, useRef } from 'react';
import { runSync } from '@/lib/sync';

export function useSync(intervalMs: number = 30000) {
    const syncInProgress = useRef(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

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

        // Sync inicial al montar
        doSync();

        // Sync periódico
        intervalRef.current = setInterval(doSync, intervalMs);

        // Sync al recuperar conexión
        const handleOnline = () => {
            console.log('[useSync] Conexión recuperada, sincronizando...');
            doSync();
        };

        window.addEventListener('online', handleOnline);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            window.removeEventListener('online', handleOnline);
        };
    }, [intervalMs]);
}