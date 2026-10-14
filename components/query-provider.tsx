'use client';

import * as React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient, persister } from '@/lib/query-client';

export function QueryProvider({ children }: { children: React.ReactNode }) {
    return (
        <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{
                persister,
                maxAge: 1000 * 60 * 60 * 24 * 7, // 7 días
                buster: 'v1',
                dehydrateOptions: {
                    shouldDehydrateQuery: (query) => {
                        // Persistir todas las queries exitosas
                        return query.state.status === 'success';
                    },
                    shouldDehydrateMutation: (mutation) => {
                        // ✅ Persistir mutations pendientes para replay offline
                        return mutation.state.isPaused;
                    },
                },
            }}
        >
            {children}
        </PersistQueryClientProvider>
    );
}