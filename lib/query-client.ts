'use client';

import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { get, set, del } from 'idb-keyval';

let queryClientInstance: QueryClient | null = null;
let persisterInstance: ReturnType<typeof createAsyncStoragePersister> | null = null;

export function getQueryClient(): QueryClient {
    if (!queryClientInstance) {
        queryClientInstance = new QueryClient({
            defaultOptions: {
                queries: {
                    networkMode: 'offlineFirst',
                    staleTime: 1000 * 60 * 5,
                    gcTime: 1000 * 60 * 60 * 24 * 7,
                    retry: 3,
                    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
                    refetchOnReconnect: true,
                    refetchOnWindowFocus: false,
                },
                mutations: {
                    networkMode: 'offlineFirst',
                    retry: 10,
                    retryDelay: (attempt) => Math.min(2000 * 2 ** attempt, 60000),
                },
            },
        });
    }
    return queryClientInstance;
}

export function getPersister() {
    if (!persisterInstance && typeof window !== 'undefined') {
        persisterInstance = createAsyncStoragePersister({
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
    }
    return persisterInstance;
}