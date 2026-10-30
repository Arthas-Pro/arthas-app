import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { exportToPdf, downloadTxt, generateCRMTxt } from '@/lib/exportUtils';
import { ReportControls } from '@/components/ui-custom/ReportControls';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/ui-custom/DataTable';
import { BadgeStatus } from '@/components/ui-custom/BadgeStatus';
import { PriorityBadge } from '@/components/ui-custom/PriorityBadge';
import type { Cliente } from '@/types';
import { 
  Plus, 
  Phone, 
  Mail, 
  MapPin, 
  MessageCircle, 
  Edit2, 
  Trash2, 
  Eye,
  Building2,
  User,
  History,
  Calendar,
  CheckCircle2,
  Search,
  Filter,
  DollarSign
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CRMProps {
  clientes: Cliente[];
  onAddCliente: (cliente: Omit<Cliente, 'id' | 'dataCadastro'>) => void;
  onUpdateCliente: (id: string, updates: Partial<Cliente>) => void;
  onDeleteCliente: (id: string) => void;
  onAddHistorico: (clienteId: string, atendimento: { data: string; descricao: string; tipo: 'ligacao' | 'email' | 'reuniao' | 'whatsapp' | 'outro' }) => void;
}

const statusOptions = [
  { value: 'lead', label: 'Lead' },
  { value: 'ativo', label: 'Ativo' },
  { value: 'pausado', label: 'Pausado' },
  { value: 'encerrado', label: 'Encerrado' },
];

const tipoOptions = [
  { value: 'recorrente', label: 'Recorrente' },
  { value: 'avulso', label: 'Avulso' },
];

const prioridadeOptions = [
  { value: 'baixa', label: 'Baixa' },
  { value: 'media', label: 'Média' },
  { value: 'alta', label: 'Alta' },
  { value: 'urgente', label: 'Urgente' },
];

const historicoTipoOptions = [
  { value: 'ligacao', label: 'Ligação' },
  { value: 'email', label: 'E-mail' },
  { value: 'reuniao', label: 'Reunião' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'outro', label: 'Outro' },
];

export function CRM({ 
  clientes, 
  onAddCliente, 
  onUpdateCliente, 
  onDeleteCliente,
  onAddHistorico 
}: CRMProps) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tipoFilter, setTipoFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    nomeEmpresa: '',
    nomeResponsavel: '',
    contato: '',
    email: '',
    endereco: '',
    observacoes: '',
    tipo: 'avulso' as 'recorrente' | 'avulso',
    valorMensal: '',
    diaPagamento: '',
    duracaoContrato: '',
    custoFixoTerceiro: '',
    valorServico: '',
    percentualEntrada: '',
    tipoServico: '',
    prioridade: 'media' as 'baixa' | 'media' | 'alta' | 'urgente',
    status: 'lead' as 'lead' | 'ativo' | 'pausado' | 'encerrado',
  });

  // Historico form state
  const [historicoForm, setHistoricoForm] = useState({
    descricao: '',
    tipo: 'ligacao' as 'ligacao' | 'email' | 'reuniao' | 'whatsapp' | 'outro',
  });

  const filteredClientes = useMemo(() => {
    return clientes.filter(cliente => {
      const matchesSearch = 
        (cliente.nomeEmpresa || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cliente.nomeResponsavel || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cliente.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cliente.telefone || cliente.contato || '').includes(searchQuery);
      
      const matchesStatus = statusFilter === 'all' || cliente.status === statusFilter;
      const matchesTipo = tipoFilter === 'all' || cliente.tipo === tipoFilter;
      
      return matchesSearch && matchesStatus && matchesTipo;
    });
  }, [clientes, searchQuery, statusFilter, tipoFilter]);

  const handleOpenModal = (cliente?: Cliente) => {
    if (cliente) {
      setSelectedCliente(cliente);
      setFormData({
        nomeEmpresa: cliente.nomeEmpresa,
        nomeResponsavel: cliente.nomeResponsavel,
        contato: cliente.contato || cliente.telefone || '',
        email: cliente.email,
        endereco: cliente.endereco,
        observacoes: cliente.observacoes,
        tipo: cliente.tipo,
        valorMensal: cliente.valorMensal?.toString() || '',
        diaPagamento: cliente.diaPagamento?.toString() || '',
        duracaoContrato: cliente.duracaoContrato?.toString() || '',
        custoFixoTerceiro: cliente.custoFixoTerceiro?.toString() || '',
        valorServico: cliente.valorServico?.toString() || '',
        percentualEntrada: cliente.percentualEntrada?.toString() || '',
        tipoServico: cliente.tipoServico,
        prioridade: cliente.prioridade,
        status: cliente.status,
      });
      setIsEditing(true);
    } else {
      setSelectedCliente(null);
      setFormData({
        nomeEmpresa: '',
        nomeResponsavel: '',
        contato: '',
        email: '',
        endereco: '',
        observacoes: '',
        tipo: 'avulso',
        valorMensal: '',
        diaPagamento: '',
        duracaoContrato: '',
        custoFixoTerceiro: '',
        valorServico: '',
        percentualEntrada: '',
        tipoServico: '',
        prioridade: 'media',
        status: 'lead',
      });
      setIsEditing(false);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    const clienteData = {
      ...formData,
      telefone: formData.contato,
      whatsapp: formData.contato,
      valorMensal: formData.tipo === 'recorrente' ? parseFloat(formData.valorMensal) || 0 : undefined,
      diaPagamento: formData.tipo === 'recorrente' ? parseInt(formData.diaPagamento) || 1 : undefined,
      duracaoContrato: formData.tipo === 'recorrente' ? parseInt(formData.duracaoContrato) || 12 : undefined,
      custoFixoTerceiro: parseFloat(formData.custoFixoTerceiro) || undefined,
      valorServico: formData.tipo === 'avulso' ? parseFloat(formData.valorServico) || 0 : undefined,
      percentualEntrada: formData.tipo === 'avulso' ? parseFloat(formData.percentualEntrada) || 0 : undefined,
      historico: [],
    };

    if (isEditing && selectedCliente) {
      onUpdateCliente(selectedCliente.id, clienteData);
    } else {
      onAddCliente(clienteData);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      onDeleteCliente(id);
    }
  };

  const handleViewCliente = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setIsViewModalOpen(true);
  };

  const handleAddHistorico = () => {
    if (selectedCliente && historicoForm.descricao) {
      onAddHistorico(selectedCliente.id, {
        data: new Date().toISOString(),
        descricao: historicoForm.descricao,
        tipo: historicoForm.tipo,
      });
      setHistoricoForm({ descricao: '', tipo: 'ligacao' });
    }
  };

  const openWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${cleanPhone}`, '_blank');
  };

  const columns = [
    {
      key: 'nomeEmpresa',
      header: 'Empresa/Cliente',
      render: (cliente: Cliente) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="font-medium">{cliente.nomeEmpresa}</p>
            <p className="text-sm text-muted-foreground">{cliente.nomeResponsavel}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'tipo',
      header: 'Tipo',
      render: (cliente: Cliente) => (
        <BadgeStatus status={cliente.tipo} />
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (cliente: Cliente) => (
        <BadgeStatus status={cliente.status} />
      ),
    },
    {
      key: 'prioridade',
      header: 'Prioridade',
      render: (cliente: Cliente) => (
        <PriorityBadge priority={cliente.prioridade} />
      ),
    },
    {
      key: 'contato',
      header: 'Contato',
      render: (cliente: Cliente) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-3 h-3 text-muted-foreground" />
            {cliente.contato || cliente.telefone}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Mail className="w-3 h-3 text-muted-foreground" />
            <span className="truncate max-w-[150px]">{cliente.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'acoes',
      header: 'Ações',
      render: (cliente: Cliente) => (
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => handleViewCliente(cliente)}
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => handleOpenModal(cliente)}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => openWhatsApp(cliente.whatsapp)}
          >
            <MessageCircle className="w-4 h-4 text-emerald-600" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => handleDelete(cliente.id)}
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDateSafe = (dateStr: string) => {
    if (!dateStr) return 'Não informada';
    try {
      if (dateStr.includes('/')) return dateStr;
      return format(parseISO(dateStr), 'dd/MM/yyyy', { locale: ptBR });
    } catch (e) {
      return 'Data inválida';
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{t('nav.crm')}</h2>
          <p className="text-muted-foreground">Gerencie seus clientes e leads</p>
        </div>
        <div className="flex items-center gap-3">
          <ReportControls 
            onExportPdf={exportToPdf}
            onExportTxt={() => {
              const txt = generateCRMTxt(filteredClientes, t);
              downloadTxt('relatorio-crm', txt);
            }}
          />
          <Button onClick={() => handleOpenModal()} className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Cliente
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
        <Card className="rounded-3xl shadow-md hover:shadow-lg transition-all border-border/50 p-2">
          <CardContent className="p-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Total</p>
            <p className="text-3xl font-black tracking-tight mt-1">{clientes.length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl shadow-md hover:shadow-lg transition-all border-emerald-500/20 p-2 bg-gradient-to-br from-emerald-50/50 to-transparent dark:from-emerald-950/20">
          <CardContent className="p-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Ativos</p>
            <p className="text-3xl font-black tracking-tight text-emerald-600 mt-1">
              {clientes.filter(c => c.status === 'ativo').length}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl shadow-md hover:shadow-lg transition-all border-blue-500/20 p-2 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-950/20">
          <CardContent className="p-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">Leads</p>
            <p className="text-3xl font-black tracking-tight text-blue-600 mt-1">
              {clientes.filter(c => c.status === 'lead').length}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl shadow-md hover:shadow-lg transition-all border-purple-500/20 p-2 bg-gradient-to-br from-purple-50/50 to-transparent dark:from-purple-950/20">
          <CardContent className="p-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400">Recorrentes</p>
            <p className="text-3xl font-black tracking-tight text-purple-600 mt-1">
              {clientes.filter(c => c.tipo === 'recorrente').length}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl shadow-md hover:shadow-lg transition-all border-orange-500/20 p-2 bg-gradient-to-br from-orange-50/50 to-transparent dark:from-orange-950/20">
          <CardContent className="p-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400">Avulsos</p>
            <p className="text-3xl font-black tracking-tight text-orange-600 mt-1">
              {clientes.filter(c => c.tipo === 'avulso').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente..."
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
            {statusOptions?.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={tipoFilter} onValueChange={setTipoFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {tipoOptions?.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredClientes}
        keyExtractor={(item) => item.id}
        emptyMessage="Nenhum cliente encontrado"
      />

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto sm:rounded-3xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome da Empresa/Cliente *</Label>
                <Input
                  value={formData.nomeEmpresa}
                  onChange={(e) => setFormData({ ...formData, nomeEmpresa: e.target.value })}
                  placeholder="Ex: TechFlow Solutions"
                />
              </div>
              <div className="space-y-2">
                <Label>Nome do Responsável *</Label>
                <Input
                  value={formData.nomeResponsavel}
                  onChange={(e) => setFormData({ ...formData, nomeResponsavel: e.target.value })}
                  placeholder="Ex: Carlos Mendes"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Contato (Telefone/WhatsApp) *</Label>
              <Input
                value={formData.contato}
                onChange={(e) => setFormData({ ...formData, contato: e.target.value })}
                placeholder="(11) 98765-4321"
              />
            </div>

            <div className="space-y-2">
              <Label>E-mail *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@empresa.com"
              />
            </div>

            <div className="space-y-2">
              <Label>Endereço</Label>
              <Input
                value={formData.endereco}
                onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                placeholder="Av. Principal, 100 - Cidade/UF"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select 
                  value={formData.tipo} 
                  onValueChange={(v: 'recorrente' | 'avulso') => setFormData({ ...formData, tipo: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tipoOptions?.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status *</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(v: 'lead' | 'ativo' | 'pausado' | 'encerrado') => setFormData({ ...formData, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions?.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Prioridade *</Label>
                <Select 
                  value={formData.prioridade} 
                  onValueChange={(v: 'baixa' | 'media' | 'alta' | 'urgente') => setFormData({ ...formData, prioridade: v })}
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

            {formData.tipo === 'recorrente' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Valor Mensal (R$)</Label>
                  <Input
                    type="number"
                    value={formData.valorMensal}
                    onChange={(e) => setFormData({ ...formData, valorMensal: e.target.value })}
                    placeholder="0,00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Dia de Pagamento</Label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.diaPagamento}
                    onChange={(e) => setFormData({ ...formData, diaPagamento: e.target.value })}
                    placeholder="1-31"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duração (meses)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.duracaoContrato}
                    onChange={(e) => setFormData({ ...formData, duracaoContrato: e.target.value })}
                    placeholder="12"
                  />
                </div>
              </div>
            )}

            {formData.tipo === 'avulso' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor do Serviço (R$)</Label>
                  <Input
                    type="number"
                    value={formData.valorServico}
                    onChange={(e) => setFormData({ ...formData, valorServico: e.target.value })}
                    placeholder="0,00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Percentual de Entrada (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.percentualEntrada}
                    onChange={(e) => setFormData({ ...formData, percentualEntrada: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Serviço *</Label>
                <Input
                  value={formData.tipoServico}
                  onChange={(e) => setFormData({ ...formData, tipoServico: e.target.value })}
                  placeholder="Ex: Produção de Vídeos Corporativos"
                />
              </div>
              <div className="space-y-2">
                <Label>Custo Fixo Terceiro (R$) <span className="text-xs text-muted-foreground font-normal">(Opcional)</span></Label>
                <Input
                  type="number"
                  value={formData.custoFixoTerceiro}
                  onChange={(e) => setFormData({ ...formData, custoFixoTerceiro: e.target.value })}
                  placeholder="0,00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Informações adicionais sobre o cliente..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {isEditing ? 'Salvar Alterações' : 'Cadastrar Cliente'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto sm:rounded-3xl p-6 shadow-2xl">
          {selectedCliente && (
            <div className="p-2">
              <DialogHeader>
                <div className="flex items-center justify-between pr-10">
                  <DialogTitle className="text-3xl font-black tracking-tight">{selectedCliente.nomeEmpresa}</DialogTitle>
                  <div className="flex items-center gap-2">
                    <BadgeStatus status={selectedCliente.status} />
                    <BadgeStatus status={selectedCliente.tipo} />
                  </div>
                </div>
              </DialogHeader>

              <Tabs defaultValue="info" className="w-full mt-8">
                <TabsList className="grid w-full grid-cols-3 bg-muted/60 p-1.5 rounded-2xl">
                  <TabsTrigger value="info" className="rounded-xl font-medium data-[state=active]:shadow-sm">Informações</TabsTrigger>
                  <TabsTrigger value="historico" className="rounded-xl font-medium data-[state=active]:shadow-sm">Histórico</TabsTrigger>
                  <TabsTrigger value="observacoes" className="rounded-xl font-medium data-[state=active]:shadow-sm">Observações</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="mt-8 space-y-8">
                  <div className="flex flex-col xl:flex-row gap-8">
                    {/* Left Column: Client Core Info */}
                    <div className="flex-1 flex flex-col gap-6 bg-gradient-to-br from-indigo-50/80 to-purple-50/80 dark:from-indigo-950/40 dark:to-purple-950/40 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 shadow-lg relative overflow-hidden">
                      <div className="absolute -right-10 -top-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                      
                      <div className="space-y-6 relative z-10">
                        <div className="flex flex-col gap-2">
                          <p className="text-xs font-bold text-indigo-600/70 dark:text-indigo-400/80 uppercase tracking-[0.2em] flex items-center gap-2">
                            <User className="w-4 h-4" /> Responsável
                          </p>
                          <p className="text-3xl font-black text-indigo-950 dark:text-indigo-50 tracking-tight">{selectedCliente.nomeResponsavel}</p>
                        </div>

                        <div className="w-full h-px bg-indigo-200/60 dark:bg-indigo-800/40" />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <p className="text-xs font-bold text-indigo-600/70 dark:text-indigo-400/80 uppercase tracking-[0.2em] flex items-center gap-2">
                              <Phone className="w-4 h-4" /> Contato
                            </p>
                            <div className="flex items-center gap-3 bg-white/40 dark:bg-black/20 px-4 py-2.5 rounded-xl border border-indigo-200/50 dark:border-indigo-800/50 w-fit backdrop-blur-sm">
                              <p className="font-bold text-lg">{selectedCliente.contato || selectedCliente.telefone}</p>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-full transition-colors"
                                onClick={() => openWhatsApp(selectedCliente.contato || selectedCliente.telefone)}
                              >
                                <MessageCircle className="w-5 h-5" />
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <p className="text-xs font-bold text-indigo-600/70 dark:text-indigo-400/80 uppercase tracking-[0.2em] flex items-center gap-2">
                              <Mail className="w-4 h-4" /> E-mail
                            </p>
                            <a 
                              href={`mailto:${selectedCliente.email}`}
                              className="inline-flex items-center gap-2 bg-white/40 dark:bg-black/20 px-4 py-3 rounded-xl border border-indigo-200/50 dark:border-indigo-800/50 font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors w-fit backdrop-blur-sm break-all"
                            >
                              {selectedCliente.email}
                            </a>
                          </div>
                        </div>

                        <div className="space-y-2 pt-2">
                          <p className="text-xs font-bold text-indigo-600/70 dark:text-indigo-400/80 uppercase tracking-[0.2em] flex items-center gap-2">
                            <MapPin className="w-4 h-4" /> Endereço
                          </p>
                          <p className="font-semibold text-lg text-indigo-950/80 dark:text-indigo-100/80">
                            {selectedCliente.endereco || 'Endereço não informado'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Financials & Details */}
                    <div className="flex-1 flex flex-col gap-6">
                      {/* Service Type & Date */}
                      <div className="flex flex-col sm:flex-row gap-6">
                        <div className="flex-1 p-6 bg-card rounded-2xl border border-border/60 shadow-lg relative overflow-hidden">
                          <div className="absolute -right-4 -bottom-4 opacity-[0.03] pointer-events-none">
                            <CheckCircle2 className="w-32 h-32" />
                          </div>
                          <p className="text-xs font-bold text-muted-foreground/80 uppercase tracking-[0.2em] flex items-center gap-2 mb-3">
                            <CheckCircle2 className="w-4 h-4" /> Tipo de Serviço
                          </p>
                          <p className="font-black text-2xl tracking-tight text-foreground relative z-10">{selectedCliente.tipoServico}</p>
                        </div>
                        
                        <div className="flex-1 p-6 bg-card rounded-2xl border border-border/60 shadow-lg relative overflow-hidden">
                          <div className="absolute -right-4 -bottom-4 opacity-[0.03] pointer-events-none">
                            <Calendar className="w-32 h-32" />
                          </div>
                          <p className="text-xs font-bold text-muted-foreground/80 uppercase tracking-[0.2em] flex items-center gap-2 mb-3">
                            <Calendar className="w-4 h-4" /> Data Cadastro
                          </p>
                          <p className="font-black text-2xl tracking-tight text-foreground relative z-10">
                            {formatDateSafe(selectedCliente.dataCadastro)}
                          </p>
                        </div>
                      </div>

                      {/* Financials Card */}
                      {((selectedCliente.valorMensal ?? 0) > 0 || (selectedCliente.valorServico ?? 0) > 0) && (
                        <div className="p-8 bg-card rounded-[2rem] border border-border/60 shadow-lg relative overflow-hidden flex-1 flex flex-col justify-center">
                          <div className="absolute -right-10 -bottom-10 opacity-[0.03] pointer-events-none">
                            <DollarSign className="w-64 h-64" />
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 relative z-10">
                            {selectedCliente.valorMensal && (
                              <div className="space-y-3">
                                <p className="text-xs font-bold text-muted-foreground/80 uppercase tracking-[0.2em] flex items-center gap-2">
                                  <DollarSign className="w-4 h-4 text-emerald-500" /> Valor Mensal
                                </p>
                                <p className="text-5xl font-black tracking-tighter text-emerald-600 dark:text-emerald-400">
                                  {formatCurrency(selectedCliente.valorMensal)}
                                </p>
                              </div>
                            )}

                            {(selectedCliente.valorServico ?? 0) > 0 && (
                              <div className="space-y-3">
                                <p className="text-xs font-bold text-muted-foreground/80 uppercase tracking-[0.2em] flex items-center gap-2">
                                  <DollarSign className="w-4 h-4 text-emerald-500" /> Valor do Serviço
                                </p>
                                <p className="text-5xl font-black tracking-tighter text-emerald-600 dark:text-emerald-400">
                                  {formatCurrency(selectedCliente.valorServico!)}
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-4 mt-8 pt-6 border-t border-border/50 relative z-10">
                            {(selectedCliente.percentualEntrada ?? 0) > 0 && (
                              <span className="bg-muted px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 border border-border/60 uppercase tracking-wider text-xs">
                                Entrada: <span className="text-foreground">{selectedCliente.percentualEntrada}%</span>
                              </span>
                            )}
                            {(selectedCliente.custoFixoTerceiro ?? 0) > 0 && (
                              <span className="bg-red-500/10 text-red-600 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 border border-red-200 dark:border-red-900/30 uppercase tracking-wider text-xs">
                                Custo Terceiro: -{formatCurrency(selectedCliente.custoFixoTerceiro!)}
                              </span>
                            )}
                            <div className="ml-auto flex items-center gap-3">
                              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Prioridade</span>
                              <PriorityBadge priority={selectedCliente.prioridade} />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="historico" className="space-y-4">
                  {/* Add Historico */}
                  <div className="p-4 bg-muted rounded-lg space-y-3">
                    <p className="font-medium text-sm">Adicionar Interação</p>
                    <div className="flex gap-2">
                      <Select 
                        value={historicoForm.tipo} 
                        onValueChange={(v: 'ligacao' | 'email' | 'reuniao' | 'whatsapp' | 'outro') => 
                          setHistoricoForm({ ...historicoForm, tipo: v })
                        }
                      >
                        <SelectTrigger className="w-[150px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {historicoTipoOptions?.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Descrição da interação..."
                        value={historicoForm.descricao}
                        onChange={(e) => setHistoricoForm({ ...historicoForm, descricao: e.target.value })}
                        className="flex-1"
                      />
                      <Button onClick={handleAddHistorico} size="sm">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Historico List */}
                  <div className="space-y-3">
                    {(!selectedCliente.historico || selectedCliente.historico.length === 0) ? (
                      <p className="text-center text-muted-foreground py-4">Nenhum histórico registrado</p>
                    ) : (
                      selectedCliente.historico
                        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
                        .map((item) => (
                          <div key={item.id} className="flex gap-3 p-3 border rounded-lg">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                              <History className="w-4 h-4 text-indigo-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {historicoTipoOptions.find(o => o.value === item.tipo)?.label}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {formatDateSafe(item.data)}
                                </span>
                              </div>
                              <p className="mt-1 text-sm">{item.descricao}</p>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="observacoes">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">
                      {selectedCliente.observacoes || 'Nenhuma observação registrada.'}
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
