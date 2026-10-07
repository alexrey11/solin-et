'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RegistroRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/auth/register?role=driver');
    }, [router]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <p className="text-sm text-muted-foreground">Redirigiendo...</p>
        </div>
    );
}