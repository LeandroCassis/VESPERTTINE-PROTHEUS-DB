import { Check, Copy, X } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { ProtheusField, ProtheusRelationship, ProtheusTable } from '@/types';
import { extractTableId } from '@/lib/utils';

interface SqlGeneratorModalProps {
  table: ProtheusTable;
  allTables: ProtheusTable[];
  onClose: () => void;
}

export function SqlGeneratorModal({ table, allTables, onClose }: SqlGeneratorModalProps) {
  const [chooseColumns, setChooseColumns] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(new Set());
  const [includeRelationships, setIncludeRelationships] = useState(false);
  const [selectedRelationships, setSelectedRelationships] = useState<Set<number>>(new Set());
  const [copied, setCopied] = useState(false);

  const uniqueRelationships = useMemo(() => {
    const seen = new Set<string>();
    const result: Array<{ relationship: ProtheusRelationship; index: number }> = [];
    for (let i = 0; i < table.relationships.length; i++) {
      const r = table.relationships[i];
      const key = `${r['tabela destino']}|${r['expressao origem']}|${r['expressao destino']}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push({ relationship: r, index: i });
      }
    }
    return result;
  }, [table.relationships]);

  const toggleColumn = (campo: string) => {
    setSelectedColumns((prev) => {
      const next = new Set(prev);
      if (next.has(campo)) {
        next.delete(campo);
      } else {
        next.add(campo);
      }
      return next;
    });
  };

  const toggleAllColumns = () => {
    if (selectedColumns.size === table.fields.length) {
      setSelectedColumns(new Set());
    } else {
      setSelectedColumns(new Set(table.fields.map((f) => f.campo.trim())));
    }
  };

  const toggleRelationship = (index: number) => {
    setSelectedRelationships((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const resolveTableDescription = useCallback(
    (tableName: string): string => {
      const tableId = extractTableId(tableName);
      const found = allTables.find((t) => t.id === tableId);
      return found?.name || found?.description || tableName;
    },
    [allTables],
  );

  const buildColumnLine = (field: ProtheusField, alias: string, isLast: boolean): string => {
    const comma = isLast ? '' : ',';
    const col = `    ${alias}.${field.campo.trim()}`;
    const aliasStr = ` '${field.titulo.trim()}'`;
    const comment = field.descricao ? ` -- ${field.descricao.trim()}` : '';
    return `${col}${aliasStr}${comma}${comment}`;
  };

  const generatedSql = useMemo(() => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR');
    const tableAlias = table.id;
    const tableDesc = table.name || table.description || table.id;

    const lines: string[] = [];

    lines.push('-- ============================================================');
    lines.push(`-- GERADO EM: ${dateStr}`);
    lines.push('-- EMPRESA: VESPERTTINE');
    lines.push('-- USUARIO: LEANDRO ASSIS');
    lines.push('-- ============================================================');
    lines.push('');

    // Determine selected relationships
    const activeRelationships: Array<{ rel: ProtheusRelationship; destAlias: string; destDesc: string }> = [];
    if (includeRelationships && selectedRelationships.size > 0) {
      for (const { relationship, index } of uniqueRelationships) {
        if (selectedRelationships.has(index)) {
          const destId = extractTableId(relationship['tabela destino']);
          const destDesc = resolveTableDescription(relationship['tabela destino']);
          activeRelationships.push({ rel: relationship, destAlias: destId, destDesc });
        }
      }
    }

    // SELECT
    lines.push('SELECT');

    if (!chooseColumns || selectedColumns.size === 0) {
      // SELECT * (com alias da tabela principal)
      lines.push(`    ${tableAlias}.*`);

      // Adicionar colunas das tabelas relacionadas
      for (const { destAlias } of activeRelationships) {
        lines.push(`   ,${destAlias}.*`);
      }
    } else {
      // Colunas selecionadas da tabela principal
      const selectedFields = table.fields.filter((f) => selectedColumns.has(f.campo.trim()));
      const hasRelCols = activeRelationships.length > 0;

      for (let i = 0; i < selectedFields.length; i++) {
        const field = selectedFields[i];
        const isLast = i === selectedFields.length - 1 && !hasRelCols;
        lines.push(buildColumnLine(field, tableAlias, isLast));
      }

      // Colunas das tabelas relacionadas (todas as colunas delas)
      for (let ri = 0; ri < activeRelationships.length; ri++) {
        const { destAlias } = activeRelationships[ri];
        const destTable = allTables.find((t) => t.id === destAlias);
        if (destTable) {
          lines.push(`    -- COLUNAS DE ${destAlias} (${destTable.name || destTable.description || destAlias})`);
          for (let fi = 0; fi < destTable.fields.length; fi++) {
            const field = destTable.fields[fi];
            const isLastCol = ri === activeRelationships.length - 1 && fi === destTable.fields.length - 1;
            lines.push(buildColumnLine(field, destAlias, isLastCol));
          }
        } else {
          const isLastRel = ri === activeRelationships.length - 1;
          const comma = isLastRel ? '' : ',';
          lines.push(`    ${destAlias}.*${comma}`);
        }
      }
    }

    // FROM
    lines.push('');
    lines.push(`FROM`);
    lines.push(`    ${table.id} ${tableAlias} WITH (NOLOCK) -- ${tableDesc}`);

    // JOINs
    for (const { rel, destAlias, destDesc } of activeRelationships) {
      const exprOrigem = (rel['expressao origem'] || '').trim();
      const exprDestino = (rel['expressao destino'] || '').trim();

      lines.push('');
      lines.push(`    LEFT JOIN ${destAlias} ${destAlias} WITH (NOLOCK) -- ${destDesc}`);

      if (exprOrigem && exprDestino) {
        lines.push(`        ON ${tableAlias}.${exprOrigem} = ${destAlias}.${exprDestino}`);
      } else if (exprOrigem) {
        lines.push(`        ON ${tableAlias}.${exprOrigem} = ${destAlias}.${exprOrigem}`);
      } else {
        lines.push(`        ON /* DEFINIR CONDICAO DE JOIN */`);
      }
    }

    lines.push('');

    return lines.join('\n').toUpperCase();
  }, [
    chooseColumns,
    selectedColumns,
    includeRelationships,
    selectedRelationships,
    table,
    allTables,
    uniqueRelationships,
    resolveTableDescription,
  ]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedSql);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative mx-4 flex max-h-[90vh] w-full max-w-3xl flex-col rounded-[28px] border border-white/80 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[rgba(19,40,34,0.08)] px-6 py-4">
          <h2 className="text-lg font-semibold text-[var(--app-ink)]">Gerar SQL — {table.id}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--app-muted)] transition hover:bg-[rgba(19,40,34,0.06)] hover:text-[var(--app-ink)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Opção: Escolher colunas */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                className={`flex h-5 w-5 items-center justify-center rounded-md border transition ${
                  chooseColumns
                    ? 'border-[var(--app-primary)] bg-[var(--app-primary)] text-white'
                    : 'border-[var(--app-border)] bg-white'
                }`}
                onClick={() => {
                  setChooseColumns(!chooseColumns);
                  if (!chooseColumns) {
                    setSelectedColumns(new Set(table.fields.map((f) => f.campo.trim())));
                  }
                }}
              >
                {chooseColumns && <Check className="h-3.5 w-3.5" />}
              </div>
              <span className="text-sm font-semibold text-[var(--app-ink)]">Escolher colunas</span>
              <span className="text-xs text-[var(--app-muted)]">
                {chooseColumns ? `${selectedColumns.size} de ${table.fields.length} selecionadas` : 'Desmarcado = SELECT *'}
              </span>
            </label>

            {chooseColumns && (
              <div className="rounded-[18px] border border-[var(--app-border)] bg-[rgba(19,40,34,0.02)] p-3 max-h-48 overflow-y-auto">
                <div className="mb-2 flex items-center justify-between">
                  <button type="button" onClick={toggleAllColumns} className="text-xs font-semibold text-[var(--app-primary)] hover:underline">
                    {selectedColumns.size === table.fields.length ? 'Desmarcar todas' : 'Selecionar todas'}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
                  {table.fields.map((field) => {
                    const campo = field.campo.trim();
                    const checked = selectedColumns.has(campo);
                    return (
                      <label key={campo} className="flex items-center gap-2 rounded-lg px-2 py-1.5 cursor-pointer hover:bg-white/80 transition">
                        <div
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                            checked
                              ? 'border-[var(--app-primary)] bg-[var(--app-primary)] text-white'
                              : 'border-[var(--app-border)] bg-white'
                          }`}
                          onClick={() => toggleColumn(campo)}
                        >
                          {checked && <Check className="h-3 w-3" />}
                        </div>
                        <span className="truncate text-xs text-[var(--app-ink)]" title={`${campo} — ${field.titulo}`}>
                          {campo}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Opção: Incluir relacionamentos */}
          {table.relationships.length > 0 && (
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-md border transition ${
                    includeRelationships
                      ? 'border-[var(--app-primary)] bg-[var(--app-primary)] text-white'
                      : 'border-[var(--app-border)] bg-white'
                  }`}
                  onClick={() => setIncludeRelationships(!includeRelationships)}
                >
                  {includeRelationships && <Check className="h-3.5 w-3.5" />}
                </div>
                <span className="text-sm font-semibold text-[var(--app-ink)]">Incluir relacionamentos (JOINs)</span>
                <span className="text-xs text-[var(--app-muted)]">
                  {includeRelationships ? `${selectedRelationships.size} tabela(s) selecionada(s)` : `${uniqueRelationships.length} disponivel(is)`}
                </span>
              </label>

              {includeRelationships && (
                <div className="rounded-[18px] border border-[var(--app-border)] bg-[rgba(19,40,34,0.02)] p-3 max-h-48 overflow-y-auto">
                  <div className="space-y-1">
                    {uniqueRelationships.map(({ relationship, index }) => {
                      const checked = selectedRelationships.has(index);
                      const destId = extractTableId(relationship['tabela destino']);
                      const destDesc = resolveTableDescription(relationship['tabela destino']);
                      return (
                        <label key={index} className="flex items-center gap-2 rounded-lg px-2 py-2 cursor-pointer hover:bg-white/80 transition">
                          <div
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                              checked
                                ? 'border-[var(--app-primary)] bg-[var(--app-primary)] text-white'
                                : 'border-[var(--app-border)] bg-white'
                            }`}
                            onClick={() => toggleRelationship(index)}
                          >
                            {checked && <Check className="h-3 w-3" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-semibold text-[var(--app-ink)]">{destId}</span>
                            <span className="ml-2 text-xs text-[var(--app-muted)]">{destDesc}</span>
                          </div>
                          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-[var(--app-muted)]">
                            {relationship.relacionamento || 'Relacao'}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Preview SQL */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--app-muted)]">Preview do SQL</span>
              <Button size="sm" variant={copied ? 'default' : 'secondary'} onClick={handleCopy}>
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copiado!' : 'Copiar SQL'}
              </Button>
            </div>
            <pre className="max-h-64 overflow-auto rounded-[18px] border border-[var(--app-border)] bg-[rgba(19,40,34,0.04)] p-4 text-xs leading-5 text-[var(--app-ink)] font-mono whitespace-pre">
              {generatedSql}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-[rgba(19,40,34,0.08)] px-6 py-4">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Fechar
          </Button>
          <Button size="sm" onClick={handleCopy}>
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copiado!' : 'Copiar SQL'}
          </Button>
        </div>
      </div>
    </div>
  );
}
