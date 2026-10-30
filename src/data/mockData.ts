import type { Cliente, Projeto, Equipamento, Evento, Transacao, Freelancer, Tarefa, Alerta } from '@/types';

// Clientes
export const clientesMock: Cliente[] = [
  {
    id: '1',
    nomeEmpresa: 'TechFlow Solutions',
    nomeResponsavel: 'Carlos Mendes',
    telefone: '(11) 3456-7890',
    whatsapp: '(11) 98765-4321',
    email: 'carlos@techflow.com.br',
    endereco: 'Av. Paulista, 1000 - São Paulo/SP',
    observacoes: 'Cliente estratégico, sempre demanda projetos urgentes',
    tipo: 'recorrente',
    valorMensal: 15000,
    tipoServico: 'Produção de Vídeos Corporativos',
    prioridade: 'alta',
    status: 'ativo',
    dataCadastro: '2023-01-15',
    historico: [
      { id: '1', data: '2024-01-10', descricao: 'Reunião de briefing para novo projeto', tipo: 'reuniao' },
      { id: '2', data: '2024-01-15', descricao: 'Aprovação do orçamento', tipo: 'email' },
    ]
  },
  {
    id: '2',
    nomeEmpresa: 'EcoVida Brasil',
    nomeResponsavel: 'Ana Paula Silva',
    telefone: '(21) 2345-6789',
    whatsapp: '(21) 97654-3210',
    email: 'ana@ecovida.com.br',
    endereco: 'Rua das Flores, 500 - Rio de Janeiro/RJ',
    observacoes: 'Cliente de eventos sustentáveis',
    tipo: 'recorrente',
    valorMensal: 8500,
    tipoServico: 'Cobertura de Eventos',
    prioridade: 'media',
    status: 'ativo',
    dataCadastro: '2023-03-20',
    historico: []
  },
  {
    id: '3',
    nomeEmpresa: 'StartUp Inovadora',
    nomeResponsavel: 'Pedro Oliveira',
    telefone: '(31) 3456-7890',
    whatsapp: '(31) 99876-5432',
    email: 'pedro@startup.com',
    endereco: 'Av. Afonso Pena, 1500 - Belo Horizonte/MG',
    observacoes: 'Projeto único de lançamento de produto',
    tipo: 'avulso',
    tipoServico: 'Vídeo de Lançamento',
    prioridade: 'urgente',
    status: 'ativo',
    dataCadastro: '2024-01-05',
    historico: []
  },
  {
    id: '4',
    nomeEmpresa: 'Restaurante Sabor & Arte',
    nomeResponsavel: 'Maria Fernanda Costa',
    telefone: '(11) 4567-8901',
    whatsapp: '(11) 96543-2109',
    email: 'maria@saborearte.com',
    endereco: 'Rua Augusta, 800 - São Paulo/SP',
    observacoes: 'Cliente de fotografia gastronômica',
    tipo: 'recorrente',
    valorMensal: 3200,
    tipoServico: 'Fotografia Gastronômica',
    prioridade: 'baixa',
    status: 'ativo',
    dataCadastro: '2023-06-10',
    historico: []
  },
  {
    id: '5',
    nomeEmpresa: 'Construtora Horizonte',
    nomeResponsavel: 'Roberto Almeida',
    telefone: '(19) 3456-7890',
    whatsapp: '(19) 98765-1234',
    email: 'roberto@horizonte.com.br',
    endereco: 'Av. Brasil, 2000 - Campinas/SP',
    observacoes: 'Lead potencial, aguardando proposta',
    tipo: 'avulso',
    tipoServico: 'Vídeos Institucionais',
    prioridade: 'media',
    status: 'lead',
    dataCadastro: '2024-01-20',
    historico: [
      { id: '1', data: '2024-01-20', descricao: 'Primeiro contato via site', tipo: 'email' }
    ]
  },
  {
    id: '6',
    nomeEmpresa: 'Agência Digital Plus',
    nomeResponsavel: 'Juliana Martins',
    telefone: '(11) 5678-9012',
    whatsapp: '(11) 95432-1098',
    email: 'juliana@digitalplus.com',
    endereco: 'Rua Oscar Freire, 300 - São Paulo/SP',
    observacoes: 'Parceira frequente de projetos',
    tipo: 'recorrente',
    valorMensal: 22000,
    tipoServico: 'Produção de Conteúdo Digital',
    prioridade: 'alta',
    status: 'ativo',
    dataCadastro: '2022-08-15',
    historico: []
  },
  {
    id: '7',
    nomeEmpresa: 'Clínica Bem Estar',
    nomeResponsavel: 'Dr. Fernando Lima',
    telefone: '(11) 6789-0123',
    whatsapp: '(11) 94321-0987',
    email: 'contato@clinicabemestar.com',
    endereco: 'Alameda Santos, 900 - São Paulo/SP',
    observacoes: 'Projeto pausado, aguardando retorno',
    tipo: 'avulso',
    tipoServico: 'Vídeos Promocionais',
    prioridade: 'baixa',
    status: 'pausado',
    dataCadastro: '2023-09-01',
    historico: []
  },
  {
    id: '8',
    nomeEmpresa: 'Escola Futuro Brilhante',
    nomeResponsavel: 'Diretora Sandra Souza',
    telefone: '(11) 7890-1234',
    whatsapp: '(11) 93210-9876',
    email: 'sandra@futurobrilhante.edu.br',
    endereco: 'Rua da Educação, 100 - São Paulo/SP',
    observacoes: 'Contrato encerrado em 2023',
    tipo: 'recorrente',
    valorMensal: 5000,
    tipoServico: 'Vídeos Institucionais',
    prioridade: 'media',
    status: 'encerrado',
    dataCadastro: '2022-03-10',
    historico: []
  }
];

