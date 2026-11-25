import { useLanguage } from "@/hooks/use-language";
import { localizeNode } from "@/lib/i18n";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import {
  ClipboardList,
  Home,
  MessageSquareWarning,
  User,
} from "lucide-react";
import { AppShell, type NavItem } from "@/components/skowla/AppShell";
import { getSession } from "@/lib/auth";
import { IMG } from "@/lib/images";
import { useAppState } from "@/lib/store";

export const Route = createFileRoute("/teacher")({
  ssr: false,
  beforeLoad: () => {
    const s = getSession();
    if (!s || s.role !== "teacher") throw redirect({ to: "/", replace: true });
  },
  component: TeacherLayout,
});

const items: NavItem[] = [
  {
    label: "Home",
    to: "/teacher",
    icon: Home,
    match: (p) => p === "/teacher" || p === "/teacher/",
  },
  {
    label: "Report",
    to: "/teacher/report",
    icon: ClipboardList,
    match: (p) => p.startsWith("/teacher/report") || p.startsWith("/teacher/students"),
  },
  {
    label: "Complaint",
    to: "/teacher/complaints",
    icon: MessageSquareWarning,
    match: (p) => p.startsWith("/teacher/complaints"),
  },
  {
    label: "Profile",
    to: "/teacher/profile",
    icon: User,
    match: (p) => p.startsWith("/teacher/profile"),
  },
];

const extra: NavItem[] = [];

function TeacherLayout() {
  const { t: tr, locale } = useLanguage();
  const { teacherProfile } = useAppState();
  return (
    <AppShell
      items={items}
      extraItems={extra}
      user={{ name: teacherProfile.name, subtitle: "Teacher", photo: IMG.farid }}
    >
      <Outlet />
    </AppShell>
  );
}
