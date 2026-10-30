import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { exportToPdf, downloadTxt, generateFinanceiroTxt } from '@/lib/exportUtils';
import { ReportControls } from '@/components/ui-custom/ReportControls';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import type { Transacao, Cliente, Projeto } from '@/types';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Eye,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  Wallet,
  BarChart3,
  CheckCircle2,
  CalendarDays,
  LayoutList,
  RefreshCcw,
  Upload,
  FileText,
  X
} from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval, subMonths, addMonths, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend, 
  XAxis, 
  YAxis, 
  CartesianGrid,
  Area,
  AreaChart
} from 'recharts';

interface FinanceiroProps {
  transacoes: Transacao[];
  clientes: Cliente[];
  projetos: Projeto[];
  onAddTransacao: (transacao: Omit<Transacao, 'id'>) => void;
  onUpdateTransacao: (id: string, updates: Partial<Transacao>) => void;
  onDeleteTransacao: (id: string) => void;
}

const statusOptions = [
  { value: 'pago', label: 'Pago' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'atrasado', label: 'Atrasado' },
];

const categoriaEntrada = [
  'Projetos',
  'Eventos',
  'Recorrência',
  'Venda de Equipamentos',
  'Outros',
];

const categoriaSaida = [
  'Equipamentos',
  'Folha de Pagamento',
  'Freelancers',
  'Despesas Fixas',
  'Manutenção',
  'Impostos',
  'Outros',
];

const COLORS = ['#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4'];

