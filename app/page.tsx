'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sun } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const check = async () => {
      const user = await getCurrentUser();
      if (user) {
        router.replace(user.role === 'driver' ? '/mapa' : '/dashboard');
        return;
      }
      router.replace('/select-mode');
    };
    check();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-solar shadow-glow-orange">
          <Sun className="h-9 w-9 text-white" />
        </div>
        <p className="text-sm text-muted-foreground">Cargando SoliNet...</p>
      </div>
    </div>
  );
}