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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Evento, Cliente, Projeto } from '@/types';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User,
  FolderKanban,
  Bell,
  Video,
  Users,
  FileText,
  Building
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, parseISO, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';
import { useEffect } from 'react';

interface CalendarioProps {
  eventos: Evento[];
  clientes: Cliente[];
  projetos: Projeto[];
  onAddEvento: (evento: Omit<Evento, 'id'>) => void;
  onUpdateEvento: (id: string, updates: Partial<Evento>) => void;
  onDeleteEvento: (id: string) => void;
}

const tipoEventoOptions = [
  { value: 'reuniao', label: 'Reunião', icon: Users, color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'gravacao', label: 'Gravação', icon: Video, color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { value: 'entrega', label: 'Entrega', icon: FileText, color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { value: 'visita', label: 'Visita', icon: Building, color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'interno', label: 'Interno', icon: CalendarIcon, color: 'bg-gray-100 text-gray-700 border-gray-200' },
  { value: 'outro', label: 'Outro', icon: CalendarIcon, color: 'bg-slate-100 text-slate-700 border-slate-200' },
];

export function Calendario({ 
  eventos, 
  clientes,
  projetos,
  onAddEvento, 
  onUpdateEvento, 
  onDeleteEvento 
}: CalendarioProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'mes' | 'semana' | 'lista'>('mes');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedEvento, setSelectedEvento] = useState<Evento | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const { 
    login, 
    logout,
    accessToken,
    fetchGoogleEvents, 
    createGoogleEvent, 
    updateGoogleEvent, 
    deleteGoogleEvent,
    isSyncing,
    setIsSyncing 
  } = useGoogleCalendar();

  // Form state
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    dataInicio: '',
    dataFim: '',
    tipo: 'reuniao' as Evento['tipo'],
    clienteId: '',
    projetoId: '',
    local: '',
    lembrete: true,
    cor: '',
  });

  // Calendar data
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart, { locale: ptBR });
  const calendarEnd = endOfWeek(monthEnd, { locale: ptBR });
  
  // Auto-sync Google Calendar on mount if authenticated
  useEffect(() => {
    if (accessToken && !isSyncing) {
      handleSyncGoogle();
    }
  }, [accessToken]); // run once when token is available or changes
  
  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const getEventosDoDia = (date: Date) => {
    return eventos.filter(evento => {
      const eventoData = parseISO(evento.dataInicio);
      return isSameDay(eventoData, date);
    }).sort((a, b) => new Date(a.dataInicio).getTime() - new Date(b.dataInicio).getTime());
  };

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date());

  const handleDateClick = (date: Date) => {
    setFormData({
      ...formData,
      dataInicio: format(date, "yyyy-MM-dd'T'HH:mm"),
      dataFim: format(date, "yyyy-MM-dd'T'HH:mm"),
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleOpenModal = (evento?: Evento) => {
    if (evento) {
      setSelectedEvento(evento);
      setFormData({
        titulo: evento.titulo,
        descricao: evento.descricao,
        dataInicio: evento.dataInicio.slice(0, 16),
        dataFim: evento.dataFim.slice(0, 16),
        tipo: evento.tipo,
        clienteId: evento.clienteId || '',
        projetoId: evento.projetoId || '',
        local: evento.local || '',
        lembrete: evento.lembrete,
        cor: evento.cor || '',
      });
      setIsEditing(true);
    } else {
      setSelectedEvento(null);
      setFormData({
        titulo: '',
        descricao: '',
        dataInicio: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        dataFim: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        tipo: 'reuniao',
        clienteId: '',
        projetoId: '',
        local: '',
        lembrete: true,
        cor: '',
      });
      setIsEditing(false);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    const cliente = clientes.find(c => c.id === formData.clienteId);
    const projeto = projetos.find(p => p.id === formData.projetoId);

    const eventoData = {
      ...formData,
      clienteNome: cliente?.nomeEmpresa,
      projetoNome: projeto?.nome,
    };

    if (isEditing && selectedEvento) {
      onUpdateEvento(selectedEvento.id, eventoData);
      
      // Sincronizar atualização no Google se existir
      if (selectedEvento.googleEventId && accessToken) {
        updateGoogleEvent(accessToken, selectedEvento.googleEventId!, eventoData)
          .then(() => toast.success('Google Agenda atualizado'))
          .catch(err => console.error('Erro ao atualizar Google:', err));
      }
    } else {
      if (accessToken) {
        createGoogleEvent(accessToken, eventoData)
          .then(gEvent => {
            onAddEvento({ ...eventoData, googleEventId: gEvent.id, googleSync: true });
            toast.success('Evento criado e sincronizado com Google');
          })
          .catch(err => {
            console.error(err);
            onAddEvento(eventoData);
            toast.error('Evento criado localmente (falha ao sincronizar com Google)');
          });
      } else {
        onAddEvento(eventoData);
      }
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (evento: Evento) => {
    if (confirm('Tem certeza que deseja excluir este evento?')) {
      try {
        if (evento.googleEventId) {
          const token = await login();
          await deleteGoogleEvent(token, evento.googleEventId);
        }
        onDeleteEvento(evento.id);
        toast.success('Evento excluído');
      } catch (error) {
        console.error(error);
        onDeleteEvento(evento.id); // Deleta local de qualquer forma
      }
    }
  };

  const handleSyncGoogle = async (forceLogin = false) => {
    let retrying = false;
    setIsSyncing(true);
    try {
      // Usar token existente ou fazer login
      const token = (!forceLogin && accessToken) ? accessToken : await login();
      
      // Buscar eventos de -3 meses até +3 meses para garantir cobertura
      const timeMin = addMonths(currentDate, -3).toISOString();
      const timeMax = addMonths(currentDate, 3).toISOString();
      
      const googleEvents = await fetchGoogleEvents(token, timeMin, timeMax);
      
      let syncCount = 0;
      
      // 1. Google -> ERP
      for (const gEvent of googleEvents) {
        const idExistente = eventos.find(e => e.googleEventId === gEvent.id);
        if (!idExistente) {
          // Tratar datas de dia inteiro (formatar como início/fim do dia)
          const startStr = gEvent.start?.dateTime || (gEvent.start?.date ? `${gEvent.start.date}T09:00:00` : new Date().toISOString());
          const endStr = gEvent.end?.dateTime || (gEvent.end?.date ? `${gEvent.end.date}T18:00:00` : new Date().toISOString());

          onAddEvento({
            titulo: gEvent.summary || '(Sem título)',
            descricao: gEvent.description || '',
            dataInicio: startStr,
            dataFim: endStr,
            tipo: 'reuniao',
            lembrete: true,
            googleEventId: gEvent.id,
            googleSync: true
          });
          syncCount++;
        }
      }

      // 2. ERP -> Google
      for (const e of eventos) {
        if (!e.googleEventId && e.titulo) {
          try {
            const newGEvent = await createGoogleEvent(token, e);
            onUpdateEvento(e.id, { googleEventId: newGEvent.id, googleSync: true });
            syncCount++;
          } catch (err) {
            console.error('Erro ao enviar evento para Google:', err);
          }
        }
      }

      if (syncCount > 0) {
        toast.success(`${syncCount} eventos sincronizados!`);
      } else if (googleEvents.length === 0) {
        toast.info('Nenhum evento encontrado no Google para este período.');
      } else {
        toast.success('Agenda já está atualizada.');
      }
    } catch (error: any) {
      console.error(error);
      if (error?.message === 'Token expirado' && !forceLogin) {
        // Tentar novamente forçando login se o token tiver expirado
        retrying = true;
        handleSyncGoogle(true);
      } else if (error?.message !== 'Token expirado') {
        toast.error('Ocorreu um erro ao sincronizar.');
      }
    } finally {
      if (!retrying) {
        setIsSyncing(false);
      }
    }
  };

  const handleViewEvento = (evento: Evento) => {
    setSelectedEvento(evento);
    setIsViewModalOpen(true);
  };

  const getTipoConfig = (tipo: Evento['tipo']) => {
    return tipoEventoOptions.find(o => o.value === tipo) || tipoEventoOptions[5];
  };

  // Lista de próximos eventos
  const proximosEventos = useMemo(() => {
    return eventos
      .filter(e => new Date(e.dataInicio) >= new Date())
      .sort((a, b) => new Date(a.dataInicio).getTime() - new Date(b.dataInicio).getTime())
      .slice(0, 10);
  }, [eventos]);

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Calendário</h2>
          <p className="text-muted-foreground">Agenda e compromissos</p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as typeof viewMode)} className="w-full">
            <TabsList className="bg-muted/60 p-1.5 rounded-2xl h-10">
              <TabsTrigger value="mes" className="gap-2 rounded-xl font-medium data-[state=active]:shadow-sm">Mês</TabsTrigger>
              <TabsTrigger value="semana" className="gap-2 rounded-xl font-medium data-[state=active]:shadow-sm">Semana</TabsTrigger>
              <TabsTrigger value="lista" className="gap-2 rounded-xl font-medium data-[state=active]:shadow-sm">Lista</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex items-center gap-1">
            <Button 
              variant="default" 
              onClick={() => handleSyncGoogle()} 
              disabled={isSyncing}
              className={cn(
                "gap-2 transition-all shadow-md",
                accessToken 
                  ? "bg-blue-600 hover:bg-blue-700 text-white" 
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
              )}
            >
              <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
              {isSyncing 
                ? 'Sincronizando...' 
                : accessToken 
                  ? 'Agenda Sincronizada' 
                  : 'Sincronizar Agenda'}
            </Button>
            
            {accessToken && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={logout}
                title="Desconectar Google Agenda"
                className="text-muted-foreground hover:text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>

          <Button onClick={() => handleOpenModal()} className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Evento
          </Button>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h3 className="text-lg font-semibold min-w-[150px] text-center capitalize">
            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
          </h3>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Ir para:</span>
            <Input 
              type="date"
              value={format(currentDate, 'yyyy-MM-dd')}
              onChange={(e) => {
                if (e.target.value) {
                  // Use T12:00:00 to avoid timezone offset issues pushing it to previous day
                  setCurrentDate(new Date(e.target.value + 'T12:00:00'));
                }
              }}
              className="w-[140px]"
            />
          </div>
          <Button variant="outline" onClick={handleToday}>
            Hoje
          </Button>
        </div>
      </div>

      {/* Month View */}
      {viewMode === 'mes' && (
        <Card className="rounded-3xl shadow-sm hover:shadow-md transition-all border-border/50 overflow-hidden">
          <CardContent className="p-0">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 border-b">
              {weekDays?.map((day) => (
                <div 
                  key={day} 
                  className="py-3 text-center text-sm font-medium text-muted-foreground"
                >
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar Grid */}
            <div className="grid grid-cols-7">
              {calendarDays?.map((date, index) => {
                const eventosDoDia = getEventosDoDia(date);
                const isCurrentMonth = isSameMonth(date, currentDate);
                const isTodayDate = isToday(date);
                
                return (
                  <div
                    key={index}
                    onClick={() => handleDateClick(date)}
                    className={cn(
                      "min-h-[100px] p-2 border-b border-r cursor-pointer hover:bg-muted/50 transition-colors relative",
                      !isCurrentMonth && "bg-muted/10 text-muted-foreground",
                      isTodayDate && "bg-indigo-500/10 border-indigo-500/20"
                    )}
                  >
                    {isTodayDate && (
                      <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-600 rounded-b-full shadow-[0_1px_4px_rgba(79,70,229,0.5)]" />
                    )}
                    <div className={cn(
                      "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full mb-1",
                      isTodayDate && "bg-indigo-600 text-white"
                    )}>
                      {format(date, 'd')}
                    </div>
                    <div className="space-y-1">
                      {eventosDoDia.slice(0, 3)?.map((evento) => {
                        const Icon = getTipoConfig(evento.tipo).icon;
                        return (
                          <div 
                            key={evento.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewEvento(evento);
                            }}
                            className={cn(
                              "group relative flex items-center gap-1 p-1 mb-1 rounded text-[10px] cursor-pointer transition-all hover:scale-[1.02]",
                              evento.cor ? "text-white" : getTipoConfig(evento.tipo).color
                            )}
                            style={evento.cor ? { backgroundColor: evento.cor } : {}}
                          >
                            <Icon className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate font-medium">{evento.titulo}</span>
                            {evento.googleSync && (
                              <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 border border-white rounded-full" title="Sincronizado com Google" />
                            )}
                          </div>
                        );
                      })}
                      {eventosDoDia.length > 3 && (
                        <div className="text-[10px] text-muted-foreground text-center">
                          +{eventosDoDia.length - 3} mais
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Week View */}
      {viewMode === 'semana' && (
        <Card className="rounded-3xl shadow-sm hover:shadow-md transition-all border-border/50">
          <CardContent className="p-4">
            <div className="grid grid-cols-7 gap-2">
              {eachDayOfInterval({
                start: startOfWeek(currentDate, { locale: ptBR }),
                end: endOfWeek(currentDate, { locale: ptBR }),
              })?.map((date) => {
                const eventosDoDia = getEventosDoDia(date);
                const isTodayDate = isToday(date);
                
                return (
                  <div 
                    key={date.toISOString()} 
                    className={cn(
                      "border rounded-lg p-3 transition-colors relative",
                      isTodayDate ? "border-indigo-500 bg-indigo-500/10" : "bg-muted/20"
                    )}
                  >
                    {isTodayDate && (
                      <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500 rounded-t-lg" />
                    )}
                    <div className="text-center mb-3">
                      <p className="text-xs text-muted-foreground uppercase">
                        {format(date, 'EEE', { locale: ptBR })}
                      </p>
                      <p className={cn(
                        "text-lg font-bold",
                        isTodayDate && "text-indigo-600"
                      )}>
                        {format(date, 'd')}
                      </p>
                    </div>
                    <div className="space-y-2">
                      {eventosDoDia?.map((evento) => {
                        const tipoConfig = getTipoConfig(evento.tipo);
                        const Icon = tipoConfig.icon;
                        
                        return (
                          <div
                            key={evento.id}
                            onClick={() => handleViewEvento(evento)}
                            className={cn(
                              "relative p-2 rounded text-xs cursor-pointer",
                              evento.cor ? "text-white" : tipoConfig.color
                            )}
                            style={evento.cor ? { backgroundColor: evento.cor } : {}}
                          >
                            <div className="flex items-center gap-1 mb-1">
                              <Icon className="w-3 h-3" />
                              <span>{format(parseISO(evento.dataInicio), 'HH:mm')}</span>
                            </div>
                            <p className="font-medium truncate">{evento.titulo}</p>
                            {evento.googleSync && (
                              <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 border border-white rounded-full" title="Sincronizado com Google" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* List View */}
      {viewMode === 'lista' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
          <div className="lg:col-span-2">
            <Card className="rounded-3xl shadow-sm hover:shadow-md transition-all border-border/50">
              <CardHeader>
                <CardTitle>Próximos Eventos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {proximosEventos.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum evento próximo
                    </p>
                  ) : (
                    proximosEventos?.map((evento) => {
                      const tipoConfig = getTipoConfig(evento.tipo);
                      const Icon = tipoConfig.icon;
                      const data = parseISO(evento.dataInicio);
                      
                      return (
                        <div
                          key={evento.id}
                          onClick={() => handleViewEvento(evento)}
                          className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        >
                          <div className={cn(
                            "w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 relative",
                            evento.cor ? "text-white" : tipoConfig.color
                          )} style={evento.cor ? { backgroundColor: evento.cor } : {}}>
                            <Icon className="w-5 h-5" />
                            {evento.googleSync && (
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 border border-white rounded-full" title="Sincronizado com Google" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium truncate">{evento.titulo}</h4>
                              <Badge variant="outline" className="text-xs" style={evento.cor ? { borderColor: evento.cor, color: evento.cor } : {}}>
                                {tipoConfig.label}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <CalendarIcon className="w-3 h-3" />
                                {format(data, 'dd/MM/yyyy', { locale: ptBR })}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {format(data, 'HH:mm')}
                              </span>
                            </div>
                            {evento.clienteNome && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {evento.clienteNome}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenModal(evento);
                              }}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(evento);
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Legend */}
          <Card className="rounded-3xl shadow-sm hover:shadow-md transition-all border-border/50">
            <CardHeader>
              <CardTitle>Tipos de Evento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tipoEventoOptions?.map((tipo) => {
                  const Icon = tipo.icon;
                  return (
                    <div key={tipo.value} className="flex items-center gap-3">
                      <div className={cn("w-8 h-8 rounded flex items-center justify-center", tipo.color)}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm">{tipo.label}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto sm:rounded-3xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Editar Evento' : 'Novo Evento'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Ex: Reunião de briefing"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select 
                  value={formData.tipo} 
                  onValueChange={(v: Evento['tipo']) => setFormData({ ...formData, tipo: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tipoEventoOptions?.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Local</Label>
                <Input
                  value={formData.local}
                  onChange={(e) => setFormData({ ...formData, local: e.target.value })}
                  placeholder="Ex: Sala de reuniões"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data/Hora Início *</Label>
                <Input
                  type="datetime-local"
                  value={formData.dataInicio}
                  onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Data/Hora Fim *</Label>
                <Input
                  type="datetime-local"
                  value={formData.dataFim}
                  onChange={(e) => setFormData({ ...formData, dataFim: e.target.value })}
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
                    {projetos.filter(p => p.status !== 'entregue')?.map(projeto => (
                      <SelectItem key={projeto.id} value={projeto.id}>
                        {projeto.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Detalhes do evento..."
                rows={3}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="lembrete"
                    checked={formData.lembrete}
                    onChange={(e) => setFormData({ ...formData, lembrete: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="lembrete" className="cursor-pointer">
                    Ativar lembrete
                  </Label>
                </div>
                
                <div className="flex items-center gap-2 flex-1">
                  <Label htmlFor="cor" className="whitespace-nowrap">Cor personalizada:</Label>
                  <Input
                    type="color"
                    id="cor"
                    value={formData.cor || '#4f46e5'}
                    onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                    className="w-12 h-8 p-1 cursor-pointer"
                  />
                  {formData.cor && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 px-2 text-xs"
                      onClick={() => setFormData({ ...formData, cor: '' })}
                    >
                      Resetar
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {isEditing ? 'Salvar Alterações' : 'Criar Evento'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      {/* View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:rounded-[2rem] p-0 border-0 shadow-2xl bg-card overflow-hidden">
          {selectedEvento && (
            <div className="flex flex-col h-full">
              {/* Event Header Banner */}
              <div 
                className="relative p-8 md:p-12 flex flex-col justify-center overflow-hidden transition-colors"
                style={selectedEvento.cor ? { backgroundColor: `${selectedEvento.cor}15` } : {}}
              >
                {!selectedEvento.cor && (
                  <div className={cn("absolute inset-0 opacity-10", getTipoConfig(selectedEvento.tipo).color)} />
                )}
                <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none -mr-20 -mt-20 mix-blend-overlay bg-white dark:bg-black" />
                
                <div className="flex items-center gap-4 relative z-10 mb-6">
                  <div className={cn(
                    "w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg border border-white/20 backdrop-blur-md",
                    selectedEvento.cor ? "text-white" : getTipoConfig(selectedEvento.tipo).color
                  )} style={selectedEvento.cor ? { backgroundColor: selectedEvento.cor } : {}}>
                    {(() => {
                      const Icon = getTipoConfig(selectedEvento.tipo).icon;
                      return <Icon className="w-8 h-8" />;
                    })()}
                  </div>
                  <div>
                    <Badge variant="outline" className="px-3 py-1 uppercase tracking-widest text-[10px] font-bold shadow-sm bg-background/50 backdrop-blur-sm" style={selectedEvento.cor ? { borderColor: selectedEvento.cor, color: selectedEvento.cor } : {}}>
                      {getTipoConfig(selectedEvento.tipo).label}
                    </Badge>
                  </div>
                </div>

                <h2 className="text-3xl md:text-4xl font-black text-foreground/90 tracking-tight leading-tight relative z-10">
                  {selectedEvento.titulo}
                </h2>
              </div>

              {/* Event Details */}
              <div className="p-8 md:p-10 flex flex-col gap-8 bg-card relative z-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                      <CalendarIcon className="w-3.5 h-3.5 text-indigo-500" /> Data
                    </p>
                    <p className="font-black text-2xl">{format(parseISO(selectedEvento.dataInicio), 'dd/MM/yyyy', { locale: ptBR })}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-emerald-500" /> Horário
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="font-black text-2xl">{format(parseISO(selectedEvento.dataInicio), 'HH:mm')}</p>
                      <span className="text-muted-foreground font-bold">até</span>
                      <p className="font-black text-2xl">{format(parseISO(selectedEvento.dataFim), 'HH:mm')}</p>
                    </div>
                  </div>
                </div>

                <div className="w-full h-px bg-border/50" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  {selectedEvento.local && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-amber-500" /> Local
                      </p>
                      <p className="font-bold text-lg bg-muted/40 p-3 rounded-2xl border border-border/40 inline-block">
                        {selectedEvento.local}
                      </p>
                    </div>
                  )}

                  {selectedEvento.lembrete && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                        <Bell className="w-3.5 h-3.5 text-amber-500" /> Lembrete
                      </p>
                      <div className="flex items-center gap-2 text-amber-700 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-2xl border border-amber-200 dark:border-amber-900/50 w-fit">
                        <span className="font-bold">Lembrete ativado</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Cliente Relacionado</p>
                    {selectedEvento.clienteNome ? (
                      <div className="flex items-center gap-3 bg-muted/40 p-3 rounded-2xl border border-border/40 w-fit">
                        <User className="w-5 h-5 text-indigo-500" />
                        <p className="font-bold text-lg">{selectedEvento.clienteNome}</p>
                      </div>
                    ) : (
                      <p className="font-medium text-muted-foreground/60 italic">Nenhum cliente</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Projeto Relacionado</p>
                    {selectedEvento.projetoNome ? (
                      <div className="flex items-center gap-3 bg-muted/40 p-3 rounded-2xl border border-border/40 w-fit">
                        <FolderKanban className="w-5 h-5 text-purple-500" />
                        <p className="font-bold text-lg">{selectedEvento.projetoNome}</p>
                      </div>
                    ) : (
                      <p className="font-medium text-muted-foreground/60 italic">Nenhum projeto</p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Descrição</p>
                  <div className="p-6 bg-muted/30 rounded-3xl border border-border/40 shadow-inner">
                    <p className="text-base text-foreground/80 leading-relaxed">
                      {selectedEvento.descricao || <span className="italic opacity-60">Nenhuma descrição informada.</span>}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-6 mt-4">
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="rounded-xl px-6 font-bold"
                    onClick={() => {
                      setIsViewModalOpen(false);
                      handleOpenModal(selectedEvento);
                    }}
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                  <Button 
                    variant="destructive"
                    size="lg"
                    className="rounded-xl px-6 font-bold bg-red-500/10 text-red-600 border border-red-500/20 hover:bg-red-500 hover:text-white"
                    onClick={() => {
                      handleDelete(selectedEvento);
                      setIsViewModalOpen(false);
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir Evento
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
