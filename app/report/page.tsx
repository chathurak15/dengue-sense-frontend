"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  Activity,
  Upload,
  MapPin,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAppStore } from "@/stores/app-store";
import type { Risk } from "@/lib/types";

// ─── Report Page ──────────────────────────────────────────────────────────────

interface SubmitResult {
  id: string;
  risk: Risk;
}

export default function ReportPage() {
  const router = useRouter();
  const addReport = useAppStore((s) => s.addReport);

  const fileInput = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [loc, setLoc] = useState("");
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<SubmitResult | null>(null);

  const onPickPhoto = () => fileInput.current?.click();

  const onPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPhoto(file.name);
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }
    toast.info("Detecting location…");
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setLoc(
          `Lat ${pos.coords.latitude.toFixed(4)}, Lng ${pos.coords.longitude.toFixed(4)}`
        ),
      () =>
        toast.error("Could not detect location. Please type the address.")
    );
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!loc.trim()) {
      toast.error("Location is required");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const row = addReport({
        loc: loc.trim(),
        description: desc.trim() || undefined,
      });
      setLoading(false);
      setDone({ id: row.id, risk: row.risk });
      toast.success(`Report ${row.id} submitted · AI risk: ${row.risk}`);
    }, 600);
  };

  const resetForm = () => {
    setDone(null);
    setLoc("");
    setDesc("");
    setPhoto(null);
  };

  // ── Success State ──────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-background px-4">
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <CardTitle>Thank you</CardTitle>
            <CardDescription>
              Report <span className="font-mono">{done.id}</span> received. AI
              risk classified as <b>{done.risk}</b>. A PHI will review shortly.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button onClick={resetForm}>Submit another report</Button>
            <Button variant="outline" onClick={() => router.push("/")}>
              Back to home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Report Form ────────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen bg-background px-4 py-12">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <Activity className="h-4 w-4 text-primary" /> DengueSense LK
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Report a suspected breeding site</CardTitle>
            <CardDescription>
              Your report is processed by our AI classifier and reviewed by a
              PHI.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              {/* Photo Upload */}
              <div className="space-y-2">
                <Label>Photo of the site</Label>
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onPhotoChange}
                />
                <button
                  type="button"
                  onClick={onPickPhoto}
                  className="flex h-40 w-full cursor-pointer items-center justify-center rounded-md border border-dashed border-border bg-muted/30 text-sm text-muted-foreground transition-colors hover:border-primary/50"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-5 w-5" />
                    {photo ? (
                      <span className="text-foreground">{photo}</span>
                    ) : (
                      "Upload or take a photo"
                    )}
                  </div>
                </button>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="loc">Location</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="loc"
                      className="pl-9"
                      placeholder="Detect or enter address"
                      value={loc}
                      onChange={(e) => setLoc(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="button" variant="outline" onClick={detectLocation}>
                    Detect
                  </Button>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="desc">Description (optional)</Label>
                <Textarea
                  id="desc"
                  placeholder="Standing water in a discarded tire near…"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Submit Report"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
