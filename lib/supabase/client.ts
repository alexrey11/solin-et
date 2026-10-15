'use client';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export function createClient() {
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
            auth: {
                // ✅ Persiste en localStorage, sobrevive offline
                persistSession: true,
                // ✅ Intenta refrescar cuando puede, no rompe offline
                autoRefreshToken: true,
                // ✅ Detecta el hash de OAuth en la URL al volver
                detectSessionInUrl: true,
                // ⚠️ Si cambias esto, TODOS los usuarios deben re-loguearse
                storageKey: 'solinet-auth',
            },
        }
    );
}