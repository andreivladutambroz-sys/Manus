import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
    },
  },
  build: {
    target: 'ES2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tabs'],
          'vendor-utils': ['clsx', 'tailwind-merge', 'date-fns'],
          'vendor-trpc': ['@trpc/client', '@trpc/react-query'],
          
          // Feature chunks
          'feature-diagnostic': [
            './client/src/pages/DiagnosticNew.tsx',
            './client/src/pages/DiagnosticDetail.tsx',
            './client/src/components/AISuggestions.tsx',
          ],
          'feature-vehicle': [
            './client/src/pages/VehicleList.tsx',
            './client/src/components/VehicleForm.tsx',
          ],
          'feature-dashboard': [
            './client/src/pages/Dashboard.tsx',
            './client/src/components/DashboardLayout.tsx',
          ],
          'feature-obd': [
            './client/src/pages/OBDScanner.tsx',
            './client/src/lib/obdScanner.ts',
          ],
          'feature-ai': [
            './client/src/components/AIChatbot.tsx',
            './client/src/components/MaintenanceRecommendations.tsx',
          ],
          'feature-voice': [
            './client/src/components/VoiceInput.tsx',
            './client/src/lib/voiceCommands.ts',
          ],
        },
      },
    },
    chunkSizeWarningLimit: 600,
    sourcemap: false,
    cssCodeSplit: true,
  },
  optimization: {
    minimize: true,
  },
  server: {
    middlewareMode: false,
  },
});
