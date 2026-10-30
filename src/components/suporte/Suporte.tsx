import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  MessageCircle, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Video,
  BookOpen,
  LifeBuoy,
  Send
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FAQ {
  id: string;
  pergunta: string;
  resposta: string;
  categoria: string;
}

const faqs: FAQ[] = [
  {
    id: '1',
    pergunta: 'Como cadastrar um novo cliente?',
    resposta: 'Acesse o módulo CRM / Clientes e clique no botão "Novo Cliente". Preencha todos os campos obrigatórios marcados com asterisco (*) e clique em "Cadastrar Cliente".',
    categoria: 'CRM'
  },
  {
    id: '2',
    pergunta: 'Como mover um projeto no kanban?',
    resposta: 'No módulo Projetos, visualize em modo Kanban. Clique e arraste o card do projeto para a coluna correspondente à nova etapa do funil. O sistema atualizará automaticamente o status.',
    categoria: 'Projetos'
  },
  {
    id: '3',
    pergunta: 'Como registrar uma entrada ou saída financeira?',
    resposta: 'No módulo Financeiro, clique em "Nova Transação". Selecione o tipo (entrada ou saída), preencha a descrição, valor, categoria e datas. Você pode vincular a um cliente e projeto específicos.',
    categoria: 'Financeiro'
  },
  {
    id: '4',
    pergunta: 'Como cadastrar um equipamento no inventário?',
    resposta: 'Acesse o módulo Inventário e clique em "Novo Equipamento". Informe nome, categoria, marca, modelo, número de série, data de aquisição e valor de compra. O status inicial será "Disponível".',
    categoria: 'Inventário'
  },
  {
    id: '5',
    pergunta: 'Como agendar um evento no calendário?',
    resposta: 'No módulo Calendário, clique em "Novo Evento" ou diretamente em uma data no calendário. Preencha o título, tipo, data/hora e opcionalmente vincule a um cliente e projeto.',
    categoria: 'Calendário'
  },
  {
    id: '6',
    pergunta: 'Como cadastrar um freelancer?',
    resposta: 'Acesse o módulo Equipe e clique em "Novo Freelancer". Preencha os dados pessoais, função, valores de diária e hora, e disponibilidade. O telefone e WhatsApp permitem contato direto.',
    categoria: 'Equipe'
  },
  {
    id: '7',
    pergunta: 'Como gerar relatórios financeiros?',
    resposta: 'No módulo Financeiro, acesse a aba "Dashboard". Você encontrará gráficos de fluxo financeiro, lucro/prejuízo mensal e despesas por categoria. Use os filtros de período para análises específicas.',
    categoria: 'Relatórios'
  },
  {
    id: '8',
    pergunta: 'O que fazer quando um equipamento quebra?',
    resposta: 'No módulo Inventário, edite o equipamento e altere o status para "Manutenção" ou "Indisponível". Adicione observações sobre o problema para controle interno.',
    categoria: 'Inventário'
  },
  {
    id: '9',
    pergunta: 'Como adicionar histórico de atendimento a um cliente?',
    resposta: 'Acesse o cliente no módulo CRM, clique em visualizar e vá para a aba "Histórico". Clique em "Adicionar Interação", selecione o tipo e descreva o atendimento.',
    categoria: 'CRM'
  },
  {
    id: '10',
    pergunta: 'Como funciona o controle de tarefas?',
    resposta: 'As tarefas são exibidas no Dashboard na seção "Tarefas Urgentes". Você pode visualizar tarefas pendentes, em andamento e concluídas, com prioridades e prazos definidos.',
    categoria: 'Geral'
  },
];

const categorias = ['Todas', 'CRM', 'Projetos', 'Financeiro', 'Inventário', 'Calendário', 'Equipe', 'Relatórios', 'Geral'];

