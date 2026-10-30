import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, KeyRound, ShieldAlert } from 'lucide-react';

interface SecurityLockProps {
  children: React.ReactNode;
  sectionId: string;
}

export function SecurityLock({ children, sectionId }: SecurityLockProps) {
  const { user, isSecondaryUnlocked, unlockSecondary, createSecondaryPassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  if (isSecondaryUnlocked(sectionId)) {
    return <>{children}</>;
  }

  const hasPassword = !!user?.secondaryPassword;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Digite a senha.');
      return;
    }
    const success = unlockSecondary(password, sectionId);
    if (!success) {
      setError('Senha incorreta.');
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 4) {
      setError('A senha deve ter pelo menos 4 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    createSecondaryPassword(password, sectionId);
  };

  return (
    <div className="w-full h-full min-h-[60vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-red-500/20 bg-background/95 backdrop-blur-sm">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
            {hasPassword ? (
              <Lock className="w-6 h-6 text-red-600 dark:text-red-400" />
            ) : (
              <ShieldAlert className="w-6 h-6 text-red-600 dark:text-red-400" />
            )}
          </div>
          <CardTitle className="text-xl">Área Restrita</CardTitle>
          <CardDescription>
            {hasPassword
              ? 'Esta seção requer sua senha secundária de acesso.'
              : 'Para acessar esta seção, crie uma senha de segurança secundária.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!hasPassword ? (
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Nova senha secundária"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                />
              </div>
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Confirme a senha"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError('');
                  }}
                />
              </div>
              {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
              <Button type="submit" className="w-full gap-2">
                <KeyRound className="w-4 h-4" />
                Criar Senha e Acessar
              </Button>
            </form>
          ) : (
            <form onSubmit={handleUnlock} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Sua senha secundária"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  autoFocus
                />
              </div>
              {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
              <Button type="submit" className="w-full gap-2">
                <Lock className="w-4 h-4" />
                Desbloquear
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
