export type Language = {
  label: string;
  bcp47: string; // For SpeechRecognition and speechSynthesis
};

export const POPULAR_LANGUAGES: Language[] = [
  { label: "English (US)", bcp47: "en-US" },
  { label: "Français (France)", bcp47: "fr-FR" },
  { label: "Español (España)", bcp47: "es-ES" },
  { label: "Deutsch", bcp47: "de-DE" },
  { label: "Italiano", bcp47: "it-IT" },
  { label: "Português (Brasil)", bcp47: "pt-BR" },
  { label: "Português (Portugal)", bcp47: "pt-PT" },
  { label: "Русский", bcp47: "ru-RU" },
  { label: "中文（简体）", bcp47: "zh-CN" },
  { label: "中文（繁體）", bcp47: "zh-TW" },
  { label: "日本語", bcp47: "ja-JP" },
  { label: "한국어", bcp47: "ko-KR" },
  { label: "العربية", bcp47: "ar-SA" },
  { label: "हिन्दी", bcp47: "hi-IN" },
  { label: "Türkçe", bcp47: "tr-TR" },
  { label: "Nederlands", bcp47: "nl-NL" },
  { label: "Polski", bcp47: "pl-PL" },
  { label: "Svenska", bcp47: "sv-SE" },
  { label: "Norsk Bokmål", bcp47: "nb-NO" },
  { label: "Dansk", bcp47: "da-DK" },
  { label: "Suomi", bcp47: "fi-FI" },
  { label: "Ελληνικά", bcp47: "el-GR" },
  { label: "עברית", bcp47: "he-IL" },
  { label: "ไทย", bcp47: "th-TH" },
  { label: "Tiếng Việt", bcp47: "vi-VN" },
  { label: "Bahasa Indonesia", bcp47: "id-ID" },
  { label: "Română", bcp47: "ro-RO" },
  { label: "Čeština", bcp47: "cs-CZ" },
  { label: "Slovenčina", bcp47: "sk-SK" },
  { label: "Magyar", bcp47: "hu-HU" },
  { label: "Українська", bcp47: "uk-UA" },
];

export function toISO2(lang: string): string {
  if (!lang) return "en";
  const base = lang.split("-")[0].toLowerCase();
  // Special cases that MyMemory expects
  if (base === "nb") return "no"; // Norwegian Bokmål -> no
  return base;
}
