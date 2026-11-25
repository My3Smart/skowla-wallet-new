import { useLanguage } from "@/hooks/use-language";
import { localizeNode } from "@/lib/i18n";
import { useRouter } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function BackButton({ fallback }: { fallback: string }) {
  const { t: tr, locale } = useLanguage();
  const router = useRouter();
  return (
    <button
      type="button"
      aria-label={tr("Go back")}
      onClick={() => {
        if (window.history.length > 1) router.history.back();
        else void router.navigate({ to: fallback });
      }}
      className="grid size-9 shrink-0 place-items-center rounded-full text-foreground transition-colors hover:bg-muted"
    >
      <ChevronLeft className="size-5" />
    </button>
  );
}

export function PageHeader({
  title,
  left,
  right,
  className,
}: {
  title: React.ReactNode;
  left?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}) {
  const { t: tr, locale } = useLanguage();
  return (
    <header
      className={cn(
        "sticky top-0 z-30 grid grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] items-center gap-2 bg-background/85 px-4 py-3 backdrop-blur-md md:px-8",
        className,
      )}
    >
      <div className="flex justify-start">{localizeNode(left, tr)}</div>
      <h1 className="truncate text-center text-base font-bold text-foreground md:text-lg">
        {localizeNode(title, tr)}
      </h1>
      <div className="flex justify-end">{localizeNode(right, tr)}</div>
    </header>
  );
}

export function IconButton({
  label,
  onClick,
  children,
  className,
}: {
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  const { t: tr, locale } = useLanguage();
  return (
    <button
      type="button"
      aria-label={localizeNode(label, tr)}
      onClick={onClick}
      className={cn(
        "relative grid size-9 shrink-0 place-items-center rounded-full text-foreground transition-colors hover:bg-muted",
        className,
      )}
    >
      {localizeNode(children, tr)}
    </button>
  );
}
