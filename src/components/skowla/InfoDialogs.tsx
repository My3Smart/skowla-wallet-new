import { useLanguage } from "@/hooks/use-language";
import { localizeNode } from "@/lib/i18n";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { Owl, Wordmark } from "@/components/skowla/Brand";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function AboutDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { t: tr, locale } = useLanguage();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl text-center">
        <DialogHeader className="items-center">
          <Owl className="size-20" />
          <DialogTitle>
            <Wordmark className="text-3xl" />
          </DialogTitle>
          <DialogDescription>{tr("Smart School • Smart Wallet • Smart Future")}</DialogDescription>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {tr(
            "Skowla connects teachers and parents with student reports, complaints, a family school wallet, canteen pre-orders, fees and attendance — all in one place.",
          )}
        </p>
        <p className="text-xs text-muted-foreground">{tr("Version 1.0.0 • © 2026 Skowla")}</p>
      </DialogContent>
    </Dialog>
  );
}

export function HelpDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { t: tr, locale } = useLanguage();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle>{tr("Help & Support")}</DialogTitle>
          <DialogDescription>{tr("We usually reply within one working day.")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 text-sm">
          <a
            href="mailto:support@skowla.edu.my"
            className="flex items-center gap-3 rounded-xl bg-muted p-3 font-medium"
          >
            <Mail className="size-4 text-primary" /> {tr("support@skowla.edu.my")}
          </a>
          <a
            href="tel:+60312345678"
            className="flex items-center gap-3 rounded-xl bg-muted p-3 font-medium"
          >
            <Phone className="size-4 text-primary" /> {tr("+60 3-1234 5678")}
          </a>
          <a
            href="https://wa.me/60312345678"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-xl bg-muted p-3 font-medium"
          >
            <MessageCircle className="size-4 text-primary" /> {tr("WhatsApp support")}
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
