import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-[var(--app-primary)] text-white',
        neutral: 'border-transparent bg-[rgba(19,40,34,0.06)] text-[var(--app-muted-strong)]',
        outline: 'border-[var(--app-border)] bg-white/75 text-[var(--app-muted-strong)]',
        teal: 'border-transparent bg-[rgba(31,122,89,0.1)] text-[var(--app-primary-strong)]',
        amber: 'border-transparent bg-[rgba(191,128,28,0.16)] text-[#8b5d0d]',
        sky: 'border-transparent bg-[rgba(54,110,176,0.14)] text-[#24598f]',
        violet: 'border-transparent bg-[rgba(117,88,183,0.14)] text-[#5e43a4]',
        rose: 'border-transparent bg-[rgba(178,66,96,0.14)] text-[#9f2d50]',
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