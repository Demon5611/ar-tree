const video = document.getElementById("videoInput");
const referenceImage = document.getElementById("referenceImage");
let referenceFeatures;

// Настройка видеопотока
async function setupCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;
  return new Promise((resolve) => {
    video.onloadedmetadata = () => {
      resolve(video);
    };
  });
}

// Загрузка модели MobileNet
async function loadModel() {
  const model = await mobilenet.load();
  console.log("Модель MobileNet загружена.");
  return model;
}

// Извлечение признаков эталонного изображения
async function extractReferenceFeatures(model) {
  const imageTensor = tf.browser.fromPixels(referenceImage).expandDims();
  const features = model.infer(imageTensor, true);
  console.log("Эталонные признаки извлечены.");
  tf.dispose(imageTensor); // Освобождаем память
  return features;
}

// Основной процесс сравнения
async function compareFrames(model) {
  const interval = 500; // Частота обработки в миллисекундах

  setInterval(async () => {
    try {
      const videoTensor = tf.browser.fromPixels(video).expandDims();
      const videoFeatures = model.infer(videoTensor, true);

      // Сравниваем признаки
      const similarity = tf.losses.cosineDistance(referenceFeatures, videoFeatures, 0).dataSync();
      const similarityValue = similarity[0]; // Извлекаем первое значение
      console.log("Сходство:", similarityValue);

      // Порог схожести
      const similarityThreshold = 0.2;

      if (similarityValue < similarityThreshold) {
        console.log("Картина распознана!");
        triggerEffect(); // Вызов эффекта при успешном распознавании
      } else {
        console.log("Картина не распознана.");
        resetEffect(); // Сбрасываем эффект
      }

      // Освобождаем память
      tf.dispose(videoTensor);
      tf.dispose(videoFeatures);
    } catch (err) {
      console.error("Ошибка при обработке видео:", err);
    }
  }, interval);
}

// Эффект при распознавании
function triggerEffect() {
  document.body.style.backgroundColor = "green";
  const effectElement = document.getElementById("effect");
  if (effectElement) {
    effectElement.style.opacity = 1; // Показываем эффект
  }
}

// Сброс эффекта
function resetEffect() {
  document.body.style.backgroundColor = "red";
  const effectElement = document.getElementById("effect");
  if (effectElement) {
    effectElement.style.opacity = 0; // Скрываем эффект
  }
}

// Основная функция
async function main() {
  await setupCamera();
  video.play();

  const model = await loadModel();
  referenceFeatures = await extractReferenceFeatures(model);

  compareFrames(model);
}

// Запуск
main();
