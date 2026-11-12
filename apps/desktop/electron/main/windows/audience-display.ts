import { BrowserWindow, Display, app, screen } from 'electron';
import path from 'path';
import { getControlStudioWindow } from './control-studio.js';

let audienceDisplayWindow: BrowserWindow | null = null;

export function broadcastOutputStatus(): void {
  const ctrlWin = getControlStudioWindow();
  if (ctrlWin && !ctrlWin.isDestroyed()) {
    const isOpen =
      audienceDisplayWindow !== null &&
      !audienceDisplayWindow.isDestroyed() &&
      audienceDisplayWindow.isVisible();
    ctrlWin.webContents.send('display:output-status-changed', { isOpen });
  }
}

export function createAudienceDisplayWindow(targetDisplay: Display): BrowserWindow {
  const isDev = !app.isPackaged;
  const { x, y, width, height } = targetDisplay.bounds;
  const isSingleDisplay = screen.getAllDisplays().length === 1;

  if (audienceDisplayWindow && !audienceDisplayWindow.isDestroyed()) {
    audienceDisplayWindow.show();
    audienceDisplayWindow.focus();
    broadcastOutputStatus();
    return audienceDisplayWindow;
  }

  if (isSingleDisplay) {
    // Windowed preview mode for single-monitor / laptop testing without hiding controls
    audienceDisplayWindow = new BrowserWindow({
      title: 'Scripture Studio — Audience Output (Projector Preview Window)',
      width: Math.min(1152, Math.round(targetDisplay.bounds.width * 0.75)),
      height: Math.min(648, Math.round(targetDisplay.bounds.height * 0.75)),
      frame: true,
      resizable: true,
      backgroundColor: '#000000',
      alwaysOnTop: false,
      fullscreen: false,
      skipTaskbar: false,
      show: false,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        webSecurity: true,
        preload: path.join(__dirname, '../preload/index.js'),
      },
    });
  } else {
    // Fullscreen borderless kiosk projection on external display / projector
    audienceDisplayWindow = new BrowserWindow({
      title: 'Scripture Studio — Audience Output',
      x,
      y,
      width,
      height,
      frame: false,
      transparent: false,
      backgroundColor: '#000000',
      alwaysOnTop: true,
      fullscreen: true,
      skipTaskbar: false,
      show: false,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        webSecurity: true,
        preload: path.join(__dirname, '../preload/index.js'),
      },
    });
  }

  audienceDisplayWindow.once('ready-to-show', () => {
    audienceDisplayWindow?.show();
    broadcastOutputStatus();
  });

  audienceDisplayWindow.on('show', () => {
    broadcastOutputStatus();
  });

  audienceDisplayWindow.on('closed', () => {
    audienceDisplayWindow = null;
    broadcastOutputStatus();
  });

  if (isDev && process.env['VITE_DEV_SERVER_URL']) {
    audienceDisplayWindow.loadURL(`${process.env['VITE_DEV_SERVER_URL']}?view=audience`);
  } else {
    audienceDisplayWindow.loadFile(path.join(__dirname, '../../dist/index.html'), {
      query: { view: 'audience' },
    });
  }

  return audienceDisplayWindow;
}

export function closeAudienceDisplayWindow(): void {
  if (audienceDisplayWindow && !audienceDisplayWindow.isDestroyed()) {
    const win = audienceDisplayWindow;
    audienceDisplayWindow = null;
    win.close();
  }
  broadcastOutputStatus();
}

export function getAudienceDisplayWindow(): BrowserWindow | null {
  return audienceDisplayWindow;
}