// Projetos
export const projetosMock: Projeto[] = [
  {
    id: '1',
    nome: 'Campanha TechFlow 2024',
    clienteId: '1',
    clienteNome: 'TechFlow Solutions',
    tipo: 'Vídeo Corporativo',
    dataInicio: '2024-01-10',
    prazoEntrega: '2024-02-15',
    responsaveis: ['João Silva', 'Maria Santos'],
    orcamento: 25000,
    status: 'em-edicao',
    prioridade: 'alta',
    observacoes: 'Campanha de marketing anual',
    historico: [
      { id: '1', data: '2024-01-10', descricao: 'Briefing realizado', autor: 'João Silva' },
      { id: '2', data: '2024-01-15', descricao: 'Roteiro aprovado', autor: 'Maria Santos' },
      { id: '3', data: '2024-01-25', descricao: 'Filmagem concluída', autor: 'João Silva' }
    ],
    arquivos: []
  },
  {
    id: '2',
    nome: 'Evento Sustentabilidade EcoVida',
    clienteId: '2',
    clienteNome: 'EcoVida Brasil',
    tipo: 'Cobertura de Evento',
    dataInicio: '2024-01-20',
    prazoEntrega: '2024-01-25',
    responsaveis: ['Pedro Costa'],
    orcamento: 8000,
    status: 'em-producao',
    prioridade: 'urgente',
    observacoes: 'Evento ao vivo, necessita equipe completa',
    historico: [],
    arquivos: []
  },
  {
    id: '3',
    nome: 'Lançamento Produto StartUp',
    clienteId: '3',
    clienteNome: 'StartUp Inovadora',
    tipo: 'Vídeo de Lançamento',
    dataInicio: '2024-01-15',
    prazoEntrega: '2024-01-30',
    responsaveis: ['Ana Paula', 'Carlos Eduardo'],
    orcamento: 18000,
    status: 'em-edicao',
    prioridade: 'urgente',
    observacoes: 'Prazo apertado, cliente prioridade',
    historico: [],
    arquivos: []
  },
  {
    id: '4',
    nome: 'Cardápio Digital Sabor & Arte',
    clienteId: '4',
    clienteNome: 'Restaurante Sabor & Arte',
    tipo: 'Fotografia',
    dataInicio: '2024-01-05',
    prazoEntrega: '2024-01-20',
    responsaveis: ['Fernanda Lima'],
    orcamento: 4500,
    status: 'entregue',
    prioridade: 'media',
    observacoes: 'Fotos para novo cardápio digital',
    historico: [],
    arquivos: []
  },
  {
    id: '5',
    nome: 'Série de Conteúdo Digital Plus',
    clienteId: '6',
    clienteNome: 'Agência Digital Plus',
    tipo: 'Produção de Conteúdo',
    dataInicio: '2024-01-01',
    prazoEntrega: '2024-01-31',
    responsaveis: ['João Silva', 'Maria Santos', 'Pedro Costa'],
    orcamento: 35000,
    status: 'aprovado',
    prioridade: 'alta',
    observacoes: 'Série mensal de 20 vídeos',
    historico: [],
    arquivos: []
  },
  {
    id: '6',
    nome: 'Vídeo Institucional Horizonte',
    clienteId: '5',
    clienteNome: 'Construtora Horizonte',
    tipo: 'Vídeo Institucional',
    dataInicio: '2024-02-01',
    prazoEntrega: '2024-02-28',
    responsaveis: ['Carlos Eduardo'],
    orcamento: 15000,
    status: 'orcamento',
    prioridade: 'media',
    observacoes: 'Aguardando aprovação do orçamento',
    historico: [],
    arquivos: []
  },
  {
    id: '7',
    nome: 'Campanha Redes Sociais TechFlow',
    clienteId: '1',
    clienteNome: 'TechFlow Solutions',
    tipo: 'Conteúdo para Redes Sociais',
    dataInicio: '2023-12-01',
    prazoEntrega: '2023-12-20',
    responsaveis: ['Ana Paula'],
    orcamento: 12000,
    status: 'entregue',
    prioridade: 'media',
    observacoes: 'Campanha de final de ano',
    historico: [
      { id: '1', data: '2023-12-20', descricao: 'Projeto entregue com sucesso', autor: 'Ana Paula' }
    ],
    arquivos: []
  },
  {
    id: '8',
    nome: 'Documentário EcoVida',
    clienteId: '2',
    clienteNome: 'EcoVida Brasil',
    tipo: 'Documentário',
    dataInicio: '2023-10-01',
    prazoEntrega: '2023-12-15',
    responsaveis: ['João Silva', 'Maria Santos'],
    orcamento: 45000,
    status: 'entregue',
    prioridade: 'alta',
    observacoes: 'Documentário sobre sustentabilidade',
    historico: [
      { id: '1', data: '2023-12-15', descricao: 'Documentário entregue', autor: 'João Silva' }
    ],
    arquivos: []
  }
];

