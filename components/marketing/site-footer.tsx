export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:px-6">
        <span>Developed by Chathura Kavindu Bandara</span>
        <span suppressHydrationWarning>
          © {new Date().getFullYear()} All rights reserved.
        </span>
      </div>
    </footer>
  );
}
