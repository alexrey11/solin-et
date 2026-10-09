'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sun } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import Image from 'next/image';

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
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-glow-orange">
          <Image
            src="/logo.png"
            alt="SoliNet"
            width={64}
            height={64}
            className="h-full w-full object-contain"
          />
        </div>
        <p className="text-sm text-muted-foreground">Cargando SoliNet...</p>
      </div>
    </div>
  );
}