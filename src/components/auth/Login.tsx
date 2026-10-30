import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, User, ArrowLeft } from 'lucide-react';

interface LoginProps {
  onBackClick?: () => void;
}

export function Login({ onBackClick }: LoginProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await login(email, password);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden font-sans">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-red-600/30 blur-[120px]"
        />
        <motion.div 
          animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-[20%] -right-[10%] w-[40vw] h-[40vw] rounded-full bg-indigo-600/30 blur-[120px]"
        />
      </div>

      {onBackClick && (
        <button 
          onClick={onBackClick}
          className="absolute top-6 left-6 z-20 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar para a vitrine
        </button>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md p-8 rounded-2xl bg-card border border-border/50 shadow-2xl z-10 mx-4 backdrop-blur-sm"
      >
        <div className="flex flex-col items-center mb-8">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="mb-2"
          >
            <h1 className="text-4xl font-boss font-bold tracking-wider">
              <span className="text-foreground">THE</span> <span className="text-red-600 drop-shadow-md">BOSS</span>
            </h1>
          </motion.div>
          <p className="text-muted-foreground text-sm font-medium tracking-widest mt-1">Acesso Restrito</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="relative group">
              <User className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-red-500" />
              <Input 
                autoFocus
                type="text" 
                placeholder="Usuário ou E-mail" 
                className="pl-10 bg-background/50 border-muted-foreground/30 h-12 focus-visible:ring-red-500 rounded-xl"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="relative group">
              <Lock className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-red-500" />
              <Input 
                type="password" 
                placeholder="Senha" 
                className="pl-10 bg-background/50 border-muted-foreground/30 h-12 focus-visible:ring-red-500 rounded-xl"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-medium text-lg transition-all rounded-xl shadow-lg hover:shadow-red-600/25"
            disabled={isLoading}
          >
            {isLoading ? 'Autenticando...' : 'ENTRAR'}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
