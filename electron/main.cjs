const { app, BrowserWindow, Menu, shell, dialog, ipcMain } = require('electron');
const http = require('http');
const fs = require('fs');
const path = require('path');

// O sistema roda 100% no computador: a interface vem embutida no app (dist/)
// e os dados ficam em arquivos JSON na pasta do usuário.
//
// Porta fixa: mantém a mesma origem (http://localhost:47821) entre execuções,
// para que ela possa ser autorizada no Google Cloud (sincronização com o Google Agenda).
const PREFERRED_PORT = 47821;
const DIST_DIR = path.join(__dirname, '..', 'dist');
const DATA_DIR = path.join(app.getPath('userData'), 'dados');
const AUTO_BACKUP_DIR = path.join(app.getPath('userData'), 'backups-automaticos');
const AUTO_BACKUPS_TO_KEEP = 14;
const SAFE_KEY = /^[A-Za-z0-9_-]{1,64}$/;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json',
};

let mainWindow = null;
let server = null;
let origin = null;

// --- DADOS ---

function dataFile(key) {
  return path.join(DATA_DIR, `${key}.json`);
}

function readKey(key) {
  if (!SAFE_KEY.test(key)) return null;
  try {
    return JSON.parse(fs.readFileSync(dataFile(key), 'utf-8'));
  } catch {
    return null;
  }
}

