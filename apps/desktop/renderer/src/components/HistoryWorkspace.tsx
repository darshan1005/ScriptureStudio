import React, { useEffect, useState } from 'react';
import { BibleVersionDto, PresentationHistoryEntryDto } from '@scripture-studio/shared-types';
import { MaterialIcon } from './MaterialIcon.js';

interface HistoryWorkspaceProps {
  onRecallLive: (entry: PresentationHistoryEntryDto, secondaryVersionId?: string) => void;
  onRecallPreview: (entry: PresentationHistoryEntryDto, secondaryVersionId?: string) => void;
  lastUpdatedTimestamp?: number;
  secondaryVersionId?: string;
  onSecondaryVersionChange?: (versionId: string) => void;
}

export const HistoryWorkspace: React.FC<HistoryWorkspaceProps> = ({
  onRecallLive,
  onRecallPreview,
  lastUpdatedTimestamp,
  secondaryVersionId,
}) => {
  const [history, setHistory] = useState<PresentationHistoryEntryDto[]>([]);
  const [versions, setVersions] = useState<BibleVersionDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (window.scriptureStudioApi) {
      window.scriptureStudioApi.bible.getVersions().then((res) => {
        setVersions(res.versions || []);
      });
    }
  }, []);

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
          borderBottom: '1px solid #334155',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#1E293B',
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
                  backgroundColor: '#334155',
                  color: '#CBD5E1',
                  border: '1px solid #475569',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontWeight: 600,
                }}
              >
                {history.length} {history.length === 1 ? 'item' : 'items'}
              </span>
            )}
          </div>
          <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
            Scriptures projected in the last 24 hours (auto-cleared after 24 hrs)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button
            className="btn-secondary"
            onClick={loadHistory}
            disabled={isLoading}
            style={{ fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <MaterialIcon name="sync" size={16} />
            <span>{isLoading ? 'Refreshing...' : 'Refresh'}</span>
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
            <div style={{ marginBottom: '0.75rem', color: '#64748B' }}>
              <MaterialIcon name="history" size={48} />
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: '#94A3B8' }}>
              No presentation history in the last 24 hours
            </div>
            <div style={{ fontSize: '0.85rem', color: '#94A3B8', marginTop: '0.35rem' }}>
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

            const recordedSecondary = entry.reference?.secondaryVersionId;
            const effectiveSec = secondaryVersionId || recordedSecondary;

            const isDual = !!recordedSecondary || entry.translationAbbr.includes('/') || !!secondaryVersionId;
            const effectiveSecAbbr = effectiveSec
              ? versions.find((v) => v.id === effectiveSec)?.abbreviation || effectiveSec.toUpperCase()
              : null;

            return (
              <div
                key={entry.id}
                style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: '#0F172A',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  marginBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, color: '#E2E8F0', fontSize: '1.05rem' }}>
                      {entry.formattedDisplay}
                    </span>
                    <span
                      style={{
                        backgroundColor: '#334155',
                        color: '#CBD5E1',
                        border: '1px solid #475569',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                      }}
                    >
                      {entry.translationAbbr.split('/')[0]?.trim() || entry.translationAbbr}
                    </span>
                    {(effectiveSecAbbr || isDual) && (
                      <span
                        style={{
                          backgroundColor: '#1E293B',
                          color: '#94A3B8',
                          border: '1px solid #475569',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                        }}
                      >
                        + {effectiveSecAbbr || entry.translationAbbr.split('/')[1]?.trim() || '2nd'}
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: '0.8rem',
                      color: '#94A3B8',
                      marginTop: '3px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <MaterialIcon name="schedule" size={15} color="#94A3B8" />
                    <span>Projected {displayTimestamp}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                  <button
                    className="btn-secondary"
                    style={{
                      padding: '0.4rem 0.85rem',
                      fontSize: '0.82rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                    onClick={() => onRecallPreview(entry, effectiveSec)}
                    title="Load into Preview stage"
                  >
                    <MaterialIcon name="visibility" size={15} />
                    <span>Preview</span>
                  </button>
                  <button
                    className="btn-primary"
                    style={{
                      padding: '0.4rem 0.85rem',
                      fontSize: '0.82rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                    onClick={() => onRecallLive(entry, effectiveSec)}
                    title="Send live to audience display"
                  >
                    <MaterialIcon name="bolt" size={16} />
                    <span>Recall Live</span>
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
