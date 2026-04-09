import { Database, Filter, GitBranch, Layers3, RefreshCcw, Sparkles, Waypoints } from 'lucide-react';
import { useDeferredValue, useEffect, useMemo, useState, useTransition } from 'react';
import { Link } from 'react-router-dom';
import { LoadingState } from '@/components/LoadingState';
import { SearchInput } from '@/components/SearchInput';
import { TableCard } from '@/components/TableCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useDatasetStats, useProtheusData, useTableSearch } from '@/hooks/useProtheusData';
import { formatDate, formatNumber } from '@/lib/utils';

const PAGE_SIZE = 18;

export function TableExplorer() {
  const { data, loading, error } = useProtheusData();
  const datasetStats = useDatasetStats(data);
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [selectedPrefix, setSelectedPrefix] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [isPending, startTransition] = useTransition();

  const tables = useMemo(() => data?.tables ?? [], [data]);
  const filteredTables = useTableSearch(tables, deferredQuery);

  const familyMap = useMemo(() => {
    const nextMap: Record<string, number> = {};

    for (const table of filteredTables) {
      const prefix = table.id.slice(0, 2);
      nextMap[prefix] = (nextMap[prefix] || 0) + 1;
    }

    return Object.entries(nextMap).sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));
  }, [filteredTables]);

  const visibleTables = useMemo(() => {
    if (!selectedPrefix) {
      return filteredTables;
    }

    return filteredTables.filter((table) => table.id.startsWith(selectedPrefix));
  }, [filteredTables, selectedPrefix]);

  const pageCount = Math.max(1, Math.ceil(visibleTables.length / PAGE_SIZE));
  const pagedTables = useMemo(() => {
    const offset = page * PAGE_SIZE;
    return visibleTables.slice(offset, offset + PAGE_SIZE);
  }, [page, visibleTables]);

  const scopeStats = useMemo(() => {
    const totalFields = visibleTables.reduce((sum, table) => sum + table.fields.length, 0);
    const totalIndexes = visibleTables.reduce((sum, table) => sum + table.indexes.length, 0);
    const totalRelationships = visibleTables.reduce((sum, table) => sum + table.relationships.length, 0);

    return {
      totalFields,
      totalIndexes,
      totalRelationships,
      averageFields: visibleTables.length ? Math.round(totalFields / visibleTables.length) : 0,
    };
  }, [visibleTables]);

  const featuredTables = useMemo(() => {
    return visibleTables
      .slice()
      .sort((left, right) => {
        const scoreLeft = left.fields.length * 2 + left.relationships.length * 5 + left.indexes.length * 3;
        const scoreRight = right.fields.length * 2 + right.relationships.length * 5 + right.indexes.length * 3;
        return scoreRight - scoreLeft;
      })
      .slice(0, 3);
  }, [visibleTables]);

  useEffect(() => {
    if (page > pageCount - 1) {
      setPage(0);
    }
  }, [page, pageCount]);

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <Card className="reveal">
        <CardContent className="p-8">
          <p className="text-base font-semibold text-[var(--app-ink)]">Nao foi possivel carregar o catalogo.</p>
          <p className="mt-2 text-sm text-[var(--app-muted)]">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data || !datasetStats) {
    return null;
  }

  const handleSearchChange = (value: string) => {
    startTransition(() => {
      setQuery(value);
      setPage(0);
    });
  };

  const handlePrefixChange = (prefix: string | null) => {
    startTransition(() => {
      setSelectedPrefix(prefix);
      setPage(0);
    });
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.36fr)_360px]">
        <Card className="reveal overflow-hidden border-[var(--app-border)] bg-[linear-gradient(135deg,rgba(34,41,56,0.96)_0%,rgba(26,31,44,0.98)_58%,rgba(21,26,37,0.96)_100%)]">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="teal">VESPERTTINE DB-PROTHEUS</Badge>
              <Badge variant="outline">Atualizado em {formatDate(data.metadata.fetchDate)}</Badge>
              {isPending ? <Badge variant="neutral">Atualizando filtros</Badge> : null}
            </div>

            <div className="mt-6 max-w-3xl">
              <h1 className="bg-gradient-to-r from-[var(--app-primary)] to-[var(--app-secondary)] bg-clip-text text-5xl font-bold tracking-[-0.06em] text-transparent sm:text-6xl lg:text-7xl">
                Vesperttine
              </h1>
              <p className="mt-4 max-w-2xl text-[15px] leading-7 text-[var(--app-muted)] sm:text-base">
                Aplicativo de ducumentação e consultas documentais do banco de dados PROTHEUS
              </p>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[22px] border border-white/80 bg-white/88 px-4 py-4 shadow-[var(--app-shadow-soft)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--app-muted)]">Tabelas capturadas</p>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[var(--app-ink)]">
                  {formatNumber(datasetStats.totalTables)}
                </p>
                <p className="mt-2 text-sm text-[var(--app-muted)]">de {formatNumber(datasetStats.totalTablesOnSite)} mapeadas na origem.</p>
              </div>
              <div className="rounded-[22px] border border-white/80 bg-white/88 px-4 py-4 shadow-[var(--app-shadow-soft)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--app-muted)]">Campos monitorados</p>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[var(--app-ink)]">
                  {formatNumber(datasetStats.totalFields)}
                </p>
                <p className="mt-2 text-sm text-[var(--app-muted)]">media de {datasetStats.averageFieldsPerTable} campos por tabela.</p>
              </div>
              <div className="rounded-[22px] border border-white/80 bg-white/88 px-4 py-4 shadow-[var(--app-shadow-soft)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--app-muted)]">Relacionamentos</p>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[var(--app-ink)]">
                  {formatNumber(datasetStats.totalRelationships)}
                </p>
                <p className="mt-2 text-sm text-[var(--app-muted)]">{formatNumber(datasetStats.totalIndexes)} indices distribuindo a malha estrutural.</p>
              </div>
            </div>

            <div className="mt-8 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
              <SearchInput
                value={query}
                onChange={handleSearchChange}
                placeholder="Busque por tabela, rotina, campo ou descricao..."
              />

              <div className="flex flex-wrap gap-2">
                <Button asChild variant="secondary">
                  <Link to="/relacionamentos">
                    <Waypoints className="h-4 w-4" />
                    Abrir mapa de relacoes
                  </Link>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    startTransition(() => {
                      setQuery('');
                      setSelectedPrefix(null);
                      setPage(0);
                    });
                  }}
                  disabled={!query && !selectedPrefix}
                >
                  <RefreshCcw className="h-4 w-4" />
                  Limpar filtros
                </Button>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {familyMap.slice(0, 8).map(([prefix, count]) => (
                <button
                  key={prefix}
                  type="button"
                  onClick={() => handlePrefixChange(selectedPrefix === prefix ? null : prefix)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] transition ${
                    selectedPrefix === prefix
                      ? 'border-transparent bg-[rgba(31,122,89,0.12)] text-[var(--app-primary-strong)]'
                      : 'border-[var(--app-border)] bg-[rgba(64,62,67,0.72)] text-[var(--app-muted-strong)] hover:bg-[var(--app-panel)]'
                  }`}
                >
                  {prefix} <span className="text-[var(--app-muted)]">{count}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="reveal reveal-delay-1 border-white/75 bg-white/92">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[var(--app-primary)]" />
              <CardTitle>Radar rapido</CardTitle>
            </div>
            <CardDescription>As tabelas mais densas no recorte atual.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {featuredTables.map((table) => (
              <Link
                key={table.id}
                to={`/tabela/${table.id}`}
                className="flex items-start gap-3 rounded-[22px] border border-[rgba(19,40,34,0.06)] bg-[rgba(19,40,34,0.03)] px-4 py-4 transition hover:border-[rgba(31,122,89,0.16)] hover:bg-[var(--app-panel)]"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] bg-[rgba(31,122,89,0.08)] text-[var(--app-primary)]">
                  <Database className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-[var(--app-ink)]">{table.id}</p>
                      <p className="mt-1 line-clamp-1 text-sm text-[var(--app-muted)]">{table.name || table.description}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className="border-transparent bg-transparent px-0 py-0 text-[10px] text-[var(--app-muted)]"
                    >
                      {table.relationships.length} rel
                    </Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-[var(--app-muted)]">
                    <span>{table.fields.length} campos</span>
                    <span>{table.indexes.length} indices</span>
                  </div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
        <Card className="reveal reveal-delay-2 h-fit border-white/75 bg-white/92 lg:sticky lg:top-24">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-[var(--app-primary)]" />
              <CardTitle>Filtro por familia</CardTitle>
            </div>
            <CardDescription>Refine o catalogo por prefixo e acompanhe o impacto no recorte.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--app-muted)]">Selecao ativa</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handlePrefixChange(null)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] transition ${
                    selectedPrefix === null
                      ? 'border-transparent bg-[rgba(31,122,89,0.12)] text-[var(--app-primary-strong)]'
                      : 'border-[var(--app-border)] bg-[rgba(64,62,67,0.72)] text-[var(--app-muted-strong)] hover:bg-[var(--app-panel)]'
                  }`}
                >
                  Todas
                </button>
                {familyMap.map(([prefix, count]) => (
                  <button
                    key={prefix}
                    type="button"
                    onClick={() => handlePrefixChange(selectedPrefix === prefix ? null : prefix)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] transition ${
                      selectedPrefix === prefix
                        ? 'border-transparent bg-[rgba(31,122,89,0.12)] text-[var(--app-primary-strong)]'
                        : 'border-[var(--app-border)] bg-[rgba(64,62,67,0.72)] text-[var(--app-muted-strong)] hover:bg-[var(--app-panel)]'
                    }`}
                  >
                    {prefix} <span className="text-[var(--app-muted)]">{count}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3">
              <div className="rounded-[20px] border border-[rgba(19,40,34,0.06)] bg-[rgba(19,40,34,0.03)] px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--app-muted)]">Campos no recorte</p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--app-ink)]">{formatNumber(scopeStats.totalFields)}</p>
              </div>
              <div className="rounded-[20px] border border-[rgba(19,40,34,0.06)] bg-[rgba(19,40,34,0.03)] px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--app-muted)]">Relacionamentos no recorte</p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--app-ink)]">{formatNumber(scopeStats.totalRelationships)}</p>
              </div>
              <div className="rounded-[20px] border border-[rgba(19,40,34,0.06)] bg-[rgba(19,40,34,0.03)] px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--app-muted)]">Media de campos</p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--app-ink)]">{scopeStats.averageFields}</p>
              </div>
            </div>

            <div className="rounded-[20px] border border-[rgba(19,40,34,0.06)] bg-[rgba(19,40,34,0.03)] p-4">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--app-muted)]">
                <GitBranch className="h-3.5 w-3.5" />
                Famílias dominantes
              </div>
              <div className="mt-4 space-y-2">
                {datasetStats.families.slice(0, 5).map(([prefix, count]) => (
                  <div key={prefix} className="flex items-center justify-between rounded-full border border-[var(--app-border)] bg-[var(--app-panel)] px-3 py-2 shadow-[var(--app-shadow-soft)]">
                    <span className="text-sm font-semibold text-[var(--app-ink)]">{prefix}</span>
                    <span className="text-sm text-[var(--app-muted)]">{count} tabelas</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="reveal reveal-delay-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--app-muted)]">
                <Layers3 className="h-3.5 w-3.5" />
                Colecao visivel
              </div>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-[var(--app-ink)]">Tabelas prontas para inspecao</h2>
              <p className="mt-1 text-sm text-[var(--app-muted)]">
                {formatNumber(visibleTables.length)} resultados no recorte atual. {formatNumber(scopeStats.totalIndexes)} indices e {formatNumber(scopeStats.totalRelationships)} relacoes concentradas nesta vista.
              </p>
            </div>

            <div className="rounded-full border border-[var(--app-border)] bg-[var(--app-panel)] px-4 py-2 text-sm text-[var(--app-muted-strong)] shadow-[var(--app-shadow-soft)]">
              Pagina {page + 1} de {pageCount}
            </div>
          </div>

          {pagedTables.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {pagedTables.map((table) => (
                <TableCard key={table.id} table={table} />
              ))}
            </div>
          ) : (
            <Card className="reveal reveal-delay-3">
              <CardContent className="flex min-h-[240px] flex-col items-center justify-center p-8 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-[rgba(31,122,89,0.08)] text-[var(--app-primary)]">
                  <Layers3 className="h-5 w-5" />
                </div>
                <p className="mt-5 text-lg font-semibold text-[var(--app-ink)]">Nenhuma tabela encontrada</p>
                <p className="mt-2 max-w-md text-sm leading-6 text-[var(--app-muted)]">
                  Ajuste o termo pesquisado ou remova filtros de familia para ampliar o catalogo exibido.
                </p>
              </CardContent>
            </Card>
          )}

          {pageCount > 1 ? (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => setPage((current) => Math.max(0, current - 1))} disabled={page === 0}>
                Anterior
              </Button>
              <div className="rounded-full border border-[var(--app-border)] bg-[var(--app-panel)] px-4 py-2 text-sm text-[var(--app-muted-strong)] shadow-[var(--app-shadow-soft)]">
                {page + 1} / {pageCount}
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}
                disabled={page >= pageCount - 1}
              >
                Proxima
              </Button>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}