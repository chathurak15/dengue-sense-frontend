import type { Metadata } from "next";
import Image from "next/image";
import {
  Camera,
  Lock,
  MapPinned,
  Newspaper,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { StoreBadges } from "@/components/marketing/store-badges";
import { HeroStage } from "@/components/app-promo/hero-stage";
import { PhoneFrame } from "@/components/app-promo/phone-frame";
import { ScreenshotMarquee } from "@/components/app-promo/screenshot-marquee";
import { getPromoVideoSrc } from "@/lib/app-promo-server";
import {
  APP_ICON_SRC,
  APP_SCREENSHOTS,
  HOW_IT_WORKS,
} from "@/lib/app-promo";

export const metadata: Metadata = {
  title: "Get the app",
  description:
    "Catch dengue early. Help your neighbours. Photograph still water, see danger spots on the map, and follow easy news for your district. No name and no login.",
  openGraph: {
    title: "DengueSense LK, the citizen app",
    description:
      "See still water? Take a photo. It takes a few seconds and helps your street.",
  },
};

const highlights = [
  {
    icon: Camera,
    title: "A photo is enough",
    body: "See still water in a pot, tyre or drain? Open the app, take the picture, send it. That is the whole report.",
  },
  {
    icon: Lock,
    title: "No name. No login.",
    body: "We do not ask for your NIC or phone number. This phone keeps a secret code. Your name is never asked.",
  },
  {
    icon: MapPinned,
    title: "Danger spots near you",
    body: "Find your town, see the colours, and know if a pin is high danger, take care, or safer.",
  },
  {
    icon: Newspaper,
    title: "Easy news for your district",
    body: "How is your area this week? Cases going down or up, said in words anyone can read.",
  },
];

const STORY_KEYS = [
  "onboarding-privacy.png",
  "report.png",
  "map.png",
  "news.png",
] as const;

const stories = STORY_KEYS.map((file) => {
  const shot = APP_SCREENSHOTS.find((item) => item.src.endsWith(file));
  if (!shot) {
    throw new Error(`Missing app screenshot: ${file}`);
  }
  return shot;
});

export default function AppPromoPage() {
  const videoSrc = getPromoVideoSrc();

  return (
    <div className="ds-app-shell relative min-h-screen overflow-x-hidden bg-[#F6F4EC] text-[#12382A] dark:bg-[#0B1612] dark:text-[#F3F6F1]">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 right-[-6rem] h-[28rem] w-[28rem] rounded-full bg-[#7A23A7]/18 blur-3xl" />
        <div className="absolute top-[36rem] -left-24 h-80 w-80 rounded-full bg-emerald-500/15 blur-3xl" />
      </div>

      <SiteHeader active="app" />

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 pb-6 pt-8 sm:gap-10 sm:px-6 sm:pb-8 sm:pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-6 lg:pb-4 lg:pt-20">
          <div className="max-w-xl">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#7A23A7]/20 bg-white/80 px-3 py-1 text-xs font-medium text-[#5A1C7A] dark:border-white/15 dark:bg-white/5 dark:text-fuchsia-100 sm:mb-5">
              <Sparkles className="h-3.5 w-3.5" />
              Citizen app · Sri Lanka
            </p>
            <h1 className="text-balance text-[2rem] font-semibold leading-tight tracking-tight sm:text-5xl lg:text-[3.35rem] lg:leading-[1.08]">
              Catch dengue early.
              <span className="mt-1 block text-[#7A23A7]">Help your neighbours.</span>
            </h1>
            <p className="mt-4 text-pretty text-sm leading-relaxed text-[#4B5F55] dark:text-white/70 sm:mt-5 sm:text-lg">
              See still water? Take a photo. It takes a few seconds and helps
              your street. No NIC. No login. Just a quieter, safer lane for the
              people next door.
            </p>
            <StoreBadges className="mt-6 sm:mt-8" />
            <p className="mt-3 text-xs text-[#6B7C73] dark:text-white/45 sm:mt-4">
              Coming soon on Google Play and the App Store. No login required.
            </p>
          </div>

          <HeroStage videoSrc={videoSrc} />
        </section>

        <section className="py-10 sm:py-14">
          <ScreenshotMarquee />
        </section>

        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7A23A7]">
              How it works
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-4xl">
              Three small steps. A safer street.
            </h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {HOW_IT_WORKS.map((item) => (
              <article
                key={item.step}
                className="rounded-[1.75rem] border border-[#E4DDD0] bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-white/5"
              >
                <span className="inline-flex h-9 items-center rounded-full bg-[#7A23A7]/10 px-3 text-sm font-semibold text-[#7A23A7]">
                  {item.step}
                </span>
                <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#4B5F55] dark:text-white/65">
                  {item.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
          <div className="grid gap-4 sm:grid-cols-2">
            {highlights.map((item) => (
              <article
                key={item.title}
                className="flex gap-3 rounded-[1.5rem] border border-[#E4DDD0] bg-white/70 p-4 sm:gap-4 sm:rounded-[1.75rem] sm:p-5 dark:border-white/10 dark:bg-white/5"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#7A23A7]/10 text-[#7A23A7]">
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-[#4B5F55] dark:text-white/65">
                    {item.body}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7A23A7]">
              Inside the app
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-4xl">
              Built to feel simple on a hot afternoon.
            </h2>
            <p className="mt-3 text-sm text-[#4B5F55] dark:text-white/65 sm:text-base">
              Big type. Plain words. Rounded cards. The same care you already
              see in DengueSense, now in your pocket.
            </p>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:mt-12 sm:gap-8 lg:grid-cols-4">
            {stories.map((shot) => (
              <figure key={shot.src} className="group mx-auto w-full max-w-[220px]">
                <PhoneFrame className="transition duration-500 group-hover:-translate-y-1 group-hover:shadow-[0_32px_60px_-28px_rgba(122,35,167,0.45)]">
                  <Image
                    src={shot.src}
                    alt={shot.alt}
                    fill
                    sizes="(max-width: 640px) 45vw, 220px"
                    className="object-cover"
                  />
                </PhoneFrame>
                <figcaption className="mt-3 text-center sm:mt-4">
                  <p className="text-sm font-semibold sm:text-base">{shot.title}</p>
                  <p className="mt-1 hidden text-sm leading-relaxed text-[#4B5F55] sm:block dark:text-white/65">
                    {shot.caption}
                  </p>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section
          id="download"
          className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 sm:pb-28"
        >
          <div className="relative overflow-hidden rounded-[1.5rem] bg-[#0B1612] px-4 py-10 text-center text-white sm:rounded-[2rem] sm:px-12 sm:py-16">
            <div
              aria-hidden
              className="pointer-events-none absolute -left-10 top-0 h-48 w-48 rounded-full bg-[#7A23A7]/40 blur-3xl"
            />
            <Image
              src={APP_ICON_SRC}
              alt="DengueSense LK"
              width={160}
              height={160}
              className="mx-auto h-28 w-28 rounded-3xl object-cover shadow-lg ring-2 ring-white/20 sm:h-36 sm:w-36"
            />
            <h2 className="mt-5 text-2xl font-semibold tracking-tight sm:mt-6 sm:text-4xl">
              Get DengueSense LK
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-white/70 sm:text-base">
              Catch dengue early. Help your neighbours. The store listing is on
              its way, made for streets, gardens, and the people who look after them.
            </p>
            <StoreBadges className="mx-auto mt-8 justify-center" />
            <p className="mt-6 inline-flex max-w-xs items-center justify-center gap-2 text-xs text-white/50 sm:max-w-none">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
              No login · no ID card · your name is never asked
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
