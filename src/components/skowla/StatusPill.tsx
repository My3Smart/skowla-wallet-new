import { useLanguage } from "@/hooks/use-language";
import { localizeNode } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const tones = {
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-destructive-soft text-destructive",
  info: "bg-primary-soft text-primary",
} as const;

export type Tone = keyof typeof tones;

export function StatusPill({
  tone,
  children,
  className,
}: {
  tone: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  const { t: tr, locale } = useLanguage();
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-md px-2 py-1 text-[11px] font-semibold leading-none whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      {localizeNode(children, tr)}
    </span>
  );
}

export function studentTone(status: string): Tone {
  if (status === "Needs Attention") return "warning";
  if (status === "Good") return "info";
  return "success";
}

export function complaintTone(status: string): Tone {
  if (status === "Resolved") return "success";
  if (status === "In Progress") return "warning";
  return "danger";
}
