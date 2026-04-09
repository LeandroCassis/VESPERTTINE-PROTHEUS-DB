import { LoaderCircle } from 'lucide-react';

export function LoadingState() {
  return (
    <div className="flex min-h-[42vh] items-center justify-center">
      <div className="reveal flex min-w-[280px] items-center gap-4 rounded-[28px] border border-white/70 bg-white/88 px-6 py-5 shadow-[var(--app-shadow)]">
        <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[rgba(31,122,89,0.1)] text-[var(--app-primary)]">
          <LoaderCircle className="h-5 w-5 animate-spin" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--app-ink)]">Carregando catalogo</p>
          <p className="mt-1 text-sm text-[var(--app-muted)]">Preparando tabelas, campos e relacionamentos.</p>
        </div>
      </div>
    </div>
  );
}