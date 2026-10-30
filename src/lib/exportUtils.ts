/**
 * Utility functions for exporting data in various formats.
 */

/**
 * Downloads a string as a text file.
 */
export const downloadTxt = (filename: string, content: string) => {
  const element = document.createElement('a');
  const file = new Blob([content], { type: 'text/plain;charset=utf-8' });
  element.href = URL.createObjectURL(file);
  element.download = `${filename}.txt`;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

/**
 * Formats a currency value to BRL style.
 */
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

/**
 * Generates a didactic text summary for the Dashboard module.
 */
export const generateDashboardTxt = (data: any, t: (k: string) => string) => {
  const { resumo, financeiro } = data;
  let txt = `=== ${t('nav.dashboard')} - THE BOSS ===\n`;
  txt += `Data do Relatório: ${new Date().toLocaleString()}\n\n`;
  
  txt += `--- RESUMO DE OPERAÇÃO ---\n`;
  txt += `Clientes Totais: ${resumo.totalClientes}\n`;
  txt += `Clientes Ativos: ${resumo.clientesAtivos}\n`;
  txt += `Projetos em Andamento: ${resumo.projetosAndamento}\n`;
  txt += `Equipamentos Disponíveis: ${resumo.equipamentosDisponiveis}\n`;
  txt += `Tarefas Pendentes: ${resumo.tarefasPendentes}\n\n`;
  
  txt += `--- RESUMIDO FINANCEIRO ---\n`;
  txt += `Saldo Líquido: ${formatCurrency(financeiro.saldo)}\n`;
  txt += `Entradas Confirmadas: ${formatCurrency(financeiro.entradas)}\n`;
  txt += `Saídas Confirmadas: ${formatCurrency(financeiro.saidas)}\n`;
  txt += `Previsão a Receber: ${formatCurrency(financeiro.contasReceber)}\n`;
  txt += `Contas a Pagar: ${formatCurrency(financeiro.contasPagar)}\n\n`;
  
  txt += `Gerado automaticamente via Sistema THE BOSS PRO.\n`;
  return txt;
};

/**
 * Generates a didactic text summary for the CRM module.
 */
export const generateCRMTxt = (clientes: any[], t: (k: string) => string) => {
  let txt = `=== ${t('nav.crm')} - THE BOSS ===\n`;
  txt += `Data do Relatório: ${new Date().toLocaleString()}\n`;
  txt += `Total de Clientes: ${clientes.length}\n\n`;
  
  txt += `--- LISTA DE CLIENTES ---\n`;
  clientes.forEach((c, i) => {
    txt += `${i + 1}. ${c.nomeEmpresa} (${c.nomeResponsavel})\n`;
    txt += `   Status: ${c.status.toUpperCase()} | Tipo: ${c.tipo.toUpperCase()}\n`;
    txt += `   Contato: ${c.contato || c.telefone} | Email: ${c.email}\n`;
    if (c.valorMensal) txt += `   Valor: ${formatCurrency(c.valorMensal)}\n`;
    txt += `   -----------------------------------\n`;
  });
  
  return txt;
};

/**
 * Generates a didactic text summary for the Financeiro module.
 */
export const generateFinanceiroTxt = (stats: any, t: (k: string) => string) => {
  let txt = `=== ${t('nav.finance')} - THE BOSS ===\n`;
  txt += `Data do Relatório: ${new Date().toLocaleString()}\n\n`;
  
  txt += `--- RESUMO FINANCEIRO DO PERÍODO ---\n`;
  txt += `Entradas Realizadas: ${formatCurrency(stats.entradas)}\n`;
  txt += `Saídas Realizadas: ${formatCurrency(stats.saidas)}\n`;
  txt += `Resultado Líquido: ${formatCurrency(stats.saldo)}\n`;
  txt += `-----------------------------------\n`;
  txt += `Contas a Receber (Pendentes): ${formatCurrency(stats.contasReceber)}\n`;
  txt += `Contas a Pagar (Pendentes): ${formatCurrency(stats.contasPagar)}\n`;
  txt += `Total Previsto: ${formatCurrency(stats.totalPrevisto)}\n\n`;
  
  txt += `Gerado automaticamente via Sistema THE BOSS PRO.\n`;
  return txt;
};

/**
 * Triggers the browser print dialog.
 * The layout is optimized via @media print in CSS.
 */
export const exportToPdf = () => {
  window.print();
};
