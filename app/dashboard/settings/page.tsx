"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Save, User as UserIcon } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/stores/app-store";
import { apiUpdateUser } from "@/lib/api";
import {
  SRI_LANKA_DISTRICTS,
  districtIdFromName,
  districtNameFromId,
} from "@/lib/districts";

const PHONE_PATTERN = /^\+?[0-9]{10,12}$/;

export default function SettingsPage() {
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const hydrateUser = useAppStore((s) => s.hydrateUser);

  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [image, setImage] = useState("");
  const [districtId, setDistrictId] = useState("1");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    hydrateUser();
  }, [hydrateUser]);

  useEffect(() => {
    if (!user) return;
    setFname(user.fname || user.name.split(" ")[0] || "");
    setLname(user.lname || user.name.split(" ").slice(1).join(" ") || "");
    setPhoneNumber(user.phoneNumber ?? "");
    setImage(user.image ?? "");
    setDistrictId(String(districtIdFromName(user.districtName)));
  }, [user]);

  const saveProfile = async () => {
    if (!user) {
      toast.error("Please sign in again to update your profile");
      return;
    }
    if (!fname.trim() || !lname.trim()) {
      toast.error("First name and last name are required");
      return;
    }
    const phone = phoneNumber.trim();
    if (phone && !PHONE_PATTERN.test(phone)) {
      toast.error("Phone must be 10-12 digits, optionally starting with +");
      return;
    }

    setSaving(true);
    try {
      const result = await apiUpdateUser({
        email: user.email,
        fname: fname.trim(),
        lname: lname.trim(),
        phoneNumber: phone || undefined,
        image: image.trim() || undefined,
        districtId: Number(districtId),
      });

      if (typeof result === "string" && result.toLowerCase().includes("not found")) {
        toast.error(result);
        return;
      }

      const nextName = `${fname.trim()} ${lname.trim()}`;
      setUser({
        ...user,
        fname: fname.trim(),
        lname: lname.trim(),
        name: nextName,
        phoneNumber: phone || null,
        image: image.trim() || null,
        districtName: districtNameFromId(Number(districtId)),
        districtId: Number(districtId),
        initials: `${fname.trim()[0] ?? ""}${lname.trim()[0] ?? ""}`
          .slice(0, 2)
          .toUpperCase(),
      });
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardShell title="Profile">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-primary" />
            <CardTitle>Your profile</CardTitle>
          </div>
          <CardDescription>
            These fields map to the backend user record. Email cannot be changed
            because it identifies your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              {image ? <AvatarImage src={image} alt={user?.name} /> : null}
              <AvatarFallback className="bg-primary/10 text-primary text-lg">
                {user?.initials ?? "U"}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <div className="font-medium">{user?.name ?? "-"}</div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>{user?.email ?? "Not signed in"}</span>
                {user?.role && <Badge variant="secondary">{user.role}</Badge>}
                {user?.status && (
                  <Badge
                    variant="outline"
                    className={
                      user.status === "APPROVED"
                        ? "border-emerald-500/40 text-emerald-600"
                        : "border-amber-500/40 text-amber-600"
                    }
                  >
                    {user.status}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fname">First name</Label>
              <Input
                id="fname"
                value={fname}
                onChange={(e) => setFname(e.target.value)}
                required
                autoComplete="given-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lname">Last name</Label>
              <Input
                id="lname"
                value={lname}
                onChange={(e) => setLname(e.target.value)}
                required
                autoComplete="family-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user?.email ?? ""}
                disabled
                className="bg-muted/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+94771234567"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                autoComplete="tel"
              />
              <p className="text-xs text-muted-foreground">
                10-12 digits, optional leading +
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="district">District</Label>
              <Select value={districtId} onValueChange={setDistrictId}>
                <SelectTrigger id="district">
                  <SelectValue placeholder="Select district" />
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
              <Label htmlFor="image">Profile image URL</Label>
              <Input
                id="image"
                type="url"
                placeholder="https://…"
                value={image}
                onChange={(e) => setImage(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              className="w-full gap-1.5 sm:w-auto"
              onClick={saveProfile}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save profile
            </Button>
          </div>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
