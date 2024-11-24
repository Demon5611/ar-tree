function triggerEffect() {
    const effectElement = document.getElementById("effect-container");
    const fireworksContainer = document.getElementById("fireworks-container");
  
    // Показываем текст
    effectElement.style.opacity = 1;
  
    // Очищаем контейнер для фейерверков
    fireworksContainer.innerHTML = "";
  
    // Создаем частицы
    for (let i = 0; i < 50; i++) {
      const particle = document.createElement("div");
      particle.style.position = "absolute";
      particle.style.width = "8px";
      particle.style.height = "8px";
      particle.style.borderRadius = "50%";
      particle.style.background = `hsl(${Math.random() * 360}, 100%, 50%)`; // Случайный цвет
      particle.style.top = "50%";
      particle.style.left = "50%";
      fireworksContainer.appendChild(particle);
  
      // Анимация частиц
      const angle = Math.random() * 2 * Math.PI; // Направление
      const distance = Math.random() * 150 + 50; // Радиус разлета
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
  
      particle.animate(
        [
          { transform: "translate(0, 0)", opacity: 1 },
          { transform: `translate(${x}px, ${y}px)`, opacity: 0 },
        ],
        {
          duration: 1000,
          easing: "ease-out",
        }
      );
  
      // Удаляем частицы после завершения анимации
      setTimeout(() => {
        particle.remove();
      }, 1000);
    }
  }
  
  function resetEffect() {
    const effectElement = document.getElementById("effect-container");
    effectElement.style.opacity = 0;
  
    // Очищаем фейерверки
    const fireworksContainer = document.getElementById("fireworks-container");
    fireworksContainer.innerHTML = "";
  }
  