// Equipamentos
export const equipamentosMock: Equipamento[] = [
  {
    id: '1',
    nome: 'Câmera Sony FX6',
    categoria: 'Câmeras',
    marca: 'Sony',
    modelo: 'FX6',
    numeroSerie: 'SN123456789',
    dataAquisicao: '2022-06-15',
    valorCompra: 45000,
    estadoConservacao: 'excelente',
    status: 'em-uso',
    observacoes: 'Câmera principal de filmagem'
  },
  {
    id: '2',
    nome: 'Câmera Sony A7S III',
    categoria: 'Câmeras',
    marca: 'Sony',
    modelo: 'A7S III',
    numeroSerie: 'SN987654321',
    dataAquisicao: '2021-03-20',
    valorCompra: 28000,
    estadoConservacao: 'bom',
    status: 'disponivel',
    observacoes: 'Câmera secundária'
  },
  {
    id: '3',
    nome: 'Lente Sony 24-70mm f/2.8',
    categoria: 'Lentes',
    marca: 'Sony',
    modelo: 'FE 24-70mm f/2.8 GM',
    numeroSerie: 'SN456789123',
    dataAquisicao: '2022-06-15',
    valorCompra: 12000,
    estadoConservacao: 'excelente',
    status: 'em-uso',
    observacoes: 'Lente principal'
  },
  {
    id: '4',
    nome: 'Lente Sony 70-200mm f/2.8',
    categoria: 'Lentes',
    marca: 'Sony',
    modelo: 'FE 70-200mm f/2.8 GM OSS',
    numeroSerie: 'SN789123456',
    dataAquisicao: '2021-08-10',
    valorCompra: 18000,
    estadoConservacao: 'bom',
    status: 'disponivel',
    observacoes: 'Lente telephoto'
  },
  {
    id: '5',
    nome: 'Drone DJI Mavic 3',
    categoria: 'Drones',
    marca: 'DJI',
    modelo: 'Mavic 3 Cine',
    numeroSerie: 'SN321654987',
    dataAquisicao: '2022-01-15',
    valorCompra: 35000,
    estadoConservacao: 'excelente',
    status: 'disponivel',
    observacoes: 'Drone principal'
  },
  {
    id: '6',
    nome: 'Estabilizador DJI RS 3 Pro',
    categoria: 'Estabilizadores',
    marca: 'DJI',
    modelo: 'RS 3 Pro',
    numeroSerie: 'SN654987321',
    dataAquisicao: '2022-09-01',
    valorCompra: 8000,
    estadoConservacao: 'excelente',
    status: 'em-uso',
    observacoes: 'Gimbal principal'
  },
  {
    id: '7',
    nome: 'Iluminação Aputure 600d',
    categoria: 'Iluminação',
    marca: 'Aputure',
    modelo: 'LS 600d',
    numeroSerie: 'SN147258369',
    dataAquisicao: '2021-05-20',
    valorCompra: 15000,
    estadoConservacao: 'bom',
    status: 'disponivel',
    observacoes: 'Luz principal'
  },
  {
    id: '8',
    nome: 'Iluminação Aputure 300x',
    categoria: 'Iluminação',
    marca: 'Aputure',
    modelo: 'LS 300x',
    numeroSerie: 'SN369258147',
    dataAquisicao: '2021-05-20',
    valorCompra: 8000,
    estadoConservacao: 'regular',
    status: 'manutencao',
    observacoes: 'Em manutenção preventiva'
  },
  {
    id: '9',
    nome: 'Microfone Sennheiser MKH 416',
    categoria: 'Áudio',
    marca: 'Sennheiser',
    modelo: 'MKH 416',
    numeroSerie: 'SN741852963',
    dataAquisicao: '2020-11-10',
    valorCompra: 6000,
    estadoConservacao: 'bom',
    status: 'disponivel',
    observacoes: 'Microfone shotgun'
  },
  {
    id: '10',
    nome: 'Gravador Zoom F6',
    categoria: 'Áudio',
    marca: 'Zoom',
    modelo: 'F6',
    numeroSerie: 'SN963852741',
    dataAquisicao: '2021-07-15',
    valorCompra: 5000,
    estadoConservacao: 'excelente',
    status: 'em-uso',
    observacoes: 'Gravador de campo'
  },
  {
    id: '11',
    nome: 'Tripé Manfrotto 546B',
    categoria: 'Acessórios',
    marca: 'Manfrotto',
    modelo: '546B',
    numeroSerie: 'SN159753456',
    dataAquisicao: '2020-04-10',
    valorCompra: 2500,
    estadoConservacao: 'regular',
    status: 'disponivel',
    observacoes: 'Tripé pesado'
  },
  {
    id: '12',
    nome: 'Slider Rhino Arc II',
    categoria: 'Acessórios',
    marca: 'Rhino',
    modelo: 'Arc II',
    numeroSerie: 'SN357951456',
    dataAquisicao: '2022-03-15',
    valorCompra: 12000,
    estadoConservacao: 'excelente',
    status: 'indisponivel',
    observacoes: 'Aguardando peça de reposição'
  }
];

