const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('chocoboElectron', true);
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform
});
