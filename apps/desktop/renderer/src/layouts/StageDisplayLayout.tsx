import React, { useEffect, useState } from 'react';
import { PresentationStateDto } from '@scripture-studio/shared-types';

export default function StageDisplayLayout(): React.JSX.Element {
  const [state, setState] = useState<PresentationStateDto | null>(null);
  const [timeString, setTimeString] = useState<string>('');

  useEffect(() => {
    // Clock timer
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);

    if (window.scriptureStudioApi) {
      window.scriptureStudioApi.presentation.getState().then(setState);
      const unsubscribe = window.scriptureStudioApi.presentation.onStateChanged((newState) => {
        setState(newState);
      });

      return () => {
        clearInterval(interval);
        unsubscribe();
      };
    }

    return () => clearInterval(interval);
  }, []);

  const live = state?.liveSlide;
  const preview = state?.previewSlide;

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: '#000000',
        color: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        padding: '2rem',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Top Section: Current Live Scripture (65% Height) */}
      <div
        style={{
          flex: '0 0 65%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          borderBottom: '2px solid #334155',
          paddingBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <span style={{ fontSize: '1rem', color: '#10B981', fontWeight: 700, letterSpacing: '0.1em' }}>
            ● CURRENT LIVE
          </span>
          <span style={{ fontSize: '2.5vw', fontWeight: 800, color: '#F59E0B' }}>
            {live ? `${live.referenceDisplay} (${live.versionAbbreviation})` : 'NO LIVE SCRIPTURE'}
          </span>
        </div>

        <div
          style={{
            fontSize: '3vw',
            lineHeight: 1.35,
            color: '#FFFFFF',
            fontWeight: 700,
            overflowY: 'hidden',
          }}
        >
          {live
            ? live.verses.map((v) => `${v.text} `)
            : 'Waiting for operator to take scripture live...'}
        </div>
      </div>

      {/* Bottom Section: Upcoming Preview Verse & Clock (35% Height) */}
      <div style={{ flex: '1', display: 'flex', paddingTop: '1.5rem', gap: '2rem' }}>
        {/* Upcoming Next Verse Box */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.85rem', color: '#06B6D4', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
            ⏭ UPCOMING PREVIEW
          </span>
          <div style={{ fontSize: '1.5vw', fontWeight: 700, color: '#E2E8F0', marginBottom: '0.25rem' }}>
            {preview ? `${preview.referenceDisplay} (${preview.versionAbbreviation})` : '—'}
          </div>
          <div
            style={{
              fontSize: '1.2vw',
              color: '#94A3B8',
              lineHeight: 1.3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {preview ? preview.verses.map((v) => `${v.text} `) : 'No verse in preview.'}
          </div>
        </div>

        {/* Real-time Clock */}
        <div
          style={{
            width: '280px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-end',
            borderLeft: '1px solid #334155',
            paddingLeft: '2rem',
          }}
        >
          <span style={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: 600, letterSpacing: '0.05em' }}>
            TIME OF SERVICE
          </span>
          <span style={{ fontSize: '2.8vw', fontWeight: 800, color: '#FFFFFF', fontVariantNumeric: 'tabular-nums' }}>
            {timeString}
          </span>
        </div>
      </div>
    </div>
  );
}

