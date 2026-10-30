import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

type Language = 'pt' | 'en' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Simplificando o dicionário para facilitar a manutenção inicial
// Em um sistema real, isso viria de arquivos JSON separados
const translations: Record<Language, Record<string, string>> = {
  pt: {
    // General
    'app.name': 'THE BOSS',
    'app.tagline': 'O Controle Absoluto da sua Agência',
    'app.tagline_highlight': 'Audiovisual',
    'app.subtagline': 'ESPECIALIZADO PARA PRODUTORES',
    'app.description': 'O ERP e CRM definitivo para agências e produtoras que buscam o domínio total dos seus projetos, equipamentos e finanças.',
    'app.powered_by': 'POWERED BY ARTHAS',
    
    // Auth & Landing
    'auth.login_button': 'Já sou cliente',
    'auth.flex_plan': 'THE BOSS FLEX',
    'auth.pro_plan': 'THE BOSS PRO',
    'auth.flex_desc': 'Para negócios dando os primeiros passos expressivos.',
    'auth.pro_desc': 'Acesso extremo. Economia e Domínio Total.',
    'auth.most_sold': 'MAIS VENDIDO',
    'auth.monthly': 'mês',
    'auth.annually': 'anualmente',
    'auth.billed_annually': 'Cobrado R$ 274,80 anualmente.',
    'auth.savings_desc': 'Economia garantida sobre o plano Flex!',
    'auth.subscribe_flex': 'ASSINAR PLANO FLEX',
    'auth.subscribe_pro': 'ASSINAR PLANO PRO',
    'auth.features.projects': 'Gestão completa de Projetos',
    'auth.features.crm': 'CRM Inteligente de Vendas',
    'auth.features.finance': 'Gestão Financeira & Recibo Automatizado',
    'auth.features.inventory': 'Controle de Inventário e Agendamentos',
    'auth.features.support': 'Suporte Premium 24/7',
    
    // Dashboard & Sidebar
    'nav.dashboard': 'Visão Panorâmica',
    'nav.crm': 'CRM / Clientes',
    'nav.projects': 'Projetos',
    'nav.inventory': 'Inventário',
    'nav.calendar': 'Calendário',
    'nav.finance': 'Financeiro',
    'nav.team': 'Equipe',
    'nav.support': 'Suporte',
    'nav.export': 'Exportar Relatório',
    'nav.export_pdf': 'Exportar PDF',
    'nav.export_txt': 'Exportar TXT',
    
    // Common Actions
    'action.save': 'Salvar',
    'action.cancel': 'Cancelar',
    'action.edit': 'Editar',
    'action.delete': 'Excluir',
    'action.view': 'Visualizar',
    'action.add': 'Adicionar',
    'action.filter': 'Filtrar',
    'action.search': 'Buscar...',
    'action.logout': 'Sair',
  },
  en: {
    // General
    'app.name': 'THE BOSS',
    'app.tagline': 'Absolute Control for your Agency',
    'app.tagline_highlight': 'Audiovisual',
    'app.subtagline': 'TAILORED FOR PRODUCERS',
    'app.description': 'The definitive ERP and CRM for agencies and production houses seeking total mastery of their projects, equipment, and finances.',
    'app.powered_by': 'POWERED BY ARTHAS',
    
    // Auth & Landing
    'auth.login_button': 'Already a client',
    'auth.flex_plan': 'THE BOSS FLEX',
    'auth.pro_plan': 'THE BOSS PRO',
    'auth.flex_desc': 'For businesses taking their first significant steps.',
    'auth.pro_desc': 'Extreme access. Economy and total dominance.',
    'auth.most_sold': 'BEST SELLER',
    'auth.monthly': 'month',
    'auth.annually': 'annually',
    'auth.billed_annually': 'Billed R$ 274,80 annually.',
    'auth.savings_desc': 'Guaranteed savings over the Flex plan!',
    'auth.subscribe_flex': 'SUBSCRIBE FLEX PLAN',
    'auth.subscribe_pro': 'SUBSCRIBE PRO PLAN',
    'auth.features.projects': 'Complete project management',
    'auth.features.crm': 'Intelligent sales CRM',
    'auth.features.finance': 'Financial management & automated receipts',
    'auth.features.inventory': 'Inventory control and scheduling',
    'auth.features.support': 'Premium Support 24/7',
    
    // Dashboard & Sidebar
    'nav.dashboard': 'Panoramic View',
    'nav.crm': 'CRM / Clients',
    'nav.projects': 'Projects',
    'nav.inventory': 'Inventory',
    'nav.calendar': 'Calendar',
    'nav.finance': 'Finance',
    'nav.team': 'Team',
    'nav.support': 'Support',
    'nav.export': 'Export Report',
    'nav.export_pdf': 'Export PDF',
    'nav.export_txt': 'Export TXT',
    
    // Common Actions
    'action.save': 'Save',
    'action.cancel': 'Cancel',
    'action.edit': 'Edit',
    'action.delete': 'Delete',
    'action.view': 'View',
    'action.add': 'Add',
    'action.filter': 'Filter',
    'action.search': 'Search...',
    'action.logout': 'Logout',
  },
  es: {
    // General
    'app.name': 'THE BOSS',
    'app.tagline': 'El Control Absoluto de su Agencia',
    'app.tagline_highlight': 'Audiovisual',
    'app.subtagline': 'ESPECIALIZADO PARA PRODUCTORES',
    'app.description': 'El ERP y CRM definitivo para agencias y productoras que buscan el dominio total de sus proyectos, equipos y finanzas.',
    'app.powered_by': 'POWERED BY ARTHAS',
    
    // Auth & Landing
    'auth.login_button': 'Ya soy cliente',
    'auth.flex_plan': 'THE BOSS FLEX',
    'auth.pro_plan': 'THE BOSS PRO',
    'auth.flex_desc': 'Para negocios que dan sus primeros pasos significativos.',
    'auth.pro_desc': 'Acceso extremo. Economía y dominio total.',
    'auth.most_sold': 'MÁS VENDIDO',
    'auth.monthly': 'mes',
    'auth.annually': 'anualmente',
    'auth.billed_annually': 'Facturado R$ 274,80 anualmente.',
    'auth.savings_desc': '¡Ahorro garantizado sobre el plan Flex!',
    'auth.subscribe_flex': 'SUSCRIBIR PLAN FLEX',
    'auth.subscribe_pro': 'SUSCRIBIR PLAN PRO',
    'auth.features.projects': 'Gestión completa de proyectos',
    'auth.features.crm': 'CRM inteligente de ventas',
    'auth.features.finance': 'Gestión financiera y recibo automatizado',
    'auth.features.inventory': 'Control de inventario y programación',
    'auth.features.support': 'Soporte Premium 24/7',
    
    // Dashboard & Sidebar
    'nav.dashboard': 'Visión Panorámica',
    'nav.crm': 'CRM / Clientes',
    'nav.projects': 'Proyectos',
    'nav.inventory': 'Inventario',
    'nav.calendar': 'Calendario',
    'nav.finance': 'Financiero',
    'nav.team': 'Equipo',
    'nav.support': 'Soporte',
    'nav.export': 'Exportar Informe',
    'nav.export_pdf': 'Exportar PDF',
    'nav.export_txt': 'Exportar TXT',
    
    // Common Actions
    'action.save': 'Guardar',
    'action.cancel': 'Cancelar',
    'action.edit': 'Editar',
    'action.delete': 'Eliminar',
    'action.view': 'Visualizar',
    'action.add': 'Añadir',
    'action.filter': 'Filtrar',
    'action.search': 'Buscar...',
    'action.logout': 'Cerrar sesión',
  }
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('app-language');
    return (saved as Language) || 'pt';
  });

  useEffect(() => {
    localStorage.setItem('app-language', language);
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
