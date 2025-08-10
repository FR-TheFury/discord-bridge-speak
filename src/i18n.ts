import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import fr from "./locales/fr/common.json";
import en from "./locales/en/common.json";
import es from "./locales/es/common.json";
import de from "./locales/de/common.json";
import it from "./locales/it/common.json";
import pt from "./locales/pt/common.json";
import ru from "./locales/ru/common.json";
import zh from "./locales/zh/common.json";
import ja from "./locales/ja/common.json";
import ar from "./locales/ar/common.json";
import tr from "./locales/tr/common.json";

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
      es: { translation: es },
      de: { translation: de },
      it: { translation: it },
      pt: { translation: pt },
      ru: { translation: ru },
      zh: { translation: zh },
      ja: { translation: ja },
      ar: { translation: ar },
      tr: { translation: tr },
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
