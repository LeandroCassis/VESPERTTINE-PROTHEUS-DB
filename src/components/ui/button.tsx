import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(31,122,89,0.18)] disabled:pointer-events-none disabled:opacity-45',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--app-primary)] text-white shadow-[0_18px_34px_-24px_rgba(31,122,89,0.9)] hover:bg-[var(--app-primary-strong)]',
        secondary:
          'border border-[var(--app-border)] bg-white text-[var(--app-ink)] shadow-[var(--app-shadow-soft)] hover:bg-[rgba(255,255,255,0.96)]',
        outline:
          'border border-[var(--app-border)] bg-transparent text-[var(--app-ink)] hover:bg-white/70',
        ghost: 'text-[var(--app-muted-strong)] hover:bg-white/70 hover:text-[var(--app-ink)]',
        link: 'text-[var(--app-primary)] hover:text-[var(--app-primary-strong)]',
      },
      size: {
        default: 'h-11 px-5',
        sm: 'h-9 px-4 text-[13px]',
        lg: 'h-12 px-6 text-[15px]',
        icon: 'h-10 w-10 rounded-2xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

type ButtonProps = ComponentPropsWithoutRef<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export function Button({ asChild = false, className, size, variant, ...props }: ButtonProps) {
  const Component = asChild ? Slot : 'button';

  return <Component className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}