import { useLanguage } from "@/hooks/use-language";
import { localizeNode } from "@/lib/i18n";
import { LanguageToggle } from "@/components/skowla/LanguageToggle";
import { createFileRoute } from "@tanstack/react-router";
import { Bell, ChevronRight, Globe, Info, Mail, Palette, RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "@/lib/notify";
import { Card, Section } from "@/components/skowla/AppShell";
import { AboutDialog } from "@/components/skowla/InfoDialogs";
import { BackButton, PageHeader } from "@/components/skowla/PageHeader";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { actions, useAppState, type Settings } from "@/lib/store";

export const Route = createFileRoute("/teacher/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Skowla" },
      {
        name: "description",
        content: "Notifications, sync, language and theme settings for Skowla.",
      },
      { property: "og:title", content: "Settings — Skowla" },
      { property: "og:description", content: "App preferences for teachers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { t: tr, locale } = useLanguage();
  const { settings } = useAppState();
  const [clearOpen, setClearOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  const toggles: { key: "push" | "email" | "autoSync"; label: string; icon: typeof Bell }[] = [
    { key: "push", label: "Push Notifications", icon: Bell },
    { key: "email", label: "Email Notifications", icon: Mail },
    { key: "autoSync", label: "Auto Sync Data", icon: RefreshCw },
  ];

  return (
    <>
      <PageHeader title={tr("Settings")} left={<BackButton fallback="/teacher/profile" />} />
      <Section className="space-y-4 md:mx-auto md:max-w-xl">
        <Card className="divide-y divide-border">
          {localizeNode(
            toggles.map((t) => (
              <label key={t.key} className="flex cursor-pointer items-center gap-3 px-4 py-3.5">
                <t.icon className="size-[18px] text-primary" />
                <span className="flex-1 text-sm font-medium">{localizeNode(t.label, tr)}</span>
                <Switch
                  checked={settings[t.key]}
                  onCheckedChange={(v) => {
                    actions.updateSettings({ [t.key]: v } as Partial<Settings>);
                    toast.success(`${t.label} ${v ? "on" : "off"}`);
                  }}
                  className="h-6 w-11 [&>span]:size-5 [&>span]:data-[state=checked]:translate-x-5"
                />
              </label>
            )),
            tr,
          )}
        </Card>

        <Card className="divide-y divide-border">
          <LanguageToggle />
          <div className="flex items-center gap-3 px-4 py-2.5">
            <Palette className="size-[18px] text-primary" />
            <span className="flex-1 text-sm font-medium">{tr("App Theme")}</span>
            <Select
              value={settings.theme}
              onValueChange={(v) => actions.updateSettings({ theme: v as Settings["theme"] })}
            >
              <SelectTrigger
                className="h-9 w-auto gap-1 border-0 bg-transparent font-semibold text-primary shadow-none"
                aria-label={tr("App theme")}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="Light">{tr("Light")}</SelectItem>
                <SelectItem value="Dark">{tr("Dark")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        <Card className="divide-y divide-border overflow-hidden">
          <button
            type="button"
            onClick={() => setClearOpen(true)}
            className="flex w-full items-center gap-3 px-4 py-3.5 hover:bg-muted"
          >
            <Trash2 className="size-[18px] text-warning" />
            <span className="flex-1 text-left text-sm font-medium">{tr("Clear Cache")}</span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </button>
          <button
            type="button"
            onClick={() => setAboutOpen(true)}
            className="flex w-full items-center gap-3 px-4 py-3.5 hover:bg-muted"
          >
            <Info className="size-[18px] text-primary" />
            <span className="flex-1 text-left text-sm font-medium">{tr("About App")}</span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </button>
        </Card>
      </Section>

      <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
        <AlertDialogContent className="max-w-sm rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{tr("Clear cache?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {tr(
                "This removes data saved on this device and restores the demo data. You will stay logged in.",
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tr("Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                actions.reset();
                toast.success("Cache cleared");
              }}
            >
              {tr("Clear")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AboutDialog open={aboutOpen} onOpenChange={setAboutOpen} />
    </>
  );
}
