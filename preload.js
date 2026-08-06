const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Status da atualização (recebido do main process)
  onUpdateStatus: (callback) => ipcRenderer.on('update-status', (event, status) => callback(status)),

  // Impressão alternativa (caso a janela.print() não funcione)
  printLabel: (html) => ipcRenderer.send('print-label', html)
});