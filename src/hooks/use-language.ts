import { useAppState } from "@/lib/store";
import { translate } from "@/lib/i18n";

/** Subscribe during render so navigation and open dialogs use the same language. */
export function useLanguage() {
  const { settings } = useAppState();
  return {
    language: settings.language,
    locale: settings.language === "Bahasa Melayu" ? "ms-MY" : "en-MY",
    t: (text: string) => translate(text, settings.language),
  };
}
