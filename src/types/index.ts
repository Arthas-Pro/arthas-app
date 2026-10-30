// Tipos do Sistema ERP - Arthas Produções

// Cliente
export interface Cliente {
  id: string;
  nomeEmpresa: string;
  nomeResponsavel: string;
  telefone: string;
  whatsapp: string;
  contato?: string; // Unificado para UI
  email: string;
  endereco: string;
  observacoes: string;
  tipo: 'recorrente' | 'avulso';
  valorMensal?: number;
  valorServico?: number;
  percentualEntrada?: number;
  diaPagamento?: number; // 1-31
  duracaoContrato?: number; // em meses
  custoFixoTerceiro?: number;
  tipoServico: string;
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  status: 'lead' | 'ativo' | 'pausado' | 'encerrado';
  dataCadastro: string;
  historico: HistoricoAtendimento[];
}

export interface HistoricoAtendimento {
  id: string;
  data: string;
  descricao: string;
  tipo: 'ligacao' | 'email' | 'reuniao' | 'whatsapp' | 'outro';
}

// Projeto
export interface Projeto {
  id: string;
  nome: string;
  clienteId: string;
  clienteNome: string;
  tipo: string;
  dataInicio: string;
  prazoEntrega: string;
  responsaveis: string[];
  orcamento: number;
  status: ProjetoStatus;
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  observacoes: string;
  historico: HistoricoProjeto[];
  arquivos: ArquivoProjeto[];
  equipeIds?: string[];
  custoEquipe?: number;
}

export type ProjetoStatus = 
  | 'orcamento' 
  | 'aprovado' 
  | 'em-producao' 
  | 'em-edicao' 
  | 'entregue';

export interface HistoricoProjeto {
  id: string;
  data: string;
  descricao: string;
  autor: string;
}

export interface ArquivoProjeto {
  id: string;
  nome: string;
  url: string;
  tipo: string;
  dataUpload: string;
}

// Equipamento
export interface Equipamento {
  id: string;
  nome: string;
  categoria: string;
  marca: string;
  modelo: string;
  numeroSerie: string;
  dataAquisicao: string;
  valorCompra: number;
  estadoConservacao: 'excelente' | 'bom' | 'regular' | 'ruim';
  status: 'disponivel' | 'em-uso' | 'manutencao' | 'indisponivel';
  observacoes: string;
  responsavelId?: string;
  responsavelNome?: string;
}

// Evento/Compromisso
export interface Evento {
  id: string;
  titulo: string;
  descricao: string;
  dataInicio: string;
  dataFim: string;
  tipo: 'reuniao' | 'gravacao' | 'entrega' | 'visita' | 'interno' | 'outro';
  clienteId?: string;
  clienteNome?: string;
  projetoId?: string;
  projetoNome?: string;
  local?: string;
  lembrete: boolean;
  cor?: string;
  googleEventId?: string;
  googleSync?: boolean;
}

// Financeiro
export interface Transacao {
  id: string;
  tipo: 'entrada' | 'saida';
  descricao: string;
  valor: number;
  data: string;
  dataVencimento: string;
  status: 'pago' | 'pendente' | 'atrasado';
  categoria: string;
  clienteId?: string;
  clienteNome?: string;
  projetoId?: string;
  projetoNome?: string;
  observacoes: string;
  metodoPagamento?: string; // e.g. 'Dinheiro', 'Pix', 'Cartão'
  parcelas?: number;
}

// Equipe/Freelancer
export interface Freelancer {
  id: string;
  nome: string;
  funcao: string;
  telefone: string;
  whatsapp: string;
  email: string;
  valorDiaria: number;
  valorHora: number;
  disponibilidade: 'disponivel' | 'ocupado' | 'indisponivel';
  tipoContrato?: 'freelancer' | 'clt' | 'pj';
  documento?: string;
  chavePix?: string;
  dataPagamento?: string;
  observacoes: string;
  projetos: string[];
}

// Tarefa
export interface Tarefa {
  id: string;
  titulo: string;
  descricao: string;
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  status: 'pendente' | 'em-andamento' | 'concluida';
  dataCriacao: string;
  dataLimite?: string;
  responsavel?: string;
  projetoId?: string;
}

// Alerta
export interface Alerta {
  id: string;
  titulo: string;
  descricao: string;
  tipo: 'info' | 'warning' | 'error' | 'success';
  data: string;
  lido: boolean;
  link?: string;
}

// Dashboard
export interface DashboardData {
  resumo: {
    totalClientes: number;
    clientesAtivos: number;
    clientesRecorrentes: number;
    clientesAvulsos: number;
    projetosAndamento: number;
    projetosFinalizados: number;
    equipamentosDisponiveis: number;
    equipamentosEmUso: number;
    equipamentosManutencao: number;
    tarefasPendentes: number;
    eventosHoje: number;
  };
  financeiro: {
    entradasMes: number;
    saidasMes: number;
    saldoMes: number;
    contasPagar: number;
    contasReceber: number;
    comparativoMesAnterior: number;
  };
}

// Filtros
export interface FiltroPeriodo {
  dataInicio: string;
  dataFim: string;
}

export interface FiltroCliente {
  status?: Cliente['status'];
  tipo?: Cliente['tipo'];
  prioridade?: Cliente['prioridade'];
  busca?: string;
}

export interface FiltroProjeto {
  status?: Projeto['status'];
  prioridade?: Projeto['prioridade'];
  clienteId?: string;
  busca?: string;
}

export interface FiltroTransacao {
  tipo?: Transacao['tipo'];
  status?: Transacao['status'];
  categoria?: string;
  periodo?: FiltroPeriodo;
  busca?: string;
}
