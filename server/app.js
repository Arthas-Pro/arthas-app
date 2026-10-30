require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

const app = express();
app.use(express.json({ limit: '20mb' }));
app.use(cors());

// Rota de status para verificar se o servidor esta online
app.get(['/', '/api'], (req, res) => {
  res.send('🔥 THE BOSS API - Servidor Online e Operante!');
});

// Paths for persistence
const STORAGE_DIR = path.join(__dirname, 'storage');
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(STORAGE_DIR, 'users.json');
const LOG_FILE = path.join(STORAGE_DIR, 'server.log');

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias
const MAX_SESSIONS_PER_USER = 5;
const MIN_PASSWORD_LENGTH = 6;
const SAFE_ID = /^[A-Za-z0-9_-]{1,64}$/;

// Logger helper
const logToFile = async (message) => {
  const timestamp = new Date().toISOString();
  const formattedMessage = `[${timestamp}] ${message}\n`;
  console.log(message);
  try {
    await fs.appendFile(LOG_FILE, formattedMessage);
  } catch (err) {
    console.error('Failed to write to log file:', err);
  }
};

// Ensure directories exist
const initDirs = async () => {
  try {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
    await fs.mkdir(DATA_DIR, { recursive: true });
    try {
      await fs.access(USERS_FILE);
    } catch {
      await fs.writeFile(USERS_FILE, JSON.stringify({}, null, 2));
    }
  } catch (err) {
    console.error('Error initializing storage:', err);
  }
};

initDirs();

// --- USERS STORE ---
// Todas as gravações em users.json passam por esta fila para evitar que
// duas requisições simultâneas sobrescrevam as alterações uma da outra.
let usersQueue = Promise.resolve();

const readUsers = async () => JSON.parse(await fs.readFile(USERS_FILE, 'utf-8'));

const withUsers = (fn) => {
  const run = usersQueue.then(async () => {
    const users = await readUsers();
    const result = await fn(users);
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
    return result;
  });
  usersQueue = run.catch(() => {});
  return run;
};

// --- PASSWORDS & SESSIONS ---

const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
};

const checkPasswordHash = (password, stored) => {
  const [scheme, salt, hash] = String(stored).split('$');
  if (scheme !== 'scrypt' || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'hex');
  const actual = crypto.scryptSync(password, salt, expected.length);
  return crypto.timingSafeEqual(expected, actual);
};

const safeEqual = (a, b) => {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
};

// Aceita contas antigas com senha em texto puro e as converte para hash no login.
const verifyPassword = (user, password) => {
  if (typeof password !== 'string') return false;
  if (user.passwordHash) return checkPasswordHash(password, user.passwordHash);
  if (typeof user.password === 'string' && safeEqual(user.password, password)) {
    user.passwordHash = hashPassword(password);
    delete user.password;
    return true;
  }
  return false;
};

const setPassword = (user, password) => {
  user.passwordHash = hashPassword(password);
  delete user.password;
};

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const pruneSessions = (user) => {
  const now = Date.now();
  user.sessions = (user.sessions || []).filter((s) => now - s.createdAt < SESSION_TTL_MS);
};

const createSession = (user, deviceId) => {
  const token = crypto.randomBytes(32).toString('hex');
  pruneSessions(user);
  user.sessions.push({
    tokenHash: hashToken(token),
    deviceId: typeof deviceId === 'string' ? deviceId.slice(0, 64) : null,
    createdAt: Date.now(),
  });
  // Mantém somente as sessões mais recentes
  user.sessions = user.sessions.slice(-MAX_SESSIONS_PER_USER);
  return token;
};

const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  isFirstAccess: user.isFirstAccess,
  plan: user.plan,
});

const findUserByToken = (users, token) => {
  const tokenHash = hashToken(token);
  const now = Date.now();
  for (const [key, user] of Object.entries(users)) {
    const session = (user.sessions || []).find(
      (s) => safeEqual(s.tokenHash, tokenHash) && now - s.createdAt < SESSION_TTL_MS
    );
    if (session) return { key, user };
  }
  return null;
};

const getBearerToken = (req) => {
  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer\s+([a-f0-9]{64})$/i);
  return match ? match[1] : null;
};

