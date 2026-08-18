"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Brain, ChevronRight, MapPin } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SRI_LANKA_RDHS_ZONES } from "@/lib/districts";
import { assignedRdhsId, canTriggerForecast } from "@/lib/forecasts";
import { useAppStore } from "@/stores/app-store";

export default function ForecastsPage() {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const phiRdhsId = user?.role === "PHI" ? assignedRdhsId(user) : null;

  useEffect(() => {
    if (user?.role === "PHI" && phiRdhsId) {
      router.replace(`/dashboard/forecasts/${phiRdhsId}`);
    }
  }, [user, phiRdhsId, router]);

  const zones = useMemo(() => SRI_LANKA_RDHS_ZONES, []);

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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            RDHS forecasts
          </CardTitle>
          <CardDescription>
            Open a district to view its LSTM forecast. Only administrators can
            generate a prediction. Same-week predictions are not regenerated.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {zones.map((zone) => {
          const canTrigger = canTriggerForecast(user, zone.id);
          return (
            <Link
              key={zone.id}
              href={`/dashboard/forecasts/${zone.id}`}
              className="group"
            >
              <Card className="h-full transition-colors group-hover:border-primary/40 group-hover:bg-muted/40">
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
      </div>
    </DashboardShell>
  );
}