// Grava num arquivo temporário e renomeia, para nunca deixar um arquivo pela metade
function writeKey(key, value) {
  if (!SAFE_KEY.test(key)) return;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const target = dataFile(key);
  const tmp = `${target}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2));
  fs.renameSync(tmp, target);
}

function readAllData() {
  const dados = {};
  if (!fs.existsSync(DATA_DIR)) return dados;
  for (const file of fs.readdirSync(DATA_DIR)) {
    if (!file.endsWith('.json')) continue;
    const key = path.basename(file, '.json');
    const value = readKey(key);
    if (value !== null) dados[key] = value;
  }
  return dados;
}

function backupPayload() {
  return {
    app: 'THE BOSS ERP',
    versao: app.getVersion(),
    criadoEm: new Date().toISOString(),
    dados: readAllData(),
  };
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

// Um backup automático por dia, mantendo os últimos 14
function autoBackup() {
  try {
    const dados = readAllData();
    if (Object.keys(dados).length === 0) return;
    fs.mkdirSync(AUTO_BACKUP_DIR, { recursive: true });
    const file = path.join(AUTO_BACKUP_DIR, `backup-${today()}.json`);
    if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify(backupPayload(), null, 2));
    const old = fs.readdirSync(AUTO_BACKUP_DIR).filter((f) => f.startsWith('backup-')).sort().reverse();
    for (const f of old.slice(AUTO_BACKUPS_TO_KEEP)) fs.unlinkSync(path.join(AUTO_BACKUP_DIR, f));
  } catch (err) {
    console.error('Falha no backup automático:', err);
  }
}

ipcMain.on('store:get', (event, key) => {
  event.returnValue = readKey(String(key));
});

ipcMain.on('store:set', (_event, key, value) => {
  try {
    writeKey(String(key), value);
  } catch (err) {
    console.error(`Falha ao salvar ${key}:`, err);
  }
});

async function saveBackup() {
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Salvar backup dos dados',
    defaultPath: path.join(app.getPath('documents'), `THE-BOSS-backup-${today()}.json`),
    filters: [{ name: 'Backup THE BOSS', extensions: ['json'] }],
  });
  if (canceled || !filePath) return;
  fs.writeFileSync(filePath, JSON.stringify(backupPayload(), null, 2));
  dialog.showMessageBox(mainWindow, { type: 'info', message: 'Backup salvo com sucesso.', detail: filePath });
}

// Aceita um backup completo do app ou arquivos soltos por coleção
// (clientes.json, projetos.json...), como os da pasta "data" do antigo servidor.
async function restoreBackup() {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: 'Restaurar backup',
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'Backup THE BOSS', extensions: ['json'] }],
  });
  if (canceled || filePaths.length === 0) return;

  const dados = {};
  try {
    for (const file of filePaths) {
      const content = JSON.parse(fs.readFileSync(file, 'utf-8'));
      if (content && content.app === 'THE BOSS ERP' && content.dados) {
        Object.assign(dados, content.dados);
      } else {
        dados[path.basename(file, '.json')] = content;
      }
    }
  } catch (err) {
    dialog.showErrorBox('Restaurar backup', `Arquivo inválido.\n\n${err.message}`);
    return;
  }

  const keys = Object.keys(dados).filter((k) => SAFE_KEY.test(k));
  if (keys.length === 0) {
    dialog.showErrorBox('Restaurar backup', 'Nenhum dado encontrado nos arquivos escolhidos.');
    return;
  }

  const { response } = await dialog.showMessageBox(mainWindow, {
    type: 'warning',
    buttons: ['Restaurar', 'Cancelar'],
    defaultId: 1,
    cancelId: 1,
    message: 'Substituir os dados atuais?',
    detail: `Serão substituídos: ${keys.join(', ')}.\nUma cópia dos dados atuais será guardada nos backups automáticos.`,
  });
  if (response !== 0) return;

  fs.mkdirSync(AUTO_BACKUP_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  fs.writeFileSync(
    path.join(AUTO_BACKUP_DIR, `antes-de-restaurar-${stamp}.json`),
    JSON.stringify(backupPayload(), null, 2)
  );
  for (const key of keys) writeKey(key, dados[key]);
  mainWindow.reload();
}

// --- INTERFACE ---

function startServer() {
  const handler = (req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    let filePath = path.normalize(path.join(DIST_DIR, urlPath));
    if (!filePath.startsWith(DIST_DIR)) {
      res.writeHead(403);
      return res.end();
    }
    // Fallback de SPA: qualquer rota desconhecida devolve o index.html
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(DIST_DIR, 'index.html');
    }
    const type = MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type });
    fs.createReadStream(filePath).pipe(res);
  };

  const listen = (port) =>
    new Promise((resolve, reject) => {
      server = http.createServer(handler);
      server.once('error', reject);
      server.listen(port, '127.0.0.1', () => resolve(server.address().port));
    });

  // Se a porta preferida estiver ocupada, usa qualquer porta livre
  return listen(PREFERRED_PORT).catch(() => listen(0));
}

function isInternalUrl(url) {
  return url.startsWith(origin);
}

// Login do Google (Google Agenda) precisa abrir como popup dentro do app,
// para que o retorno do token chegue à janela principal.
function isGoogleAuthUrl(url) {
  try {
    return new URL(url).hostname === 'accounts.google.com';
  } catch {
    return false;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 680,
    backgroundColor: '#000000',
    title: 'THE BOSS - ERP/CRM',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize();
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isGoogleAuthUrl(url)) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          width: 500,
          height: 650,
          autoHideMenuBar: true,
          parent: mainWindow,
        },
      };
    }
    // WhatsApp, e-mail e demais links abrem no navegador/app padrão
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!isInternalUrl(url)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    if (details.reason !== 'clean-exit') mainWindow.reload();
  });

  mainWindow.loadURL(origin);
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function buildMenu() {
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac
      ? [{
          label: app.name,
          submenu: [
            { role: 'about', label: 'Sobre o THE BOSS' },
            { type: 'separator' },
            { role: 'hide', label: 'Ocultar' },
            { role: 'hideOthers', label: 'Ocultar outros' },
            { role: 'unhide', label: 'Mostrar todos' },
            { type: 'separator' },
            { role: 'quit', label: 'Sair' },
          ],
        }]
      : []),
    {
      label: 'Arquivo',
      submenu: [
        { label: 'Fazer backup dos dados…', accelerator: 'CmdOrCtrl+S', click: () => saveBackup() },
        { label: 'Restaurar backup…', click: () => restoreBackup() },
        { label: 'Abrir pasta dos dados', click: () => shell.openPath(app.getPath('userData')) },
        { type: 'separator' },
        {
          label: 'Imprimir / Salvar PDF',
          accelerator: 'CmdOrCtrl+P',
          click: () => mainWindow && mainWindow.webContents.print(),
        },
        { type: 'separator' },
        isMac ? { role: 'close', label: 'Fechar janela' } : { role: 'quit', label: 'Sair' },
      ],
    },
    {
      label: 'Editar',
      submenu: [
        { role: 'undo', label: 'Desfazer' },
        { role: 'redo', label: 'Refazer' },
        { type: 'separator' },
        { role: 'cut', label: 'Recortar' },
        { role: 'copy', label: 'Copiar' },
        { role: 'paste', label: 'Colar' },
        { role: 'selectAll', label: 'Selecionar tudo' },
      ],
    },
    {
      label: 'Exibir',
      submenu: [
        { role: 'reload', label: 'Recarregar' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Tamanho original' },
        { role: 'zoomIn', label: 'Aumentar zoom' },
        { role: 'zoomOut', label: 'Diminuir zoom' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Tela cheia' },
        { role: 'toggleDevTools', label: 'Ferramentas do desenvolvedor' },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    const port = await startServer();
    origin = `http://localhost:${port}`;
    autoBackup();
    buildMenu();
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });

  app.on('before-quit', () => {
    if (server) server.close();
  });
}
