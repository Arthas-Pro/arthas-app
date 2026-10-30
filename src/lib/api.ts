// Cabeçalhos com o token de sessão emitido pelo servidor no login
export const authHeaders = (token?: string): Record<string, string> => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});
