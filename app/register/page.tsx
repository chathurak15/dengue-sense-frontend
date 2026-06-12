"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Activity, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAppStore } from "@/stores/app-store";

// ─── Register Page ────────────────────────────────────────────────────────────

interface RegisterForm {
  name: string;
  badge: string;
  email: string;
  password: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const register = useAppStore((s) => s.register);

  const [form, setForm] = useState<RegisterForm>({
    name: "",
    badge: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const update =
    (key: keyof RegisterForm) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      const res = register(form);
      setLoading(false);

      if (!res.ok) {
        toast.error(res.error ?? "Registration failed");
        return;
      }

      // Set the auth cookie so middleware grants /dashboard/* access
      document.cookie = "ds_auth=1; path=/; max-age=86400; SameSite=Lax";
      toast.success("Account created");
      router.push("/dashboard");
    }, 350);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md border-border">
        <CardHeader className="space-y-3 text-center">
          <Link
            href="/"
            className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground"
          >
            <Activity className="h-5 w-5" />
          </Link>
          <CardTitle className="text-2xl">Create PHI account</CardTitle>
          <CardDescription>Register for the surveillance portal</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="Jane Perera"
                value={form.name}
                onChange={update("name")}
                required
                autoComplete="name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="badge">PHI Badge Number</Label>
              <Input
                id="badge"
                placeholder="PHI-2025-0421"
                value={form.badge}
                onChange={update("badge")}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="phi@health.gov.lk"
                value={form.email}
                onChange={update("email")}
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={update("password")}
                required
                autoComplete="new-password"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Create Account"
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already registered?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
