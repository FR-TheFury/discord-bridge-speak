import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import fr from "./locales/fr/common.json";
import en from "./locales/en/common.json";

const STORAGE_KEY = "ui_lang";
const saved = (() => {
  try { return localStorage.getItem(STORAGE_KEY) || "fr"; } catch { return "fr"; }
})();

void i18n
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
    },
    lng: saved,
    fallbackLng: "en",
    interpolation: { escapeValue: false },
  });

export function setUiLanguage(lang: string) {
  i18n.changeLanguage(lang);
  try { localStorage.setItem(STORAGE_KEY, lang); } catch {}
}

export default i18n;