// Eventos
export const eventosMock: Evento[] = [
  {
    id: '1',
    titulo: 'Reunião TechFlow - Briefing',
    descricao: 'Reunião de briefing para nova campanha',
    dataInicio: '2024-01-25T10:00:00',
    dataFim: '2024-01-25T12:00:00',
    tipo: 'reuniao',
    clienteId: '1',
    clienteNome: 'TechFlow Solutions',
    projetoId: '1',
    projetoNome: 'Campanha TechFlow 2024',
    local: 'Escritório TechFlow',
    lembrete: true
  },
  {
    id: '2',
    titulo: 'Filmagem Evento EcoVida',
    descricao: 'Cobertura completa do evento',
    dataInicio: '2024-01-26T08:00:00',
    dataFim: '2024-01-26T20:00:00',
    tipo: 'gravacao',
    clienteId: '2',
    clienteNome: 'EcoVida Brasil',
    projetoId: '2',
    projetoNome: 'Evento Sustentabilidade EcoVida',
    local: 'Parque Ibirapuera',
    lembrete: true
  },
  {
    id: '3',
    titulo: 'Entrega Projeto StartUp',
    descricao: 'Entrega final do vídeo de lançamento',
    dataInicio: '2024-01-30T14:00:00',
    dataFim: '2024-01-30T15:00:00',
    tipo: 'entrega',
    clienteId: '3',
    clienteNome: 'StartUp Inovadora',
    projetoId: '3',
    projetoNome: 'Lançamento Produto StartUp',
    local: 'Online',
    lembrete: true
  },
  {
    id: '4',
    titulo: 'Reunião Interna - Planejamento',
    descricao: 'Planejamento mensal da equipe',
    dataInicio: '2024-01-29T09:00:00',
    dataFim: '2024-01-29T11:00:00',
    tipo: 'interno',
    local: 'Sala de Reuniões Arthas',
    lembrete: false
  },
  {
    id: '5',
    titulo: 'Visita Técnica Horizonte',
    descricao: 'Visita para conhecer instalações',
    dataInicio: '2024-01-31T10:00:00',
    dataFim: '2024-01-31T12:00:00',
    tipo: 'visita',
    clienteId: '5',
    clienteNome: 'Construtora Horizonte',
    local: 'Obra Horizonte - Campinas',
    lembrete: true
  },
  {
    id: '6',
    titulo: 'Fotografia Sabor & Arte',
    descricao: 'Sessão de fotos do novo cardápio',
    dataInicio: '2024-01-27T11:00:00',
    dataFim: '2024-01-27T16:00:00',
    tipo: 'gravacao',
    clienteId: '4',
    clienteNome: 'Restaurante Sabor & Arte',
    projetoId: '4',
    projetoNome: 'Cardápio Digital Sabor & Arte',
    local: 'Restaurante Sabor & Arte',
    lembrete: true
  },
  {
    id: '7',
    titulo: 'Reunião Digital Plus',
    descricao: 'Aprovação de roteiros',
    dataInicio: '2024-01-28T14:00:00',
    dataFim: '2024-01-28T16:00:00',
    tipo: 'reuniao',
    clienteId: '6',
    clienteNome: 'Agência Digital Plus',
    projetoId: '5',
    projetoNome: 'Série de Conteúdo Digital Plus',
    local: 'Escritório Digital Plus',
    lembrete: true
  }
];

