import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { authHeaders } from '@/lib/api';

export interface User {
  id: string;
  name: string;
  email: string;
  isFirstAccess?: boolean;
  plan?: string;
  deviceId?: string;
  avatarId?: string;
  dataAssinatura?: string;
  validadeAssinatura?: string;
  secondaryPassword?: string;
  token?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  updatePassword: (newPass: string) => Promise<boolean>;
  updateUser: (updates: Partial<User>) => void;
  simulatePurchase: (email: string, name: string, plan: string) => void;
  isSecondaryUnlocked: (section: string) => boolean;
  unlockSecondary: (password: string, section: string) => boolean;
  createSecondaryPassword: (password: string, section: string) => void;
}

// API Base URL - Update this for production
const API_URL = ['localhost', '127.0.0.1', '0.0.0.0'].includes(window.location.hostname) 
  ? 'http://localhost:3001' 
  : 'https://api.thebosspro.com';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 20 minutes in milliseconds
const INACTIVITY_TIMEOUT = 20 * 60 * 1000;

// Reusable fetch wrapper with retry mechanism for server deployment drops
const fetchWithRetry = async (url: string, options: RequestInit = {}, retries = 5, delay = 1500): Promise<Response> => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.status === 502 || response.status === 503) {
        throw new Error(`Servidor reiniciando (${response.status})`);
      }
      return response;
    } catch (err) {
      if (i === retries - 1) throw err;
      // Wait for delay before next retry
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error('Failed to fetch after multiple retries');
};

