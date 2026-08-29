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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ThemeToggle } from "@/components/theme-toggle";
import { apiRegister } from "@/lib/api";
import { SRI_LANKA_DISTRICTS } from "@/lib/districts";
import type { RoleType } from "@/lib/types";

interface RegisterForm {
  fname: string;
  lname: string;
  email: string;
  password: string;
  phoneNumber: string;
  districtId: string;
}

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState<RegisterForm>({
    fname: "",
    lname: "",
    email: "",
    password: "",
    phoneNumber: "",
    districtId: "",
  });
  const [loading, setLoading] = useState(false);

  const update =
    (key: keyof RegisterForm) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (!form.districtId) {
      toast.error("Please select your district");
      return;
    }

    setLoading(true);
    try {
      const role: RoleType = "PHI";
      await apiRegister({
        fname: form.fname,
        lname: form.lname,
        email: form.email,
        password: form.password,
        phoneNumber: form.phoneNumber || undefined,
        role,
        districtId: Number(form.districtId),
      });

      toast.success(
        "Account created. After approval, sign in and tap Enable Telegram alerts — no codes to type.",
      );
      router.push("/login");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Registration failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
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
          <CardTitle className="text-2xl">Create PHI Account</CardTitle>
          <CardDescription>
            Register for the surveillance portal. Your account will require
            admin approval before you can access the dashboard.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="fname">First Name</Label>
                <Input
                  id="fname"
                  placeholder="Jane"
                  value={form.fname}
                  onChange={update("fname")}
                  required
                  autoComplete="given-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lname">Last Name</Label>
                <Input
                  id="lname"
                  placeholder="Perera"
                  value={form.lname}
                  onChange={update("lname")}
                  required
                  autoComplete="family-name"
                />
              </div>
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
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+94771234567"
                value={form.phoneNumber}
                onChange={update("phoneNumber")}
                autoComplete="tel"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="district">District</Label>
              <Select
                value={form.districtId}
                onValueChange={(val) =>
                  setForm((prev) => ({ ...prev, districtId: val }))
                }
              >
                <SelectTrigger id="district">
                  <SelectValue placeholder="Select your district" />
                </SelectTrigger>
                <SelectContent>
                  {SRI_LANKA_DISTRICTS.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                minLength={6}
                autoComplete="new-password"
              />
              <p className="text-xs text-muted-foreground">
                Minimum 6 characters
              </p>
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
