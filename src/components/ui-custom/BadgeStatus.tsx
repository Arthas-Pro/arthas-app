import { cn } from '@/lib/utils';

type StatusType = 
  | 'ativo' | 'pausado' | 'encerrado' | 'lead'
  | 'disponivel' | 'em-uso' | 'manutencao' | 'indisponivel'
  | 'pago' | 'pendente' | 'atrasado'
  | 'baixa' | 'media' | 'alta' | 'urgente'
  | 'concluida' | 'em-andamento'
  | 'recorrente' | 'avulso';

interface BadgeStatusProps {
  status: StatusType;
  children?: React.ReactNode;
  className?: string;
}

const statusStyles: Record<StatusType, string> = {
  // Cliente status
  'ativo': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'pausado': 'bg-amber-100 text-amber-800 border-amber-200',
  'encerrado': 'bg-gray-100 text-gray-800 border-gray-200',
  'lead': 'bg-blue-100 text-blue-800 border-blue-200',
  
  // Equipamento status
  'disponivel': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'em-uso': 'bg-blue-100 text-blue-800 border-blue-200',
  'manutencao': 'bg-amber-100 text-amber-800 border-amber-200',
  'indisponivel': 'bg-red-100 text-red-800 border-red-200',
  
  // Financeiro status
  'pago': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'pendente': 'bg-amber-100 text-amber-800 border-amber-200',
  'atrasado': 'bg-red-100 text-red-800 border-red-200',
  
  // Prioridade
  'baixa': 'bg-gray-100 text-gray-800 border-gray-200',
  'media': 'bg-blue-100 text-blue-800 border-blue-200',
  'alta': 'bg-amber-100 text-amber-800 border-amber-200',
  'urgente': 'bg-red-100 text-red-800 border-red-200',
  
  // Tarefa status
  'concluida': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'em-andamento': 'bg-blue-100 text-blue-800 border-blue-200',
  
  // Cliente tipo
  'recorrente': 'bg-purple-100 text-purple-800 border-purple-200',
  'avulso': 'bg-cyan-100 text-cyan-800 border-cyan-200',
};

const statusLabels: Record<StatusType, string> = {
  'ativo': 'Ativo',
  'pausado': 'Pausado',
  'encerrado': 'Encerrado',
  'lead': 'Lead',
  'disponivel': 'Disponível',
  'em-uso': 'Em Uso',
  'manutencao': 'Manutenção',
  'indisponivel': 'Indisponível',
  'pago': 'Pago',
  'pendente': 'Pendente',
  'atrasado': 'Atrasado',
  'baixa': 'Baixa',
  'media': 'Média',
  'alta': 'Alta',
  'urgente': 'Urgente',
  'concluida': 'Concluída',
  'em-andamento': 'Em Andamento',
  'recorrente': 'Recorrente',
  'avulso': 'Avulso',
};

export function BadgeStatus({ status, children, className }: BadgeStatusProps) {
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
      statusStyles[status],
      className
    )}>
      {children || statusLabels[status]}
    </span>
  );
}