// Exige um token de sessão válido; disponibiliza req.user e req.userKey
const requireAuth = async (req, res, next) => {
  const token = getBearerToken(req);
  if (!token) return res.status(401).json({ error: 'Sessão inválida. Faça login novamente.' });
  try {
    await usersQueue;
    const found = findUserByToken(await readUsers(), token);
    if (!found) return res.status(401).json({ error: 'Sessão expirada. Faça login novamente.' });
    req.user = found.user;
    req.userKey = found.key;
    req.tokenHash = hashToken(token);
    next();
  } catch (err) {
    res.status(500).json({ error: 'Erro no servidor.' });
  }
};

const requireMaster = (req, res, next) => {
  if (req.user?.plan !== 'MASTER') return res.status(403).json({ error: 'Acesso negado.' });
  next();
};

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Nodemailer Transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: process.env.SMTP_PORT || 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Helper to register user
const registerUser = (name, email, password, plan = 'PRO') =>
  withUsers((users) => {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail || !name || typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
      return { error: 'Dados de cadastro inválidos.' };
    }
    if (users[normalizedEmail]) return { error: 'E-mail já cadastrado.' };

    const newUser = {
      id: crypto.randomBytes(8).toString('hex'),
      name: String(name),
      email: normalizedEmail,
      isFirstAccess: true,
      plan,
      activeDevices: [],
      sessions: [],
    };
    setPassword(newUser, password);

    users[normalizedEmail] = newUser;
    return { success: true, user: publicUser(newUser) };
  });

// --- AUTH API ---

