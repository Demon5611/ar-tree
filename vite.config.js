import { defineConfig } from 'vite';
import { createProxyMiddleware } from 'http-proxy-middleware';

// Экспорт конфигурации Vite
export default defineConfig({
  server: {
    proxy: {
      '/tfhub': {
        target: 'https://tfhub.dev',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/tfhub/, ''),
      },
    },
  },
});
