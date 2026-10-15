'use client';

import { QueryClient } from '@tanstack/react-query';

let queryClientInstance: QueryClient | null = null;

export function getQueryClient(): QueryClient {
    if (!queryClientInstance) {
        queryClientInstance = new QueryClient({
            defaultOptions: {
                queries: {
                    networkMode: 'offlineFirst',
                    staleTime: 1000 * 60 * 5,
                    gcTime: 1000 * 60 * 60 * 24,
                    retry: 3,
                    refetchOnReconnect: true,
                    refetchOnWindowFocus: false,
                },
                mutations: {
                    networkMode: 'offlineFirst',
                    retry: 5,
                },
            },
        });
    }
    return queryClientInstance;
}