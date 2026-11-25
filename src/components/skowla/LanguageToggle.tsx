import { Languages } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/hooks/use-language";
import { actions } from "@/lib/store";

export function LanguageToggle() {
  const { language, t } = useLanguage();
  return (
    <label className="flex items-center gap-3 px-3 py-3 text-sm font-semibold">
      <Languages className="size-4 shrink-0" />
      <span className="min-w-0 flex-1">{t("Language")}</span>
      <span className="text-xs">EN</span>
      <Switch
        aria-label={t("Use Bahasa Melayu")}
        checked={language === "Bahasa Melayu"}
        onCheckedChange={(checked) =>
          actions.updateSettings({ language: checked ? "Bahasa Melayu" : "English" })
        }
      />
      <span className="text-xs">BM</span>
    </label>
  );
}
