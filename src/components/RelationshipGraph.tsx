import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTableRelationshipGraph } from '@/hooks/useProtheusData';
import type { ProtheusTable } from '@/types';

interface RelationshipGraphProps {
  table: ProtheusTable;
  allTables: ProtheusTable[];
}

interface PositionedNode {
  id: string;
  name: string;
  isCurrent: boolean;
  x: number;
  y: number;
}

export function RelationshipGraph({ table, allTables }: RelationshipGraphProps) {
  const { nodes, edges } = useTableRelationshipGraph(table, allTables);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 860, height: 480 });

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const width = Math.max(640, entries[0].contentRect.width);
      const height = Math.max(440, Math.min(620, nodes.length * 44 + 220));
      setDimensions({ width, height });
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [nodes.length]);

  const positionedNodes = useMemo<PositionedNode[]>(() => {
    if (nodes.length === 0) {
      return [];
    }

    const currentNode = nodes.find((node) => node.isCurrent);
    const leftNodes = nodes.filter((node) => !node.isCurrent && edges.some((edge) => edge.target === table.id && edge.source === node.id));
    const rightNodes = nodes.filter((node) => !node.isCurrent && edges.some((edge) => edge.source === table.id && edge.target === node.id));
    const ambientNodes = nodes.filter(
      (node) =>
        !node.isCurrent &&
        !leftNodes.some((candidate) => candidate.id === node.id) &&
        !rightNodes.some((candidate) => candidate.id === node.id),
    );

    const positions: PositionedNode[] = [];
    const placedIds = new Set<string>();
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;

    const placeNode = (node: typeof nodes[number], x: number, y: number) => {
      if (placedIds.has(node.id)) {
        return;
      }

      placedIds.add(node.id);
      positions.push({ ...node, x, y });
    };

    if (currentNode) {
      placeNode(currentNode, centerX, centerY);
    }

    const spread = (list: typeof nodes, x: number, startY: number, gap: number) => {
      list.forEach((node, index) => {
        placeNode(node, x, startY + index * gap);
      });
    };

    const leftStart = centerY - ((leftNodes.length - 1) * 72) / 2;
    const rightStart = centerY - ((rightNodes.length - 1) * 72) / 2;
    spread(leftNodes, Math.max(124, centerX - 255), leftStart, 72);
    spread(rightNodes, Math.min(dimensions.width - 124, centerX + 255), rightStart, 72);

    ambientNodes.forEach((node, index) => {
      const ring = 145 + (index % 3) * 26;
      const angle = (-Math.PI / 2) + (index / Math.max(ambientNodes.length, 1)) * Math.PI * 2;
      placeNode(node, centerX + Math.cos(angle) * ring, centerY + Math.sin(angle) * ring * 0.62);
    });

    return positions;
  }, [dimensions.height, dimensions.width, edges, nodes, table.id]);

  if (nodes.length === 0) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-[24px] border border-[rgba(19,40,34,0.08)] bg-[rgba(19,40,34,0.03)] text-sm text-[var(--app-muted)]">
        Nenhum relacionamento encontrado para esta tabela.
      </div>
    );
  }

  const positionMap = new Map(positionedNodes.map((node) => [node.id, node]));

  return (
    <div
      ref={containerRef}
      className="overflow-hidden rounded-[24px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(245,248,244,0.96)_100%)] p-4 shadow-[var(--app-shadow-soft)]"
    >
      <svg viewBox={`0 0 ${dimensions.width} ${dimensions.height}`} className="w-full" style={{ minHeight: 420 }}>
        <defs>
          <marker id="graph-arrow" markerWidth="10" markerHeight="8" refX="10" refY="4" orient="auto">
            <path d="M0,0 L10,4 L0,8" fill="rgba(66,92,84,0.55)" />
          </marker>
        </defs>

        {edges.map((edge, index) => {
          const source = positionMap.get(edge.source);
          const target = positionMap.get(edge.target);

          if (!source || !target) {
            return null;
          }

          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          const nx = dx / distance;
          const ny = dy / distance;
          const startX = source.x + nx * 62;
          const startY = source.y + ny * 24;
          const endX = target.x - nx * 62;
          const endY = target.y - ny * 24;
          const midX = (startX + endX) / 2;
          const midY = (startY + endY) / 2;
          const offset = Math.min(58, distance * 0.16) * (index % 2 === 0 ? 1 : -1);
          const controlX = midX - ny * offset;
          const controlY = midY + nx * offset;
          const outgoing = edge.source === table.id;
          const stroke = outgoing ? 'rgba(31,122,89,0.5)' : 'rgba(191,128,28,0.45)';

          return (
            <g key={`${edge.source}:${edge.target}:${edge.type}:${index}`}>
              <path
                d={`M${startX},${startY} Q${controlX},${controlY} ${endX},${endY}`}
                fill="none"
                stroke={stroke}
                strokeWidth="2"
                markerEnd="url(#graph-arrow)"
              />
              <text
                x={controlX}
                y={controlY - 8}
                textAnchor="middle"
                fontSize="10"
                fill="rgba(66,92,84,0.82)"
                fontFamily="Manrope, sans-serif"
              >
                {edge.type || 'rel'}
              </text>
            </g>
          );
        })}

        {positionedNodes.map((node) => (
          <g key={node.id}>
            <Link to={`/tabela/${node.id}`}>
              <rect
                x={node.x - 58}
                y={node.y - 24}
                width={116}
                height={48}
                rx={18}
                fill={node.isCurrent ? 'rgba(31,122,89,0.94)' : 'rgba(255,255,255,0.98)'}
                stroke={node.isCurrent ? 'rgba(25,105,77,0.96)' : 'rgba(19,40,34,0.08)'}
                strokeWidth={node.isCurrent ? 2 : 1}
              />
              <text
                x={node.x}
                y={node.y - 2}
                textAnchor="middle"
                fontSize="12"
                fontWeight="700"
                fontFamily="Manrope, sans-serif"
                fill={node.isCurrent ? '#ffffff' : 'var(--app-ink)'}
              >
                {node.id}
              </text>
              {node.name ? (
                <text
                  x={node.x}
                  y={node.y + 14}
                  textAnchor="middle"
                  fontSize="9"
                  fontFamily="Manrope, sans-serif"
                  fill={node.isCurrent ? 'rgba(255,255,255,0.75)' : 'rgba(66,92,84,0.75)'}
                >
                  {node.name.length > 22 ? `${node.name.slice(0, 22)}...` : node.name}
                </text>
              ) : null}
            </Link>
          </g>
        ))}
      </svg>
    </div>
  );
}