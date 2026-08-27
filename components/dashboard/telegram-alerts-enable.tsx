"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCircle2, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { apiGetTelegramAlerts, apiSyncTelegramAlerts } from "@/lib/api";
import { useAppStore } from "@/stores/app-store";

interface TelegramAlertsEnableProps {
  compact?: boolean;
}

export function TelegramAlertsEnable({ compact = false }: TelegramAlertsEnableProps) {
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const [connecting, setConnecting] = useState(false);

  const connected = Boolean(user?.telegramConnected);

  const enableAlerts = async () => {
    if (!user) return;
    setConnecting(true);
    try {
      let status = await apiGetTelegramAlerts();
      const latest = useAppStore.getState().user;
      if (!latest) return;
      setUser({
        ...latest,
        telegramConnected: status.connected,
        telegramConnectUrl: status.connectUrl,
      });

      if (status.connected) {
        toast.success("Telegram alerts are already on.");
        return;
      }

      if (!status.connectUrl) {
        toast.error("Could not prepare Telegram. Please try again in a moment.");
        return;
      }

      window.open(status.connectUrl, "_blank", "noopener,noreferrer");
      toast.message("Telegram opened. Tap Start, then come back here.");

      await apiSyncTelegramAlerts().catch(() => undefined);

      const started = Date.now();
      while (Date.now() - started < 45_000) {
        await new Promise((r) => setTimeout(r, 2500));
        status = await apiSyncTelegramAlerts().catch(() => apiGetTelegramAlerts());
        const next = useAppStore.getState().user;
        if (!next) return;
        setUser({
          ...next,
          telegramConnected: status.connected,
          telegramConnectUrl: status.connectUrl,
        });
        if (status.connected) {
          toast.success("Alerts are on. You will get a Telegram message if a hotspot is found.");
          return;
        }
      }

      toast.info("If you tapped Start in Telegram, refresh this page.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not enable alerts");
    } finally {
      setConnecting(false);
    }
  };

  if (!user || user.role !== "PHI") {
    return null;
  }

  if (connected) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
        <div className="space-y-1">
          <p className="font-medium">Telegram outbreak alerts are on</p>
          <p className="text-sm text-muted-foreground">
            If dengue breeding sites cluster in your district, you will get a message on Telegram.
            You do not need to do anything else.
          </p>
          <p className="text-sm text-muted-foreground">
            ඔබේ district එකේ hotspot එකක් හමු වුණාම Telegram එකට message එකක් එනවා.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
      <div className="flex items-start gap-3">
        <Bell className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div className="space-y-1">
          <p className="font-medium">Turn on outbreak alerts</p>
          <p className="text-sm text-muted-foreground">
            When a dengue hotspot is found in your area, DengueSense will send a Telegram message.
            Tap the button, then tap <span className="font-medium text-foreground">Start</span> in
            Telegram. You do not need to type any code.
          </p>
          <p className="text-sm text-muted-foreground">
            Button එක tap කරලා Telegram එකේ Start එක press කරන්න. Code එක type කරන්න ඕන නැහැ.
          </p>
        </div>
      </div>

      {!compact && (
        <div className="flex items-center gap-3 rounded-md bg-background/70 px-3 py-2">
          <Switch
            id="telegram-alerts"
            checked={false}
            onCheckedChange={(on) => {
              if (on) void enableAlerts();
            }}
            disabled={connecting}
          />
          <Label htmlFor="telegram-alerts" className="cursor-pointer text-sm font-normal">
            Enable Telegram notifications
          </Label>
        </div>
      )}

      <Button onClick={() => void enableAlerts()} disabled={connecting} className="w-full gap-2 sm:w-auto">
        {connecting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        {connecting ? "Waiting for Telegram…" : "Enable Telegram alerts"}
      </Button>
    </div>
  );
}

/** Keeps connect URL fresh after login so the button is ready. */
export function useTelegramAlertStatus() {
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);

  useEffect(() => {
    if (!user || user.role !== "PHI") return;
    let cancelled = false;
    apiGetTelegramAlerts()
      .then((status) => {
        if (cancelled) return;
        const latest = useAppStore.getState().user;
        if (!latest) return;
        setUser({
          ...latest,
          telegramConnected: status.connected,
          telegramConnectUrl: status.connectUrl,
        });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
    // Intentionally only on user id / role so we do not loop on setUser.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.role]);
}
