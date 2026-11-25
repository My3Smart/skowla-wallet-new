import { useLanguage } from "@/hooks/use-language";
import { localizeNode } from "@/lib/i18n";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Phone, ThumbsDown, ThumbsUp, UserRound } from "lucide-react";
import { useState } from "react";
import { Card, Section } from "@/components/skowla/AppShell";
import { BackButton, PageHeader } from "@/components/skowla/PageHeader";
import { PersonAvatar } from "@/components/skowla/PersonAvatar";
import { StatusPill, studentTone } from "@/components/skowla/StatusPill";
import { Progress } from "@/components/ui/progress";
import { useAppState } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/teacher/students/$studentId")({
  head: () => ({
    meta: [
      { title: "Student Details — Skowla" },
      {
        name: "description",
        content: "Student information, attendance and behaviour summary.",
      },
      { property: "og:title", content: "Student Details — Skowla" },
      {
        property: "og:description",
        content: "Student information, attendance and behaviour summary.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StudentDetail,
});

type Tab = "Overview" | "Attendance" | "Behaviour";

function StudentDetail() {
  const { t: tr, locale } = useLanguage();
  const { studentId } = Route.useParams();
  const { students, complaints } = useAppState();
  const s = students.find((x) => x.id === studentId);
  const [tab, setTab] = useState<Tab>("Overview");

  if (!s) {
    return (
      <>
        <PageHeader
          title={tr("Student Details")}
          left={<BackButton fallback="/teacher/students" />}
        />
        <Section>
          <Card className="p-8 text-center">
            <p className="font-semibold">{tr("Student not found")}</p>
            <Link
              to="/teacher/students"
              className="mt-2 inline-block text-sm font-semibold text-primary"
            >
              {tr("Back to list")}
            </Link>
          </Card>
        </Section>
      </>
    );
  }

  const totalDays = s.attendance.present + s.attendance.absent;
  const rate = Math.round((s.attendance.present / (totalDays || 1)) * 1000) / 10;
  const totalPoints = s.behaviour.merits + s.behaviour.demerits;
  const conduct = totalPoints === 0 ? 100 : Math.round((s.behaviour.merits / totalPoints) * 100);
  const conductTone =
    conduct >= 80
      ? { label: "Excellent", tone: "success" as const }
      : conduct >= 50
        ? { label: "Monitor", tone: "warning" as const }
        : { label: "Under Monitoring", tone: "danger" as const };
  const activeCases = complaints.filter((c) => c.student === s.name && c.status !== "Resolved");

  return (
    <>
      <PageHeader
        title={tr("Student Details")}
        left={<BackButton fallback="/teacher/students" />}
      />
      <Section className="space-y-5">
        <div className="flex flex-col items-center text-center">
          <PersonAvatar name={s.name} photo={s.photo} className="size-24 ring-4 text-2xl" />
          <h2 className="mt-3 text-xl font-bold">{localizeNode(s.name, tr)}</h2>
          <p className="text-sm text-muted-foreground">{localizeNode(s.className, tr)}</p>
          <StatusPill tone={studentTone(s.status)} className="mt-2">
            {localizeNode(s.status, tr)}
          </StatusPill>
        </div>

        <div role="tablist" className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
          {localizeNode(
            (["Overview", "Attendance", "Behaviour"] as const).map((t) => (
              <button
                key={t}
                role="tab"
                type="button"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={cn(
                  "h-9 rounded-lg text-xs font-semibold transition-colors",
                  tab === t
                    ? "bg-card text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {localizeNode(t, tr)}
              </button>
            )),
            tr,
          )}
        </div>

        {localizeNode(
          tab === "Overview" && (
            <div className="space-y-4">
              <div>
                <h3 className="mb-2 text-sm font-bold">{tr("Student Information")}</h3>
                <Card className="divide-y divide-border">
                  {localizeNode(
                    [
                      { l: "Student ID", v: s.id.toUpperCase() },
                      { l: "Class", v: s.className },
                      { l: "Form", v: `Form ${s.form}` },
                      { l: "Status", v: s.status },
                    ].map((row) => (
                      <div
                        key={row.l}
                        className="flex items-center justify-between px-4 py-2.5 text-sm"
                      >
                        <span className="text-muted-foreground">{localizeNode(row.l, tr)}</span>
                        <span className="font-semibold">{localizeNode(row.v, tr)}</span>
                      </div>
                    )),
                    tr,
                  )}
                  <div className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <UserRound className="size-4" /> {tr("Guardian")}
                    </span>
                    <span className="font-semibold">{localizeNode(s.guardian.name, tr)}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Phone className="size-4" /> {tr("Emergency Contact")}
                    </span>
                    <span className="font-semibold">{localizeNode(s.guardian.phone, tr)}</span>
                  </div>
                </Card>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-bold">{tr("Behaviour Summary")}</h3>
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{tr("Conduct Score")}</p>
                    <StatusPill tone={conductTone.tone}>
                      {localizeNode(conductTone.label, tr)}
                    </StatusPill>
                  </div>
                  <p className="mt-1 text-3xl font-bold">
                    {localizeNode(conduct, tr)}
                    {tr("%")}
                  </p>
                  <Progress value={conduct} className="mt-3 h-2" />
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 rounded-xl bg-success-soft p-3">
                      <ThumbsUp className="size-4 text-success" />
                      <div>
                        <p className="text-lg font-bold leading-none">
                          {localizeNode(s.behaviour.merits, tr)}
                        </p>
                        <p className="text-xs text-muted-foreground">{tr("Merits")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl bg-destructive-soft p-3">
                      <ThumbsDown className="size-4 text-destructive" />
                      <div>
                        <p className="text-lg font-bold leading-none">
                          {localizeNode(s.behaviour.demerits, tr)}
                        </p>
                        <p className="text-xs text-muted-foreground">{tr("Demerits")}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-bold">{tr("Active Case Reports")}</h3>
                {localizeNode(
                  activeCases.length === 0 ? (
                    <Card className="p-4 text-center text-sm text-muted-foreground">
                      {tr("No active cases for this student.")}
                    </Card>
                  ) : (
                    <Card className="divide-y divide-border">
                      {localizeNode(
                        activeCases.map((c) => (
                          <Link
                            key={c.id}
                            to="/teacher/complaints/$complaintId"
                            params={{ complaintId: c.id }}
                            className="flex items-center justify-between px-4 py-3 text-sm hover:bg-muted/50"
                          >
                            <div className="min-w-0">
                              <p className="truncate font-semibold">{localizeNode(c.issue, tr)}</p>
                              <p className="truncate text-xs text-muted-foreground">
                                {localizeNode(c.reportNo, tr)}
                              </p>
                            </div>
                            <StatusPill
                              tone={
                                c.status === "Pending"
                                  ? "warning"
                                  : c.status === "In Progress"
                                    ? "info"
                                    : "success"
                              }
                            >
                              {localizeNode(c.status, tr)}
                            </StatusPill>
                          </Link>
                        )),
                        tr,
                      )}
                    </Card>
                  ),
                  tr,
                )}
              </div>
            </div>
          ),
          tr,
        )}

        {localizeNode(
          tab === "Attendance" && (
            <div className="space-y-4">
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{tr("Attendance Rate")}</p>
                  <StatusPill tone={rate >= 90 ? "success" : "warning"}>
                    {localizeNode(rate >= 90 ? "Excellent" : "Monitor", tr)}
                  </StatusPill>
                </div>
                <p className="mt-1 text-3xl font-bold">
                  {localizeNode(rate, tr)}
                  {tr("%")}
                </p>
                <Progress value={rate} className="mt-3 h-2" />
              </Card>
              <div className="grid grid-cols-3 gap-3">
                {localizeNode(
                  [
                    { l: "Present", v: s.attendance.present, c: "text-success" },
                    { l: "Absent", v: s.attendance.absent, c: "text-destructive" },
                    { l: "Late", v: s.attendance.late, c: "text-warning" },
                  ].map((x) => (
                    <Card key={x.l} className="p-4 text-center">
                      <p className={cn("text-2xl font-bold", x.c)}>{localizeNode(x.v, tr)}</p>
                      <p className="text-xs text-muted-foreground">
                        {localizeNode(x.l, tr)} {tr("days")}
                      </p>
                    </Card>
                  )),
                  tr,
                )}
              </div>
            </div>
          ),
          tr,
        )}

        {localizeNode(
          tab === "Behaviour" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Card className="flex items-center gap-3 p-4">
                  <span className="grid size-10 place-items-center rounded-xl bg-success-soft text-success">
                    <ThumbsUp className="size-5" />
                  </span>
                  <div>
                    <p className="text-2xl font-bold">{localizeNode(s.behaviour.merits, tr)}</p>
                    <p className="text-xs text-muted-foreground">{tr("Merits")}</p>
                  </div>
                </Card>
                <Card className="flex items-center gap-3 p-4">
                  <span className="grid size-10 place-items-center rounded-xl bg-destructive-soft text-destructive">
                    <ThumbsDown className="size-5" />
                  </span>
                  <div>
                    <p className="text-2xl font-bold">{localizeNode(s.behaviour.demerits, tr)}</p>
                    <p className="text-xs text-muted-foreground">{tr("Demerits")}</p>
                  </div>
                </Card>
              </div>
              <Card className="divide-y divide-border">
                {localizeNode(
                  s.behaviour.notes.map((n) => (
                    <p key={n} className="px-4 py-3 text-sm">
                      {localizeNode(n, tr)}
                    </p>
                  )),
                  tr,
                )}
              </Card>
            </div>
          ),
          tr,
        )}
      </Section>
    </>
  );
}
