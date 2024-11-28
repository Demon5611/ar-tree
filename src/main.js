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

      // Устанавливаем размеры canvas и video на основе размеров окна
      adjustCanvasAndVideo();
      resolve(video);
    };
  });
}

// Корректировка привязки canvas и video к холсту
function adjustCanvasAndVideo() {
  const aspectRatio = video.videoWidth / video.videoHeight;

  if (window.innerWidth / window.innerHeight > aspectRatio) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerWidth / aspectRatio;
  } else {
    canvas.height = window.innerHeight;
    canvas.width = window.innerHeight * aspectRatio;
  }

  video.style.width = `${canvas.width}px`;
  video.style.height = `${canvas.height}px`;
  video.style.left = "50%";
  video.style.top = "50%";
  video.style.transform = "translate(-50%, -50%)";

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
        console.log("Картина распознана!");
        const boundingBox = detectBoundingBox(video);
        if (boundingBox) {
          playVideoWithinBounds(boundingBox);
        }
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



// Обнаружение координат рамки картины
function detectBoundingBox(video) {
  // В реальном проекте можно использовать алгоритмы компьютерного зрения.
  // Для упрощения берем центральную часть кадра в качестве рамки картины.

  const width = canvas.width * 0.5; // 50% ширины canvas
  const height = canvas.height * 0.5; // 50% высоты canvas
  const x = (canvas.width - width) / 2; // Центр canvas по X
  const y = (canvas.height - height) / 2; // Центр canvas по Y

  const boundingBox = { x, y, width, height };

  console.log("Обнаружен прямоугольник:", boundingBox);
  return boundingBox;
}


let currentBoundingBox = null; // Хранит текущие координаты рамки

function playVideoWithinBounds(boundingBox) {
  // Если рамка не изменилась, не обновляем параметры
  if (
    currentBoundingBox &&
    currentBoundingBox.x === boundingBox.x &&
    currentBoundingBox.y === boundingBox.y &&
    currentBoundingBox.width === boundingBox.width &&
    currentBoundingBox.height === boundingBox.height
  ) {
    return;
  }

  console.log("Обновление видео в пределах рамки...");

  currentBoundingBox = boundingBox;
  videoPlayback.style.display = "block";
  videoPlayback.style.left = `${boundingBox.x}px`;
  videoPlayback.style.top = `${boundingBox.y}px`;
  videoPlayback.style.width = `${boundingBox.width}px`;
  videoPlayback.style.height = `${boundingBox.height}px`;
  videoPlayback.play();
}



// Остановка видео
let stopTimeout = null;

function stopVideo() {
  console.log("Попытка остановки видео...");
  
  // Добавляем небольшую задержку перед остановкой
  if (stopTimeout) clearTimeout(stopTimeout);

  stopTimeout = setTimeout(() => {
    console.log("Остановка видео...");
    videoPlayback.style.display = "none";
    videoPlayback.pause();
    videoPlayback.currentTime = 0;
    currentBoundingBox = null; // Сброс текущей рамки
  }, 300); // Задержка 300 мс
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
