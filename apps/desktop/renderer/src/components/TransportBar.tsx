import React from 'react';
import { PresentationStateDto } from '@scripture-studio/shared-types';
import { MaterialIcon } from './MaterialIcon.js';

interface TransportBarProps {
  state: PresentationStateDto | null;
  onFreezeToggle: () => void;
  onHideToggle: () => void;
  onClear?: () => void;
}

export default function TransportBar({
  state,
  onFreezeToggle,
  onHideToggle,
}: TransportBarProps): React.JSX.Element {
  const isFrozen = state?.isFrozen || false;
  const isVisible = state?.isVisible !== false;

  return (
    <footer
      style={{
        height: '60px',
        backgroundColor: 'var(--bg-panel)',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.25rem',
      }}
    >
      {/* Quick Status / Hotkey Helper */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.82rem', color: 'var(--text-dim)' }}>
        <span>Hotkeys:</span>
        <span style={{ color: 'var(--text-muted)' }}><b>F12</b>: Live</span>
        <span>•</span>
        <span style={{ color: '#60A5FA', fontWeight: 600 }}><b>← / →</b>: Prev/Next Verse</span>
        <span>•</span>
        <span style={{ color: 'var(--text-muted)' }}><b>F9</b>: Freeze</span>
        <span>•</span>
        <span style={{ color: 'var(--text-muted)' }}><b>F10</b>: Hide</span>
        <span>•</span>
        <span style={{ color: 'var(--text-muted)' }}><b>Esc</b>: Close Output</span>
      </div>

      {/* Main Broadcast Controls */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <button
          className={`btn-freeze ${isFrozen ? 'active' : ''}`}
          onClick={onFreezeToggle}
          style={{
            minWidth: '135px',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
          }}
          title="Freeze display on current frame (F9)"
        >
          <MaterialIcon name="ac_unit" size={17} />
          <span>{isFrozen ? 'UNFREEZE (F9)' : 'FREEZE (F9)'}</span>
        </button>

        <button
          className={!isVisible ? 'btn-primary' : 'btn-secondary'}
          onClick={onHideToggle}
          style={{
            minWidth: '135px',
            backgroundColor: !isVisible ? '#D97706' : undefined,
            borderColor: !isVisible ? '#F59E0B' : undefined,
            color: !isVisible ? '#FFFFFF' : undefined,
            fontWeight: 600,
            boxShadow: !isVisible ? '0 0 10px rgba(245, 158, 11, 0.4)' : undefined,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
          }}
          title={isVisible ? 'Hide output screen to black (F10)' : 'Unhide output screen back to live (F10)'}
        >
          <MaterialIcon name={isVisible ? 'visibility_off' : 'visibility'} size={17} />
          <span>{isVisible ? 'HIDE (F10)' : 'UNHIDE (F10)'}</span>
        </button>
      </div>

      {/* Status Indicators */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem' }}>
        <span style={{ color: 'var(--text-dim)' }}>Output Mode:</span>
        <span
          className={`badge ${
            state?.mode === 'LIVE'
              ? 'badge-live'
              : state?.mode === 'FROZEN'
              ? 'badge-frozen'
              : 'badge-idle'
          }`}
        >
          {state?.mode || 'OFFLINE'}
        </span>
      </div>
    </footer>
  );
}
