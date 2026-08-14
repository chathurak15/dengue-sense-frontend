"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Activity, Clock, ShieldAlert, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAppStore } from "@/stores/app-store";

export default function PendingApprovalPage() {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const logout = useAppStore((s) => s.logout);

  const isRejected = user?.status === "REJECTED";

  const onSignOut = () => {
    logout();
    toast.success("Signed out");
    router.push("/login");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-lg border-border text-center">
        <CardHeader className="space-y-4">
          <Link
            href="/"
            className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground"
          >
            <Activity className="h-5 w-5" />
          </Link>

          {isRejected ? (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-2xl">
                Registration Rejected
              </CardTitle>
              <CardDescription className="text-base">
                Unfortunately, your registration has been rejected by the
                administrator. Please contact your MOH office for more
                information.
              </CardDescription>
            </>
          ) : (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10">
                <Clock className="h-8 w-8 text-amber-500" />
              </div>
              <CardTitle className="text-2xl">
                Approval Pending
              </CardTitle>
              <CardDescription className="text-base">
                Your PHI account registration has been submitted successfully.
                An administrator needs to review and approve your account before
                you can access the dashboard.
              </CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
              <div className="text-left text-sm text-muted-foreground">
                <p className="font-medium text-foreground">What happens next?</p>
                <ul className="mt-2 space-y-1">
                  <li>1. An admin will review your registration</li>
                  <li>2. Once approved, you can sign in and access the PHI dashboard</li>
                  <li>3. You will be assigned to your district for field operations</li>
                </ul>
              </div>
            </div>
          </div>

          {user && (
            <p className="text-sm text-muted-foreground">
              Registered as <span className="font-medium">{user.email}</span>
            </p>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button variant="outline" onClick={onSignOut}>
              Sign out
            </Button>
            <Button
              variant="default"
              onClick={() => {
                router.push("/login");
              }}
            >
              Try signing in again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
