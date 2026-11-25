import { useLanguage } from "@/hooks/use-language";
import { localizeNode } from "@/lib/i18n";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bell,
  ChevronRight,
  HelpCircle,
  Info,
  KeyRound,
  LogOut,
  Settings,
  UserCog,
} from "lucide-react";
import { useState } from "react";
import { toast } from "@/lib/notify";
import { Card, Section, useLogout } from "@/components/skowla/AppShell";
import { AboutDialog, HelpDialog } from "@/components/skowla/InfoDialogs";
import { BackButton, PageHeader } from "@/components/skowla/PageHeader";
import { PersonAvatar } from "@/components/skowla/PersonAvatar";
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
import { DEMO_USERS } from "@/lib/auth";
import { IMG } from "@/lib/images";
import { actions, useAppState } from "@/lib/store";

export const Route = createFileRoute("/teacher/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Skowla" },
      {
        name: "description",
        content: "Your Skowla teacher profile, account settings and support.",
      },
      { property: "og:title", content: "Profile — Skowla" },
      { property: "og:description", content: "Teacher profile and account settings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Profile,
});

function Row({
  icon: I,
  label,
  onClick,
  to,
}: {
  icon: typeof Bell;
  label: string;
  onClick?: () => void;
  to?: "/teacher/settings";
}) {
  const { t: tr, locale } = useLanguage();
  const inner = (
    <>
      <I className="size-[18px] text-primary" />
      <span className="flex-1 text-left text-sm font-medium">{localizeNode(label, tr)}</span>
      <ChevronRight className="size-4 text-muted-foreground" />
    </>
  );
  const cls = "flex w-full items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted";
  return to ? (
    <Link to={to} className={cls}>
      {localizeNode(inner, tr)}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={cls}>
      {localizeNode(inner, tr)}
    </button>
  );
}

function Profile() {
  const { t: tr, locale } = useLanguage();
  const { teacherProfile } = useAppState();
  const logout = useLogout();
  const [acctOpen, setAcctOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <>
      <PageHeader
        title={tr("Profile")}
        left={<BackButton fallback="/teacher" />}
        right={
          <Link
            to="/teacher/settings"
            aria-label={tr("Settings")}
            className="grid size-9 place-items-center rounded-full hover:bg-muted"
          >
            <Settings className="size-5" />
          </Link>
        }
      />
      <Section className="space-y-5 md:max-w-xl md:mx-auto">
        <div className="flex flex-col items-center text-center">
          <PersonAvatar name={teacherProfile.name} photo={IMG.farid} className="size-24 ring-4" />
          <h2 className="mt-3 text-lg font-bold">{localizeNode(teacherProfile.name, tr)}</h2>
          <p className="text-sm text-muted-foreground">{tr("Teacher")}</p>
        </div>
        <Card className="divide-y divide-border overflow-hidden">
          <Row icon={UserCog} label={tr("Account Settings")} onClick={() => setAcctOpen(true)} />
          <Row icon={Bell} label={tr("Notification Settings")} to="/teacher/settings" />
          <Row icon={KeyRound} label={tr("Change Password")} onClick={() => setPwOpen(true)} />
        </Card>
        <Card className="divide-y divide-border overflow-hidden">
          <Row icon={Info} label={tr("About Skowla")} onClick={() => setAboutOpen(true)} />
          <Row icon={HelpCircle} label={tr("Help & Support")} onClick={() => setHelpOpen(true)} />
        </Card>
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-destructive hover:bg-destructive-soft"
        >
          <LogOut className="size-[18px]" /> {tr("Log Out")}
        </button>
      </Section>

      <AccountDialog open={acctOpen} onOpenChange={setAcctOpen} profile={teacherProfile} />
      <PasswordDialog open={pwOpen} onOpenChange={setPwOpen} />
      <AboutDialog open={aboutOpen} onOpenChange={setAboutOpen} />
      <HelpDialog open={helpOpen} onOpenChange={setHelpOpen} />
    </>
  );
}

function AccountDialog({
  open,
  onOpenChange,
  profile,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  profile: { name: string; email: string; phone: string };
}) {
  const { t: tr, locale } = useLanguage();
  const [form, setForm] = useState(profile);
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (v) setForm(profile);
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>{tr("Account Settings")}</DialogTitle>
          <DialogDescription>{tr("Update your profile details.")}</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.name.trim()) {
              toast.error("Name is required.");
              return;
            }
            actions.updateTeacherProfile({ name: form.name.trim(), phone: profile.phone });
            toast.success("Profile updated");
            onOpenChange(false);
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="name">{tr("Full name")}</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">{tr("Email")}</Label>
            <Input id="email" value={form.email} disabled className="h-11 rounded-xl" />
          </div>
          <Button type="submit" className="h-11 w-full rounded-xl">
            {tr("Save changes")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PasswordDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { t: tr, locale } = useLanguage();
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [conf, setConf] = useState("");
  const demo = DEMO_USERS.find((u) => u.role === "teacher");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>{tr("Change Password")}</DialogTitle>
          <DialogDescription>
            {tr("Demo accounts keep their original password for testing.")}
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (cur !== demo?.password) {
              toast.error("Current password is incorrect.");
              return;
            }
            if (next.length < 8) {
              toast.error("New password must be at least 8 characters.");
              return;
            }
            if (next !== conf) {
              toast.error("Passwords do not match.");
              return;
            }
            toast.success("Password updated");
            setCur("");
            setNext("");
            setConf("");
            onOpenChange(false);
          }}
        >
          <Input
            type="password"
            placeholder={tr("Current password")}
            value={cur}
            onChange={(e) => setCur(e.target.value)}
            className="h-11 rounded-xl"
          />
          <Input
            type="password"
            placeholder={tr("New password")}
            value={next}
            onChange={(e) => setNext(e.target.value)}
            className="h-11 rounded-xl"
          />
          <Input
            type="password"
            placeholder={tr("Confirm new password")}
            value={conf}
            onChange={(e) => setConf(e.target.value)}
            className="h-11 rounded-xl"
          />
          <Button type="submit" className="h-11 w-full rounded-xl">
            {tr("Update password")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
