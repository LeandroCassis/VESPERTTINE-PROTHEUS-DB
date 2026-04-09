import { useEffect, useMemo, useState } from 'react';
import { extractTableId } from '@/lib/utils';
import type { ProtheusDataset, ProtheusTable } from '@/types';

const DATASET_URL = '/protheus_tables.json';

let cachedData: ProtheusDataset | null = null;
let cachedPromise: Promise<ProtheusDataset> | null = null;

async function loadDataset() {
  if (cachedData) {
    return cachedData;
  }

  if (!cachedPromise) {
    cachedPromise = fetch(DATASET_URL)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Falha ao carregar o catalogo de tabelas.');
        }

        return response.json() as Promise<ProtheusDataset>;
      })
      .then((dataset) => {
        cachedData = {
          ...dataset,
          metadata: {
            ...dataset.metadata,
            source: 'vesperttine.com',
          },
          tables: dataset.tables.slice().sort((left, right) => left.id.localeCompare(right.id)),
        };

        return cachedData;
      })
      .catch((reason: unknown) => {
        cachedPromise = null;
        throw reason;
      });
  }

  return cachedPromise;
}

export function useProtheusData() {
  const [data, setData] = useState<ProtheusDataset | null>(cachedData);
  const [loading, setLoading] = useState(!cachedData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (cachedData) {
      setData(cachedData);
      setLoading(false);
      return;
    }

    setLoading(true);
    loadDataset()
      .then((dataset) => {
        if (cancelled) {
          return;
        }

        setData(dataset);
        setLoading(false);
      })
      .catch((reason: unknown) => {
        if (cancelled) {
          return;
        }

        setError(reason instanceof Error ? reason.message : 'Erro inesperado ao carregar os dados.');
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading, error };
}

export function useTableSearch(tables: ProtheusTable[], query: string) {
  return useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const searchText = (value: string | null | undefined) => value?.toLowerCase() ?? '';

    if (!normalizedQuery) {
      return tables;
    }

    return tables.filter((table) => {
      if (
        searchText(table.id).includes(normalizedQuery) ||
        searchText(table.name).includes(normalizedQuery) ||
        searchText(table.description).includes(normalizedQuery) ||
        searchText(table.routine).includes(normalizedQuery)
      ) {
        return true;
      }

      return (table.fields ?? []).some((field) => {
        return (
          searchText(field.campo).includes(normalizedQuery) ||
          searchText(field.titulo).includes(normalizedQuery) ||
          searchText(field.descricao).includes(normalizedQuery)
        );
      });
    });
  }, [tables, query]);
}

export function useDatasetStats(dataset: ProtheusDataset | null) {
  return useMemo(() => {
    if (!dataset) {
      return null;
    }

    const totalFields = dataset.tables.reduce((sum, table) => sum + table.fields.length, 0);
    const totalIndexes = dataset.tables.reduce((sum, table) => sum + table.indexes.length, 0);
    const totalRelationships = dataset.tables.reduce((sum, table) => sum + table.relationships.length, 0);

    const families: Record<string, number> = {};
    for (const table of dataset.tables) {
      const prefix = table.id.slice(0, 2);
      families[prefix] = (families[prefix] || 0) + 1;
    }

    return {
      totalTables: dataset.tables.length,
      totalTablesOnSite: dataset.metadata.totalTablesOnSite,
      totalFields,
      totalIndexes,
      totalRelationships,
      families: Object.entries(families).sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0])),
      averageFieldsPerTable: dataset.tables.length ? Math.round(totalFields / dataset.tables.length) : 0,
    };
  }, [dataset]);
}

export function useTableRelationshipGraph(table: ProtheusTable | null, allTables: ProtheusTable[]) {
  return useMemo(() => {
    if (!table) {
      return { nodes: [], edges: [] };
    }

    const relatedIds = new Set<string>([table.id]);
    const edgeKeys = new Set<string>();
    const edges: Array<{
      source: string;
      target: string;
      sourceExpr: string;
      targetExpr: string;
      type: string;
    }> = [];

    const addEdge = (source: string, target: string, sourceExpr: string, targetExpr: string, type: string) => {
      const key = `${source}:${target}:${sourceExpr}:${targetExpr}:${type}`;
      if (edgeKeys.has(key)) {
        return;
      }

      edgeKeys.add(key);
      relatedIds.add(source);
      relatedIds.add(target);
      edges.push({ source, target, sourceExpr, targetExpr, type });
    };

    for (const relationship of table.relationships) {
      const source = extractTableId(relationship['tabela origem'] || '');
      const target = extractTableId(relationship['tabela destino'] || '');

      if (source && target) {
        addEdge(
          source,
          target,
          relationship['expressao origem'] || '',
          relationship['expressao destino'] || '',
          relationship.relacionamento || '',
        );
      }
    }

    for (const candidate of allTables) {
      if (candidate.id === table.id) {
        continue;
      }

      for (const relationship of candidate.relationships) {
        const source = extractTableId(relationship['tabela origem'] || '');
        const target = extractTableId(relationship['tabela destino'] || '');

        if (!source || !target) {
          continue;
        }

        if (source === table.id || target === table.id) {
          addEdge(
            source,
            target,
            relationship['expressao origem'] || '',
            relationship['expressao destino'] || '',
            relationship.relacionamento || '',
          );
        }
      }
    }

    const tableMap = new Map(allTables.map((candidate) => [candidate.id, candidate]));
    const nodes = Array.from(relatedIds).map((id) => ({
      id,
      name: tableMap.get(id)?.name || tableMap.get(id)?.description || '',
      isCurrent: id === table.id,
    }));

    return { nodes, edges };
  }, [allTables, table]);
}