// Transações Financeiras
export const transacoesMock: Transacao[] = [
  {
    id: '1',
    tipo: 'entrada',
    descricao: 'Pagamento TechFlow - Campanha 2024',
    valor: 25000,
    data: '2024-01-10',
    dataVencimento: '2024-01-10',
    status: 'pago',
    categoria: 'Projetos',
    clienteId: '1',
    clienteNome: 'TechFlow Solutions',
    projetoId: '1',
    projetoNome: 'Campanha TechFlow 2024',
    observacoes: 'Pagamento integral'
  },
  {
    id: '2',
    tipo: 'entrada',
    descricao: 'Pagamento EcoVida - Evento',
    valor: 8000,
    data: '2024-01-20',
    dataVencimento: '2024-01-25',
    status: 'pendente',
    categoria: 'Eventos',
    clienteId: '2',
    clienteNome: 'EcoVida Brasil',
    projetoId: '2',
    projetoNome: 'Evento Sustentabilidade EcoVida',
    observacoes: 'Aguardando pagamento'
  },
  {
    id: '3',
    tipo: 'entrada',
    descricao: 'Pagamento StartUp - Lançamento',
    valor: 18000,
    data: '2024-01-15',
    dataVencimento: '2024-01-30',
    status: 'pendente',
    categoria: 'Projetos',
    clienteId: '3',
    clienteNome: 'StartUp Inovadora',
    projetoId: '3',
    projetoNome: 'Lançamento Produto StartUp',
    observacoes: '50% de entrada já pago'
  },
  {
    id: '4',
    tipo: 'saida',
    descricao: 'Compra de equipamentos - Lente Sony',
    valor: 12000,
    data: '2024-01-05',
    dataVencimento: '2024-01-05',
    status: 'pago',
    categoria: 'Equipamentos',
    observacoes: 'Nova lente 24-70mm'
  },
  {
    id: '5',
    tipo: 'saida',
    descricao: 'Salário - João Silva',
    valor: 8000,
    data: '2024-01-05',
    dataVencimento: '2024-01-05',
    status: 'pago',
    categoria: 'Folha de Pagamento',
    observacoes: 'Salário mensal'
  },
  {
    id: '6',
    tipo: 'saida',
    descricao: 'Salário - Maria Santos',
    valor: 7500,
    data: '2024-01-05',
    dataVencimento: '2024-01-05',
    status: 'pago',
    categoria: 'Folha de Pagamento',
    observacoes: 'Salário mensal'
  },
  {
    id: '7',
    tipo: 'saida',
    descricao: 'Aluguel do estúdio',
    valor: 4500,
    data: '2024-01-10',
    dataVencimento: '2024-01-10',
    status: 'pago',
    categoria: 'Despesas Fixas',
    observacoes: 'Aluguel mensal'
  },
  {
    id: '8',
    tipo: 'entrada',
    descricao: 'Pagamento Digital Plus - Janeiro',
    valor: 22000,
    data: '2024-01-01',
    dataVencimento: '2024-01-05',
    status: 'pago',
    categoria: 'Recorrência',
    clienteId: '6',
    clienteNome: 'Agência Digital Plus',
    observacoes: 'Mensalidade recorrente'
  },
  {
    id: '9',
    tipo: 'saida',
    descricao: 'Freelancer - Pedro Costa',
    valor: 3500,
    data: '2024-01-25',
    dataVencimento: '2024-01-25',
    status: 'pendente',
    categoria: 'Freelancers',
    observacoes: 'Pagamento por projeto EcoVida'
  },
  {
    id: '10',
    tipo: 'saida',
    descricao: 'Conta de energia',
    valor: 850,
    data: '2024-01-15',
    dataVencimento: '2024-01-15',
    status: 'pago',
    categoria: 'Despesas Fixas',
    observacoes: 'Energia elétrica'
  },
  {
    id: '11',
    tipo: 'entrada',
    descricao: 'Pagamento Sabor & Arte',
    valor: 4500,
    data: '2024-01-20',
    dataVencimento: '2024-01-20',
    status: 'pago',
    categoria: 'Projetos',
    clienteId: '4',
    clienteNome: 'Restaurante Sabor & Arte',
    projetoId: '4',
    projetoNome: 'Cardápio Digital Sabor & Arte',
    observacoes: 'Pagamento integral'
  },
  {
    id: '12',
    tipo: 'saida',
    descricao: 'Manutenção equipamentos',
    valor: 2500,
    data: '2024-01-18',
    dataVencimento: '2024-01-18',
    status: 'pago',
    categoria: 'Manutenção',
    observacoes: 'Manutenção preventiva'
  }
];

