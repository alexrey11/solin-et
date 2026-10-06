'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import { StatusIndicator } from '@/components/soli/glass-card';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/cola', label: 'Gestión de Cola', icon: Users },
  { href: '/mapa', label: 'Mapa Consumer', icon: Map },
  { href: '/reportes', label: 'Reportes', icon: BarChart3 },
  { href: '/configuracion', label: 'Configuración', icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [online, setOnline] = React.useState(true);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-border/50 bg-card/40 backdrop-blur-xl lg:flex">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Mobile Sidebar */}
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
              <SidebarContent pathname={pathname} onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex flex-1 flex-col lg:ml-64">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/50 bg-card/40 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-3">
            <button
              className="rounded-lg p-2 hover:bg-muted lg:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link href="/" className="flex items-center gap-2 lg:hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-solar">
                <Sun className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold">SoliNet</span>
            </Link>
            <div className="hidden items-center gap-2 lg:flex">
              <StatusIndicator online={online} label={online ? 'En línea' : 'Sin conexión'} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setOnline(!online)}
              className="flex items-center gap-1.5 rounded-lg border border-border/50 px-3 py-1.5 text-xs hover:bg-muted lg:hidden"
            >
              {online ? <Wifi className="h-3.5 w-3.5 text-success" /> : <WifiOff className="h-3.5 w-3.5 text-destructive" />}
              {online ? 'En línea' : 'Offline'}
            </button>
            <ThemeToggle />
            <div className="flex h-9 w-9 items-center justify-center rounded-full gradient-solar text-sm font-bold text-white">
              AC
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
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      <Link href="/" className="flex items-center gap-2.5 px-6 py-5" onClick={onNavigate}>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-solar shadow-glow-orange">
          <Sun className="h-6 w-6 text-white" />
        </div>
        <div>
          <span className="text-lg font-bold tracking-tight">SoliNet</span>
          <p className="text-xs text-muted-foreground">Energía Solar</p>
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
        <Link
          href="/onboarding"
          onClick={onNavigate}
          className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
        >
          <Lightbulb className="h-5 w-5" />
          Onboarding
        </Link>
        <div className="mt-3 rounded-xl border border-border/50 bg-gradient-to-br from-primary/10 to-accent/5 p-4">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold">Plan Pro</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Solineras ilimitadas y reportes avanzados
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
