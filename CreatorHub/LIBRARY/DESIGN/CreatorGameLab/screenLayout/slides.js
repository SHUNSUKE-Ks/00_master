const buttons = [...document.querySelectorAll("[data-slide]")];
const slides = [...document.querySelectorAll(".slide")];

function setSlide(index) {
  buttons.forEach((button, itemIndex) => button.classList.toggle("active", itemIndex === index));
  slides.forEach((slide, itemIndex) => slide.classList.toggle("active", itemIndex === index));
}

buttons.forEach((button, index) => {
  button.addEventListener("click", () => setSlide(index));
});

window.addEventListener("keydown", (event) => {
  const current = buttons.findIndex((button) => button.classList.contains("active"));
  if (event.key === "ArrowRight") setSlide(Math.min(current + 1, buttons.length - 1));
  if (event.key === "ArrowLeft") setSlide(Math.max(current - 1, 0));
});

