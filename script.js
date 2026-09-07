const localeData = window.WORKOUT_LOCALES;
const SITE_URL = "https://shouldiworkout.today";
const supportedLanguages = Object.keys(localeData);
const CONSENT_KEY = "workout-consent-v1";
const OPTIONAL_SERVICES_ENABLED = false;

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
const privacyButton = document.querySelector("#privacyButton");
const consentPanel = document.querySelector("#consentPanel");
const consentPreferences = document.querySelector("#consentPreferences");
const analyticsConsent = document.querySelector("#analyticsConsent");
const adsConsent = document.querySelector("#adsConsent");
const acceptConsent = document.querySelector("#acceptConsent");
const rejectConsent = document.querySelector("#rejectConsent");
const customizeConsent = document.querySelector("#customizeConsent");
const saveConsent = document.querySelector("#saveConsent");
const sharePanel = document.querySelector("#sharePanel");
const shareStoryButton = document.querySelector("#shareStoryButton");
const shareTransparentButton = document.querySelector("#shareTransparentButton");
const shareTextButton = document.querySelector("#shareTextButton");
const closeSharePanel = document.querySelector("#closeSharePanel");

let currentIndex = -1;
let soundOn = false;
const pathLanguage = window.location.protocol === "file:"
  ? null
  : window.location.pathname.split("/").filter(Boolean)[0];
const queryLanguage = new URLSearchParams(window.location.search).get("lang");
const browserLanguage = (navigator.languages || [navigator.language])
  .map((language) => language.toLowerCase().split("-")[0])
  .find((language) => supportedLanguages.includes(language));
let currentLanguage = supportedLanguages.includes(pathLanguage)
  ? pathLanguage
  : supportedLanguages.includes(queryLanguage)
    ? queryLanguage
    : localStorage.getItem("workout-language") || browserLanguage || "en";

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

