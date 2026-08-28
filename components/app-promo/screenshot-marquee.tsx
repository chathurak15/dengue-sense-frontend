import Image from "next/image";
import { APP_SCREENSHOTS } from "@/lib/app-promo";
import { PhoneFrame } from "@/components/app-promo/phone-frame";

export function ScreenshotMarquee() {
  const loop = [...APP_SCREENSHOTS, ...APP_SCREENSHOTS];

  return (
    <div className="ds-marquee relative overflow-hidden">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#F6F4EC] to-transparent dark:from-[#0B1612] sm:w-28" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#F6F4EC] to-transparent dark:from-[#0B1612] sm:w-28" />
      <div className="ds-marquee-track flex w-max gap-5 py-2">
        {loop.map((shot, i) => (
          <figure
            key={`${shot.src}-${i}`}
            className="w-[120px] shrink-0 sm:w-[168px]"
          >
            <PhoneFrame>
              <Image
                src={shot.src}
                alt={shot.alt}
                fill
                sizes="168px"
                className="object-cover"
              />
            </PhoneFrame>
            <figcaption className="mt-3 px-1 text-center text-xs font-medium text-[#1F3D2E] dark:text-emerald-50/80">
              {shot.title}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
