import { useLanguage } from "@/hooks/use-language";
import { localizeNode } from "@/lib/i18n";
import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { Owl } from "@/components/skowla/Brand";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "skowla-install-dismissed";

export function InstallPrompt() {
  const { t: tr, locale } = useLanguage();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIos, setShowIos] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone || window.self !== window.top || localStorage.getItem(DISMISS_KEY)) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setOpen(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    const ua = navigator.userAgent;
    if (/iphone|ipad|ipod/i.test(ua) && /safari/i.test(ua) && !/crios|fxios/i.test(ua)) {
      setShowIos(true);
      setOpen(true);
    }
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!open) return null;

  const close = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setOpen(false);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    close();
  };

  return (
    <div className="fixed inset-x-0 top-3 z-50 mx-auto w-[calc(100%-1.5rem)] max-w-[406px] rounded-2xl border border-border bg-card p-3 shadow-elevated">
      <div className="flex items-center gap-3">
        <Owl className="size-10 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">{tr("Install Skowla")}</p>
          <p className="text-xs text-muted-foreground">
            {localizeNode(
              showIos && !deferred ? (
                <>
                  {tr("Tap ")}
                  <Share className="inline size-3.5" /> {tr("then “Add to Home Screen”.")}
                </>
              ) : (
                "Add Skowla to your home screen."
              ),
              tr,
            )}
          </p>
        </div>
        {localizeNode(
          deferred && (
            <button
              type="button"
              onClick={install}
              className="flex shrink-0 items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"
            >
              <Download className="size-3.5" /> {tr("Install")}
            </button>
          ),
          tr,
        )}
        <button
          type="button"
          aria-label={tr("Close")}
          onClick={close}
          className="grid size-7 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