// Freelancers
export const freelancersMock: Freelancer[] = [
  {
    id: '1',
    nome: 'Pedro Costa',
    funcao: 'Cinegrafista',
    telefone: '(11) 98765-1111',
    whatsapp: '(11) 98765-1111',
    email: 'pedro.costa@email.com',
    valorDiaria: 800,
    valorHora: 100,
    disponibilidade: 'disponivel',
    observacoes: 'Especialista em eventos ao vivo',
    projetos: ['2']
  },
  {
    id: '2',
    nome: 'Ana Paula Ferreira',
    funcao: 'Editora de Vídeo',
    telefone: '(11) 98765-2222',
    whatsapp: '(11) 98765-2222',
    email: 'ana.ferreira@email.com',
    valorDiaria: 700,
    valorHora: 90,
    disponibilidade: 'ocupado',
    observacoes: 'Especialista em motion graphics',
    projetos: ['1', '3']
  },
  {
    id: '3',
    nome: 'Carlos Eduardo Lima',
    funcao: 'Roteirista',
    telefone: '(11) 98765-3333',
    whatsapp: '(11) 98765-3333',
    email: 'carlos.lima@email.com',
    valorDiaria: 900,
    valorHora: 120,
    disponibilidade: 'disponivel',
    observacoes: 'Experiência em roteiros corporativos',
    projetos: ['3', '6']
  },
  {
    id: '4',
    nome: 'Fernanda Lima',
    funcao: 'Fotógrafa',
    telefone: '(11) 98765-4444',
    whatsapp: '(11) 98765-4444',
    email: 'fernanda.lima@email.com',
    valorDiaria: 1000,
    valorHora: 130,
    disponibilidade: 'disponivel',
    observacoes: 'Especialista em fotografia gastronômica',
    projetos: ['4']
  },
  {
    id: '5',
    nome: 'Ricardo Souza',
    funcao: 'Operador de Drone',
    telefone: '(11) 98765-5555',
    whatsapp: '(11) 98765-5555',
    email: 'ricardo.souza@email.com',
    valorDiaria: 1200,
    valorHora: 150,
    disponibilidade: 'indisponivel',
    observacoes: 'Piloto certificado',
    projetos: []
  },
  {
    id: '6',
    nome: 'Juliana Martins',
    funcao: 'Assistente de Produção',
    telefone: '(11) 98765-6666',
    whatsapp: '(11) 98765-6666',
    email: 'juliana.martins@email.com',
    valorDiaria: 500,
    valorHora: 65,
    disponibilidade: 'disponivel',
    observacoes: 'Organizada e pontual',
    projetos: []
  }
];

