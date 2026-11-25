import { useLanguage } from "@/hooks/use-language";
import { localizeNode } from "@/lib/i18n";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "@/lib/notify";
import { Card, Section } from "@/components/skowla/AppShell";
import { BackButton, PageHeader } from "@/components/skowla/PageHeader";
import { StatusPill, complaintTone } from "@/components/skowla/StatusPill";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { fmtDate, fmtTime } from "@/lib/format";
import { actions, complaintMeta, useAppState } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/teacher/complaints/$complaintId")({
  head: () => ({
    meta: [
      { title: "Complaint Details — Skowla" },
      {
        name: "description",
        content: "Complaint details, timeline of updates, and actions to update or resolve.",
      },
      { property: "og:title", content: "Complaint Details — Skowla" },
      { property: "og:description", content: "Review, update and resolve a complaint." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ComplaintDetail,
});

function ComplaintDetail() {
  const { t: tr, locale } = useLanguage();
  const { complaintId } = Route.useParams();
  const { complaints } = useAppState();
  const c = complaints.find((x) => x.id === complaintId);
  const [updOpen, setUpdOpen] = useState(false);
  const [resOpen, setResOpen] = useState(false);
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<"Pending" | "In Progress">("In Progress");

  if (!c) {
    return (
      <>
        <PageHeader
          title={tr("Complaint Details")}
          left={<BackButton fallback="/teacher/complaints" />}
        />
        <Section>
          <Card className="p-8 text-center">
            <p className="font-semibold">{tr("Complaint not found")}</p>
            <Link
              to="/teacher/complaints"
              className="mt-2 inline-block text-sm font-semibold text-primary"
            >
              {tr("Back to complaints")}
            </Link>
          </Card>
        </Section>
      </>
    );
  }

  const resolved = c.status === "Resolved";

  return (
    <>
      <PageHeader
        title={tr("Complaint Details")}
        left={
          <BackButton
            fallback={c?.source === "parent" ? "/teacher/report" : "/teacher/complaints"}
          />
        }
      />
      <Section className="grid grid-cols-1 gap-4 pb-28 md:grid-cols-2 md:pb-0">
        <Card className="space-y-3 p-5">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-base font-bold">
              {localizeNode(c.source === "parent" ? "Report Details" : "Complaint Details", tr)}
            </h2>
            <StatusPill tone={complaintTone(c.status)}>{localizeNode(c.status, tr)}</StatusPill>
          </div>
          <dl className="space-y-2 rounded-xl bg-muted p-3 text-sm">
            <Row label={tr("Report by")} value={complaintMeta(c).reportedBy} />
            <Row label={tr("Report number")} value={complaintMeta(c).reportNo} />
            <Row
              label={tr("Report date")}
              value={`${fmtDate(c.createdAt)}, ${fmtTime(c.createdAt)}`}
            />
          </dl>
          <div className="text-sm">
            <p className="font-semibold">{tr("Description")}</p>
            <p className="text-muted-foreground">{localizeNode(c.description, tr)}</p>
          </div>
          <div className="border-t border-border pt-3 text-sm">
            <p>
              <span className="font-semibold">{tr("Student:")}</span> {localizeNode(c.student, tr)}
              {localizeNode(
                c.form && (
                  <span className="text-muted-foreground">
                    {" "}
                    {tr("• ")}
                    {localizeNode(c.form, tr)}
                  </span>
                ),
                tr,
              )}
            </p>
            <p>
              <span className="font-semibold">{tr("Issue:")}</span> {localizeNode(c.issue, tr)}
            </p>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 font-bold">{tr("Updates")}</h3>
          <ol className="relative space-y-5">
            {localizeNode(
              c.updates.map((u, i) => {
                const last = i === c.updates.length - 1;
                return (
                  <li key={`${u.at}-${i}`} className="relative flex gap-3">
                    {localizeNode(
                      !last && (
                        <span
                          className="absolute top-4 left-[7px] h-[calc(100%+0.5rem)] w-0.5 bg-border"
                          aria-hidden
                        />
                      ),
                      tr,
                    )}
                    <span
                      className={cn(
                        "relative mt-0.5 size-4 shrink-0 rounded-full ring-4",
                        i === 0 || u.title === "Resolved"
                          ? "bg-primary ring-primary-soft"
                          : "bg-muted-foreground/40 ring-muted",
                        u.title === "Resolved" && "bg-success ring-success-soft",
                      )}
                    />
                    <div>
                      <p className="text-sm font-semibold">{localizeNode(u.title, tr)}</p>
                      {localizeNode(
                        u.note && (
                          <p className="text-sm text-muted-foreground">
                            {localizeNode(u.note, tr)}
                          </p>
                        ),
                        tr,
                      )}
                      <p className="text-xs text-muted-foreground">
                        {localizeNode(fmtDate(u.at), tr)}
                        {tr(", ")}
                        {localizeNode(fmtTime(u.at), tr)}
                      </p>
                    </div>
                  </li>
                );
              }),
              tr,
            )}
          </ol>
        </Card>
      </Section>

      <div className="phone-actions z-30 border-t border-border bg-card/95 p-4 backdrop-blur-md">
        <div className="mx-auto grid max-w-md grid-cols-2 gap-3 md:max-w-sm md:ml-auto md:mr-0">
          <Button
            variant="outline"
            className="h-11 rounded-xl border-primary text-primary"
            disabled={resolved}
            onClick={() => setUpdOpen(true)}
          >
            {tr("Update")}
          </Button>
          <Button className="h-11 rounded-xl" disabled={resolved} onClick={() => setResOpen(true)}>
            {localizeNode(resolved ? "Resolved" : "Resolve", tr)}
          </Button>
        </div>
      </div>

      <Dialog open={updOpen} onOpenChange={setUpdOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{tr("Add Update")}</DialogTitle>
            <DialogDescription>{tr("Record progress on this complaint.")}</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!note.trim()) {
                toast.error("Please write an update note.");
                return;
              }
              actions.updateComplaint(c.id, status, note.trim());
              toast.success("Update added");
              setNote("");
              setUpdOpen(false);
            }}
          >
            <Select value={status} onValueChange={(v) => setStatus(v as "Pending" | "In Progress")}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pending">{tr("Pending")}</SelectItem>
                <SelectItem value="In Progress">{tr("In Progress")}</SelectItem>
              </SelectContent>
            </Select>
            <Textarea
              placeholder={tr("What's the latest?")}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-24 rounded-xl"
            />
            <Button type="submit" className="h-11 w-full rounded-xl">
              {tr("Save Update")}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={resOpen} onOpenChange={setResOpen}>
        <AlertDialogContent className="max-w-sm rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{tr("Resolve this complaint?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {tr("It will be marked as resolved and moved to the Resolved list.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tr("Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                actions.updateComplaint(c.id, "Resolved", "Marked as resolved by teacher.");
                toast.success("Complaint resolved");
              }}
            >
              {tr("Resolve")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const { t: tr, locale } = useLanguage();
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{localizeNode(label, tr)}</dt>
      <dd className="text-right font-semibold">{localizeNode(value, tr)}</dd>
    </div>
  );
}
