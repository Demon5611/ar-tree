import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  server: {
    port: 3443, // Порт, на котором будет запущен HTTPS сервер
    https: {
      key: fs.readFileSync(path.resolve(__dirname, 'cert/key.pem')), // Путь к ключу
      cert: fs.readFileSync(path.resolve(__dirname, 'cert/cert.pem')), // Путь к сертификату
    },
    open: true, // Автоматически открыть браузер при запуске сервера
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined, // Отключаем разбиение кода
      },
    },
  },
});
