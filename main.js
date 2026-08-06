const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

let mainWindow = null;

// ========== JANELA PRINCIPAL ==========
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 800,
    title: 'Oxi Etiquetas - Editor',
    icon: path.join(__dirname, 'build', 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Remove o menu padrão
  mainWindow.setMenuBarVisibility(false);

  // Carrega o editor
  mainWindow.loadFile('index.html');

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ========== AUTO-UPDATE (GitHub Releases) ==========
function setupAutoUpdater() {
  // Desativa em desenvolvimento
  if (!app.isPackaged) {
    console.log('[AutoUpdate] Modo dev - auto-update desativado');
    return;
  }

  // Se não há configuração de update (app-update.yml), pula silenciosamente
  const fs = require('fs');
  const updaterCfg = path.join(process.resourcesPath, 'app-update.yml');
  if (!fs.existsSync(updaterCfg)) {
    console.log('[AutoUpdate] Sem configuração de update - modo offline');
    return;
  }

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  // Eventos de log
  autoUpdater.on('checking-for-update', () => {
    if (mainWindow) mainWindow.webContents.send('update-status', 'Verificando atualizações...');
  });

  autoUpdater.on('update-available', (info) => {
    if (mainWindow) mainWindow.webContents.send('update-status', `Nova versão ${info.version} disponível! Baixando...`);
  });

  autoUpdater.on('update-not-available', () => {
    if (mainWindow) mainWindow.webContents.send('update-status', '');
  });

  autoUpdater.on('download-progress', (progressObj) => {
    if (mainWindow) {
      const percent = Math.round(progressObj.percent);
      mainWindow.webContents.send('update-status', `Baixando atualização... ${percent}%`);
    }
  });

  autoUpdater.on('update-downloaded', (info) => {
    if (mainWindow) {
      mainWindow.webContents.send('update-status', `Atualização ${info.version} baixada! Reinicie para aplicar.`);
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Atualização disponível',
        message: `A versão ${info.version} foi baixada.`,
        detail: 'Deseja reiniciar o aplicativo agora para aplicar a atualização?',
        buttons: ['Reiniciar agora', 'Depois'],
        defaultId: 0
      }).then((result) => {
        if (result.response === 0) {
          autoUpdater.quitAndInstall();
        }
      });
    }
  });

  autoUpdater.on('error', (err) => {
    if (mainWindow) mainWindow.webContents.send('update-status', '');
    console.error('[AutoUpdate] Erro:', err);
  });

  // Verifica atualizações após alguns segundos
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch(err => {
      console.error('[AutoUpdate] Falha ao verificar:', err.message);
    });
  }, 5000);
}

// ========== IPC: IMPRESSÃO ==========
// O editor HTML usa window.open para imprimir. Precisamos interceptar
// para que o app abra a janela de impressão corretamente.
ipcMain.on('print-label', (event, html) => {
  // Cria janela invisível com o conteúdo
  const printWindow = new BrowserWindow({
    show: false,
    webPreferences: { contextIsolation: true }
  });
  printWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
  printWindow.webContents.on('did-finish-load', () => {
    printWindow.webContents.print({}, (success, failureReason) => {
      if (!success) console.error('Falha na impressão:', failureReason);
      printWindow.close();
    });
  });
});

// ========== LIFECYCLE ==========
app.whenReady().then(() => {
  createWindow();
  setupAutoUpdater();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
