import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ChangePasswordProps {
  onComplete: () => void;
}

export function ChangePassword({ onComplete }: ChangePasswordProps) {
  const { user, updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error('As senhas não conferem. Tente novamente.');
      return;
    }
    if (password.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    
    setLoading(true);
    
    const success = await updatePassword(password);
    if (success) {
      onComplete();
    } else {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Decorative Blur */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-[120px] pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.05 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-card/50 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative z-10"
      >
        <div className="flex flex-col items-center mb-8 text-center space-y-4">
          <div className="w-16 h-16 bg-red-600/20 rounded-2xl flex items-center justify-center border border-red-500/30">
            <ShieldAlert className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-boss font-bold">Primeiro Acesso</h1>
          <p className="text-muted-foreground text-sm">
            Olá <b>{user?.name}</b>! Por questões de segurança em sua assinatura do THE BOSS PRO, altere a senha provisória enviada para seu e-mail.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Nova Senha Definitiva</label>
            <Input
              type="password"
              placeholder="Digite a nova senha"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="h-12 bg-background/50 border-white/10 focus-visible:ring-red-500"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Confirme a Senha</label>
            <Input
              type="password"
              placeholder="Repita a nova senha"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className="h-12 bg-background/50 border-white/10 focus-visible:ring-red-500"
              required
            />
          </div>

          <Button 
            type="submit" 
            disabled={loading}
            className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-red-600/20"
          >
            {loading ? 'Atualizando Segurança...' : (
              <>
                Acessar Plataforma Mestre
                <ArrowRight className="ml-2 w-5 h-5" />
              </>
            )}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
