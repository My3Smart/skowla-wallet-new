import { useLanguage } from "@/hooks/use-language";
import { localizeNode } from "@/lib/i18n";
import { useState } from "react";
import { BookOpen, CheckCircle2, Minus, Pencil, Plus, Shirt, ShoppingBag, Tag } from "lucide-react";
import { toast } from "@/lib/notify";
import { Card } from "@/components/skowla/AppShell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { actions, rm, useAppState } from "@/lib/store";

const products = [
  {
    id: "uniform",
    name: "School Uniform",
    detail: "White school shirt · size M",
    price: 35,
    icon: Shirt,
    tone: "bg-primary-soft text-primary",
  },
  {
    id: "stationery",
    name: "Stationery Set",
    detail: "Pencils, eraser and ruler",
    price: 8,
    icon: Pencil,
    tone: "bg-warning-soft text-warning",
  },
  {
    id: "books",
    name: "Exercise Books",
    detail: "A5 lined books · pack of 5",
    price: 5,
    icon: BookOpen,
    tone: "bg-success-soft text-success",
  },
  {
    id: "tie",
    name: "School Tie",
    detail: "Standard school tie",
    price: 10,
    icon: Tag,
    tone: "bg-primary-soft text-primary",
  },
] as const;
type Product = (typeof products)[number];

export function SchoolShop() {
  const { t: tr, locale } = useLanguage();
  const { walletBalance } = useAppState();
  const [selected, setSelected] = useState<Product | null>(null);
  const [qty, setQty] = useState(1);
  const [receipt, setReceipt] = useState<{ name: string; quantity: number; total: number } | null>(
    null,
  );
  const total = (selected?.price ?? 0) * qty;
  const insufficient = total > walletBalance;

  return (
    <section className="mt-6 space-y-3" aria-labelledby="school-shop-title">
      <div className="flex items-center justify-between gap-2">
        <h3 id="school-shop-title" className="flex items-center gap-2 text-base font-bold">
          <ShoppingBag className="size-5 text-primary" />
          {tr("School Shop")}
        </h3>
        <span className="text-[10px] font-semibold text-muted-foreground">
          {tr("Demo catalog")}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {localizeNode(
          products.map((product) => (
            <Card key={product.id} className="flex flex-col p-3">
              <div className={`mb-3 grid h-20 place-items-center rounded-xl ${product.tone}`}>
                <product.icon className="size-10" strokeWidth={1.5} />
              </div>
              <h4 className="text-sm font-bold">{localizeNode(product.name, tr)}</h4>
              <p className="mt-1 min-h-8 text-[11px] text-muted-foreground">
                {localizeNode(product.detail, tr)}
              </p>
              <p className="mt-2 text-sm font-extrabold text-primary">
                {localizeNode(rm(product.price), tr)}
              </p>
              <Button
                className="mt-3 w-full rounded-xl"
                aria-label={localizeNode(`Buy ${product.name}`, tr)}
                onClick={() => {
                  setSelected(product);
                  setQty(1);
                }}
              >
                <ShoppingBag />
                {tr("Buy")}
              </Button>
            </Card>
          )),
          tr,
        )}
      </div>
      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="w-[calc(100%-2rem)] max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>{localizeNode(selected?.name, tr)}</DialogTitle>
            <DialogDescription>{localizeNode(selected?.detail, tr)}</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">{tr("Quantity")}</span>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                aria-label={tr("Decrease quantity")}
                disabled={qty <= 1}
                onClick={() => setQty((n) => n - 1)}
              >
                <Minus />
              </Button>
              <span className="w-6 text-center font-bold">{localizeNode(qty, tr)}</span>
              <Button
                variant="outline"
                size="icon"
                aria-label={tr("Increase quantity")}
                onClick={() => setQty((n) => n + 1)}
              >
                <Plus />
              </Button>
            </div>
          </div>
          <dl className="space-y-2 rounded-xl bg-muted p-3 text-sm">
            <div className="flex justify-between gap-2">
              <dt>{tr("Wallet balance")}</dt>
              <dd className="font-semibold">{localizeNode(rm(walletBalance), tr)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>{tr("Total")}</dt>
              <dd className="font-bold text-primary">{localizeNode(rm(total), tr)}</dd>
            </div>
          </dl>
          {localizeNode(
            insufficient && (
              <p role="alert" className="text-sm text-destructive">
                {tr("Insufficient wallet balance. Top up before buying.")}
              </p>
            ),
            tr,
          )}
          <Button
            disabled={insufficient}
            className="h-11 w-full rounded-xl"
            onClick={() => {
              if (!selected) return;
              try {
                actions.buyShopItem(selected.name, selected.price, qty);
                setReceipt({ name: selected.name, quantity: qty, total });
                setSelected(null);
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Purchase failed");
              }
            }}
          >
            <ShoppingBag />
            {tr("Pay ")}
            {localizeNode(rm(total), tr)}
          </Button>
        </DialogContent>
      </Dialog>
      <Dialog
        open={receipt !== null}
        onOpenChange={(open) => {
          if (!open) setReceipt(null);
        }}
      >
        <DialogContent className="w-[calc(100%-2rem)] max-w-sm rounded-2xl text-center">
          <DialogHeader className="items-center">
            <CheckCircle2 className="size-12 text-success" />
            <DialogTitle>{tr("Purchase recorded")}</DialogTitle>
            <DialogDescription>
              {localizeNode(receipt?.quantity, tr)} {tr("× ")}
              {localizeNode(receipt?.name, tr)} {tr("· ")}
              {localizeNode(rm(receipt?.total ?? 0), tr)}
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {tr("Wallet balance: ")}
            <span className="font-bold text-foreground">{localizeNode(rm(walletBalance), tr)}</span>
          </p>
          <Button onClick={() => setReceipt(null)}>{tr("Done")}</Button>
        </DialogContent>
      </Dialog>
    </section>
  );
}
