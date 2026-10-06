'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { motion, type HTMLMotionProps } from 'framer-motion';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  hover?: boolean;
  glow?: 'orange' | 'green' | 'none';
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, hover = false, glow = 'none', children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          'glass rounded-2xl border border-border/50 shadow-card',
          hover && 'transition-all duration-300 hover:border-primary/30 hover:shadow-glow-orange',
          glow === 'orange' && 'shadow-glow-orange',
          glow === 'green' && 'shadow-glow-green',
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
GlassCard.displayName = 'GlassCard';

interface StatCardProps {
  label: string;
  value: string;
  unit?: string;
  icon: React.ReactNode;
  trend?: { value: string; positive: boolean };
  gradient?: 'solar' | 'tech' | 'success';
  delay?: number;
}

export function StatCard({
  label,
  value,
  unit,
  icon,
  trend,
  gradient = 'solar',
  delay = 0,
}: StatCardProps) {
  const gradientClass =
    gradient === 'solar'
      ? 'gradient-solar'
      : gradient === 'tech'
      ? 'gradient-tech'
      : 'gradient-success';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <GlassCard hover className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold tracking-tight">{value}</span>
              {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
            </div>
            {trend && (
              <div className="flex items-center gap-1 pt-1">
                <span
                  className={cn(
                    'text-xs font-medium',
                    trend.positive ? 'text-success' : 'text-destructive'
                  )}
                >
                  {trend.positive ? '↑' : '↓'} {trend.value}
                </span>
                <span className="text-xs text-muted-foreground">vs ayer</span>
              </div>
            )}
          </div>
          <div
            className={cn(
              'flex h-11 w-11 items-center justify-center rounded-xl text-white',
              gradientClass
            )}
          >
            {icon}
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

export function StatusIndicator({
  online,
  label,
}: {
  online: boolean;
  label?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex h-2.5 w-2.5">
        {online && (
          <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-success" />
        )}
        <span
          className={cn(
            'relative inline-flex h-2.5 w-2.5 rounded-full',
            online ? 'bg-success' : 'bg-muted-foreground'
          )}
        />
      </div>
      {label && (
        <span className="text-xs text-muted-foreground">{label}</span>
      )}
    </div>
  );
}

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'info' | 'solar';
  children: React.ReactNode;
  className?: string;
}

export function SoliBadge({ variant = 'default', children, className }: BadgeProps) {
  const variants: Record<string, string> = {
    default: 'bg-secondary text-secondary-foreground border-border',
    success: 'bg-success/15 text-success border-success/30',
    warning: 'bg-warning/15 text-warning border-warning/30',
    destructive: 'bg-destructive/15 text-destructive border-destructive/30',
    info: 'bg-info/15 text-info border-info/30',
    solar: 'bg-primary/15 text-primary border-primary/30',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
