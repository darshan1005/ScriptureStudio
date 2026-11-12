import { DisplayBounds, DisplayDto, DisplayRole } from '@scripture-studio/shared-types';
import { createLogger } from '@scripture-studio/logger';

const logger = createLogger('DisplayService');

export class DisplayService {
  private roleAssignments = new Map<string, DisplayRole>();

  assignRole(displayId: string, role: DisplayRole): void {
    this.roleAssignments.set(displayId, role);
    logger.info(`Assigned role ${role} to display ${displayId}`);
  }

  getRole(displayId: string): DisplayRole {
    return this.roleAssignments.get(displayId) || 'UNASSIGNED';
  }

  resolveTargetDisplay(
    displays: DisplayDto[],
    role: DisplayRole
  ): DisplayDto | null {
    // 1. Explicit assigned role match
    const explicit = displays.find((d) => this.getRole(d.id) === role);
    if (explicit) return explicit;

    // 2. Fallback heuristic:
    if (role === 'AUDIENCE') {
      // Pick first non-primary display (the projector / TV)
      const nonPrimary = displays.find((d) => !d.isPrimary);
      if (nonPrimary) return nonPrimary;
    }

    if (role === 'CONTROL') {
      const primary = displays.find((d) => d.isPrimary);
      if (primary) return primary;
    }

    return null;
  }

  /**
   * Calculates DPI-compensated physical pixel bounds for borderless full-screen windows.
   */
  calculatePhysicalBounds(bounds: DisplayBounds, scaleFactor = 1.0): DisplayBounds {
    return {
      x: bounds.x,
      y: bounds.y,
      width: Math.round(bounds.width * scaleFactor),
      height: Math.round(bounds.height * scaleFactor),
    };
  }
}