export function Suporte() {
  const [categoriaAtiva, setCategoriaAtiva] = useState('Todas');
  const [faqAberta, setFaqAberta] = useState<string | null>(null);
  const [formContato, setFormContato] = useState({
    nome: '',
    email: '',
    assunto: '',
    mensagem: ''
  });
  const [enviado, setEnviado] = useState(false);

  const faqsFiltradas = categoriaAtiva === 'Todas' 
    ? faqs 
    : faqs.filter(f => f.categoria === categoriaAtiva);

  const toggleFaq = (id: string) => {
    setFaqAberta(faqAberta === id ? null : id);
  };

  const handleSubmitContato = (e: React.FormEvent) => {
    e.preventDefault();
    // Simula envio
    setEnviado(true);
    setTimeout(() => {
      setEnviado(false);
      setFormContato({ nome: '', email: '', assunto: '', mensagem: '' });
    }, 3000);
  };

  const openWhatsApp = () => {
    window.open('https://wa.me/5589981455411', '_blank');
  };

  const openEmail = () => {
    window.open('mailto:arthasproducoes@gmail.com', '_blank');
  };

  return (
    <div className="p-4 lg:p-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Central de Suporte</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Encontre respostas para suas dúvidas ou entre em contato com nossa equipe de suporte
        </p>
      </div>

      {/* Cards de Contato */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="rounded-3xl shadow-md group hover:shadow-xl transition-all border-border/50">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                <MessageCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">WhatsApp</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Atendimento rápido direto no seu celular
                </p>
                <p className="font-medium text-emerald-600">(89) 98145-5411</p>
              </div>
              <Button onClick={openWhatsApp} className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700">
                <MessageCircle className="w-4 h-4" />
                Iniciar Conversa
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl shadow-md group hover:shadow-xl transition-all border-border/50">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Mail className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">E-mail</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Envie sua dúvida detalhada
                </p>
                <p className="font-medium text-blue-600">arthasproducoes@gmail.com</p>
              </div>
              <Button onClick={openEmail} variant="outline" className="w-full gap-2">
                <Mail className="w-4 h-4" />
                Enviar E-mail
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl shadow-md group hover:shadow-xl transition-all border-border/50">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Clock className="w-8 h-8 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Horário de Atendimento</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Segunda a Sexta
                </p>
                <p className="font-medium text-amber-600">08:00 - 18:00</p>
              </div>
              <Badge variant="secondary" className="gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Online agora
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FAQ Section */}
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-bold flex items-center justify-center gap-2">
            <HelpCircle className="w-6 h-6" />
            Perguntas Frequentes
          </h3>
          <p className="text-muted-foreground">Encontre respostas rápidas para as dúvidas mais comuns</p>
        </div>

        {/* Categorias */}
        <div className="flex flex-wrap justify-center gap-2">
          {categorias?.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoriaAtiva(cat)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                categoriaAtiva === cat
                  ? "bg-indigo-600 text-white"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* FAQ List */}
        <div className="max-w-3xl mx-auto space-y-3">
          {faqsFiltradas?.map((faq) => (
            <div
              key={faq.id}
              className="border border-border/50 rounded-2xl overflow-hidden bg-card shadow-sm hover:shadow-md transition-all"
            >
              <button
                onClick={() => toggleFaq(faq.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-xs">
                    {faq.categoria}
                  </Badge>
                  <span className="font-medium">{faq.pergunta}</span>
                </div>
                {faqAberta === faq.id ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                )}
              </button>
              {faqAberta === faq.id && (
                <div className="px-4 pb-4 pt-2 bg-muted/30">
                  <p className="text-muted-foreground pl-[72px]">{faq.resposta}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Formulário de Contato */}
      <Card className="max-w-3xl mx-auto rounded-2xl shadow-xl border-border/60 mt-16 bg-gradient-to-br from-card to-muted/20 backdrop-blur-sm relative overflow-hidden">
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
        <CardHeader className="p-6 md:p-8 pb-6">
          <CardTitle className="flex items-center gap-3 text-2xl font-bold">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <LifeBuoy className="w-5 h-5" />
            </div>
            Fale com o Suporte
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 md:p-8 pt-0">
          {enviado ? (
            <div className="text-center py-12 flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-emerald-100/80 dark:bg-emerald-900/30 flex items-center justify-center mb-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h4 className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mb-2">Mensagem Enviada!</h4>
              <p className="text-muted-foreground text-lg">Entraremos em contato em breve.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmitContato} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Nome</Label>
                  <Input
                    value={formContato.nome}
                    onChange={(e) => setFormContato({ ...formContato, nome: e.target.value })}
                    placeholder="Seu nome completo"
                    className="h-12 rounded-xl bg-background/50 border-border/60"
                    required
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">E-mail</Label>
                  <Input
                    type="email"
                    value={formContato.email}
                    onChange={(e) => setFormContato({ ...formContato, email: e.target.value })}
                    placeholder="seu@email.com"
                    className="h-12 rounded-xl bg-background/50 border-border/60"
                    required
                  />
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Assunto</Label>
                <Input
                  value={formContato.assunto}
                  onChange={(e) => setFormContato({ ...formContato, assunto: e.target.value })}
                  placeholder="Sobre o que é sua dúvida?"
                  className="h-12 rounded-xl bg-background/50 border-border/60"
                  required
                />
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Mensagem</Label>
                <Textarea
                  value={formContato.mensagem}
                  onChange={(e) => setFormContato({ ...formContato, mensagem: e.target.value })}
                  placeholder="Descreva sua dúvida ou problema em detalhes..."
                  rows={5}
                  className="rounded-2xl resize-none bg-background/50 border-border/60 p-4"
                  required
                />
              </div>
              <Button type="submit" size="lg" className="w-full h-14 rounded-xl text-lg font-bold shadow-lg shadow-primary/25 mt-4">
                <Send className="w-5 h-5 mr-2" />
                Enviar Mensagem
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Dicas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        <Card className="rounded-3xl shadow-sm hover:shadow-md transition-all bg-gradient-to-br from-indigo-50/50 to-transparent dark:from-indigo-950/20 border-indigo-100">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <BookOpen className="w-5 h-5 text-indigo-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-indigo-900">Documentação</h4>
                <p className="text-sm text-indigo-700 mt-1">
                  Acesse nossa documentação completa para aprender todos os recursos do sistema.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl shadow-sm hover:shadow-md transition-all bg-gradient-to-br from-emerald-50/50 to-transparent dark:from-emerald-950/20 border-emerald-100">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Video className="w-5 h-5 text-emerald-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-emerald-900">Tutoriais em Vídeo</h4>
                <p className="text-sm text-emerald-700 mt-1">
                  Assista aos nossos tutoriais no YouTube para aprender passo a passo.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl shadow-sm hover:shadow-md transition-all bg-gradient-to-br from-amber-50/50 to-transparent dark:from-amber-950/20 border-amber-100">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-900">Reportar Problema</h4>
                <p className="text-sm text-amber-700 mt-1">
                  Encontrou um bug? Reporte pelo formulário acima para correção rápida.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground pt-4 border-t">
        <p>Arthas Produções - Sistema de Gestão Empresarial</p>
        <p className="mt-1">Versão 1.0.0 • © 2024 Todos os direitos reservados</p>
      </div>
    </div>
  );
}
