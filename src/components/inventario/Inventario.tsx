import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { StatCard } from '@/components/ui-custom/StatCard';
import type { Equipamento, Freelancer } from '@/types';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Eye,
  Package,
  Search,
  Filter,
  Camera,
  Video,
  Mic,
  Lightbulb,
  CheckCircle2,
  Wrench,
  DollarSign,
  BarChart3,
  User as UserIcon,
  Barcode
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface InventarioProps {
  equipamentos: Equipamento[];
  freelancers?: Freelancer[];
  onAddEquipamento: (equipamento: Omit<Equipamento, 'id'>) => void;
  onUpdateEquipamento: (id: string, updates: Partial<Equipamento>) => void;
  onDeleteEquipamento: (id: string) => void;
}

const statusOptions = [
  { value: 'disponivel', label: 'Disponível' },
  { value: 'em-uso', label: 'Em Uso' },
  { value: 'manutencao', label: 'Manutenção' },
  { value: 'indisponivel', label: 'Indisponível' },
];

const conservacaoOptions = [
  { value: 'excelente', label: 'Excelente' },
  { value: 'bom', label: 'Bom' },
  { value: 'regular', label: 'Regular' },
  { value: 'ruim', label: 'Ruim' },
];

const categoriaOptions = [
  'Câmeras',
  'Lentes',
  'Drones',
  'Estabilizadores',
  'Iluminação',
  'Áudio',
  'Acessórios',
];

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'];

