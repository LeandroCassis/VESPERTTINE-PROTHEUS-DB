import * as TabsPrimitive from '@radix-ui/react-tabs';
import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/utils';

export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, ...props }: ComponentPropsWithoutRef<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        'inline-flex w-full flex-wrap items-center gap-1 rounded-[20px] border border-white/70 bg-white/78 p-1 shadow-[var(--app-shadow-soft)] lg:w-auto',
        className,
      )}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }: ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'inline-flex min-h-10 flex-1 items-center justify-center rounded-[16px] px-4 py-2 text-sm font-semibold text-[var(--app-muted)] transition lg:flex-none',
        'hover:text-[var(--app-ink)] data-[state=active]:bg-[rgba(31,122,89,0.08)] data-[state=active]:text-[var(--app-primary-strong)]',
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: ComponentPropsWithoutRef<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content className={cn('mt-5', className)} {...props} />;
}