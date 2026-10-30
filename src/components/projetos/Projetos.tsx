import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DataTable } from '@/components/ui-custom/DataTable';
import { PriorityBadge } from '@/components/ui-custom/PriorityBadge';
import type { Projeto, Cliente, ProjetoStatus, Freelancer, Tarefa } from '@/types';
import { useTarefas } from '@/hooks/useStore';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar,
  DollarSign,
  Clock,
  CheckCircle2,
  Trash2,
  Edit2,
  Users,
  Eye,
  FolderKanban
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';

interface ProjetosProps {
  projetos: Projeto[];
  clientes: Cliente[];
  freelancers: Freelancer[];
  onAddProjeto: (projeto: Omit<Projeto, 'id' | 'historico' | 'arquivos'>) => void;
  onUpdateProjeto: (id: string, updates: Partial<Projeto>) => void;
  onDeleteProjeto: (id: string) => void;
  onMoveProjeto: (id: string, newStatus: Projeto['status']) => void;
  onAddCliente: (cliente: Omit<Cliente, 'id' | 'dataCadastro'>) => void;
}

const statusColumns: { id: Projeto['status']; label: string; bgClass: string; borderClass: string; headerClass: string }[] = [
  { id: 'orcamento', label: 'Orçamento', bgClass: 'bg-slate-50/50 dark:bg-slate-900/20', borderClass: 'border-slate-200 dark:border-slate-800', headerClass: 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300' },
  { id: 'aprovado', label: 'Aprovado', bgClass: 'bg-blue-50/50 dark:bg-blue-900/20', borderClass: 'border-blue-200 dark:border-blue-900/50', headerClass: 'bg-blue-200 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300' },
  { id: 'em-producao', label: 'Em Produção', bgClass: 'bg-indigo-50/50 dark:bg-indigo-900/20', borderClass: 'border-indigo-200 dark:border-indigo-900/50', headerClass: 'bg-indigo-200 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300' },
  { id: 'em-edicao', label: 'Em Edição', bgClass: 'bg-purple-50/50 dark:bg-purple-900/20', borderClass: 'border-purple-200 dark:border-purple-900/50', headerClass: 'bg-purple-200 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300' },
  { id: 'entregue', label: 'Entregue', bgClass: 'bg-emerald-50/50 dark:bg-emerald-900/20', borderClass: 'border-emerald-200 dark:border-emerald-900/50', headerClass: 'bg-emerald-200 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300' },
];

const prioridadeOptions = [
  { value: 'baixa', label: 'Baixa' },
  { value: 'media', label: 'Média' },
  { value: 'alta', label: 'Alta' },
  { value: 'urgente', label: 'Urgente' },
];

const tipoProjetoOptions = [
  'Vídeo Corporativo',
  'Vídeo Institucional',
  'Vídeo de Lançamento',
  'Conteúdo para Redes Sociais',
  'Cobertura de Evento',
  'Fotografia',
  'Documentário',
  'Produção de Conteúdo',
  'Motion Graphics',
  'Outro',
];

export function Projetos({ 
  projetos, 
  clientes, 
  freelancers = [],
  onAddProjeto, 
  onUpdateProjeto, 
  onDeleteProjeto, 
  onMoveProjeto,
  onAddCliente
}: ProjetosProps) {
  const [viewMode, setViewMode] = useState<'kanban' | 'lista'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedProjeto, setSelectedProjeto] = useState<Projeto | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isQuickAddClientOpen, setIsQuickAddClientOpen] = useState(false);
  
  const [clientFormData, setClientFormData] = useState({
    nomeEmpresa: '',
    nomeResponsavel: '',
    contato: '',
    email: '',
    endereco: '',
    tipo: 'avulso' as 'recorrente' | 'avulso',
    tipoServico: '',
    prioridade: 'media' as 'baixa' | 'media' | 'alta' | 'urgente',
    status: 'ativo' as 'lead' | 'ativo' | 'pausado' | 'encerrado',
  });

  const { tarefas, addTarefa, updateTarefa, deleteTarefa } = useTarefas();
  const [activeTab, setActiveTab] = useState('visao-geral');
  const [novaTarefa, setNovaTarefa] = useState('');
  const [novaAnotacao, setNovaAnotacao] = useState('');

  const [formData, setFormData] = useState({
    nome: '',
    clienteId: '',
    tipo: '',
    dataInicio: '',
    prazoEntrega: '',
    responsaveis: [] as string[],
    orcamento: '',
    status: 'orcamento' as ProjetoStatus,
    prioridade: 'media' as 'baixa' | 'media' | 'alta' | 'urgente',
    observacoes: '',
    equipeIds: [] as string[],
    custoEquipe: '',
  });

  const filteredProjetos = useMemo(() => {
    return projetos.filter(projeto => {
      const matchesSearch = 
        (projeto.nome || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (projeto.clienteNome || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (projeto.tipo || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || projeto.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [projetos, searchQuery, statusFilter]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    // If dragging a task inside the view modal
    if (result.type === 'tarefa') {
      const tarefaId = result.draggableId;
      const newStatus = result.destination.droppableId as Tarefa['status'];
      updateTarefa(tarefaId, { status: newStatus });
      return;
    }

    // Dragging a project
    const projetoId = result.draggableId;
    const newStatus = result.destination.droppableId as Projeto['status'];
    
    onMoveProjeto(projetoId, newStatus);
  };

  const handleOpenModal = (projeto?: Projeto) => {
    if (projeto) {
      setSelectedProjeto(projeto);
      setFormData({
        nome: projeto.nome,
        clienteId: projeto.clienteId,
        tipo: projeto.tipo,
        dataInicio: projeto.dataInicio,
        prazoEntrega: projeto.prazoEntrega,
        responsaveis: projeto.responsaveis,
        orcamento: projeto.orcamento.toString(),
        status: projeto.status,
        prioridade: projeto.prioridade,
        observacoes: projeto.observacoes,
        equipeIds: projeto.equipeIds || [],
        custoEquipe: projeto.custoEquipe?.toString() || '',
      });
      setIsEditing(true);
    } else {
      setSelectedProjeto(null);
      setFormData({
        nome: '',
        clienteId: '',
        tipo: '',
        dataInicio: '',
        prazoEntrega: '',
        responsaveis: [],
        orcamento: '',
        status: 'orcamento',
        prioridade: 'media',
        observacoes: '',
        equipeIds: [],
        custoEquipe: '',
      });
      setIsEditing(false);
    }
    setIsModalOpen(true);
  };

  const handleQuickAddClient = () => {
    if (onAddCliente && clientFormData.nomeEmpresa && clientFormData.contato) {
      onAddCliente({
        ...clientFormData,
        telefone: clientFormData.contato,
        whatsapp: clientFormData.contato,
        historico: [],
        observacoes: 'Cadastrado rapidamente via Projetos'
      });
      setIsQuickAddClientOpen(false);
      setClientFormData({
        nomeEmpresa: '',
        nomeResponsavel: '',
        contato: '',
        email: '',
        endereco: '',
        tipo: 'avulso',
        tipoServico: '',
        prioridade: 'media',
        status: 'ativo',
      });
    }
  };

  const handleSubmit = () => {
    const projetoData = {
      ...formData,
      orcamento: parseFloat(formData.orcamento) || 0,
      custoEquipe: parseFloat(formData.custoEquipe) || 0,
      clienteNome: clientes.find(c => c.id === formData.clienteId)?.nomeEmpresa || '',
    };

    if (isEditing && selectedProjeto) {
      onUpdateProjeto(selectedProjeto.id, projetoData);
    } else {
      onAddProjeto(projetoData);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este projeto?')) {
      onDeleteProjeto(id);
    }
  };

  const handleViewProjeto = (projeto: Projeto) => {
    setSelectedProjeto(projeto);
    setActiveTab('visao-geral');
    setIsViewModalOpen(true);
  };

  const handleAddTarefa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaTarefa.trim() || !selectedProjeto) return;
    addTarefa({
      titulo: novaTarefa,
      descricao: '',
      prioridade: 'media',
      status: 'pendente',
      projetoId: selectedProjeto.id
    });
    setNovaTarefa('');
  };

  const handleAddAnotacao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaAnotacao.trim() || !selectedProjeto) return;
    onUpdateProjeto(selectedProjeto.id, {
      historico: [
        ...selectedProjeto.historico,
        {
          id: Date.now().toString(),
          data: new Date().toISOString(),
          descricao: novaAnotacao,
          autor: 'Usuário'
        }
      ]
    });
    setNovaAnotacao('');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDateSafe = (dateStr: string) => {
    if (!dateStr) return 'Não informada';
    try {
      if (dateStr.includes('/')) return dateStr; // Already formatted
      return format(parseISO(dateStr), 'dd/MM/yyyy', { locale: ptBR });
    } catch (e) {
      return 'Data inválida';
    }
  };

  const getStatusColor = (status: Projeto['status']) => {
    const column = statusColumns.find(c => c.id === status);
    return column?.headerClass || 'bg-gray-100';
  };

  const getDiasRestantes = (prazo: string) => {
    const hoje = new Date();
    const dataPrazo = parseISO(prazo);
    const diffTime = dataPrazo.getTime() - hoje.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const columns = [
    {
      key: 'nome',
      header: 'Projeto',
      render: (projeto: Projeto) => (
        <div>
          <p className="font-medium">{projeto.nome}</p>
          <p className="text-sm text-muted-foreground">{projeto.clienteNome}</p>
        </div>
      ),
    },
    {
      key: 'tipo',
      header: 'Tipo',
      render: (projeto: Projeto) => (
        <Badge variant="outline">{projeto.tipo}</Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (projeto: Projeto) => (
        <Badge className={cn("text-xs", getStatusColor(projeto.status))}>
          {statusColumns.find(s => s.id === projeto.status)?.label}
        </Badge>
      ),
    },
    {
      key: 'prioridade',
      header: 'Prioridade',
      render: (projeto: Projeto) => (
        <PriorityBadge priority={projeto.prioridade} />
      ),
    },
    {
      key: 'prazo',
      header: 'Prazo',
      render: (projeto: Projeto) => {
        if (projeto.status === 'entregue') {
          return (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="text-sm text-emerald-600 font-medium">Concluído</span>
            </div>
          );
        }
        const dias = getDiasRestantes(projeto.prazoEntrega);
        return (
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className={cn(
              "text-sm",
              dias < 0 && "text-red-600 font-medium",
              dias >= 0 && dias <= 3 && "text-amber-600",
              dias > 3 && "text-muted-foreground"
            )}>
              {dias < 0 ? `${Math.abs(dias)}d atrasado` : `${dias}d restantes`}
            </span>
          </div>
        );
      },
    },
    {
      key: 'orcamento',
      header: 'Orçamento',
      render: (projeto: Projeto) => (
        <span className="font-medium">{formatCurrency(projeto.orcamento)}</span>
      ),
    },
    {
      key: 'acoes',
      header: 'Ações',
      render: (projeto: Projeto) => (
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => handleViewProjeto(projeto)}
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => handleOpenModal(projeto)}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => handleDelete(projeto.id)}
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Projetos</h2>
          <p className="text-muted-foreground">Gerencie seus projetos e pipeline</p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'kanban' | 'lista')}>
            <TabsList>
              <TabsTrigger value="kanban" className="gap-2">
                <FolderKanban className="w-4 h-4" />
                Kanban
              </TabsTrigger>
              <TabsTrigger value="lista" className="gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Lista
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={() => handleOpenModal()} className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Projeto
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{projetos.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Em Andamento</p>
            <p className="text-2xl font-bold text-blue-600">
              {projetos.filter(p => p.status !== 'entregue').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Finalizados/Entregues</p>
            <p className="text-2xl font-bold text-emerald-600">
              {projetos.filter(p => p.status === 'entregue').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Urgentes</p>
            <p className="text-2xl font-bold text-red-600">
              {projetos.filter(p => p.prioridade === 'urgente' && p.status !== 'entregue').length}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar projeto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {statusColumns?.map(col => (
              <SelectItem key={col.id} value={col.id}>{col.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {viewMode === 'kanban' && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-5 overflow-x-auto pb-6 items-start">
            {statusColumns?.map((column) => {
              const columnProjects = filteredProjetos.filter(p => p.status === column.id);
              const totalBruto = columnProjects.reduce((sum, p) => sum + p.orcamento, 0);
              const totalCusto = columnProjects.reduce((sum, p) => sum + (p.custoEquipe || 0), 0);
              const totalLiquido = totalBruto - totalCusto;
              
              return (
                <div 
                  key={column.id} 
                  className="flex-shrink-0 w-[340px] flex flex-col"
                >
                  <div className={cn("p-4 rounded-t-xl border-x border-t shadow-sm relative overflow-hidden", column.bgClass, column.borderClass)}>
                    <div className={cn("absolute top-0 left-0 w-full h-1", column.headerClass)} />
                    <div className="flex flex-col gap-2 mt-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-base flex items-center gap-2">
                          <span className={cn("px-2 py-0.5 rounded text-xs", column.headerClass)}>
                            {column.label}
                          </span>
                        </h3>
                        <Badge variant="outline" className="text-xs bg-background/50 font-bold border-muted-foreground/20">
                          {columnProjects.length}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 mt-2 bg-background/40 dark:bg-background/20 p-2 rounded-lg border border-border/50">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground">Bruto</span>
                          <span className="text-xs font-bold">{formatCurrency(totalBruto)}</span>
                        </div>
                        <div className="flex flex-col border-l border-border/50 pl-2">
                          <span className="text-[10px] uppercase font-bold text-red-500/80">Custo</span>
                          <span className="text-xs font-bold text-red-600 dark:text-red-400">-{formatCurrency(totalCusto)}</span>
                        </div>
                        <div className="flex flex-col border-l border-border/50 pl-2">
                          <span className="text-[10px] uppercase font-bold text-indigo-600/80 dark:text-indigo-400/80">Líquido</span>
                          <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400">{formatCurrency(totalLiquido)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Droppable droppableId={column.id} type="projeto">
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={cn(
                          "p-3 min-h-[400px] border-x border-b rounded-b-xl space-y-4 transition-colors",
                          column.bgClass, column.borderClass,
                          snapshot.isDraggingOver ? "bg-indigo-50/50 dark:bg-indigo-900/20 ring-inset ring-2 ring-indigo-500/50" : ""
                        )}
                      >
                        {columnProjects?.map((projeto: Projeto, index: number) => (
                          <Draggable 
                            key={projeto.id} 
                            draggableId={projeto.id} 
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={cn(
                                  "bg-card p-4 rounded-xl border cursor-grab hover:border-indigo-500/50 hover:shadow-md transition-all group relative overflow-hidden",
                                  snapshot.isDragging ? "shadow-xl ring-2 ring-indigo-500 opacity-100 rotate-2 scale-105 z-50 border-indigo-500" : "shadow-sm border-border"
                                )}
                                onClick={() => handleViewProjeto(projeto)}
                              >
                                {projeto.prioridade === 'urgente' && (
                                  <div className="absolute top-0 right-0 w-12 h-12 bg-red-500/10 dark:bg-red-500/20 rounded-bl-full -z-0" />
                                )}
                                <div className="relative z-10">
                                  <div className="flex items-start justify-between mb-2">
                                    <PriorityBadge priority={projeto.prioridade} />
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-muted-foreground hover:text-indigo-600 bg-background/50 hover:bg-background"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenModal(projeto);
                                        }}
                                      >
                                        <Edit2 className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-red-500 hover:text-red-600 bg-background/50 hover:bg-background"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDelete(projeto.id);
                                        }}
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                  
                                  <h4 className="font-bold text-sm mb-1 leading-tight group-hover:text-indigo-600 transition-colors truncate">
                                    {projeto.nome}
                                  </h4>
                                  <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1.5">
                                    <Users className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate">{projeto.clienteNome}</span>
                                  </p>
                                  
                                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
                                    <div className={cn(
                                      "flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded",
                                      projeto.status === 'entregue' 
                                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" 
                                        : "text-muted-foreground"
                                    )}>
                                      {projeto.status === 'entregue' ? (
                                        <CheckCircle2 className="w-3 h-3" />
                                      ) : (
                                        <Clock className="w-3 h-3" />
                                      )}
                                      {projeto.status === 'entregue' ? 'Concluído' : `${getDiasRestantes(projeto.prazoEntrega)}d`}
                                    </div>

                                    <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                      {formatCurrency(projeto.orcamento)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        
                        <Button 
                          variant="ghost" 
                          className="w-full mt-2 border border-dashed border-muted-foreground/30 text-muted-foreground hover:bg-background/80 hover:text-foreground hover:border-muted-foreground/50 h-10"
                          onClick={() => handleOpenModal()}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Adicionar Cartão
                        </Button>
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      )}

      {/* List View */}
      {viewMode === 'lista' && (
        <DataTable
          columns={columns}
          data={filteredProjetos}
          keyExtractor={(item) => item.id}
          emptyMessage="Nenhum projeto encontrado"
        />
      )}

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Editar Projeto' : 'Novo Projeto'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome do Projeto *</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Campanha TechFlow 2024"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Cliente *</Label>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-7 text-xs gap-1 border-blue-500 text-blue-600 hover:bg-blue-50"
                    onClick={() => setIsQuickAddClientOpen(true)}
                  >
                    <Plus className="w-3 h-3" />
                    Novo Cliente
                  </Button>
                </div>
                <Select 
                  value={formData.clienteId} 
                  onValueChange={(v) => setFormData({ ...formData, clienteId: v })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.filter(c => c.status === 'ativo' || c.status === 'lead')?.map(cliente => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.nomeEmpresa}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo de Projeto *</Label>
                <Select 
                  value={formData.tipo} 
                  onValueChange={(v) => setFormData({ ...formData, tipo: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tipoProjetoOptions?.map(tipo => (
                      <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data de Início *</Label>
                <Input
                  type="date"
                  value={formData.dataInicio}
                  onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Prazo de Entrega *</Label>
                <Input
                  type="date"
                  value={formData.prazoEntrega}
                  onChange={(e) => setFormData({ ...formData, prazoEntrega: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Orçamento (R$) *</Label>
                <Input
                  type="number"
                  value={formData.orcamento}
                  onChange={(e) => setFormData({ ...formData, orcamento: e.target.value })}
                  placeholder="0,00"
                />
              </div>
              <div className="space-y-2">
                <Label>Prioridade *</Label>
                <Select 
                  value={formData.prioridade} 
                  onValueChange={(v: 'baixa' | 'media' | 'alta' | 'urgente') => 
                    setFormData({ ...formData, prioridade: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {prioridadeOptions?.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Users className="w-3 h-3" />
                  Membro da Equipe (Líder)
                </Label>
                <Select 
                  value={formData.equipeIds[0] || 'none'} 
                  onValueChange={(v) => {
                    let cost = formData.custoEquipe;
                    if (v !== 'none') {
                      const selectedFreelancer = freelancers.find(f => f.id === v);
                      if (selectedFreelancer) {
                        const baseCost = selectedFreelancer.valorDiaria || selectedFreelancer.valorHora || 0;
                        if (baseCost > 0) cost = baseCost.toString();
                      }
                    }
                    setFormData({ ...formData, equipeIds: v === 'none' ? [] : [v], custoEquipe: cost });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um profissional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {freelancers?.map(f => (
                      <SelectItem key={f.id} value={f.id}>{f.nome} ({f.funcao})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <DollarSign className="w-3 h-3" />
                  Custo da Equipe (Opcional)
                </Label>
                <Input
                  type="number"
                  value={formData.custoEquipe}
                  onChange={(e) => setFormData({ ...formData, custoEquipe: e.target.value })}
                  placeholder="0,00"
                />
                <p className="text-[10px] text-muted-foreground italic">Esse valor será lançado como saída no financeiro.</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Responsáveis</Label>
              <Input
                value={formData.responsaveis.join(', ')}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  responsaveis: e.target.value.split(',')?.map(s => s.trim()).filter(Boolean)
                })}
                placeholder="Nomes separados por vírgula"
              />
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Informações adicionais sobre o projeto..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {isEditing ? 'Salvar Alterações' : 'Criar Projeto'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto sm:rounded-3xl p-0 md:p-6 shadow-2xl">
          {selectedProjeto && (
            <div className="p-4 md:p-2">
              <DialogHeader className="mb-2">
                <div className="flex items-center justify-between pr-10">
                  <DialogTitle className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                    {selectedProjeto.nome}
                  </DialogTitle>
                  <PriorityBadge priority={selectedProjeto.prioridade} />
                </div>
              </DialogHeader>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-6">
                <TabsList className="grid w-full grid-cols-3 bg-muted/60 p-1.5 rounded-2xl">
                  <TabsTrigger value="visao-geral" className="rounded-xl font-medium data-[state=active]:shadow-sm">Visão Geral</TabsTrigger>
                  <TabsTrigger value="tarefas" className="rounded-xl font-medium data-[state=active]:shadow-sm">Tarefas (Trello)</TabsTrigger>
                  <TabsTrigger value="anotacoes" className="rounded-xl font-medium data-[state=active]:shadow-sm">Anotações</TabsTrigger>
                </TabsList>

                <TabsContent value="visao-geral" className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Main Info Card */}
                    <div className="md:col-span-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/30 p-4 rounded-xl border border-border/50">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" /> Cliente
                        </p>
                        <p className="text-xl font-bold text-foreground">{selectedProjeto.clienteNome}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs bg-background">
                            {selectedProjeto.tipo}
                          </Badge>
                          <Badge className={cn("text-xs", getStatusColor(selectedProjeto.status))}>
                            {statusColumns.find(s => s.id === selectedProjeto.status)?.label}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="sm:text-right">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5 justify-start sm:justify-end">
                          <DollarSign className="w-3.5 h-3.5" /> Orçamento
                        </p>
                        <p className="text-2xl font-bold text-foreground">
                          {formatCurrency(selectedProjeto.orcamento)}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-2 sm:justify-end text-xs font-medium">
                          <span className="text-red-600 bg-red-50 dark:bg-red-950/30 px-2 py-1 rounded-md border border-red-100 dark:border-red-900/30">
                            Custo: -{formatCurrency(selectedProjeto.custoEquipe || 0)}
                          </span>
                          <span className="text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded-md border border-emerald-100 dark:border-emerald-900/30">
                            Líquido: {formatCurrency(selectedProjeto.orcamento - (selectedProjeto.custoEquipe || 0))}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Timeline Card */}
                    <div className="p-4 bg-card rounded-xl border border-border/60 shadow-sm">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-4">
                        <Calendar className="w-3.5 h-3.5" /> Prazos e Datas
                      </p>
                      
                      <div className="space-y-4">
                        <div className="flex justify-between items-center border-b pb-2">
                          <div>
                            <p className="text-[10px] text-muted-foreground font-semibold uppercase">Início</p>
                            <p className="font-medium">{formatDateSafe(selectedProjeto.dataInicio)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-muted-foreground font-semibold uppercase">Entrega</p>
                            <p className={cn(
                              "font-medium",
                              selectedProjeto.status === 'entregue' ? "text-emerald-600" : (getDiasRestantes(selectedProjeto.prazoEntrega) < 0 ? "text-red-600" : "text-foreground")
                            )}>
                              {formatDateSafe(selectedProjeto.prazoEntrega)}
                            </p>
                          </div>
                        </div>

                        {selectedProjeto.status !== 'entregue' && (
                           <div className={cn(
                             "w-full text-center py-2 px-3 rounded-lg text-xs font-semibold border",
                             getDiasRestantes(selectedProjeto.prazoEntrega) < 0 
                              ? "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/20 dark:border-red-900/30" 
                              : "bg-secondary/50 text-foreground border-border/50"
                           )}>
                             {getDiasRestantes(selectedProjeto.prazoEntrega) < 0 
                                ? `${Math.abs(getDiasRestantes(selectedProjeto.prazoEntrega))} dias atrasado` 
                                : `${getDiasRestantes(selectedProjeto.prazoEntrega)} dias restantes`}
                           </div>
                        )}
                      </div>
                    </div>

                    {/* Team Card */}
                    <div className="p-4 bg-card rounded-xl border border-border/60 shadow-sm">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-4">
                        <Users className="w-3.5 h-3.5" /> Equipe
                      </p>
                      
                      {selectedProjeto.responsaveis && selectedProjeto.responsaveis.length > 0 ? (
                        <div className="space-y-2">
                          {selectedProjeto.responsaveis.map((resp, i) => (
                            <div key={i} className="flex items-center gap-3 bg-muted/30 border border-border/40 p-2 rounded-lg">
                              <div className="w-8 h-8 rounded-md bg-indigo-100 dark:bg-indigo-900/60 flex items-center justify-center text-indigo-700 dark:text-indigo-300 text-sm font-bold">
                                {resp.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-medium text-sm">{resp}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs font-medium text-muted-foreground text-center bg-muted/20 p-4 rounded-lg border border-dashed border-border/60">
                          Nenhum responsável
                        </p>
                      )}
                    </div>

                    {/* Notes Card */}
                    <div className="md:col-span-2 p-4 bg-amber-50/40 dark:bg-amber-950/10 rounded-xl border border-amber-200/50 dark:border-amber-900/20">
                      <p className="text-xs font-semibold text-amber-700/80 dark:text-amber-500/80 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                        <Edit2 className="w-3.5 h-3.5" /> Observações Iniciais
                      </p>
                      <div className="text-sm text-foreground/90 whitespace-pre-wrap bg-white/60 dark:bg-black/20 p-4 rounded-lg border border-amber-100 dark:border-amber-900/20">
                        {selectedProjeto.observacoes || (
                          <span className="italic opacity-50">Nenhuma observação foi registrada.</span>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>


                <TabsContent value="tarefas" className="mt-4">
                  <div className="mb-4">
                    <form onSubmit={handleAddTarefa} className="flex gap-2">
                      <Input
                        value={novaTarefa}
                        onChange={(e) => setNovaTarefa(e.target.value)}
                        placeholder="Adicionar nova tarefa..."
                        className="flex-1"
                      />
                      <Button type="submit" size="sm">Adicionar</Button>
                    </form>
                  </div>
                  
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <div className="grid grid-cols-3 gap-4 h-[500px]">
                      {['pendente', 'em-andamento', 'concluida'].map((status) => {
                        const colTarefas = tarefas.filter(t => t.projetoId === selectedProjeto.id && t.status === status);
                        const statusColors: any = {
                          'pendente': 'bg-gray-100 dark:bg-gray-900',
                          'em-andamento': 'bg-blue-50 dark:bg-blue-900/20',
                          'concluida': 'bg-emerald-50 dark:bg-emerald-900/20'
                        };
                        const statusLabels: any = {
                          'pendente': 'A Fazer',
                          'em-andamento': 'Em Andamento',
                          'concluida': 'Concluído'
                        };
                        
                        return (
                          <div key={status} className={cn("rounded-lg p-3 flex flex-col border", statusColors[status])}>
                            <h4 className="font-semibold text-sm mb-3 text-center">{statusLabels[status]}</h4>
                            <Droppable droppableId={status} type="tarefa">
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.droppableProps}
                                  className={cn("flex-1 space-y-2 rounded-md transition-colors", snapshot.isDraggingOver && "bg-black/5")}
                                >
                                  {colTarefas.map((tarefa, index) => (
                                    <Draggable key={tarefa.id} draggableId={tarefa.id} index={index}>
                                      {(provided, snapshot) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          {...provided.dragHandleProps}
                                          className={cn(
                                            "bg-background p-3 rounded shadow-sm border text-sm flex items-start justify-between group",
                                            snapshot.isDragging && "shadow-lg ring-1 ring-indigo-500"
                                          )}
                                        >
                                          <span>{tarefa.titulo}</span>
                                          <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => deleteTarefa(tarefa.id)}
                                          >
                                            <Trash2 className="w-3 h-3 text-red-500" />
                                          </Button>
                                        </div>
                                      )}
                                    </Draggable>
                                  ))}
                                  {provided.placeholder}
                                </div>
                              )}
                            </Droppable>
                          </div>
                        );
                      })}
                    </div>
                  </DragDropContext>
                </TabsContent>

                <TabsContent value="anotacoes" className="mt-4">
                  <div className="flex flex-col h-[500px]">
                    <form onSubmit={handleAddAnotacao} className="mb-4 space-y-2">
                      <Textarea
                        value={novaAnotacao}
                        onChange={(e) => setNovaAnotacao(e.target.value)}
                        placeholder="Adicionar nova anotação ou registro de histórico..."
                        rows={3}
                      />
                      <div className="flex justify-end">
                        <Button type="submit" size="sm">Salvar Anotação</Button>
                      </div>
                    </form>
                    
                    <div className="flex-1 overflow-y-auto space-y-3 p-2 bg-muted/30 rounded-lg">
                      {(!selectedProjeto.historico || selectedProjeto.historico.length === 0) ? (
                        <p className="text-sm text-muted-foreground text-center py-4">Nenhuma anotação registrada</p>
                      ) : (
                        selectedProjeto.historico
                          .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
                          .map((item) => (
                            <div key={item.id} className="bg-background p-3 rounded-lg border shadow-sm">
                              <p className="text-sm whitespace-pre-wrap mb-2">{item.descricao}</p>
                              <div className="flex justify-between items-center text-xs text-muted-foreground border-t pt-2">
                                <span>{item.autor}</span>
                                <span>{formatDateSafe(item.data)}</span>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Quick Add Client Dialog */}
      <Dialog open={isQuickAddClientOpen} onOpenChange={setIsQuickAddClientOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cadastro Rápido de Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome da Empresa/Cliente *</Label>
              <Input 
                value={clientFormData.nomeEmpresa}
                onChange={(e) => setClientFormData({ ...clientFormData, nomeEmpresa: e.target.value })}
                placeholder="Ex: Cliente Novo Ltda"
              />
            </div>
            <div className="space-y-2">
              <Label>Contato *</Label>
              <Input 
                value={clientFormData.contato}
                onChange={(e) => setClientFormData({ ...clientFormData, contato: e.target.value })}
                placeholder="(11) 98765-4321"
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Serviço</Label>
              <Input 
                value={clientFormData.tipoServico}
                onChange={(e) => setClientFormData({ ...clientFormData, tipoServico: e.target.value })}
                placeholder="Ex: Foto e Vídeo"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsQuickAddClientOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleQuickAddClient}>
              Cadastrar e Selecionar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
