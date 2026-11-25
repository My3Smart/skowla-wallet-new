import { useLanguage } from "@/hooks/use-language";
import { localizeNode } from "@/lib/i18n";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertTriangle,
  ArrowRight,
  Bus,
  Flag,
  GraduationCap,
  Loader2,
  MoreVertical,
  Send,
  ShieldAlert,
  Utensils,
  Wallet,
  X,
  Megaphone,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "@/lib/notify";
import { Card, Section } from "@/components/skowla/AppShell";
import { Owl } from "@/components/skowla/Brand";
import { TransferDialog } from "@/components/skowla/ParentDialogs";
import { ParentHeader } from "@/components/skowla/ParentHeader";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { askSkowla } from "@/lib/chat.functions";
import { menuItems } from "@/lib/data";
import { fmtTime } from "@/lib/format";
import { actions, getState, rm, useAppState, type AppState } from "@/lib/store";
import { cn } from "@/lib/utils";
import { getSession } from "@/lib/auth";

export const Route = createFileRoute("/parent/chat")({
  head: () => ({
    meta: [
      { title: "Tanya Skowla AI — Skowla" },
      {
        name: "description",
        content:
          "Ask Skowla AI about balances, canteen menus and school matters, or file a school complaint.",
      },
      { property: "og:title", content: "Tanya Skowla AI — Skowla" },
      { property: "og:description", content: "24/7 AI school assistant for parents." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Chat,
});

const categories = [
  {
    id: "Kantin & Makanan",
    sub: "Kebersihan, harga, kualiti hidangan",
    icon: Utensils,
    tone: "bg-warning-soft text-warning",
  },
  {
    id: "Kemudahan Kelas",
    sub: "Kipas, meja rosak, tandas",
    icon: GraduationCap,
    tone: "bg-primary-soft text-primary",
  },
  {
    id: "Keselamatan & Bas",
    sub: "Bas lewat, pagar, keselamatan",
    icon: Bus,
    tone: "bg-primary-soft text-primary",
  },
  {
    id: "Disiplin & Buli",
    sub: "Tingkah laku & buli",
    icon: ShieldAlert,
    tone: "bg-destructive-soft text-destructive",
  },
] as const;

function buildContext(s: AppState) {
  const kids = s.children
    .map(
      (c) =>
        `- ${c.name} (${c.className}, ${c.school}): baki kad ${rm(c.cardBalance)}, had harian ${rm(c.dailyLimit)}, belanja hari ini ${rm(c.spentToday)}, daftar masuk ${c.checkIn}`,
    )
    .join("\n");
  const tx = s.transactions
    .slice(0, 8)
    .map(
      (t) =>
        `- ${t.at.slice(0, 10)} ${t.title} (${t.subtitle}): ${t.amount > 0 ? "+" : ""}${t.amount.toFixed(2)}`,
    )
    .join("\n");
  const fees = s.invoices
    .map(
      (i) =>
        `- ${s.children.find((c) => c.id === i.childId)?.name ?? i.childId}: ${i.title} ${rm(i.amount)} ${i.paid ? "DIBAYAR" : "TERTUNGGAK"}`,
    )
    .join("\n");
  const menu = menuItems
    .map(
      (m) =>
        `- ${m.name} ${rm(m.price)} (${m.calories} kcal${m.allergens.length ? `, alergen: ${m.allergens.join("/")}` : ""})`,
    )
    .join("\n");
  return `Ibu bapa: ${getSession()?.name ?? "Ibu bapa"}. Baki dompet keluarga: ${rm(s.walletBalance)}.\nAnak:\n${kids}\nTransaksi terkini:\n${tx}\nYuran:\n${fees}\nMenu kantin esok:\n${menu}\nTarikh hari ini: ${new Date().toISOString().slice(0, 10)}`;
}

function Chat() {
  const { t: tr, locale } = useLanguage();
  const state = useAppState();
  const { chat, children } = state;
  const ask = useServerFn(askSkowla);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [panel, setPanel] = useState(false);
  const [cat, setCat] = useState<string | null>(null);
  const [report, setReport] = useState("");
  const [transferOpen, setTransferOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const alya = children.find((c) => c.id === "alya");

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chat.length, busy]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy) return;
    actions.addChatMessage({ role: "user", content });
    setInput("");
    setBusy(true);
    try {
      const s = getState();
      const history = s.chat.slice(-12).map((m) => ({ role: m.role, content: m.content }));
      const res = await ask({
        data: {
          messages: history,
          context: `${buildContext(s)}\nReply entirely in ${s.settings.language}. Do not mix languages. Keep names and amounts unchanged.`,
        },
      });
      actions.addChatMessage({ role: "assistant", content: res.reply });
      if (!res.ok) toast.error(res.reply);
    } catch {
      actions.addChatMessage({
        role: "assistant",
        content: "Maaf, sambungan terputus. Sila cuba lagi.",
      });
    } finally {
      setBusy(false);
    }
  }

  function openPanel() {
    setPanel(true);
    window.setTimeout(
      () => panelRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }),
      50,
    );
  }

  function submitReport() {
    if (!cat) {
      toast.error("Sila pilih kategori aduan.");
      return;
    }
    if (!report.trim()) {
      toast.error("Sila ceritakan ringkas isu anda.");
      return;
    }
    const kid = children[0];
    actions.addComplaint({
      student: kid?.name ?? "Anak",
      form: kid?.className ?? "",
      issue: cat,
      description: report.trim(),
      source: "parent",
    });
    actions.addChatMessage({
      role: "assistant",
      content: `Terima kasih ${getSession()?.shortName ?? ""}. Aduan "${cat}" telah dihantar terus kepada pentadbir & guru bertugas. Anda akan dimaklumkan apabila ada maklum balas.`,
    });
    toast.success("Aduan dihantar");
    setReport("");
    setCat(null);
    setPanel(false);
  }

  return (
    <>
      <ParentHeader subtitle={tr("AI Assistant")} />
      <Section className="mx-auto max-w-3xl space-y-4 pb-44 md:pb-28">
        <div className="flex items-center gap-3">
          <Owl className="size-11" />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 font-bold">
              {tr("Tanya Skowla AI")}
              <span className="rounded-md bg-primary-soft px-1.5 py-0.5 text-[10px] font-bold text-primary">
                {tr("Beta 24/7")}
              </span>
            </p>
            <p className="text-[11px] text-muted-foreground">
              {tr("Fokus: Soalan & Bantuan Sekolah")}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label={tr("Pilihan")}
              className="grid size-9 place-items-center rounded-full hover:bg-muted"
            >
              <MoreVertical className="size-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => actions.clearChat()}>
                {tr("Mulakan perbualan baharu")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={openPanel}>{tr("Buat aduan sekolah")}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="rounded-2xl bg-gradient-amber p-4 shadow-card">
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-full bg-amber-deep text-amber-card">
              <Megaphone className="size-4" />
            </span>
            <p className="flex-1 font-bold text-amber-deep">{tr("Ada Isu di Sekolah?")}</p>
            <span className="rounded-full bg-card px-2 py-0.5 text-[10px] font-bold text-amber-deep">
              {tr("Saluran Aduan")}
            </span>
          </div>
          <p className="mt-2 text-xs text-amber-deep/85">
            {tr(
              "Hantar maklumat balas pantas terus kepada Pentadbir Sekolah, Guru Bertugas, atau Pengurusan Admin.",
            )}
          </p>
          <button
            type="button"
            onClick={openPanel}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-amber-deep px-4 py-2.5 text-xs font-bold text-amber-card"
          >
            <AlertTriangle className="size-4" /> {tr("Buat Aduan Sekolah (School Grievance)")}
          </button>
        </div>

        <div className="space-y-4">
          {localizeNode(
            chat.map((m) => (
              <div key={m.id} className={cn("flex gap-2.5", m.role === "user" && "justify-end")}>
                {localizeNode(
                  m.role === "assistant" && <Owl className="mt-0.5 size-8 shrink-0" />,
                  tr,
                )}
                <div className={cn("max-w-[85%] space-y-2", m.role === "user" && "items-end")}>
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap",
                      m.role === "user"
                        ? "rounded-br-md bg-primary text-primary-foreground"
                        : "rounded-tl-md bg-card shadow-card",
                    )}
                  >
                    {localizeNode(m.content, tr)}
                  </div>
                  {localizeNode(
                    m.card === "alya-balance" && alya && (
                      <Card className="flex items-center gap-3 p-3">
                        <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground">
                          <Wallet className="size-5" />
                        </span>
                        <div className="flex-1">
                          <p className="text-lg font-bold">
                            {localizeNode(rm(alya.cardBalance), tr)}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {tr("Baki Dompet ")}
                            {localizeNode(alya.name.split(" ")[0], tr)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setTransferOpen(true)}
                          className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-3 py-1.5 text-xs font-bold text-primary"
                        >
                          <ArrowRight className="size-3.5" /> {tr("Top Up")}
                        </button>
                      </Card>
                    ),
                    tr,
                  )}
                  <p
                    className={cn(
                      "text-[10px] text-muted-foreground",
                      m.role === "user" && "text-right",
                    )}
                  >
                    {localizeNode(fmtTime(m.at), tr)}
                  </p>
                </div>
              </div>
            )),
            tr,
          )}
          {localizeNode(
            busy && (
              <div className="flex items-center gap-2.5">
                <Owl className="size-8" />
                <div className="flex items-center gap-2 rounded-2xl bg-card px-4 py-2.5 text-sm text-muted-foreground shadow-card">
                  <Loader2 className="size-4 animate-spin" /> {tr("Skowla sedang menaip…")}
                </div>
              </div>
            ),
            tr,
          )}
          <div ref={endRef} />
        </div>

        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {localizeNode(
            [`Semak baki ${getState().children[0]?.name.split(" ")[0] ?? "anak"}`, "Jadual menu kantin esok", "Yuran tertunggak?"].map((q) => (
              <button
                key={q}
                type="button"
                disabled={busy}
                onClick={() => void send(q)}
                className="shrink-0 rounded-full border border-primary/30 bg-primary-soft/60 px-3 py-1.5 text-xs font-semibold text-primary disabled:opacity-50"
              >
                {localizeNode(q, tr)}
              </button>
            )),
            tr,
          )}
        </div>

        {localizeNode(
          panel && (
            <div ref={panelRef}>
              <Card className="p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Flag className="size-5 text-warning" />
                  <div className="flex-1">
                    <p className="font-bold">{tr("Pusat Aduan & Maklum Balas")}</p>
                    <p className="text-[11px] text-muted-foreground">{tr("Pilih kategori")}</p>
                  </div>
                  <button
                    type="button"
                    aria-label={tr("Tutup")}
                    onClick={() => setPanel(false)}
                    className="grid size-8 place-items-center rounded-full hover:bg-muted"
                  >
                    <X className="size-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {localizeNode(
                    categories.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setCat(c.id)}
                        aria-pressed={cat === c.id}
                        className={cn(
                          "rounded-xl border p-3 text-left transition-colors",
                          cat === c.id
                            ? "border-primary bg-primary-soft"
                            : "border-border bg-muted/50 hover:bg-muted",
                        )}
                      >
                        <span
                          className={cn("mb-1.5 grid size-8 place-items-center rounded-lg", c.tone)}
                        >
                          <c.icon className="size-4" />
                        </span>
                        <p className="text-xs font-bold">{localizeNode(c.id, tr)}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {localizeNode(c.sub, tr)}
                        </p>
                      </button>
                    )),
                    tr,
                  )}
                </div>
                <div className="mt-3 flex items-end gap-2">
                  <Textarea
                    value={report}
                    onChange={(e) => setReport(e.target.value)}
                    placeholder={tr("Ceritakan ringkas atau tanya berkaitan…")}
                    className="min-h-11 flex-1 resize-none rounded-xl"
                    rows={2}
                  />
                  <button
                    type="button"
                    onClick={submitReport}
                    className="h-11 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground"
                  >
                    {tr("Hantar")}
                  </button>
                </div>
              </Card>
            </div>
          ),
          tr,
        )}
      </Section>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
        className="fixed inset-x-0 bottom-[64px] z-30 border-t border-border bg-card/95 px-4 py-3 backdrop-blur-md md:bottom-0 md:left-64"
      >
        <div className="mx-auto flex max-w-3xl items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={tr("Tanya Skowla tentang baki, menu, yuran…")}
            aria-label={tr("Mesej")}
            maxLength={2000}
            className="h-11 min-w-0 flex-1 rounded-full border border-border bg-muted/60 px-4 text-sm outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="inline-flex h-11 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground disabled:opacity-50"
          >
            <Send className="size-4" /> {tr("Hantar")}
          </button>
        </div>
      </form>

      <TransferDialog open={transferOpen} onOpenChange={setTransferOpen} childId={alya?.id} />
    </>
  );
}
