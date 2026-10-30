// Armazenamento local dos dados do sistema.
// No app desktop (Electron) cada coleção é salva como um arquivo JSON na pasta de dados
// do usuário; no navegador (modo desenvolvimento) usa o localStorage.

interface DesktopStore {
  get: (key: string) => unknown;
  set: (key: string, value: unknown) => void;
}

declare global {
  interface Window {
    desktop?: {
      isElectron: boolean;
      platform: string;
      store?: DesktopStore;
    };
  }
}

const LOCAL_PREFIX = 'erp-local-';

export function loadData<T>(key: string): T | null {
  const store = window.desktop?.store;
  if (store) return (store.get(key) as T | null) ?? null;
  try {
    const saved = localStorage.getItem(LOCAL_PREFIX + key);
    return saved ? (JSON.parse(saved) as T) : null;
  } catch {
    return null;
  }
}

export function saveData(key: string, value: unknown): void {
  const store = window.desktop?.store;
  if (store) {
    store.set(key, value);
    return;
  }
  try {
    localStorage.setItem(LOCAL_PREFIX + key, JSON.stringify(value));
  } catch (err) {
    console.error(`Erro ao salvar ${key}:`, err);
  }
}
