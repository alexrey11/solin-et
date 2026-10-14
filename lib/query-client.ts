'use client';

import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { get, set, del } from 'idb-keyval';

// ✅ Persister asíncrono a IndexedDB
export const persister = createAsyncStoragePersister({
    storage: {
        getItem: async (key) => {
            const val = await get(key);
            return val ?? null;
        },
        setItem: async (key, value) => {
            await set(key, value);
        },
        removeItem: async (key) => {
            await del(key);
        },
    },
    key: 'solinet-query-cache',
    throttleTime: 1000,
});

// QueryClient con configuración offline-first
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            networkMode: 'offlineFirst',
            staleTime: 1000 * 60 * 5,       // 5 min
            gcTime: 1000 * 60 * 60 * 24,    // 24 h
            retry: 3,
            retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
            refetchOnReconnect: true,
            refetchOnWindowFocus: false,
        },
        mutations: {
            networkMode: 'offlineFirst',
            retry: 5,
            retryDelay: (attempt) => Math.min(2000 * 2 ** attempt, 60000),
        },
    },
});