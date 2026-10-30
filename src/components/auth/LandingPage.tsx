import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Star, ArrowRight, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface LandingProps {
  onLoginClick: () => void;
}

export function LandingPage({ onLoginClick }: LandingProps) {
  const { simulatePurchase } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  const submitCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    simulatePurchase(email, name, 'PRO'); // Or you can just pass 'PRO' since the form is a generic demo
  };

  const features = [
    t('auth.features.projects'),
    t('auth.features.crm'),
    t('auth.features.finance'),
    t('auth.features.inventory'),
    t('auth.features.support')
  ];

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden font-sans border-t-4 border-red-600">
      {/* Dynamic Red Glow Background (Preto e Vermelho) */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-[20%] left-[50%] -translate-x-1/2 w-[80vw] h-[50vw] rounded-full bg-red-600/10 blur-[150px]" />
        <div className="absolute bottom-[0%] -right-[10%] w-[40vw] h-[40vw] rounded-full bg-red-900/10 blur-[120px]" />
      </div>

      {/* Navbar */}
      <nav className="absolute top-0 w-full p-6 flex justify-between items-center z-20">
        <h1 className="text-2xl font-boss font-bold tracking-wider">
          <span className="text-white">THE</span> <span className="text-red-600 drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]">BOSS</span>
        </h1>
        <Button variant="outline" className="border-red-600/50 bg-black/50 backdrop-blur-md text-red-500 hover:bg-red-600 hover:border-red-600 hover:text-white transition-all shadow-lg hover:shadow-red-600/20" onClick={onLoginClick}>
          {t('auth.login_button')}
        </Button>
      </nav>

      <div className="pt-32 pb-20 px-4 max-w-6xl mx-auto z-10 relative flex flex-col items-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-4xl mb-16 z-10">
          <div className="inline-block py-1 px-3 rounded-full bg-red-600/10 border border-red-500/30 text-red-500 text-sm font-bold tracking-widest mb-6 uppercase">{t('app.powered_by')}</div>
          <h2 className="text-5xl md:text-7xl font-bold font-boss tracking-tight mb-6 leading-tight">
            {t('app.tagline')}<br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-800 uppercase">{t('app.tagline_highlight')}</span>
          </h2>
          <p className="text-2xl text-zinc-300 font-bold max-w-2xl mx-auto uppercase tracking-wide">
            {t('app.subtagline')}
          </p>
          <p className="text-lg text-zinc-500 max-w-2xl mx-auto mt-4">
            {t('app.description')}
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="flex justify-center w-full max-w-lg mx-auto">
          {/* Pro Plan - Single Plan */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="flex flex-col p-8 bg-[#0a0000] rounded-2xl border-2 border-red-600 shadow-[0_0_40px_rgba(220,38,38,0.15)] relative transform hover:-translate-y-1 transition-transform duration-300 w-full"
          >
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-1.5 rounded-full text-sm font-black tracking-widest flex items-center gap-2 shadow-lg shadow-red-600/30">
              <Star className="w-4 h-4 fill-current" /> PLANO COMPLETO
            </div>
            <h3 className="text-3xl font-bold font-boss mb-2 text-red-600 mt-2 text-center">THE BOSS <span className="text-white">PRO</span></h3>
            <p className="text-zinc-400 mb-6 text-center">Acesso total e definitivo para impulsionar e dominar a sua agência ou produtora.</p>
            <div className="mb-6 flex items-end justify-center gap-1">
              <span className="text-5xl font-extrabold text-white">R$ 49,90</span>
              <span className="text-zinc-500 text-lg mb-1">/{t('auth.monthly')}</span>
            </div>
            <div className="p-3 bg-red-600/10 border border-red-900/50 rounded-lg mb-6 text-center">
              <p className="text-sm font-bold text-red-500">
                Acesso imediato a todos os recursos.
              </p>
              <p className="text-xs text-red-400/80 mt-1">Cancele quando quiser, sem fidelidade ou taxas extras.</p>
            </div>
            <div className="space-y-4 flex-1 mb-8">
              {features?.map((f, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <span className="text-sm text-white font-medium">{f}</span>
                </div>
              ))}
            </div>
            <Button 
              className="w-full text-lg h-14 bg-red-600 hover:bg-red-700 text-white font-bold shadow-xl shadow-red-600/20 transition-all hover:scale-[1.02]" 
              onClick={() => window.open('https://pay.hotmart.com/M105155244Y', '_blank')}
            >
              ASSINAR AGORA <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Checkout Mock Overlay */}
      {/* We are no longer triggering showCheckout normally since we use window.open directly on buttons, but kept for test compatibility if needed in code */}
      <AnimatePresence>
        {false && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-card w-full max-w-md rounded-2xl p-6 border shadow-2xl relative"
            >
              <button 
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
              
              <div className="mb-6">
                <h3 className="text-xl font-bold font-boss mb-1">Check-out Simulado</h3>
                <p className="text-sm text-muted-foreground">Você está testando localmente. Na prática, este botão levaria ao link da Hotmart.</p>
              </div>

              <form onSubmit={submitCheckout} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Seu Nome</label>
                  <Input 
                    required 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="João Produções" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">E-mail para Acesso</label>
                  <Input 
                    required 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    placeholder="joao@thebosspro.com" 
                  />
                  <p className="text-[11px] text-muted-foreground">As credenciais serão disparadas pelo suporte@thebosspro.com após a confirmação simulada.</p>
                </div>
                <Button type="submit" className="w-full h-12 bg-green-600 hover:bg-green-700 text-white text-lg mt-4">
                  Confirmar Pagamento
                </Button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
