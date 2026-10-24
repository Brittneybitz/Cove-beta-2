import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
base: '/Cove-beta-2/',
  server: {
    host: '0.0.0.0',
    port: 3000,
    hmr: false,
  },
  plugins: [react(), tailwindcss()],
});