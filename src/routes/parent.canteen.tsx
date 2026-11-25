import { useLanguage } from "@/hooks/use-language";
import { localizeNode } from "@/lib/i18n";
import { createFileRoute } from "@tanstack/react-router";
import { Leaf, Lightbulb, Minus, Plus, ShoppingBag, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "@/lib/notify";
import { Card, Section } from "@/components/skowla/AppShell";
import { ParentHeader } from "@/components/skowla/ParentHeader";
import { PersonAvatar } from "@/components/skowla/PersonAvatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { menuItems, type MenuItem } from "@/lib/data";
import { actions, rm, useAppState } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/parent/canteen")({
  head: () => ({
    meta: [
      { title: "Canteen Pre-Order — Skowla" },
      {
        name: "description",
        content: "Pre-order healthy canteen meals for your child, with no spending cap.",
      },
      { property: "og:title", content: "Canteen Pre-Order — Skowla" },
      { property: "og:description", content: "School canteen menu and pre-orders for parents." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Canteen,
});

const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function serveDays() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  return [0, 1, 2, 3, 4, 5, 6].map((i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return {
      key,
      top: DAYS[d.getDay()]!,
      date: `${d.getDate()} ${MONTHS[d.getMonth()]}`,
      status: diff <= 0 ? "Closed" : diff === 1 ? "Pre-Order" : "Open",
      closed: diff <= 0,
    };
  });
}

type Cat = "all" | "healthy" | "bento";

function Canteen() {
  const { t: tr, locale } = useLanguage();
  const { children, dietInfo, transactions } = useAppState();
  const [dietOpen, setDietOpen] = useState(false);
  const [childId, setChildId] = useState(children[0]?.id ?? "");
  const child = children.find((c) => c.id === childId) ?? children[0];
  const days = useMemo(serveDays, []);
  const [day, setDay] = useState((days.find((d) => !d.closed) ?? days[6]!).key);
  const [cat, setCat] = useState<Cat>("all");
  const [diet, setDiet] = useState(false);
  const [noPeanut, setNoPeanut] = useState(true);
  const [noLactose, setNoLactose] = useState(false);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [tipOpen, setTipOpen] = useState(true);

  const selectedDay = days.find((d) => d.key === day)!;
  const filtered = menuItems.filter(
    (m) =>
      (!diet || m.dietApproved) &&
      !(noPeanut && m.allergens.includes("peanut")) &&
      !(noLactose && m.allergens.includes("lactose")),
  );
  const visible = filtered.filter((m) => cat === "all" || m.category === cat);
  const cartItems = menuItems
    .filter((m) => (cart[m.id] ?? 0) > 0)
    .map((m) => ({ ...m, qty: cart[m.id] ?? 0 }));
  const cartTotal = cartItems.reduce((t, i) => t + i.price * i.qty, 0);

  if (!child) return null;
  const info = dietInfo[child.id];
  const firstName = child.name.split(" ")[0] ?? "";
  const nowD = new Date();
  const monthSpent = transactions
    .filter((t) => {
      const d = new Date(t.at);
      return (
        t.kind === "canteen" &&
        t.subtitle.startsWith(firstName) &&
        d.getMonth() === nowD.getMonth() &&
        d.getFullYear() === nowD.getFullYear()
      );
    })
    .reduce((t, x) => t - x.amount, 0);

  function add(m: MenuItem, delta: number) {
    if (selectedDay.closed) {
      toast.error("Tempahan hari ini telah ditutup. Pilih tarikh lain.");
      return;
    }
    setCart((c) => {
      const n = Math.max(0, (c[m.id] ?? 0) + delta);
      const next = { ...c };
      if (n === 0) delete next[m.id];
      else next[m.id] = n;
      return next;
    });
  }

  function confirm() {
    try {
      actions.preOrder(
        child!.id,
        cartItems.map((i) => ({ name: i.name, price: i.price, qty: i.qty })),
      );
      toast.success(`Pra-pesanan untuk ${selectedDay.date} disahkan!`);
      setCart({});
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ralat berlaku");
    }
  }

  return (
    <>
      <ParentHeader subtitle={tr("Canteen")} />
      <Section className="grid grid-cols-1 gap-5 pb-24 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)] md:gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Select
              value={child.id}
              onValueChange={(v) => {
                setChildId(v);
                setCart({});
              }}
            >
              <SelectTrigger
                className="h-12 flex-1 rounded-2xl bg-card"
                aria-label={tr("Pilih anak")}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <PersonAvatar name={child.name} photo={child.photo} className="size-8" />
                  <div className="min-w-0 text-left leading-tight">
                    <p className="text-[10px] text-muted-foreground">{tr("Memesan untuk")}</p>
                    <p className="truncate text-sm font-bold">
                      <SelectValue />
                    </p>
                  </div>
                </div>
              </SelectTrigger>
              <SelectContent>
                {localizeNode(
                  children.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {localizeNode(c.name, tr)}
                    </SelectItem>
                  )),
                  tr,
                )}
              </SelectContent>
            </Select>
            <button
              type="button"
              onClick={() => setDietOpen(true)}
              className={cn(
                "flex h-12 shrink-0 items-center gap-1.5 rounded-2xl px-3 text-xs font-semibold transition-colors",
                info ? "bg-primary text-primary-foreground" : "bg-warning-soft text-warning",
              )}
            >
              <Leaf className="size-4" />{" "}
              {localizeNode(info ? "Diet Approved" : "Update Diet Info", tr)}
            </button>
          </div>

          <Card className="p-4">
            <p className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
              {tr("Total Monthly Spent")}
            </p>
            <div className="mt-1 flex items-end justify-between gap-2">
              <p className="text-3xl font-extrabold">{localizeNode(rm(monthSpent), tr)}</p>
              <span className="rounded-full bg-primary-soft px-2 py-1 text-[11px] font-bold text-primary">
                {localizeNode(
                  nowD.toLocaleDateString(locale, { month: "long", year: "numeric" }),
                  tr,
                )}
              </span>
            </div>
            {localizeNode(
              cartTotal > 0 && (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {tr("+ ")}
                  {localizeNode(rm(cartTotal), tr)} {tr("in this pre-order")}
                </p>
              ),
              tr,
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
              <span className="text-muted-foreground">{tr("Allergen:")}</span>
              <button
                type="button"
                aria-pressed={noPeanut}
                onClick={() => setNoPeanut((v) => !v)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-2 py-1 font-semibold",
                  noPeanut
                    ? "bg-destructive-soft text-destructive"
                    : "bg-muted text-muted-foreground line-through",
                )}
              >
                <X className="size-3" /> {tr("No Peanuts")}
              </button>
              <button
                type="button"
                aria-pressed={noLactose}
                onClick={() => setNoLactose((v) => !v)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-2 py-1 font-semibold",
                  noLactose ? "bg-warning-soft text-warning" : "bg-muted text-muted-foreground",
                )}
              >
                {tr("• Lactose Intolerant")}
              </button>
            </div>
          </Card>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-bold">{tr("Select Serving Date")}</h3>
              <span className="text-[11px] font-semibold text-primary">
                {tr("Cut-off 12:00 AM (Midnight) Daily")}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {localizeNode(
                days.map((d) => (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => {
                      setDay(d.key);
                      setCart({});
                    }}
                    className={cn(
                      "rounded-2xl border px-2 py-2.5 text-center transition-colors",
                      day === d.key
                        ? "border-primary bg-gradient-primary text-primary-foreground shadow-elevated"
                        : "border-border bg-card hover:bg-muted",
                    )}
                  >
                    <p className="text-[11px] font-semibold opacity-80">
                      {localizeNode(d.top, tr)}
                    </p>
                    <p className="text-base font-bold">{localizeNode(d.date, tr)}</p>
                    <p className="text-[10px] opacity-80">{localizeNode(d.status, tr)}</p>
                  </button>
                )),
                tr,
              )}
            </div>
          </div>

          {localizeNode(
            tipOpen && (
              <Card className="relative hidden bg-primary-soft/70 p-4 md:flex md:items-start md:gap-3">
                <Lightbulb className="mt-0.5 size-5 shrink-0 text-primary" />
                <div className="text-sm">
                  <p className="font-bold">{tr("Wise Owl Parent Tip")}</p>
                  <p className="text-muted-foreground">
                    {tr(
                      "Pra-pesan sebelum 7:00 pagi untuk mengelak barisan panjang & dapat menu pilihan.",
                    )}
                  </p>
                </div>
              </Card>
            ),
            tr,
          )}
        </div>

        <div className="space-y-3">
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
            {localizeNode(
              (
                [
                  ["all", `All Items (${filtered.length})`],
                  ["healthy", "Healthy Set"],
                  ["bento", "Bento Box"],
                ] as const
              ).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setCat(k)}
                  className={cn(
                    "h-9 shrink-0 rounded-full px-4 text-xs font-semibold",
                    cat === k
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-card hover:bg-muted",
                  )}
                >
                  {localizeNode(label, tr)}
                </button>
              )),
              tr,
            )}
          </div>

          {localizeNode(
            visible.length === 0 && (
              <Card className="p-6 text-center text-sm text-muted-foreground">
                {tr("Tiada item sepadan dengan penapis.")}
              </Card>
            ),
            tr,
          )}
          <div className="grid gap-3 lg:grid-cols-2">
            {localizeNode(
              visible.map((m) => {
                const qty = cart[m.id] ?? 0;
                return (
                  <Card
                    key={m.id}
                    className={cn("flex gap-3 p-3", selectedDay.closed && "opacity-60")}
                  >
                    <img
                      src={m.photo}
                      alt={localizeNode(m.name, tr)}
                      loading="lazy"
                      className="size-24 shrink-0 rounded-xl object-cover"
                    />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-center gap-2 text-[10px] font-semibold">
                        <span className="rounded bg-success-soft px-1.5 py-0.5 text-success">
                          {localizeNode(m.tag, tr)}
                        </span>
                        <span className="text-muted-foreground">
                          {localizeNode(m.calories, tr)} {tr("kcal")}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm font-bold">
                        {localizeNode(m.name, tr)}
                      </p>
                      {localizeNode(
                        m.allergens.length > 0 && (
                          <p className="text-[10px] text-warning">
                            {tr("Mengandungi:")}
                            {localizeNode(" ", tr)}
                            {localizeNode(
                              m.allergens
                                .map((a) => (a === "peanut" ? "kacang" : "laktosa"))
                                .join(", "),
                              tr,
                            )}
                          </p>
                        ),
                        tr,
                      )}
                      <div className="mt-auto flex items-center justify-between pt-1">
                        <span className="text-base font-extrabold text-primary">
                          {localizeNode(rm(m.price), tr)}
                        </span>
                        {localizeNode(
                          qty === 0 ? (
                            <button
                              type="button"
                              aria-label={localizeNode(`Tambah ${m.name}`, tr)}
                              onClick={() => add(m, 1)}
                              className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground shadow-elevated"
                            >
                              <Plus className="size-4" />
                            </button>
                          ) : (
                            <div className="flex items-center gap-2 rounded-full bg-primary-soft p-0.5">
                              <button
                                type="button"
                                aria-label={tr("Kurang")}
                                onClick={() => add(m, -1)}
                                className="grid size-7 place-items-center rounded-full bg-card"
                              >
                                <Minus className="size-3.5" />
                              </button>
                              <span className="w-4 text-center text-sm font-bold">
                                {localizeNode(qty, tr)}
                              </span>
                              <button
                                type="button"
                                aria-label={tr("Tambah")}
                                onClick={() => add(m, 1)}
                                className="grid size-7 place-items-center rounded-full bg-primary text-primary-foreground"
                              >
                                <Plus className="size-3.5" />
                              </button>
                            </div>
                          ),
                          tr,
                        )}
                      </div>
                    </div>
                  </Card>
                );
              }),
              tr,
            )}
          </div>

          {localizeNode(
            tipOpen && (
              <Card className="relative flex items-start gap-3 bg-primary-soft/70 p-4 md:hidden">
                <Lightbulb className="mt-0.5 size-5 shrink-0 text-primary" />
                <div className="text-sm">
                  <p className="font-bold">{tr("Wise Owl Parent Tip")}</p>
                  <p className="text-muted-foreground">
                    {tr(
                      "Pra-pesan sebelum 7:00 pagi untuk mengelak barisan panjang & dapat menu pilihan.",
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={tr("Tutup tip")}
                  onClick={() => setTipOpen(false)}
                  className="absolute top-2 right-2 text-muted-foreground"
                >
                  <X className="size-4" />
                </button>
              </Card>
            ),
            tr,
          )}
        </div>
      </Section>

      {localizeNode(
        cartItems.length > 0 && (
          <div className="fixed inset-x-0 bottom-[64px] z-30 px-4 md:bottom-6 md:left-64 md:px-8">
            <div className="mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-foreground p-3 pl-4 text-background shadow-elevated md:max-w-xl">
              <ShoppingBag className="size-5 shrink-0" />
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-bold">
                  {localizeNode(
                    cartItems.reduce((t, i) => t + i.qty, 0),
                    tr,
                  )}{" "}
                  {tr("item • ")}
                  {localizeNode(rm(cartTotal), tr)}
                </p>
                <p className="truncate text-xs opacity-75">
                  {localizeNode(child.name.split(" ")[0], tr)} {tr("• ")}
                  {localizeNode(selectedDay.date, tr)}
                </p>
              </div>
              <Button onClick={confirm} className="h-10 rounded-xl">
                {tr("Sahkan Pra-Pesan")}
              </Button>
            </div>
          </div>
        ),
        tr,
      )}
      <DietDialog
        key={child.id + String(dietOpen)}
        open={dietOpen}
        onOpenChange={setDietOpen}
        childName={child.name}
        initial={info}
        onSave={(v) => {
          actions.setDietInfo(child.id, v);
          setNoPeanut(v.allergies.includes("Peanuts"));
          setNoLactose(v.allergies.some((a) => a.startsWith("Lactose")));
          setDiet(true);
          setCart({});
          toast.success("Maklumat diet disimpan");
          setDietOpen(false);
        }}
      />
    </>
  );
}

