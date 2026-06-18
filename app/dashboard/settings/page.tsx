"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Save, Shield, Bell, User as UserIcon, Cpu } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppStore } from "@/stores/app-store";
import type { Settings } from "@/lib/types";

// ─── Sub-Components ───────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}

function Field({ label, value, onChange, type = "text" }: FieldProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

interface SettingRowProps {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

function SettingRow({ label, hint, checked, onChange }: SettingRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-md border border-border p-4">
      <div>
        <div className="font-medium">{label}</div>
        <div className="text-sm text-muted-foreground">{hint}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

// ─── Profile Form State ───────────────────────────────────────────────────────

interface ProfileForm {
  name: string;
  badge: string;
  email: string;
  phone: string;
}

interface PasswordForm {
  current: string;
  next: string;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const user = useAppStore((s) => s.user);
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);

  const [profile, setProfile] = useState<ProfileForm>({
    name: user?.name ?? "Jane Perera",
    badge: user?.badge ?? "PHI-2025-0421",
    email: user?.email ?? "jane.perera@health.gov.lk",
    phone: "+94 71 234 5678",
  });

  const [pw, setPw] = useState<PasswordForm>({ current: "", next: "" });

  /** Type-safe settings updater */
  const set =
    <K extends keyof Settings>(key: K) =>
    (value: Settings[K]) =>
      updateSettings({ [key]: value } as Partial<Settings>);

  const saveProfile = () => toast.success("Profile updated");

  const saveSecurity = () => {
    if (pw.next && pw.next.length < 4) {
      toast.error("New password must be at least 4 characters");
      return;
    }
    setPw({ current: "", next: "" });
    toast.success("Security settings updated");
  };

  const saveAi = () => toast.success("AI engine settings saved");

  return (
    <DashboardShell title="Settings">
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="profile" className="gap-1.5">
            <UserIcon className="h-4 w-4" /> Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5">
            <Bell className="h-4 w-4" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-1.5">
            <Shield className="h-4 w-4" /> Security
          </TabsTrigger>
          <TabsTrigger value="ai" className="gap-1.5">
            <Cpu className="h-4 w-4" /> AI Engine
          </TabsTrigger>
        </TabsList>

        {/* ── Profile Tab ── */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>PHI Profile</CardTitle>
              <CardDescription>
                Information visible to your MOH supervisor
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary/10 text-primary text-lg">
                    {user?.initials ?? "JP"}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <div className="font-medium">{profile.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {profile.badge} · Colombo MOH
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toast.info("Photo upload coming soon")}
                  >
                    Change photo
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Full name"
                  value={profile.name}
                  onChange={(v) => setProfile({ ...profile, name: v })}
                />
                <Field
                  label="Badge number"
                  value={profile.badge}
                  onChange={(v) => setProfile({ ...profile, badge: v })}
                />
                <Field
                  label="Email"
                  type="email"
                  value={profile.email}
                  onChange={(v) => setProfile({ ...profile, email: v })}
                />
                <Field
                  label="Phone"
                  value={profile.phone}
                  onChange={(v) => setProfile({ ...profile, phone: v })}
                />
                <div className="space-y-2">
                  <Label>MOH area</Label>
                  <Select
                    value={settings.mohArea}
                    onValueChange={set("mohArea")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cmb">Colombo</SelectItem>
                      <SelectItem value="gmp">Gampaha</SelectItem>
                      <SelectItem value="kdy">Kandy</SelectItem>
                      <SelectItem value="gll">Galle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select
                    value={settings.language}
                    onValueChange={set("language")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="si">සිංහල</SelectItem>
                      <SelectItem value="ta">தமிழ்</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button className="gap-1.5" onClick={saveProfile}>
                  <Save className="h-4 w-4" /> Save changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Notifications Tab ── */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose when DengueSense alerts reach you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SettingRow
                label="High-risk alerts"
                hint="Instant push for any High AI-classified report in your area."
                checked={settings.notifyHigh}
                onChange={set("notifyHigh")}
              />
              <SettingRow
                label="Daily digest"
                hint="Summary email at 7:00 AM with new clusters and forecasts."
                checked={settings.notifyDigest}
                onChange={set("notifyDigest")}
              />
              <SettingRow
                label="SMS fallback"
                hint="Send SMS if push isn't delivered within 5 minutes."
                checked={settings.notifySms}
                onChange={set("notifySms")}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Security Tab ── */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>
                Manage authentication and active sessions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Current password</Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={pw.current}
                    onChange={(e) => setPw({ ...pw, current: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>New password</Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={pw.next}
                    onChange={(e) => setPw({ ...pw, next: e.target.value })}
                  />
                </div>
              </div>
              <Separator />
              <SettingRow
                label="Two-factor authentication"
                hint="Require an authenticator code at sign-in."
                checked={settings.twoFa}
                onChange={set("twoFa")}
              />
              <div>
                <div className="font-medium">Active sessions</div>
                <ul className="mt-3 space-y-2 text-sm">
                  <li className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                    <div>
                      <div className="font-medium">Chrome · macOS</div>
                      <div className="text-xs text-muted-foreground">
                        Colombo · this device
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Active now
                    </span>
                  </li>
                  <li className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                    <div>
                      <div className="font-medium">Pixel 7 · Android</div>
                      <div className="text-xs text-muted-foreground">
                        Last active 2 days ago
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toast.success("Session revoked")}
                    >
                      Sign out
                    </Button>
                  </li>
                </ul>
              </div>
              <div className="flex justify-end">
                <Button className="gap-1.5" onClick={saveSecurity}>
                  <Save className="h-4 w-4" /> Update security
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── AI Engine Tab ── */}
        <TabsContent value="ai">
          <Card>
            <CardHeader>
              <CardTitle>AI Engine</CardTitle>
              <CardDescription>
                Tune classifier sensitivity and dispatch behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Risk threshold</Label>
                  <Select
                    value={settings.riskThreshold}
                    onValueChange={(v) =>
                      set("riskThreshold")(
                        v as Settings["riskThreshold"]
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sensitive">
                        Sensitive (fewer missed)
                      </SelectItem>
                      <SelectItem value="balanced">Balanced</SelectItem>
                      <SelectItem value="specific">
                        Specific (fewer false alarms)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Forecast model</Label>
                  <Select
                    value={settings.forecastModel}
                    onValueChange={(v) =>
                      set("forecastModel")(v as Settings["forecastModel"])
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lstm-v3">LSTM v3 (default)</SelectItem>
                      <SelectItem value="lstm-v2">LSTM v2</SelectItem>
                      <SelectItem value="arima">ARIMA baseline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Separator />
              <SettingRow
                label="Auto-dispatch on High risk"
                hint="Automatically assign nearest PHI to High-risk verified reports."
                checked={settings.autoDispatch}
                onChange={set("autoDispatch")}
              />
              <div className="flex justify-end">
                <Button className="gap-1.5" onClick={saveAi}>
                  <Save className="h-4 w-4" /> Save engine settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}
