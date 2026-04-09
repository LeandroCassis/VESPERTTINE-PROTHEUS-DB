import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Input({ className, type = 'text', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      className={cn(
        'flex h-11 w-full rounded-[18px] border border-[var(--app-border)] bg-[var(--app-surface-soft)] px-4 text-sm text-[var(--app-ink)] shadow-[var(--app-shadow-soft)] outline-none transition placeholder:text-[rgba(154,167,190,0.68)] focus:border-[rgba(30,174,219,0.32)] focus:ring-4 focus:ring-[rgba(30,174,219,0.12)]',
        className,
      )}
      {...props}
    />
  );
}