const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');

// O app abre o sistema oficial. Assim ele recebe as atualizações do site na hora,
// sem precisar reinstalar, e o login do Google Agenda funciona na origem já autorizada.
const SITE_URL = 'https://thebosspro.com/';
const SITE_HOSTS = ['thebosspro.com', 'www.thebosspro.com'];
const OFFLINE_PAGE = path.join(__dirname, 'offline.html');

let mainWindow = null;

function isInternalUrl(url) {
  try {
    const { protocol, hostname } = new URL(url);
    return protocol === 'https:' && SITE_HOSTS.includes(hostname);
  } catch {
    return false;
  }
}

// Login do Google (Google Agenda) precisa abrir como popup dentro do app,
// para que o retorno do token chegue à janela principal.
function isGoogleAuthUrl(url) {
  try {
    const { hostname } = new URL(url);
    return hostname === 'accounts.google.com';
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
    // WhatsApp, Hotmart, e-mail e demais links abrem no navegador/app padrão
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!isInternalUrl(url) && !url.startsWith('file:')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    if (details.reason !== 'clean-exit') mainWindow.reload();
  });

  // Sem internet ou site fora do ar: mostra uma tela com botão "Tentar novamente"
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, _desc, url, isMainFrame) => {
    if (isMainFrame && errorCode !== -3 && isInternalUrl(url)) {
      mainWindow.loadFile(OFFLINE_PAGE, { query: { retry: SITE_URL } });
    }
  });

  mainWindow.loadURL(SITE_URL);
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
    {
      label: 'Ajuda',
      submenu: [
        {
          label: 'Suporte via WhatsApp',
          click: () => shell.openExternal('https://wa.me/5589981455411'),
        },
        {
          label: 'Suporte via e-mail',
          click: () => shell.openExternal('mailto:arthasproducoes@gmail.com'),
        },
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

  app.whenReady().then(() => {
    buildMenu();
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
