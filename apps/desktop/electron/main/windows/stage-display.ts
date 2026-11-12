import { BrowserWindow, Display, app } from 'electron';
import path from 'path';

let stageDisplayWindow: BrowserWindow | null = null;

export function createStageDisplayWindow(targetDisplay: Display): BrowserWindow {
  const isDev = !app.isPackaged;
  const { x, y, width, height } = targetDisplay.bounds;

  if (stageDisplayWindow) {
    stageDisplayWindow.close();
    stageDisplayWindow = null;
  }

  stageDisplayWindow = new BrowserWindow({
    title: 'Scripture Studio — Stage Confidence Display',
    x,
    y,
    width,
    height,
    frame: false,
    backgroundColor: '#000000',
    alwaysOnTop: true,
    fullscreen: true,
    skipTaskbar: true,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      preload: path.join(__dirname, '../preload/index.js'),
    },
  });

  stageDisplayWindow.once('ready-to-show', () => {
    stageDisplayWindow?.show();
  });

  if (isDev && process.env['VITE_DEV_SERVER_URL']) {
    stageDisplayWindow.loadURL(`${process.env['VITE_DEV_SERVER_URL']}?view=stage`);
  } else {
    stageDisplayWindow.loadFile(path.join(__dirname, '../../dist/index.html'), {
      query: { view: 'stage' },
    });
  }

  stageDisplayWindow.on('closed', () => {
    stageDisplayWindow = null;
  });

  return stageDisplayWindow;
}

export function closeStageDisplayWindow(): void {
  if (stageDisplayWindow) {
    stageDisplayWindow.close();
    stageDisplayWindow = null;
  }
}

export function getStageDisplayWindow(): BrowserWindow | null {
  return stageDisplayWindow;
}

