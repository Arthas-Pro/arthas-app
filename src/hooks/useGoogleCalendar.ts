import { useState, useCallback } from 'react';
import type { Evento } from '@/types';
import { toast } from 'sonner';

const CLIENT_ID = "41537120644-i0hv6474hatvauhu69f7a4gnuhcjgtvh.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly";

export function useGoogleCalendar() {
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    return localStorage.getItem('google-calendar-token');
  });
  const [isSyncing, setIsSyncing] = useState(false);

  // Carregar o script do Google se não existir
  const loadGsiScript = useCallback(() => {
    if (window.google) return Promise.resolve();
    return new Promise<void>((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      document.body.appendChild(script);
    });
  }, []);

  const login = useCallback(async () => {
    await loadGsiScript();
    
    return new Promise<string>((resolve, reject) => {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (response: any) => {
          if (response.error) {
            toast.error('Erro ao conectar com Google: ' + response.error);
            reject(response.error);
            return;
          }
          setAccessToken(response.access_token);
          localStorage.setItem('google-calendar-token', response.access_token);
          resolve(response.access_token);
        },
      });
      client.requestAccessToken();
    });
  }, [loadGsiScript]);

  const logout = useCallback(() => {
    setAccessToken(null);
    localStorage.removeItem('google-calendar-token');
    toast.info('Google Agenda desconectada.');
  }, []);

  const fetchGoogleEvents = useCallback(async (token: string, timeMin?: string, timeMax?: string) => {
    let url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events?singleEvents=true&orderBy=startTime';
    if (timeMin) url += `&timeMin=${timeMin}`;
    if (timeMax) url += `&timeMax=${timeMax}`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.status === 401) {
      // Token expirou ou é inválido
      logout();
      throw new Error('Token expirado');
    }

    const data = await response.json();
    return data.items || [];
  }, [logout]);

  const createGoogleEvent = useCallback(async (token: string, evento: Omit<Evento, 'id'>) => {
    const googleEvent = {
        summary: evento.titulo,
        description: evento.descricao,
        start: { dateTime: new Date(evento.dataInicio).toISOString() },
        end: { dateTime: new Date(evento.dataFim).toISOString() },
        location: evento.local,
    };

    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(googleEvent)
    });

    if (response.status === 401) {
      logout();
      throw new Error('Token expirado');
    }

    return await response.json();
  }, [logout]);

  const updateGoogleEvent = useCallback(async (token: string, googleEventId: string, updates: Partial<Evento>) => {
    const googleEvent: any = {};
    if (updates.titulo) googleEvent.summary = updates.titulo;
    if (updates.descricao) googleEvent.description = updates.descricao;
    if (updates.dataInicio) googleEvent.start = { dateTime: new Date(updates.dataInicio).toISOString() };
    if (updates.dataFim) googleEvent.end = { dateTime: new Date(updates.dataFim).toISOString() };
    if (updates.local) googleEvent.location = updates.local;

    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}`, {
      method: 'PATCH',
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(googleEvent)
    });

    if (response.status === 401) {
      logout();
      throw new Error('Token expirado');
    }
  }, [logout]);

  const deleteGoogleEvent = useCallback(async (token: string, googleEventId: string) => {
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.status === 401) {
      logout();
      throw new Error('Token expirado');
    }
  }, [logout]);

  return {
    accessToken,
    isSyncing,
    setIsSyncing,
    login,
    logout,
    fetchGoogleEvents,
    createGoogleEvent,
    updateGoogleEvent,
    deleteGoogleEvent
  };
}

// Extender o objeto window para o TypeScript
declare global {
  interface Window {
    google: any;
  }
}
