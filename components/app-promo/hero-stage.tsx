"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { PhoneFrame } from "@/components/app-promo/phone-frame";
import { HERO_CYCLE_SRC } from "@/lib/app-promo";
import { cn } from "@/lib/utils";

type HeroStageProps = {
  videoSrc: string | null;
};

export function HeroStage({ videoSrc }: HeroStageProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [index, setIndex] = useState(0);
  const [videoReady, setVideoReady] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);

  const showVideo = Boolean(videoSrc) && videoReady;

  useEffect(() => {
    if (showVideo) return;
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % HERO_CYCLE_SRC.length);
    }, 2800);
    return () => window.clearInterval(id);
  }, [showVideo]);

  const screen = (
    <>
      {videoSrc ? (
        <video
          ref={videoRef}
          className={cn(
            "absolute inset-0 h-full w-full object-cover",
            showVideo ? "opacity-100" : "opacity-0",
          )}
          src={videoSrc}
          poster="/app-promo/screenshots/home.png"
          autoPlay
          loop
          muted={muted}
          playsInline
          preload="metadata"
          onLoadedData={() => setVideoReady(true)}
          onError={() => setVideoReady(false)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        >
          Your browser does not support the video tag.
        </video>
      ) : null}

      {!showVideo
        ? HERO_CYCLE_SRC.map((src, i) => (
            <Image
              key={src}
              src={src}
              alt={i === index ? "DengueSense LK app in use" : ""}
              fill
              sizes="(max-width: 640px) 58vw, 240px"
              preload={i === 0}
              className={cn(
                "object-cover transition-all duration-700 ease-out",
                i === index ? "ds-kenburns opacity-100" : "scale-105 opacity-0",
              )}
            />
          ))
        : null}

      {showVideo ? (
        <div className="absolute inset-x-0 bottom-3 z-20 flex justify-center gap-2">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition hover:bg-black/70"
            aria-label={playing ? "Pause preview" : "Play preview"}
            onClick={() => {
              const video = videoRef.current;
              if (!video) return;
              if (video.paused) void video.play();
              else video.pause();
            }}
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition hover:bg-black/70"
            aria-label={muted ? "Unmute preview" : "Mute preview"}
            onClick={() => setMuted((value) => !value)}
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </div>
      ) : null}
    </>
  );

  return (
    <div className="relative mx-auto w-full max-w-[280px] sm:h-[min(640px,78vw)] sm:max-w-[520px]">
      <div
        aria-hidden
        className="absolute left-1/2 top-1/2 h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7A23A7]/25 blur-3xl dark:bg-[#7A23A7]/35"
      />

      <PhoneFrame className="pointer-events-none absolute left-[4%] top-[14%] hidden w-[38%] -rotate-12 opacity-80 sm:block">
        <Image
          src="/app-promo/screenshots/map.png"
          alt=""
          fill
          loading="eager"
          sizes="180px"
          className="object-cover"
        />
      </PhoneFrame>

      <PhoneFrame className="pointer-events-none absolute right-[2%] top-[10%] hidden w-[38%] rotate-12 opacity-80 sm:block">
        <Image
          src="/app-promo/screenshots/news.png"
          alt=""
          fill
          loading="eager"
          sizes="180px"
          className="object-cover"
        />
      </PhoneFrame>

      <div className="relative z-10 mx-auto w-full max-w-[230px] sm:absolute sm:left-1/2 sm:top-[4%] sm:w-[46%] sm:max-w-none sm:-translate-x-1/2">
        <PhoneFrame float className="ds-phone-glow">
          {screen}
        </PhoneFrame>
      </div>

      <div className="pointer-events-none absolute -left-1 top-[22%] z-20 hidden animate-in fade-in slide-in-from-left-4 duration-700 sm:block">
        <Chip tone="green">No name. No login.</Chip>
      </div>
      <div className="pointer-events-none absolute -right-2 top-[38%] z-20 hidden animate-in fade-in slide-in-from-right-4 delay-150 duration-700 sm:block">
        <Chip tone="purple">Danger spots near you</Chip>
      </div>
      <div className="pointer-events-none absolute bottom-[8%] left-[8%] z-20 hidden animate-in fade-in slide-in-from-bottom-3 delay-300 duration-700 sm:block">
        <Chip tone="peach">Photo sent. Thank you!</Chip>
      </div>
    </div>
  );
}

function Chip({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "green" | "purple" | "peach";
}) {
  const tones = {
    green:
      "border-[#C9E8D3] bg-[#E7F6EC] text-[#1B3B22] dark:border-emerald-500/30 dark:bg-emerald-950/80 dark:text-emerald-100",
    purple:
      "border-[#E4D2F2] bg-[#F4E9FA] text-[#5A1C7A] dark:border-fuchsia-400/30 dark:bg-fuchsia-950/80 dark:text-fuchsia-100",
    peach:
      "border-[#F3D5C4] bg-[#FBEFE6] text-[#7A3A1C] dark:border-orange-400/30 dark:bg-orange-950/80 dark:text-orange-100",
  };

  return (
    <span
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}
