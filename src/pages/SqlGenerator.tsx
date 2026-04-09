import { ArrowLeft, Check, Copy } from 'lucide-react';
import { useCallback, useDeferredValue, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { SearchInput } from '@/components/SearchInput';
import { SqlCodeBlock } from '@/components/SqlCodeBlock';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useProtheusData } from '@/hooks/useProtheusData';
import { LoadingState } from '@/components/LoadingState';
import type { ProtheusField, ProtheusRelationship } from '@/types';
import { extractTableId } from '@/lib/utils';

export function SqlGenerator() {
  const { id } = useParams<{ id: string }>();
  const { data, loading } = useProtheusData();

  const [chooseColumns, setChooseColumns] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(new Set());
  const [includeRelationships, setIncludeRelationships] = useState(false);
  const [selectedRelationships, setSelectedRelationships] = useState<Set<number>>(new Set());
  const [copied, setCopied] = useState(false);

  const [columnSearch, setColumnSearch] = useState('');
  const deferredColumnSearch = useDeferredValue(columnSearch);
  const [relSearch, setRelSearch] = useState('');
  const deferredRelSearch = useDeferredValue(relSearch);

  const table = useMemo(() => {
    if (!data || !id) return null;
    return data.tables.find((t) => t.id === id.toUpperCase()) ?? null;
  }, [data, id]);

  const allTables = data?.tables || [];

  const uniqueRelationships = useMemo(() => {
    if (!table) return [];
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
  }, [table]);

  const filteredFields = useMemo(() => {
    if (!table) return [];
    const q = deferredColumnSearch.trim().toLowerCase();
    if (!q) return table.fields;
    return table.fields.filter(
      (f) =>
        f.campo.toLowerCase().includes(q) ||
        f.titulo.toLowerCase().includes(q) ||
        f.descricao.toLowerCase().includes(q),
    );
  }, [table, deferredColumnSearch]);

  const filteredRelationships = useMemo(() => {
    const q = deferredRelSearch.trim().toLowerCase();
    if (!q) return uniqueRelationships;
    return uniqueRelationships.filter(({ relationship }) => {
      const destId = extractTableId(relationship['tabela destino']).toLowerCase();
      const destName = relationship['tabela destino'].toLowerCase();
      const tipo = (relationship.relacionamento || '').toLowerCase();
      return destId.includes(q) || destName.includes(q) || tipo.includes(q);
    });
  }, [uniqueRelationships, deferredRelSearch]);

  const toggleColumn = (campo: string) => {
    setSelectedColumns((prev) => {
      const next = new Set(prev);
      if (next.has(campo)) next.delete(campo);
      else next.add(campo);
      return next;
    });
  };

  const toggleAllColumns = () => {
    if (!table) return;
    if (selectedColumns.size === table.fields.length) {
      setSelectedColumns(new Set());
    } else {
      setSelectedColumns(new Set(table.fields.map((f) => f.campo.trim())));
    }
  };

  const toggleRelationship = (index: number) => {
    setSelectedRelationships((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const toggleAllRelationships = () => {
    if (selectedRelationships.size === uniqueRelationships.length) {
      setSelectedRelationships(new Set());
    } else {
      setSelectedRelationships(new Set(uniqueRelationships.map((r) => r.index)));
    }
  };

  const resolveTableDescription = useCallback(
    (tableName: string): string => {
      const tableId = extractTableId(tableName);
      const found = allTables.find((t) => t.id === tableId);
      return found?.name || found?.description || tableName;
    },
    [allTables],
  );

  const buildColumnExpr = (field: ProtheusField, alias: string): string => {
    const tipo = (field.tipo || '').trim().toUpperCase();
    const campoTrimmed = field.campo.trim();
    return tipo === 'D'
      ? `CAST(${alias}.${campoTrimmed} AS DATE)`
      : `${alias}.${campoTrimmed}`;
  };

  const buildColumnAlias = (field: ProtheusField): string => {
    const tipo = (field.tipo || '').trim().toUpperCase();
    const tituloTrimmed = field.titulo.trim();
    const aliasPrefix = tipo === 'N' ? '#' : '';
    return `'${aliasPrefix}${tituloTrimmed}'`;
  };

  const buildAlignedColumns = (
    columns: Array<{ field: ProtheusField; alias: string; isLast: boolean }>,
  ): string[] => {
    const exprs = columns.map((c) => buildColumnExpr(c.field, c.alias));
    const maxLen = exprs.reduce((max, e) => Math.max(max, e.length), 0);

    return columns.map((c, i) => {
      const expr = exprs[i];
      const padded = expr.padEnd(maxLen);
      const aliasStr = buildColumnAlias(c.field);
      const comma = c.isLast ? '' : ',';
      const comment = c.field.descricao ? ` -- ${c.field.descricao.trim()}` : '';
      return `    ${padded} ${aliasStr}${comma}${comment}`;
    });
  };

  const generatedSql = useMemo(() => {
    if (!table) return '';
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

    lines.push('SELECT');

    if (!chooseColumns || selectedColumns.size === 0) {
      lines.push(`    ${tableAlias}.*`);
      for (const { destAlias } of activeRelationships) {
        lines.push(`   ,${destAlias}.*`);
      }
    } else {
      const selectedFields = table.fields.filter((f) => selectedColumns.has(f.campo.trim()));

      // Collect all columns for alignment
      const allCols: Array<{ field: ProtheusField; alias: string; isLast: boolean }> = [];

      for (let i = 0; i < selectedFields.length; i++) {
        allCols.push({ field: selectedFields[i], alias: tableAlias, isLast: false });
      }

      // Check if any relationship will use wildcard (dest table not in catalog)
      const hasWildcardRels = activeRelationships.some(
        ({ destAlias }) => !allTables.find((t) => t.id === destAlias),
      );

      for (let ri = 0; ri < activeRelationships.length; ri++) {
        const { destAlias } = activeRelationships[ri];
        const destTable = allTables.find((t) => t.id === destAlias);
        if (destTable) {
          for (const field of destTable.fields) {
            allCols.push({ field, alias: destAlias, isLast: false });
          }
        }
      }

      // Only mark last column as isLast if no wildcard relationship lines follow
      if (allCols.length > 0 && !hasWildcardRels) {
        allCols[allCols.length - 1].isLast = true;
      }

      // Build aligned lines with comment separators for relationship tables
      const aligned = buildAlignedColumns(allCols);
      let idx = 0;

      // Main table columns
      for (let i = 0; i < selectedFields.length; i++) {
        lines.push(aligned[idx++]);
      }

      // Related table columns
      for (let ri = 0; ri < activeRelationships.length; ri++) {
        const { destAlias } = activeRelationships[ri];
        const destTable = allTables.find((t) => t.id === destAlias);
        if (destTable) {
          lines.push(`    -- COLUNAS DE ${destAlias} (${destTable.name || destTable.description || destAlias})`);
          for (let fi = 0; fi < destTable.fields.length; fi++) {
            lines.push(aligned[idx++]);
          }
        } else {
          const isLastRel = ri === activeRelationships.length - 1;
          const comma = isLastRel ? '' : ',';
          lines.push(`    ${destAlias}.*${comma}`);
        }
      }
    }

    lines.push('');
    lines.push('FROM');
    lines.push(`    ${table.id} ${tableAlias} WITH (NOLOCK) -- ${tableDesc}`);

    for (const { rel, destAlias, destDesc } of activeRelationships) {
      const exprOrigem = (rel['expressao origem'] || '').trim();
      const exprDestino = (rel['expressao destino'] || '').trim();
      lines.push('');
      lines.push(`    LEFT JOIN ${destAlias} ${destAlias} WITH (NOLOCK) -- ${destDesc}`);
      lines.push(`        ON ${destAlias}.D_E_L_E_T_ = ''`);

      if (exprOrigem && exprDestino) {
        const partsOrigem = exprOrigem.split('+').map((p) => p.trim()).filter(Boolean);
        const partsDestino = exprDestino.split('+').map((p) => p.trim()).filter(Boolean);
        const count = Math.min(partsOrigem.length, partsDestino.length);
        for (let ji = 0; ji < count; ji++) {
          const colOrig = partsOrigem[ji].includes('.') ? partsOrigem[ji] : `${tableAlias}.${partsOrigem[ji]}`;
          const colDest = partsDestino[ji].includes('.') ? partsDestino[ji] : `${destAlias}.${partsDestino[ji]}`;
          lines.push(`        AND ${colOrig} = ${colDest}`);
        }
      } else if (exprOrigem) {
        const colOrig = exprOrigem.includes('.') ? exprOrigem : `${tableAlias}.${exprOrigem}`;
        lines.push(`        AND ${colOrig} = ${destAlias}.${exprOrigem}`);
      } else {
        lines.push(`        AND /* DEFINIR CONDICAO DE JOIN */`);
      }
    }

    lines.push('');
    lines.push(`WHERE ${tableAlias}.D_E_L_E_T_ = ''`);
    lines.push('');
    return lines.join('\n').toUpperCase();
  }, [chooseColumns, selectedColumns, includeRelationships, selectedRelationships, table, allTables, uniqueRelationships, resolveTableDescription]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedSql);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  if (loading) return <LoadingState />;

  if (!table) {
    return (
      <Card className="reveal">
        <CardContent className="flex min-h-[320px] flex-col items-center justify-center p-8 text-center">
          <p className="text-lg font-semibold text-[var(--app-ink)]">Tabela nao encontrada</p>
          <Button asChild variant="secondary" className="mt-5">
            <Link to="/tabelas">Voltar para o catalogo</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="reveal overflow-hidden border-white/75 bg-[linear-gradient(135deg,rgba(255,255,255,0.96)_0%,rgba(244,248,245,0.92)_100%)]">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-3">
              <Button asChild variant="ghost" size="sm" className="-ml-1 w-fit">
                <Link to={`/tabela/${table.id}`}>
                  <ArrowLeft className="h-4 w-4" />
                  Voltar para {table.id}
                </Link>
              </Button>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{table.id}</Badge>
                {table.name ? <Badge variant="teal">{table.name}</Badge> : null}
                <Badge variant="sky">Gerador SQL</Badge>
              </div>
              <h1 className="text-3xl font-semibold tracking-[-0.06em] text-[var(--app-ink)]">
                Gerar SQL — {table.id}
              </h1>
              <p className="max-w-2xl text-[15px] leading-7 text-[var(--app-muted)]">
                Selecione colunas e relacionamentos para gerar o script SQL personalizado.
              </p>
            </div>
            <Button size="default" onClick={handleCopy} className="shrink-0">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copiado!' : 'Copiar SQL'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)] xl:items-start">
        {/* Left: Options */}
        <div className="space-y-5 xl:order-1">
          {/* Escolher Colunas */}
          <Card className="reveal reveal-delay-1">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-5 w-5 cursor-pointer items-center justify-center rounded-md border transition ${
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
                  <div>
                    <CardTitle>Escolher colunas</CardTitle>
                    <CardDescription>
                      {chooseColumns
                        ? `${selectedColumns.size} de ${table.fields.length} selecionadas`
                        : 'Desmarcado = SELECT *'}
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>

            {chooseColumns && (
              <CardContent className="space-y-3 pt-0">
                <div className="flex items-center gap-3">
                  <SearchInput
                    value={columnSearch}
                    onChange={setColumnSearch}
                    placeholder="Buscar colunas por nome, titulo ou descricao..."
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={toggleAllColumns}
                    className="shrink-0 text-xs font-semibold text-[var(--app-primary)] hover:underline"
                  >
                    {selectedColumns.size === table.fields.length ? 'Desmarcar todas' : 'Selecionar todas'}
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto rounded-[18px] border border-[var(--app-border)] bg-[rgba(19,40,34,0.02)] p-3">
                  <div className="grid grid-cols-1 gap-0.5 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredFields.map((field) => {
                      const campo = field.campo.trim();
                      const checked = selectedColumns.has(campo);
                      return (
                        <label
                          key={campo}
                          className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 cursor-pointer hover:bg-white/80 transition"
                          onClick={() => toggleColumn(campo)}
                        >
                          <div
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                              checked
                                ? 'border-[var(--app-primary)] bg-[var(--app-primary)] text-white'
                                : 'border-[var(--app-border)] bg-white'
                            }`}
                          >
                            {checked && <Check className="h-3 w-3" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="block truncate text-xs font-semibold text-[var(--app-ink)]">{campo}</span>
                            <span className="block truncate text-[11px] text-[var(--app-muted)]">{field.titulo}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  {filteredFields.length === 0 && (
                    <p className="py-4 text-center text-sm text-[var(--app-muted)]">Nenhuma coluna encontrada.</p>
                  )}
                </div>
              </CardContent>
            )}
          </Card>

          {/* Incluir Relacionamentos */}
          {table.relationships.length > 0 && (
            <Card className="reveal reveal-delay-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-5 w-5 cursor-pointer items-center justify-center rounded-md border transition ${
                        includeRelationships
                          ? 'border-[var(--app-primary)] bg-[var(--app-primary)] text-white'
                          : 'border-[var(--app-border)] bg-white'
                      }`}
                      onClick={() => setIncludeRelationships(!includeRelationships)}
                    >
                      {includeRelationships && <Check className="h-3.5 w-3.5" />}
                    </div>
                    <div>
                      <CardTitle>Incluir relacionamentos (JOINs)</CardTitle>
                      <CardDescription>
                        {includeRelationships
                          ? `${selectedRelationships.size} de ${uniqueRelationships.length} tabela(s) selecionada(s)`
                          : `${uniqueRelationships.length} relacionamento(s) disponivel(is)`}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>

              {includeRelationships && (
                <CardContent className="space-y-3 pt-0">
                  <div className="flex items-center gap-3">
                    <SearchInput
                      value={relSearch}
                      onChange={setRelSearch}
                      placeholder="Buscar tabelas relacionadas..."
                      className="flex-1"
                    />
                    <button
                      type="button"
                      onClick={toggleAllRelationships}
                      className="shrink-0 text-xs font-semibold text-[var(--app-primary)] hover:underline"
                    >
                      {selectedRelationships.size === uniqueRelationships.length ? 'Desmarcar todas' : 'Selecionar todas'}
                    </button>
                  </div>

                  <div className="max-h-80 overflow-y-auto rounded-[18px] border border-[var(--app-border)] bg-[rgba(19,40,34,0.02)] p-3">
                    <div className="space-y-0.5">
                      {filteredRelationships.map(({ relationship, index }) => {
                        const checked = selectedRelationships.has(index);
                        const destId = extractTableId(relationship['tabela destino']);
                        const destDesc = resolveTableDescription(relationship['tabela destino']);
                        return (
                          <label
                            key={index}
                            className="flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 cursor-pointer hover:bg-white/80 transition"
                            onClick={() => toggleRelationship(index)}
                          >
                            <div
                              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                                checked
                                  ? 'border-[var(--app-primary)] bg-[var(--app-primary)] text-white'
                                  : 'border-[var(--app-border)] bg-white'
                              }`}
                            >
                              {checked && <Check className="h-3 w-3" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="text-sm font-semibold text-[var(--app-ink)]">{destId}</span>
                              <span className="ml-2 text-xs text-[var(--app-muted)]">{destDesc}</span>
                            </div>
                            <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-[var(--app-muted)]">
                              {relationship.relacionamento || 'Relacao'}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                    {filteredRelationships.length === 0 && (
                      <p className="py-4 text-center text-sm text-[var(--app-muted)]">Nenhum relacionamento encontrado.</p>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          )}
        </div>

        {/* Right: SQL Preview (sticky) */}
        <Card className="reveal reveal-delay-2 border-white/75 bg-white/92 xl:sticky xl:top-24 xl:order-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Preview do SQL</CardTitle>
              <Button size="sm" variant={copied ? 'default' : 'secondary'} onClick={handleCopy}>
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copiado!' : 'Copiar'}
              </Button>
            </div>
            <CardDescription>O script e atualizado em tempo real conforme suas selecoes.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-[70vh] overflow-auto">
              <SqlCodeBlock sql={generatedSql} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
