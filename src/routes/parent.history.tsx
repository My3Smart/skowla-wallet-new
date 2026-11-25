import { useLanguage } from "@/hooks/use-language";
import { localizeNode } from "@/lib/i18n";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Download,
  Landmark,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Utensils,
  Wallet,
  Zap,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "@/lib/notify";
import { Card, Section } from "@/components/skowla/AppShell";
import { SchoolShop } from "@/components/skowla/SchoolShop";
import { ParentHeader } from "@/components/skowla/ParentHeader";
import { PersonAvatar } from "@/components/skowla/PersonAvatar";
import { StatusPill } from "@/components/skowla/StatusPill";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import type { TxKind } from "@/lib/data";
import { fmtDate, fmtTime } from "@/lib/format";
import { useParentProfile } from "@/hooks/use-parent-profile";
import { actions, rm, useAppState } from "@/lib/store";
import { confirmWalletReload, initiateWalletReload } from "@/lib/cbs.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/parent/history")({
  head: () => ({
    meta: [
      { title: "Funds + Shop — Skowla" },
      {
        name: "description",
        content: "Manage Skowla wallet funds, review transactions and buy school supplies.",
      },
      { property: "og:title", content: "Funds + Shop — Skowla" },
      {
        property: "og:description",
        content: "Wallet funds, transaction records and school shop purchases.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: History,
});

const amounts = [20, 50, 100, 200];
const methods = [
  {
    id: "FPX",
    label: "FPX Perbankan Internet",
    sub: "Maybank2u, CIMB Clicks, RHB & lain-lain",
    icon: Landmark,
  },
  {
    id: "DuitNow QR",
    label: "DuitNow QR Kebangsaan",
    sub: "Imbas dengan mana-mana aplikasi bank",
    icon: QrCode,
  },
  {
    id: "Kad",
    label: "Kad Debit / Kredit",
    sub: "Visa, Mastercard • disimpan dengan selamat",
    icon: CreditCard,
  },
] as const;

const filters: { id: "all" | TxKind; label: string }[] = [
  { id: "all", label: "Semua" },
  { id: "topup", label: "Top Up" },
  { id: "canteen", label: "Kantin Sekolah" },
  { id: "transfer", label: "Pemindahan" },
  { id: "fees", label: "Yuran" },
  { id: "shop", label: "Shop" },
];

const txIcon: Record<TxKind, typeof Wallet> = {
  topup: ArrowDownLeft,
  canteen: Utensils,
  transfer: ArrowUpRight,
  fees: Building2,
  shop: Wallet,
};

function History() {
  const me = useParentProfile();
  const { t: tr, locale } = useLanguage();
  const { walletBalance, children, transactions, autoReload } = useAppState();
  const [amount, setAmount] = useState(50);
  const [custom, setCustom] = useState("50.00");
  const [method, setMethod] = useState<(typeof methods)[number]["id"]>("FPX");
  const [filter, setFilter] = useState<(typeof filters)[number]["id"]>("all");
  const [processing, setProcessing] = useState<"idle" | "busy" | "pay" | "done">("idle");
  const [reload, setReload] = useState<{ reference: string; checkoutUrl: string } | null>(null);

  const canteenToday = children.reduce((t, c) => t + c.spentToday, 0);
  const list = transactions.filter((t) => filter === "all" || t.kind === filter);

  function pick(v: number) {
    setAmount(v);
    setCustom(v.toFixed(2));
  }

  const methodLabel =
    method === "FPX" ? "Maybank FPX" : method === "Kad" ? "Kad Debit/Kredit" : "DuitNow QR";

  async function topUp() {
    if (!(amount >= 5)) {
      toast.error("Minimum tambah nilai ialah RM 5.00");
      return;
    }
    const token = window.localStorage.getItem("cbsAccessToken");
    if (!token) {
      // Demo account: simulated payment.
      setProcessing("busy");
      window.setTimeout(() => {
        actions.topUp(amount, methodLabel);
        setProcessing("done");
      }, 1400);
      return;
    }
    setProcessing("busy");
    const walletNumber = window.localStorage.getItem("cbsWalletNumber") ?? undefined;
    const r = await initiateWalletReload({
      data: { token, amount, ...(walletNumber ? { walletNumber } : {}) },
    }).catch(() => null);
    if (!r?.ok || !r.checkoutUrl || !r.reference) {
      setProcessing("idle");
      toast.error(r?.error ?? "Top-up failed. Please try again.");
      return;
    }
    setReload({ reference: r.reference, checkoutUrl: r.checkoutUrl });
    window.open(r.checkoutUrl, "_blank", "noopener");
    setProcessing("pay");
  }

  async function confirmReload() {
    if (!reload) return;
    const token = window.localStorage.getItem("cbsAccessToken") ?? undefined;
    setProcessing("busy");
    const r = await confirmWalletReload({
      data: { reference: reload.reference, ...(token ? { token } : {}) },
    }).catch(() => null);
    if (!r?.ok || (r.status && !["SUCCEEDED", "SUCCESS"].includes(r.status))) {
      setProcessing("pay");
      toast.error(r?.error ?? "Bayaran belum disahkan. Sila cuba lagi.");
      return;
    }
    actions.confirmedReload(amount, methodLabel, r.availableBalance ?? null);
    setReload(null);
    setProcessing("done");
  }

  function downloadStatement() {
    const rows = [["Tarikh", "Masa", "Butiran", "Keterangan", "Jumlah (RM)"]].concat(
      transactions.map((t) => [
        fmtDate(t.at),
        fmtTime(t.at),
        t.title,
        t.subtitle,
        t.amount.toFixed(2),
      ]),
    );
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "skowla-penyata-dompet.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Penyata dimuat turun");
  }

  return (
    <>
      <ParentHeader subtitle={tr("Funds + Shop")} />
      <Section className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-8">
        <div className="space-y-4">
          <Card className="flex items-center gap-3 p-3">
            <PersonAvatar name={me.name} photo={me.photo} className="size-11" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                {tr("Akaun Keluarga Panjar")}
              </p>
              <p className="flex items-center gap-2 text-sm font-bold">
                {me.name}{" "}
                <StatusPill tone="info">
                  {localizeNode(children.length, tr)} {tr("Anak Aktif")}
                </StatusPill>
              </p>
            </div>
            <ShieldCheck className="size-5 text-primary" />
          </Card>

          <div className="rounded-3xl bg-gradient-primary p-5 text-primary-foreground shadow-elevated">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-xs font-medium opacity-90">
                <Wallet className="size-4" /> {tr("Baki Dalam Dompet")}
              </p>
              <ShieldCheck className="size-5 opacity-80" />
            </div>
            <p className="mt-2 text-4xl font-extrabold tracking-tight">
              {localizeNode(rm(walletBalance), tr)}
            </p>
            <div className="mt-4 flex items-center justify-between gap-2 border-t border-primary-foreground/20 pt-3 text-xs">
              <span className="opacity-90">
                {tr("Perbelanjaan Canteen Hari Ini: ")}
                <b>{localizeNode(rm(canteenToday), tr)}</b>
              </span>
              <Link to="/parent" className="inline-flex items-center gap-0.5 font-semibold">
                {tr("Kad Kanak-kanak ")}
                <ChevronRight className="size-4" />
              </Link>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-bold">{tr("Pilih Jumlah Tambah Nilai")}</h3>
            <div className="grid grid-cols-4 gap-2">
              {localizeNode(
                amounts.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => pick(v)}
                    className={cn(
                      "relative h-11 rounded-xl border text-sm font-bold transition-colors",
                      amount === v
                        ? "border-primary bg-primary text-primary-foreground shadow-elevated"
                        : "border-border bg-card hover:bg-muted",
                    )}
                  >
                    {localizeNode(
                      v === 50 && (
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded bg-warning px-1.5 text-[9px] font-bold text-primary-foreground">
                          {tr("POPULAR")}
                        </span>
                      ),
                      tr,
                    )}
                    {tr("RM ")}
                    {localizeNode(v, tr)}
                  </button>
                )),
                tr,
              )}
            </div>
            <label className="mt-3 flex h-12 items-center gap-2 rounded-xl border border-border bg-card px-4">
              <span className="text-sm font-bold">{tr("RM")}</span>
              <input
                inputMode="decimal"
                value={custom}
                onChange={(e) => {
                  setCustom(e.target.value);
                  setAmount(Number(e.target.value) || 0);
                }}
                aria-label={tr("Jumlah lain")}
                className="min-w-0 flex-1 bg-transparent text-lg font-bold outline-none"
              />
              {localizeNode(
                custom && (
                  <button
                    type="button"
                    aria-label={tr("Kosongkan")}
                    onClick={() => {
                      setCustom("");
                      setAmount(0);
                    }}
                    className="text-muted-foreground"
                  >
                    <X className="size-4" />
                  </button>
                ),
                tr,
              )}
            </label>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase">{tr("Kaedah Pembayaran")}</h3>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-primary">
                <ShieldCheck className="size-3.5" /> {tr("Selamat & disulitkan")}
              </span>
            </div>
            <Card className="divide-y divide-border overflow-hidden">
              {localizeNode(
                methods.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethod(m.id)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted"
                  >
                    <span className="grid size-9 place-items-center rounded-xl bg-primary-soft text-primary">
                      <m.icon className="size-[18px]" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{localizeNode(m.label, tr)}</p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {localizeNode(m.sub, tr)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "grid size-5 place-items-center rounded-full border-2",
                        method === m.id ? "border-primary" : "border-border",
                      )}
                      aria-hidden
                    >
                      {localizeNode(
                        method === m.id && <span className="size-2.5 rounded-full bg-primary" />,
                        tr,
                      )}
                    </span>
                  </button>
                )),
                tr,
              )}
              <label className="flex cursor-pointer items-center gap-3 px-4 py-3">
                <span className="grid size-9 place-items-center rounded-xl bg-primary-soft text-primary">
                  <RefreshCw className="size-[18px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{tr("Auto-Reload Pintar")}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {tr("Tambah RM50 apabila baki &lt; RM20")}
                  </p>
                </div>
                <Switch
                  checked={autoReload}
                  onCheckedChange={(v) => {
                    actions.setAutoReload(v);
                    toast.success(v ? "Auto-Reload diaktifkan" : "Auto-Reload dimatikan");
                  }}
                />
              </label>
            </Card>
          </div>

          <Button
            onClick={topUp}
            className="h-14 w-full rounded-2xl bg-gradient-primary text-base font-bold shadow-elevated"
          >
            <Zap className="size-5" /> {tr("Tambah Nilai Sekarang - ")}
            {localizeNode(rm(amount || 0), tr)}
          </Button>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <h3 className="text-sm font-bold">{tr("Rekod & Pengurusan Dompet")}</h3>
            <button
              type="button"
              onClick={downloadStatement}
              className="inline-flex items-center gap-1 rounded-lg bg-primary-soft px-2 py-1 text-[11px] font-semibold text-primary"
            >
              <Download className="size-3.5" /> {tr("Penyata")}
            </button>
          </div>
          <p className="mb-3 text-[11px] text-muted-foreground">
            {tr("Semua transaksi dompet keluarga anda")}
          </p>
          <div className="no-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
            {localizeNode(
              filters.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    "h-8 shrink-0 rounded-full px-3.5 text-xs font-semibold",
                    filter === f.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  {localizeNode(f.label, tr)}
                </button>
              )),
              tr,
            )}
          </div>
          <Card className="divide-y divide-border">
            {localizeNode(
              list.length === 0 && (
                <p className="p-6 text-center text-sm text-muted-foreground">
                  {tr("Tiada transaksi.")}
                </p>
              ),
              tr,
            )}
            {localizeNode(
              list.map((t) => {
                const I = txIcon[t.kind];
                return (
                  <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
                      <I className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{localizeNode(t.title, tr)}</p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {localizeNode(fmtDate(t.at), tr)}
                        {tr(", ")}
                        {localizeNode(fmtTime(t.at), tr)} {tr("• ")}
                        {localizeNode(t.subtitle, tr)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 text-sm font-bold",
                        t.amount > 0 ? "text-success" : "text-foreground",
                      )}
                    >
                      {localizeNode(t.amount > 0 ? "+" : "-", tr)}
                      {localizeNode(rm(Math.abs(t.amount)), tr)}
                    </span>
                  </div>
                );
              }),
              tr,
            )}
          </Card>
          <SchoolShop />
        </div>
      </Section>

      <Dialog
        open={processing !== "idle"}
        onOpenChange={(v) => !v && processing !== "busy" && setProcessing("idle")}
      >
        <DialogContent className="max-w-sm rounded-2xl text-center">
          <DialogHeader className="items-center">
            {localizeNode(
              processing === "busy" ? (
                <span className="size-14 animate-spin rounded-full border-4 border-primary-soft border-t-primary" />
              ) : (
                <CheckCircle2 className="size-14 text-success" />
              ),
              tr,
            )}
            <DialogTitle>
              {localizeNode(
                processing === "busy"
                  ? "Memproses pembayaran…"
                  : processing === "pay"
                    ? "Lengkapkan pembayaran"
                    : "Tambah nilai berjaya!",
                tr,
              )}
            </DialogTitle>
            <DialogDescription>
              {localizeNode(
                processing === "pay"
                  ? `Rujukan ${reload?.reference ?? ""}. Selesaikan bayaran di halaman pembayaran, kemudian tekan Sahkan Bayaran.`
                  : processing === "busy"
                  ? `Menghubungi ${method === "FPX" ? "FPX" : method === "Kad" ? "rangkaian kad" : "DuitNow"} dengan selamat.`
                  : `${rm(amount)} telah ditambah. Baki baharu: ${rm(walletBalance)}`,
                tr,
              )}
            </DialogDescription>
          </DialogHeader>
          {processing === "pay" && reload && (
            <div className="grid gap-2">
              <Button asChild variant="outline" className="h-11 rounded-xl">
                <a href={reload.checkoutUrl} target="_blank" rel="noopener noreferrer">
                  {tr("Buka Halaman Pembayaran")}
                </a>
              </Button>
              <Button className="h-11 rounded-xl" onClick={confirmReload}>
                {tr("Sahkan Bayaran")}
              </Button>
            </div>
          )}
          {localizeNode(
            processing === "done" && (
              <Button className="h-11 rounded-xl" onClick={() => setProcessing("idle")}>
                {tr("Selesai")}
              </Button>
            ),
            tr,
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
