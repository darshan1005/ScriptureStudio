import { app, BrowserWindow, protocol, net } from 'electron';
import path from 'path';
import { pathToFileURL } from 'url';
import { DatabaseClient } from '@scripture-studio/database';
import { createLogger } from '@scripture-studio/logger';
import { createControlStudioWindow } from './windows/control-studio.js';
import { registerAllIpcHandlers } from './ipc/index.js';

const logger = createLogger('ElectronMain');

// High DPI & hardware acceleration switches
app.commandLine.appendSwitch('high-dpi-support', '1');
app.commandLine.appendSwitch('force-device-scale-factor', '1');

let dbClient: DatabaseClient | null = null;

// Register privileged asset scheme
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'asset',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      bypassCSP: false,
    },
  },
]);

async function initializeApp(): Promise<void> {
  logger.info('Starting Scripture Studio desktop runtime...');

  // Initialize SQLite database in user data directory
  const dbPath = path.join(app.getPath('userData'), 'scripture_studio.db');
  dbClient = new DatabaseClient(dbPath);

  // Register custom asset protocol
  protocol.handle('asset', (request) => {
    try {
      const parsedUrl = new URL(request.url);
      const relativePath = parsedUrl.pathname.replace(/^\//, '');
      const fullPath = path.resolve(app.getPath('userData'), 'assets', relativePath);

      // Guard against path traversal
      const assetsDir = path.resolve(app.getPath('userData'), 'assets');
      if (!fullPath.startsWith(assetsDir)) {
        return new Response('Access Denied', { status: 403 });
      }

      return net.fetch(pathToFileURL(fullPath).toString());
    } catch {
      return new Response('Asset Not Found', { status: 404 });
    }
  });

  // Register IPC channel handlers
  registerAllIpcHandlers(dbClient);

  // Create primary Control Studio operator window
  createControlStudioWindow();
  logger.info('Control Studio window successfully launched.');
}

app.whenReady().then(initializeApp);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (dbClient) {
      dbClient.close();
    }
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createControlStudioWindow();
  }
});

