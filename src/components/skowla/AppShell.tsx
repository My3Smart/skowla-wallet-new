import { useLanguage } from "@/hooks/use-language";
import { localizeNode } from "@/lib/i18n";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { LogOut, type LucideIcon } from "lucide-react";
import { Owl, Wordmark } from "@/components/skowla/Brand";
import { PersonAvatar } from "@/components/skowla/PersonAvatar";
import { endSession } from "@/lib/auth";
import { useAppState } from "@/lib/store";
import { cn } from "@/lib/utils";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  match: (path: string) => boolean;
}

export function useLogout() {
  const navigate = useNavigate();
  return () => {
    endSession();
    void navigate({ to: "/", replace: true });
  };
}

export function AppShell({
  items,
  extraItems = [],
  user,
  children,
}: {
  items: NavItem[];
  extraItems?: NavItem[];
  user: { name: string; subtitle: string; photo?: string };
  children: React.ReactNode;
}) {
  const { t: tr, locale } = useLanguage();
  const path = useRouterState({ select: (r) => r.location.pathname });
  const { settings } = useAppState();
  const logout = useLogout();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", settings.theme === "Dark");
    return () => root.classList.remove("dark");
  }, [settings.theme]);

  return (
    <div className="relative min-h-full w-full bg-background bg-gradient-sky">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar/90 px-4 py-6 backdrop-blur-md md:flex">
        <Link to="/" className="mb-8 flex items-center gap-2 px-2">
          <Owl className="size-11" />
          <Wordmark className="text-3xl" />
        </Link>
        <nav className="flex flex-1 flex-col gap-1">
          {localizeNode(
            [...items, ...extraItems].map((item) => {
              const active = item.match(path);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                    active
                      ? "bg-primary text-primary-foreground shadow-elevated"
                      : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                >
                  <item.icon className="size-[18px]" />
                  {localizeNode(item.label, tr)}
                </Link>
              );
            }),
            tr,
          )}
        </nav>
        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-muted p-3">
          <PersonAvatar name={user.name} photo={user.photo} className="size-10" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{localizeNode(user.name, tr)}</p>
            <p className="truncate text-xs text-muted-foreground">
              {localizeNode(user.subtitle, tr)}
            </p>
          </div>
          <button
            type="button"
            aria-label={tr("Log out")}
            onClick={logout}
            className="grid size-8 place-items-center rounded-full text-destructive hover:bg-destructive-soft"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </aside>

      <div className="md:pl-64">
        <main className="mx-auto w-full max-w-md pb-28 md:max-w-5xl md:pb-12">
          {localizeNode(children, tr)}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[430px] border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
        <ul className="mx-auto flex max-w-md items-stretch justify-around px-2">
          {localizeNode(
            items.map((item) => {
              const active = item.match(path);
              return (
                <li key={item.to} className="flex-1">
                  <Link
                    to={item.to}
                    className={cn(
                      "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                      active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <item.icon className={cn("size-5", active && "stroke-[2.4]")} />
                    <span className={cn(active && "font-bold")}>
                      {localizeNode(item.label, tr)}
                    </span>
                  </Link>
                </li>
              );
            }),
            tr,
          )}
        </ul>
      </nav>
    </div>
  );
}

export function Section({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const { t: tr, locale } = useLanguage();
  return <div className={cn("px-4 md:px-8", className)}>{localizeNode(children, tr)}</div>;
}

export function Card({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  const { t: tr, locale } = useLanguage();
  return (
    <div
      className={cn("rounded-2xl border border-border/70 bg-card shadow-card", className)}
      {...rest}
    >
      {localizeNode(children, tr)}
    </div>
  );
}