const ALLERGENS = ["Peanuts", "Lactose Intolerant", "Seafood", "Egg", "Gluten", "Soy", "Other", "No Allergy"];

function DietDialog({
  open,
  onOpenChange,
  childName,
  initial,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  childName: string;
  initial: { allergies: string[]; notes: string } | undefined;
  onSave: (v: { allergies: string[]; notes: string }) => void;
}) {
  const { t: tr, locale } = useLanguage();
  const [allergies, setAllergies] = useState<string[]>(initial?.allergies ?? []);
  const [notes, setNotes] = useState(initial?.notes ?? "");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle>{tr("Allergy Information")}</DialogTitle>
          <DialogDescription>
            {tr("Maklumat alahan & diet untuk ")}
            {localizeNode(childName, tr)}
            {tr(".")}
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSave({ allergies, notes: notes.trim() });
          }}
        >
          <div className="grid grid-cols-2 gap-2">
            {localizeNode(
              ALLERGENS.map((a) => (
                <label
                  key={a}
                  className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm"
                >
                  <Checkbox
                    checked={allergies.includes(a)}
                    onCheckedChange={(v) =>
                      setAllergies((cur) =>
                        !v
                          ? cur.filter((x) => x !== a)
                          : a === "No Allergy"
                            ? ["No Allergy"]
                            : [...cur.filter((x) => x !== "No Allergy"), a],
                      )
                    }
                  />
                  {localizeNode(a, tr)}
                </label>
              )),
              tr,
            )}
          </div>
          <Textarea
            required={allergies.includes("Other")}
            placeholder={tr(
              allergies.includes("Other")
                ? "Please state the other allergy"
                : "Other allergies or diet notes (optional)",
            )}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-20 rounded-xl"
          />
          <Button type="submit" className="h-11 w-full rounded-xl">
            {tr("Save Diet Info")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
