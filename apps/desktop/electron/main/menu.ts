import { app, Menu, MenuItemConstructorOptions, shell } from 'electron';
import { getControlStudioWindow } from './windows/control-studio.js';
import { createLogger } from '@scripture-studio/logger';

const logger = createLogger('AppMenu');

export function setupApplicationMenu(): void {
  const isMac = process.platform === 'darwin';

  const sendHelpTab = (tab: 'guide' | 'bug' | 'enhancement' | 'qa') => {
    const win = getControlStudioWindow();
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
      win.webContents.send('help:open-tab', tab);
      logger.info(`Dispatched Help action to renderer: ${tab}`);
    }
  };

  const template: MenuItemConstructorOptions[] = [
    ...(isMac ? [{ role: 'appMenu' as const }] : []),
    {
      label: '&File',
      submenu: [
        {
          label: 'Reload Studio',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            const win = getControlStudioWindow();
            win?.reload();
          },
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit', label: 'Exit' },
      ],
    },
    {
      label: '&Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: '&View',
      submenu: [
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        ...(!app.isPackaged
          ? [
              { type: 'separator' as const },
              { role: 'toggleDevTools' as const },
            ]
          : []),
      ],
    },
    {
      label: '&Window',
      submenu: [
        { role: 'minimize' },
        ...(isMac
          ? [
              { type: 'separator' as const },
              { role: 'front' as const },
              { type: 'separator' as const },
              { role: 'window' as const },
            ]
          : [{ role: 'close' as const }]),
      ],
    },
    {
      label: '&Help',
      submenu: [
        {
          label: '📖 Guide To Use The Software',
          accelerator: 'F1',
          click: () => sendHelpTab('guide'),
        },
        { type: 'separator' },
        {
          label: '🐛 Report a Bug (Default to battuladarshan7838@gmail.com)',
          accelerator: 'CmdOrCtrl+Shift+B',
          click: () => sendHelpTab('bug'),
        },
        {
          label: '💡 Any Enhancements (Feature Requests)',
          accelerator: 'CmdOrCtrl+Shift+E',
          click: () => sendHelpTab('enhancement'),
        },
        {
          label: '❓ Q&&A (Frequently Asked Questions)',
          accelerator: 'CmdOrCtrl+Shift+Q',
          click: () => sendHelpTab('qa'),
        },
        { type: 'separator' },
        {
          label: 'Contact Developer (battuladarshan7838@gmail.com)',
          click: () => {
            shell.openExternal('mailto:battuladarshan7838@gmail.com?subject=Scripture%20Studio%20Support%20Inquiry');
          },
        },
        {
          label: 'GitHub Repository & Issues',
          click: () => {
            shell.openExternal('https://github.com/darshan1005/ScriptureStudio/issues');
          },
        },
        { type: 'separator' },
        {
          label: `About Scripture Studio (v${app.getVersion()})`,
          click: () => sendHelpTab('guide'),
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
  logger.info('Application menu initialized successfully with Help options.');
}
