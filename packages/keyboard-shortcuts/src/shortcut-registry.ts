import { createLogger } from '@scripture-studio/logger';

const logger = createLogger('KeyboardShortcuts');

export type ShortcutAction =
  | 'TAKE_LIVE'
  | 'FREEZE'
  | 'HIDE'
  | 'CLEAR'
  | 'NEXT'
  | 'PREV'
  | 'QUICK_SEARCH';

export interface ShortcutDefinition {
  action: ShortcutAction;
  keys: string[];
  description: string;
}

export const DEFAULT_SHORTCUTS: ShortcutDefinition[] = [
  { action: 'TAKE_LIVE', keys: ['F12', 'Enter'], description: 'Take preview slide live to audience' },
  { action: 'FREEZE', keys: ['F9'], description: 'Freeze audience display on current frame' },
  { action: 'HIDE', keys: ['F10', 'Escape'], description: 'Hide audience display to black' },
  { action: 'CLEAR', keys: ['F11'], description: 'Clear presentation to idle state' },
  { action: 'NEXT', keys: ['PageDown', 'ArrowDown'], description: 'Next verse in chapter or playlist' },
  { action: 'PREV', keys: ['PageUp', 'ArrowUp'], description: 'Previous verse in chapter or playlist' },
  { action: 'QUICK_SEARCH', keys: ['F5', 'Control+f'], description: 'Focus quick reference search' },
];

export class ShortcutRegistry {
  private handlers = new Map<ShortcutAction, () => void>();

  register(action: ShortcutAction, handler: () => void): void {
    this.handlers.set(action, handler);
  }

  handleKeyDown(event: KeyboardEvent): boolean {
    const target = event.target as HTMLElement | null;
    const isEditingText = target && ['INPUT', 'TEXTAREA'].includes(target.tagName);

    const key = event.key;
    const hasCtrl = event.ctrlKey || event.metaKey;

    for (const def of DEFAULT_SHORTCUTS) {
      for (const pattern of def.keys) {
        if (pattern === 'Control+f' && hasCtrl && key.toLowerCase() === 'f') {
          event.preventDefault();
          this.execute(def.action);
          return true;
        }

        if (pattern === 'Enter' && hasCtrl && key === 'Enter') {
          event.preventDefault();
          this.execute(def.action);
          return true;
        }

        if (pattern === key) {
          // If typing in input, don't trigger navigation keys
          if (isEditingText && (key === 'Enter' || key === 'ArrowDown' || key === 'ArrowUp')) {
            return false;
          }

          event.preventDefault();
          this.execute(def.action);
          return true;
        }
      }
    }

    return false;
  }

  private execute(action: ShortcutAction): void {
    const handler = this.handlers.get(action);
    if (handler) {
      logger.debug(`Executing shortcut action: ${action}`);
      handler();
    }
  }
}

