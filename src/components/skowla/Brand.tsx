import { useLanguage } from "@/hooks/use-language";
import { localizeNode } from "@/lib/i18n";
import { GraduationCap } from "lucide-react";
import { IMG } from "@/lib/images";
import { cn } from "@/lib/utils";

export function Owl({
  className,
  alt = "Skowla owl mascot",
}: {
  className?: string;
  alt?: string;
}) {
  const { t: tr, locale } = useLanguage();
  return (
    <img
      src={IMG.owl}
      alt={localizeNode(alt, tr)}
      className={cn("object-contain select-none", className)}
      draggable={false}
    />
  );
}

export function Wordmark({ className }: { className?: string }) {
  const { t: tr, locale } = useLanguage();
  return (
    <span className={cn("font-display font-extrabold tracking-tight text-primary", className)}>
      {tr("Skowla")}
    </span>
  );
}

export function CapLogo({ className }: { className?: string }) {
  const { t: tr, locale } = useLanguage();
  return (
    <span
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-elevated",
        className,
      )}
    >
      <GraduationCap className="size-[18px]" strokeWidth={2.4} />
    </span>
  );
}
