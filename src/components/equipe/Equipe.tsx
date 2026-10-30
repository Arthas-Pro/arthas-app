import { useState, useMemo } from 'react';
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
import { DataTable } from '@/components/ui-custom/DataTable';
import { StatCard } from '@/components/ui-custom/StatCard';
import type { Freelancer, Projeto } from '@/types';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Eye,
  Phone,
  Mail,
  MessageCircle,
  DollarSign,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EquipeProps {
  freelancers: Freelancer[];
  projetos: Projeto[];
  onAddFreelancer: (freelancer: Omit<Freelancer, 'id' | 'projetos'>) => void;
  onUpdateFreelancer: (id: string, updates: Partial<Freelancer>) => void;
  onDeleteFreelancer: (id: string) => void;
}

const disponibilidadeOptions = [
  { value: 'disponivel', label: 'Disponível', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { value: 'ocupado', label: 'Ocupado', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'indisponivel', label: 'Indisponível', color: 'bg-red-100 text-red-700 border-red-200' },
];

const funcaoOptions = [
  'Cinegrafista',
  'Editor de Vídeo',
  'Editora de Vídeo',
  'Roteirista',
  'Fotógrafo',
  'Fotógrafa',
  'Operador de Drone',
  'Assistente de Produção',
  'Diretor',
  'Produtor',
  'Motion Designer',
  'Colorista',
  'Sonorização',
  'Outro',
];

export function Equipe({ 
  freelancers, 
  projetos,
  onAddFreelancer, 
  onUpdateFreelancer, 
  onDeleteFreelancer 
}: EquipeProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [disponibilidadeFilter, setDisponibilidadeFilter] = useState('');
  const [funcaoFilter, setFuncaoFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedFreelancer, setSelectedFreelancer] = useState<Freelancer | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    nome: '',
    funcao: '',
    telefone: '',
    whatsapp: '',
    email: '',
    valorDiaria: '',
    valorHora: '',
    disponibilidade: 'disponivel' as 'disponivel' | 'ocupado' | 'indisponivel',
    tipoContrato: 'freelancer' as 'freelancer' | 'clt' | 'pj',
    documento: '',
    chavePix: '',
    dataPagamento: '',
    observacoes: '',
  });

  const filteredFreelancers = useMemo(() => {
    return freelancers.filter(freel => {
      const matchesSearch = 
        (freel.nome || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (freel.funcao || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (freel.email || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesDisponibilidade = !disponibilidadeFilter || freel.disponibilidade === disponibilidadeFilter;
      const matchesFuncao = funcaoFilter === 'all' || freel.funcao === funcaoFilter;
      
      return matchesSearch && matchesDisponibilidade && matchesFuncao;
    });
  }, [freelancers, searchQuery, disponibilidadeFilter, funcaoFilter]);

  // Estatísticas
  const stats = useMemo(() => {
    const total = freelancers.length;
    const disponiveis = freelancers.filter(f => f.disponibilidade === 'disponivel').length;
    const ocupados = freelancers.filter(f => f.disponibilidade === 'ocupado').length;
    const indisponiveis = freelancers.filter(f => f.disponibilidade === 'indisponivel').length;
    
    return { total, disponiveis, ocupados, indisponiveis };
  }, [freelancers]);

  const handleOpenModal = (freelancer?: Freelancer) => {
    if (freelancer) {
      setSelectedFreelancer(freelancer);
      setFormData({
        nome: freelancer.nome,
        funcao: freelancer.funcao,
        telefone: freelancer.telefone,
        whatsapp: freelancer.whatsapp,
        email: freelancer.email,
        valorDiaria: freelancer.valorDiaria.toString(),
        valorHora: freelancer.valorHora.toString(),
        disponibilidade: freelancer.disponibilidade,
        tipoContrato: freelancer.tipoContrato || 'freelancer',
        documento: freelancer.documento || '',
        chavePix: freelancer.chavePix || '',
        dataPagamento: freelancer.dataPagamento || '',
        observacoes: freelancer.observacoes,
      });
      setIsEditing(true);
    } else {
      setSelectedFreelancer(null);
      setFormData({
        nome: '',
        funcao: '',
        telefone: '',
        whatsapp: '',
        email: '',
        valorDiaria: '',
        valorHora: '',
        disponibilidade: 'disponivel',
        tipoContrato: 'freelancer',
        documento: '',
        chavePix: '',
        dataPagamento: '',
        observacoes: '',
      });
      setIsEditing(false);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    const freelancerData = {
      ...formData,
      valorDiaria: parseFloat(formData.valorDiaria) || 0,
      valorHora: parseFloat(formData.valorHora) || 0,
    };

    if (isEditing && selectedFreelancer) {
      onUpdateFreelancer(selectedFreelancer.id, freelancerData);
    } else {
      onAddFreelancer(freelancerData);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este freelancer?')) {
      onDeleteFreelancer(id);
    }
  };

  const handleViewFreelancer = (freelancer: Freelancer) => {
    setSelectedFreelancer(freelancer);
    setIsViewModalOpen(true);
  };

  const openWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${cleanPhone}`, '_blank');
  };

  const getDisponibilidadeConfig = (disp: Freelancer['disponibilidade']) => {
    return disponibilidadeOptions.find(o => o.value === disp) || disponibilidadeOptions[0];
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const columns = [
    {
      key: 'nome',
      header: 'Freelancer',
      render: (freel: Freelancer) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
            <span className="text-white font-bold">{freel.nome.charAt(0)}</span>
          </div>
          <div>
            <p className="font-medium">{freel.nome}</p>
            <p className="text-sm text-muted-foreground">{freel.funcao}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'disponibilidade',
      header: 'Disponibilidade',
      render: (freel: Freelancer) => {
        const config = getDisponibilidadeConfig(freel.disponibilidade);
        return (
          <Badge className={config.color}>
            {config.label}
          </Badge>
        );
      },
    },
    {
      key: 'contato',
      header: 'Contato',
      render: (freel: Freelancer) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-3 h-3 text-muted-foreground" />
            {freel.telefone}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Mail className="w-3 h-3 text-muted-foreground" />
            <span className="truncate max-w-[150px]">{freel.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'valores',
      header: 'Valores',
      render: (freel: Freelancer) => (
        <div className="space-y-1">
          <p className="text-sm">
            <span className="text-muted-foreground">Diária:</span>{' '}
            <span className="font-medium">{formatCurrency(freel.valorDiaria)}</span>
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">Hora:</span>{' '}
            <span className="font-medium">{formatCurrency(freel.valorHora)}</span>
          </p>
        </div>
      ),
    },
    {
      key: 'acoes',
      header: 'Ações',
      render: (freel: Freelancer) => (
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => handleViewFreelancer(freel)}
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => handleOpenModal(freel)}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => openWhatsApp(freel.whatsapp)}
          >
            <MessageCircle className="w-4 h-4 text-emerald-600" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => handleDelete(freel.id)}
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Equipe / Freelancers</h2>
          <p className="text-muted-foreground">Gerencie sua equipe externa</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="gap-2">
          <Plus className="w-4 h-4" />
          Novo
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <StatCard
          title="Total"
          value={stats.total}
          icon={Users}
          iconClassName="bg-indigo-100 text-indigo-600"
        />
        <StatCard
          title="Disponíveis"
          value={stats.disponiveis}
          icon={CheckCircle2}
          iconClassName="bg-emerald-100 text-emerald-600"
        />
        <StatCard
          title="Ocupados"
          value={stats.ocupados}
          icon={Clock}
          iconClassName="bg-amber-100 text-amber-600"
        />
        <StatCard
          title="Indisponíveis"
          value={stats.indisponiveis}
          icon={XCircle}
          iconClassName="bg-red-100 text-red-600"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar freelancer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={disponibilidadeFilter} onValueChange={setDisponibilidadeFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Disponibilidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {disponibilidadeOptions?.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={funcaoFilter} onValueChange={setFuncaoFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Função" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {funcaoOptions?.map(func => (
              <SelectItem key={func} value={func}>{func}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredFreelancers}
        keyExtractor={(item) => item.id}
        emptyMessage="Nenhum freelancer encontrado"
      />

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto sm:rounded-3xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Editar Freelancer' : 'Novo Freelancer'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome Completo *</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Pedro Costa"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Função *</Label>
                <Select 
                  value={formData.funcao} 
                  onValueChange={(v) => setFormData({ ...formData, funcao: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {funcaoOptions?.map(func => (
                      <SelectItem key={func} value={func}>{func}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Disponibilidade *</Label>
                <Select 
                  value={formData.disponibilidade} 
                  onValueChange={(v: 'disponivel' | 'ocupado' | 'indisponivel') => 
                    setFormData({ ...formData, disponibilidade: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {disponibilidadeOptions?.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Contrato *</Label>
                <Select 
                  value={formData.tipoContrato} 
                  onValueChange={(v: 'freelancer' | 'clt' | 'pj') => 
                    setFormData({ ...formData, tipoContrato: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="freelancer">Freelancer</SelectItem>
                    <SelectItem value="clt">CLT</SelectItem>
                    <SelectItem value="pj">PJ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Telefone *</Label>
                <Input
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  placeholder="(11) 3456-7890"
                />
              </div>
              <div className="space-y-2">
                <Label>WhatsApp *</Label>
                <Input
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>

            {(formData.tipoContrato === 'pj' || formData.tipoContrato === 'clt') && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-muted/50 p-4 rounded-lg border border-border/50">
                <div className="space-y-2">
                  <Label>Documento (CPF/CNPJ)</Label>
                  <Input
                    value={formData.documento}
                    onChange={(e) => setFormData({ ...formData, documento: e.target.value })}
                    placeholder="000.000.000-00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Chave PIX / Dados Bancários</Label>
                  <Input
                    value={formData.chavePix}
                    onChange={(e) => setFormData({ ...formData, chavePix: e.target.value })}
                    placeholder="Email, Telefone ou CPF"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data de Pagamento</Label>
                  <Input
                    type="date"
                    value={formData.dataPagamento}
                    onChange={(e) => setFormData({ ...formData, dataPagamento: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>E-mail *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor da Diária (R$)</Label>
                <Input
                  type="number"
                  value={formData.valorDiaria}
                  onChange={(e) => setFormData({ ...formData, valorDiaria: e.target.value })}
                  placeholder="0,00"
                />
              </div>
              <div className="space-y-2">
                <Label>Valor da Hora (R$)</Label>
                <Input
                  type="number"
                  value={formData.valorHora}
                  onChange={(e) => setFormData({ ...formData, valorHora: e.target.value })}
                  placeholder="0,00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Informações adicionais sobre o freelancer..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {isEditing ? 'Salvar Alterações' : 'Cadastrar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto sm:rounded-2xl p-0 border-0 shadow-2xl bg-card overflow-hidden">
          {selectedFreelancer && (
            <div className="flex flex-col xl:flex-row h-full relative">
              {/* Left Column: ID Card Profile */}
              <div className="flex-1 p-6 md:p-8 flex flex-col items-center justify-center text-center bg-gradient-to-br from-indigo-50/80 to-purple-50/80 dark:from-indigo-950/40 dark:to-purple-950/40 relative overflow-hidden xl:min-w-[320px]">
                <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-30 pointer-events-none -mr-20 -mt-20 bg-indigo-500/20" />
                
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl mb-6 relative z-10 border-4 border-white/50 dark:border-black/50 backdrop-blur-md">
                  <span className="text-white text-4xl font-black">{selectedFreelancer.nome.charAt(0)}</span>
                </div>
                
                <h2 className="text-3xl font-black text-indigo-950 dark:text-indigo-50 tracking-tight mb-2 relative z-10">
                  {selectedFreelancer.nome}
                </h2>
                <p className="text-sm font-bold text-indigo-600/80 dark:text-indigo-400 uppercase tracking-widest relative z-10 mb-6">
                  {selectedFreelancer.funcao}
                </p>

                <Badge className={cn("px-4 py-1.5 rounded-full uppercase tracking-widest text-xs font-bold shadow-sm relative z-10", getDisponibilidadeConfig(selectedFreelancer.disponibilidade).color)}>
                  {getDisponibilidadeConfig(selectedFreelancer.disponibilidade).label}
                </Badge>
              </div>

              {/* Right Column: Details & Finances */}
              <div className="flex-[2] p-6 md:p-8 flex flex-col gap-8 bg-card relative z-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5" /> Contato
                    </p>
                    <div className="flex items-center gap-3 bg-muted/30 dark:bg-muted/10 p-3 rounded-2xl border border-border/40 w-fit backdrop-blur-sm">
                      <p className="font-bold text-lg">{selectedFreelancer.telefone}</p>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-full transition-colors"
                        onClick={() => openWhatsApp(selectedFreelancer.whatsapp)}
                      >
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5" /> E-mail
                    </p>
                    <a 
                      href={`mailto:${selectedFreelancer.email}`}
                      className="inline-flex bg-muted/30 dark:bg-muted/10 p-3 rounded-2xl border border-border/40 font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors w-fit backdrop-blur-sm"
                    >
                      {selectedFreelancer.email}
                    </a>
                  </div>
                </div>

                <div className="w-full h-px bg-border/50" />

                {/* Finances & Contract */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 uppercase tracking-widest px-3 py-1">
                      Contrato: {selectedFreelancer.tipoContrato || 'Freelancer'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-muted/20 dark:bg-muted/10 p-6 rounded-2xl border border-border/50">
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-emerald-500" /> Valor Diária
                      </p>
                      <p className="text-3xl font-black text-foreground tracking-tight">
                        {formatCurrency(selectedFreelancer.valorDiaria)}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-emerald-500" /> Valor Hora
                      </p>
                      <p className="text-3xl font-black text-foreground tracking-tight">
                        {formatCurrency(selectedFreelancer.valorHora)}
                      </p>
                    </div>
                  </div>
                </div>

                {(selectedFreelancer.tipoContrato === 'pj' || selectedFreelancer.tipoContrato === 'clt') && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 bg-indigo-50/50 dark:bg-indigo-950/20 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-900/30">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-indigo-600/70 dark:text-indigo-400/80 uppercase tracking-widest">Documento</p>
                      <p className="font-bold text-sm">{selectedFreelancer.documento || '-'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-indigo-600/70 dark:text-indigo-400/80 uppercase tracking-widest">Chave PIX/Banco</p>
                      <p className="font-bold text-sm truncate">{selectedFreelancer.chavePix || '-'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-indigo-600/70 dark:text-indigo-400/80 uppercase tracking-widest">Data Pgto</p>
                      <p className="font-bold text-sm">
                        {selectedFreelancer.dataPagamento ? selectedFreelancer.dataPagamento.split('-').reverse().join('/') : '-'}
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Observações</p>
                  <p className="text-sm text-foreground/80 leading-relaxed bg-muted/20 p-5 rounded-2xl border border-border/40">
                    {selectedFreelancer.observacoes || <span className="italic opacity-60">Nenhuma observação</span>}
                  </p>
                </div>

                {selectedFreelancer.projetos.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Projetos Participados</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedFreelancer.projetos?.map((projId) => {
                        const projeto = projetos.find(p => p.id === projId);
                        return projeto ? (
                          <Badge key={projId} variant="secondary" className="px-3 py-1 rounded-xl">
                            {projeto.nome}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-4 pt-6 mt-auto">
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="rounded-xl px-6 font-bold"
                    onClick={() => {
                      setIsViewModalOpen(false);
                      handleOpenModal(selectedFreelancer);
                    }}
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
