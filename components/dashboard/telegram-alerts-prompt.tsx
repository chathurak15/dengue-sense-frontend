"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/stores/app-store";
import {
  TelegramAlertsEnable,
  useTelegramAlertStatus,
} from "@/components/dashboard/telegram-alerts-enable";

const DISMISS_KEY = "ds_tg_prompt_dismissed";

export function TelegramAlertsPrompt() {
  const user = useAppStore((s) => s.user);
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useTelegramAlertStatus();

  const needsConnect = user?.role === "PHI" && !user.telegramConnected;
  const onSettings = pathname.startsWith("/dashboard/settings");

  useEffect(() => {
    if (!needsConnect || typeof window === "undefined") return;
    if (sessionStorage.getItem(DISMISS_KEY) === "1") return;
    setOpen(true);
  }, [needsConnect]);

  if (!needsConnect) {
    return null;
  }

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setOpen(false);
  };

  return (
    <>
      {!open && !onSettings && (
        <div className="mb-4">
          <TelegramAlertsEnable compact />
        </div>
      )}

      <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : dismiss())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Get outbreak alerts on Telegram</DialogTitle>
            <DialogDescription>
              One tap. When a dengue hotspot is found in your district, we will message you.
            </DialogDescription>
          </DialogHeader>
          <TelegramAlertsEnable compact />
          <DialogFooter>
            <Button variant="ghost" onClick={dismiss}>
              Later
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
