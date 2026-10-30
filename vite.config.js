import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/archi-demo/' : '/',
  server: {
    port: 5173,
    open: false,
    host: true,
  },
  publicDir: 'public',
  assetsInclude: ['**/*.mp4'],
});