export function Inventario({ 
  equipamentos, 
  freelancers = [],
  onAddEquipamento, 
  onUpdateEquipamento, 
  onDeleteEquipamento 
}: InventarioProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoriaFilter, setCategoriaFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedEquipamento, setSelectedEquipamento] = useState<Equipamento | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerInput, setScannerInput] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    nome: '',
    categoria: '',
    marca: '',
    modelo: '',
    numeroSerie: '',
    dataAquisicao: '',
    valorCompra: '',
    estadoConservacao: 'bom' as 'excelente' | 'bom' | 'regular' | 'ruim',
    status: 'disponivel' as 'disponivel' | 'em-uso' | 'manutencao' | 'indisponivel',
    observacoes: '',
    responsavelId: 'none',
    responsavelNome: '',
  });

  const filteredEquipamentos = useMemo(() => {
    return equipamentos.filter(equip => {
      const matchesSearch = 
        (equip.nome || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (equip.marca || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (equip.modelo || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (equip.numeroSerie || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || equip.status === statusFilter;
      const matchesCategoria = categoriaFilter === 'all' || equip.categoria === categoriaFilter;
      
      return matchesSearch && matchesStatus && matchesCategoria;
    });
  }, [equipamentos, searchQuery, statusFilter, categoriaFilter]);

  // Estatísticas
  const stats = useMemo(() => {
    const total = equipamentos.length;
    const disponiveis = equipamentos.filter(e => e.status === 'disponivel').length;
    const emUso = equipamentos.filter(e => e.status === 'em-uso').length;
    const manutencao = equipamentos.filter(e => e.status === 'manutencao').length;
    const indisponivel = equipamentos.filter(e => e.status === 'indisponivel').length;
    const valorTotal = equipamentos.reduce((sum, e) => sum + e.valorCompra, 0);
    
    return { total, disponiveis, emUso, manutencao, indisponivel, valorTotal };
  }, [equipamentos]);

  // Dados para gráficos
  const dadosStatus = useMemo(() => [
    { name: 'Disponíveis', value: stats.disponiveis },
    { name: 'Em Uso', value: stats.emUso },
    { name: 'Manutenção', value: stats.manutencao },
    { name: 'Indisponível', value: stats.indisponivel },
  ], [stats]);

  const dadosCategoria = useMemo(() => {
    const porCategoria: Record<string, number> = {};
    equipamentos.forEach(e => {
      porCategoria[e.categoria] = (porCategoria[e.categoria] || 0) + 1;
    });
    return Object.entries(porCategoria)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [equipamentos]);

  const dadosValorCategoria = useMemo(() => {
    const porCategoria: Record<string, number> = {};
    equipamentos.forEach(e => {
      porCategoria[e.categoria] = (porCategoria[e.categoria] || 0) + e.valorCompra;
    });
    return Object.entries(porCategoria)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [equipamentos]);

  const handleOpenModal = (equipamento?: Equipamento) => {
    if (equipamento) {
      setSelectedEquipamento(equipamento);
      setFormData({
        nome: equipamento.nome,
        categoria: equipamento.categoria,
        marca: equipamento.marca,
        modelo: equipamento.modelo,
        numeroSerie: equipamento.numeroSerie,
        dataAquisicao: equipamento.dataAquisicao,
        valorCompra: equipamento.valorCompra.toString(),
        estadoConservacao: equipamento.estadoConservacao,
        status: equipamento.status,
        observacoes: equipamento.observacoes,
        responsavelId: equipamento.responsavelId || 'none',
        responsavelNome: equipamento.responsavelNome || '',
      });
      setIsEditing(true);
    } else {
      setSelectedEquipamento(null);
      setFormData({
        nome: '',
        categoria: '',
        marca: '',
        modelo: '',
        numeroSerie: '',
        dataAquisicao: '',
        valorCompra: '',
        estadoConservacao: 'bom',
        status: 'disponivel',
        observacoes: '',
        responsavelId: 'none',
        responsavelNome: '',
      });
      setIsEditing(false);
    }
    setIsModalOpen(true);
  };

  const handleBarcodeScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannerInput) return;

    const equip = equipamentos.find(e => (e.numeroSerie || '').toLowerCase() === scannerInput.toLowerCase());
    setIsScannerOpen(false);
    setScannerInput('');

    if (equip) {
      handleViewEquipamento(equip);
      toast.success('Equipamento encontrado!');
    } else {
      handleOpenModal();
      setFormData(prev => ({ ...prev, numeroSerie: scannerInput }));
      toast.info('Equipamento não encontrado. Preencha os dados para cadastrar.');
    }
  };

  const handleSubmit = () => {
    const isEmUso = formData.status === 'em-uso';
    const equipamentoData = {
      ...formData,
      responsavelId: undefined, // Ignorando o select antigo
      responsavelNome: isEmUso ? formData.responsavelNome : '',
      valorCompra: parseFloat(formData.valorCompra) || 0,
    };

    if (isEditing && selectedEquipamento) {
      onUpdateEquipamento(selectedEquipamento.id, equipamentoData);
    } else {
      onAddEquipamento(equipamentoData);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este equipamento?')) {
      onDeleteEquipamento(id);
    }
  };

  const handleViewEquipamento = (equipamento: Equipamento) => {
    setSelectedEquipamento(equipamento);
    setIsViewModalOpen(true);
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
      return format(parseISO(dateStr), 'dd/MM/yyyy', { locale: ptBR });
    } catch (e) {
      return 'Data inválida';
    }
  };

  const getCategoriaIcon = (categoria: string) => {
    switch ((categoria || '').toLowerCase()) {
      case 'câmeras': return Camera;
      case 'lentes': return Video;
      case 'drones': return Video;
      case 'iluminação': return Lightbulb;
      case 'áudio': return Mic;
      default: return Package;
    }
  };

  const columns = [
    {
      key: 'nome',
      header: 'Equipamento',
      render: (equip: Equipamento) => {
        const Icon = getCategoriaIcon(equip.categoria);
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Icon className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="font-medium">{equip.nome}</p>
              <p className="text-sm text-muted-foreground">{equip.categoria}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'marca',
      header: 'Marca/Modelo',
      render: (equip: Equipamento) => (
        <div>
          <p className="font-medium">{equip.marca}</p>
          <p className="text-sm text-muted-foreground">{equip.modelo}</p>
        </div>
      ),
    },
    {
      key: 'numeroSerie',
      header: 'Nº Série',
      render: (equip: Equipamento) => (
        <code className="text-xs bg-muted px-2 py-1 rounded">{equip.numeroSerie}</code>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (equip: Equipamento) => (
        <div className="flex flex-col gap-1">
          <BadgeStatus status={equip.status} />
          {equip.responsavelNome && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <UserIcon className="w-3 h-3" />
              {equip.responsavelNome}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'conservacao',
      header: 'Conservação',
      render: (equip: Equipamento) => (
        <Badge variant="outline" className={cn(
          equip.estadoConservacao === 'excelente' && "text-emerald-600 border-emerald-200",
          equip.estadoConservacao === 'bom' && "text-blue-600 border-blue-200",
          equip.estadoConservacao === 'regular' && "text-amber-600 border-amber-200",
          equip.estadoConservacao === 'ruim' && "text-red-600 border-red-200",
        )}>
          {conservacaoOptions.find(o => o.value === equip.estadoConservacao)?.label}
        </Badge>
      ),
    },
    {
      key: 'valor',
      header: 'Valor',
      render: (equip: Equipamento) => (
        <span className="font-medium">{formatCurrency(equip.valorCompra)}</span>
      ),
    },
    {
      key: 'acoes',
      header: 'Ações',
      render: (equip: Equipamento) => (
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => handleViewEquipamento(equip)}
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => handleOpenModal(equip)}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => handleDelete(equip.id)}
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
          <h2 className="text-2xl font-bold">Inventário</h2>
          <p className="text-muted-foreground">Controle de equipamentos e patrimônio</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsScannerOpen(true)} className="gap-2">
            <Barcode className="w-4 h-4" />
            <span className="hidden sm:inline">Ler Código de Barras</span>
            <span className="sm:hidden">Ler Código</span>
          </Button>
          <Button onClick={() => handleOpenModal()} className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Equipamento
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <StatCard
          title="Total de Equipamentos"
          value={stats.total}
          icon={Package}
          iconClassName="bg-indigo-100 text-indigo-600"
        />
        <StatCard
          title="Disponíveis"
          value={stats.disponiveis}
          icon={CheckCircle2}
          iconClassName="bg-emerald-100 text-emerald-600"
        />
        <StatCard
          title="Em Manutenção"
          value={stats.manutencao}
          icon={Wrench}
          iconClassName="bg-amber-100 text-amber-600"
        />
        <StatCard
          title="Valor Total"
          value={formatCurrency(stats.valorTotal)}
          icon={DollarSign}
          iconClassName="bg-blue-100 text-blue-600"
        />
      </div>

      {/* Dashboard Charts */}
      <Tabs defaultValue="lista" className="w-full mt-6">
        <TabsList className="bg-muted/60 p-1.5 rounded-2xl">
          <TabsTrigger value="lista" className="gap-2 rounded-xl font-medium data-[state=active]:shadow-sm">
            <Package className="w-4 h-4" />
            Lista
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="gap-2 rounded-xl font-medium data-[state=active]:shadow-sm">
            <BarChart3 className="w-4 h-4" />
            Dashboard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lista" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar equipamento..."
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
            <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categoriaOptions?.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <DataTable
            columns={columns}
            data={filteredEquipamentos}
            keyExtractor={(item) => item.id}
            emptyMessage="Nenhum equipamento encontrado"
          />
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Status Distribution */}
            <Card className="rounded-3xl shadow-md hover:shadow-lg transition-all border-border/50">
              <CardHeader>
                <CardTitle>Distribuição por Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={dadosStatus}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {dadosStatus?.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Category Distribution */}
            <Card className="rounded-3xl shadow-md hover:shadow-lg transition-all border-border/50">
              <CardHeader>
                <CardTitle>Equipamentos por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dadosCategoria} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" stroke="#6b7280" fontSize={12} />
                    <YAxis dataKey="name" type="category" stroke="#6b7280" fontSize={11} width={100} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Value by Category */}
            <Card className="rounded-3xl shadow-md hover:shadow-lg transition-all border-border/50">
              <CardHeader>
                <CardTitle>Valor por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dadosValorCategoria} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      type="number" 
                      stroke="#6b7280" 
                      fontSize={12} 
                      tickFormatter={(v) => `R${(v/1000).toFixed(0)}k`}
                    />
                    <YAxis dataKey="name" type="category" stroke="#6b7280" fontSize={11} width={100} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categoriaOptions?.map(cat => {
              const count = equipamentos.filter(e => e.categoria === cat).length;
              const value = equipamentos
                .filter(e => e.categoria === cat)
                .reduce((sum, e) => sum + e.valorCompra, 0);
              
              return (
                <Card key={cat} className="rounded-3xl shadow-sm hover:shadow-md transition-all border-border/50 bg-gradient-to-br from-indigo-50/50 to-transparent dark:from-indigo-950/20">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">{cat}</p>
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(value)}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto sm:rounded-3xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Editar Equipamento' : 'Novo Equipamento'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome do Equipamento *</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Câmera Sony FX6"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoria *</Label>
                <Select 
                  value={formData.categoria} 
                  onValueChange={(v) => setFormData({ ...formData, categoria: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriaOptions?.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status *</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(v: 'disponivel' | 'em-uso' | 'manutencao' | 'indisponivel') => 
                    setFormData({ ...formData, status: v })
                  }
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Marca *</Label>
                <Input
                  value={formData.marca}
                  onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                  placeholder="Ex: Sony"
                />
              </div>
              <div className="space-y-2">
                <Label>Modelo *</Label>
                <Input
                  value={formData.modelo}
                  onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                  placeholder="Ex: FX6"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Número de Série *</Label>
              <Input
                value={formData.numeroSerie}
                onChange={(e) => setFormData({ ...formData, numeroSerie: e.target.value })}
                placeholder="SN123456789"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data de Aquisição *</Label>
                <Input
                  type="date"
                  value={formData.dataAquisicao}
                  onChange={(e) => setFormData({ ...formData, dataAquisicao: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Valor de Compra (R$) *</Label>
                <Input
                  type="number"
                  value={formData.valorCompra}
                  onChange={(e) => setFormData({ ...formData, valorCompra: e.target.value })}
                  placeholder="0,00"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Estado de Conservação *</Label>
                <Select 
                  value={formData.estadoConservacao} 
                  onValueChange={(v: 'excelente' | 'bom' | 'regular' | 'ruim') => 
                    setFormData({ ...formData, estadoConservacao: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {conservacaoOptions?.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {formData.status === 'em-uso' && (
                <div className="space-y-2">
                  <Label>Responsável</Label>
                  <div className="flex gap-2">
                    <Select 
                      value={formData.responsavelId} 
                      onValueChange={(v) => {
                        const freelancer = freelancers.find(f => f.id === v);
                        setFormData({ 
                          ...formData, 
                          responsavelId: v, 
                          responsavelNome: freelancer ? freelancer.nome : ''
                        });
                      }}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Equipe..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Outro</SelectItem>
                        {freelancers?.map(f => (
                          <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={formData.responsavelNome}
                      onChange={(e) => setFormData({ ...formData, responsavelNome: e.target.value, responsavelId: 'none' })}
                      placeholder="Nome livre..."
                      className="flex-1"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Informações adicionais sobre o equipamento..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {isEditing ? 'Salvar Alterações' : 'Cadastrar Equipamento'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto sm:rounded-2xl p-0 border-0 shadow-2xl bg-card overflow-hidden">
          {selectedEquipamento && (
            <div className="flex flex-col xl:flex-row h-full">
              {/* Left Column: Core Info */}
              <div className="flex-1 p-6 md:p-8 flex flex-col justify-center bg-gradient-to-br from-indigo-50/80 to-purple-50/80 dark:from-indigo-950/40 dark:to-purple-950/40 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-30 pointer-events-none -mr-20 -mt-20 bg-indigo-500/20" />
                
                <div className="flex flex-col gap-6 relative z-10">
                  <div className="w-20 h-20 rounded-[1.5rem] bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center border border-indigo-200/50 dark:border-indigo-800/50 backdrop-blur-md">
                    <Package className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  
                  <div>
                    <h2 className="text-3xl lg:text-4xl font-black text-indigo-950 dark:text-indigo-50 tracking-tight leading-none mb-3">
                      {selectedEquipamento.nome}
                    </h2>
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge className="px-4 py-1.5 rounded-xl uppercase tracking-widest text-[10px] font-bold shadow-sm bg-white/60 dark:bg-black/40 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60 backdrop-blur-sm" variant="outline">
                        {selectedEquipamento.categoria}
                      </Badge>
                      <BadgeStatus status={selectedEquipamento.status} />
                    </div>
                  </div>

                  <div className="mt-8 space-y-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-indigo-600/70 dark:text-indigo-400/80 uppercase tracking-widest">Número de Série / Patrimônio</p>
                      <div className="flex items-center gap-3">
                        <Barcode className="w-5 h-5 text-indigo-500/70" />
                        <code className="text-lg font-mono font-bold text-indigo-950 dark:text-indigo-100">{selectedEquipamento.numeroSerie}</code>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Details */}
              <div className="flex-[1.5] p-6 md:p-8 flex flex-col gap-8 bg-card relative z-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Marca</p>
                    <p className="font-black text-xl">{selectedEquipamento.marca}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Modelo</p>
                    <p className="font-black text-xl">{selectedEquipamento.modelo}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Responsável Atual</p>
                    {selectedEquipamento.responsavelNome ? (
                      <div className="flex items-center gap-3 bg-muted/40 p-3 rounded-2xl border border-border/40 w-fit">
                        <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-black">
                          {selectedEquipamento.responsavelNome.charAt(0)}
                        </div>
                        <p className="font-bold text-lg">{selectedEquipamento.responsavelNome}</p>
                      </div>
                    ) : (
                      <p className="font-medium text-muted-foreground/60 italic">Nenhum responsável</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Estado de Conservação</p>
                    <div className="mt-2">
                      <Badge variant="outline" className="px-4 py-2 rounded-xl uppercase tracking-widest text-xs font-bold border-border/60">
                        {conservacaoOptions.find(o => o.value === selectedEquipamento.estadoConservacao)?.label}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="w-full h-px bg-border/50" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Data de Aquisição</p>
                    <p className="font-bold text-xl">{formatDateSafe(selectedEquipamento.dataAquisicao)}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> Valor de Compra
                    </p>
                    <p className="font-black text-3xl text-foreground tracking-tight">
                      {formatCurrency(selectedEquipamento.valorCompra)}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Observações Adicionais</p>
                  <p className="text-sm text-foreground/80 leading-relaxed bg-muted/20 p-5 rounded-2xl border border-border/40">
                    {selectedEquipamento.observacoes || <span className="italic opacity-60">Nenhuma observação</span>}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Barcode Scanner Modal */}
      <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ler Código de Barras</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Barcode className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-lg">Aguardando leitura...</h3>
                <p className="text-sm text-muted-foreground">
                  Use o leitor de código de barras no equipamento.
                </p>
              </div>
            </div>
            <form onSubmit={handleBarcodeScan}>
              <Input
                autoFocus
                placeholder="Ou digite o código e aperte Enter..."
                value={scannerInput}
                onChange={(e) => setScannerInput(e.target.value)}
                className="text-center text-lg tracking-widest"
              />
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
