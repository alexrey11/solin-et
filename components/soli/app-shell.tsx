'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  LayoutDashboard,
  Users,
  Map,
  BarChart3,
  Settings,
  Sun,
  Zap,
  Menu,
  X,
  Wifi,
  WifiOff,
  Moon,
  Lightbulb,
  LogOut,
  Calendar,
  User as UserIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/theme-provider';
import { StatusIndicator } from '@/components/soli/glass-card';
import { getCurrentUser, logoutUser } from '@/lib/auth';
import { User } from '@/lib/db';
import { toast } from 'sonner';

const businessNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/cola', label: 'Gestión de Cola', icon: Users },
  { href: '/reportes', label: 'Reportes', icon: BarChart3 },
  { href: '/configuracion', label: 'Configuración', icon: Settings },
];

const driverNavItems = [
  { href: '/mapa', label: 'Mapa de Solineras', icon: Map },
  { href: '/reservas', label: 'Mis Reservas', icon: Calendar },
  { href: '/perfil', label: 'Mi Perfil', icon: UserIcon },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [online, setOnline] = React.useState(true);
  const [user, setUser] = React.useState<User | null | undefined>(undefined);

  React.useEffect(() => {
    const load = async () => {
      const u = await getCurrentUser();
      if (!u) {
        router.replace('/select-mode');
        return;
      }
      setUser(u);
    };
    load();
  }, [router]);

  React.useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setOnline(navigator.onLine);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    toast.success('Sesión cerrada');
    router.push('/select-mode');
  };

  if (user === undefined || user === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl overflow-hidden bg-white shadow-glow-orange">
            <Image
              src="/logo.png"
              alt="SoliNet"
              width={64}
              height={64}
              className="h-full w-full object-contain"
            />
          </div>
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  const mode = user.role === 'driver' ? 'driver' : 'business';
  const navItems = mode === 'business' ? businessNavItems : driverNavItems;
  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-border/50 bg-card/40 backdrop-blur-xl lg:flex">
        <SidebarContent
          pathname={pathname}
          mode={mode}
          navItems={navItems}
          onLogout={handleLogout}
        />
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-border bg-card lg:hidden"
            >
              <button
                className="absolute right-3 top-3 rounded-lg p-2 text-muted-foreground hover:bg-muted"
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
              <SidebarContent
                pathname={pathname}
                mode={mode}
                navItems={navItems}
                onNavigate={() => setMobileOpen(false)}
                onLogout={() => {
                  setMobileOpen(false);
                  handleLogout();
                }}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex flex-1 flex-col lg:ml-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/50 bg-card/40 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-3">
            <button
              className="rounded-lg p-2 hover:bg-muted lg:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link href="/" className="flex items-center gap-2 lg:hidden">
              <Image
                src="/logo.png"
                alt="SoliNet"
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
              />
              <span className="font-bold">SoliNet</span>
            </Link>
            <div className="hidden items-center gap-3 lg:flex">
              <StatusIndicator
                online={online}
                label={online ? 'En línea' : 'Sin conexión'}
              />
              <span className="rounded-full border border-border/50 bg-card/40 px-2.5 py-0.5 text-xs font-medium">
                {mode === 'business' ? '🏢 Negocio' : '🚗 Conductor'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="flex h-9 w-9 items-center justify-center rounded-full gradient-solar text-sm font-bold text-white">
              {initials}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

function SidebarContent({
  pathname,
  mode,
  navItems,
  onNavigate,
  onLogout,
}: {
  pathname: string;
  mode: 'business' | 'driver';
  navItems: typeof businessNavItems;
  onNavigate?: () => void;
  onLogout: () => void;
}) {
  return (
    <>
      <Link
        href="/"
        className="flex items-center gap-3 px-6 py-5"
        onClick={onNavigate}
      >
        <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-white shadow-glow-orange">
          <Image
            src="/logo.png"
            alt="SoliNet"
            width={44}
            height={44}
            className="h-full w-full object-contain"
          />
        </div>
        <div>
          <span className="text-lg font-bold tracking-tight">SoliNet</span>
          <p className="text-xs text-muted-foreground">
            {mode === 'business' ? 'Energía Solar' : 'Modo Conductor'}
          </p>
        </div>
      </Link>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className={cn('h-5 w-5', active && 'text-primary')} />
              {item.label}
              {active && (
                <motion.div
                  layoutId="active-pill"
                  className="ml-auto h-1.5 w-1.5 rounded-full bg-primary"
                />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border/50 p-3">
        {mode === 'business' && (
          <Link
            href="/onboarding"
            onClick={onNavigate}
            className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
          >
            <Lightbulb className="h-5 w-5" />
            Onboarding
          </Link>
        )}
        <button
          onClick={onLogout}
          className="group mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-destructive transition-all hover:bg-destructive/10"
        >
          <LogOut className="h-5 w-5" />
          Cerrar sesión
        </button>
        <div className="mt-3 rounded-xl border border-border/50 bg-gradient-to-br from-primary/10 to-accent/5 p-4">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold">
              {mode === 'business' ? 'Plan Pro' : 'Modo Conductor'}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {mode === 'business'
              ? 'Solineras ilimitadas y reportes avanzados'
              : 'Encuentra solineras cercanas'}
          </p>
        </div>
      </div>
    </>
  );
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/50 hover:bg-muted"
      aria-label="Cambiar tema"
    >
      {theme === 'dark' ? (
        <Lightbulb className="h-4 w-4 text-accent" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  );
}