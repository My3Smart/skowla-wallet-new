import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

export function PersonAvatar({
  name,
  photo,
  className,
}: {
  name: string;
  photo?: string | undefined;
  className?: string;
}) {
  return photo ? (
    <img
      src={photo}
      alt={name}
      loading="lazy"
      className={cn("size-10 shrink-0 rounded-full object-cover ring-2 ring-card", className)}
    />
  ) : (
    <span
      aria-label={name}
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-full bg-primary-soft text-sm font-bold text-primary ring-2 ring-card",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
