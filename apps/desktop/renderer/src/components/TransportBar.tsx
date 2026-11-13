import React from 'react';
import { PresentationStateDto } from '@scripture-studio/shared-types';

interface TransportBarProps {
  state: PresentationStateDto | null;
}

export default function TransportBar({
  state,
}: TransportBarProps): React.JSX.Element {
  return (
    <footer
      style={{
        height: '46px',
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

      {/* Status Indicators */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem' }}>
        <span style={{ color: 'var(--text-dim)' }}>Output Mode:</span>
        <span
          className={`badge ${state?.mode === 'LIVE'
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
