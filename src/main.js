import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const video = document.getElementById("videoInput");
const canvas = document.getElementById("threeCanvas");
const referenceImage = document.getElementById("referenceImage");
let scene, camera, renderer, planeModel;
let referenceFeatures;

// Лог начала работы
console.log("Начало работы программы.");

// Настройка камеры
async function setupCamera() {
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

// Инициализация Three.js сцены
function initThree() {
  console.log("Инициализация сцены Three.js...");
  scene = new THREE.Scene();

  // Камера
  camera = new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 1000);
  camera.position.z = 5;

  // Рендерер
  renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
  renderer.setSize(canvas.width, canvas.height);

  // Свет
  const ambientLight = new THREE.AmbientLight(0xffffff, 1);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);

  // Загрузка модели самолета
  const loader = new GLTFLoader();
  loader.load(
    '/airplane.glb', // Убедитесь, что модель доступна по этому пути
    (gltf) => {
      planeModel = gltf.scene;
      planeModel.scale.set(0.5, 0.5, 0.5);
      planeModel.position.set(0, 0, 0);
      planeModel.visible = false;
      scene.add(planeModel);
      console.log("3D модель самолета успешно загружена.");
      renderer.render(scene, camera);
    },
    undefined,
    (error) => {
      console.error("Ошибка при загрузке модели:", error);
    }
  );
}

// Анимация модели
let isAnimating = false;

function animatePlane() {
  if (!planeModel || isAnimating) return;

  planeModel.visible = true;
  isAnimating = true;

  function animate() {
    if (!planeModel.visible) {
      isAnimating = false;
      return;
    }

    planeModel.position.y += 0.01;
    planeModel.rotation.y += 0.05;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();
}

// Загрузка модели TensorFlow.js
async function loadModel() {
  console.log("Загрузка модели TensorFlow.js...");
  const model = await mobilenet.load();
  console.log("Модель TensorFlow.js загружена.");
  return model;
}

// Сравнение текущего кадра с эталоном
async function extractReferenceFeatures(model) {
  console.log("Извлечение эталонных признаков из изображения...");
  const imageTensor = tf.browser.fromPixels(referenceImage).expandDims();
  const features = model.infer(imageTensor, true);
  console.log("Эталонные признаки извлечены.");
  tf.dispose(imageTensor);
  return features;
}

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
        animatePlane();
      } else {
        console.log("Картина не распознана.");
        if (planeModel) planeModel.visible = false;
      }

      tf.dispose(videoTensor);
      tf.dispose(videoFeatures);
    } catch (err) {
      console.error("Ошибка при обработке кадра:", err);
    }
  }, interval);
}

// Основная функция
async function main() {
  console.log("Запуск основной программы...");
  await setupCamera();
  initThree();
  const model = await loadModel();
  referenceFeatures = await extractReferenceFeatures(model);

  console.log("Готов к сравнению.");
  compareFrames(model);
}

main();