// Helper to generate a random 6-character password
const generateRandomPassword = () => Math.random().toString(36).slice(-6).toUpperCase();

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [unlockedSections, setUnlockedSections] = useState<string[]>([]);
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('erp-auth-user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      // Sessões antigas (sem token) precisam fazer login de novo
      if (!parsed.token) {
        localStorage.removeItem('erp-auth-user');
        return null;
      }
      const secPass = localStorage.getItem(`erp-sec-pass-${parsed.email.toLowerCase()}`);
      if (secPass) {
        parsed.secondaryPassword = secPass;
      }
      return parsed;
    }
    return null;
  });

  const [deviceId] = useState<string>(() => {
    let id = localStorage.getItem('erp-device-id');
    if (!id) {
      id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('erp-device-id', id);
    }
    return id;
  });

  // Database initialization no longer needed in localStorage
  useEffect(() => {
    // We rely on the server now
  }, []);

  const logout = useCallback(async () => {
    if (user) {
      try {
        await fetchWithRetry(`${API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: authHeaders(user.token)
        });
      } catch (err) {
        console.error('Erro ao notificar logout ao servidor');
      }
    }
    setUnlockedSections([]);
    setUser(null);
    localStorage.removeItem('erp-auth-user');
  }, [user]);

  const login = async (email: string, pass: string): Promise<boolean> => {
    try {
      const response = await fetchWithRetry(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass, deviceId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || 'Erro ao realizar login.');
        return false;
      }

      const loggedUser = await response.json();
      
      // Simulate subscription data if not present
      if (!loggedUser.dataAssinatura) {
        loggedUser.dataAssinatura = '2026-01-15';
        loggedUser.validadeAssinatura = '2027-01-15';
        loggedUser.avatarId = Math.floor(Math.random() * 10).toString();
      }

      // Restore secondary password if it was saved locally
      const savedSecPass = localStorage.getItem(`erp-sec-pass-${email.toLowerCase()}`);
      if (savedSecPass) {
        loggedUser.secondaryPassword = savedSecPass;
      }

      setUser(loggedUser);
      localStorage.setItem('erp-auth-user', JSON.stringify(loggedUser));

      if (!loggedUser.isFirstAccess) {
        toast.success(`Bem-vindo de volta ao THE BOSS, ${loggedUser.name}!`);
      }

      return true;
    } catch (err) {
      toast.error('Erro de conexão com o servidor.');
      return false;
    }
  };

  const updatePassword = async (newPass: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const response = await fetchWithRetry(`${API_URL}/api/auth/update-password`, {
        method: 'POST',
        headers: authHeaders(user.token),
        body: JSON.stringify({ newPassword: newPass })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || 'Erro ao atualizar senha no servidor.');
        return false;
      }
      
      const updatedUser = { ...user, isFirstAccess: false };
      setUser(updatedUser);
      localStorage.setItem('erp-auth-user', JSON.stringify(updatedUser));
      toast.success('Sua senha foi atualizada com sucesso!');
      return true;
    } catch (err) {
      toast.error('Erro de conexão ao atualizar senha.');
      return false;
    }
  };
  
  const updateUser = (updates: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('erp-auth-user', JSON.stringify(updatedUser));
  };

  const createSecondaryPassword = (password: string, section: string) => {
    if (!user) return;
    updateUser({ secondaryPassword: password });
    localStorage.setItem(`erp-sec-pass-${user.email.toLowerCase()}`, password);
    setUnlockedSections(prev => [...prev, section]);
    toast.success('Senha secundária criada com sucesso!');
  };

  const unlockSecondary = (password: string, section: string) => {
    if (user?.secondaryPassword === password) {
      setUnlockedSections(prev => [...prev, section]);
      return true;
    }
    toast.error('Senha incorreta!');
    return false;
  };

  const isSecondaryUnlocked = (section: string) => unlockedSections.includes(section);

  const simulatePurchase = async (email: string, name: string, plan: string) => {
    try {
      const randomPass = generateRandomPassword();
      const response = await fetchWithRetry(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: authHeaders(user?.token),
        body: JSON.stringify({ name, email, password: randomPass, plan })
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || 'Erro ao simular compra.');
        return;
      }

      toast.success('Compra na Hotmart finalizada!');
      setTimeout(() => {
        toast.info(`Simulação: Senha enviada para ${email}: ${randomPass}`, { duration: 10000 });
      }, 1500);
    } catch (err) {
      toast.error('Erro de conexão ao simular compra.');
    }
  };

  // Inactivity tracking synced across tabs
  useEffect(() => {
    let intervalId: number;

    const updateActivity = () => {
      if (user) {
        localStorage.setItem('erp-last-activity', Date.now().toString());
      }
    };

    const activeEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];

    if (user && !user.isFirstAccess) {
      activeEvents.forEach(evt => window.addEventListener(evt, updateActivity, { passive: true }));
      updateActivity(); // initial set
      
      // Check inactivity every 1 minute
      intervalId = window.setInterval(() => {
        const lastActivityString = localStorage.getItem('erp-last-activity');
        if (lastActivityString) {
           const inactiveTime = Date.now() - parseInt(lastActivityString, 10);
           if (inactiveTime > INACTIVITY_TIMEOUT) {
              logout();
              localStorage.removeItem('erp-last-activity'); // Clear so other tabs don't fire redundantly if possible
              toast.info('Sessão encerrada por inatividade (20 minutos).');
           }
        }
      }, 60000);
    }

    return () => {
      activeEvents.forEach(evt => window.removeEventListener(evt, updateActivity));
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [user, logout]);

  // Periodic session validation (every 60 seconds)
  useEffect(() => {
    if (!user) return;

    const validateSession = async () => {
      try {
        const response = await fetchWithRetry(`${API_URL}/api/auth/validate-session`, {
          method: 'POST',
          headers: authHeaders(user.token)
        });

        if (response.status === 401) {
          // If the session is explicitly invalid, force logout
          logout();
          toast.error('Sua sessão foi encerrada em outro dispositivo ou atingiu o limite.');
        } else if (!response.ok) {
          console.warn('Erro temporário de conexão com o servidor ao validar sessão. Ignorando.');
        }
      } catch (err) {
        console.error('Erro ao validar sessão:', err);
      }
    };

    const intervalId = setInterval(validateSession, 60000); // 1 minute
    return () => clearInterval(intervalId);
  }, [user, logout]);

  // Clean device on unload
  useEffect(() => {
    const handleUnload = () => {
      if (user && user.deviceId) {
         // Keep device alive for demo purposes to test limits but in a real app you might want heartbeat
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [user]);

  return (
    <AuthContext.Provider value={{ 
      user, login, logout, isAuthenticated: !!user, updatePassword, updateUser, simulatePurchase,
      isSecondaryUnlocked, unlockSecondary, createSecondaryPassword
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
