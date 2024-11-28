const video = document.getElementById("videoInput");
const canvas = document.getElementById("threeCanvas");
const referenceImage = document.getElementById("referenceImage");
const videoPlayback = document.getElementById("videoPlayback");

let referenceFeatures;

// Лог начала работы
console.log("Начало работы программы.");

// Настройка камеры
async function setupCamera() {
  console.log("Настройка камеры...");
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;
  return new Promise((resolve) => {
    video.onloadedmetadata = () => {
      console.log("Камера настроена. Ширина:", video.videoWidth, "Высота:", video.videoHeight);
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      resolve(video);
    };
  });
}

// Загрузка модели TensorFlow.js
async function loadModel() {
  console.log("Загрузка модели TensorFlow.js...");
  const model = await mobilenet.load();
  console.log("Модель TensorFlow.js загружена.");
  return model;
}

// Извлечение эталонных признаков
async function extractReferenceFeatures(model) {
  console.log("Извлечение эталонных признаков из изображения...");
  const imageTensor = tf.browser.fromPixels(referenceImage).expandDims();
  const features = model.infer(imageTensor, true);
  console.log("Эталонные признаки извлечены.");
  tf.dispose(imageTensor);
  return features;
}

// Сравнение текущего кадра с эталоном
async function compareFrames(model) {
  console.log("Начало сравнения текущих кадров с эталоном...");
  const interval = 500;

  setInterval(async () => {
    try {
      console.log("Обработка следующего кадра...");
      const videoTensor = tf.browser.fromPixels(video).expandDims();
      const videoFeatures = model.infer(videoTensor, true);

      const similarity = tf.losses.cosineDistance(referenceFeatures, videoFeatures, 0).dataSync()[0];
      console.log("Результат сходства:", similarity);

      const similarityThreshold = 0.2;

      if (similarity < similarityThreshold) {
        console.log("Hello"); // Успешное распознавание
        playVideo();
      } else {
        console.log("Картина не распознана.");
        stopVideo();
      }

      tf.dispose(videoTensor);
      tf.dispose(videoFeatures);
    } catch (err) {
      console.error("Ошибка при обработке кадра:", err);
    }
  }, interval);
}

// Воспроизведение видео
function playVideo() {
  console.log("Запуск видео...");
  videoPlayback.style.display = "block";
  videoPlayback.play();
}

// Остановка видео
function stopVideo() {
  console.log("Остановка видео...");
  videoPlayback.style.display = "none";
  videoPlayback.pause();
  videoPlayback.currentTime = 0;
}

// Основная функция
async function main() {
  console.log("Запуск основной программы...");
  await setupCamera();
  const model = await loadModel();
  referenceFeatures = await extractReferenceFeatures(model);

  console.log("Готов к сравнению.");
  compareFrames(model);
}

main();
