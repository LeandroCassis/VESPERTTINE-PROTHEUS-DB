import { Badge } from '@/components/ui/badge';
import { FIELD_TYPE_LABELS } from '@/types';

const typeVariants: Record<string, 'sky' | 'teal' | 'amber' | 'violet' | 'rose' | 'neutral'> = {
  C: 'sky',
  N: 'teal',
  D: 'amber',
  L: 'violet',
  M: 'rose',
};

export function FieldTypeBadge({ type }: { type: string }) {
  return <Badge variant={typeVariants[type] || 'neutral'}>{FIELD_TYPE_LABELS[type] || type}</Badge>;
}