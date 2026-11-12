import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import path from 'path';

delete process.env.ELECTRON_RUN_AS_NODE;

export default defineConfig({
  root: path.resolve(__dirname, 'renderer'),
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'renderer/src'),
      '@scripture-studio/shared-types': path.resolve(__dirname, '../../packages/shared-types/src/index.ts'),
      '@scripture-studio/database': path.resolve(__dirname, '../../packages/database/src/index.ts'),
      '@scripture-studio/logger': path.resolve(__dirname, '../../packages/logger/src/index.ts'),
      '@scripture-studio/configuration': path.resolve(__dirname, '../../packages/configuration/src/index.ts'),
      '@scripture-studio/ui-library': path.resolve(__dirname, '../../packages/ui-library/src/index.ts'),
      '@scripture-studio/bible-engine': path.resolve(__dirname, '../../packages/bible-engine/src/index.ts'),
      '@scripture-studio/bible-importer': path.resolve(__dirname, '../../packages/bible-importer/src/index.ts'),
      '@scripture-studio/scripture-search': path.resolve(__dirname, '../../packages/scripture-search/src/index.ts'),
      '@scripture-studio/presentation-engine': path.resolve(__dirname, '../../packages/presentation-engine/src/index.ts'),
      '@scripture-studio/theme-engine': path.resolve(__dirname, '../../packages/theme-engine/src/index.ts'),
      '@scripture-studio/media-engine': path.resolve(__dirname, '../../packages/media-engine/src/index.ts'),
      '@scripture-studio/display-manager': path.resolve(__dirname, '../../packages/display-manager/src/index.ts'),
      '@scripture-studio/keyboard-shortcuts': path.resolve(__dirname, '../../packages/keyboard-shortcuts/src/index.ts'),
      '@scripture-studio/streaming-engine': path.resolve(__dirname, '../../packages/streaming-engine/src/index.ts'),
    },
  },
  plugins: [
    react(),
    electron([
      {
        entry: path.resolve(__dirname, 'electron/main/index.ts'),
        onstart(options) {
          options.startup();
        },
        vite: {
          build: {
            outDir: path.resolve(__dirname, 'dist-electron/main'),
            rollupOptions: {
              external: ['better-sqlite3'],
            },
          },
          resolve: {
            alias: {
              '@scripture-studio/shared-types': path.resolve(__dirname, '../../packages/shared-types/src/index.ts'),
              '@scripture-studio/database': path.resolve(__dirname, '../../packages/database/src/index.ts'),
              '@scripture-studio/logger': path.resolve(__dirname, '../../packages/logger/src/index.ts'),
              '@scripture-studio/configuration': path.resolve(__dirname, '../../packages/configuration/src/index.ts'),
              '@scripture-studio/ui-library': path.resolve(__dirname, '../../packages/ui-library/src/index.ts'),
              '@scripture-studio/bible-engine': path.resolve(__dirname, '../../packages/bible-engine/src/index.ts'),
              '@scripture-studio/bible-importer': path.resolve(__dirname, '../../packages/bible-importer/src/index.ts'),
              '@scripture-studio/scripture-search': path.resolve(__dirname, '../../packages/scripture-search/src/index.ts'),
              '@scripture-studio/presentation-engine': path.resolve(__dirname, '../../packages/presentation-engine/src/index.ts'),
              '@scripture-studio/theme-engine': path.resolve(__dirname, '../../packages/theme-engine/src/index.ts'),
              '@scripture-studio/media-engine': path.resolve(__dirname, '../../packages/media-engine/src/index.ts'),
              '@scripture-studio/display-manager': path.resolve(__dirname, '../../packages/display-manager/src/index.ts'),
              '@scripture-studio/keyboard-shortcuts': path.resolve(__dirname, '../../packages/keyboard-shortcuts/src/index.ts'),
              '@scripture-studio/streaming-engine': path.resolve(__dirname, '../../packages/streaming-engine/src/index.ts'),
            },
          },
        },
      },
      {
        entry: path.resolve(__dirname, 'electron/preload/index.ts'),
        onstart(options) {
          options.reload();
        },
        vite: {
          build: {
            outDir: path.resolve(__dirname, 'dist-electron/preload'),
          },
          resolve: {
            alias: {
              '@scripture-studio/shared-types': path.resolve(__dirname, '../../packages/shared-types/src/index.ts'),
            },
          },
        },
      },
    ]),
    renderer(),
  ],
});