function applyLanguage(language, updateUrl = false) {
  currentLanguage = localeData[language] ? language : "pt";
  const copy = localeData[currentLanguage];
  document.documentElement.lang = copy.lang;
  document.title = copy.seoTitle;
  document.querySelector('meta[name="description"]').content = copy.seoDescription;
  document.querySelector("#ogTitle").content = copy.seoTitle;
  document.querySelector("#ogDescription").content = copy.seoDescription;
  document.querySelector("#twitterTitle").content = copy.seoTitle;
  document.querySelector("#twitterDescription").content = copy.seoDescription;
  const canonicalUrl = `${SITE_URL}/${currentLanguage}`;
  document.querySelector("#canonicalLink").href = canonicalUrl;
  document.querySelector("#ogUrl").content = canonicalUrl;
  document.querySelector("#answer").textContent = copy.yes;
  document.querySelector("#eyebrowText").textContent = copy.eyebrow;
  document.querySelector("#nextText").textContent = copy.next;
  document.querySelector("#instructionText").textContent = copy.instruction;
  document.querySelector("#spaceText").textContent = copy.space;
  document.querySelector("#shareText").textContent = copy.share;
  document.querySelector("#soundText").textContent = copy.sound;
  privacyButton.textContent = copy.privacy;
  document.querySelector("#consentTitle").textContent = copy.consentTitle;
  document.querySelector("#consentText").textContent = copy.consentText;
  document.querySelector("#acceptConsent").textContent = copy.acceptAll;
  document.querySelector("#rejectConsent").textContent = copy.rejectAll;
  document.querySelector("#customizeConsent").textContent = copy.customize;
  document.querySelector("#saveConsent").textContent = copy.saveChoices;
  document.querySelector("#analyticsLabel").textContent = copy.analyticsLabel;
  document.querySelector("#adsLabel").textContent = copy.adsLabel;
  document.querySelector("#privacyPolicyLink").textContent = copy.policyLabel;
  document.querySelector("#necessaryLabel").textContent = copy.necessaryLabel;
  document.querySelector("#necessaryDescription").textContent = copy.necessaryDescription;
  document.querySelector("#analyticsDescription").textContent = copy.analyticsDescription;
  document.querySelector("#adsDescription").textContent = copy.adsDescription;
  document.querySelector("#sharePanelTitle").textContent = copy.sharePanelTitle;
  shareStoryButton.querySelector("strong").textContent = copy.storyOption;
  shareStoryButton.querySelector("small").textContent = copy.storyDescription;
  shareTransparentButton.querySelector("strong").textContent = copy.transparentOption;
  shareTransparentButton.querySelector("small").textContent = copy.transparentDescription;
  shareTextButton.querySelector("strong").textContent = copy.textOption;
  shareTextButton.querySelector("small").textContent = copy.textDescription;
  const brandLink = document.querySelector(".brand");
  brandLink.href = window.location.protocol === "file:" ? "#" : `/${currentLanguage}`;
  document.querySelector("#privacyPolicyLink").href = window.location.protocol === "file:" ? "privacy.html" : "/privacy";
  languageSelect.value = currentLanguage;
  localStorage.setItem("workout-language", currentLanguage);
  if (updateUrl) {
    if (window.location.protocol === "file:") {
      const localUrl = new URL(window.location.href);
      localUrl.searchParams.set("lang", currentLanguage);
      history.pushState({ language: currentLanguage }, "", localUrl);
    } else {
      history.pushState({ language: currentLanguage }, "", `/${currentLanguage}`);
    }
  }
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

function readConsent() {
  try {
    return JSON.parse(localStorage.getItem(CONSENT_KEY));
  } catch {
    return null;
  }
}

function activateConsentScripts(category) {
  document.querySelectorAll(`script[type="text/plain"][data-consent="${category}"]`).forEach((placeholder) => {
    if (placeholder.dataset.loaded === "true") return;
    const script = document.createElement("script");
    [...placeholder.attributes].forEach(({ name, value }) => {
      if (!["type", "data-consent", "data-loaded"].includes(name)) script.setAttribute(name, value);
    });
    if (!placeholder.src) script.textContent = placeholder.textContent;
    placeholder.dataset.loaded = "true";
    placeholder.after(script);
  });
}

function applyConsent(consent) {
  const state = {
    analytics_storage: consent.analytics ? "granted" : "denied",
    ad_storage: consent.ads ? "granted" : "denied",
    ad_user_data: consent.ads ? "granted" : "denied",
    ad_personalization: consent.ads ? "granted" : "denied"
  };
  if (typeof window.gtag === "function") window.gtag("consent", "update", state);
  if (consent.analytics) activateConsentScripts("analytics");
  if (consent.ads) activateConsentScripts("ads");
  window.dispatchEvent(new CustomEvent("workout:consent", { detail: consent }));
}

function saveConsentChoice(analytics, ads) {
  const consent = { necessary: true, analytics, ads, updatedAt: new Date().toISOString() };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
  applyConsent(consent);
  consentPanel.hidden = true;
}

function openConsentPanel(showPreferences = false) {
  sharePanel.hidden = true;
  const saved = readConsent();
  analyticsConsent.checked = Boolean(saved?.analytics);
  adsConsent.checked = Boolean(saved?.ads);
  consentPreferences.hidden = !showPreferences;
  acceptConsent.hidden = showPreferences;
  rejectConsent.hidden = showPreferences;
  customizeConsent.hidden = showPreferences;
  saveConsent.hidden = !showPreferences;
  consentPanel.hidden = false;
}

function wrapCanvasText(context, text, maxWidth) {
  const usesSpaces = text.includes(" ");
  const words = usesSpaces ? text.split(" ") : Array.from(text);
  const lines = [];
  let line = "";
  words.forEach((word) => {
    const testLine = line ? `${line}${usesSpaces ? " " : ""}${word}` : word;
    if (context.measureText(testLine).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = testLine;
  });
  if (line) lines.push(line);
  return lines;
}

async function createStoryImage(transparent = false) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const context = canvas.getContext("2d");
  const isDark = document.body.classList.contains("dark");
  const background = isDark ? "#0c0d0b" : "#f1efe8";
  // A transparent export removes only the card background. Keep every
  // foreground color identical to the selected site theme.
  const foreground = isDark ? "#f0eee7" : "#11110f";
  const muted = isDark ? "#999a92" : "#77766f";

  if (!transparent) {
    context.fillStyle = background;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  function drawText(text, x, y, outlineWidth = 5) {
    if (transparent) {
      context.strokeStyle = "rgba(0, 0, 0, .9)";
      context.lineWidth = outlineWidth;
      context.lineJoin = "round";
      context.strokeText(text, x, y);
    }
    context.fillText(text, x, y);
  }

  context.fillStyle = "#eaff38";
  context.fillRect(72, 70, 70, 12);

  context.fillStyle = foreground;
  context.font = "900 28px Arial, sans-serif";
  context.letterSpacing = "2px";
  const logo = new Image();
  logo.src = document.querySelector('link[rel="icon"]').href;
  try { await logo.decode(); context.drawImage(logo, 72, 70, 64, 64); } catch { /* Brand text remains as fallback. */ }
  drawText("SHOULD I WORK OUT TODAY?", 158, 116, 4);

  context.fillStyle = muted;
  context.font = "800 24px Arial, sans-serif";
  drawText(localeData[currentLanguage].eyebrow.toUpperCase(), 72, 285, 4);
  context.fillRect(72, 320, 936, 2);

  context.fillStyle = foreground;
  context.font = "900 500px Impact, Arial Black, sans-serif";
  drawText(localeData[currentLanguage].yes, 55, 800, 14);

  context.font = "900 76px Arial, sans-serif";
  const lines = wrapCanvasText(context, message.textContent, 930);
  lines.slice(0, 6).forEach((line, index) => drawText(line, 72, 1030 + index * 88, 7));

  const sourceY = Math.min(1640, 1080 + lines.slice(0, 6).length * 88);
  context.fillStyle = muted;
  context.font = "700 26px Arial, sans-serif";
  drawText(source.textContent.toUpperCase(), 72, sourceY, 4);

  context.fillStyle = foreground;
  context.fillRect(72, 1705, 936, 2);
  context.font = "900 34px Arial, sans-serif";
  drawText("SHOULDIWORKOUT.TODAY", 72, 1780, 5);
  context.font = "800 27px Arial, sans-serif";
  drawText("INSTAGRAM  ·  @SHOULDIWORKOUT.TODAY", 72, 1835, 5);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Image generation failed")), "image/png");
  });
}

