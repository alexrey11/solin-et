'use client';

import * as React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { getQueryClient, getPersister } from '@/lib/query-client';
import { ThemeProvider } from '@/components/theme-provider';
import { VersionCheck } from '@/components/version-check';
import { Toaster } from '@/components/ui/sonner';

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = React.useState(() => getQueryClient());
    const [persister, setPersister] = React.useState<ReturnType<
        typeof getPersister
    > | null>(null);

    // Solo inicializar persister en el cliente (después de hidratación)
    React.useEffect(() => {
        setPersister(getPersister());
    }, []);

    const inner = (
        <ThemeProvider>
            <VersionCheck />
            {children}
            <Toaster />
        </ThemeProvider>
    );

    // Mientras carga el persister, usar QueryClient normal
    if (!persister) {
        return (
            <QueryClientProvider client={queryClient}>{inner}</QueryClientProvider>
        );
    }

    return (
        <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{
                persister,
                maxAge: 1000 * 60 * 60 * 24 * 7, // 7 días
                buster: 'v1',
                dehydrateOptions: {
                    shouldDehydrateQuery: (query) => {
                        // Persistir queries exitosas
                        return query.state.status === 'success';
                    },
                    shouldDehydrateMutation: (mutation) => {
                        // ✅ Persistir mutaciones pausadas (offline)
                        return mutation.state.isPaused;
                    },
                },
            }}
        >
            {inner}
        </PersistQueryClientProvider>
    );
}