import { useLanguage } from "@/hooks/use-language";
import { localizeNode } from "@/lib/i18n";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Users } from "lucide-react";
import { Card, Section } from "@/components/skowla/AppShell";
import { BackButton, PageHeader } from "@/components/skowla/PageHeader";
import { PersonAvatar } from "@/components/skowla/PersonAvatar";
import { StatusPill } from "@/components/skowla/StatusPill";
import { useAppState } from "@/lib/store";

export const Route = createFileRoute("/teacher/classes")({
  head: () => ({
    meta: [
      { title: "Class Management — Skowla" },
      {
        name: "description",
        content: "Your classes at a glance: students, average grade and who needs attention.",
      },
      { property: "og:title", content: "Class Management — Skowla" },
      { property: "og:description", content: "Manage classes and jump to their student reports." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Classes,
});

function Classes() {
  const { t: tr, locale } = useLanguage();
  const { students } = useAppState();
  const groups = Object.values(
    students.reduce<Record<string, { name: string; form: number; list: typeof students }>>(
      (acc, s) => {
        const g = (acc[s.className] ??= { name: s.className, form: s.form, list: [] });
        g.list.push(s);
        return acc;
      },
      {},
    ),
  ).sort((a, b) => a.form - b.form);

  return (
    <>
      <PageHeader title={tr("Class Management")} left={<BackButton fallback="/teacher" />} />
      <Section className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {localizeNode(
          groups.map((g) => {
            const avg = g.list.reduce((t, s) => t + s.grade, 0) / g.list.length;
            const attention = g.list.filter((s) => s.status === "Needs Attention").length;
            return (
              <Link key={g.name} to="/teacher/students" search={{ form: g.form }}>
                <Card className="p-4 transition-colors hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary">
                      <Users className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{localizeNode(g.name, tr)}</p>
                      <p className="text-xs text-muted-foreground">
                        {localizeNode(g.list.length, tr)} {tr("students • Avg ")}
                        {localizeNode(avg.toFixed(1), tr)}
                        {tr("%")}
                      </p>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {localizeNode(
                        g.list
                          .slice(0, 5)
                          .map((s) => (
                            <PersonAvatar
                              key={s.id}
                              name={s.name}
                              photo={s.photo}
                              className="size-7 text-[10px]"
                            />
                          )),
                        tr,
                      )}
                    </div>
                    {localizeNode(
                      attention > 0 ? (
                        <StatusPill tone="warning">
                          {localizeNode(attention, tr)} {tr("need attention")}
                        </StatusPill>
                      ) : (
                        <StatusPill tone="success">{tr("All on track")}</StatusPill>
                      ),
                      tr,
                    )}
                  </div>
                </Card>
              </Link>
            );
          }),
          tr,
        )}
      </Section>
    </>
  );
}
