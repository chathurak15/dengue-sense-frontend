export function LiveMapStatus({ usingDemo }: { usingDemo: boolean }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 text-xs">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      {usingDemo ? "Demo" : "Live"} OSM
    </span>
  );
}
