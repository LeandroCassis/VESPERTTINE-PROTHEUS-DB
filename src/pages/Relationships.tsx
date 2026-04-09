import { ArrowRight, Database, GitBranch, Network, Sparkles, Waypoints } from 'lucide-react';
import { useDeferredValue, useEffect, useMemo, useState, useTransition } from 'react';
import { Link } from 'react-router-dom';
import { LoadingState } from '@/components/LoadingState';
import { SearchInput } from '@/components/SearchInput';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useProtheusData } from '@/hooks/useProtheusData';
import { extractTableId, formatNumber } from '@/lib/utils';

const PAGE_SIZE = 40;

interface RelationshipRow {
  tableId: string;
  origin: string;
  destination: string;
  originExpr: string;
  destinationExpr: string;
  type: string;
  originId: string;
  destinationId: string;
}

export function Relationships() {
  const { data, loading, error } = useProtheusData();
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [page, setPage] = useState(0);
  const [isPending, startTransition] = useTransition();

  const allRelationships = useMemo<RelationshipRow[]>(() => {
    if (!data) {
      return [];
    }

    const rows: RelationshipRow[] = [];
    for (const table of data.tables) {
      for (const relationship of table.relationships) {
        rows.push({
          tableId: table.id,
          origin: relationship['tabela origem'] || '',
          destination: relationship['tabela destino'] || '',
          originExpr: relationship['expressao origem'] || '',
          destinationExpr: relationship['expressao destino'] || '',
          type: relationship.relacionamento || '',
          originId: extractTableId(relationship['tabela origem'] || ''),
          destinationId: extractTableId(relationship['tabela destino'] || ''),
        });
      }
    }

    return rows;
  }, [data]);

  const filteredRelationships = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return allRelationships;
    }

    return allRelationships.filter((row) => {
      return (
        row.tableId.toLowerCase().includes(normalizedQuery) ||
        row.origin.toLowerCase().includes(normalizedQuery) ||
        row.destination.toLowerCase().includes(normalizedQuery) ||
        row.originExpr.toLowerCase().includes(normalizedQuery) ||
        row.destinationExpr.toLowerCase().includes(normalizedQuery) ||
        row.type.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [allRelationships, deferredQuery]);

  const pageCount = Math.max(1, Math.ceil(filteredRelationships.length / PAGE_SIZE));
  const pagedRelationships = useMemo(() => {
    const offset = page * PAGE_SIZE;
    return filteredRelationships.slice(offset, offset + PAGE_SIZE);
  }, [filteredRelationships, page]);

  const topPairs = useMemo(() => {
    const pairMap = new Map<string, { source: string; target: string; count: number }>();

    for (const relationship of allRelationships) {
      if (!relationship.originId || !relationship.destinationId) {
        continue;
      }

      const key = `${relationship.originId}:${relationship.destinationId}`;
      const current = pairMap.get(key);
      if (current) {
        current.count += 1;
      } else {
        pairMap.set(key, {
          source: relationship.originId,
          target: relationship.destinationId,
          count: 1,
        });
      }
    }

    return Array.from(pairMap.values()).sort((left, right) => right.count - left.count).slice(0, 6);
  }, [allRelationships]);

  const busiestTables = useMemo(() => {
    const tableMap = new Map<string, number>();

    for (const relationship of allRelationships) {
      if (relationship.originId) {
        tableMap.set(relationship.originId, (tableMap.get(relationship.originId) || 0) + 1);
      }

      if (relationship.destinationId) {
        tableMap.set(relationship.destinationId, (tableMap.get(relationship.destinationId) || 0) + 1);
      }
    }

    return Array.from(tableMap.entries()).sort((left, right) => right[1] - left[1]).slice(0, 8);
  }, [allRelationships]);

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
          <p className="text-base font-semibold text-[var(--app-ink)]">Nao foi possivel carregar os relacionamentos.</p>
          <p className="mt-2 text-sm text-[var(--app-muted)]">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const tablesWithLinks = new Set(
    allRelationships.flatMap((relationship) => [relationship.originId, relationship.destinationId]).filter(Boolean),
  );

  return (
    <div className="space-y-6">
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_360px]">
        <Card className="reveal overflow-hidden border-[var(--app-border)] bg-[linear-gradient(135deg,rgba(34,41,56,0.96)_0%,rgba(26,31,44,0.98)_100%)]">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="teal">Mapa relacional</Badge>
              <Badge variant="outline">{formatNumber(filteredRelationships.length)} conexoes filtradas</Badge>
              {isPending ? <Badge variant="neutral">Atualizando busca</Badge> : null}
            </div>

            <div className="mt-6 max-w-3xl">
              <h1 className="text-4xl font-semibold tracking-[-0.06em] text-[var(--app-ink)] sm:text-5xl">
                Relacionamentos organizados para leitura rapida e navegacao cruzada.
              </h1>
              <p className="mt-4 max-w-2xl text-[15px] leading-7 text-[var(--app-muted)] sm:text-base">
                Veja as conexoes entre tabelas por origem, destino e expressoes envolvidas. A interface foi redesenhada para manter o foco visual e reduzir ruido em consultas grandes.
              </p>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[22px] border border-white/80 bg-white/88 px-4 py-4 shadow-[var(--app-shadow-soft)]">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--app-muted)]">
                  <GitBranch className="h-3.5 w-3.5" />
                  Total de links
                </div>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[var(--app-ink)]">{formatNumber(allRelationships.length)}</p>
              </div>
              <div className="rounded-[22px] border border-white/80 bg-white/88 px-4 py-4 shadow-[var(--app-shadow-soft)]">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--app-muted)]">
                  <Database className="h-3.5 w-3.5" />
                  Tabelas conectadas
                </div>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[var(--app-ink)]">{formatNumber(tablesWithLinks.size)}</p>
              </div>
              <div className="rounded-[22px] border border-white/80 bg-white/88 px-4 py-4 shadow-[var(--app-shadow-soft)]">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--app-muted)]">
                  <Waypoints className="h-3.5 w-3.5" />
                  Pares destacados
                </div>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[var(--app-ink)]">{formatNumber(topPairs.length)}</p>
              </div>
            </div>

            <div className="mt-8 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
              <SearchInput
                value={query}
                onChange={(value) => {
                  startTransition(() => {
                    setQuery(value);
                    setPage(0);
                  });
                }}
                placeholder="Pesquise por tabela, expressao ou tipo de relacionamento..."
              />

              <div className="flex flex-wrap gap-2">
                <Button asChild variant="secondary">
                  <Link to="/tabelas">
                    <ArrowRight className="h-4 w-4" />
                    Voltar para tabelas
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="reveal reveal-delay-1 border-white/75 bg-white/92">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[var(--app-primary)]" />
              <CardTitle>Pares mais conectados</CardTitle>
            </div>
            <CardDescription>As combinacoes que mais se repetem na malha atual.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {topPairs.map((pair) => (
              <div key={`${pair.source}:${pair.target}`} className="rounded-[22px] border border-[rgba(19,40,34,0.06)] bg-[rgba(19,40,34,0.03)] px-4 py-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--app-ink)]">
                  <Link to={`/tabela/${pair.source}`} className="text-[var(--app-primary)]">
                    {pair.source}
                  </Link>
                  <ArrowRight className="h-3.5 w-3.5 text-[var(--app-muted)]" />
                  <Link to={`/tabela/${pair.target}`} className="text-[var(--app-primary)]">
                    {pair.target}
                  </Link>
                </div>
                <p className="mt-2 text-sm text-[var(--app-muted)]">{pair.count} ocorrencias desta ligacao no catalogo.</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="reveal reveal-delay-2 h-fit border-white/75 bg-white/92 lg:sticky lg:top-24">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Network className="h-4 w-4 text-[var(--app-primary)]" />
              <CardTitle>Ritmo da malha</CardTitle>
            </div>
            <CardDescription>Quais tabelas aparecem com maior recorrencia nas relacoes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {busiestTables.map(([tableId, count]) => (
              <Link
                key={tableId}
                to={`/tabela/${tableId}`}
                className="flex items-center justify-between rounded-[20px] bg-[rgba(19,40,34,0.03)] px-4 py-3 transition hover:bg-white hover:shadow-[var(--app-shadow-soft)]"
              >
                <span className="font-semibold text-[var(--app-ink)]">{tableId}</span>
                <span className="text-sm text-[var(--app-muted)]">{count} ligacoes</span>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="reveal reveal-delay-3 border-white/75 bg-white/92">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle>Conexoes detalhadas</CardTitle>
              <CardDescription>Pagina {page + 1} de {pageCount} com foco em leitura tabular.</CardDescription>
            </div>
            <Badge variant="outline">{formatNumber(filteredRelationships.length)} registros</Badge>
          </CardHeader>
          <CardContent className="p-0">
            {pagedRelationships.length ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tabela base</TableHead>
                      <TableHead>Origem</TableHead>
                      <TableHead>Destino</TableHead>
                      <TableHead>Expr. origem</TableHead>
                      <TableHead>Expr. destino</TableHead>
                      <TableHead>Tipo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedRelationships.map((relationship, index) => (
                      <TableRow key={`${relationship.tableId}-${index}`}>
                        <TableCell>
                          <Link to={`/tabela/${relationship.tableId}`} className="font-semibold text-[var(--app-primary)]">
                            {relationship.tableId}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {relationship.originId ? (
                            <Link to={`/tabela/${relationship.originId}`} className="font-semibold text-[var(--app-primary)]">
                              {relationship.origin}
                            </Link>
                          ) : (
                            relationship.origin
                          )}
                        </TableCell>
                        <TableCell>
                          {relationship.destinationId ? (
                            <Link to={`/tabela/${relationship.destinationId}`} className="font-semibold text-[var(--app-primary)]">
                              {relationship.destination}
                            </Link>
                          ) : (
                            relationship.destination
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-[13px] text-[var(--app-muted)]">{relationship.originExpr || '-'}</TableCell>
                        <TableCell className="font-mono text-[13px] text-[var(--app-muted)]">{relationship.destinationExpr || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{relationship.type || 'Relacao'}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {pageCount > 1 ? (
                  <div className="flex items-center justify-center gap-2 px-6 py-5">
                    <Button type="button" variant="secondary" size="sm" onClick={() => setPage((current) => Math.max(0, current - 1))} disabled={page === 0}>
                      Anterior
                    </Button>
                    <div className="rounded-full border border-white/70 bg-white/86 px-4 py-2 text-sm text-[var(--app-muted-strong)] shadow-[var(--app-shadow-soft)]">
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
              </>
            ) : (
              <div className="p-8 text-center text-sm text-[var(--app-muted)]">Nenhum relacionamento encontrado para o filtro atual.</div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}