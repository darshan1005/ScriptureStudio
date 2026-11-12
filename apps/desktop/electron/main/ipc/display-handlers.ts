import { ipcMain, screen } from 'electron';
import { AssignDisplayRoleRequest, DisplayDto, DisplayRole } from '@scripture-studio/shared-types';
import { createLogger } from '@scripture-studio/logger';
import {
  createAudienceDisplayWindow,
  closeAudienceDisplayWindow,
  getAudienceDisplayWindow,
  broadcastOutputStatus,
} from '../windows/audience-display.js';
import { createStageDisplayWindow, closeStageDisplayWindow } from '../windows/stage-display.js';
import { getControlStudioWindow } from '../windows/control-studio.js';

const logger = createLogger('DisplayManager');

const assignedRoles: Map<string, DisplayRole> = new Map();

export function registerDisplayIpcHandlers(): void {
  ipcMain.handle('display:get-displays', () => {
    return { displays: getConnectedDisplays() };
  });

  ipcMain.handle('display:assign-role', (_e, req: AssignDisplayRoleRequest) => {
    if (req.role === 'AUDIENCE') {
      for (const [key, val] of assignedRoles.entries()) {
        if (val === 'AUDIENCE') assignedRoles.delete(key);
      }
    }
    assignedRoles.set(req.displayId, req.role);
    logger.info(`Assigned role ${req.role} to display ${req.displayId}`);

    // If audience window is open, re-target to this newly selected display immediately
    const audienceWin = getAudienceDisplayWindow();
    if (audienceWin && !audienceWin.isDestroyed() && audienceWin.isVisible() && req.role === 'AUDIENCE') {
      closeAudienceDisplayWindow();
      openOutputWindows();
    }

    broadcastTopologyChange();
    return { success: true };
  });

  ipcMain.handle('display:open-outputs', () => {
    openOutputWindows();
    broadcastOutputStatus();
  });

  ipcMain.handle('display:close-outputs', () => {
    closeAudienceDisplayWindow();
    closeStageDisplayWindow();
    broadcastOutputStatus();
  });

  ipcMain.handle('display:get-output-status', () => {
    const audienceWin = getAudienceDisplayWindow();
    return {
      isOpen: audienceWin !== null && !audienceWin.isDestroyed() && audienceWin.isVisible(),
    };
  });

  // Windows display change listener
  screen.on('display-added', () => {
    logger.info('External display connected.');
    broadcastTopologyChange();
  });

  screen.on('display-removed', () => {
    logger.warn('External display disconnected.');
    broadcastTopologyChange();
  });
}

export function getConnectedDisplays(): DisplayDto[] {
  const primaryDisplay = screen.getPrimaryDisplay();
  const allDisplays = screen.getAllDisplays();

  return allDisplays.map((d, index) => {
    const isPrimary = d.id === primaryDisplay.id;
    let role = assignedRoles.get(String(d.id)) || 'UNASSIGNED';

    if (role === 'UNASSIGNED') {
      if (isPrimary) {
        role = 'CONTROL';
      } else if (index === 1) {
        role = 'AUDIENCE';
      }
    }

    return {
      id: String(d.id),
      name: `Display ${index + 1} (${d.bounds.width}x${d.bounds.height})`,
      bounds: d.bounds,
      workArea: d.workArea,
      isPrimary,
      scaleFactor: d.scaleFactor,
      role,
    };
  });
}

export function openOutputWindows(): void {
  const displays = screen.getAllDisplays();
  const primaryDisplay = screen.getPrimaryDisplay();

  // Find assigned audience display, or secondary external display
  let audienceTarget = displays.find((d) => assignedRoles.get(String(d.id)) === 'AUDIENCE');
  if (!audienceTarget) {
    audienceTarget = displays.find((d) => d.id !== primaryDisplay.id);
  }

  if (audienceTarget) {
    logger.info(`Opening audience output on display ID: ${audienceTarget.id}`);
    createAudienceDisplayWindow(audienceTarget);
  } else {
    // If only 1 monitor, open windowed audience test window on primary
    logger.info('Single monitor detected; opening audience preview window on primary display');
    createAudienceDisplayWindow(primaryDisplay);
  }

  // Find stage display
  const stageTarget = displays.find((d) => assignedRoles.get(String(d.id)) === 'STAGE');
  if (stageTarget) {
    logger.info(`Opening stage confidence display on display ID: ${stageTarget.id}`);
    createStageDisplayWindow(stageTarget);
  }
}

function broadcastTopologyChange(): void {
  const displays = getConnectedDisplays();
  const controlWin = getControlStudioWindow();
  if (controlWin && !controlWin.isDestroyed()) {
    controlWin.webContents.send('display:topology-changed', {
      connectedCount: displays.length,
      displays,
      hasAudienceDisplay: displays.some((d) => d.role === 'AUDIENCE'),
      hasStageDisplay: displays.some((d) => d.role === 'STAGE'),
    });
  }
}

