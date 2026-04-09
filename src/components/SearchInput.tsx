import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({ value, onChange, placeholder = 'Pesquisar...', className }: SearchInputProps) {
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-[var(--app-muted)]" />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-12 rounded-[20px] border-[var(--app-border)] bg-[var(--app-surface-soft)] pl-11 pr-11"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute top-1/2 right-3 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[var(--app-muted)] transition hover:bg-[rgba(30,174,219,0.12)] hover:text-[var(--app-ink)]"
          aria-label="Limpar busca"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}