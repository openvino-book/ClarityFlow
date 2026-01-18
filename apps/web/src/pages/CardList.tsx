import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AlertTriangle, Clock, Plus } from 'lucide-react';
import { cardApi } from '../lib/api';
import { getStatusLabel } from '../lib/utils';
import { Button } from '../components/ui';
import { Badge } from '../components/ui';
import { Card } from '../components/ui';
import type { Card as CardType, CardStatus } from '../types';

// Define the columns in order
const COLUMNS: CardStatus[] = [
  'NEEDS_CLARIFICATION',
  'CONFIRMED',
  'IN_PROGRESS',
  'DONE',
];

// Status border colors for card left border
const STATUS_BORDER_COLORS: Record<CardStatus, string> = {
  NEEDS_CLARIFICATION: 'border-l-yellow-500',
  CONFIRMED: 'border-l-blue-500',
  IN_PROGRESS: 'border-l-purple-500',
  DONE: 'border-l-green-500',
};

export default function CardList() {
  // Fetch all cards
  const { data, isLoading, error } = useQuery({
    queryKey: ['cards'],
    queryFn: () => cardApi.list(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">加载失败: {(error as Error).message}</p>
      </div>
    );
  }

  // Group cards by status
  const cardsByStatus = data?.cards?.reduce((acc, card) => {
    if (!acc[card.status]) {
      acc[card.status] = [];
    }
    acc[card.status].push(card);
    return acc;
  }, {} as Record<CardStatus, CardType[]>) || {};

  const totalCards = data?.cards?.length || 0;

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">任务看板</h2>
          <p className="text-sm text-gray-500 mt-1">
            共 {totalCards} 个任务
          </p>
        </div>
        <Link to="/create">
          <Button variant="primary" size="md">
            <Plus className="w-5 h-5" />
            New Card
          </Button>
        </Link>
      </div>

      {/* Kanban Board - Horizontal scroll on mobile */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-4 h-full min-w-max">
          {COLUMNS.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              cards={cardsByStatus[status] || []}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Kanban Column Component
interface KanbanColumnProps {
  status: CardStatus;
  cards: CardType[];
}

function KanbanColumn({ status, cards }: KanbanColumnProps) {
  const cardCount = cards.length;

  return (
    <div className="w-80 flex flex-col">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
          {getStatusLabel(status)}
        </h3>
        <Badge status={status}>{cardCount}</Badge>
      </div>

      {/* Cards List */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {cards.length === 0 ? (
          <EmptyState status={status} />
        ) : (
          cards.map((card) => (
            <CardItem key={card.id} card={card} />
          ))
        )}
      </div>
    </div>
  );
}

// Empty State Component
interface EmptyStateProps {
  status: CardStatus;
}

function EmptyState({ status }: EmptyStateProps) {
  return (
    <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
      <p className="text-sm text-gray-400">No cards yet</p>
    </div>
  );
}

// Card Item Component
interface CardItemProps {
  card: CardType;
}

function CardItem({ card }: CardItemProps) {
  const hasRisks = card.risks && card.risks.trim() !== '';
  const hasDueDate = card.dueDate !== null;
  const borderColor = STATUS_BORDER_COLORS[card.status];

  return (
    <Link to={`/cards/${card.id}`}>
      <Card
        className={cn(
          'cursor-pointer hover:translate-y-[-2px] transition-all duration-200',
          'border-l-4',
          borderColor
        )}
      >
        <div className="p-4">
          {/* Card Title */}
          <h4 className="text-sm font-semibold text-gray-900 mb-3 line-clamp-2">
            {card.title}
          </h4>

          {/* Card Meta */}
          <div className="flex items-center gap-3 text-xs text-gray-500">
            {/* Version */}
            <span className="inline-flex items-center bg-gray-50 px-2 py-0.5 rounded text-gray-600 font-medium">
              v{card.version}
            </span>

            {/* Due Date */}
            {hasDueDate && (
              <span className="inline-flex items-center gap-1 text-gray-500">
                <Clock className="w-3 h-3" />
                {new Date(card.dueDate!).toLocaleDateString('zh-CN', {
                  month: '2-digit',
                  day: '2-digit',
                })}
              </span>
            )}

            {/* Risk Indicator */}
            {hasRisks && (
              <span className="inline-flex items-center gap-1 text-orange-600">
                <AlertTriangle className="w-3 h-3" />
              </span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}

// Utility: clsx for conditional classes
function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
