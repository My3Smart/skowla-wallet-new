import { Camera, ImagePlus, X } from "lucide-react";
import { useRef } from "react";
import { CameraCapture } from "@/components/skowla/CameraCapture";
import { useLanguage } from "@/hooks/use-language";
import { localizeNode } from "@/lib/i18n";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  Bus,
  CheckCircle2,
  Clock,
  Fingerprint,
  Landmark,
  NotebookPen,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "@/lib/notify";
import { Card, Section } from "@/components/skowla/AppShell";
import { Owl } from "@/components/skowla/Brand";
import { ParentHeader } from "@/components/skowla/ParentHeader";
import { PersonAvatar } from "@/components/skowla/PersonAvatar";
import { StatusPill } from "@/components/skowla/StatusPill";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { fmtDate } from "@/lib/format";
import { actions, rm, transportSummary, useAppState } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/parent/school")({
  head: () => ({
    meta: [
      { title: "Fees & Attendance — Skowla" },
      {
        name: "description",
        content:
          "Live campus check-in, transport and school fees (PIBG & Yuran) for your children.",
      },
      { property: "og:title", content: "Fees & Attendance — Skowla" },
      { property: "og:description", content: "Attendance tracking and school fees for parents." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: School,
});

function School() {
  const { t: tr, locale } = useLanguage();
  const { children, invoices, walletBalance, leaveNotes, transport } = useAppState();
  const [childId, setChildId] = useState(children[0]?.id ?? "");
  const child = children.find((c) => c.id === childId) ?? children[0];
  const [payIds, setPayIds] = useState<string[] | null>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);

  if (!child) return null;
  const transportMode = transport[child.id] ?? "bus";
  const trips = transportSummary(transportMode);
  const mine = invoices.filter((i) => i.childId === child.id);
  const outstanding = mine.filter((i) => !i.paid);
  const total = outstanding.reduce((t, i) => t + i.amount, 0);
  const payTotal = invoices.filter((i) => payIds?.includes(i.id)).reduce((t, i) => t + i.amount, 0);
  const notes = leaveNotes.filter((n) => n.childId === child.id);
  const firstName = child.name.split(" ")[0];
  const today = new Date().toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <>
      <ParentHeader subtitle={tr("School")} />
      <Section className="space-y-4">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
          {localizeNode(
            children.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setChildId(c.id)}
                className={cn(
                  "flex min-w-[10rem] shrink-0 items-center gap-2 rounded-2xl px-3 py-2 text-left transition-colors",
                  c.id === child.id
                    ? "bg-gradient-primary text-primary-foreground shadow-elevated"
                    : "border border-border bg-card hover:bg-muted",
                )}
              >
                <PersonAvatar name={c.name} photo={c.photo} className="size-8" />
                <div className="min-w-0 leading-tight">
                  <p className="truncate text-sm font-bold">
                    {localizeNode(c.name.split(" ")[0], tr)}
                  </p>
                  <p className="truncate text-[10px] opacity-80">{localizeNode(c.school, tr)}</p>
                </div>
              </button>
            )),
            tr,
          )}
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-8">
          <div className="space-y-4">
            <Card className="flex items-center gap-3 p-4">
              <Owl className="size-14 shrink-0" />
              <div className="min-w-0 flex-1">
                <StatusPill tone="info" className="gap-1">
                  <ShieldCheck className="size-3" /> {tr("SAFE & PRESENT")}
                </StatusPill>
                <p className="mt-1 font-bold">
                  {localizeNode(firstName, tr)} {tr("is safely entered school")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {tr("Dikemas kini secara langsung • ")}
                  {localizeNode(child.lastSeen, tr)}
                </p>
              </div>
              <ShieldCheck className="size-6 shrink-0 text-primary" />
            </Card>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="flex items-center gap-1.5 text-sm font-bold">
                  <Clock className="size-4 text-primary" /> {tr("Live Campus Tracking")}
                </h3>
                <span className="text-[11px] font-semibold text-primary">
                  {tr("Today, ")}
                  {localizeNode(today, tr)}
                </span>
              </div>
              <Card className="space-y-4 p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="size-9 shrink-0 text-success" />
                  <div className="flex-1">
                    <p className="text-[10px] font-bold tracking-wider text-success uppercase">
                      {tr("Main Gate Checked In")}
                    </p>
                    <p className="text-2xl font-extrabold">{localizeNode(child.checkIn, tr)}</p>
                  </div>
                  <span className="rounded-lg bg-primary-soft px-2 py-1 text-[10px] font-bold text-primary">
                    {tr("ID: 004623")}
                  </span>
                </div>
                <ol className="space-y-3 border-l-2 border-dashed border-border pl-4">
                  <li className="relative">
                    <Fingerprint className="absolute top-0.5 -left-[25px] size-4 rounded-full bg-card text-primary" />
                    <p className="text-sm font-semibold">
                      {localizeNode(child.school, tr)} {tr("Guard House 01")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {tr("Automated biometric turnstile recorder")}
                    </p>
                  </li>
                  <li className="relative">
                    <Bus className="absolute top-0.5 -left-[25px] size-4 rounded-full bg-card text-primary" />
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">
                          {localizeNode(
                            transportMode === "parent" ? "Parent Drop-off" : "Morning Bus Pick-up",
                            tr,
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {localizeNode(
                            transportMode === "parent"
                              ? "Brought to school by parent"
                              : "Bus P/2 (Driver: Uncle Tan)",
                            tr,
                          )}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs font-bold">
                        {localizeNode(transportMode === "parent" ? child.checkIn : "06:45 AM", tr)}
                      </span>
                    </div>
                  </li>
                </ol>
              </Card>
            </div>

            <fieldset className="space-y-2">
              <legend className="mb-2 text-sm font-bold">{tr("School transportation")}</legend>
              <div className="grid grid-cols-2 gap-2">
                {localizeNode(
                  (["bus", "parent"] as const).map((mode) => (
                    <Button
                      key={mode}
                      variant={transportMode === mode ? "default" : "outline"}
                      aria-pressed={transportMode === mode}
                      onClick={() => actions.setTransport(child.id, mode)}
                      className="h-11 rounded-xl"
                    >
                      {localizeNode(mode === "bus" ? <Bus /> : <Users />, tr)}
                      {localizeNode(mode === "bus" ? "School bus" : "Parent drop-off", tr)}
                    </Button>
                  )),
                  tr,
                )}
              </div>
            </fieldset>
            <Card className="flex flex-wrap items-center gap-3 p-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-warning-soft text-warning">
                <Users className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">{tr("Transportation")}</p>
                <p className="text-sm font-bold">
                  {tr("100% On-Time (")}
                  {localizeNode(trips.onTime, tr)}
                  {tr("/")}
                  {localizeNode(trips.total, tr)}
                  {tr(")")}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl border-primary text-primary"
                onClick={() => setLeaveOpen(true)}
              >
                <NotebookPen /> {tr("Sick / Leave Note")}
              </Button>
            </Card>
            {localizeNode(
              notes.length > 0 && (
                <Card className="divide-y divide-border">
                  {localizeNode(
                    notes.map((n) => (
                      <div key={n.id} className="px-4 py-3 text-sm">
                        <p className="font-semibold">
                          {tr("Nota ")}
                          {localizeNode(n.type, tr)} {tr("• ")}
                          {localizeNode(n.date, tr)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {localizeNode(n.reason, tr)}
                        </p>
                        {n.images && n.images.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {n.images.map((src, i) => (
                              <a key={i} href={src} target="_blank" rel="noreferrer">
                                <img src={src} alt="" className="size-14 rounded-lg object-cover" />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    )),
                    tr,
                  )}
                </Card>
              ),
              tr,
            )}
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold">{tr("School Fees (PIBG & Yuran)")}</h3>
              <p className="text-[11px] text-muted-foreground">
                {tr("Direct settlement to ")}
                {localizeNode(child.school, tr)} {tr("Account")}
              </p>
            </div>
            <div className={`relative overflow-hidden rounded-3xl border-4 bg-gradient-primary p-5 text-primary-foreground shadow-elevated ${total > 0 ? "border-destructive" : "border-primary"}`}>
              <Landmark className="absolute top-5 right-5 size-6 opacity-80" />
              <p className="text-xs font-medium opacity-90">{tr("Total Outstanding Balance")}</p>
              <p className="mt-1 text-4xl font-extrabold tracking-tight">
                {localizeNode(rm(total), tr)}
              </p>
              <div className="mt-4 flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-[11px] opacity-90">
                  <ShieldCheck className="size-3.5" /> {tr("Secured via FPX / DuitNow QR")}
                </span>
                <button
                  type="button"
                  disabled={total === 0}
                  onClick={() => setPayIds(outstanding.map((i) => i.id))}
                  className="inline-flex items-center gap-1 rounded-full bg-card px-3 py-1.5 text-xs font-bold text-primary disabled:opacity-60"
                >
                  {localizeNode(total === 0 ? "Semua Dibayar" : "Pay All Now", tr)}
                  {localizeNode(" ", tr)}
                  <ArrowRight className="size-3.5" />
                </button>
              </div>
            </div>

            <h4 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
              {tr("Itemized Invoices")}
            </h4>
            <div className="space-y-3">
              {localizeNode(
                mine.map((i) => (
                  <Card key={i.id} className="flex items-start gap-3 p-4">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-warning-soft text-warning">
                      <Landmark className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold">{localizeNode(i.title, tr)}</p>
                        <p className="shrink-0 text-sm font-bold">
                          {localizeNode(rm(i.amount), tr)}
                        </p>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {localizeNode(i.dueLabel, tr)}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        {localizeNode(
                          i.paid ? (
                            <StatusPill tone="success">{tr("Dibayar")}</StatusPill>
                          ) : (
                            <StatusPill tone="warning">{tr("Pending Payment")}</StatusPill>
                          ),
                          tr,
                        )}
                        {localizeNode(
                          !i.paid && (
                            <button
                              type="button"
                              onClick={() => setPayIds([i.id])}
                              className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-[11px] font-bold text-primary-foreground"
                            >
                              {tr("Pay ")}
                              {localizeNode(rm(i.amount), tr)} <ArrowRight className="size-3" />
                            </button>
                          ),
                          tr,
                        )}
                      </div>
                    </div>
                  </Card>
                )),
                tr,
              )}
            </div>
          </div>
        </div>
      </Section>

      <AlertDialog open={!!payIds} onOpenChange={(v) => !v && setPayIds(null)}>
        <AlertDialogContent className="max-w-sm rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {tr("Sahkan bayaran ")}
              {localizeNode(rm(payTotal), tr)}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {tr("Dibayar dari Dompet Skowla (baki ")}
              {localizeNode(rm(walletBalance), tr)}
              {tr(") terus ke akaun ")}
              {localizeNode(child.school, tr)}
              {tr(".")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tr("Batal")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                try {
                  actions.payInvoices(payIds ?? []);
                  toast.success(`Bayaran ${rm(payTotal)} berjaya`);
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Ralat berlaku");
                }
              }}
            >
              {tr("Bayar Sekarang")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <LeaveDialog
        open={leaveOpen}
        onOpenChange={setLeaveOpen}
        childId={child.id}
        childName={child.name}
      />
    </>
  );
}

function LeaveDialog({
  open,
  onOpenChange,
  childId,
  childName,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  childId: string;
  childName: string;
}) {
  const { t: tr, locale } = useLanguage();
  const [type, setType] = useState<"Sakit" | "Cuti">("Sakit");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [camOpen, setCamOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const addFiles = async (files: FileList | null) => {
    if (!files) return;
    const out: string[] = [];
    for (const f of Array.from(files).slice(0, 4 - images.length)) {
      if (!f.type.startsWith("image/")) continue;
      out.push(await shrinkImage(f));
    }
    setImages((p) => [...p, ...out].slice(0, 4));
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle>{tr("Sick / Leave Note")}</DialogTitle>
          <DialogDescription>
            {tr("Maklumkan guru kelas tentang ketidakhadiran ")}
            {localizeNode(childName, tr)}
            {tr(".")}
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!reason.trim()) {
              toast.error("Sila nyatakan sebab.");
              return;
            }
            actions.addLeaveNote({ childId, type, date: fmtDate(date), reason: reason.trim(), images });
            toast.success("Nota dihantar kepada guru kelas");
            setReason("");
            setImages([]);
            onOpenChange(false);
          }}
        >
          <div className="grid grid-cols-2 gap-2">
            {localizeNode(
              (["Sakit", "Cuti"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={cn(
                    "h-10 rounded-xl border text-sm font-semibold",
                    type === t
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border",
                  )}
                >
                  {localizeNode(t === "Sakit" ? "Sakit (MC)" : "Cuti / Urusan", tr)}
                </button>
              )),
              tr,
            )}
          </div>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-11 rounded-xl"
            aria-label={tr("Tarikh")}
          />
          <Textarea
            placeholder={tr("Sebab ketidakhadiran")}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="min-h-20 rounded-xl"
          />
          <div className="grid grid-cols-2 gap-2">
            <label className="flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-border text-sm font-semibold">
              <ImagePlus className="size-4" /> {tr("Attach Image")}
              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { void addFiles(e.target.files); e.target.value = ""; }} />
            </label>
            <button type="button" disabled={images.length >= 4} onClick={() => setCamOpen(true)} className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border text-sm font-semibold disabled:opacity-50">
              <Camera className="size-4" /> {tr("Take Photo")}
            </button>
          </div>
          {images.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {images.map((src, i) => (
                <div key={i} className="relative">
                  <img src={src} alt="" className="size-16 rounded-lg object-cover" />
                  <button type="button" aria-label={tr("Remove")} onClick={() => setImages((p) => p.filter((_, j) => j !== i))} className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-destructive text-destructive-foreground">
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <Button type="submit" className="h-11 w-full rounded-xl">
            {tr("Hantar Nota")}
          </Button>
        </form>
        <CameraCapture
          open={camOpen}
          onOpenChange={setCamOpen}
          onCapture={(img) => setImages((p) => [...p, img].slice(0, 4))}
          onFallback={() => fileRef.current?.click()}
        />
      </DialogContent>
    </Dialog>
  );
}

function shrinkImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = reject;
    r.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const max = 800;
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * k);
        c.height = Math.round(img.height * k);
        c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", 0.7));
      };
      img.src = String(r.result);
    };
    r.readAsDataURL(file);
  });
}
