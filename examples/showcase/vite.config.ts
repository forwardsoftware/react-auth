import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@forward-software/react-auth': path.resolve(__dirname, '../../lib/src/index.ts'),
    },
  },
  server: {
    port: 3003,
    open: true,
  },
});
