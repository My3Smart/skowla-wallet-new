import { Camera, RefreshCw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/hooks/use-language";

export function CameraCapture({
  open,
  onOpenChange,
  onCapture,
  onFallback,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCapture: (dataUrl: string) => void;
  onFallback: () => void;
}) {
  const { t: tr } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [shot, setShot] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || shot) return;
    let stream: MediaStream | null = null;
    let cancelled = false;
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError(tr("Camera is not available on this device."));
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: facing }, audio: false })
      .then((s) => {
        if (cancelled) return s.getTracks().forEach((t) => t.stop());
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          void videoRef.current.play().catch(() => {});
        }
      })
      .catch(() => setError(tr("Camera access was blocked. Allow camera permission or choose a photo instead.")));
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [open, facing, shot, tr]);

  const close = (v: boolean) => {
    if (!v) setShot(null);
    onOpenChange(v);
  };

  const snap = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const scale = Math.min(1, 1024 / Math.max(v.videoWidth, v.videoHeight));
    const c = document.createElement("canvas");
    c.width = Math.round(v.videoWidth * scale);
    c.height = Math.round(v.videoHeight * scale);
    c.getContext("2d")?.drawImage(v, 0, 0, c.width, c.height);
    setShot(c.toDataURL("image/jpeg", 0.8));
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle>{tr("Take Photo")}</DialogTitle>
          <DialogDescription>{tr("Point the camera at the document and tap the shutter.")}</DialogDescription>
        </DialogHeader>
        <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-muted">
          {shot ? (
            <img src={shot} alt="" className="size-full object-cover" />
          ) : error ? (
            <div className="grid size-full place-items-center p-4 text-center text-sm text-muted-foreground">{error}</div>
          ) : (
            <video ref={videoRef} playsInline muted autoPlay className="size-full object-cover" />
          )}
        </div>
        {shot ? (
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setShot(null)}>
              {tr("Retake")}
            </Button>
            <Button type="button" className="rounded-xl" onClick={() => { onCapture(shot); close(false); }}>
              {tr("Use Photo")}
            </Button>
          </div>
        ) : error ? (
          <Button type="button" className="rounded-xl" onClick={() => { close(false); onFallback(); }}>
            {tr("Attach Image")}
          </Button>
        ) : (
          <div className="flex items-center justify-around">
            <Button type="button" variant="outline" size="icon" className="rounded-full" aria-label={tr("Cancel")} onClick={() => close(false)}>
              <X className="size-4" />
            </Button>
            <button type="button" aria-label={tr("Take Photo")} onClick={snap} className="grid size-16 place-items-center rounded-full border-4 border-primary bg-primary text-primary-foreground">
              <Camera className="size-6" />
            </button>
            <Button type="button" variant="outline" size="icon" className="rounded-full" aria-label={tr("Switch Camera")} onClick={() => setFacing((f) => (f === "user" ? "environment" : "user"))}>
              <RefreshCw className="size-4" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
