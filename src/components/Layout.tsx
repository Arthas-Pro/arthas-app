import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger, 
  DropdownMenuLabel, 
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Package,
  Calendar,
  DollarSign,
  UserCircle,
  HelpCircle,
  Menu,
  ChevronLeft,
  ChevronRight,
  Bell,
  LogOut, 
  Compass,
  CheckCircle,
  CreditCard,
  User as UserIcon,
  Image as ImageIcon,
  Clock,
  Lock
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Alerta } from '@/types';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

interface LayoutProps {
  children: React.ReactNode;
  activeModule: string;
  onModuleChange: (module: string) => void;
  alertas: Alerta[];
}

export function Layout({ children, activeModule, onModuleChange, alertas }: LayoutProps) {
  const { t } = useLanguage();
  const [collapsed, setCollapsed] = useState(false);
  
  const navItems: NavItem[] = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { id: 'crm', label: t('nav.crm'), icon: Users },
    { id: 'projetos', label: t('nav.projects'), icon: FolderKanban },
    { id: 'inventario', label: t('nav.inventory'), icon: Package },
    { id: 'calendario', label: t('nav.calendar'), icon: Calendar },
    { id: 'financeiro', label: t('nav.finance'), icon: DollarSign },
    { id: 'equipe', label: t('nav.team'), icon: UserCircle },
    { id: 'suporte', label: t('nav.support'), icon: HelpCircle },
  ];
  const [mobileOpen, setMobileOpen] = useState(false);
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [myAccountOpen, setMyAccountOpen] = useState(false);
  const [secondaryPasswordDialogOpen, setSecondaryPasswordDialogOpen] = useState(false);
  const [masterPass, setMasterPass] = useState('');
  const [newSecondary, setNewSecondary] = useState('');
  const [confirmNewSecondary, setConfirmNewSecondary] = useState('');
  
  const { theme, setTheme } = useTheme();
  const { user, logout, updateUser, login } = useAuth();

  const avatarOptions = Array.from({ length: 10 }, (_, i) => ({
    id: i.toString(),
    url: `https://api.dicebear.com/7.x/avataaars/svg?seed=BossAvatar${i}&backgroundColor=b6e3f4,c0aede,d1d4f9`
  }));

  const userAvatar = avatarOptions.find(a => a.id === user?.avatarId)?.url || avatarOptions[0].url;

  const alertasNaoLidas = alertas.filter(a => !a.lido).length;

  const handleUpdateSecondaryPassword = async () => {
    if (!masterPass) return toast.error('Digite sua senha master.');
    if (newSecondary.length < 4) return toast.error('A nova senha deve ter pelo menos 4 caracteres.');
    if (newSecondary !== confirmNewSecondary) return toast.error('As senhas não coincidem.');
    
    // Simulate checking master password by trying to login
    // In a real app we would have a specific endpoint to validate password
    // For now we'll just assume it's correct if they typed anything (or we could use the login method but it resets state)
    // Actually, let's just use the login function. It will re-authenticate the user if correct.
    const success = await login(user?.email || '', masterPass);
    if (success) {
      updateUser({ secondaryPassword: newSecondary });
      if (user?.email) {
        localStorage.setItem(`erp-sec-pass-${user.email.toLowerCase()}`, newSecondary);
      }
      toast.success('Senha secundária atualizada com sucesso!');
      setSecondaryPasswordDialogOpen(false);
      setMasterPass('');
      setNewSecondary('');
      setConfirmNewSecondary('');
    } else {
      toast.error('Senha master incorreta.');
    }
  };

  const NavContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn(
        "flex items-center gap-3 px-4 py-4 border-b min-h-[72px]",
        collapsed && !mobile && "justify-center px-2"
      )}>
        {(!collapsed || mobile) ? (
          <div className="flex flex-col">
            <h1 className="text-3xl font-boss font-black tracking-tighter leading-none">
              <span className="text-foreground">THE</span> <span className="text-red-600 drop-shadow-sm">BOSS</span>
            </h1>
            <span className="text-[10px] tracking-widest text-muted-foreground font-bold uppercase mt-1">ERP & CRM</span>
          </div>
        ) : (
          <h1 className="text-2xl font-boss font-black tracking-tighter">
            <span className="text-red-600">B</span>
          </h1>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="px-2 space-y-1">
          {navItems?.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  onModuleChange(item.id);
                  if (mobile) setMobileOpen(false);
                }}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all w-full",
                  isActive 
                    ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-500/20" 
                    : "text-muted-foreground hover:bg-indigo-50/80 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400",
                  collapsed && !mobile && "justify-center px-2"
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {(!collapsed || mobile) && (
                  <span className="flex-1 text-left">{item.label}</span>
                )}
                {(!collapsed || mobile) && item.id === 'dashboard' && alertasNaoLidas > 0 && (
                  <Badge variant="secondary" className="bg-red-500 text-white text-xs">
                    {alertasNaoLidas}
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className={cn(
        "p-4 border-t",
        collapsed && !mobile && "px-2"
      )}>
        <button 
          onClick={logout}
          className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 transition-all w-full",
          collapsed && !mobile && "justify-center px-2"
        )}>
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {(!collapsed || mobile) && <span>{t('action.logout') || 'Sair'}</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:flex flex-col border-r bg-card transition-all duration-300",
        collapsed ? "w-20" : "w-64"
      )}>
        <NavContent />
        
        {/* Collapse button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-md hover:bg-indigo-700 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild className="lg:hidden">
          <Button 
            variant="ghost" 
            size="icon" 
            className="fixed top-4 left-4 z-50 lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <NavContent mobile />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Header */}
        <header className="h-20 border-b bg-card/80 backdrop-blur-md flex items-center justify-between px-6 lg:px-10 sticky top-0 z-40 shadow-sm">
          <div className="lg:hidden w-10" /> {/* Spacer for mobile menu button */}
          
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-black tracking-tight hidden sm:block text-foreground">
              {navItems.find(n => n.id === activeModule)?.label}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Select */}
            <div className="hidden sm:flex items-center gap-1 bg-muted/50 p-1 rounded-lg border">
              <button onClick={() => setTheme('light')} className={cn("px-2 py-1 rounded-md text-xs font-semibold transition-all", theme === 'light' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}>Light</button>
              <button onClick={() => setTheme('dark')} className={cn("px-2 py-1 rounded-md text-xs font-semibold transition-all", theme === 'dark' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}>Dark</button>
              <button onClick={() => setTheme('theme-liquid-glass')} className={cn("px-2 py-1 rounded-md text-xs font-semibold transition-all", theme === 'theme-liquid-glass' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}>Glass</button>
              <button onClick={() => setTheme('theme-gray')} className={cn("px-2 py-1 rounded-md text-xs font-semibold transition-all", theme === 'theme-gray' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}>Gray</button>
            </div>

            {/* Quick Jump / Ir Para */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative p-2 rounded-lg hover:bg-muted transition-colors flex items-center gap-2 group">
                  <Compass className="w-5 h-5 text-red-500 group-hover:text-red-600 transition-colors" />
                  <span className="hidden lg:block text-sm font-semibold text-muted-foreground group-hover:text-foreground">Ir para...</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Acesso Rápido</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {navItems?.map(item => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem 
                      key={item.id} 
                      onClick={() => onModuleChange(item.id)}
                      className="cursor-pointer font-medium"
                    >
                      <Icon className="w-4 h-4 mr-2 text-muted-foreground" />
                      {item.label}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
                  <Bell className="w-5 h-5 text-muted-foreground" />
                  {alertasNaoLidas > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {alertasNaoLidas}
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notificações</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-[300px] overflow-auto">
                  {alertas.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">Nenhuma notificação</div>
                  ) : (
                    alertas.map(alerta => (
                      <DropdownMenuItem key={alerta.id} className="flex flex-col items-start gap-1 p-3 cursor-default">
                        <div className="flex items-center justify-between w-full">
                          <span className={cn("text-sm font-semibold", alerta.lido ? "text-muted-foreground" : "text-foreground")}>{alerta.titulo}</span>
                          {!alerta.lido && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
                        </div>
                        <span className="text-xs text-muted-foreground line-clamp-2">{alerta.descricao}</span>
                      </DropdownMenuItem>
                    ))
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 pl-4 border-l hover:opacity-80 transition-opacity text-left">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium">{user?.name || 'Administrador'}</p>
                    <p className="text-xs text-muted-foreground">{user?.plan || 'Plano Pro'}</p>
                  </div>
                  <Avatar className="w-9 h-9 border-2 border-red-500 shadow-md">
                    <AvatarImage src={userAvatar} alt={user?.name} />
                    <AvatarFallback className="bg-red-600 text-white font-bold">
                      {user?.name.charAt(0) || 'A'}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-2">
                <DropdownMenuLabel className="flex flex-col gap-1">
                  <span className="font-bold">Sua Conta</span>
                  <span className="text-[10px] text-muted-foreground uppercase font-medium">{user?.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  className="cursor-pointer flex items-center gap-2"
                  onClick={() => setMyAccountOpen(true)}
                >
                  <UserIcon className="w-4 h-4 text-muted-foreground" />
                  Minha Assinatura
                </DropdownMenuItem>

                <DropdownMenuItem 
                  className="cursor-pointer flex items-center gap-2"
                  onClick={() => setAvatarDialogOpen(true)}
                >
                  <ImageIcon className="w-4 h-4 text-muted-foreground" />
                  Mudar Avatar
                </DropdownMenuItem>

                <DropdownMenuItem 
                  className="cursor-pointer flex items-center gap-2"
                  onClick={() => setSecondaryPasswordDialogOpen(true)}
                >
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  Mudar Senha Secundária
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair do sistema
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Dialogs */}
        <Dialog open={avatarDialogOpen} onOpenChange={setAvatarDialogOpen}>
          <DialogContent className="max-w-md sm:rounded-3xl p-6 shadow-2xl">
            <DialogHeader>
              <DialogTitle>Escolha seu Avatar</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-5 gap-4 py-4">
              {avatarOptions?.map((avatar) => (
                <button
                  key={avatar.id}
                  onClick={() => {
                    updateUser({ avatarId: avatar.id });
                    setAvatarDialogOpen(false);
                  }}
                  className={cn(
                    "p-1 rounded-full border-2 transition-all hover:scale-110",
                    user?.avatarId === avatar.id ? "border-indigo-600 bg-indigo-50" : "border-transparent"
                  )}
                >
                  <img src={avatar.url} alt={`Avatar ${avatar.id}`} className="w-full h-full rounded-full" />
                </button>
              ))}
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setAvatarDialogOpen(false)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={myAccountOpen} onOpenChange={setMyAccountOpen}>
          <DialogContent className="max-w-md sm:rounded-3xl p-6 shadow-2xl">
            <DialogHeader>
              <DialogTitle>Minha Assinatura</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-card border border-indigo-500/20 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2">
                  <Badge variant="outline" className="bg-indigo-500/10 text-indigo-500 border-indigo-500/20 text-[10px] uppercase font-bold tracking-widest">Ativo</Badge>
                </div>
                <div className="w-14 h-14 bg-indigo-600/10 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-7 h-7 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{user?.plan || 'THE BOSS PRO'}</h3>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Assinatura Anual</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Data de Início</p>
                    <p className="text-sm font-medium">{user?.dataAssinatura ? new Date(user.dataAssinatura).toLocaleDateString('pt-BR') : '15/01/2026'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-amber-500/10">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Válido até</p>
                    <p className="text-sm font-medium">{user?.validadeAssinatura ? new Date(user.validadeAssinatura).toLocaleDateString('pt-BR') : '15/01/2027'}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-indigo-600/5 border border-indigo-600/10 text-center">
                <p className="text-xs text-muted-foreground italic">"O segredo do sucesso é o gerenciamento da sua própria evolução."</p>
              </div>
            </div>
            <DialogFooter>
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700" onClick={() => setMyAccountOpen(false)}>Ok, entendi!</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={secondaryPasswordDialogOpen} onOpenChange={setSecondaryPasswordDialogOpen}>
          <DialogContent className="max-w-sm sm:rounded-3xl p-6 shadow-2xl">
            <DialogHeader>
              <DialogTitle>Mudar Senha Secundária</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Senha Master Atual</Label>
                <Input 
                  type="password" 
                  value={masterPass} 
                  onChange={(e) => setMasterPass(e.target.value)} 
                  placeholder="Sua senha de login" 
                />
              </div>
              <div className="space-y-2">
                <Label>Nova Senha Secundária</Label>
                <Input 
                  type="password" 
                  value={newSecondary} 
                  onChange={(e) => setNewSecondary(e.target.value)} 
                  placeholder="Nova senha" 
                />
              </div>
              <div className="space-y-2">
                <Label>Confirmar Nova Senha</Label>
                <Input 
                  type="password" 
                  value={confirmNewSecondary} 
                  onChange={(e) => setConfirmNewSecondary(e.target.value)} 
                  placeholder="Confirme a nova senha" 
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSecondaryPasswordDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleUpdateSecondaryPassword}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