export function Financeiro({ 
  transacoes, 
  clientes,
  projetos,
  onAddTransacao, 
  onUpdateTransacao, 
  onDeleteTransacao 
}: FinanceiroProps) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [tipoFilter, setTipoFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedTransacao, setSelectedTransacao] = useState<Transacao | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Filtro de Período
  const [dataInicio, setDataInicio] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [dataFim, setDataFim] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [selectedRange, setSelectedRange] = useState('este-mes');
  const [importMonth, setImportMonth] = useState(() => format(new Date(), 'MM'));
  const [importYear, setImportYear] = useState(() => format(new Date(), 'yyyy'));

  // Seleção múltipla para exclusão em massa
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<string[]>([]);

  // Estados de Conciliação Bancária via Extrato
  const [uploadedTransactions, setUploadedTransactions] = useState<any[]>([]);
  const [parsingFile, setParsingFile] = useState(false);
  const [fileName, setFileName] = useState('');
  const [filePeriod, setFilePeriod] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setParsingFile(true);
    setUploadedTransactions([]);

    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    // Determina o período do extrato amigável a partir da seleção do usuário
    const mesesNomes = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const monthIndex = parseInt(importMonth, 10) - 1;
    setFilePeriod(`${mesesNomes[monthIndex]}/${importYear}`);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const list: any[] = [];
      let parsedOk = false;

      try {
        let textContent = '';

        if (fileExtension === 'pdf') {
          // Leitor de PDF embutido no app (carregado só quando necessário)
          const loadPdfJS = async () => {
            const [pdfjs, worker] = await Promise.all([
              import('pdfjs-dist'),
              import('pdfjs-dist/build/pdf.worker.min.js?url'),
            ]);
            pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
            return pdfjs;
          };

          const pdfjs = await loadPdfJS();
          const arrayBuffer = event.target?.result as ArrayBuffer;
          const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
          
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            
            let lastY = -1;
            let pageText = '';
            for (const item of content.items as any[]) {
              const y = item.transform[5];
              if (lastY !== -1 && Math.abs(y - lastY) > 5) {
                pageText += '\n';
              } else if (pageText.length > 0 && !pageText.endsWith('\n')) {
                pageText += ' ';
              }
              pageText += item.str;
              lastY = y;
            }
            textContent += pageText + '\n';
          }
        } else {
          textContent = event.target?.result as string;
        }

        // Processa as linhas do extrato (seja TXT, CSV ou o texto extraído do PDF)
        const lines = textContent.split(/\r?\n/);
        let lastDate = '';
        let accumDesc = '';

        lines.forEach((line, index) => {
          const cleanLine = line.trim();
          if (!cleanLine || cleanLine.length < 5) return;

          // 1. Detecta data na linha (suporta dd/mm/yyyy, dd-mm-yyyy, yyyy-mm-dd, dd/mm)
          const dateRegex = /(\d{2}[/-]\d{2}[/-]\d{4}|\d{4}[/-]\d{2}[/-]\d{2}|\d{2}[/-]\d{2}[/-]\d{2}|\d{2}[/-]\d{2})/;
          const dateMatch = cleanLine.match(dateRegex);

          if (dateMatch) {
            const rawDate = dateMatch[1];
            let parsedDateStr = '';
            const parts = rawDate.split(/[/-]/);

            if (parts.length === 3) {
              const yearPart = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
              const monthPart = parts[1].padStart(2, '0');
              const dayPart = parts[0].padStart(2, '0');
              if (parts[0].length === 4) {
                parsedDateStr = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
              } else {
                parsedDateStr = `${yearPart}-${monthPart}-${dayPart}`;
              }
            } else if (parts.length === 2) {
              parsedDateStr = `${importYear}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }

            if (parsedDateStr) {
              const dateParts = parsedDateStr.split('-');
              lastDate = `${importYear}-${importMonth}-${dateParts[2]}`;
            }
            accumDesc = cleanLine.replace(rawDate, '').trim();
          } else {
            accumDesc += ' ' + cleanLine;
          }

          // Ignora linhas que são resumos de saldo ou metadados de cabeçalho
          if (cleanLine.toLowerCase().includes('saldo final') || cleanLine.toLowerCase().includes('extrato de conta') || cleanLine.toLowerCase().includes('detalhe dos movimentos')) {
            accumDesc = '';
            return;
          }

          // 2. Procura por valores monetários na linha
          const moneyRegex = /(-?\+?\s*R?\s*-?\+?\s*\d+[\d.,]*)/g;
          const moneyMatches = cleanLine.match(moneyRegex) || [];

          const validNumbers = moneyMatches
            .map(m => {
              const cleaned = m.replace(/R\$/g, '').replace(/\s/g, '');
              let norm = cleaned;
              if (cleaned.includes('.') && cleaned.includes(',')) {
                norm = cleaned.replace(/\./g, '').replace(',', '.');
              } else if (cleaned.includes(',')) {
                norm = cleaned.replace(',', '.');
              }
              const val = parseFloat(norm);
              return { raw: m, val };
            })
            .filter(item => !isNaN(item.val) && Math.abs(item.val) > 0.01 && Math.abs(item.val) < 1000000 && !/^\d{9,15}$/.test(item.raw.trim()));

          if (validNumbers.length > 0) {
            // Pega o valor da transação (costuma ser o primeiro valor na linha de movimentos)
            const valueItem = validNumbers[0];
            let value = valueItem.val;

            // 3. Determina Entrada ou Saída
            let tipo: 'entrada' | 'saida' = 'entrada';
            const lowerLine = cleanLine.toLowerCase();
            const lowerAccum = accumDesc.toLowerCase();

            const isNegative = valueItem.raw.includes('-') || 
                               value < 0 ||
                               lowerLine.includes(valueItem.raw.toLowerCase() + '-') ||
                               lowerLine.includes('-' + valueItem.raw.toLowerCase()) ||
                               lowerLine.includes(valueItem.raw.toLowerCase() + 'd') ||
                               lowerAccum.includes('enviado') ||
                               lowerAccum.includes('retirado') ||
                               lowerAccum.includes('reservado') ||
                               lowerAccum.includes('debito') ||
                               lowerAccum.includes('débito') ||
                               lowerAccum.includes('pagamento') ||
                               lowerAccum.includes('tarifa') ||
                               lowerAccum.includes('despesa') ||
                               lowerAccum.includes('compra') ||
                               lowerAccum.includes('envio');

            if (isNegative) {
              tipo = 'saida';
            }

            value = Math.abs(value);

            // 4. Extrai a Descrição (limpando ruídos como ID da operação e saldos adicionais)
            let desc = accumDesc;
            desc = desc.replace(/\b\d{10,15}\b/g, ''); // Remove IDs longos de operação
            validNumbers.forEach(item => {
              desc = desc.replace(item.raw, '');
            });
            if (validNumbers.length > 1) {
              desc = desc.replace(validNumbers[1].raw, ''); // Remove o saldo acumulado se houver
            }

            desc = desc.replace(/[;,\r\n\t]/g, ' ').replace(/\s+/g, ' ').trim();
            desc = desc.replace(/^[-+R$\s]+/g, '').trim();

            // Evita registrar linhas que viraram ruído de cabeçalho
            if (desc.length > 3 && !desc.toLowerCase().startsWith('id da operação') && !desc.toLowerCase().startsWith('valor saldo')) {
              const finalDate = lastDate || `${importYear}-${importMonth}-01`;
              list.push({
                id: `upl_${index}_${Date.now()}`,
                data: finalDate,
                tipo: tipo,
                descricao: desc,
                valor: value,
                categoria: tipo === 'entrada' ? 'Projetos' : 'Outros',
                status: 'pago' as const
              });
              parsedOk = true;
            }

            accumDesc = ''; // Limpa acumulador
          }
        });

        if (!parsedOk) {
          toast.error('Não foi possível extrair movimentações válidas deste extrato.');
          setParsingFile(false);
        } else {
          // Filtra transações de cabeçalhos, resumos ou movimentações internas de cofrinho/caixinha
          const filteredList = list.filter(item => {
            const descLower = item.descricao.toLowerCase();
            return (
              item.descricao && 
              !descLower.includes('extrato de conta') && 
              !descLower.includes('entradas:') &&
              !descLower.includes('saidas:') &&
              !descLower.includes('dinheiro reservado') &&
              !descLower.includes('dinheiro retirado') &&
              !descLower.includes('reservado caixa') &&
              !descLower.includes('retirado caixa')
            );
          });
          setUploadedTransactions(filteredList);
          setParsingFile(false);
          toast.success(`Extrato lido com sucesso! ${filteredList.length} transações identificadas.`);
        }
      } catch (err) {
        console.error(err);
        setParsingFile(false);
        toast.error('Erro ao ler arquivo. Verifique a formatação do documento.');
      }
    };

    if (fileExtension === 'pdf') {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  };

  const handleConciliateAll = () => {
    if (uploadedTransactions.length === 0) return;

    const erpDescs = new Set(transacoes.map(t => t.descricao.toLowerCase()));
    let importCount = 0;

    uploadedTransactions.forEach(item => {
      if (!erpDescs.has(item.descricao.toLowerCase())) {
        onAddTransacao({
          tipo: item.tipo,
          descricao: item.descricao,
          valor: item.valor,
          data: item.data,
          dataVencimento: item.data,
          status: 'pago',
          categoria: item.categoria,
          observacoes: `Lançado via Importação de Extrato Bancário (${fileName})`
        });
        importCount++;
      }
    });

    if (importCount > 0) {
      toast.success(`${importCount} novas transações conciliadas e adicionadas ao ERP com sucesso!`);
    } else {
      toast.info('Todas as transações do extrato já estavam cadastradas no sistema.');
    }
  };

  // Form state
  const [formData, setFormData] = useState({
    tipo: 'entrada' as 'entrada' | 'saida',
    descricao: '',
    valor: '',
    data: '',
    dataVencimento: '',
    status: 'pendente' as 'pago' | 'pendente' | 'atrasado',
    categoria: '',
    clienteId: '',
    projetoId: '',
    observacoes: '',
    metodoPagamento: '',
    parcelas: '1',
  });

  const groupedTransacoes = useMemo(() => {
    const map = new Map<string, Transacao[]>();
    const others: Transacao[] = [];

    // Filter by type and status and search
    const filtered = transacoes.filter(trans => {
      const matchesSearch = 
        (trans.descricao || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (trans.categoria || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesTipo = tipoFilter === 'all' || trans.tipo === tipoFilter;
      const matchesStatus = statusFilter === 'all' || trans.status === statusFilter;
      
      return matchesSearch && matchesTipo && matchesStatus;
    });

    filtered.forEach(t => {
      if ((t.categoria === 'Previsibilidade' || t.categoria === 'Recorrência') && t.clienteId) {
        if (!map.has(t.clienteId)) {
          map.set(t.clienteId, []);
        }
        map.get(t.clienteId)!.push(t);
      } else {
        others.push(t);
      }
    });

    const finalData: (Transacao & { children?: Transacao[] })[] = [...others];
    
    map.forEach((children) => {
      // Sort children by date (descending to show recent first in history)
      children.sort((a,b) => parseISO(b.dataVencimento || b.data).getTime() - parseISO(a.dataVencimento || a.data).getTime());
      
      // Find the most relevant one (e.g. next payment or most recent)
      // For Previsibilidade, we show the next pending one or the latest paid if none pending
      const pending = children.filter(c => c.status === 'pendente')
        .sort((a,b) => parseISO(a.dataVencimento).getTime() - parseISO(b.dataVencimento).getTime());
      
      const main = pending.length > 0 ? pending[0] : children[0];
      const rest = children.filter(c => c.id !== main.id);

      finalData.push({
        ...main,
        children: rest.length > 0 ? rest : undefined
      });
    });

    return finalData.sort((a,b) => parseISO(b.dataVencimento || b.data).getTime() - parseISO(a.dataVencimento || a.data).getTime());
  }, [transacoes, searchQuery, tipoFilter, statusFilter]);

  // Estatísticas filtradas por período
  const stats = useMemo(() => {
    const inicio = parseISO(dataInicio);
    const fim = endOfDay(parseISO(dataFim));
    
    // Transações no intervalo selecionado
    const transacoesPeriodo = transacoes.filter(t => {
      const dataVenc = parseISO(t.dataVencimento || t.data);
      return isWithinInterval(dataVenc, { start: inicio, end: fim });
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
      totalPrevisto: entradas + contasReceber,
      totalPago: entradas + saidas
    };
  }, [transacoes, dataInicio, dataFim]);

  // Dados para gráficos
  const dadosMensais = useMemo(() => {
    const meses = [];
    for (let i = 5; i >= 0; i--) {
      const data = subMonths(new Date(), i);
      const inicio = startOfMonth(data);
      const fim = endOfMonth(data);
      
      const transMes = transacoes.filter(t => {
        const tData = parseISO(t.data);
        return isWithinInterval(tData, { start: inicio, end: fim });
      });

      const entradas = transMes
        .filter(t => t.tipo === 'entrada' && t.status === 'pago')
        .reduce((sum, t) => sum + Number(t.valor), 0);
      
      const saidas = transMes
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

  const dadosCategoria = useMemo(() => {
    const porCategoria: Record<string, number> = {};
    transacoes
      .filter(t => t.tipo === 'saida' && t.status === 'pago')
      .forEach(t => {
        porCategoria[t.categoria] = (porCategoria[t.categoria] || 0) + t.valor;
      });
    return Object.entries(porCategoria)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [transacoes]);

  const handleOpenModal = (transacao?: Transacao) => {
    if (transacao) {
      setSelectedTransacao(transacao);
      setFormData({
        tipo: transacao.tipo,
        descricao: transacao.descricao,
        valor: transacao.valor.toString(),
        data: transacao.data,
        dataVencimento: transacao.dataVencimento,
        status: transacao.status,
        categoria: transacao.categoria,
        clienteId: transacao.clienteId || '',
        projetoId: transacao.projetoId || '',
        observacoes: transacao.observacoes,
        metodoPagamento: transacao.metodoPagamento || '',
        parcelas: transacao.parcelas?.toString() || '1',
      });
      setIsEditing(true);
    } else {
      setSelectedTransacao(null);
      setFormData({
        tipo: 'entrada',
        descricao: '',
        valor: '',
        data: format(new Date(), 'yyyy-MM-dd'),
        dataVencimento: format(new Date(), 'yyyy-MM-dd'),
        status: 'pendente',
        categoria: '',
        clienteId: '',
        projetoId: '',
        observacoes: '',
        metodoPagamento: '',
        parcelas: '1',
      });
      setIsEditing(false);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    const cliente = clientes.find(c => c.id === formData.clienteId);
    const projeto = projetos.find(p => p.id === formData.projetoId);
    const valorOriginal = parseFloat(formData.valor) || 0;
    const parcelas = parseInt(formData.parcelas) || 1;

    const baseData = {
      tipo: formData.tipo,
      descricao: formData.descricao,
      status: formData.status,
      categoria: formData.categoria,
      clienteId: formData.clienteId === 'none' ? undefined : formData.clienteId,
      projetoId: formData.projetoId === 'none' ? undefined : formData.projetoId,
      observacoes: formData.observacoes,
      clienteNome: cliente?.nomeEmpresa,
      projetoNome: projeto?.nome,
      metodoPagamento: formData.metodoPagamento,
      parcelas: parcelas,
    };

    if (isEditing && selectedTransacao) {
      onUpdateTransacao(selectedTransacao.id, {
        ...baseData,
        valor: valorOriginal,
        data: formData.data,
        dataVencimento: formData.dataVencimento,
      });
    } else {
      if (formData.metodoPagamento === 'Cartão' && parcelas > 1) {
        const valorParcela = valorOriginal / parcelas;
        const dataOrigem = parseISO(formData.dataVencimento);
        const dataRegistro = formData.data;

        for (let i = 0; i < parcelas; i++) {
          const proxVencimento = addMonths(dataOrigem, i);
          const descParcela = `${formData.descricao} (${i + 1}/${parcelas})`;
          const vencimentoStr = format(proxVencimento, 'yyyy-MM-dd');
          
          onAddTransacao({
            ...baseData,
            descricao: descParcela,
            valor: parseFloat(valorParcela.toFixed(2)),
            data: dataRegistro,
            dataVencimento: vencimentoStr,
            status: i === 0 ? formData.status : 'pendente',
          });

          if (formData.tipo === 'entrada' && cliente?.custoFixoTerceiro && cliente.custoFixoTerceiro > 0) {
            onAddTransacao({
              tipo: 'saida',
              descricao: `Custo Fixo Terceiro (${descParcela})`,
              valor: cliente.custoFixoTerceiro,
              data: dataRegistro,
              dataVencimento: vencimentoStr,
              status: 'pendente',
              categoria: 'Freelancers',
              clienteId: cliente.id,
              clienteNome: cliente.nomeEmpresa || cliente.nomeResponsavel,
              observacoes: 'Gerado automaticamente da parcela do Financeiro'
            });
          }
        }
      } else {
        onAddTransacao({
          ...baseData,
          valor: valorOriginal,
          data: formData.data,
          dataVencimento: formData.dataVencimento,
        });

        if (formData.tipo === 'entrada' && cliente?.custoFixoTerceiro && cliente.custoFixoTerceiro > 0) {
          onAddTransacao({
            tipo: 'saida',
            descricao: `Custo Fixo Terceiro (${formData.descricao})`,
            valor: cliente.custoFixoTerceiro,
            data: formData.data,
            dataVencimento: formData.dataVencimento,
            status: 'pendente',
            categoria: 'Freelancers',
            clienteId: cliente.id,
            clienteNome: cliente.nomeEmpresa || cliente.nomeResponsavel,
            observacoes: 'Gerado automaticamente da transação do Financeiro'
          });
        }
      }
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta transação?')) {
      onDeleteTransacao(id);
      setSelectedTransactionIds(prev => prev.filter(item => item !== id));
    }
  };

  const handleBulkDelete = () => {
    if (confirm(`Tem certeza que deseja excluir as ${selectedTransactionIds.length} transações selecionadas?`)) {
      selectedTransactionIds.forEach(id => {
        onDeleteTransacao(id);
      });
      setSelectedTransactionIds([]);
      toast.success(`${selectedTransactionIds.length} transações excluídas com sucesso!`);
    }
  };

  const handleViewTransacao = (transacao: Transacao) => {
    setSelectedTransacao(transacao);
    setIsViewModalOpen(true);
  };

  const handleQuickStatusUpdate = (trans: Transacao, status: 'pago', metodo?: string) => {
    onUpdateTransacao(trans.id, { 
      status,
      metodoPagamento: metodo || trans.metodoPagamento || 'Pix'
    });
    toast.success(`Fatura "${trans.descricao}" marcada como paga via ${metodo || 'Pix'}!`);
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
      if (dateStr.includes('/')) return dateStr;
      return format(parseISO(dateStr), 'dd/MM/yyyy', { locale: ptBR });
    } catch (e) {
      return 'Data inválida';
    }
  };

  const columns = [
    {
      key: 'select',
      header: (
        <input 
          type="checkbox" 
          className="rounded border-input text-primary focus:ring-primary h-4 w-4 accent-red-600 cursor-pointer"
          checked={
            groupedTransacoes.length > 0 && 
            groupedTransacoes.every(t => selectedTransactionIds.includes(t.id))
          }
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedTransactionIds(groupedTransacoes.map(t => t.id));
            } else {
              setSelectedTransactionIds([]);
            }
          }}
        />
      ),
      render: (trans: Transacao) => (
        <input 
          type="checkbox" 
          className="rounded border-input text-primary focus:ring-primary h-4 w-4 accent-red-600 cursor-pointer"
          checked={selectedTransactionIds.includes(trans.id)}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedTransactionIds(prev => [...prev, trans.id]);
            } else {
              setSelectedTransactionIds(prev => prev.filter(id => id !== trans.id));
            }
          }}
        />
      )
    },
    {
      key: 'descricao',
      header: 'Descrição',
      render: (trans: Transacao & { children?: Transacao[] }) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <p className="font-medium">{trans.descricao}</p>
            {trans.categoria === 'Previsibilidade' && (
              <Badge variant="secondary" className="text-[10px] h-4 bg-indigo-100 text-indigo-700 border-indigo-200">
                Recorrência
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            <span>{trans.categoria}</span>
            {trans.children && trans.children.length > 0 && (
              <span 
                className="flex items-center gap-1 bg-indigo-500/10 hover:bg-indigo-500/20 px-1.5 py-0.5 rounded text-indigo-600 font-bold cursor-pointer transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  // Forçar o clique no chevron da DataTable via DOM se necessário,
                  // ou confiar que a DataTable handlea o clique no TableCell todo.
                  // Na verdade, como adicionamos e.stopPropagation() no Chevron,
                  // aqui também podemos disparar um evento customizado ou apenas deixar a linha expandir.
                }}
              >
                <LayoutList className="w-3 h-3" />
                {1 + trans.children.length} Faturas
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'tipo',
      header: 'Tipo',
      render: (trans: Transacao) => (
        <div className="flex items-center gap-2">
          {trans.tipo === 'entrada' ? (
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-600" />
          )}
          <span className={trans.tipo === 'entrada' ? 'text-emerald-600' : 'text-red-600'}>
            {trans.tipo === 'entrada' ? 'Entrada' : 'Saída'}
          </span>
        </div>
      ),
    },
    {
      key: 'valor',
      header: 'Valor',
      render: (trans: Transacao) => (
        <span className={cn(
          "font-bold",
          trans.tipo === 'entrada' ? 'text-emerald-600' : 'text-red-600'
        )}>
          {trans.tipo === 'entrada' ? '+' : '-'}{formatCurrency(trans.valor)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (trans: Transacao) => (
        <BadgeStatus status={trans.status} />
      ),
    },
    {
      key: 'data',
      header: 'Data',
      render: (trans: Transacao) => (
        <div className="text-sm">
          <p>{formatDateSafe(trans.data)}</p>
          <p className="text-muted-foreground">
            Venc: {formatDateSafe(trans.dataVencimento)}
          </p>
        </div>
      ),
    },
    {
      key: 'acoes',
      header: 'Ações',
      render: (trans: Transacao) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-indigo-600"
            onClick={(e) => {
              e.stopPropagation();
              handleViewTransacao(trans);
            }}
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-primary"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenModal(trans);
            }}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(trans.id);
            }}
          >
            <Trash2 className="w-4 h-4" />
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
          <h2 className="text-2xl font-bold">{t('nav.finance')}</h2>
          <p className="text-muted-foreground">Controle de entradas e saídas</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              window.location.reload();
            }}
            className="hidden sm:flex gap-2"
          >
            <RefreshCcw className="w-4 h-4" />
            Reparar Dados
          </Button>
          <ReportControls 
            onExportPdf={exportToPdf}
            onExportTxt={() => {
              const txt = generateFinanceiroTxt(stats, t);
              downloadTxt('relatorio-financeiro', txt);
            }}
          />
          {selectedTransactionIds.length > 0 && (
            <Button 
              variant="destructive" 
              onClick={handleBulkDelete}
              className="gap-2 bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              <Trash2 className="w-4 h-4" />
              Excluir ({selectedTransactionIds.length})
            </Button>
          )}
          <Button onClick={() => handleOpenModal()} className="gap-2">
            <Plus className="w-4 h-4" />
            Nova Transação
          </Button>
        </div>
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 w-full sm:w-auto p-4 bg-muted/40 rounded-lg border">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Período:</span>
            <Input 
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-[140px] h-9 text-xs"
            />
            <span className="text-muted-foreground text-xs">até</span>
            <Input 
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-[140px] h-9 text-xs"
            />
          </div>
          <Select 
            value={selectedRange} 
            onValueChange={(value) => {
              setSelectedRange(value);
              const hoje = new Date();
              if (value === 'este-mes') {
                setDataInicio(format(startOfMonth(hoje), 'yyyy-MM-dd'));
                setDataFim(format(endOfMonth(hoje), 'yyyy-MM-dd'));
              } else if (value === 'mes-passado') {
                const lastMonth = subMonths(hoje, 1);
                setDataInicio(format(startOfMonth(lastMonth), 'yyyy-MM-dd'));
                setDataFim(format(endOfMonth(lastMonth), 'yyyy-MM-dd'));
              } else if (value === 'ultimo-trimestre') {
                const startRange = subMonths(hoje, 3);
                setDataInicio(format(startOfMonth(startRange), 'yyyy-MM-dd'));
                setDataFim(format(endOfMonth(hoje), 'yyyy-MM-dd'));
              } else if (value === 'ultimos-6-meses') {
                const startRange = subMonths(hoje, 6);
                setDataInicio(format(startOfMonth(startRange), 'yyyy-MM-dd'));
                setDataFim(format(endOfMonth(hoje), 'yyyy-MM-dd'));
              } else if (value === 'ultimos-12-meses') {
                const startRange = subMonths(hoje, 12);
                setDataInicio(format(startOfMonth(startRange), 'yyyy-MM-dd'));
                setDataFim(format(endOfMonth(hoje), 'yyyy-MM-dd'));
              }
            }}
          >
            <SelectTrigger className="w-[150px] h-9 text-xs">
              <SelectValue placeholder="Filtrar Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="este-mes">Este Mês</SelectItem>
              <SelectItem value="mes-passado">Mês Passado</SelectItem>
              <SelectItem value="ultimo-trimestre">Último Trimestre</SelectItem>
              <SelectItem value="ultimos-6-meses">Últimos 6 Meses</SelectItem>
              <SelectItem value="ultimos-12-meses">Últimos 12 Meses</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Entradas Realizadas"
          value={formatCurrency(stats.entradas)}
          icon={TrendingUp}
          iconClassName="bg-emerald-100 text-emerald-600"
          description="Recebido no período"
        />
        <StatCard
          title="Saídas Realizadas"
          value={formatCurrency(stats.saidas)}
          icon={TrendingDown}
          iconClassName="bg-red-100 text-red-600"
          description="Pago no período"
        />
        <StatCard
          title="Resultado (Líquido)"
          value={formatCurrency(stats.saldo)}
          icon={Wallet}
          iconClassName={stats.saldo >= 0 ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}
          description="Entradas - Saídas"
        />
        <StatCard
          title="Total a Receber"
          value={formatCurrency(stats.contasReceber)}
          icon={BarChart3}
          iconClassName="bg-indigo-100 text-indigo-600"
          description="Pendentes no período"
          className="bg-indigo-50/50 border-indigo-100 dark:bg-indigo-950/20"
        />
      </div>

      {/* Dashboard Charts */}
      <Tabs defaultValue="transacoes" className="w-full mt-6">
        <TabsList className="bg-muted/60 p-1.5 rounded-2xl">
          <TabsTrigger value="transacoes" className="gap-2 rounded-xl font-medium data-[state=active]:shadow-sm">
            <Wallet className="w-4 h-4" />
            Transações
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="gap-2 rounded-xl font-medium data-[state=active]:shadow-sm">
            <BarChart3 className="w-4 h-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="integracao" className="gap-2 rounded-xl font-medium data-[state=active]:shadow-sm">
            <Upload className="w-4 h-4" />
            Conciliar Extrato
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transacoes" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar transação..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger className="w-[150px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="entrada">Entrada</SelectItem>
                <SelectItem value="saida">Saída</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
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
          </div>

          {/* Table */}
          <DataTable
            columns={columns}
            data={groupedTransacoes}
            keyExtractor={(item) => item.id}
            emptyMessage="Nenhuma transação encontrada"
            renderSubRow={(item: any) => {
              if (!item.children || item.children.length === 0) return null;
              return (
                <div className="bg-muted/30 p-4 space-y-2 border-t">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <CalendarDays className="w-4 h-4" />
                      Histórico e Faturas Futuras da Recorrência
                    </h4>
                    <span className="text-[10px] text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded-full">
                      {item.children.length + 1} faturas no total para este ciclo
                    </span>
                  </div>
                  <div className="space-y-1">
                    {item.children.map((child: Transacao) => (
                      <div key={child.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-background/80 transition-all text-sm border border-transparent hover:border-border group">
                        <div className="flex items-center gap-4">
                          <BadgeStatus status={child.status} />
                          <div className="flex flex-col">
                            <span className="font-medium">{child.descricao}</span>
                            <span className="text-[10px] text-muted-foreground">{formatDateSafe(child.dataVencimento)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <span className={cn(
                            "font-bold w-24 text-right",
                             child.tipo === 'entrada' ? 'text-emerald-600' : 'text-red-600'
                          )}>
                            {child.tipo === 'entrada' ? '+' : '-'}{formatCurrency(child.valor)}
                          </span>
                          <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                            {child.status !== 'pago' && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="h-8 gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <CheckCircle2 className="h-4 w-4" />
                                    <span className="text-xs">Baixar</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                  <div className="p-2 text-[10px] font-bold text-muted-foreground uppercase">Método de Pagamento</div>
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleQuickStatusUpdate(child, 'pago', 'Pix'); }}>
                                    Pix
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleQuickStatusUpdate(child, 'pago', 'Dinheiro'); }}>
                                    Dinheiro
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleQuickStatusUpdate(child, 'pago', 'Cartão'); }}>
                                    Cartão
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleQuickStatusUpdate(child, 'pago', 'Transferência'); }}>
                                    Transferência
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleOpenModal(child); }}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleDelete(child.id); }}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }}
          />
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Gráfico de Fluxo */}
          <Card className="rounded-3xl shadow-sm hover:shadow-md transition-all border-border/50">
            <CardHeader>
              <CardTitle>Fluxo Financeiro (últimos 6 meses)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dadosMensais}>
                  <defs>
                    <linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorSaidas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="mes" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(v) => `R${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Area type="monotone" dataKey="entradas" stroke="#22c55e" fillOpacity={1} fill="url(#colorEntradas)" strokeWidth={2} name="Entradas" />
                  <Area type="monotone" dataKey="saidas" stroke="#ef4444" fillOpacity={1} fill="url(#colorSaidas)" strokeWidth={2} name="Saídas" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Gráfico de Lucro */}
            <Card className="rounded-3xl shadow-sm hover:shadow-md transition-all border-border/50">
              <CardHeader>
                <CardTitle>Lucro/Prejuízo Mensal</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dadosMensais}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="mes" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(v) => `R${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar 
                      dataKey="lucro" 
                      fill="#6366f1" 
                      radius={[4, 4, 0, 0]}
                      name="Lucro"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfico de Despesas por Categoria */}
            <Card className="rounded-3xl shadow-sm hover:shadow-md transition-all border-border/50">
              <CardHeader>
                <CardTitle>Despesas por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={dadosCategoria}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {dadosCategoria?.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Resumo */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
            <Card className="rounded-3xl shadow-md hover:shadow-lg transition-all bg-gradient-to-br from-emerald-50/50 to-transparent dark:from-emerald-950/20 border-emerald-200">
              <CardContent className="p-4">
                <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-600">Contas a Receber</p>
                <p className="text-3xl font-black tracking-tight text-emerald-700 mt-1">{formatCurrency(stats.contasReceber)}</p>
              </CardContent>
            </Card>
            <Card className="rounded-3xl shadow-md hover:shadow-lg transition-all bg-gradient-to-br from-amber-50/50 to-transparent dark:from-amber-950/20 border-amber-200">
              <CardContent className="p-4">
                <p className="text-[11px] font-bold uppercase tracking-widest text-amber-600">Contas a Pagar</p>
                <p className="text-3xl font-black tracking-tight text-amber-700 mt-1">{formatCurrency(stats.contasPagar)}</p>
              </CardContent>
            </Card>
            <Card className="rounded-3xl shadow-md hover:shadow-lg transition-all bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-950/20 border-blue-200">
              <CardContent className="p-4">
                <p className="text-[11px] font-bold uppercase tracking-widest text-blue-600">Total Movimentado</p>
                <p className="text-3xl font-black tracking-tight text-blue-700 mt-1">{formatCurrency(stats.totalPago)}</p>
              </CardContent>
            </Card>
            <Card className={cn(
              "rounded-3xl shadow-md hover:shadow-lg transition-all border",
              stats.saldo >= 0 ? "bg-gradient-to-br from-emerald-50/50 to-transparent dark:from-emerald-950/20 border-emerald-200" : "bg-gradient-to-br from-red-50/50 to-transparent dark:from-red-950/20 border-red-200"
            )}>
              <CardContent className="p-4">
                <p className={cn(
                  "text-[11px] font-bold uppercase tracking-widest",
                  stats.saldo >= 0 ? "text-emerald-600" : "text-red-600"
                )}>Resultado do Mês</p>
                <p className={cn(
                  "text-3xl font-black tracking-tight mt-1",
                  stats.saldo >= 0 ? "text-emerald-700" : "text-red-700"
                )}>{formatCurrency(stats.saldo)}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="integracao" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Upload Zone & Info */}
            <div className="space-y-6">
              <Card className="rounded-3xl border shadow-sm p-6 space-y-4">
                <div className="space-y-1">
                  <h4 className="text-base font-bold tracking-tight">Importar Arquivo de Extrato</h4>
                  <p className="text-xs text-muted-foreground">Suba o extrato exportado do seu banco (Mercado Pago, Nubank, Itaú, etc.) para conciliar os lançamentos no ERP.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold">Mês de Referência</Label>
                    <Select value={importMonth} onValueChange={setImportMonth}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Mês" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="01">Janeiro</SelectItem>
                        <SelectItem value="02">Fevereiro</SelectItem>
                        <SelectItem value="03">Março</SelectItem>
                        <SelectItem value="04">Abril</SelectItem>
                        <SelectItem value="05">Maio</SelectItem>
                        <SelectItem value="06">Junho</SelectItem>
                        <SelectItem value="07">Julho</SelectItem>
                        <SelectItem value="08">Agosto</SelectItem>
                        <SelectItem value="09">Setembro</SelectItem>
                        <SelectItem value="10">Outubro</SelectItem>
                        <SelectItem value="11">Novembro</SelectItem>
                        <SelectItem value="12">Dezembro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold">Ano de Referência</Label>
                    <Select value={importYear} onValueChange={setImportYear}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Ano" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2024">2024</SelectItem>
                        <SelectItem value="2025">2025</SelectItem>
                        <SelectItem value="2026">2026</SelectItem>
                        <SelectItem value="2027">2027</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="border-2 border-dashed border-muted rounded-2xl p-6 hover:bg-muted/30 transition-all cursor-pointer relative group flex flex-col items-center justify-center text-center gap-2 min-h-[160px]">
                  <input 
                    type="file" 
                    onChange={handleFileUpload}
                    accept=".csv,.txt,.ofx,.pdf,.xlsx,.xls" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold">Arraste o arquivo ou clique para subir</p>
                    <p className="text-[10px] text-muted-foreground">PDF, CSV, OFX, TXT ou Excel</p>
                  </div>
                </div>

                {fileName && (
                  <div className="p-3 bg-muted/50 border rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-red-600 shrink-0" />
                      <div className="truncate">
                        <p className="font-bold truncate">{fileName}</p>
                        <p className="text-[10px] text-muted-foreground">Período: {filePeriod}</p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => { setFileName(''); setUploadedTransactions([]); }}
                      className="w-6 h-6 hover:bg-red-500/10 text-red-500 rounded-full"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}

                {uploadedTransactions.length > 0 && (
                  <Button 
                    onClick={handleConciliateAll}
                    className="w-full gap-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs h-10"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Conciliar Tudo no ERP
                  </Button>
                )}
              </Card>

              <Card className="rounded-3xl border border-dashed border-red-500/20 bg-red-500/5 p-5 space-y-3">
                <h5 className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Como funciona?</h5>
                <ul className="text-[11px] text-muted-foreground space-y-2 list-disc list-inside">
                  <li>Exporta o extrato do seu banco no formato desejado.</li>
                  <li>Importa aqui no portal do THE BOSS.</li>
                  <li>O leitor inteligente identifica as datas, descrições e valores.</li>
                  <li>Você escolhe o que quer lançar no ERP com 1 clique.</li>
                </ul>
              </Card>
            </div>

            {/* Transações Extraídas */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="rounded-3xl border shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
                  <div className="space-y-0.5">
                    <CardTitle className="text-base font-bold">Lançamentos Detectados no Extrato</CardTitle>
                    {fileName && (
                      <p className="text-[11px] text-muted-foreground">Visualizando dados extraídos de <b>{fileName}</b></p>
                    )}
                  </div>
                  {uploadedTransactions.length > 0 && (
                    <Badge className="bg-red-600 hover:bg-red-600 text-white font-bold text-[10px]">
                      {uploadedTransactions.length} LANÇAMENTOS
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y max-h-[450px] overflow-y-auto">
                    {parsingFile ? (
                      <div className="p-12 text-center space-y-3">
                        <RefreshCcw className="w-8 h-8 text-red-600 animate-spin mx-auto" />
                        <p className="text-xs text-muted-foreground animate-pulse">Lendo extrato e extraindo movimentações financeiras...</p>
                      </div>
                    ) : uploadedTransactions.length === 0 ? (
                      <div className="p-16 text-center text-muted-foreground text-xs space-y-2">
                        <Upload className="w-8 h-8 mx-auto text-zinc-400 stroke-1" />
                        <p>Nenhum extrato importado. Faça o upload do arquivo para visualizar os lançamentos.</p>
                      </div>
                    ) : (
                      uploadedTransactions.map((item, idx) => {
                        const isAlreadyImported = transacoes.some(t => t.descricao.toLowerCase() === item.descricao.toLowerCase());
                        return (
                          <div key={item.id || idx} className="p-4 flex items-center justify-between hover:bg-muted/20 transition-all text-xs">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center",
                                item.tipo === 'entrada' ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                              )}>
                                {item.tipo === 'entrada' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                              </div>
                              <div>
                                <p className="font-semibold leading-none">{item.descricao}</p>
                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1">
                                  <span>{item.categoria}</span>
                                  <span>•</span>
                                  <span>{item.data}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <span className={cn(
                                "font-bold text-right min-w-[70px]",
                                item.tipo === 'entrada' ? "text-emerald-600" : "text-red-600"
                              )}>
                                {item.tipo === 'entrada' ? '+' : '-'}{formatCurrency(item.valor)}
                              </span>

                              {isAlreadyImported ? (
                                <Badge className="bg-emerald-500/10 hover:bg-emerald-500/10 text-emerald-600 border-emerald-200/30 text-[10px] font-bold py-0.5 px-2">
                                  Lançado
                                </Badge>
                              ) : (
                                <Button 
                                  onClick={() => {
                                    onAddTransacao({
                                      tipo: item.tipo,
                                      descricao: item.descricao,
                                      valor: item.valor,
                                      data: item.data,
                                      dataVencimento: item.data,
                                      status: 'pago',
                                      categoria: item.categoria,
                                      observacoes: `Lançamento manual via Importação (${fileName})`
                                    });
                                    toast.success(`Transação "${item.descricao}" lançada com sucesso!`);
                                  }}
                                  size="sm" 
                                  variant="outline" 
                                  className="text-[10px] font-bold h-7 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600"
                                >
                                  Lançar no ERP
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

      </Tabs>



      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto sm:rounded-3xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Editar Transação' : 'Nova Transação'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select 
                  value={formData.tipo} 
                  onValueChange={(v: 'entrada' | 'saida') => setFormData({ ...formData, tipo: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="saida">Saída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status *</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(v: 'pago' | 'pendente' | 'atrasado') => 
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

            <div className="space-y-2">
              <Label>Descrição *</Label>
              <Input
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Ex: Pagamento projeto TechFlow"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor (R$) *</Label>
                <Input
                  type="number"
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                  placeholder="0,00"
                />
              </div>
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
                    {(formData.tipo === 'entrada' ? categoriaEntrada : categoriaSaida)?.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Método de Pagamento</Label>
                <Select 
                  value={formData.metodoPagamento} 
                  onValueChange={(v) => setFormData({ ...formData, metodoPagamento: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="Pix">Pix</SelectItem>
                    <SelectItem value="Cartão">Cartão</SelectItem>
                    <SelectItem value="Transferência">Transferência</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.metodoPagamento === 'Cartão' && !isEditing && (
                <div className="space-y-2">
                  <Label>Parcelas</Label>
                  <Select 
                    value={formData.parcelas} 
                    onValueChange={(v) => setFormData({ ...formData, parcelas: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
                        <SelectItem key={num} value={num.toString()}>{num}x</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data *</Label>
                <Input
                  type="date"
                  value={formData.data}
                  onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Data de Vencimento *</Label>
                <Input
                  type="date"
                  value={formData.dataVencimento}
                  onChange={(e) => setFormData({ ...formData, dataVencimento: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cliente (opcional)</Label>
                <Select 
                  value={formData.clienteId} 
                  onValueChange={(v) => setFormData({ ...formData, clienteId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {clientes.filter(c => c.status === 'ativo')?.map(cliente => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.nomeEmpresa}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Projeto (opcional)</Label>
                <Select 
                  value={formData.projetoId} 
                  onValueChange={(v) => setFormData({ ...formData, projetoId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {projetos?.map(projeto => (
                      <SelectItem key={projeto.id} value={projeto.id}>
                        {projeto.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Informações adicionais..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {isEditing ? 'Salvar Alterações' : 'Criar Transação'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:rounded-2xl p-0 border-0 shadow-2xl bg-card overflow-hidden">
          {selectedTransacao && (
            <div className="flex flex-col h-full">
              {/* Top Banner with Massive Value */}
              <div className={cn(
                "relative p-6 md:p-8 flex flex-col justify-center items-center text-center overflow-hidden",
                selectedTransacao.tipo === 'entrada' 
                  ? "bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/40 dark:to-emerald-900/20" 
                  : "bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/40 dark:to-red-900/20"
              )}>
                <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none -mr-20 -mt-20 mix-blend-overlay bg-white dark:bg-black" />
                
                <Badge variant="outline" className={cn(
                  "mb-6 uppercase tracking-[0.3em] font-bold text-[10px] px-4 py-1.5 rounded-full border shadow-sm backdrop-blur-md relative z-10",
                  selectedTransacao.tipo === 'entrada' 
                    ? "text-emerald-700 border-emerald-300 dark:text-emerald-400 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/50" 
                    : "text-red-700 border-red-300 dark:text-red-400 dark:border-red-800 bg-red-50/50 dark:bg-red-950/50"
                )}>
                  {selectedTransacao.tipo === 'entrada' ? 'Receita' : 'Despesa'}
                </Badge>
                
                <h2 className="text-xl md:text-2xl font-bold text-foreground/80 mb-2 relative z-10">{selectedTransacao.descricao}</h2>
                
                <p className={cn(
                  "text-4xl md:text-5xl font-black tracking-tighter relative z-10 drop-shadow-sm",
                  selectedTransacao.tipo === 'entrada' ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-500"
                )}>
                  {selectedTransacao.tipo === 'entrada' ? '+' : '-'}{formatCurrency(selectedTransacao.valor)}
                </p>

                <div className="mt-8 relative z-10">
                  <BadgeStatus status={selectedTransacao.status} />
                </div>
              </div>

              {/* Details Grid */}
              <div className="p-6 md:p-8 flex flex-col gap-8 bg-card">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Categoria</p>
                    <p className="font-black text-xl">{selectedTransacao.categoria}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Data de Vencimento</p>
                    <div className="flex items-center gap-3">
                      <CalendarDays className="w-5 h-5 text-muted-foreground/60" />
                      <p className="font-black text-xl">{formatDateSafe(selectedTransacao.dataVencimento)}</p>
                    </div>
                  </div>
                </div>

                <div className="w-full h-px bg-border/50" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Cliente Relacionado</p>
                    {selectedTransacao.clienteNome ? (
                      <div className="flex items-center gap-3 bg-muted/40 p-3 rounded-2xl border border-border/40 w-fit">
                        <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-black">
                          {selectedTransacao.clienteNome.charAt(0)}
                        </div>
                        <p className="font-bold text-lg">{selectedTransacao.clienteNome}</p>
                      </div>
                    ) : (
                      <p className="font-medium text-muted-foreground/60 italic">Nenhum cliente</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Projeto Relacionado</p>
                    {selectedTransacao.projetoNome ? (
                      <div className="flex items-center gap-3 bg-muted/40 p-3 rounded-2xl border border-border/40 w-fit">
                        <LayoutList className="w-6 h-6 text-indigo-500" />
                        <p className="font-bold text-lg">{selectedTransacao.projetoNome}</p>
                      </div>
                    ) : (
                      <p className="font-medium text-muted-foreground/60 italic">Nenhum projeto</p>
                    )}
                  </div>
                </div>

                <div className="w-full h-px bg-border/50" />

                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Observações Adicionais</p>
                  {selectedTransacao.observacoes ? (
                    <div className="p-6 bg-muted/30 rounded-3xl border border-border/40 shadow-inner">
                      <p className="text-base text-foreground/80 leading-relaxed">{selectedTransacao.observacoes}</p>
                    </div>
                  ) : (
                    <p className="text-base text-muted-foreground/60 italic">Nenhuma observação registrada para esta transação.</p>
                  )}
                </div>

                <div className="flex justify-end gap-4 pt-4 mt-4">
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="rounded-xl px-6 font-bold"
                    onClick={() => {
                      setIsViewModalOpen(false);
                      handleOpenModal(selectedTransacao);
                    }}
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                  <Button 
                    variant="destructive"
                    size="lg"
                    className="rounded-xl px-6 font-bold"
                    onClick={() => {
                      handleDelete(selectedTransacao.id);
                      setIsViewModalOpen(false);
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
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
