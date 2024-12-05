const video = document.getElementById("videoInput");
const canvas = document.getElementById("threeCanvas");
const referenceImage = document.getElementById("referenceImage");
const videoPlayback = document.getElementById("videoPlayback");

let referenceFeatures;
let isVideoPlaying = false; // Отслеживаем состояние воспроизведения видео
let currentBoundingBox = null; // Глобальная переменная для текущей рамки

// Лог начала работы
console.log("Начало работы программы.");

// Настройка камеры
async function setupCamera() {
  console.log("Настройка камеры...");
  
  const devices = await navigator.mediaDevices.enumerateDevices();
  console.log("Доступные устройства:", devices);
  
  const frontCamera = devices.find(
    (device) => device.kind === "videoinput" && device.label.toLowerCase().includes("front")
  );

  const constraints = {
    video: frontCamera
      ? { deviceId: frontCamera.deviceId, width: { ideal: 1280 }, height: { ideal: 720 } }
      : { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }
  };
  console.log("Выбранные ограничения:", constraints);

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    console.log("Поток получен:", stream);
    video.srcObject = stream;

    return new Promise((resolve) => {
      video.onloadedmetadata = () => {
        console.log("Камера настроена. Ширина:", video.videoWidth, "Высота:", video.videoHeight);
        adjustCanvasAndVideo();
        resolve(video);
      };
    });
  } catch (error) {
    console.error("Ошибка доступа к камере:", error);
    alert("Не удалось получить доступ к камере. Проверьте разрешения.");
  }
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

  canvas.style.width = `${canvas.width}px`;
  canvas.style.height = `${canvas.height}px`;
  canvas.style.left = "50%";
  canvas.style.top = "50%";
  canvas.style.transform = "translate(-50%, -50%)";
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

  if (!referenceImage.complete || referenceImage.naturalWidth === 0 || referenceImage.naturalHeight === 0) {
    throw new Error("Эталонное изображение не загружено или имеет неправильные размеры.");
  }

  const imageTensor = tf.browser.fromPixels(referenceImage).expandDims();
  const features = model.infer(imageTensor, true);
  console.log("Эталонные признаки извлечены.");
  tf.dispose(imageTensor);
  return features;
}

// Сравнение текущего кадра с эталоном
async function compareFrames(model) {
  console.log("Начало сравнения текущих кадров с эталоном...");
  const interval = 1000;

  setInterval(async () => {
    try {
      console.log("Обработка следующего кадра...");
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      console.log("Кадр отрисован на canvas.");

      const videoTensor = tf.browser.fromPixels(video).expandDims();
      console.log("Размеры видео Tensor:", videoTensor.shape);

      const videoFeatures = model.infer(videoTensor, true);

      const similarity = tf.losses.cosineDistance(referenceFeatures, videoFeatures, 0).dataSync()[0];
      console.log("Результат сходства:", similarity);

      const similarityThreshold = 0.4;

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
  const aspectRatio = canvas.width / canvas.height;
  const width = canvas.width * 0.5;
  const height = width / aspectRatio;
  const x = (canvas.width - width) / 2;
  const y = (canvas.height - height) / 2;

  const boundingBox = { x, y, width, height };
  console.log("Обнаружен прямоугольник:", boundingBox);
  return boundingBox;
}


// Воспроизведение видео в рамках boundingBox
function playVideoWithinBounds(boundingBox) {
  try {
    if (
      currentBoundingBox &&
      currentBoundingBox.x === boundingBox.x &&
      currentBoundingBox.y === boundingBox.y &&
      currentBoundingBox.width === boundingBox.width &&
      currentBoundingBox.height === boundingBox.height
    ) {
      if (isVideoPlaying) return;
    }

    console.log("Обновление видео в пределах рамки...");
    currentBoundingBox = boundingBox;

    videoPlayback.style.display = "block";
    videoPlayback.style.left = `${boundingBox.x}px`;
    videoPlayback.style.top = `${boundingBox.y}px`;
    videoPlayback.style.width = `${boundingBox.width}px`;
    videoPlayback.style.height = `${boundingBox.height}px`;

    videoPlayback.play().then(() => {
      isVideoPlaying = true;
      console.log("Видео воспроизводится.");
    }).catch((err) => {
      console.error("Ошибка воспроизведения видео:", err);
    });
  } catch (error) {
    console.error("Ошибка в playVideoWithinBounds:", error);
  }
}

// Остановка видео
function stopVideo() {
  if (!isVideoPlaying || videoPlayback.style.display === "none") {
    console.log("Видео уже остановлено.");
    return;
  }

  console.log("Остановка видео...");
  videoPlayback.style.display = "none";
  videoPlayback.pause();
  videoPlayback.currentTime = 0;
  isVideoPlaying = false;
  currentBoundingBox = null;
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