// Somente contas MASTER podem cadastrar usuários manualmente;
// clientes pagantes são criados pelo webhook da Hotmart.
app.post('/api/auth/register', requireAuth, requireMaster, async (req, res) => {
  const { name, email, password, plan } = req.body;
  const allowedPlans = ['PRO', 'MASTER'];
  try {
    const result = await registerUser(name, email, password, allowedPlans.includes(plan) ? plan : 'PRO');
    if (result.error) return res.status(400).json(result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao registrar usuário.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password, deviceId } = req.body;
  try {
    const result = await withUsers((users) => {
      // Busca insensível a maiúsculas/minúsculas
      const normalizedEmail = String(email || '').trim().toLowerCase();
      const user = users[normalizedEmail];
      if (!user || !verifyPassword(user, password)) return null;
      const token = createSession(user, deviceId);
      return { ...publicUser(user), token };
    });

    if (!result) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Erro no servidor.' });
  }
});

app.post('/api/auth/validate-session', requireAuth, (req, res) => {
  res.json({ success: true, user: publicUser(req.user) });
});

app.post('/api/auth/logout', requireAuth, async (req, res) => {
  try {
    await withUsers((users) => {
      const user = users[req.userKey];
      if (user) user.sessions = (user.sessions || []).filter((s) => s.tokenHash !== req.tokenHash);
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao encerrar sessão.' });
  }
});

// No primeiro acesso basta a sessão; depois disso a senha atual também é exigida.
app.post('/api/auth/update-password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (typeof newPassword !== 'string' || newPassword.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({ error: `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.` });
  }
  try {
    const result = await withUsers((users) => {
      const user = users[req.userKey];
      if (!user) return { status: 404, error: 'Usuário não encontrado.' };
      if (!user.isFirstAccess && !verifyPassword(user, currentPassword)) {
        return { status: 401, error: 'Senha atual incorreta.' };
      }
      setPassword(user, newPassword);
      user.isFirstAccess = false;
      // Encerra as outras sessões, mantendo apenas a atual
      user.sessions = (user.sessions || []).filter((s) => s.tokenHash === req.tokenHash);
      return { status: 200 };
    });
    if (result.error) return res.status(result.status).json({ error: result.error });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar senha.' });
  }
});

// --- TESTING API ---
app.get(['/api/test-email', '/test-email'], requireAuth, requireMaster, async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).send('Email is required');

  logToFile(`[TEST] Enviando e-mail de teste para: ${email}`);
  try {
    await transporter.sendMail({
      from: `"THE BOSS - TESTE" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Teste de Configuração de E-mail',
      html: '<h1>O seu servidor está enviando e-mails com sucesso!</h1>'
    });
    res.json({ success: true, message: 'E-mail enviado com sucesso. Verifique sua caixa de entrada e SPAM.' });
  } catch (err) {
    logToFile(`[TEST ERROR] Falha no teste de e-mail: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

app.get(['/api/logs', '/logs'], requireAuth, requireMaster, async (req, res) => {
  try {
    const logs = await fs.readFile(LOG_FILE, 'utf-8');
    res.type('text/plain').send(logs);
  } catch {
    res.status(404).send('Nenhum log encontrado.');
  }
});

// --- DATA SYNC API ---

// Cada usuário só acessa a própria pasta de dados, e os nomes de pasta/arquivo
// são validados para impedir acesso a outros arquivos do servidor.
const requireOwnData = (req, res, next) => {
  const { userId, key } = req.params;
  if (!SAFE_ID.test(userId) || !SAFE_ID.test(key)) return res.status(400).json({ error: 'Requisição inválida.' });
  if (userId !== req.user.id) return res.status(403).json({ error: 'Acesso negado.' });
  next();
};

app.get('/api/data/:userId/:key', requireAuth, requireOwnData, async (req, res) => {
  const { userId, key } = req.params;
  const userDir = path.join(DATA_DIR, userId);
  const filePath = path.join(userDir, `${key}.json`);

  try {
    await fs.mkdir(userDir, { recursive: true });
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      res.json(JSON.parse(data));
    } catch {
      res.json([]); // Return empty array if file not found
    }
  } catch (err) {
    res.status(500).json({ error: 'Erro ao carregar dados.' });
  }
});

app.post('/api/data/:userId/:key', requireAuth, requireOwnData, async (req, res) => {
  const { userId, key } = req.params;
  const data = req.body;
  const userDir = path.join(DATA_DIR, userId);
  const filePath = path.join(userDir, `${key}.json`);

  try {
    // Bloqueio de persistência para o usuário de teste (DUPLA TRAVA)
    if (userId === 'demo_user_001' || req.user.email === 'teste@theboss.com') {
      console.log(`[SANDBOX] Bloqueada gravação para usuário ${userId} (${key}) - MODO TESTE`);
      return res.json({ success: true, message: 'Modo Sandbox: Dados não persistidos.' });
    }

    await fs.mkdir(userDir, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao salvar dados.' });
  }
});

// --- WEBHOOKS ---

app.post(['/api/hotmart-webhook', '/hotmart-webhook'], async (req, res) => {
  logToFile("Receiving Webhook payload from Hotmart...");
  const hottok = req.query.hottok || req.headers['x-hotmart-hottok'] || req.body.hottok;

  if (!process.env.HOTMART_TOKEN || !hottok || !safeEqual(hottok, process.env.HOTMART_TOKEN)) {
    logToFile('[BLOQUEADO] Webhook com token inválido.');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { event, data, email, first_name, status } = req.body;
  logToFile(`[EVENTO] ${event || status} recebido.`);

  if (event === 'PURCHASE_APPROVED' || status === 'approved') {
    const buyerEmail = data?.buyer?.email || email;
    const buyerName = data?.buyer?.name || first_name || 'Cliente Oculto';
    const password = crypto.randomBytes(6).toString('base64url').slice(0, 8).toUpperCase();

    logToFile(`[PROCESSANDO] Compra aprovada para: ${buyerEmail}`);

    // Register User
    const regResult = await registerUser(buyerName, buyerEmail, password, 'PRO');
    if (regResult.error) {
      logToFile(`[AVISO] Registro: ${regResult.error}`);
      // Conta já existente: não envia nova senha
      return res.status(200).send('Webhook Recebido.');
    }

    // Send Welcoming Email
    try {
      await transporter.sendMail({
        from: `"THE BOSS - Suporte" <${process.env.SMTP_USER}>`,
        to: buyerEmail,
        subject: `Bem-vindo ao THE BOSS PRO, ${buyerName}!`,
        html: `<div style="font-family: sans-serif; background: #000; color: #fff; padding: 20px; border-radius: 10px;">
          <h1>Seu acesso oficial foi liberado!</h1>
          <p>Seu login é o seu e-mail: <b>${escapeHtml(buyerEmail)}</b></p>
          <p>Sua senha provisória é: <b>${password}</b></p>
          <p>Acesse agora: <a href="https://thebosspro.com" style="color: red;">thebosspro.com</a></p>
          <hr/>
          <p style="font-size: 12px; color: #777;">*Esta é uma senha temporária. Recomendamos alterá-la no primeiro acesso.</p>
        </div>`
      });
      logToFile(`[OK] E-mail enviado para ${buyerEmail}`);
    } catch (err) {
      logToFile(`[ERRO EMAIL] Falha no disparo: ${err.message}`);
    }
  }
  res.status(200).send('Webhook Recebido.');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n==========================================`);
  console.log(`🔥 THE BOSS - BACKEND DE SERVIÇOS 🔥`);
  console.log(`==========================================`);
  console.log(`🚀 API Centralizada iniciada na porta ${PORT}`);
});
