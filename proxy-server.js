const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Добавляем поддержку CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Настройка прокси для запросов к TensorFlow Hub
app.use(
  '/tfhub',
  createProxyMiddleware({
    target: 'https://tfhub.dev',
    changeOrigin: true,
    pathRewrite: {
      '^/tfhub': '', // Убираем /tfhub из пути
    },
    onProxyRes: (proxyRes) => {
      proxyRes.headers['Access-Control-Allow-Origin'] = '*'; // Устанавливаем CORS-заголовок
    },
  })
);

// Запуск сервера на порту 3001
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Прокси-сервер запущен на http://localhost:${PORT}`);
});
