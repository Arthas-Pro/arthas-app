const { contextBridge, ipcRenderer } = require('electron');

// Ponte entre a interface e o armazenamento em arquivos do app desktop
contextBridge.exposeInMainWorld('desktop', {
  isElectron: true,
  platform: process.platform,
  store: {
    get: (key) => ipcRenderer.sendSync('store:get', key),
    set: (key, value) => ipcRenderer.send('store:set', key, value),
  },
});
