export interface ProtheusField {
  campo: string;
  titulo: string;
  descricao: string;
  tipo: string;
  contexto: string;
  tamanho: string;
}

export interface ProtheusIndex {
  [key: string]: string;
}

export interface ProtheusRelationship {
  'tabela origem': string;
  'tabela destino': string;
  'expressao origem': string;
  'expressao destino': string;
  relacionamento: string;
}

export interface ProtheusTable {
  id: string;
  name: string;
  description: string;
  routine: string;
  uniqueKey: string;
  mode: string;
  modeUnit: string;
  modeCompany: string;
  fields: ProtheusField[];
  indexes: ProtheusIndex[];
  relationships: ProtheusRelationship[];
}

export interface ProtheusDataset {
  metadata: {
    source: string;
    fetchDate: string;
    totalTablesOnSite: number;
    tablesFetched: number;
  };
  tableIndex: Record<string, string>;
  tables: ProtheusTable[];
}

export const FIELD_TYPE_LABELS: Record<string, string> = {
  C: 'Caractere',
  N: 'Numerico',
  D: 'Data',
  L: 'Logico',
  M: 'Memo',
};

export const MODE_LABELS: Record<string, string> = {
  C: 'Compartilhado',
  E: 'Exclusivo',
  X: 'Nao definido',
};