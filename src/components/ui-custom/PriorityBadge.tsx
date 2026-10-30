import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AlertCircle, AlertTriangle, ArrowDown, Minus } from 'lucide-react';

interface PriorityBadgeProps {
  priority: 'baixa' | 'media' | 'alta' | 'urgente';
  showIcon?: boolean;
  className?: string;
}

const priorityConfig = {
  baixa: {
    label: 'Baixa',
    className: 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100',
    icon: ArrowDown
  },
  media: {
    label: 'Média',
    className: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100',
    icon: Minus
  },
  alta: {
    label: 'Alta',
    className: 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100',
    icon: AlertTriangle
  },
  urgente: {
    label: 'Urgente',
    className: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-100',
    icon: AlertCircle
  }
};

export function PriorityBadge({ priority, showIcon = true, className }: PriorityBadgeProps) {
  const config = priorityConfig[priority];
  const Icon = config.icon;
  
  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {showIcon && <Icon className="w-3 h-3 mr-1" />}
      {config.label}
    </Badge>
  );
}
