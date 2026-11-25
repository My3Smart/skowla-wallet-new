import { useLanguage } from "@/hooks/use-language";
import { localizeNode } from "@/lib/i18n";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, Section } from "@/components/skowla/AppShell";
import { PageHeader } from "@/components/skowla/PageHeader";
import { PersonAvatar } from "@/components/skowla/PersonAvatar";
import { StatusPill, complaintTone } from "@/components/skowla/StatusPill";
import { TeacherMenu } from "@/components/skowla/TeacherMenu";
import { fmtDate } from "@/lib/format";
import { complaintMeta, useAppState } from "@/lib/store";

export const Route = createFileRoute("/teacher/report")({
  head: () => ({
    meta: [
      { title: "Teacher Report — Skowla" },
      {
        name: "description",
        content: "Parent reports (aduan) and students needing attention with merit scores.",
      },
      { property: "og:title", content: "Teacher Report — Skowla" },
      { property: "og:description", content: "Parent reports and student merit scores." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TeacherReport,
});

function TeacherReport() {
  const { t: tr, locale } = useLanguage();
  const { complaints, students } = useAppState();

  const parentReports = complaints.filter((c) => c.source === "parent");

  const problemStudents = students
    .map((s) => {
      const cases = complaints.filter((c) => c.student === s.name).length;
      const { merits, demerits } = s.behaviour;
      const merit = merits + demerits > 0 ? Math.round((merits / (merits + demerits)) * 100) : 100;
      return { s, problems: cases + demerits, merit };
    })
    .filter((x) => x.problems > 0)
    .sort((a, b) => b.problems - a.problems || a.merit - b.merit);

  return (
    <>
      <PageHeader title={tr("Teacher Report")} left={<TeacherMenu />} />
      <Section className="space-y-5">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-bold">{tr("Parent Reports (Aduan)")}</h3>
            <span className="text-xs text-muted-foreground">
              {localizeNode(parentReports.length, tr)} {tr("reports")}
            </span>
          </div>
          {localizeNode(
            parentReports.length === 0 ? (
              <Card className="p-6 text-center text-sm text-muted-foreground">
                {tr("No parent reports yet.")}
              </Card>
            ) : (
              <div className="space-y-2">
                {localizeNode(
                  parentReports.map((c) => {
                    const m = complaintMeta(c);
                    return (
                      <Link
                        key={c.id}
                        to="/teacher/complaints/$complaintId"
                        params={{ complaintId: c.id }}
                      >
                        <Card className="mb-2 space-y-1 p-4 transition-colors hover:bg-muted/50">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-semibold text-primary">
                              {localizeNode(m.reportNo, tr)}
                            </span>
                            <StatusPill tone={complaintTone(c.status)}>
                              {localizeNode(c.status, tr)}
                            </StatusPill>
                          </div>
                          <p className="text-sm font-semibold">
                            {tr("Report by: ")}
                            {localizeNode(m.reportedBy, tr)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {localizeNode(fmtDate(m.date), tr)} {tr("• ")}
                            {localizeNode(c.issue, tr)} {tr("• ")}
                            {localizeNode(c.student, tr)}
                          </p>
                          <p className="line-clamp-2 text-xs">{localizeNode(c.description, tr)}</p>
                        </Card>
                      </Link>
                    );
                  }),
                  tr,
                )}
              </div>
            ),
            tr,
          )}
        </div>

        <div className="pb-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-bold">{tr("Students Needing Attention")}</h3>
          </div>
          <div className="space-y-2">
            {localizeNode(
              problemStudents.length === 0 && (
                <Card className="p-6 text-center text-sm text-muted-foreground">
                  {tr("No students with problems.")}
                </Card>
              ),
              tr,
            )}
            {localizeNode(
              problemStudents.map(({ s, problems }) => (
                <Link key={s.id} to="/teacher/students/$studentId" params={{ studentId: s.id }}>
                  <Card className="mb-2 flex items-center gap-3 px-4 py-3 text-sm">
                    <PersonAvatar name={s.name} photo={s.photo} className="size-9" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{localizeNode(s.name, tr)}</p>
                      <p className="text-xs text-muted-foreground">
                        {localizeNode(`${s.className} • ${problems} problems`, tr)}
                      </p>
                    </div>
                  </Card>
                </Link>
              )),
              tr,
            )}
          </div>
        </div>
      </Section>
    </>
  );
}
