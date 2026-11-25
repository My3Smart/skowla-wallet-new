import { actions } from "@/lib/store";
import { useLanguage } from "@/hooks/use-language";
import { localizeNode } from "@/lib/i18n";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Lock, Mail, Phone, ShieldCheck, Wallet, GraduationCap } from "lucide-react";
import { toast } from "@/lib/notify";
import { Owl, Wordmark } from "@/components/skowla/Brand";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { authenticate, DEMO_USERS, getSession, homeFor, startCbsSession, startSession, type Role } from "@/lib/auth";
import { loginParentCbs, type CbsLoginResult } from "@/lib/cbs.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Log in — Skowla" },
      {
        name: "description",
        content:
          "Log in to Skowla as a teacher or parent to manage reports, complaints, wallet, canteen and fees.",
      },
      { property: "og:title", content: "Log in — Skowla" },
      {
        property: "og:description",
        content:
          "Smart School • Smart Wallet • Smart Future. Teacher and parent access in one app.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { t: tr, locale } = useLanguage();
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("teacher");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);

  useEffect(() => {
    const s = getSession();
    if (s) void navigate({ to: homeFor(s.role), replace: true });
  }, [navigate]);

  const demo = DEMO_USERS.find((u) => u.role === role);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    const user = authenticate(role, email, password);
    if (!user && role === "parent") {
      void loginParentCbs({ data: { username: email, password } })
        .then((res) => {
          const r = res as CbsLoginResult;
          if (!r.ok || !r.accessToken || !r.user || !r.parent) {
            setError(r.error ?? "Unable to connect to CBS. Please try again.");
            return;
          }
          const s = startCbsSession({ accessToken: r.accessToken, user: r.user, parent: r.parent });
          actions.loadCbsFamily(r.dependents ?? [], r.balance ?? null);
          toast.success(`Welcome back, ${s.shortName}!`);
          void navigate({ to: "/parent", replace: true });
        })
        .catch(() => setError("Unable to connect to CBS. Please try again."))
        .finally(() => setLoading(false));
      return;
    }
    window.setTimeout(() => {
      setLoading(false);
      if (!user) {
        setError(`Incorrect ${role} email or password.`);
        return;
      }
      startSession(user);
      if (user.role === "parent") actions.resetDemoFamily();
      toast.success(`Welcome back, ${user.shortName}!`);
      void navigate({ to: homeFor(user.role), replace: true });
    }, 450);
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background bg-gradient-sky">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 md:grid-cols-2 md:px-8">
        {/* Brand panel (desktop) */}
        <section className="hidden flex-col gap-6 md:flex">
          <div className="flex items-center gap-4">
            <Owl className="size-24" />
            <Wordmark className="text-7xl" />
          </div>
          <p className="text-xl font-medium text-primary">
            {tr("Smart School • Smart Wallet • Smart Future")}
          </p>
          <p className="max-w-md text-muted-foreground">
            {tr(
              "One app for teachers and parents — student reports, complaints, the family school wallet, canteen pre-orders, fees and attendance.",
            )}
          </p>
          <ul className="grid max-w-md gap-3">
            {localizeNode(
              [
                { icon: GraduationCap, t: "Reports & complaints for teachers" },
                { icon: Wallet, t: "Smart wallet & canteen for parents" },
                { icon: ShieldCheck, t: "Simple • Secure • For You" },
              ].map(({ icon: I, t }) => (
                <li
                  key={t}
                  className="flex items-center gap-3 rounded-2xl bg-card/80 p-3 shadow-card"
                >
                  <span className="grid size-9 place-items-center rounded-xl bg-primary-soft text-primary">
                    <I className="size-5" />
                  </span>
                  <span className="text-sm font-semibold">{localizeNode(t, tr)}</span>
                </li>
              )),
              tr,
            )}
          </ul>
        </section>

        {/* Login card */}
        <section className="relative flex min-h-screen w-full flex-col justify-center overflow-hidden bg-card px-6 pt-10 pb-24">
          <div className="flex flex-col items-center text-center">
            <Owl className="size-28" />
            <Wordmark className="mt-1 text-5xl" />
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              {tr("Smart School • Smart Wallet • Smart Future")}
            </p>
          </div>

          <div
            role="tablist"
            aria-label={tr("Account type")}
            className="mt-8 grid grid-cols-2 gap-2"
          >
            {localizeNode(
              (["teacher", "parent"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  role="tab"
                  aria-selected={role === r}
                  onClick={() => {
                    setRole(r);
                    setError(null);
                  }}
                  className={cn(
                    "h-11 rounded-xl text-sm font-semibold capitalize transition-all",
                    role === r
                      ? "bg-primary text-primary-foreground shadow-elevated"
                      : "bg-muted text-foreground hover:bg-secondary",
                  )}
                >
                  {localizeNode(r === "teacher" ? "Teacher" : "Parent", tr)}
                </button>
              )),
              tr,
            )}
          </div>

          <form onSubmit={onSubmit} className="mt-6 space-y-3" noValidate>
            <label className="relative block">
              <span className="sr-only">{tr("Email Address")}</span>
              <Mail className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="email"
                autoComplete="email"
                placeholder={tr("Email Address")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 rounded-xl bg-muted/60 pl-10"
              />
            </label>
            <label className="relative block">
              <span className="sr-only">{tr("Password")}</span>
              <Lock className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type={show ? "text" : "password"}
                autoComplete="current-password"
                placeholder={tr("Password")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 rounded-xl bg-muted/60 pr-10 pl-10"
              />
              <button
                type="button"
                aria-label={localizeNode(show ? "Hide password" : "Show password", tr)}
                onClick={() => setShow((v) => !v)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {localizeNode(
                  show ? <Eye className="size-4" /> : <EyeOff className="size-4" />,
                  tr,
                )}
              </button>
            </label>
            {localizeNode(
              error && (
                <p role="alert" className="text-sm font-medium text-destructive">
                  {localizeNode(error, tr)}
                </p>
              ),
              tr,
            )}
            <Button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-xl text-base font-semibold"
            >
              {localizeNode(loading ? "Logging in…" : "Login", tr)}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => setForgotOpen(true)}
            className="mx-auto mt-4 block text-sm font-semibold text-primary hover:underline"
          >
            {tr("Forgot Password?")}
          </button>

          {localizeNode(
            demo && (
              <div className="mt-5 rounded-xl border border-dashed border-primary/40 bg-primary-soft/60 p-3 text-xs">
                <p className="font-semibold text-foreground">
                  {tr("Demo ")}
                  {localizeNode(role, tr)} {tr("login")}
                </p>
                <p className="mt-1 text-muted-foreground">
                  {localizeNode(demo.email, tr)} {tr("• ")}
                  {localizeNode(demo.password, tr)}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setEmail(demo.email);
                    setPassword(demo.password);
                    setError(null);
                  }}
                  className="mt-1.5 font-semibold text-primary hover:underline"
                >
                  {tr("Fill in demo account")}
                </button>
              </div>
            ),
            tr,
          )}

          <p className="mt-5 text-center text-xs text-muted-foreground">
            {tr("Need an account?")}
            {localizeNode(" ", tr)}
            <button
              type="button"
              onClick={() => setAdminOpen(true)}
              className="font-semibold text-primary hover:underline"
            >
              {tr("Contact Admin")}
            </button>
          </p>

          {/* soft wave */}
          <svg
            aria-hidden
            viewBox="0 0 400 120"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-20 w-full text-primary-soft"
          >
            <path d="M0 60 C 100 10, 220 110, 400 40 L400 120 L0 120 Z" fill="currentColor" />
            <path
              d="M0 90 C 120 50, 260 130, 400 80 L400 120 L0 120 Z"
              fill="currentColor"
              opacity="0.7"
              className="text-primary-glow"
            />
          </svg>
        </section>
      </div>

      <ForgotDialog open={forgotOpen} onOpenChange={setForgotOpen} defaultEmail={email} />
      <Dialog open={adminOpen} onOpenChange={setAdminOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>{tr("Contact Admin")}</DialogTitle>
            <DialogDescription>
              {tr("Ask your school administrator to create a Skowla account for you.")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <a
              href="mailto:admin@skowla.edu.my"
              className="flex items-center gap-3 rounded-xl bg-muted p-3 font-medium"
            >
              <Mail className="size-4 text-primary" /> {tr("admin@skowla.edu.my")}
            </a>
            <a
              href="tel:+60312345678"
              className="flex items-center gap-3 rounded-xl bg-muted p-3 font-medium"
            >
              <Phone className="size-4 text-primary" /> {tr("+60 3-1234 5678")}
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ForgotDialog({
  open,
  onOpenChange,
  defaultEmail,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultEmail: string;
}) {
  const { t: tr, locale } = useLanguage();
  const [value, setValue] = useState(defaultEmail);
  useEffect(() => {
    if (open) setValue(defaultEmail);
  }, [open, defaultEmail]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle>{tr("Reset your password")}</DialogTitle>
          <DialogDescription>
            {tr("Enter your account email and we'll send you a reset link.")}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!/^\S+@\S+\.\S+$/.test(value)) {
              toast.error("Please enter a valid email address.");
              return;
            }
            toast.success(`Reset link sent to ${value}`);
            onOpenChange(false);
          }}
          className="space-y-4"
        >
          <Input
            type="email"
            placeholder={tr("Email Address")}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="h-11 rounded-xl"
          />
          <DialogFooter>
            <Button type="submit" className="h-11 w-full rounded-xl">
              {tr("Send reset link")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
