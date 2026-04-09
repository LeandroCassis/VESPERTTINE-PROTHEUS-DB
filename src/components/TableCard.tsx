import { ArrowUpRight, Database, FileText, GitBranch, KeyRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { ProtheusTable } from '@/types';
import { MODE_LABELS } from '@/types';

interface TableCardProps {
  table: ProtheusTable;
}

export function TableCard({ table }: TableCardProps) {
  return (
    <Card className="group h-full overflow-hidden border-[var(--app-border)] bg-[var(--app-surface-soft)] transition duration-300 hover:-translate-y-1 hover:border-[rgba(30,174,219,0.24)] hover:shadow-[0_28px_60px_-34px_rgba(0,0,0,0.42)]">
      <CardContent className="flex h-full flex-col p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{table.id}</Badge>
              {table.mode ? <Badge variant="neutral">{MODE_LABELS[table.mode] || table.mode}</Badge> : null}
            </div>

            <div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] border border-[var(--app-border)] bg-[rgba(30,174,219,0.12)] text-[var(--app-primary)]">
                  <Database className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold tracking-[-0.03em] text-[var(--app-ink)]">{table.id}</h3>
                  <p className="mt-1 line-clamp-1 text-sm font-medium text-[var(--app-muted-strong)]">
                    {table.name || 'Tabela sem nome complementar'}
                  </p>
                </div>
              </div>

              <p className="mt-4 line-clamp-3 text-sm leading-6 text-[var(--app-muted)]">
                {table.description || 'Sem descricao resumida cadastrada para esta tabela.'}
              </p>
            </div>
          </div>

          <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-[var(--app-muted)] transition group-hover:text-[var(--app-primary)]" />
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <div className="rounded-[18px] border border-[rgba(19,40,34,0.06)] bg-[rgba(19,40,34,0.03)] px-3 py-3">
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-[var(--app-muted)]">
              <FileText className="h-3.5 w-3.5" />
              Campos
            </div>
            <p className="mt-2 text-lg font-semibold text-[var(--app-ink)]">{table.fields.length}</p>
          </div>
          <div className="rounded-[18px] border border-[rgba(19,40,34,0.06)] bg-[rgba(19,40,34,0.03)] px-3 py-3">
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-[var(--app-muted)]">
              <KeyRound className="h-3.5 w-3.5" />
              Indices
            </div>
            <p className="mt-2 text-lg font-semibold text-[var(--app-ink)]">{table.indexes.length}</p>
          </div>
          <div className="rounded-[18px] border border-[rgba(19,40,34,0.06)] bg-[rgba(19,40,34,0.03)] px-3 py-3">
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-[var(--app-muted)]">
              <GitBranch className="h-3.5 w-3.5" />
              Vinculos
            </div>
            <p className="mt-2 text-lg font-semibold text-[var(--app-ink)]">{table.relationships.length}</p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 pt-1">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--app-muted)]">Rotina</p>
            <p className="mt-1 line-clamp-1 text-sm font-medium text-[var(--app-muted-strong)]">
              {table.routine || 'Nao informada'}
            </p>
          </div>

          <Button asChild variant="secondary" size="sm">
            <Link to={`/tabela/${table.id}`}>Abrir</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}