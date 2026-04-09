import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-[var(--app-primary)] text-[#08131a]',
        neutral: 'border-transparent bg-[rgba(64,62,67,0.58)] text-[var(--app-muted-strong)]',
        outline: 'border-[var(--app-border)] bg-[var(--app-surface-soft)] text-[var(--app-muted-strong)]',
        teal: 'border-transparent bg-[var(--app-primary-soft)] text-[var(--app-primary)]',
        amber: 'border-transparent bg-[rgba(191,128,28,0.22)] text-[#ffd48a]',
        sky: 'border-transparent bg-[rgba(30,174,219,0.16)] text-[#7edfff]',
        violet: 'border-transparent bg-[rgba(117,88,183,0.2)] text-[#ccb8ff]',
        rose: 'border-transparent bg-[rgba(178,66,96,0.2)] text-[#ffb8cf]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

type BadgeProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}