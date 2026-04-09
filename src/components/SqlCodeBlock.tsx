import { useMemo } from 'react';

interface Token {
  text: string;
  type: 'keyword' | 'string' | 'comment' | 'number' | 'operator' | 'text';
}

function tokenizeLine(line: string): Token[] {
  const tokens: Token[] = [];
  let remaining = line;

  while (remaining.length > 0) {
    // Check for comment first (consumes rest of line)
    const commentMatch = remaining.match(/^(--[^\n]*)/);
    if (commentMatch) {
      tokens.push({ text: commentMatch[1], type: 'comment' });
      remaining = remaining.slice(commentMatch[1].length);
      continue;
    }

    // Check for string
    const stringMatch = remaining.match(/^('[^']*')/);
    if (stringMatch) {
      tokens.push({ text: stringMatch[1], type: 'string' });
      remaining = remaining.slice(stringMatch[1].length);
      continue;
    }

    // Check for keyword
    const keywordMatch = remaining.match(
      /^(SELECT|FROM|WHERE|LEFT|RIGHT|INNER|OUTER|FULL|CROSS|JOIN|ON|AND|OR|NOT|IN|IS|NULL|AS|CAST|CONVERT|CASE|WHEN|THEN|ELSE|END|BETWEEN|LIKE|EXISTS|UNION|ALL|DISTINCT|TOP|ORDER|BY|GROUP|HAVING|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|ALTER|DROP|TABLE|INDEX|VIEW|WITH|NOLOCK|DATE|INT|VARCHAR|CHAR|DECIMAL|NUMERIC|FLOAT|BIT|DATETIME|NVARCHAR)\b/,
    );
    if (keywordMatch) {
      tokens.push({ text: keywordMatch[1], type: 'keyword' });
      remaining = remaining.slice(keywordMatch[1].length);
      continue;
    }

    // Check for number (only standalone)
    const numberMatch = remaining.match(/^(\d+)\b/);
    if (numberMatch && (tokens.length === 0 || /[\s,=(]$/.test(tokens[tokens.length - 1].text))) {
      tokens.push({ text: numberMatch[1], type: 'number' });
      remaining = remaining.slice(numberMatch[1].length);
      continue;
    }

    // Check for operator
    const operatorMatch = remaining.match(/^([=<>!]+)/);
    if (operatorMatch) {
      tokens.push({ text: operatorMatch[1], type: 'operator' });
      remaining = remaining.slice(operatorMatch[1].length);
      continue;
    }

    // Plain text (consume until next potential token)
    const plainMatch = remaining.match(/^([^-'=<>!A-Z0-9]+|[A-Z0-9_.#*]+|.)/i);
    if (plainMatch) {
      const last = tokens[tokens.length - 1];
      if (last && last.type === 'text') {
        last.text += plainMatch[1];
      } else {
        tokens.push({ text: plainMatch[1], type: 'text' });
      }
      remaining = remaining.slice(plainMatch[1].length);
    } else {
      // Safety: consume one char
      const last = tokens[tokens.length - 1];
      if (last && last.type === 'text') {
        last.text += remaining[0];
      } else {
        tokens.push({ text: remaining[0], type: 'text' });
      }
      remaining = remaining.slice(1);
    }
  }

  return tokens;
}

const TOKEN_COLORS: Record<Token['type'], string> = {
  keyword: '#569cd6',
  string: '#ce9178',
  comment: '#6a9955',
  number: '#b5cea8',
  operator: '#d4d4d4',
  text: '#d4d4d4',
};

interface SqlCodeBlockProps {
  sql: string;
}

export function SqlCodeBlock({ sql }: SqlCodeBlockProps) {
  const lines = useMemo(() => sql.split('\n'), [sql]);
  const lineNumWidth = String(lines.length).length;

  return (
    <div className="overflow-auto rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#1e1e1e] font-mono text-[13px] leading-6">
      <table className="w-full border-collapse">
        <tbody>
          {lines.map((line, i) => (
            <tr key={i} className="hover:bg-[rgba(255,255,255,0.04)]">
              <td
                className="select-none border-r border-[rgba(255,255,255,0.06)] px-3 text-right align-top text-[rgba(255,255,255,0.28)]"
                style={{ width: `${lineNumWidth + 2}ch`, minWidth: `${lineNumWidth + 2}ch` }}
              >
                {i + 1}
              </td>
              <td className="whitespace-pre px-4">
                {tokenizeLine(line).map((token, ti) => (
                  <span key={ti} style={{ color: TOKEN_COLORS[token.type] }}>
                    {token.text}
                  </span>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
