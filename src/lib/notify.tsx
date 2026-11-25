import { toast as sonner } from "sonner";
import { useLanguage } from "@/hooks/use-language";

function Message({ text }: { text: string }) {
  const { t } = useLanguage();
  return <>{t(text)}</>;
}

// Keep transient notices reactive too, including store validation errors.
export const toast = {
  success: (text: string) => sonner.success(<Message text={text} />),
  error: (text: string) => sonner.error(<Message text={text} />),
};
