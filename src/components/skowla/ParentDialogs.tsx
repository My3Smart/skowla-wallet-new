import { useLanguage } from "@/hooks/use-language";
import { localizeNode } from "@/lib/i18n";
import { CreditCard, QrCode, ScanLine } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "@/lib/notify";
import { Owl } from "@/components/skowla/Brand";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { actions, rm, useAppState } from "@/lib/store";
import { isCbsSession } from "@/lib/auth";
import { transferToDependent } from "@/lib/cbs.functions";
import { cn } from "@/lib/utils";

type Base = { open: boolean; onOpenChange: (v: boolean) => void };

function run(fn: () => void, success: string) {
  try {
    fn();
    toast.success(success);
    return true;
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "Ralat berlaku");
    return false;
  }
}

export function TransferDialog({
  open,
  onOpenChange,
  childId,
}: Base & { childId?: string | undefined }) {
  const { t: tr, locale } = useLanguage();
  const { children, walletBalance } = useAppState();
  const [to, setTo] = useState(childId ?? children[0]?.id ?? "");
  const [amount, setAmount] = useState("10");
  useEffect(() => {
    if (open) {
      setTo(childId ?? children[0]?.id ?? "");
      setAmount("10");
    }
  }, [open, childId, children]);
  const child = children.find((c) => c.id === to);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle>{tr("Hantar Wang")}</DialogTitle>
          <DialogDescription>
            {tr("Pindah dari dompet anda (")}
            {localizeNode(rm(walletBalance), tr)}
            {tr(") ke kad pintar anak.")}
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const amt = Number(amount);
            const token = isCbsSession() ? localStorage.getItem("cbsAccessToken") : null;
            if (token) {
              if (!(amt > 0) || amt > walletBalance) {
                toast.error(tr("Baki dompet tidak mencukupi"));
                return;
              }
              const r = await transferToDependent({
                data: { token, childId: to, amount: amt, note: "Pocket money", idempotencyKey: `TRF-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` },
              });
              if (!r.ok) {
                toast.error(r.error ?? "Transfer failed");
                return;
              }
              actions.cbsTransferDone(to, amt, r.availableBalance ?? null, r.childBalance ?? null);
              toast.success(`${rm(amt)} dihantar kepada ${child?.name ?? "anak"}`);
              onOpenChange(false);
              return;
            }
            if (
              run(
                () => actions.transfer(to, amt),
                `${rm(Number(amount))} dihantar kepada ${child?.name ?? "anak"}`,
              )
            )
              onOpenChange(false);
          }}
        >
          <Select value={to} onValueChange={setTo}>
            <SelectTrigger className="h-11 rounded-xl" aria-label={tr("Pilih anak")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {localizeNode(
                children.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {localizeNode(c.name, tr)} {tr("— ")}
                    {localizeNode(rm(c.cardBalance), tr)}
                  </SelectItem>
                )),
                tr,
              )}
            </SelectContent>
          </Select>
          <div className="grid grid-cols-4 gap-2">
            {localizeNode(
              [5, 10, 20, 50].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setAmount(String(v))}
                  className={cn(
                    "h-10 rounded-xl border text-sm font-semibold",
                    Number(amount) === v
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card",
                  )}
                >
                  {tr("RM")}
                  {localizeNode(v, tr)}
                </button>
              )),
              tr,
            )}
          </div>
          <Input
            type="number"
            min="1"
            step="0.5"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="h-11 rounded-xl"
            aria-label={tr("Jumlah")}
          />
          <Button type="submit" className="h-11 w-full rounded-xl">
            {tr("Hantar ")}
            {localizeNode(rm(Number(amount) || 0), tr)}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function LimitDialog({ open, onOpenChange, childId }: Base & { childId: string }) {
  const { t: tr, locale } = useLanguage();
  const { children } = useAppState();
  const child = children.find((c) => c.id === childId);
  const [limit, setLimit] = useState(child?.dailyLimit ?? 5);
  useEffect(() => {
    if (open && child) setLimit(child.dailyLimit);
  }, [open, child]);
  if (!child) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle>{tr("Ubah Had Belanja")}</DialogTitle>
          <DialogDescription>
            {tr("Had harian kantin untuk ")}
            {localizeNode(child.name, tr)}
            {tr(".")}
          </DialogDescription>
        </DialogHeader>
        <p className="text-center text-4xl font-bold text-primary">{localizeNode(rm(limit), tr)}</p>
        <Slider
          value={[limit]}
          min={1}
          max={30}
          step={0.5}
          onValueChange={(v) => setLimit(v[0] ?? limit)}
          aria-label={tr("Had harian")}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{tr("RM 1")}</span>
          <span>{tr("RM 30")}</span>
        </div>
        <Button
          className="h-11 w-full rounded-xl"
          onClick={() => {
            actions.setDailyLimit(child.id, limit);
            toast.success(`Had harian ${child.name.split(" ")[0]} kini ${rm(limit)}`);
            onOpenChange(false);
          }}
        >
          {tr("Simpan Had")}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export function AddChildDialog({ open, onOpenChange }: Base) {
  const { t: tr, locale } = useLanguage();
  const [name, setName] = useState("");
  const [cls, setCls] = useState("");
  const [school, setSchool] = useState("SK Seri Bintang");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle>{tr("Tambah Anak")}</DialogTitle>
          <DialogDescription>{tr("Daftar anak untuk kad pintar Skowla.")}</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim() || !cls.trim()) {
              toast.error("Sila isi nama dan kelas.");
              return;
            }
            actions.addChild(name.trim(), cls.trim(), school.trim() || "SK Seri Bintang");
            toast.success(`${name.trim()} telah didaftarkan`);
            setName("");
            setCls("");
            onOpenChange(false);
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="cname">{tr("Nama penuh")}</Label>
            <Input
              id="cname"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ccls">{tr("Kelas")}</Label>
            <Input
              id="ccls"
              placeholder={tr("cth. Tahun 2 Bestari")}
              value={cls}
              onChange={(e) => setCls(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="csch">{tr("Sekolah")}</Label>
            <Input
              id="csch"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>
          <Button type="submit" className="h-11 w-full rounded-xl">
            {tr("Daftar")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ScanQrDialog({ open, onOpenChange }: Base) {
  const { t: tr, locale } = useLanguage();
  const [stage, setStage] = useState<"scan" | "pay">("scan");
  const [amount, setAmount] = useState("3.50");
  useEffect(() => {
    if (!open) return;
    setStage("scan");
    const t = window.setTimeout(() => setStage("pay"), 1800);
    return () => window.clearTimeout(t);
  }, [open]);
  const merchant = "Koperasi SMK Seri Bintang";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle>{tr("Scan QR")}</DialogTitle>
          <DialogDescription>
            {localizeNode(
              stage === "scan" ? "Halakan kamera ke kod QR peniaga…" : "Kod QR dikesan",
              tr,
            )}
          </DialogDescription>
        </DialogHeader>
        {localizeNode(
          stage === "scan" ? (
            <div className="relative mx-auto grid aspect-square w-56 place-items-center overflow-hidden rounded-3xl bg-foreground/90">
              <QrCode className="size-28 text-background/30" />
              <ScanLine className="absolute inset-x-6 top-1/2 h-1 w-auto animate-pulse text-primary-glow" />
              <span className="absolute inset-4 rounded-2xl border-2 border-dashed border-primary-glow/70" />
            </div>
          ) : (
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (
                  run(
                    () => actions.payMerchant(merchant, Number(amount)),
                    `Bayaran ${rm(Number(amount))} berjaya`,
                  )
                )
                  onOpenChange(false);
              }}
            >
              <div className="rounded-xl bg-muted p-3 text-sm">
                <p className="text-xs text-muted-foreground">{tr("Peniaga")}</p>
                <p className="font-semibold">{localizeNode(merchant, tr)}</p>
              </div>
              <Input
                type="number"
                min="0.1"
                step="0.1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-11 rounded-xl"
                aria-label={tr("Jumlah")}
              />
              <Button type="submit" className="h-11 w-full rounded-xl">
                {tr("Bayar ")}
                {localizeNode(rm(Number(amount) || 0), tr)}
              </Button>
            </form>
          ),
          tr,
        )}
      </DialogContent>
    </Dialog>
  );
}

export function CardDialog({ open, onOpenChange }: Base) {
  const { t: tr, locale } = useLanguage();
  const { walletBalance } = useAppState();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle>{tr("Kad Saya")}</DialogTitle>
          <DialogDescription>{tr("Kad maya Skowla Pay Direct anda.")}</DialogDescription>
        </DialogHeader>
        <div className="relative aspect-[1.6] overflow-hidden rounded-2xl bg-gradient-primary p-5 text-primary-foreground shadow-elevated">
          <Owl className="absolute -right-4 -bottom-6 size-32 opacity-25" />
          <div className="flex items-center gap-2 text-sm font-semibold">
            <CreditCard className="size-4" /> {tr("Skowla Pay Direct")}
          </div>
          <p className="mt-6 font-mono text-lg tracking-widest">{tr("5248 •••• •••• 4623")}</p>
          <div className="mt-4 flex items-end justify-between text-xs">
            <div>
              <p className="opacity-80">{tr("Pemegang")}</p>
              <p className="text-sm font-semibold">{tr("PUAN SARAH")}</p>
            </div>
            <div className="text-right">
              <p className="opacity-80">{tr("Baki")}</p>
              <p className="text-sm font-semibold">{localizeNode(rm(walletBalance), tr)}</p>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          className="h-11 rounded-xl"
          onClick={() => toast.success("Kad dibekukan sementara")}
        >
          {tr("Bekukan Kad")}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
