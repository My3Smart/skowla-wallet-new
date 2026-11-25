import { useLanguage } from "@/hooks/use-language";
import { localizeNode } from "@/lib/i18n";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bell, CheckCheck, FileText, Info, Star } from "lucide-react";
import { Card, Section } from "@/components/skowla/AppShell";
import { BackButton, IconButton, PageHeader } from "@/components/skowla/PageHeader";
import type { TeacherNotification } from "@/lib/data";
import { fmtDateTime } from "@/lib/format";
import { actions, useAppState } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/teacher/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Skowla" },
      { name: "description", content: "Report, complaint and system notifications for teachers." },
      { property: "og:title", content: "Notifications — Skowla" },
      { property: "og:description", content: "Teacher notifications." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Notifications,
});

const style: Record<TeacherNotification["kind"], { icon: typeof Bell; cls: string }> = {
  report: { icon: FileText, cls: "bg-primary-soft text-primary" },
  complaint: { icon: Bell, cls: "bg-warning-soft text-warning" },
  system: { icon: Info, cls: "bg-success-soft text-success" },
  welcome: { icon: Star, cls: "bg-primary-soft text-primary" },
};

function Notifications() {
  const { t: tr, locale } = useLanguage();
  const { notifications } = useAppState();
  const navigate = useNavigate();
  return (
    <>
      <PageHeader
        title={tr("Notifications")}
        left={<BackButton fallback="/teacher" />}
        right={
          <IconButton label={tr("Mark all as read")} onClick={() => actions.markAllNotifications()}>
            <CheckCheck className="size-5" />
          </IconButton>
        }
      />
      <Section className="md:mx-auto md:max-w-xl">
        <Card className="divide-y divide-border overflow-hidden">
          {localizeNode(
            notifications.map((n) => {
              const s = style[n.kind];
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    actions.markNotification(n.id);
                    if (n.kind === "report") void navigate({ to: "/teacher/students" });
                    if (n.kind === "complaint") void navigate({ to: "/teacher/complaints" });
                  }}
                  className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-muted"
                >
                  <span
                    className={cn("grid size-10 shrink-0 place-items-center rounded-full", s.cls)}
                  >
                    <s.icon className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={cn("truncate text-sm", n.read ? "font-medium" : "font-bold")}>
                      {localizeNode(n.title, tr)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {localizeNode(fmtDateTime(n.at), tr)}
                    </p>
                  </div>
                  {localizeNode(
                    !n.read && (
                      <span
                        className="size-2 shrink-0 rounded-full bg-primary"
                        aria-label={tr("Unread")}
                      />
                    ),
                    tr,
                  )}
                </button>
              );
            }),
            tr,
          )}
        </Card>
      </Section>
    </>
  );
}
