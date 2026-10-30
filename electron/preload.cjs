const { contextBridge } = require('electron');

// Permite que o site saiba que está rodando no app desktop, se necessário.
contextBridge.exposeInMainWorld('desktop', {
  isElectron: true,
  platform: process.platform,
});
