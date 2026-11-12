export interface ApplicationPreferences {
  activeVersionId: string;
  defaultThemeId: string;
  presentation: {
    autoTakeLive: boolean;
    transitionType: 'CUT' | 'FADE' | 'SLIDE';
    transitionDurationMs: number;
    autoPlayDwellSeconds: number;
    autoPlayLoop: boolean;
  };
  display: {
    audienceDisplayId?: string;
    stageDisplayId?: string;
    safeMarginsEnabled: boolean;
  };
  integrations: {
    diskExportEnabled: boolean;
    diskExportDirectory: string;
    ndiEnabled: boolean;
    ndiStreamName: string;
  };
  ui: {
    darkMode: boolean;
    sidebarCollapsed: boolean;
    fontSizeOffset: number;
  };
}

export const DEFAULT_PREFERENCES: ApplicationPreferences = {
  activeVersionId: 'kjv',
  defaultThemeId: 'theme-sanctuary-gold',
  presentation: {
    autoTakeLive: false,
    transitionType: 'FADE',
    transitionDurationMs: 250,
    autoPlayDwellSeconds: 7,
    autoPlayLoop: false,
  },
  display: {
    safeMarginsEnabled: true,
  },
  integrations: {
    diskExportEnabled: false,
    diskExportDirectory: '',
    ndiEnabled: false,
    ndiStreamName: 'ScriptureStudio-Output',
  },
  ui: {
    darkMode: true,
    sidebarCollapsed: false,
    fontSizeOffset: 0,
  },
};

