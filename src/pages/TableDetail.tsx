import {
  ArrowLeft,
  ArrowUpDown,
  Check,
  Code2,
  Copy,
  Database,
  FileText,
  GitBranch,
  KeyRound,
  PanelsTopLeft,
} from 'lucide-react';
import { useDeferredValue, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FieldTypeBadge } from '@/components/FieldTypeBadge';
import { LoadingState } from '@/components/LoadingState';
import { RelationshipGraph } from '@/components/RelationshipGraph';
import { SearchInput } from '@/components/SearchInput';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProtheusData } from '@/hooks/useProtheusData';
import { extractTableId } from '@/lib/utils';
import { generateTableSql } from '@/lib/sql';

type SortField = 'campo' | 'titulo' | 'tipo' | 'tamanho' | 'contexto';
type SortDirection = 'asc' | 'desc';

export function TableDetail() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error } = useProtheusData();
  const [fieldSearch, setFieldSearch] = useState('');
  const deferredFieldSearch = useDeferredValue(fieldSearch);
  const [sortField, setSortField] = useState<SortField>('campo');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [copiedTableSql, setCopiedTableSql] = useState(false);

  const table = useMemo(() => {
    if (!data || !id) {
      return null;
    }

    return data.tables.find((candidate) => candidate.id === id.toUpperCase()) ?? null;
  }, [data, id]);

  const filteredFields = useMemo(() => {
    if (!table) {
      return [];
    }

    const normalizedQuery = deferredFieldSearch.trim().toLowerCase();
    const nextFields = table.fields.filter((field) => {
      if (!normalizedQuery) {
        return true;
      }

      return (
        field.campo.toLowerCase().includes(normalizedQuery) ||
        field.titulo.toLowerCase().includes(normalizedQuery) ||
        field.descricao.toLowerCase().includes(normalizedQuery)
      );
    });

    nextFields.sort((left, right) => {
      if (sortField === 'tamanho') {
        const leftValue = Number.parseInt(left.tamanho || '0', 10);
        const rightValue = Number.parseInt(right.tamanho || '0', 10);
        return sortDirection === 'asc' ? leftValue - rightValue : rightValue - leftValue;
      }

      const leftValue = (left[sortField] || '').toLowerCase();
      const rightValue = (right[sortField] || '').toLowerCase();
      return sortDirection === 'asc' ? leftValue.localeCompare(rightValue) : rightValue.localeCompare(leftValue);
    });

    return nextFields;
  }, [deferredFieldSearch, sortDirection, sortField, table]);

  const indexColumns = useMemo(() => {
    if (!table) {
      return [];
    }

    const columns = new Set<string>();
    for (const index of table.indexes) {
      Object.keys(index).forEach((key) => columns.add(key));
    }

    return Array.from(columns);
  }, [table]);

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <Card className="reveal">
        <CardContent className="p-8">
          <p className="text-base font-semibold text-[var(--app-ink)]">Nao foi possivel carregar os detalhes da tabela.</p>
          <p className="mt-2 text-sm text-[var(--app-muted)]">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!table) {
    return (
      <Card className="reveal">
        <CardContent className="flex min-h-[320px] flex-col items-center justify-center p-8 text-center">
          <p className="text-lg font-semibold text-[var(--app-ink)]">Tabela nao encontrada</p>
          <p className="mt-2 max-w-md text-sm leading-6 text-[var(--app-muted)]">
            O identificador {id} nao esta presente no catalogo carregado ou a URL foi alterada.
          </p>
          <Button asChild variant="secondary" className="mt-5">
            <Link to="/tabelas">Voltar para o catalogo</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const relatedHighlights = table.relationships.slice(0, 4);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortField(field);
    setSortDirection('asc');
  };

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(value);
      window.setTimeout(() => setCopiedField(null), 1400);
    } catch {
      setCopiedField(null);
    }
  };

  const handleCopyTableSql = async () => {
    try {
      await navigator.clipboard.writeText(generateTableSql(table));
      setCopiedTableSql(true);
      window.setTimeout(() => setCopiedTableSql(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
      <div className="space-y-6">
        <Card className="reveal overflow-hidden border-[var(--app-border)] bg-[linear-gradient(135deg,rgba(34,41,56,0.96)_0%,rgba(26,31,44,0.98)_100%)]">
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0 flex-1 space-y-4">
                <Button asChild variant="ghost" size="sm" className="-ml-1 w-fit">
                  <Link to="/tabelas">
                    <ArrowLeft className="h-4 w-4" />
                    Voltar para tabelas
                  </Link>
                </Button>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{table.id}</Badge>
                  {table.name ? <Badge variant="teal">{table.name}</Badge> : null}
                  <Badge variant="neutral">Detalhe estrutural</Badge>
                  <div className="ml-auto flex gap-2">
                    <Button size="sm" variant={copiedTableSql ? 'default' : 'secondary'} onClick={handleCopyTableSql}>
                      {copiedTableSql ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copiedTableSql ? 'Copiado!' : 'SQL Tabela'}
                    </Button>
                    <Button asChild size="sm" variant="secondary">
                      <Link to={`/tabela/${table.id}/sql`}>
                        <Code2 className="h-3.5 w-3.5" />
                        SQL
                      </Link>
                    </Button>
                  </div>
                </div>

                <div>
                  <h1 className="text-4xl font-semibold tracking-[-0.06em] text-[var(--app-ink)]">{table.id}</h1>
                  <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[var(--app-muted)]">
                    {table.description || 'Sem descricao detalhada disponivel para esta tabela.'}
                  </p>
                </div>
              </div>

              <div className="grid auto-rows-fr gap-3 sm:grid-cols-3 xl:w-[420px] xl:flex-none xl:grid-cols-3">
                <div className="rounded-[22px] border border-white/80 bg-white/88 px-4 py-4 shadow-[var(--app-shadow-soft)]">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--app-muted)]">
                    <FileText className="h-3.5 w-3.5" />
                    Campos
                  </div>
                  <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--app-ink)]">{table.fields.length}</p>
                </div>
                <div className="rounded-[22px] border border-white/80 bg-white/88 px-4 py-4 shadow-[var(--app-shadow-soft)]">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--app-muted)]">
                    <KeyRound className="h-3.5 w-3.5" />
                    Indices
                  </div>
                  <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--app-ink)]">{table.indexes.length}</p>
                </div>
                <div className="rounded-[22px] border border-white/80 bg-white/88 px-4 py-4 shadow-[var(--app-shadow-soft)]">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--app-muted)]">
                    <GitBranch className="h-3.5 w-3.5" />
                    Relacoes
                  </div>
                  <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--app-ink)]">{table.relationships.length}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="campos" className="reveal reveal-delay-2">
          <TabsList>
            <TabsTrigger value="campos">Campos</TabsTrigger>
            <TabsTrigger value="indices">Indices</TabsTrigger>
            <TabsTrigger value="relacionamentos">Relacionamentos</TabsTrigger>
            <TabsTrigger value="grafo">Gráfico</TabsTrigger>
          </TabsList>

          <TabsContent value="campos">
            <Card>
              <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle>Campos da tabela</CardTitle>
                  <CardDescription>Ordene colunas, filtre rapidamente e copie nomes tecnicos.</CardDescription>
                </div>
                <SearchInput
                  value={fieldSearch}
                  onChange={setFieldSearch}
                  placeholder="Filtrar campos por nome, titulo ou descricao..."
                  className="w-full lg:max-w-md"
                />
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {([
                        ['campo', 'Campo'],
                        ['titulo', 'Titulo'],
                        ['tipo', 'Tipo'],
                        ['tamanho', 'Tam.'],
                        ['contexto', 'Contexto'],
                      ] as Array<[SortField, string]>).map(([field, label]) => (
                        <TableHead key={field} className="cursor-pointer select-none" onClick={() => handleSort(field)}>
                          <span className="inline-flex items-center gap-1.5">
                            {label}
                            <ArrowUpDown className="h-3.5 w-3.5" />
                          </span>
                        </TableHead>
                      ))}
                      <TableHead>Descricao</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFields.map((field, index) => (
                      <TableRow key={`${field.campo}-${index}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[13px] font-semibold text-[var(--app-ink)]">{field.campo.trim()}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(field.campo.trim())}
                              className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--app-muted)] transition hover:bg-[rgba(19,40,34,0.05)] hover:text-[var(--app-ink)]"
                              aria-label={`Copiar campo ${field.campo.trim()}`}
                            >
                              {copiedField === field.campo.trim() ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </TableCell>
                        <TableCell className="text-[var(--app-muted-strong)]">{field.titulo}</TableCell>
                        <TableCell>
                          <FieldTypeBadge type={field.tipo} />
                        </TableCell>
                        <TableCell className="tabular-nums text-[var(--app-muted-strong)]">{field.tamanho}</TableCell>
                        <TableCell className="text-[var(--app-muted)]">{field.contexto}</TableCell>
                        <TableCell className="max-w-[360px] text-[var(--app-muted)]">{field.descricao}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {filteredFields.length === 0 ? (
                  <div className="p-8 text-center text-sm text-[var(--app-muted)]">Nenhum campo encontrado para o filtro informado.</div>
                ) : null}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="indices">
            <Card>
              <CardHeader>
                <CardTitle>Indices cadastrados</CardTitle>
                <CardDescription>Visao tabular dos indices configurados para esta tabela.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {table.indexes.length ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {indexColumns.map((column) => (
                          <TableHead key={column}>{column}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {table.indexes.map((index, row) => (
                        <TableRow key={row}>
                          {indexColumns.map((column) => (
                            <TableCell key={column} className="text-[var(--app-muted-strong)]">
                              {index[column] || '-'}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="p-8 text-center text-sm text-[var(--app-muted)]">Nenhum indice cadastrado para esta tabela.</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="relacionamentos">
            <Card>
              <CardHeader>
                <CardTitle>Relacionamentos da tabela</CardTitle>
                <CardDescription>Origem, destino e expressoes utilizadas nos vinculos desta estrutura.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {table.relationships.length ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Origem</TableHead>
                        <TableHead>Destino</TableHead>
                        <TableHead>Expr. origem</TableHead>
                        <TableHead>Expr. destino</TableHead>
                        <TableHead className="w-[140px] min-w-[140px]">Tipo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {table.relationships.map((relationship, index) => {
                        const originId = extractTableId(relationship['tabela origem']);
                        const targetId = extractTableId(relationship['tabela destino']);

                        return (
                          <TableRow key={`${relationship['tabela origem']}-${index}`}>
                            <TableCell>
                              {originId ? (
                                <Link to={`/tabela/${originId}`} className="font-semibold text-[var(--app-primary)]">
                                  {relationship['tabela origem']}
                                </Link>
                              ) : (
                                relationship['tabela origem']
                              )}
                            </TableCell>
                            <TableCell>
                              {targetId ? (
                                <Link to={`/tabela/${targetId}`} className="font-semibold text-[var(--app-primary)]">
                                  {relationship['tabela destino']}
                                </Link>
                              ) : (
                                relationship['tabela destino']
                              )}
                            </TableCell>
                            <TableCell className="font-mono text-[13px] text-[var(--app-muted)]">
                              {relationship['expressao origem'] || '-'}
                            </TableCell>
                            <TableCell className="font-mono text-[13px] text-[var(--app-muted)]">
                              {relationship['expressao destino'] || '-'}
                            </TableCell>
                            <TableCell className="w-[140px] min-w-[140px] whitespace-nowrap">
                              <span className="inline-flex whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--app-muted-strong)]">
                                {relationship.relacionamento || 'Relacao'}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="p-8 text-center text-sm text-[var(--app-muted)]">Nenhum relacionamento cadastrado para esta tabela.</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="grafo">
            <Card>
              <CardHeader>
                <CardTitle>Gráfico de conexoes</CardTitle>
                <CardDescription>Mapa visual das entradas e saidas relacionadas a {table.id}.</CardDescription>
              </CardHeader>
              <CardContent>
                <RelationshipGraph table={table} allTables={data?.tables || []} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Card className="reveal reveal-delay-1 h-fit border-white/75 bg-white/92 xl:sticky xl:top-24">
        <CardHeader>
          <div className="flex items-center gap-2">
            <PanelsTopLeft className="h-4 w-4 text-[var(--app-primary)]" />
            <CardTitle>Resumo estrutural</CardTitle>
          </div>
          <CardDescription>Indicadores rapidos e acessos relacionados.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-[24px] border border-[rgba(19,40,34,0.06)] bg-[rgba(19,40,34,0.03)] p-4">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--app-muted)]">
              <Database className="h-3.5 w-3.5" />
              Chave e rotina
            </div>
            <p className="mt-3 text-sm font-semibold text-[var(--app-ink)]">{table.uniqueKey || 'Chave nao informada'}</p>
            <p className="mt-2 text-sm leading-6 text-[var(--app-muted)]">{table.routine || 'Rotina nao informada no catalogo.'}</p>
          </div>

          <div className="rounded-[24px] border border-[rgba(19,40,34,0.06)] bg-[rgba(19,40,34,0.03)] p-4">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--app-muted)]">
              <GitBranch className="h-3.5 w-3.5" />
              Relacoes em destaque
            </div>
            <div className="mt-4 space-y-3">
              {relatedHighlights.length ? (
                relatedHighlights.map((relationship, index) => {
                  const targetId = extractTableId(relationship['tabela destino']);

                  return (
                    <div
                      key={`${relationship['tabela destino']}-${index}`}
                      className="rounded-[18px] border border-[var(--app-border)] bg-[var(--app-panel)] px-3 py-3 shadow-[var(--app-shadow-soft)]"
                    >
                      <p className="text-sm font-semibold text-[var(--app-ink)]">{relationship.relacionamento || 'Relacao'}</p>
                      <p className="mt-1 text-sm leading-6 text-[var(--app-muted)]">{relationship['tabela destino']}</p>
                      {targetId ? (
                        <Link to={`/tabela/${targetId}`} className="mt-2 inline-flex text-sm font-semibold text-[var(--app-primary)]">
                          Abrir tabela relacionada
                        </Link>
                      ) : null}
                    </div>
                  );
                })
              ) : (
                <p className="text-sm leading-6 text-[var(--app-muted)]">Nenhum relacionamento cadastrado para esta tabela.</p>
              )}
            </div>
          </div>

          <Button asChild variant="secondary" className="w-full justify-center">
            <Link to="/relacionamentos">Ver malha completa de relacionamentos</Link>
          </Button>
        </CardContent>
      </Card>

    </div>
  );
}