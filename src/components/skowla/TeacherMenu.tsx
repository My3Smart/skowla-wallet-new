import { useLanguage } from "@/hooks/use-language";
import { localizeNode } from "@/lib/i18n";
import { LanguageToggle } from "@/components/skowla/LanguageToggle";
import { Link } from "@tanstack/react-router";
import {
  ClipboardList,
  FileBarChart,
  Home,
  LogOut,
  Menu,
  MessageSquareWarning,
  User,
} from "lucide-react";
import { useState } from "react";
import { Owl, Wordmark } from "@/components/skowla/Brand";
import { useLogout } from "@/components/skowla/AppShell";
import { IconButton } from "@/components/skowla/PageHeader";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const links = [
  { to: "/teacher", label: "Home", icon: Home },
  { to: "/teacher/students", label: "Student Report", icon: ClipboardList },
  { to: "/teacher/report", label: "Teacher Report", icon: FileBarChart },
  { to: "/teacher/complaints", label: "Teacher Complaint", icon: MessageSquareWarning },
  { to: "/teacher/profile", label: "Profile", icon: User },
] as const;

export function TeacherMenu() {
  const { t: tr, locale } = useLanguage();
  const [open, setOpen] = useState(false);
  const logout = useLogout();
  return (
    <>
      <IconButton label={tr("Open menu")} onClick={() => setOpen(true)} className="md:hidden">
        <Menu className="size-5" />
      </IconButton>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="border-b border-border p-5">
            <SheetTitle className="flex items-center gap-2">
              <Owl className="size-9" />
              <Wordmark className="text-2xl" />
            </SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-1 p-3">
            {localizeNode(
              links.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  activeOptions={{ exact: true }}
                  activeProps={{ className: "bg-primary-soft text-primary" }}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-muted"
                >
                  <l.icon className="size-[18px]" />
                  {localizeNode(l.label, tr)}
                </Link>
              )),
              tr,
            )}
            <div className="mt-2 rounded-xl bg-muted">
              <LanguageToggle />
            </div>
            <button
              type="button"
              onClick={logout}
              className="mt-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive-soft"
            >
              <LogOut className="size-[18px]" /> {tr("Log Out")}
            </button>
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}
