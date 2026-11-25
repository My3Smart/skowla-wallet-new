import { useLanguage } from "@/hooks/use-language";
import { localizeNode } from "@/lib/i18n";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bell,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  FileBarChart,
  MessageSquareWarning,
  Users,
  UserRound,
  LoaderCircle,
} from "lucide-react";
import { Card, Section } from "@/components/skowla/AppShell";
import { Wordmark } from "@/components/skowla/Brand";
import { CaseReport } from "@/components/skowla/CaseReport";
import { PersonAvatar } from "@/components/skowla/PersonAvatar";
import { StatusPill, complaintTone } from "@/components/skowla/StatusPill";
import { TeacherMenu } from "@/components/skowla/TeacherMenu";
import { fmtDate } from "@/lib/format";
import { IMG } from "@/lib/images";
import { caseSummary, useAppState } from "@/lib/store";

export const Route = createFileRoute("/teacher/")({
  head: () => ({
    meta: [
      { title: "Teacher Home — Skowla" },
      {
        name: "description",
        content:
          "Live case totals, parent reports, teacher complaints and school activity in Skowla.",
      },
      { property: "og:title", content: "Teacher Home — Skowla" },
      {
        property: "og:description",
        content: "Pending, in-progress and solved cases with summaries of all teacher pages.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

function greeting() {
  const h = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kuala_Lumpur",
      hour: "numeric",
      hourCycle: "h23",
    }).format(new Date()),
  );
  return h < 12 ? "Good Morning" : h < 18 ? "Good Afternoon" : "Good Evening";
}

function Dashboard() {
  const { t: tr, locale } = useLanguage();
  const { notifications, complaints, teacherProfile, students, settings } = useAppState();
  const unread = notifications.filter((n) => !n.read).length;
  const summary = caseSummary(complaints);
  const open = complaints.filter((c) => c.status !== "Resolved").slice(0, 3);
  const firstName = teacherProfile.name.split(" bin ")[0] ?? teacherProfile.name;
  const parentReports = complaints.filter((c) => c.source === "parent");
  const teacherComplaints = complaints.filter((c) => c.source === "teacher");
  const classes = new Set(students.map((s) => s.className)).size;
  const attention = students.filter((s) => s.status === "Needs Attention").length;
  const pages = [
    {
      to: "/teacher/students",
      label: "Student Reports",
      detail: `${attention} needing attention · ${students.length} reports`,
      icon: ClipboardList,
      tone: "bg-primary-soft text-primary",
    },
    {
      to: "/teacher/complaints",
      label: "Teacher Complaints",
      detail: `${teacherComplaints.length} complaints · ${teacherComplaints.filter((c) => c.status !== "Resolved").length} open`,
      icon: MessageSquareWarning,
      tone: "bg-warning-soft text-warning",
    },
    {
      to: "/teacher/report",
      label: "Parent Reports & Cases",
      detail: `${parentReports.length} parent reports · view case report`,
      icon: FileBarChart,
      tone: "bg-primary-soft text-primary",
    },
    {
      to: "/teacher/profile",
      label: "Teacher Profile",
      detail: teacherProfile.email,
      icon: UserRound,
      tone: "bg-primary-soft text-primary",
    },
  ] as const;
  const stats = [
    {
      label: "Pending Cases",
      value: summary.pending,
      icon: Clock,
      tone: "bg-warning-soft text-warning",
    },
    {
      label: "Solved Cases",
      value: summary.solved,
      icon: CheckCircle2,
      tone: "bg-success-soft text-success",
    },
    {
      label: "In Progress",
      value: summary.inProgress,
      icon: LoaderCircle,
      tone: "bg-primary-soft text-primary",
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center gap-2 bg-background/85 px-4 py-3 backdrop-blur-md">
        <TeacherMenu />
        <Wordmark className="text-2xl" />
        <div className="ml-auto flex items-center gap-2">
          <Link
            to="/teacher/notifications"
            aria-label={tr("Notifications")}
            className="relative grid size-9 place-items-center rounded-full hover:bg-muted"
          >
            <Bell className="size-5" />
            {localizeNode(
              unread > 0 && (
                <span className="absolute top-1.5 right-2 size-2 rounded-full bg-destructive ring-2 ring-background" />
              ),
              tr,
            )}
          </Link>
          <Link to="/teacher/profile" aria-label={tr("Profile")}>
            <PersonAvatar name={teacherProfile.name} photo={IMG.farid} className="size-9" />
          </Link>
        </div>
      </header>
      <Section className="space-y-5 pt-2">
        <div>
          <h2 className="text-xl leading-snug font-semibold">
            {localizeNode(greeting(), tr)}
            {tr(",")}
            <br />
            <span className="font-extrabold">
              {localizeNode(firstName, tr)}
              {tr("!")}
            </span>
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{tr("Your school at a glance")}</p>
        </div>
        <Link
          to="/teacher/report"
          className="flex items-center gap-4 rounded-2xl bg-gradient-primary p-5 text-primary-foreground shadow-elevated"
        >
          <FileBarChart className="size-11 shrink-0" strokeWidth={1.8} />
          <div className="flex-1">
            <p className="text-sm font-semibold opacity-90">{tr("Total Report Cases")}</p>
            <p className="mt-1 text-4xl font-extrabold">{localizeNode(summary.total, tr)}</p>
            <p className="mt-1 text-xs opacity-90">{tr("Since 2027")}</p>
          </div>
          <ChevronRight className="size-5 shrink-0" />
        </Link>
        <div className="grid grid-cols-3 gap-2">
          {localizeNode(
            stats.map((stat) => (
              <Link key={stat.label} to="/teacher/report">
                <Card className="flex min-h-28 flex-col items-center justify-center gap-1 px-1 py-3 text-center">
                  <span className={`grid size-8 place-items-center rounded-lg ${stat.tone}`}>
                    <stat.icon className="size-4" />
                  </span>
                  <span className="text-xl font-extrabold">{localizeNode(stat.value, tr)}</span>
                  <span className="text-[10px] font-semibold text-muted-foreground">
                    {localizeNode(stat.label, tr)}
                  </span>
                </Card>
              </Link>
            )),
            tr,
          )}
        </div>
        <CaseReport />
        <div>
          <h3 className="mb-3 text-base font-bold">{tr("Page Summary")}</h3>
          <div className="space-y-2">
            {localizeNode(
              pages.map((page) => (
                <Link key={page.to} to={page.to} className="block">
                  <Card className="flex items-center gap-3 p-3 hover:bg-muted/50">
                    <span
                      className={`grid size-10 shrink-0 place-items-center rounded-xl ${page.tone}`}
                    >
                      <page.icon className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold">{localizeNode(page.label, tr)}</p>
                      <p className="mt-0.5 break-words text-xs text-muted-foreground">
                        {localizeNode(page.detail, tr)}
                      </p>
                    </div>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </Card>
                </Link>
              )),
              tr,
            )}
          </div>
        </div>
        <div>
          <h3 className="mb-3 text-base font-bold">{tr("Cases Needing Action")}</h3>
          <div className="space-y-2">
            {localizeNode(
              open.length === 0 ? (
                <p className="py-4 text-sm text-muted-foreground">
                  {tr("All cases have been solved.")}
                </p>
              ) : (
                open.map((c) => (
                  <Link
                    key={c.id}
                    to="/teacher/complaints/$complaintId"
                    params={{ complaintId: c.id }}
                    className="block"
                  >
                    <Card className="flex items-center gap-3 p-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-warning-soft text-warning">
                        <Users className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {localizeNode(c.student, tr)}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {localizeNode(c.issue, tr)} {tr("· ")}
                          {localizeNode(fmtDate(c.createdAt), tr)}
                        </p>
                        <p className="mt-0.5 text-[10px] text-primary">
                          {localizeNode(
                            c.source === "parent" ? "Parent report" : "Teacher complaint",
                            tr,
                          )}
                        </p>
                      </div>
                      <StatusPill tone={complaintTone(c.status)}>
                        {localizeNode(c.status, tr)}
                      </StatusPill>
                    </Card>
                  </Link>
                ))
              ),
              tr,
            )}
          </div>
        </div>
      </Section>
    </>
  );
}
