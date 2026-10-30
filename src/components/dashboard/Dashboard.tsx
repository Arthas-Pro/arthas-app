import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { exportToPdf, downloadTxt, generateDashboardTxt } from '@/lib/exportUtils';
import { ReportControls } from '@/components/ui-custom/ReportControls';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui-custom/StatCard';
import { 
  DollarSign, 
  Calendar as CalendarIcon,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  BarChart3 as BarChartIcon,
  AreaChart as AreaChartIcon,
  PieChart as PieChartIcon,
  Clock
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  BarChart,
  Bar
} from 'recharts';
import type { Cliente, Projeto, Equipamento, Transacao, Tarefa, Evento, Alerta } from '@/types';
import { cn } from '@/lib/utils';
import { 
  format, 
  parseISO, 
  isToday, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  isWithinInterval,
  endOfDay,
  subMonths,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DashboardProps {
  clientes: Cliente[];
  projetos: Projeto[];
  equipamentos: Equipamento[];
  transacoes: Transacao[];
  tarefas: Tarefa[];
  eventos: Evento[];
  alertas: Alerta[];
  clientesPrioritarios?: Cliente[];
  projetosPrioritarios?: Projeto[];
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4'];

export function Dashboard({ 
  clientes, 
  projetos, 
  equipamentos, 
  transacoes, 
  tarefas, 
  eventos,
  alertas,
  clientesPrioritarios = [],
  projetosPrioritarios = []
}: DashboardProps) {
  const { t } = useLanguage();
  const [periodo, setPeriodo] = useState('este-mes');
  const [dataInicio, setDataInicio] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [dataFim, setDataFim] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [chartType, setChartType] = useState<'area' | 'bar' | 'pie'>('area');

  const handlePeriodoChange = (val: string) => {
    setPeriodo(val);
    const hoje = new Date();
    let start = new Date();
    let end = new Date();

    switch (val) {
      case 'semana':
        start = startOfWeek(hoje, { locale: ptBR });
        end = endOfWeek(hoje, { locale: ptBR });
        break;
      case 'este-mes':
      case 'mes':
        start = startOfMonth(hoje);
        end = endOfMonth(hoje);
        break;
      case 'mes-passado':
        const lastMonth = subMonths(hoje, 1);
        start = startOfMonth(lastMonth);
        end = endOfMonth(lastMonth);
        break;
      case 'ultimo-trimestre':
      case 'trimestre':
        start = startOfMonth(subMonths(hoje, 3));
        end = endOfMonth(hoje);
        break;
      case 'ultimos-6-meses':
        start = startOfMonth(subMonths(hoje, 6));
        end = endOfMonth(hoje);
        break;
      case 'ultimos-12-meses':
      case 'ano':
        start = startOfMonth(subMonths(hoje, 12));
        end = endOfMonth(hoje);
        break;
    }

    setDataInicio(format(start, 'yyyy-MM-dd'));
    setDataFim(format(end, 'yyyy-MM-dd'));
  };

  // Resumo dos dados
  const resumo = useMemo(() => {
    const hoje = new Date().toISOString().split('T')[0];
    
    return {
      totalClientes: clientes.length,
      clientesAtivos: clientes.filter(c => c.status === 'ativo').length,
      clientesRecorrentes: clientes.filter(c => c.tipo === 'recorrente').length,
      clientesAvulsos: clientes.filter(c => c.tipo === 'avulso').length,
      projetosAndamento: projetos.filter(p => p.status !== 'entregue').length,
      projetosFinalizados: projetos.filter(p => p.status === 'entregue').length,
      equipamentosDisponiveis: equipamentos.filter(e => e.status === 'disponivel').length,
      equipamentosEmUso: equipamentos.filter(e => e.status === 'em-uso').length,
      equipamentosManutencao: equipamentos.filter(e => e.status === 'manutencao').length,
      tarefasPendentes: tarefas.filter(t => t.status !== 'concluida').length,
      eventosHoje: eventos.filter(e => e.dataInicio.startsWith(hoje)).length
    };
  }, [clientes, projetos, equipamentos, tarefas, eventos]);

  // Dados financeiros do período selecionado
  const financeiroPeriodo = useMemo(() => {
    const inicio = parseISO(dataInicio);
    const fim = endOfDay(parseISO(dataFim));
    
    const transacoesPeriodo = transacoes.filter(t => {
      const data = parseISO(t.dataVencimento || t.data);
      return isWithinInterval(data, { start: inicio, end: fim });
    });

    const entradas = transacoesPeriodo
      .filter(t => t.tipo === 'entrada' && t.status === 'pago')
      .reduce((sum, t) => sum + Number(t.valor), 0);
    
    const saidas = transacoesPeriodo
      .filter(t => t.tipo === 'saida' && t.status === 'pago')
      .reduce((sum, t) => sum + Number(t.valor), 0);

    const contasPagar = transacoesPeriodo
      .filter(t => t.tipo === 'saida' && t.status === 'pendente')
      .reduce((sum, t) => sum + Number(t.valor), 0);

    const contasReceber = transacoesPeriodo
      .filter(t => t.tipo === 'entrada' && (t.status === 'pendente' || t.status === 'atrasado'))
      .reduce((sum, t) => sum + Number(t.valor), 0);

    return { 
      entradas, 
      saidas, 
      saldo: entradas - saidas, 
      contasPagar, 
      contasReceber,
      totalPrevisto: entradas + contasReceber 
    };
  }, [transacoes, dataInicio, dataFim]);

  // Dados para gráfico financeiro (últimos 6 meses)
  const dadosFinanceiros = useMemo(() => {
    const meses = [];
    const agora = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const data = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
      const mes = data.getMonth();
      const ano = data.getFullYear();
      
      const transacoesMes = transacoes.filter(t => {
        const tData = parseISO(t.dataVencimento || t.data);
        return tData.getMonth() === mes && tData.getFullYear() === ano;
      });

      const entradas = transacoesMes
        .filter(t => t.tipo === 'entrada' && t.status === 'pago')
        .reduce((sum, t) => sum + Number(t.valor), 0);
      
      const saidas = transacoesMes
        .filter(t => t.tipo === 'saida' && t.status === 'pago')
        .reduce((sum, t) => sum + Number(t.valor), 0);

      meses.push({
        mes: format(data, 'MMM/yyyy', { locale: ptBR }),
        entradas,
        saidas,
        lucro: entradas - saidas
      });
    }
    
    return meses;
  }, [transacoes]);

  // Dados para gráfico de equipamentos
  const dadosEquipamentos = useMemo(() => [
    { name: 'Disponíveis', value: resumo.equipamentosDisponiveis },
    { name: 'Em Uso', value: resumo.equipamentosEmUso },
    { name: 'Manutenção', value: resumo.equipamentosManutencao },
  ], [resumo]);

  // Próximos eventos
  const proximosEventos = useMemo(() => {
    return eventos
      .filter(e => new Date(e.dataInicio) >= new Date())
      .sort((a, b) => new Date(a.dataInicio).getTime() - new Date(b.dataInicio).getTime())
      .slice(0, 5);
  }, [eventos]);

  // Tarefas urgentes
  const tarefasUrgentes = useMemo(() => {
    return tarefas
      .filter(t => t.status !== 'concluida' && t.prioridade === 'urgente')
      .slice(0, 5);
  }, [tarefas]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDateSafe = (dateStr: string, formatStr: string = 'dd/MM/yyyy') => {
    if (!dateStr) return 'Não informada';
    try {
      if (dateStr.includes('/')) return dateStr;
      return format(parseISO(dateStr), formatStr, { locale: ptBR });
    } catch (e) {
      return 'Data inválida';
    }
  };

  const container: any = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemAnim: any = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      variants={container} 
      initial="hidden" 
      animate="show" 
      className="p-4 lg:p-8 space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-2xl font-bold inline-flex items-center gap-2">
              {t('nav.dashboard')}
              <Badge variant="outline" className="text-[10px] font-mono bg-primary/10 text-primary border-primary/20">v2.60-FIX</Badge>
            </h2>
            <p className="text-muted-foreground text-sm">Acompanhe todos os indicadores da sua operação</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ReportControls 
            onExportPdf={exportToPdf}
            onExportTxt={() => {
              const txt = generateDashboardTxt({ resumo, financeiro: financeiroPeriodo }, t);
              downloadTxt('relatorio-dashboard', txt);
            }}
          />
          <div className="flex flex-col md:flex-row items-end gap-3 p-3 bg-muted/40 rounded-lg border">
          <div className="flex items-center gap-2">
            <Label className="text-[10px] uppercase font-bold text-muted-foreground whitespace-nowrap">Período:</Label>
            <Input 
              type="date"
              value={dataInicio}
              onChange={(e) => {
                setDataInicio(e.target.value);
                setPeriodo('custom');
              }}
              className="w-[130px] h-8 text-xs bg-background"
            />
            <span className="text-muted-foreground text-xs">à</span>
            <Input 
              type="date"
              value={dataFim}
              onChange={(e) => {
                setDataFim(e.target.value);
                setPeriodo('custom');
              }}
              className="w-[130px] h-8 text-xs bg-background"
            />
          </div>
          <Select value={periodo} onValueChange={handlePeriodoChange}>
            <SelectTrigger className="w-[150px] h-8 text-xs bg-background">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semana">Esta Semana</SelectItem>
              <SelectItem value="este-mes">Este Mês</SelectItem>
              <SelectItem value="mes-passado">Mês Passado</SelectItem>
              <SelectItem value="ultimo-trimestre">Último Trimestre</SelectItem>
              <SelectItem value="ultimos-6-meses">Últimos 6 Meses</SelectItem>
              <SelectItem value="ultimos-12-meses">Últimos 12 Meses</SelectItem>
              {periodo === 'custom' && <SelectItem value="custom">Personalizado</SelectItem>}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>

      {/* Cards de Resumo Financeiro - Prioridade Máxima */}
      <motion.div variants={itemAnim} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Saldo Líquido"
          value={formatCurrency(financeiroPeriodo.saldo)}
          description={`${formatCurrency(financeiroPeriodo.entradas)} entradas confirmadas`}
          icon={DollarSign}
          trend={financeiroPeriodo.saldo >= 0 ? 'up' : 'down'}
          trendValue={financeiroPeriodo.saldo >= 0 ? 'positivo' : 'negativo'}
          iconClassName={financeiroPeriodo.saldo >= 0 ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}
          className="lg:col-span-2 border-emerald-500/20"
        />
        <StatCard
          title="Previsão a Receber"
          value={formatCurrency(financeiroPeriodo.contasReceber)}
          description="Pendentes no período"
          icon={TrendingUp}
          iconClassName="bg-blue-100 text-blue-600"
        />
        <StatCard
          title="Contas a Pagar"
          value={formatCurrency(financeiroPeriodo.contasPagar)}
          description="Contas pendentes"
          icon={TrendingDown}
          iconClassName="bg-amber-100 text-amber-600"
        />
      </motion.div>

      {/* Seção Principal: Fluxo e Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div variants={itemAnim} className="lg:col-span-2">
          <Card className="h-full rounded-3xl shadow-md hover:shadow-lg transition-all border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Fluxo Financeiro</CardTitle>
                  <p className="text-sm text-muted-foreground">Comparativo de entradas e saídas</p>
                </div>
                <div className="flex items-center gap-2 p-1 bg-muted rounded-md">
                  <Button 
                    variant={chartType === 'area' ? 'secondary' : 'ghost'} 
                    size="sm" 
                    className="h-8 px-2"
                    onClick={() => setChartType('area')}
                  >
                    <AreaChartIcon className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant={chartType === 'bar' ? 'secondary' : 'ghost'} 
                    size="sm" 
                    className="h-8 px-2"
                    onClick={() => setChartType('bar')}
                  >
                    <BarChartIcon className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant={chartType === 'pie' ? 'secondary' : 'ghost'} 
                    size="sm" 
                    className="h-8 px-2"
                    onClick={() => setChartType('pie')}
                  >
                    <PieChartIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                {chartType === 'area' ? (
                  <AreaChart data={dadosFinanceiros}>
                    <defs>
                      <linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorSaidas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="mes" axisLine={false} tickLine={false} fontSize={12} />
                    <YAxis axisLine={false} tickLine={false} fontSize={12} tickFormatter={(v) => `R$${v/1000}k`} />
                    <Tooltip />
                    <Area type="monotone" dataKey="entradas" stroke="#22c55e" fill="url(#colorEntradas)" strokeWidth={2} />
                    <Area type="monotone" dataKey="saidas" stroke="#ef4444" fill="url(#colorSaidas)" strokeWidth={2} />
                  </AreaChart>
                ) : chartType === 'bar' ? (
                  <BarChart data={dadosFinanceiros}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="mes" axisLine={false} tickLine={false} fontSize={12} />
                    <YAxis axisLine={false} tickLine={false} fontSize={12} tickFormatter={(v) => `R$${v/1000}k`} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="entradas" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="saidas" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : (
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Entradas', value: financeiroPeriodo.entradas },
                        { name: 'Saídas', value: financeiroPeriodo.saidas },
                        { name: 'Pendentes', value: financeiroPeriodo.contasReceber },
                      ]}
                      innerRadius={80}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      <Cell fill="#22c55e" />
                      <Cell fill="#ef4444" />
                      <Cell fill="#6366f1" />
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Alertas e Prioridades */}
        <motion.div variants={itemAnim}>
          <Card className="h-full rounded-3xl shadow-md hover:shadow-lg transition-all border-red-500/20 bg-gradient-to-b from-red-50/50 to-transparent dark:from-red-950/10">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Alertas e Prioridades</CardTitle>
              {(clientesPrioritarios.length > 0 || projetosPrioritarios.length > 0) && (
                <Badge variant="destructive" className="animate-pulse">
                  {clientesPrioritarios.length + projetosPrioritarios.length} Críticos
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
                {clientesPrioritarios?.map((cliente) => (
                  <div key={`cli-${cliente.id}`} className="p-3 rounded-lg bg-muted/40 border border-red-500/10 hover:bg-muted/60 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-600" />
                        <span className="font-bold text-sm">CLI: {cliente.nomeEmpresa || cliente.nomeResponsavel}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] uppercase font-bold text-red-500 border-red-500/20 bg-red-500/5">
                        {cliente.prioridade}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate ml-4">
                      {cliente.tipoServico}
                    </p>
                  </div>
                ))}
                {projetosPrioritarios?.map((projeto) => (
                  <div key={`proj-${projeto.id}`} className="p-3 rounded-lg bg-red-500/5 border border-red-500/20 hover:bg-red-500/10 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                        <span className="font-bold text-sm">PROJ: {projeto.nome}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] uppercase font-bold text-red-500 border-red-500/20 bg-red-500/5">
                        {projeto.prioridade}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate ml-4">
                      {projeto.clienteNome}
                    </p>
                  </div>
                ))}
                {alertas.filter(a => !a.lido)?.map((alerta) => (
                  <div key={alerta.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/40 transition-colors">
                    <AlertCircle className={cn(
                      "w-4 h-4 mt-0.5",
                      alerta.tipo === 'error' ? "text-red-500" : "text-blue-500"
                    )} />
                    <div>
                      <p className="text-sm font-medium">{alerta.titulo}</p>
                      <p className="text-xs text-muted-foreground">{alerta.descricao}</p>
                    </div>
                  </div>
                ))}
                {clientesPrioritarios.length === 0 && projetosPrioritarios.length === 0 && alertas.filter(a => !a.lido).length === 0 && (
                  <div className="text-center py-10">
                    <p className="text-sm text-muted-foreground">Tudo em ordem por aqui!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Grid Secundário: Próximas Atividades */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        {/* Próximos Eventos */}
        <motion.div variants={itemAnim}>
          <Card className="h-full rounded-3xl shadow-md hover:shadow-lg transition-all border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Agenda Próxima</CardTitle>
                <p className="text-sm text-muted-foreground">Compromissos agendados</p>
              </div>
              <CalendarIcon className="w-5 h-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {proximosEventos.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhum evento próximo</p>
                ) : (
                  proximosEventos.map((evento) => {
                    const data = parseISO(evento.dataInicio);
                    const isHoje = isToday(data);
                    
                    return (
                      <div key={evento.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex flex-col items-center justify-center text-[10px] font-bold flex-shrink-0",
                          isHoje ? "bg-indigo-500 text-white" : "bg-muted text-muted-foreground"
                        )}>
                          <span>{formatDateSafe(evento.dataInicio, 'dd')}</span>
                          <span className="uppercase">{formatDateSafe(evento.dataInicio, 'MMM')}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{evento.titulo}</p>
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>{formatDateSafe(evento.dataInicio, 'HH:mm')}</span>
                            {evento.clienteNome && <span> • {evento.clienteNome}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tarefas Urgentes */}
        <motion.div variants={itemAnim}>
          <Card className="h-full rounded-3xl shadow-md hover:shadow-lg transition-all border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Tarefas Urgentes</CardTitle>
                <p className="text-sm text-muted-foreground">O que precisa de atenção</p>
              </div>
              <AlertCircle className="w-5 h-5 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tarefasUrgentes.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhuma tarefa urgente</p>
                ) : (
                  tarefasUrgentes.map((tarefa) => (
                    <div key={tarefa.id} className="flex items-start gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                      <div className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{tarefa.titulo}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{tarefa.descricao || 'Sem descrição'}</p>
                        {tarefa.dataLimite && (
                          <p className="text-[10px] text-red-500 mt-1 font-bold">
                            Prazo: {formatDateSafe(tarefa.dataLimite)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Status de Operação */}
        <motion.div variants={itemAnim}>
          <Card className="h-full rounded-3xl shadow-md hover:shadow-lg transition-all border-border/50">
            <CardHeader>
              <CardTitle>Operação & Equipamentos</CardTitle>
              <p className="text-sm text-muted-foreground">Distribuição atual</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10 text-center">
                    <p className="text-xl font-bold text-blue-500">{resumo.clientesAtivos}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Clientes Ativos</p>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-center">
                    <p className="text-xl font-bold text-emerald-500">{resumo.equipamentosDisponiveis}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">ITENS DISPONÍVEIS</p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie
                      data={dadosEquipamentos}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {dadosEquipamentos.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

    </motion.div>
  );
}
