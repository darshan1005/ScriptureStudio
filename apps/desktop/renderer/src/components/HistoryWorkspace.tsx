import React, { useEffect, useState } from 'react';
import { PresentationHistoryEntryDto } from '@scripture-studio/shared-types';

interface HistoryWorkspaceProps {
  onRecallLive: (entry: PresentationHistoryEntryDto) => void;
  onRecallPreview: (entry: PresentationHistoryEntryDto) => void;
  lastUpdatedTimestamp?: number;
}

export const HistoryWorkspace: React.FC<HistoryWorkspaceProps> = ({
  onRecallLive,
  onRecallPreview,
  lastUpdatedTimestamp,
}) => {
  const [history, setHistory] = useState<PresentationHistoryEntryDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const loadHistory = async () => {
    if (window.scriptureStudioApi) {
      setIsLoading(true);
      try {
        const res = await window.scriptureStudioApi.history.getRecent(100);
        setHistory(res.entries || []);
      } catch (err) {
        console.error('Failed to load presentation history:', err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    loadHistory();
  }, [lastUpdatedTimestamp]);

  const handleClearHistory = async () => {
    if (window.confirm('Are you sure you want to clear the presentation history log?')) {
      if (window.scriptureStudioApi) {
        await window.scriptureStudioApi.history.clear();
        await loadHistory();
      }
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--bg-panel)',
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '0.75rem 1rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--bg-card)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#F1F5F9', margin: 0 }}>
              Presentation History
            </h3>
            {history.length > 0 && (
              <span
                style={{
                  fontSize: '0.75rem',
                  backgroundColor: 'rgba(59, 130, 246, 0.2)',
                  color: '#60A5FA',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontWeight: 600,
                }}
              >
                {history.length} {history.length === 1 ? 'item' : 'items'}
              </span>
            )}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            Scriptures projected in the last 24 hours (auto-cleared after 24 hrs)
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn-secondary"
            onClick={loadHistory}
            disabled={isLoading}
            style={{ fontSize: '0.85rem' }}
          >
            {isLoading ? '⏳ Refreshing...' : '🔄 Refresh'}
          </button>
          <button
            className="btn-secondary"
            onClick={handleClearHistory}
            style={{ fontSize: '0.85rem', color: '#EF4444' }}
            disabled={history.length === 0}
          >
            Clear Log
          </button>
        </div>
      </div>

      {/* History List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
        {history.length === 0 ? (
          <div style={{ padding: '3.5rem 1rem', textAlign: 'center', color: 'var(--text-dim)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🕒</div>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: '#94A3B8' }}>
              No presentation history in the last 24 hours
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: '0.35rem' }}>
              Verses taken live to the projector or preview screen will appear here automatically.
            </div>
          </div>
        ) : (
          history.map((entry) => {
            const presentedDate = new Date(entry.presentedAt);
            const now = new Date();
            const isToday = presentedDate.toDateString() === now.toDateString();
            const timeStr = presentedDate.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });
            const displayTimestamp = isToday ? `Today at ${timeStr}` : `Yesterday at ${timeStr}`;

            return (
              <div
                key={entry.id}
                style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  marginBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: '#F59E0B', fontSize: '1.05rem' }}>
                    {entry.formattedDisplay}{' '}
                    <span
                      style={{
                        color: 'var(--text-muted)',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        marginLeft: '4px',
                      }}
                    >
                      ({entry.translationAbbr})
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-dim)',
                      marginTop: '3px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>🕒</span>
                    <span>Projected {displayTimestamp}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                  <button
                    className="btn-secondary"
                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem' }}
                    onClick={() => onRecallPreview(entry)}
                    title="Load into Preview stage"
                  >
                    👁️ Preview
                  </button>
                  <button
                    className="btn-primary"
                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem' }}
                    onClick={() => onRecallLive(entry)}
                    title="Send live to audience display"
                  >
                    ⚡ Recall Live
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
