import React, { useMemo } from 'react';
import ControlStudioLayout from './layouts/ControlStudioLayout.js';
import AudienceDisplayLayout from './layouts/AudienceDisplayLayout.js';
import StageDisplayLayout from './layouts/StageDisplayLayout.js';

export default function App(): React.JSX.Element {
  const currentView = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('view') || 'control';
  }, []);

  if (currentView === 'audience') {
    return <AudienceDisplayLayout />;
  }

  if (currentView === 'stage') {
    return <StageDisplayLayout />;
  }

  return <ControlStudioLayout />;
}

