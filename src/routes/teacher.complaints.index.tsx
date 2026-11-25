import { useLanguage } from "@/hooks/use-language";
import { localizeNode } from "@/lib/i18n";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Search, X } from "lucide-react";
import { useState } from "react";
import { toast } from "@/lib/notify";
import { Card, Section } from "@/components/skowla/AppShell";
import { BackButton, IconButton, PageHeader } from "@/components/skowla/PageHeader";
import { StatusPill, complaintTone } from "@/components/skowla/StatusPill";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ComplaintStatus } from "@/lib/data";
import { fmtDate, fmtTime } from "@/lib/format";
import { actions, complaintMeta, nextReportNo, useAppState } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/teacher/complaints/")({
  head: () => ({
    meta: [
      { title: "Teacher Complaint — Skowla" },
      {
        name: "description",
        content:
          "Track and filter student complaints by status: pending, in progress and resolved.",
      },
      { property: "og:title", content: "Teacher Complaint — Skowla" },
      { property: "og:description", content: "Complaint list for teachers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ComplaintList,
});

const filters = ["All", "Pending", "In Progress", "Resolved"] as const;
const dot: Record<ComplaintStatus, string> = {
  Pending: "bg-destructive",
  "In Progress": "bg-warning",
  Resolved: "bg-success",
};

function ComplaintList() {
  const { t: tr, locale } = useLanguage();
  const { complaints, students } = useAppState();
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [searching, setSearching] = useState(false);
  const [q, setQ] = useState("");
  const [newOpen, setNewOpen] = useState(false);

  const list = complaints
    .filter((c) => c.source === "teacher")
    .filter((c) => {
      const term = q.trim().toLowerCase();
      return (
        (filter === "All" || c.status === filter) &&
        (!term || c.student.toLowerCase().includes(term) || c.issue.toLowerCase().includes(term))
      );
    });

  return (
    <>
      <PageHeader
        title={tr("Teacher Complaint")}
        left={<BackButton fallback="/teacher" />}
        right={
          <IconButton
            label={localizeNode(searching ? "Close search" : "Search complaints", tr)}
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
              placeholder={tr("Search student or issue…")}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="h-11 rounded-xl bg-card"
            />
          ),
          tr,
        )}
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
          {localizeNode(
            filters.map((f) => (
              <Button
                key={f}
                type="button"
                variant="ghost"
                onClick={() => setFilter(f)}
                className={cn(
                  "h-9 shrink-0 rounded-xl px-4 text-xs font-semibold transition-colors",
                  filter === f
                    ? "bg-primary text-primary-foreground shadow-elevated"
                    : "border border-border bg-card hover:bg-muted",
                )}
              >
                {localizeNode(f, tr)}
              </Button>
            )),
            tr,
          )}
        </div>

        {localizeNode(
          list.length === 0 ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              {tr("No complaints here.")}
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {localizeNode(
                list.map((c) => (
                  <Link
                    key={c.id}
                    to="/teacher/complaints/$complaintId"
                    params={{ complaintId: c.id }}
                  >
                    <Card className="flex gap-3 p-4 transition-colors hover:bg-muted/50">
                      <span
                        className={cn(
                          "mt-1.5 size-2.5 shrink-0 rounded-full ring-4 ring-muted",
                          dot[c.status],
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold text-primary">
                          {localizeNode(complaintMeta(c).reportNo, tr)}
                        </p>
                        <p className="truncate text-sm font-semibold">
                          {tr("Student: ")}
                          {localizeNode(c.student, tr)}
                        </p>
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {tr("Issue: ")}
                          {localizeNode(c.issue, tr)}
                        </p>
                        <p className="mt-1 truncate text-[11px] text-muted-foreground">
                          {tr("Report by: ")}
                          {localizeNode(complaintMeta(c).reportedBy, tr)}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <StatusPill tone={complaintTone(c.status)}>
                          {localizeNode(c.status, tr)}
                        </StatusPill>
                        <span className="text-[11px] text-muted-foreground">
                          {localizeNode(fmtDate(c.createdAt), tr)}
                        </span>
                      </div>
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

      <Button
        type="button"
        aria-label={tr("New complaint")}
        title={tr("New complaint")}
        size="icon"
        onClick={() => setNewOpen(true)}
        className="phone-fab z-30 size-14 rounded-full bg-gradient-primary text-primary-foreground shadow-elevated [&_svg]:size-6"
      >
        <Plus className="size-6" />
      </Button>

      {localizeNode(
        newOpen && (
          <NewComplaintDialog
            open={newOpen}
            onOpenChange={setNewOpen}
            studentNames={students.map((s) => ({ name: s.name, form: s.className }))}
          />
        ),
        tr,
      )}
    </>
  );
}

function NewComplaintDialog({
  open,
  onOpenChange,
  studentNames,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  studentNames: { name: string; form: string }[];
}) {
  const { t: tr, locale } = useLanguage();
  const [student, setStudent] = useState("");
  const [issue, setIssue] = useState("");
  const [desc, setDesc] = useState("");
  const [find, setFind] = useState("");
  const matches = studentNames.filter((s) =>
    s.name.toLowerCase().includes(find.trim().toLowerCase()),
  );
  const state = useAppState();
  const reportedBy = state.teacherProfile.name;
  const reportNo = nextReportNo(state, "teacher");
  const [now, setNow] = useState(() => new Date().toISOString());
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (v) setNow(new Date().toISOString());
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-h-[85dvh] w-[calc(100%-2rem)] max-w-sm overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>{tr("New Complaint")}</DialogTitle>
          <DialogDescription>{tr("Log an issue for a student.")}</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const s = studentNames.find((x) => x.name === student);
            if (!s || !issue.trim() || !desc.trim()) {
              toast.error("Please fill in all fields.");
              return;
            }
            actions.addComplaint({
              student: s.name,
              form: s.form,
              issue: issue.trim(),
              description: desc.trim(),
              source: "teacher",
              reportedBy,
              reportNo,
            });
            toast.success("Complaint submitted");
            setStudent("");
            setIssue("");
            setDesc("");
            onOpenChange(false);
          }}
        >
          <div className="space-y-2 rounded-xl bg-muted p-3 text-sm">
            <Field label={tr("Report by")} value={reportedBy} />
            <Field label={tr("Report number")} value={reportNo} />
            <Field label={tr("Report date")} value={`${fmtDate(now)}, ${fmtTime(now)}`} />
          </div>
          <label className="block text-sm font-semibold">{tr("Student")}</label>
          <div className="relative">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label={tr("Search student name")}
              placeholder={tr("Search student name")}
              value={find}
              onChange={(e) => setFind(e.target.value)}
              className="h-11 rounded-xl pl-9"
            />
          </div>
          {find.trim() && (
            <div className="max-h-40 overflow-y-auto rounded-xl border border-border">
              {matches.length === 0 ? (
                <p className="p-3 text-xs text-muted-foreground">{tr("No student found")}</p>
              ) : (
                matches.map((s) => (
                  <button
                    key={s.name}
                    type="button"
                    onClick={() => {
                      setStudent(s.name);
                      setFind("");
                    }}
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
                  >
                    {localizeNode(s.name, tr)} {tr("— ")}
                    {localizeNode(s.form, tr)}
                  </button>
                ))
              )}
            </div>
          )}
          <Select value={student} onValueChange={setStudent}>
            <SelectTrigger aria-label={tr("Student")} className="h-11 rounded-xl">
              <SelectValue placeholder={tr("Select student")} />
            </SelectTrigger>
            <SelectContent>
              {localizeNode(
                studentNames.map((s) => (
                  <SelectItem key={s.name} value={s.name}>
                    {localizeNode(s.name, tr)} {tr("— ")}
                    {localizeNode(s.form, tr)}
                  </SelectItem>
                )),
                tr,
              )}
            </SelectContent>
          </Select>
          <label htmlFor="complaint-issue" className="block text-sm font-semibold">
            {tr("Issue")}
          </label>
          <Input
            id="complaint-issue"
            placeholder={tr("Issue (e.g. Bullying)")}
            value={issue}
            onChange={(e) => setIssue(e.target.value)}
            className="h-11 rounded-xl"
          />
          <label htmlFor="complaint-description" className="block text-sm font-semibold">
            {tr("Description")}
          </label>
          <Textarea
            id="complaint-description"
            placeholder={tr("Description of the incident")}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className="min-h-24 rounded-xl"
          />
          <Button type="submit" className="h-11 w-full rounded-xl">
            {tr("Submit Complaint")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  const { t: tr, locale } = useLanguage();
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{localizeNode(label, tr)}</span>
      <span className="text-right font-semibold">{localizeNode(value, tr)}</span>
    </div>
  );
}
