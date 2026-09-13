const supportedLanguages = ["pt", "en", "es", "de", "it", "fr", "ja", "ko", "zh"];

let motivationsPromise;

export function getMotivations() {
  if (!motivationsPromise) {
    globalThis.window ||= {};
    globalThis.window.WORKOUT_LOCALES ||= {};
    motivationsPromise = Promise.all([
      import("../../src/locales/pt.js"),
      import("../../src/locales/en.js"),
      import("../../src/locales/es.js"),
      import("../../src/locales/de.js"),
      import("../../src/locales/it.js"),
      import("../../src/locales/fr.js"),
      import("../../src/locales/ja.js"),
      import("../../src/locales/ko.js"),
      import("../../src/locales/zh.js")
    ]).then(() => Object.fromEntries(supportedLanguages.map((language) => [
      language,
      globalThis.window.WORKOUT_LOCALES[language].motivations.map(([message]) => message)
    ])));
  }
  return motivationsPromise;
}
