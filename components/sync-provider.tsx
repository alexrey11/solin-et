'use client';

import { useSync } from '@/hooks/use-sync';

export function SyncProvider({ children }: { children: React.ReactNode }) {
    useSync(30000); // Sync cada 30 segundos
    return <>{children}</>;
}