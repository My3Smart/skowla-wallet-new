import { useLanguage } from "@/hooks/use-language";
import { localizeNode } from "@/lib/i18n";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { useState } from "react";
import { Card, Section } from "@/components/skowla/AppShell";
import { BackButton, IconButton, PageHeader } from "@/components/skowla/PageHeader";
import { PersonAvatar } from "@/components/skowla/PersonAvatar";
import { StatusPill, studentTone } from "@/components/skowla/StatusPill";
import { Input } from "@/components/ui/input";
import { useAppState } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/teacher/students/")({
  validateSearch: (search: Record<string, unknown>): { form?: number } => {
    const f = Number(search["form"]);
    return Number.isInteger(f) && f >= 1 && f <= 5 ? { form: f } : {};
  },
  head: () => ({
    meta: [
      { title: "Student Report — Skowla" },
      {
        name: "description",
        content: "Browse students by form and see who is on track or needs attention.",
      },
      { property: "og:title", content: "Student Report — Skowla" },
      { property: "og:description", content: "Student progress list for teachers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StudentList,
});

const tabs = [undefined, 1, 2, 3, 4, 5] as const;

function StudentList() {
  const { t: tr, locale } = useLanguage();
  const { form } = Route.useSearch();
  const navigate = useNavigate({ from: "/teacher/students/" });
  const { students } = useAppState();
  const [searching, setSearching] = useState(false);
  const [q, setQ] = useState("");

  const list = students.filter(
    (s) =>
      (form === undefined || s.form === form) &&
      s.name.toLowerCase().includes(q.trim().toLowerCase()),
  );

  return (
    <>
      <PageHeader
        title={tr("Student Report")}
        left={<BackButton fallback="/teacher" />}
        right={
          <IconButton
            label={localizeNode(searching ? "Close search" : "Search students", tr)}
            onClick={() => {
              setSearching((v) => !v);
              setQ("");
            }}
          >
            {localizeNode(searching ? <X className="size-5" /> : <Search className="size-5" />, tr)}
          </IconButton>
        }
      />
      <Section className="space-y-4">
        {localizeNode(
          searching && (
            <Input
              autoFocus
              placeholder={tr("Search student name…")}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="h-11 rounded-xl bg-card"
            />
          ),
          tr,
        )}
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
          {localizeNode(
            tabs.map((t) => {
              const active = form === t;
              return (
                <button
                  key={t ?? "all"}
                  type="button"
                  onClick={() => void navigate({ search: t === undefined ? {} : { form: t } })}
                  className={cn(
                    "h-9 shrink-0 rounded-xl px-4 text-xs font-semibold transition-colors",
                    active
                      ? "bg-primary text-primary-foreground shadow-elevated"
                      : "border border-border bg-card text-foreground hover:bg-muted",
                  )}
                >
                  {localizeNode(t === undefined ? "All" : `Form ${t}`, tr)}
                </button>
              );
            }),
            tr,
          )}
        </div>

        {localizeNode(
          list.length === 0 ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              {tr("No students found.")}
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {localizeNode(
                list.map((s) => (
                  <Link key={s.id} to="/teacher/students/$studentId" params={{ studentId: s.id }}>
                    <Card className="flex items-center gap-3 p-3 transition-colors hover:bg-muted/50">
                      <PersonAvatar name={s.name} photo={s.photo} className="size-11" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{localizeNode(s.name, tr)}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {localizeNode(s.className, tr)}
                        </p>
                      </div>
                      <StatusPill tone={studentTone(s.status)}>
                        {localizeNode(s.status, tr)}
                      </StatusPill>
                    </Card>
                  </Link>
                )),
                tr,
              )}
            </div>
          ),
          tr,
        )}
      </Section>
    </>
  );
}
