import { useLanguage } from "@/hooks/use-language";
import { localizeNode } from "@/lib/i18n";
import { LanguageToggle } from "@/components/skowla/LanguageToggle";
import { Link } from "@tanstack/react-router";
import { ArrowDownLeft, ArrowUpRight, Bell, LogOut, Menu, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { useLogout } from "@/components/skowla/AppShell";
import { CapLogo } from "@/components/skowla/Brand";
import { IconButton } from "@/components/skowla/PageHeader";
import { PersonAvatar } from "@/components/skowla/PersonAvatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { fmtDateTime } from "@/lib/format";
import { useParentProfile } from "@/hooks/use-parent-profile";
import { actions, rm, useAppState } from "@/lib/store";

export function ParentHeader({ subtitle, menu = false }: { subtitle?: string; menu?: boolean }) {
  const { t: tr, locale } = useLanguage();
  const [notifOpen, setNotifOpen] = useState(false);
  const [acctOpen, setAcctOpen] = useState(false);
  const { transactions, children, walletBalance, settings } = useAppState();
  const logout = useLogout();
  const me = useParentProfile();

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center gap-2.5 bg-background/85 px-4 py-3 backdrop-blur-md md:px-8">
        {localizeNode(
          menu ? (
            <IconButton
              label={tr("Open menu")}
              onClick={() => setAcctOpen(true)}
              className="-ml-1.5"
            >
              <Menu className="size-5" />
            </IconButton>
          ) : (
            <CapLogo />
          ),
          tr,
        )}
        <div className="min-w-0 leading-tight">
          <p className="text-base font-extrabold text-foreground">{tr("Skowla")}</p>
          {localizeNode(
            subtitle && (
              <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                {localizeNode(subtitle, tr)}
              </p>
            ),
            tr,
          )}
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <IconButton label={tr("Notifications")} onClick={() => setNotifOpen(true)}>
            <Bell className="size-5" />
            <span className="absolute top-1.5 right-2 size-2 rounded-full bg-destructive ring-2 ring-background" />
          </IconButton>
          <button type="button" aria-label={tr("Account")} onClick={() => setAcctOpen(true)}>
            <PersonAvatar name={me.name} photo={me.photo} className="size-9" />
          </button>
        </div>
      </header>

      <Sheet open={notifOpen} onOpenChange={setNotifOpen}>
        <SheetContent side="right" className="w-[22rem] max-w-full p-0">
          <SheetHeader className="border-b border-border p-5">
            <SheetTitle>{tr("Notifikasi")}</SheetTitle>
          </SheetHeader>
          <div className="divide-y divide-border overflow-y-auto">
            {localizeNode(
              transactions.slice(0, 8).map((t) => (
                <div key={t.id} className="flex items-center gap-3 px-5 py-3.5">
                  <span
                    className={`grid size-9 shrink-0 place-items-center rounded-full ${t.amount > 0 ? "bg-success-soft text-success" : "bg-primary-soft text-primary"}`}
                  >
                    {localizeNode(
                      t.amount > 0 ? (
                        <ArrowDownLeft className="size-4" />
                      ) : (
                        <ArrowUpRight className="size-4" />
                      ),
                      tr,
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{localizeNode(t.title, tr)}</p>
                    <p className="text-xs text-muted-foreground">
                      {localizeNode(fmtDateTime(t.at), tr)}
                    </p>
                  </div>
                  <span className={`text-sm font-bold ${t.amount > 0 ? "text-success" : ""}`}>
                    {localizeNode(t.amount > 0 ? "+" : "-", tr)}
                    {localizeNode(rm(Math.abs(t.amount)), tr)}
                  </span>
                </div>
              )),
              tr,
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={acctOpen} onOpenChange={setAcctOpen}>
        <SheetContent side="right" className="w-[22rem] max-w-full p-0">
          <SheetHeader className="border-b border-border p-5">
            <SheetTitle>{tr("Akaun Saya")}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 p-5">
            <div className="flex items-center gap-3">
              <PersonAvatar name={me.name} photo={me.photo} className="size-14" />
              <div>
                <p className="font-bold">{me.name}</p>
                <p className="text-sm text-muted-foreground">{me.email}</p>
              </div>
            </div>
            <div className="rounded-2xl bg-gradient-primary p-4 text-primary-foreground">
              <p className="text-xs opacity-90">{tr("Baki Dompet")}</p>
              <p className="text-2xl font-bold">{localizeNode(rm(walletBalance), tr)}</p>
              <p className="mt-1 text-xs opacity-90">
                {localizeNode(children.length, tr)} {tr("anak berdaftar")}
              </p>
            </div>
            <nav className="grid gap-1 text-sm font-semibold">
              {localizeNode(
                (
                  [
                    ["/parent", "Wallet Home"],
                    ["/parent/canteen", "Canteen"],
                    ["/parent/school", "Fees & Attendance"],
                    ["/parent/chat", "AI Chatbot"],
                    ["/parent/history", "Funds + Shop"],
                  ] as const
                ).map(([to, label]) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setAcctOpen(false)}
                    className="rounded-xl px-3 py-2.5 hover:bg-muted"
                  >
                    {localizeNode(label, tr)}
                  </Link>
                )),
                tr,
              )}
            </nav>
            <div className="rounded-xl bg-muted">
              <LanguageToggle />
            </div>
            <label className="flex items-center gap-3 rounded-xl bg-muted px-3 py-3 text-sm font-semibold">
              {localizeNode(
                settings.theme === "Dark" ? (
                  <Moon className="size-4" />
                ) : (
                  <Sun className="size-4" />
                ),
                tr,
              )}
              <span className="flex-1">{tr("Mod Gelap")}</span>
              <Switch
                checked={settings.theme === "Dark"}
                onCheckedChange={(v) => actions.updateSettings({ theme: v ? "Dark" : "Light" })}
              />
            </label>
            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-destructive hover:bg-destructive-soft"
            >
              <LogOut className="size-4" /> {tr("Log Keluar")}
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
