"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Map,
  Bell,
  LineChart,
  Settings,
  Search,
  Activity,
  ChevronDown,
  Users,
  Shield,
  Menu,
  FileSpreadsheet,
  MapPinned,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";
import { apiLogout } from "@/lib/api";
import { assignedRdhsId } from "@/lib/forecasts";

// ─── Nav Definition ───────────────────────────────────────────────────────────

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["PHI", "MOH", "EPIDEMIOLOGIST", "VOLUNTEER"] },
  { href: "/dashboard/admin", label: "User Management", icon: Users, roles: ["ADMIN", "MOH"] },
  { href: "/dashboard/districts", label: "Districts", icon: MapPinned, roles: ["ADMIN", "MOH", "EPIDEMIOLOGIST"] },
  { href: "/dashboard/cases", label: "Weekly Cases", icon: FileSpreadsheet, roles: ["PHI", "MOH", "ADMIN", "EPIDEMIOLOGIST"] },
  { href: "/dashboard/heatmap", label: "Heatmap", icon: Map, roles: ["PHI", "MOH", "ADMIN", "EPIDEMIOLOGIST"] },
  { href: "/dashboard/alerts", label: "Alerts", icon: Bell, roles: ["PHI", "MOH", "ADMIN", "EPIDEMIOLOGIST"] },
  { href: "/dashboard/forecasts", label: "Forecasts", icon: LineChart, roles: ["PHI", "MOH", "ADMIN", "EPIDEMIOLOGIST"] },
  { href: "/dashboard/settings", label: "Profile", icon: Settings },
];

// ─── Dashboard Shell ──────────────────────────────────────────────────────────

interface DashboardShellProps {
  title: string;
  children: React.ReactNode;
}

export function DashboardShell({ title, children }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const hydrateUser = useAppStore((s) => s.hydrateUser);
  const logout = useAppStore((s) => s.logout);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    hydrateUser();
  }, [hydrateUser]);

  const userRole = user?.role ?? "PHI";
  const forecastsHref =
    userRole === "PHI"
      ? (() => {
          const id = assignedRdhsId(user);
          return id ? `/dashboard/forecasts/${id}` : "/dashboard/forecasts";
        })()
      : "/dashboard/forecasts";

  const visibleNav = navItems
    .filter((item) => !item.roles || item.roles.includes(userRole))
    .map((item) =>
      item.href === "/dashboard/forecasts"
        ? { ...item, href: forecastsHref }
        : item,
    );

  const onSignOut = async () => {
    try {
      await apiLogout();
    } catch {
      // Cookie cleanup happens regardless
    }
    logout();
    toast.success("Signed out");
    router.push("/login");
  };

  const portalLabel =
    userRole === "ADMIN"
      ? "Admin Portal"
      : userRole === "MOH"
        ? "MOH Portal"
        : "PHI Portal";

  const navLinks = visibleNav.map((item) => {
    const active =
      item.label === "Forecasts"
        ? pathname.startsWith("/dashboard/forecasts")
        : item.href === "/dashboard"
          ? pathname === "/dashboard"
          : pathname.startsWith(item.href);

    return (
      <Link
        key={item.label}
        href={item.href}
        onClick={() => setMobileMenuOpen(false)}
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          active
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        <item.icon className="h-4 w-4" />
        {item.label}
      </Link>
    );
  });

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden bg-background text-foreground">
      {/* ── Sidebar ── */}
      <aside className="hidden w-60 shrink-0 border-r border-border bg-card/40 md:flex md:flex-col">
        <div className="flex h-16 items-center gap-2 border-b border-border px-5 font-semibold">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Activity className="h-4 w-4" />
          </div>
          <span>
            DengueSense <span className="text-primary">LK</span>
          </span>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navLinks}
        </nav>

        <div className="border-t border-border p-3 text-xs text-muted-foreground">
          v1.0 | {portalLabel}
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Bar */}
        <header className="flex h-14 min-w-0 items-center justify-between gap-2 border-b border-border px-3 sm:h-16 sm:gap-4 sm:px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0 md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle mobile menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[min(18rem,85vw)] p-0">
                <SheetHeader className="p-4 text-left border-b border-border flex flex-row items-center gap-2 space-y-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                    <Activity className="h-4 w-4" />
                  </div>
                  <SheetTitle className="text-base font-semibold">
                    DengueSense <span className="text-primary">LK</span>
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex-1 space-y-1 p-3">
                  {navLinks}
                </nav>
                <div className="absolute bottom-0 w-full border-t border-border p-3 text-xs text-muted-foreground">
                  v1.0 | {portalLabel}
                </div>
              </SheetContent>
            </Sheet>

            <div className="min-w-0">
              <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
                {portalLabel} / {title}
                {userRole === "ADMIN" && (
                  <Badge
                    variant="secondary"
                    className="bg-purple-500/15 text-purple-600 dark:text-purple-400 text-[10px] px-1.5 py-0"
                  >
                    <Shield className="mr-0.5 h-2.5 w-2.5" />
                    Admin
                  </Badge>
                )}
              </div>
              <h1 className="truncate text-base font-semibold sm:text-lg">{title}</h1>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <div className="relative hidden lg:block">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search locations, reports..."
                className="w-72 pl-9"
              />
            </div>

            <ThemeToggle />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-1.5 sm:px-2">
                  <Avatar className="h-7 w-7">
                    {user?.image ? (
                      <AvatarImage src={user.image} alt={user.name} />
                    ) : null}
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {user?.initials ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden max-w-[8rem] truncate text-sm md:block">
                    {user?.name ?? "User"}
                  </span>
                  <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="space-y-0.5">
                  <p className="truncate">{user?.email ?? "My Account"}</p>
                  <p className="text-xs font-normal text-muted-foreground truncate">
                    {userRole} | {user?.districtName ?? "System"}
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={onSignOut}>
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
