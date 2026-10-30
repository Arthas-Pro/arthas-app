import React, { createContext, useContext, useState } from 'react';
import { toast } from 'sonner';
import { loadData, saveData } from '@/lib/storage';

// Uso pessoal e local: não há login nem servidor. O "usuário" é um perfil local
// (nome, avatar e senha secundária das áreas restritas), salvo junto com os dados.
export interface User {
  id: string;
  name: string;
  email: string;
  plan?: string;
  avatarId?: string;
  secondaryPassword?: string;
}

interface AuthContextType {
  user: User;
  updateUser: (updates: Partial<User>) => void;
  isSecondaryUnlocked: (section: string) => boolean;
  unlockSecondary: (password: string, section: string) => boolean;
  createSecondaryPassword: (password: string, section: string) => void;
}

const PROFILE_KEY = 'perfil';

const DEFAULT_PROFILE: User = {
  id: 'local',
  name: 'Arthas Produções',
  email: 'Uso pessoal',
  plan: 'THE BOSS',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [unlockedSections, setUnlockedSections] = useState<string[]>([]);
  const [user, setUser] = useState<User>(() => ({
    ...DEFAULT_PROFILE,
    ...(loadData<Partial<User>>(PROFILE_KEY) || {}),
    id: DEFAULT_PROFILE.id,
  }));

  const updateUser = (updates: Partial<User>) => {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    saveData(PROFILE_KEY, updatedUser);
  };

  const createSecondaryPassword = (password: string, section: string) => {
    updateUser({ secondaryPassword: password });
    setUnlockedSections(prev => [...prev, section]);
    toast.success('Senha secundária criada com sucesso!');
  };

  const unlockSecondary = (password: string, section: string) => {
    if (user.secondaryPassword === password) {
      setUnlockedSections(prev => [...prev, section]);
      return true;
    }
    toast.error('Senha incorreta!');
    return false;
  };

  const isSecondaryUnlocked = (section: string) => unlockedSections.includes(section);

  return (
    <AuthContext.Provider value={{ 
      user, updateUser, isSecondaryUnlocked, unlockSecondary, createSecondaryPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
