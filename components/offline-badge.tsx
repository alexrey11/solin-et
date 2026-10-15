'use client';

import * as React from 'react';
import { useMutationState } from '@tanstack/react-query';
import { CloudOff, RefreshCw } from 'lucide-react';

export function OfflineBadge() {
    const pausedMutations = useMutationState({
        filters: { status: 'pending' },
        select: (mutation) => mutation.state.isPaused,
    });

    const pendingCount = pausedMutations.filter(Boolean).length;

    if (pendingCount === 0) return null;

    return (
        <div className="fixed bottom-20 right-4 z-50 flex items-center gap-2 rounded-full border border-warning/40 bg-warning/10 px-3 py-2 backdrop-blur-xl">
            <CloudOff className="h-4 w-4 text-warning" />
            <span className="text-xs font-medium">
                {pendingCount} operación{pendingCount > 1 ? 'es' : ''} pendiente
                {pendingCount > 1 ? 's' : ''}
            </span>
            <RefreshCw className="h-3 w-3 animate-spin text-warning" />
        </div>
    );
}