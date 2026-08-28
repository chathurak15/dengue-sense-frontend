import Link from "next/link";
import Image from "next/image";
import { Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { APP_ICON_SRC } from "@/lib/app-promo";
import { cn } from "@/lib/utils";

export function SiteHeader({ active }: { active?: "home" | "app" }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-3 sm:gap-3 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-2 font-semibold sm:gap-2.5">
          <Image
            src={APP_ICON_SRC}
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 rounded-full shadow-sm ring-1 ring-black/10 sm:h-11 sm:w-11"
            loading="eager"
          />
          <span className="truncate">
            <span className="hidden min-[400px]:inline">DengueSense</span>
            <span className="min-[400px]:hidden">DS</span>{" "}
            <span className="text-primary">LK</span>
          </span>
        </Link>

        <nav className="flex shrink-0 items-center gap-0.5 sm:gap-2">
          <Button
            size="sm"
            variant={active === "app" ? "default" : "ghost"}
            className={cn("px-2 sm:px-3", active === "app" && "shadow-sm")}
            asChild
          >
            <Link href="/app" className="gap-1.5">
              <Smartphone className="h-3.5 w-3.5" />
              <span className="sm:hidden">App</span>
              <span className="hidden sm:inline">Get the app</span>
            </Link>
          </Button>
          <ThemeToggle />
          <Button
            size="sm"
            variant={active === "app" ? "outline" : "default"}
            className="px-2.5 sm:px-3"
            asChild
          >
            <Link href="/login">Sign in</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
