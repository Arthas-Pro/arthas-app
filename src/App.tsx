import { useState } from 'react';
import { parseISO } from 'date-fns';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Layout } from '@/components/Layout';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { CRM } from '@/components/crm/CRM';
import { Projetos } from '@/components/projetos/Projetos';
import { Inventario } from '@/components/inventario/Inventario';
import { Calendario } from '@/components/CalendarioPRO/Calendario';
import { Financeiro } from '@/components/financeiro/Financeiro';
import { Equipe } from '@/components/equipe/Equipe';
import { 
  useClientes, 
  useProjetos, 
  useEquipamentos, 
  useEventos, 
  useTransacoes, 
  useFreelancers,
  useTarefas,
  useAlertas 
} from '@/hooks/useStore';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import type { Cliente, Projeto } from '@/types';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from '@/components/ui-custom/LanguageSwitcher';
import { SecurityLock } from '@/components/auth/SecurityLock';

/**
 * Componente principal do sistema.
 */
function AuthenticatedApp() {
  const [activeModule, setActiveModule] = useState('dashboard');



  // Hooks de estado
  const { 
    clientes, 
    addCliente, 
    updateCliente, 
    deleteCliente, 
    addHistorico: addHistoricoCliente 
  } = useClientes();
  
  const { 
    projetos, 
    addProjeto, 
    updateProjeto, 
    deleteProjeto, 
    moveProjeto 
  } = useProjetos();
  
  const { 
    equipamentos, 
    addEquipamento, 
    updateEquipamento, 
    deleteEquipamento 
  } = useEquipamentos();
  
  const { 
    eventos, 
    addEvento, 
    updateEvento, 
    deleteEvento 
  } = useEventos();
  
  const { 
    transacoes, 
    addTransacao, 
    updateTransacao, 
    deleteTransacao,
    deleteTransacoes
  } = useTransacoes();
  
  const { 
    freelancers, 
    addFreelancer, 
    updateFreelancer, 
    deleteFreelancer 
  } = useFreelancers();

  const { tarefas } = useTarefas();
  const { alertas } = useAlertas();

  // Função Auxiliar: Gerar parcelas de recorrência (previsibilidade) com blindagem contra duplicatas
  const gerarRecorrencia = (cliente: Cliente) => {
    if (cliente.tipo === 'recorrente' && cliente.valorMensal && cliente.duracaoContrato && cliente.diaPagamento) {
      const hoje = new Date();
      
      // Identificar faturas já existentes para este cliente para não duplicar
      const existentes = transacoes.filter(t => t.clienteId === cliente.id);
      
      for (let i = 0; i < cliente.duracaoContrato; i++) {
        const dataVencimento = new Date(hoje.getFullYear(), hoje.getMonth() + i, cliente.diaPagamento);
        const dataVenciso = dataVencimento.toISOString().split('T')[0];
        const desc = `Mensalidade: ${cliente.nomeEmpresa || cliente.nomeResponsavel} (${i + 1}/${cliente.duracaoContrato})`;
        
        // Só cria se não houver uma fatura EXATAMENTE igual (mesmo mês/cliente/descrição)
        const jaExiste = existentes.some(e => {
          const d = parseISO(e.dataVencimento || e.data);
          return d.getMonth() === dataVencimento.getMonth() && 
                 d.getFullYear() === dataVencimento.getFullYear() &&
                 e.descricao === desc;
        });

        if (!jaExiste) {
          addTransacao({
            tipo: 'entrada',
            descricao: desc,
            valor: cliente.valorMensal,
            data: dataVenciso,
            dataVencimento: dataVenciso,
            status: 'pendente',
            categoria: 'Recorrência',
            clienteId: cliente.id,
            clienteNome: cliente.nomeEmpresa || cliente.nomeResponsavel,
            observacoes: 'Gerado automaticamente via sistema de recorrência'
          });
        }
        
        if (cliente.custoFixoTerceiro && cliente.custoFixoTerceiro > 0) {
          const descCusto = `Custo Fixo Terceiro: ${cliente.nomeEmpresa || cliente.nomeResponsavel} (${i + 1}/${cliente.duracaoContrato})`;
          const jaExisteCusto = existentes.some(e => {
            const d = parseISO(e.dataVencimento || e.data);
            return d.getMonth() === dataVencimento.getMonth() && 
                   d.getFullYear() === dataVencimento.getFullYear() &&
                   e.descricao === descCusto;
          });

          if (!jaExisteCusto) {
             addTransacao({
               tipo: 'saida',
               descricao: descCusto,
               valor: cliente.custoFixoTerceiro,
               data: dataVenciso,
               dataVencimento: dataVenciso,
               status: 'pendente',
               categoria: 'Freelancers',
               clienteId: cliente.id,
               clienteNome: cliente.nomeEmpresa || cliente.nomeResponsavel,
               observacoes: 'Gerado automaticamente pelo Custo Fixo de Terceiro do cliente'
             });
          }
        }
      }
    }
  };

  // Handlers com lógica de negócio e notificações
  const handleAddCliente = (clienteData: Omit<Cliente, 'id' | 'dataCadastro'>) => {
    const newCliente = addCliente(clienteData);
    if (clienteData.tipo === 'recorrente') {
      gerarRecorrencia(newCliente);
    } else if (clienteData.tipo === 'avulso' && clienteData.percentualEntrada && clienteData.valorServico) {
      const valorEntrada = (clienteData.valorServico * clienteData.percentualEntrada) / 100;
      if (valorEntrada > 0) {
        addTransacao({
          tipo: 'entrada',
          descricao: `Entrada (${clienteData.percentualEntrada}%): ${clienteData.nomeEmpresa || clienteData.nomeResponsavel}`,
          valor: valorEntrada,
          data: new Date().toISOString().split('T')[0],
          dataVencimento: new Date().toISOString().split('T')[0],
          status: 'pendente',
          categoria: 'Serviço Avulso',
          clienteId: newCliente.id,
          clienteNome: newCliente.nomeEmpresa || newCliente.nomeResponsavel,
          observacoes: 'Gerado automaticamente da entrada do serviço avulso'
        });
      }
      
      if (clienteData.custoFixoTerceiro && clienteData.custoFixoTerceiro > 0) {
        addTransacao({
          tipo: 'saida',
          descricao: `Custo Fixo Terceiro: ${clienteData.nomeEmpresa || clienteData.nomeResponsavel}`,
          valor: clienteData.custoFixoTerceiro,
          data: new Date().toISOString().split('T')[0],
          dataVencimento: new Date().toISOString().split('T')[0],
          status: 'pendente',
          categoria: 'Freelancers',
          clienteId: newCliente.id,
          clienteNome: newCliente.nomeEmpresa || newCliente.nomeResponsavel,
          observacoes: 'Custo fixo atrelado gerado automaticamente do serviço avulso'
        });
      }
    }
    toast.success('Cliente cadastrado com sucesso!');
  };

  const handleUpdateCliente = (id: string, updates: Partial<Cliente>) => {
    const clienteAnterior = clientes.find(c => c.id === id);
    if (!clienteAnterior) return;

    updateCliente(id, updates);
    const clienteAtualizado = { ...clienteAnterior, ...updates } as Cliente;
    
    // Se mudou para recorrente ou atualizou valor/duracao, 
    // apenas GARANTE que as faturas existam sem deletar as atuais
    if (clienteAtualizado.tipo === 'recorrente') {
      gerarRecorrencia(clienteAtualizado);
      toast.success('Cronograma de recebíveis sincronizado!');
    } else {
      toast.success('Cliente atualizado!');
    }
  };

  const handleDeleteCliente = (id: string) => {
    deleteCliente(id);
    // Deletar também todas as transações/parcelas vinculadas de forma eficiente
    const idsDeletar = transacoes
      .filter(t => t.clienteId === id)
      .map(t => t.id);
    
    if (idsDeletar.length > 0) {
      deleteTransacoes(idsDeletar);
    }
    toast.success('Cliente e movimentações removidos!');
  };

  const handleAddProjeto = (projeto: Omit<Projeto, 'id' | 'historico' | 'arquivos'>) => {
    addProjeto(projeto);
    toast.success('Projeto criado com sucesso!');
  };

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return (
          <SecurityLock sectionId="dashboard">
            <Dashboard 
              clientes={clientes} 
              projetos={projetos}
              equipamentos={equipamentos}
              transacoes={transacoes}
              tarefas={tarefas}
              eventos={eventos}
              alertas={alertas}
              clientesPrioritarios={clientes.filter(c => c.status !== 'encerrado' && (c.prioridade === 'alta' || c.prioridade === 'urgente'))}
              projetosPrioritarios={projetos.filter(p => !['entregue', 'cancelado'].includes(p.status) && (p.prioridade === 'alta' || p.prioridade === 'urgente'))}
            />
          </SecurityLock>
        );
      case 'crm':
        return (
          <SecurityLock sectionId="crm">
            <CRM 
              clientes={clientes} 
              onAddCliente={handleAddCliente}
              onUpdateCliente={handleUpdateCliente}
              onDeleteCliente={handleDeleteCliente}
              onAddHistorico={addHistoricoCliente}
            />
          </SecurityLock>
        );
      case 'projetos':
        return (
          <Projetos 
            projetos={projetos}
            clientes={clientes}
            freelancers={freelancers}
            onAddProjeto={handleAddProjeto}
            onUpdateProjeto={(id, upds) => { updateProjeto(id, upds); toast.success('Projeto atualizado!'); }}
            onDeleteProjeto={(id) => { deleteProjeto(id); toast.error('Projeto removido.'); }}
            onMoveProjeto={moveProjeto}
            onAddCliente={handleAddCliente}
          />
        );
      case 'inventario':
        return (
          <Inventario 
            equipamentos={equipamentos}
            freelancers={freelancers}
            onAddEquipamento={addEquipamento}
            onUpdateEquipamento={updateEquipamento}
            onDeleteEquipamento={deleteEquipamento}
          />
        );
      case 'calendario':
        return (
          <Calendario 
            eventos={eventos}
            clientes={clientes}
            projetos={projetos}
            onAddEvento={addEvento}
            onUpdateEvento={updateEvento}
            onDeleteEvento={deleteEvento}
          />
        );
      case 'financeiro':
        return (
          <SecurityLock sectionId="financeiro">
            <Financeiro 
              transacoes={transacoes}
              clientes={clientes}
              projetos={projetos}
              onAddTransacao={addTransacao}
              onUpdateTransacao={updateTransacao}
              onDeleteTransacao={deleteTransacao}
            />
          </SecurityLock>
        );
      case 'equipe':
        return (
          <Equipe 
            freelancers={freelancers}
            projetos={projetos}
            onAddFreelancer={addFreelancer}
            onUpdateFreelancer={updateFreelancer}
            onDeleteFreelancer={deleteFreelancer}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Layout 
      activeModule={activeModule} 
      onModuleChange={setActiveModule}
      alertas={alertas}
    >
      {renderModule()}
    </Layout>
  );
}

function AppContent() {
  return (
    <>
      <AuthenticatedApp />
      <Toaster position="top-right" richColors />
    </>
  );
}

function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <ErrorBoundary>
            <AppContent />
            <LanguageSwitcher />
          </ErrorBoundary>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}

export default App;
