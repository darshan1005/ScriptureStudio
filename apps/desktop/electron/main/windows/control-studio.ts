import { BrowserWindow, app } from 'electron';
import path from 'path';

let controlStudioWindow: BrowserWindow | null = null;

export function createControlStudioWindow(): BrowserWindow {
  const isDev = !app.isPackaged;

  controlStudioWindow = new BrowserWindow({
    title: 'Scripture Studio — Control Room',
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#070D18',
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      preload: path.join(__dirname, '../preload/index.js'),
    },
  });

  controlStudioWindow.once('ready-to-show', () => {
    controlStudioWindow?.show();
  });

  if (isDev && process.env['VITE_DEV_SERVER_URL']) {
    controlStudioWindow.loadURL(`${process.env['VITE_DEV_SERVER_URL']}?view=control`);
  } else {
    controlStudioWindow.loadFile(path.join(__dirname, '../../dist/index.html'), {
      query: { view: 'control' },
    });
  }

  controlStudioWindow.on('closed', () => {
    controlStudioWindow = null;
  });

  return controlStudioWindow;
}

export function getControlStudioWindow(): BrowserWindow | null {
  return controlStudioWindow;
}

