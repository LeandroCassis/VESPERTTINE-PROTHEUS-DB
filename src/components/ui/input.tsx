import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Input({ className, type = 'text', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      className={cn(
        'flex h-11 w-full rounded-[18px] border border-[var(--app-border)] bg-white/92 px-4 text-sm text-[var(--app-ink)] shadow-[var(--app-shadow-soft)] outline-none transition placeholder:text-[rgba(66,92,84,0.55)] focus:border-[rgba(31,122,89,0.24)] focus:ring-4 focus:ring-[rgba(31,122,89,0.1)]',
        className,
      )}
      {...props}
    />
  );
}