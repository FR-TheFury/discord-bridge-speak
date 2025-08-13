import { useTranslation } from "react-i18next";
import { POPULAR_LANGUAGES, type Language } from "@/data/languages";

export function useTranslatedLanguages() {
  const { t } = useTranslation();

  const getTranslatedLanguageName = (language: Language): string => {
    // Try to get translated name from i18n
    const translationKey = `languages.${language.bcp47.replace('-', '_')}`;
    const translated = t(translationKey);
    
    // If translation exists and is not the key itself, use it
    if (translated !== translationKey) {
      return translated;
    }
    
    // Fallback to original label
    return language.label;
  };

  const translatedLanguages = POPULAR_LANGUAGES.map(lang => ({
    ...lang,
    translatedLabel: getTranslatedLanguageName(lang)
  }));

  return { 
    translatedLanguages,
    getTranslatedLanguageName 
  };
}