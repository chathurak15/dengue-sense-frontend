import { cn } from "@/lib/utils";

export function PhoneFrame({
  children,
  className,
  float = false,
}: {
  children: React.ReactNode;
  className?: string;
  float?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative aspect-[460/1024] overflow-hidden rounded-[1.85rem] bg-zinc-950 p-[6px] shadow-[0_28px_70px_-24px_rgba(12,18,14,0.55)] ring-1 ring-white/25 sm:rounded-[2.4rem] sm:p-[8px]",
        float && "ds-float",
        className,
      )}
    >
      <div className="relative h-full w-full overflow-hidden rounded-[1.45rem] bg-[#F8F7F2] sm:rounded-[1.95rem]">
        {children}
      </div>
    </div>
  );
}
