"use client";

import { useState } from "react";
import Image from "next/image";
import { Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { APP_ICON_SRC } from "@/lib/app-promo";
import { cn } from "@/lib/utils";

function AppleMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={cn("h-7 w-7 shrink-0 fill-current", className)}
    >
      <path d="M16.37 12.64c.03-2.22 1.82-3.29 1.9-3.34-1.04-1.52-2.66-1.73-3.23-1.75-1.37-.14-2.68.8-3.38.8-.7 0-1.77-.78-2.92-.76-1.5.02-2.89.87-3.66 2.22-1.57 2.72-.4 6.73 1.12 8.93.75 1.08 1.64 2.28 2.81 2.24 1.13-.05 1.56-.73 2.93-.73 1.36 0 1.75.73 2.94.7 1.22-.02 1.98-1.09 2.72-2.18.86-1.25 1.21-2.47 1.23-2.53-.03-.01-2.35-.9-2.38-3.6zM14.7 6.3c.62-.75 1.04-1.8.92-2.84-.89.04-1.97.6-2.61 1.34-.57.66-1.08 1.73-.94 2.74 1 .08 2.02-.51 2.63-1.24z" />
    </svg>
  );
}

function PlayMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={cn("h-7 w-7 shrink-0", className)}
    >
      <path fill="#EA4335" d="M3.4 2.1 13.7 12 3.4 21.9c-.5-.3-.9-.9-.9-1.6V3.7c0-.7.4-1.3.9-1.6z" />
      <path fill="#FBBC04" d="M16.9 8.9 13.7 12l3.2 3.1 3.6-2.1c.9-.5.9-1.8 0-2.3z" />
      <path fill="#4285F4" d="M3.4 21.9 13.7 12l3.2 3.1z" />
      <path fill="#34A853" d="M13.7 12 3.4 2.1l13.5 7.8z" />
    </svg>
  );
}

const badgeClass =
  "inline-flex h-12 w-full touch-manipulation items-center justify-center gap-3 rounded-xl bg-zinc-950 px-4 text-left text-white shadow-lg shadow-zinc-950/20 ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A23A7] focus-visible:ring-offset-2 sm:h-[52px] sm:w-auto sm:min-w-[168px] sm:justify-start dark:bg-white dark:text-zinc-950 dark:shadow-none dark:ring-zinc-200 dark:hover:bg-zinc-100";

type StoreKind = "play" | "ios";

export function StoreBadges({ className }: { className?: string }) {
  const [store, setStore] = useState<StoreKind | null>(null);

  return (
    <>
      <div
        className={cn(
          "flex w-full max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row sm:flex-wrap sm:items-center",
          className,
        )}
      >
        <button
          type="button"
          className={badgeClass}
          onClick={() => setStore("play")}
        >
          <PlayMark />
          <span className="flex flex-col items-start leading-none">
            <span className="text-[10px] font-medium tracking-wide opacity-80">
              GET IT ON
            </span>
            <span className="mt-0.5 text-[15px] font-semibold tracking-tight">
              Google Play
            </span>
          </span>
        </button>
        <button
          type="button"
          className={badgeClass}
          onClick={() => setStore("ios")}
        >
          <AppleMark />
          <span className="flex flex-col items-start leading-none">
            <span className="text-[10px] font-medium tracking-wide opacity-80">
              Download on the
            </span>
            <span className="mt-0.5 text-[15px] font-semibold tracking-tight">
              App Store
            </span>
          </span>
        </button>
      </div>

      <Dialog
        open={store !== null}
        onOpenChange={(open) => {
          if (!open) setStore(null);
        }}
      >
        <DialogContent className="max-w-[calc(100%-2rem)] rounded-3xl border-[#E4DDD0] bg-[#F6F4EC] p-6 sm:max-w-[22rem] sm:rounded-3xl dark:border-white/10 dark:bg-[#121C18]">
          <DialogHeader className="items-center text-center sm:text-center">
            <Image
              src={APP_ICON_SRC}
              alt="DengueSense LK"
              width={72}
              height={72}
              className="mb-2 h-[72px] w-[72px] rounded-2xl object-cover ring-1 ring-black/10"
            />
            <p className="inline-flex items-center gap-1.5 rounded-full bg-[#7A23A7]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#7A23A7]">
              <Smartphone className="h-3 w-3" />
              Coming soon
            </p>
            <DialogTitle className="pt-2 text-xl text-[#12382A] dark:text-[#F3F6F1]">
              {store === "ios"
                ? "Not on the App Store yet"
                : "Not on Google Play yet"}
            </DialogTitle>
            <DialogDescription className="text-pretty text-[#4B5F55] dark:text-white/65">
              DengueSense LK is almost ready for{" "}
              {store === "ios" ? "iPhone" : "Android"}. The store listing is on
              its way. Check back here when we open downloads.
            </DialogDescription>
          </DialogHeader>
          <Button
            className="mt-1 h-11 w-full rounded-full bg-[#7A23A7] text-white hover:bg-[#691E91]"
            onClick={() => setStore(null)}
          >
            Got it
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
