import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PhoneFrame } from "@/components/app-promo/phone-frame";

export function HomeAppTeaser() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-24">
      <div className="relative overflow-hidden rounded-[1.5rem] border border-[#E4D2F2]/80 bg-[#F6F4EC] px-4 py-7 shadow-sm dark:border-white/10 dark:bg-[#121C18] sm:rounded-[2rem] sm:px-10 sm:py-12">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#7A23A7]/15 blur-3xl"
        />
        <div className="grid items-center gap-6 lg:grid-cols-[1fr_220px] lg:gap-10">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#7A23A7]/20 bg-white/70 px-3 py-1 text-xs font-medium text-[#5A1C7A] dark:border-white/15 dark:bg-white/5 dark:text-fuchsia-100">
              <Smartphone className="h-3.5 w-3.5" />
              New · citizen app
            </p>
            <h2 className="text-balance text-2xl font-semibold tracking-tight text-[#12382A] dark:text-[#F3F6F1] sm:text-4xl">
              Catch dengue early.
              <span className="mt-1 block text-[#7A23A7]">Help your neighbours.</span>
            </h2>
            <p className="mt-4 max-w-xl text-pretty text-sm leading-relaxed text-[#4B5F55] dark:text-white/70 sm:text-base">
              See still water in a pot, tyre or drain? Take a photo. No name,
              no login. Just a few seconds that helps your street.
            </p>
            <div className="mt-6">
              <Button
                size="lg"
                className="h-11 w-full gap-2 rounded-full bg-[#7A23A7] px-7 text-white hover:bg-[#691E91] sm:h-10 sm:w-auto"
                asChild
              >
                <Link href="/app">
                  Get the app
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="mx-auto w-[160px] sm:w-[180px] lg:w-[200px]">
            <PhoneFrame float>
              <Image
                src="/app-promo/screenshots/home.png"
                alt="DengueSense LK home screen"
                fill
                sizes="200px"
                className="object-cover"
              />
            </PhoneFrame>
          </div>
        </div>
      </div>
    </section>
  );
}
