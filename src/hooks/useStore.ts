import { useState, useCallback, useEffect, useRef } from 'react';
import type { 
  Cliente, Projeto, Equipamento, Evento, Transacao, 
  Freelancer, Tarefa, Alerta, FiltroPeriodo 
} from '@/types';
import { useAuth } from '@/contexts/AuthContext';

// VITE_API_URL é definido no build do app desktop (Electron), que roda em localhost
const API_URL = import.meta.env.VITE_API_URL || (['localhost', '127.0.0.1', '0.0.0.0'].includes(window.location.hostname) 
  ? 'http://localhost:3001' 
  : 'https://api.thebosspro.com');

// Helper hook to manage persistent state per user with cloud sync
function usePersistentState<T>(key: string, getInitialValue: () => T) {
  const { user } = useAuth();
  const storageKey = user ? `erp-data-${user.id}-${key}` : null;
  const isInitialSync = useRef(true);

  const [state, setState] = useState<T>(() => {
    if (!storageKey) return getInitialValue();
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : getInitialValue();
  });

  // 1. Initial Sync from Server
  useEffect(() => {
    if (!user || !storageKey) {
      isInitialSync.current = false;
      return;
    }

    const fetchFromServer = async () => {
      try {
        const response = await fetch(`${API_URL}/api/data/${user.id}/${key}`);
        if (response.ok) {
          const serverData = await response.json();
          const hasServerData = Array.isArray(serverData) ? serverData.length > 0 : (serverData && Object.keys(serverData).length > 0);
          
          if (hasServerData) {
            setState(serverData as unknown as T);
            localStorage.setItem(storageKey, JSON.stringify(serverData));
          }
        }
      } catch (err) {
        console.error(`Error syncing ${key} from server:`, err);
      } finally {
        isInitialSync.current = false;
      }
    };

    fetchFromServer();
  }, [user, storageKey, key]);

  // 2. Save state locally and to Server when it changes
  useEffect(() => {
    if (!storageKey || !user) return;
    
    // Update LocalStorage immediately for responsive UI
    localStorage.setItem(storageKey, JSON.stringify(state));

    // If we're still in the initial sync phase, don't push to server
    if (isInitialSync.current) return;

    // Update Server
    const saveToServer = async () => {
      try {
        await fetch(`${API_URL}/api/data/${user.id}/${key}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(state)
        });
      } catch (err) {
        console.error(`Error saving ${key} to server:`, err);
      }
    };

    const timeoutId = setTimeout(saveToServer, 500); // Simple debounce
    return () => clearTimeout(timeoutId);
  }, [state, storageKey, user, key]);

  return [state, setState] as const;
}

// Hook para Clientes
export function useClientes() {
  const [clientes, setClientes] = usePersistentState<Cliente[]>('clientes', () => []);

  const addCliente = useCallback((cliente: Omit<Cliente, 'id' | 'dataCadastro'>) => {
    const newCliente: Cliente = {
      ...cliente,
      id: Date.now().toString(),
      dataCadastro: new Date().toISOString().split('T')[0],
      historico: []
    };
    setClientes(prev => [...prev, newCliente]);
    return newCliente;
  }, [setClientes]);

  const updateCliente = useCallback((id: string, updates: Partial<Cliente>) => {
    setClientes(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  }, [setClientes]);

  const deleteCliente = useCallback((id: string) => {
    setClientes(prev => prev.filter(c => c.id !== id));
  }, [setClientes]);

  const addHistorico = useCallback((clienteId: string, atendimento: Omit<Cliente['historico'][0], 'id'>) => {
    setClientes(prev => prev.map(c => {
      if (c.id === clienteId) {
        return {
          ...c,
          historico: [...c.historico, { ...atendimento, id: Date.now().toString() }]
        };
      }
      return c;
    }));
  }, [setClientes]);

  return { clientes, addCliente, updateCliente, deleteCliente, addHistorico };
}

// Hook para Projetos
export function useProjetos() {
  const [projetos, setProjetos] = usePersistentState<Projeto[]>('projetos', () => []);

  const addProjeto = useCallback((projeto: Omit<Projeto, 'id' | 'historico' | 'arquivos'>) => {
    const newProjeto: Projeto = {
      ...projeto,
      id: Date.now().toString(),
      historico: [],
      arquivos: []
    };
    setProjetos(prev => [...prev, newProjeto]);
    return newProjeto;
  }, [setProjetos]);

  const updateProjeto = useCallback((id: string, updates: Partial<Projeto>) => {
    setProjetos(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, [setProjetos]);

  const deleteProjeto = useCallback((id: string) => {
    setProjetos(prev => prev.filter(p => p.id !== id));
  }, [setProjetos]);

  const moveProjeto = useCallback((id: string, newStatus: Projeto['status']) => {
    setProjetos(prev => prev.map(p => {
      if (p.id === id) {
        return {
          ...p,
          status: newStatus,
          historico: [...p.historico, {
            id: Date.now().toString(),
            data: new Date().toISOString(),
            descricao: `Projeto movido para: ${newStatus}`,
            autor: 'Sistema'
          }]
        };
      }
      return p;
    }));
  }, [setProjetos]);

  const addHistorico = useCallback((projetoId: string, historico: Omit<Projeto['historico'][0], 'id'>) => {
    setProjetos(prev => prev.map(p => {
      if (p.id === projetoId) {
        return {
          ...p,
          historico: [...p.historico, { ...historico, id: Date.now().toString() }]
        };
      }
      return p;
    }));
  }, [setProjetos]);

  return { projetos, addProjeto, updateProjeto, deleteProjeto, moveProjeto, addHistorico };
}

// Hook para Equipamentos
export function useEquipamentos() {
  const [equipamentos, setEquipamentos] = usePersistentState<Equipamento[]>('equipamentos', () => []);

  const addEquipamento = useCallback((equipamento: Omit<Equipamento, 'id'>) => {
    const newEquipamento: Equipamento = {
      ...equipamento,
      id: Date.now().toString()
    };
    setEquipamentos(prev => [...prev, newEquipamento]);
    return newEquipamento;
  }, [setEquipamentos]);

  const updateEquipamento = useCallback((id: string, updates: Partial<Equipamento>) => {
    setEquipamentos(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  }, [setEquipamentos]);

  const deleteEquipamento = useCallback((id: string) => {
    setEquipamentos(prev => prev.filter(e => e.id !== id));
  }, [setEquipamentos]);

  return { equipamentos, addEquipamento, updateEquipamento, deleteEquipamento };
}

// Hook para Eventos
export function useEventos() {
  const [eventos, setEventos] = usePersistentState<Evento[]>('eventos', () => []);

  const addEvento = useCallback((evento: Omit<Evento, 'id'>) => {
    const newEvento: Evento = {
      ...evento,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    setEventos(prev => [...prev, newEvento]);
    return newEvento;
  }, [setEventos]);

  const updateEvento = useCallback((id: string, updates: Partial<Evento>) => {
    setEventos(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  }, [setEventos]);

  const deleteEvento = useCallback((id: string) => {
    setEventos(prev => prev.filter(e => e.id !== id));
  }, [setEventos]);

  const deleteEventos = useCallback((ids: string[]) => {
    setEventos(prev => prev.filter(e => !ids.includes(e.id)));
  }, [setEventos]);

  return { eventos, addEvento, updateEvento, deleteEvento, deleteEventos };
}

// Hook para Transações
export function useTransacoes() {
  const [transacoes, setTransacoes] = usePersistentState<Transacao[]>('transacoes', () => []);

  const addTransacao = useCallback((transacao: Omit<Transacao, 'id'>) => {
    const newTransacao: Transacao = {
      ...transacao,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    setTransacoes(prev => [...prev, newTransacao]);
    return newTransacao;
  }, [setTransacoes]);

  const updateTransacao = useCallback((id: string, updates: Partial<Transacao>) => {
    setTransacoes(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, [setTransacoes]);

  const deleteTransacao = useCallback((id: string) => {
    setTransacoes(prev => prev.filter(t => t.id !== id));
  }, [setTransacoes]);

  const deleteTransacoes = useCallback((ids: string[]) => {
    setTransacoes(prev => prev.filter(t => !ids.includes(t.id)));
  }, [setTransacoes]);

  return { transacoes, addTransacao, updateTransacao, deleteTransacao, deleteTransacoes };
}

// Hook para Freelancers
export function useFreelancers() {
  const [freelancers, setFreelancers] = usePersistentState<Freelancer[]>('freelancers', () => []);

  const addFreelancer = useCallback((freelancer: Omit<Freelancer, 'id' | 'projetos'>) => {
    const newFreelancer: Freelancer = {
      ...freelancer,
      id: Date.now().toString(),
      projetos: []
    };
    setFreelancers(prev => [...prev, newFreelancer]);
    return newFreelancer;
  }, [setFreelancers]);

  const updateFreelancer = useCallback((id: string, updates: Partial<Freelancer>) => {
    setFreelancers(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  }, [setFreelancers]);

  const deleteFreelancer = useCallback((id: string) => {
    setFreelancers(prev => prev.filter(f => f.id !== id));
  }, [setFreelancers]);

  return { freelancers, addFreelancer, updateFreelancer, deleteFreelancer };
}

// Hook para Tarefas
export function useTarefas() {
  const [tarefas, setTarefas] = usePersistentState<Tarefa[]>('tarefas', () => []);

  const addTarefa = useCallback((tarefa: Omit<Tarefa, 'id' | 'dataCriacao'>) => {
    const newTarefa: Tarefa = {
      ...tarefa,
      id: Date.now().toString(),
      dataCriacao: new Date().toISOString().split('T')[0]
    };
    setTarefas(prev => [...prev, newTarefa]);
    return newTarefa;
  }, [setTarefas]);

  const updateTarefa = useCallback((id: string, updates: Partial<Tarefa>) => {
    setTarefas(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, [setTarefas]);

  const deleteTarefa = useCallback((id: string) => {
    setTarefas(prev => prev.filter(t => t.id !== id));
  }, [setTarefas]);

  return { tarefas, addTarefa, updateTarefa, deleteTarefa };
}

// Hook para Alertas
export function useAlertas() {
  const [alertas, setAlertas] = usePersistentState<Alerta[]>('alertas', () => []);

  const marcarComoLido = useCallback((id: string) => {
    setAlertas(prev => prev.map(a => a.id === id ? { ...a, lido: true } : a));
  }, [setAlertas]);

  const addAlerta = useCallback((alerta: Omit<Alerta, 'id' | 'data'>) => {
    const newAlerta: Alerta = {
      ...alerta,
      id: Date.now().toString(),
      data: new Date().toISOString().split('T')[0]
    };
    setAlertas(prev => [newAlerta, ...prev]);
    return newAlerta;
  }, [setAlertas]);

  const deleteAlerta = useCallback((id: string) => {
    setAlertas(prev => prev.filter(a => a.id !== id));
  }, [setAlertas]);

  return { alertas, marcarComoLido, addAlerta, deleteAlerta };
}

// Hook para Dashboard
export function useDashboard(
  clientes: Cliente[],
  projetos: Projeto[],
  equipamentos: Equipamento[],
  transacoes: Transacao[],
  tarefas: Tarefa[],
  eventos: Evento[]
) {
  const getResumo = useCallback(() => {
    const hoje = new Date().toISOString().split('T')[0];
    
    return {
      totalClientes: clientes.length,
      clientesAtivos: clientes.filter(c => c.status === 'ativo').length,
      clientesRecorrentes: clientes.filter(c => c.tipo === 'recorrente').length,
      clientesAvulsos: clientes.filter(c => c.tipo === 'avulso').length,
      projetosAndamento: projetos.filter(p => !['entregue', 'finalizado'].includes(p.status)).length,
      projetosFinalizados: projetos.filter(p => ['entregue', 'finalizado'].includes(p.status)).length,
      equipamentosDisponiveis: equipamentos.filter(e => e.status === 'disponivel').length,
      equipamentosEmUso: equipamentos.filter(e => e.status === 'em-uso').length,
      equipamentosManutencao: equipamentos.filter(e => e.status === 'manutencao').length,
      tarefasPendentes: tarefas.filter(t => t.status !== 'concluida').length,
      eventosHoje: eventos.filter(e => e.dataInicio.startsWith(hoje)).length
    };
  }, [clientes, projetos, equipamentos, tarefas, eventos]);

  const getFinanceiroMes = useCallback((mes: number, ano: number) => {
    const transacoesMes = transacoes.filter(t => {
      const data = new Date(t.data);
      return data.getMonth() === mes && data.getFullYear() === ano;
    });

    const entradas = transacoesMes
      .filter(t => t.tipo === 'entrada' && t.status === 'pago')
      .reduce((sum, t) => sum + t.valor, 0);
    
    const saidas = transacoesMes
      .filter(t => t.tipo === 'saida' && t.status === 'pago')
      .reduce((sum, t) => sum + t.valor, 0);

    const contasPagar = transacoesMes
      .filter(t => t.tipo === 'saida' && t.status === 'pendente')
      .reduce((sum, t) => sum + t.valor, 0);

    const contasReceber = transacoesMes
      .filter(t => t.tipo === 'entrada' && t.status === 'pendente')
      .reduce((sum, t) => sum + t.valor, 0);

    return {
      entradas,
      saidas,
      saldo: entradas - saidas,
      contasPagar,
      contasReceber
    };
  }, [transacoes]);

  const getDadosGraficoFinanceiro = useCallback((periodo: FiltroPeriodo) => {
    const dados: { mes: string; entradas: number; saidas: number }[] = [];
    const inicio = new Date(periodo.dataInicio);
    const fim = new Date(periodo.dataFim);
    
    let atual = new Date(inicio);
    while (atual <= fim) {
      const mes = atual.getMonth();
      const ano = atual.getFullYear();
      const financeiro = getFinanceiroMes(mes, ano);
      
      dados.push({
        mes: `${mes + 1}/${ano}`,
        entradas: financeiro.entradas,
        saidas: financeiro.saidas
      });
      
      atual.setMonth(atual.getMonth() + 1);
    }
    
    return dados;
  }, [getFinanceiroMes]);

  return { getResumo, getFinanceiroMes, getDadosGraficoFinanceiro };
}
