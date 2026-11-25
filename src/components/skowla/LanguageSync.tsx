import { useEffect } from "react";
import { useAppState } from "@/lib/store";

/** Only synchronize the document language; React renders all translated copy. */
export function LanguageSync() {
  const { settings } = useAppState();
  useEffect(() => {
    document.documentElement.lang = settings.language === "Bahasa Melayu" ? "ms" : "en";
  }, [settings.language]);
  return null;
}
