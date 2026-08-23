"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Brain, ChevronRight, MapPin, Search } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SRI_LANKA_RDHS_ZONES } from "@/lib/districts";
import { assignedRdhsId, canTriggerForecast } from "@/lib/forecasts";
import { useAppStore } from "@/stores/app-store";

export default function ForecastsPage() {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const phiRdhsId = user?.role === "PHI" ? assignedRdhsId(user) : null;
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (user?.role === "PHI" && phiRdhsId) {
      router.replace(`/dashboard/forecasts/${phiRdhsId}`);
    }
  }, [user, phiRdhsId, router]);

  const zones = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SRI_LANKA_RDHS_ZONES;
    return SRI_LANKA_RDHS_ZONES.filter(
      (z) => z.name.toLowerCase().includes(q) || String(z.id).includes(q),
    );
  }, [query]);

  if (user?.role === "PHI" && phiRdhsId) {
    return (
      <DashboardShell title="Forecasts">
        <p className="text-sm text-muted-foreground">
          Opening your assigned RDHS forecast…
        </p>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Forecasts">
      <div className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-6 sm:p-8">
        <div className="flex max-w-2xl flex-col gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Brain className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Four-week outbreak outlook
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Open an RDHS to see its LSTM forecast for the coming month. The
            model reads the last eight weeks of confirmed cases and weather
            already stored in the system. Administrators generate a new run
            when fresh weekly data arrives.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {zones.length} of {SRI_LANKA_RDHS_ZONES.length} divisions
        </p>
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search RDHS…"
            className="pl-9"
          />
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {zones.map((zone) => {
          const canTrigger = canTriggerForecast(user, zone.id);
          return (
            <Link
              key={zone.id}
              href={`/dashboard/forecasts/${zone.id}`}
              className="group"
            >
              <Card className="h-full transition-colors group-hover:border-primary/50 group-hover:bg-muted/30">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-base">{zone.name}</CardTitle>
                    <CardDescription>RDHS #{zone.id}</CardDescription>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </CardHeader>
                <CardContent className="flex items-center gap-2">
                  {canTrigger ? (
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/15">
                      Can generate
                    </Badge>
                  ) : (
                    <Badge variant="secondary">View only</Badge>
                  )}
                  {user?.role === "PHI" && assignedRdhsId(user) === zone.id && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      Assigned
                    </span>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
        {zones.length === 0 && (
          <p className="col-span-full py-12 text-center text-sm text-muted-foreground">
            No RDHS matches “{query}”.
          </p>
        )}
      </div>
    </DashboardShell>
  );
}
