import { useLanguage } from "@/hooks/use-language";
import { localizeNode } from "@/lib/i18n";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { Bot, History, Home, School, UtensilsCrossed } from "lucide-react";
import { AppShell, type NavItem } from "@/components/skowla/AppShell";
import { getSession } from "@/lib/auth";
import { useParentProfile } from "@/hooks/use-parent-profile";
import { useAppState } from "@/lib/store";

export const Route = createFileRoute("/parent")({
  ssr: false,
  beforeLoad: () => {
    const s = getSession();
    if (!s || s.role !== "parent") throw redirect({ to: "/", replace: true });
  },
  component: ParentLayout,
});

const items: NavItem[] = [
  { label: "Home", to: "/parent", icon: Home, match: (p) => p === "/parent" || p === "/parent/" },
  {
    label: "Canteen",
    to: "/parent/canteen",
    icon: UtensilsCrossed,
    match: (p) => p.startsWith("/parent/canteen"),
  },
  {
    label: "Funds + Shop",
    to: "/parent/history",
    icon: History,
    match: (p) => p.startsWith("/parent/history"),
  },
  { label: "AI Chat", to: "/parent/chat", icon: Bot, match: (p) => p.startsWith("/parent/chat") },
  {
    label: "School",
    to: "/parent/school",
    icon: School,
    match: (p) => p.startsWith("/parent/school"),
  },
];

function ParentLayout() {
  const { t: tr, locale } = useLanguage();
  const me = useParentProfile();
  const { children } = useAppState();
  return (
    <AppShell
      items={items}
      user={{ name: me.name, subtitle: `Ibu bapa • ${children.length} anak`, ...(me.photo ? { photo: me.photo } : {}) }}
    >
      <Outlet />
    </AppShell>
  );
}
