"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  FileSpreadsheet,
  Loader2,
  Upload,
  Download,
  CheckCircle2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { apiUploadWeeklyCasesCsv } from "@/lib/api";
import type { CsvImportResultDTO } from "@/lib/types";
import { SRI_LANKA_RDHS } from "@/lib/districts";

function isoLocal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function lastCompleteWeek(): { start: string; end: string } {
  const today = new Date();
  const day = today.getDay(); // 0 Sun … 1 Mon
  const daysSinceMonday = (day + 6) % 7;
  const thisMonday = new Date(today);
  thisMonday.setDate(today.getDate() - daysSinceMonday);
  const lastMonday = new Date(thisMonday);
  lastMonday.setDate(thisMonday.getDate() - 7);
  const lastSunday = new Date(lastMonday);
  lastSunday.setDate(lastMonday.getDate() + 6);
  return { start: isoLocal(lastMonday), end: isoLocal(lastSunday) };
}

function buildTemplateCsv(): string {
  const { start, end } = lastCompleteWeek();
  const header = "rdhs,week_cases,cumulative_cases,week_start_date,week_end_date";
  const rows = SRI_LANKA_RDHS.map((rdhs) => `${rdhs},0,0,${start},${end}`);
  return `${header}\n${rows.join("\n")}\n`;
}

const MAX_BYTES = 10 * 1024 * 1024;

function downloadTemplate() {
  const blob = new Blob([buildTemplateCsv()], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "dengue-weekly-cases-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function WeeklyCasesUploadCard({
  onImported,
}: {
  onImported?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<CsvImportResultDTO | null>(null);

  const onPick = (next: File | null) => {
    setResult(null);
    setPreview([]);
    if (!next) {
      setFile(null);
      return;
    }
    if (!next.name.toLowerCase().endsWith(".csv")) {
      toast.error("Please choose a .csv file");
      return;
    }
    if (next.size > MAX_BYTES) {
      toast.error("File is larger than 10 MB");
      return;
    }
    setFile(next);
    void next.text().then((text) => {
      setPreview(
        text
          .split(/\r?\n/)
          .filter((line) => line.trim().length > 0)
          .slice(0, 4),
      );
    });
  };

  const onUpload = async () => {
    if (!file) {
      toast.error("Choose a CSV file first");
      return;
    }
    setUploading(true);
    try {
      const data = await apiUploadWeeklyCasesCsv(file);
      setResult(data);
      const saved = data.imported + data.updated;
      toast.success(
        saved > 0
          ? `Imported ${data.imported} new and updated ${data.updated} weekly case rows`
          : "No rows were imported. Check the file format.",
      );
      if (saved > 0) onImported?.();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to upload CSV",
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Weekly dengue cases
          </CardTitle>
          <CardDescription>
            Upload an epidemiology CSV with all 26 RDHS rows. Required
            columns: rdhs (or district), week_cases, week_start_date
            (YYYY-MM-DD). Optional: week_end_date, cumulative_cases.
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-1.5 sm:w-auto"
          onClick={downloadTemplate}
        >
          <Download className="h-4 w-4" />
          Download template
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => onPick(e.target.files?.[0] ?? null)}
        />
        <div className="space-y-2">
          <Label htmlFor="weekly-cases-csv">CSV file</Label>
          <button
            id="weekly-cases-csv"
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-border bg-muted/30 px-4 py-8 text-sm text-muted-foreground transition-colors hover:border-primary/50"
          >
            <Upload className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {file ? file.name : "Choose dengue weekly case CSV"}
            </span>
          </button>
        </div>
        {preview.length > 0 && (
          <pre className="max-h-28 overflow-auto rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
            {preview.join("\n")}
          </pre>
        )}
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            className="w-full gap-1.5 sm:w-auto"
            disabled={!file || uploading}
            onClick={onUpload}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Upload CSV
          </Button>
        </div>
        {result && (
          <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              {result.totalRows} rows read: {result.imported} imported,{" "}
              {result.updated} updated, {result.skipped} skipped
            </div>
            {(result.errors ?? []).length > 0 && (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                {(result.errors ?? []).slice(0, 8).map((err, i) => (
                  <li key={`${i}-${err}`}>{err}</li>
                ))}
                {(result.errors ?? []).length > 8 && (
                  <li>and {(result.errors ?? []).length - 8} more</li>
                )}
              </ul>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
