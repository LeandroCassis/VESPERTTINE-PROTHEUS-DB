import type { ProtheusField, ProtheusTable } from '@/types';

function buildColumnExpr(field: ProtheusField, alias: string): string {
  const tipo = (field.tipo || '').trim().toUpperCase();
  const campoTrimmed = field.campo.trim();
  return tipo === 'D'
    ? `CAST(${alias}.${campoTrimmed} AS DATE)`
    : `${alias}.${campoTrimmed}`;
}

function buildColumnAlias(field: ProtheusField): string {
  const tipo = (field.tipo || '').trim().toUpperCase();
  const tituloTrimmed = field.titulo.trim();
  const prefix = tipo === 'N' ? '#' : '';
  return `'${prefix}${tituloTrimmed}'`;
}

export function generateTableSql(table: ProtheusTable): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  const alias = table.id;
  const desc = table.name || table.description || table.id;

  const lines: string[] = [];
  lines.push('-- ============================================================');
  lines.push(`-- GERADO EM: ${dateStr}`);
  lines.push('-- EMPRESA: VESPERTTINE');
  lines.push('-- USUARIO: LEANDRO ASSIS');
  lines.push('-- ============================================================');
  lines.push('');
  lines.push('SELECT');

  // Build aligned columns
  const exprs = table.fields.map((f) => buildColumnExpr(f, alias));
  const maxLen = exprs.reduce((max, e) => Math.max(max, e.length), 0);

  for (let i = 0; i < table.fields.length; i++) {
    const field = table.fields[i];
    const padded = exprs[i].padEnd(maxLen);
    const aliasStr = buildColumnAlias(field);
    const comma = i === table.fields.length - 1 ? '' : ',';
    const comment = field.descricao ? ` -- ${field.descricao.trim()}` : '';
    lines.push(`    ${padded} ${aliasStr}${comma}${comment}`);
  }

  lines.push('');
  lines.push('FROM');
  lines.push(`    ${table.id} ${alias} WITH (NOLOCK) -- ${desc}`);
  lines.push('');
  lines.push(`WHERE ${alias}.D_E_L_E_T_ = ''`);
  lines.push('');

  return lines.join('\n').toUpperCase();
}