function downloadStoryImage(blob, transparent = false) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = transparent ? "should-i-work-out-today-transparent.png" : "should-i-work-out-today-story.png";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

async function shareImage(transparent = false) {
  const text = `Should I Work Out Today? ${localeData[currentLanguage].yes} ${message.textContent}`;
  const blob = await createStoryImage(transparent);
  const filename = transparent ? "should-i-work-out-today-transparent.png" : "should-i-work-out-today-story.png";
  const file = new File([blob], filename, { type: "image/png" });
  const shareData = { title: "Should I Work Out Today?", text, files: [file] };
  if (navigator.share && navigator.canShare?.(shareData)) await navigator.share(shareData);
  else {
    downloadStoryImage(blob, transparent);
    showToast(localeData[currentLanguage].downloaded);
  }
}

async function shareTextOnly() {
  const canonicalUrl = `${SITE_URL}/${currentLanguage}`;
  const text = `Should I Work Out Today? ${localeData[currentLanguage].yes} ${message.textContent}`;
  if (navigator.share) return navigator.share({ title: "Should I Work Out Today?", text, url: canonicalUrl });
  const completeText = `${text} — ${canonicalUrl}`;
  try {
    await navigator.clipboard.writeText(completeText);
  } catch {
    const field = document.createElement("textarea");
    field.value = completeText;
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    document.execCommand("copy");
    field.remove();
  }
  showToast(localeData[currentLanguage].copied);
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

shareButton.addEventListener("click", () => {
  consentPanel.hidden = true;
  sharePanel.hidden = false;
});
closeSharePanel.addEventListener("click", () => { sharePanel.hidden = true; });
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    sharePanel.hidden = true;
    consentPanel.hidden = true;
  }
});
shareStoryButton.addEventListener("click", async () => {
  sharePanel.hidden = true;
  try { await shareImage(false); } catch (error) {
    if (error.name !== "AbortError") showToast(localeData[currentLanguage].error);
  }
});
shareTransparentButton.addEventListener("click", async () => {
  sharePanel.hidden = true;
  try { await shareImage(true); } catch (error) {
    if (error.name !== "AbortError") showToast(localeData[currentLanguage].error);
  }
});
shareTextButton.addEventListener("click", async () => {
  sharePanel.hidden = true;
  try { await shareTextOnly(); } catch (error) {
    if (error.name !== "AbortError") showToast(localeData[currentLanguage].error);
  }
});

lightThemeButton.addEventListener("click", () => setTheme("light"));
darkThemeButton.addEventListener("click", () => setTheme("dark"));
privacyButton.addEventListener("click", () => openConsentPanel(true));
acceptConsent.addEventListener("click", () => saveConsentChoice(true, true));
rejectConsent.addEventListener("click", () => saveConsentChoice(false, false));
customizeConsent.addEventListener("click", () => openConsentPanel(true));
saveConsent.addEventListener("click", () => saveConsentChoice(analyticsConsent.checked, adsConsent.checked));

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

const savedConsent = readConsent();
if (savedConsent) applyConsent(savedConsent);
else if (OPTIONAL_SERVICES_ENABLED) openConsentPanel();

languageSelect.addEventListener("change", (event) => applyLanguage(event.target.value, true));
window.addEventListener("popstate", () => {
  const language = window.location.protocol === "file:"
    ? new URLSearchParams(window.location.search).get("lang")
    : window.location.pathname.split("/").filter(Boolean)[0];
  applyLanguage(language || "pt");
});
applyLanguage(currentLanguage);
