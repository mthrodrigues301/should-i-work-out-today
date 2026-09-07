const localeData = window.WORKOUT_LOCALES;

const answerWrap = document.querySelector(".answer-wrap");
const message = document.querySelector("#message");
const source = document.querySelector("#source");
const nextButton = document.querySelector("#nextButton");
const shareButton = document.querySelector("#shareButton");
const lightThemeButton = document.querySelector("#lightThemeButton");
const darkThemeButton = document.querySelector("#darkThemeButton");
const soundToggle = document.querySelector("#soundToggle");
const soundLabel = document.querySelector("#soundLabel");
const toast = document.querySelector("#toast");
const languageSelect = document.querySelector("#languageSelect");

let currentIndex = -1;
let soundOn = false;
let currentLanguage = localStorage.getItem("workout-language") || "pt";

function playClick() {
  if (!soundOn) return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const context = new AudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.frequency.setValueAtTime(90, context.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(48, context.currentTime + .08);
  gain.gain.setValueAtTime(.12, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + .09);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + .1);
}

function nextMotivation() {
  const motivations = localeData[currentLanguage].motivations;
  let next;
  do next = Math.floor(Math.random() * motivations.length);
  while (next === currentIndex && motivations.length > 1);
  currentIndex = next;
  const [text, attribution] = motivations[currentIndex];
  message.textContent = text;
  source.textContent = `— ${attribution}`;
  answerWrap.classList.remove("switching");
  void answerWrap.offsetWidth;
  answerWrap.classList.add("switching");
  playClick();
}

function applyLanguage(language) {
  currentLanguage = localeData[language] ? language : "pt";
  const copy = localeData[currentLanguage];
  document.documentElement.lang = copy.lang;
  document.querySelector("#answer").textContent = copy.yes;
  document.querySelector("#eyebrowText").textContent = copy.eyebrow;
  document.querySelector("#nextText").textContent = copy.next;
  document.querySelector("#instructionText").textContent = copy.instruction;
  document.querySelector("#spaceText").textContent = copy.space;
  document.querySelector("#shareText").textContent = copy.share;
  document.querySelector("#soundText").textContent = copy.sound;
  languageSelect.value = currentLanguage;
  localStorage.setItem("workout-language", currentLanguage);
  updateThemeButtons();
  currentIndex = -1;
  nextMotivation();
}

function updateThemeButtons() {
  const dark = document.body.classList.contains("dark");
  lightThemeButton.setAttribute("aria-pressed", String(!dark));
  darkThemeButton.setAttribute("aria-pressed", String(dark));
}

function setTheme(theme) {
  const dark = theme === "dark";
  document.body.classList.toggle("dark", dark);
  localStorage.setItem("workout-theme", dark ? "dark" : "light");
  updateThemeButtons();
}

function showToast(text) {
  toast.textContent = text;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 1800);
}

function wrapCanvasText(context, text, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  words.forEach((word) => {
    const testLine = line ? `${line} ${word}` : word;
    if (context.measureText(testLine).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = testLine;
  });
  if (line) lines.push(line);
  return lines;
}

async function createStoryImage() {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const context = canvas.getContext("2d");
  const isDark = document.body.classList.contains("dark");
  const background = isDark ? "#0c0d0b" : "#f1efe8";
  const foreground = isDark ? "#f0eee7" : "#11110f";
  const muted = isDark ? "#999a92" : "#77766f";

  context.fillStyle = background;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#eaff38";
  context.fillRect(72, 70, 70, 12);

  context.fillStyle = foreground;
  context.font = "900 28px Arial, sans-serif";
  context.letterSpacing = "2px";
  context.fillText("SHOULD I WORK OUT TODAY?", 72, 135);

  context.fillStyle = muted;
  context.font = "800 24px Arial, sans-serif";
  context.fillText(localeData[currentLanguage].eyebrow.toUpperCase(), 72, 285);
  context.fillRect(72, 320, 936, 2);

  context.fillStyle = foreground;
  context.font = "900 500px Impact, Arial Black, sans-serif";
  context.fillText(localeData[currentLanguage].yes, 55, 800);

  context.font = "900 76px Arial, sans-serif";
  const lines = wrapCanvasText(context, message.textContent, 930);
  lines.slice(0, 6).forEach((line, index) => context.fillText(line, 72, 1030 + index * 88));

  const sourceY = Math.min(1640, 1080 + lines.slice(0, 6).length * 88);
  context.fillStyle = muted;
  context.font = "700 26px Arial, sans-serif";
  context.fillText(source.textContent.toUpperCase(), 72, sourceY);

  context.fillStyle = foreground;
  context.fillRect(72, 1765, 936, 2);
  context.font = "800 24px Arial, sans-serif";
  context.fillText(`SHOULD I WORK OUT TODAY?  →  ${localeData[currentLanguage].yes}`, 72, 1825);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Image generation failed")), "image/png");
  });
}

function downloadStoryImage(blob) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "should-i-work-out-today-story.png";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

nextButton.addEventListener("click", nextMotivation);
document.querySelector("#hero").addEventListener("click", (event) => {
  if (!event.target.closest("button")) nextMotivation();
});
document.addEventListener("keydown", (event) => {
  if (event.code === "Space" && !event.repeat) {
    event.preventDefault();
    nextMotivation();
  }
});

shareButton.addEventListener("click", async () => {
  const text = `Should I Work Out Today? ${localeData[currentLanguage].yes} ${message.textContent}`;
  try {
    const blob = await createStoryImage();
    const file = new File([blob], "should-i-work-out-today-story.png", { type: "image/png" });
    const shareData = { title: "Should I Work Out Today?", text, files: [file] };
    if (navigator.share && navigator.canShare?.(shareData)) {
      await navigator.share(shareData);
      return;
    }
    downloadStoryImage(blob);
    showToast(localeData[currentLanguage].downloaded);
  } catch (error) {
    if (error.name !== "AbortError") showToast(localeData[currentLanguage].error);
  }
});

lightThemeButton.addEventListener("click", () => setTheme("light"));
darkThemeButton.addEventListener("click", () => setTheme("dark"));

soundToggle.addEventListener("click", () => {
  soundOn = !soundOn;
  soundToggle.setAttribute("aria-pressed", String(soundOn));
  soundLabel.textContent = soundOn ? "ON" : "OFF";
  playClick();
});

if (localStorage.getItem("workout-theme") === "dark") {
  document.body.classList.add("dark");
}
updateThemeButtons();

languageSelect.addEventListener("change", (event) => applyLanguage(event.target.value));
applyLanguage(currentLanguage);
