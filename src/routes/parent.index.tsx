import { useLanguage } from "@/hooks/use-language";
import { localizeNode } from "@/lib/i18n";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  CircleDollarSign,
  CreditCard,
  MoreHorizontal,
  Plus,
  Send,
  Settings2,
  ArrowLeftRight,
  Sparkles,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { Card, Section } from "@/components/skowla/AppShell";
import { Owl } from "@/components/skowla/Brand";
import {
  AddChildDialog,
  CardDialog,
  LimitDialog,
  TransferDialog,
} from "@/components/skowla/ParentDialogs";
import { ParentHeader } from "@/components/skowla/ParentHeader";
import { PersonAvatar } from "@/components/skowla/PersonAvatar";
import { StatusPill } from "@/components/skowla/StatusPill";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { rm, useAppState } from "@/lib/store";

export const Route = createFileRoute("/parent/")({
  head: () => ({
    meta: [
      { title: "Wallet Home — Skowla" },
      {
        name: "description",
        content:
          "Your Skowla family wallet: balance, children's smart cards, limits and transfers.",
      },
      { property: "og:title", content: "Wallet Home — Skowla" },
      { property: "og:description", content: "Family school wallet for parents." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WalletHome,
});

function WalletHome() {
  const { t: tr, locale } = useLanguage();
  const { walletBalance, children } = useAppState();
  const navigate = useNavigate();
  const [transferFor, setTransferFor] = useState<string | undefined>();
  const [transferOpen, setTransferOpen] = useState(false);
  const [limitFor, setLimitFor] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);

  const actionsRow = [
    { label: "Top Up", icon: Plus, onClick: () => void navigate({ to: "/parent/history" }) },
    {
      label: "Transfer",
      icon: Send,
      onClick: () => {
        setTransferFor(undefined);
        setTransferOpen(true);
      },
    },
    { label: "Kad Saya", icon: CreditCard, onClick: () => setCardOpen(true) },
  ];

  return (
    <>
      <ParentHeader menu />
      <Section className="grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:gap-8">
        <div className="space-y-5">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-primary p-5 text-primary-foreground shadow-elevated">
            <div className="pointer-events-none absolute -top-16 -right-10 size-48 rounded-full bg-primary-foreground/10" />
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/15 px-2.5 py-1 text-[11px] font-semibold">
                <Wallet className="size-3.5" /> {tr("Skowla Pay Direct")}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label={tr("Lagi")}
                  className="rounded-full p-1 hover:bg-primary-foreground/15"
                >
                  <MoreHorizontal className="size-5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => void navigate({ to: "/parent/history" })}>
                    {tr("Lihat sejarah")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCardOpen(true)}>
                    {tr("Kad Saya")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <p className="mt-4 text-xs font-medium opacity-90">{tr("Baki Terkumpul Ibu Bapa")}</p>
            <p className="text-4xl font-extrabold tracking-tight">
              <span className="mr-1 text-lg font-bold">{tr("RM")}</span>
              {localizeNode(
                walletBalance.toLocaleString(locale, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }),
                tr,
              )}
            </p>
            <div className="mt-5 grid grid-cols-4 gap-2">
              {localizeNode(
                actionsRow.map((a) => (
                  <button
                    key={a.label}
                    type="button"
                    onClick={a.onClick}
                    className="group flex flex-col items-center gap-1.5 text-[11px] font-semibold"
                  >
                    <span className="grid size-11 place-items-center rounded-full bg-primary-foreground/20 transition-colors group-hover:bg-primary-foreground/30">
                      <a.icon className="size-5" />
                    </span>
                    {localizeNode(a.label, tr)}
                  </button>
                )),
                tr,
              )}
            </div>
          </div>

          <Card className="flex items-center gap-3 bg-primary-soft/70 p-4">
            <Owl className="size-14 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-sm font-bold">
                {tr("Peringatan Pintar ")}
                <Sparkles className="size-3.5 text-primary" />
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {tr("Aliman telah guna 40% had harian di kafeteria. Mahu semak menu sihat esok?").replace("Aliman", children[0]?.name.split(" ")[0] ?? "Aliman")}
              </p>
              <Link
                to="/parent/chat"
                className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
              >
                <Send className="size-3.5" /> {tr("Tanya Skowla AI")}
              </Link>
            </div>
          </Card>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-base font-bold">{tr("Anak-anak Berdaftar")}</h2>
            <StatusPill tone="info">
              {localizeNode(children.length, tr)} {tr("Anak")}
            </StatusPill>
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="ml-auto inline-flex items-center gap-1 text-sm font-semibold text-primary"
            >
              <Plus className="size-4" /> {tr("Tambah")}
            </button>
          </div>
          <div className="space-y-3">
            {localizeNode(
              children.map((c) => {
                const pct = Math.min(100, c.dailyLimit > 0 ? (c.spentToday / c.dailyLimit) * 100 : 0);
                return (
                  <Card key={c.id} className="p-4">
                    <div className="flex items-center gap-3">
                      <PersonAvatar name={c.name} photo={c.photo} className="size-11" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold">{localizeNode(c.name, tr)}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {localizeNode(c.className, tr)}
                        </p>
                      </div>
                      <StatusPill tone="success" className="gap-1">
                        <span className="size-1.5 rounded-full bg-success" />{" "}
                        {localizeNode(c.lastSeen, tr)}
                      </StatusPill>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{tr("Baki Kad Pintar:")}</span>
                      <span className="text-lg font-bold text-primary">
                        {localizeNode(rm(c.cardBalance), tr)}
                      </span>
                    </div>
                    <Progress value={pct} className="mt-2 h-1.5" />
                    <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground">
                      <span>
                        {tr("Belanja Hari Ini: ")}
                        {localizeNode(rm(c.spentToday), tr)}
                      </span>
                      <span>
                        {tr("Had Harian: ")}
                        {localizeNode(rm(c.dailyLimit), tr)}
                      </span>
                    </div>
                    <div className="mt-3 flex justify-between gap-2 border-t border-border pt-3 text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => setLimitFor(c.id)}
                        className="inline-flex items-center gap-1.5 text-primary hover:underline"
                      >
                        <Settings2 className="size-4" /> {tr("Ubah Had Belanja")}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTransferFor(c.id);
                          setTransferOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 text-primary hover:underline"
                      >
                        <ArrowLeftRight className="size-4" /> {tr("Hantar Wang")}
                      </button>
                    </div>
                  </Card>
                );
              }),
              tr,
            )}
            {localizeNode(
              children.length === 0 && (
                <Card className="p-6 text-center text-sm text-muted-foreground">
                  <CircleDollarSign className="mx-auto mb-2 size-6" />{" "}
                  {tr("Tiada anak berdaftar lagi.")}
                </Card>
              ),
              tr,
            )}
          </div>
        </div>
      </Section>

      <TransferDialog open={transferOpen} onOpenChange={setTransferOpen} childId={transferFor} />
      {localizeNode(
        limitFor && (
          <LimitDialog
            open={!!limitFor}
            onOpenChange={(v) => !v && setLimitFor(null)}
            childId={limitFor}
          />
        ),
        tr,
      )}
      <AddChildDialog open={addOpen} onOpenChange={setAddOpen} />
      <CardDialog open={cardOpen} onOpenChange={setCardOpen} />
    </>
  );
}