// Tarefas
export const tarefasMock: Tarefa[] = [
  {
    id: '1',
    titulo: 'Finalizar edição TechFlow',
    descricao: 'Completar edição do vídeo principal',
    prioridade: 'alta',
    status: 'em-andamento',
    dataCriacao: '2024-01-20',
    dataLimite: '2024-01-28',
    responsavel: 'Ana Paula Ferreira',
    projetoId: '1'
  },
  {
    id: '2',
    titulo: 'Preparar equipamentos EcoVida',
    descricao: 'Separar e testar todos os equipamentos',
    prioridade: 'urgente',
    status: 'pendente',
    dataCriacao: '2024-01-24',
    dataLimite: '2024-01-25',
    responsavel: 'João Silva',
    projetoId: '2'
  },
  {
    id: '3',
    titulo: 'Revisão final StartUp',
    descricao: 'Última revisão antes da entrega',
    prioridade: 'urgente',
    status: 'pendente',
    dataCriacao: '2024-01-28',
    dataLimite: '2024-01-29',
    responsavel: 'Carlos Eduardo Lima',
    projetoId: '3'
  },
  {
    id: '4',
    titulo: 'Enviar contrato Horizonte',
    descricao: 'Preparar e enviar proposta comercial',
    prioridade: 'media',
    status: 'pendente',
    dataCriacao: '2024-01-22',
    dataLimite: '2024-01-30',
    responsavel: 'Maria Santos'
  },
  {
    id: '5',
    titulo: 'Backup de arquivos',
    descricao: 'Realizar backup mensal de todos os projetos',
    prioridade: 'baixa',
    status: 'pendente',
    dataCriacao: '2024-01-25',
    dataLimite: '2024-01-31'
  }
];

// Alertas
export const alertasMock: Alerta[] = [
  {
    id: '1',
    titulo: 'Prazo de entrega próximo',
    descricao: 'Projeto StartUp vence em 2 dias',
    tipo: 'warning',
    data: '2024-01-28',
    lido: false,
    link: '/projetos/3'
  },
  {
    id: '2',
    titulo: 'Pagamento pendente',
    descricao: 'EcoVida possui fatura de R$ 8.000 em aberto',
    tipo: 'error',
    data: '2024-01-26',
    lido: false,
    link: '/financeiro'
  },
  {
    id: '3',
    titulo: 'Novo projeto aprovado',
    descricao: 'TechFlow aprovou orçamento da nova campanha',
    tipo: 'success',
    data: '2024-01-25',
    lido: true,
    link: '/projetos'
  },
  {
    id: '4',
    titulo: 'Manutenção agendada',
    descricao: 'Equipamento Aputure 300x em manutenção',
    tipo: 'info',
    data: '2024-01-20',
    lido: true,
    link: '/inventario'
  },
  {
    id: '5',
    titulo: 'Reunião em 1 hora',
    descricao: 'Reunião com TechFlow às 10:00',
    tipo: 'warning',
    data: '2024-01-25',
    lido: false,
    link: '/calendario'
  }
];

// Categorias de equipamentos
export const categoriasEquipamentos = [
  'Câmeras',
  'Lentes',
  'Drones',
  'Estabilizadores',
  'Iluminação',
  'Áudio',
  'Acessórios'
];

// Categorias financeiras
export const categoriasFinanceiras = {
  entrada: ['Projetos', 'Eventos', 'Recorrência', 'Venda de Equipamentos', 'Outros'],
  saida: ['Equipamentos', 'Folha de Pagamento', 'Freelancers', 'Despesas Fixas', 'Manutenção', 'Impostos', 'Outros']
};

// Tipos de projeto
export const tiposProjeto = [
  'Vídeo Corporativo',
  'Vídeo Institucional',
  'Vídeo de Lançamento',
  'Conteúdo para Redes Sociais',
  'Cobertura de Evento',
  'Fotografia',
  'Documentário',
  'Produção de Conteúdo',
  'Motion Graphics',
  'Outro'
];

// Funções de freelancer
export const funcoesFreelancer = [
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
  'Outro'
];
