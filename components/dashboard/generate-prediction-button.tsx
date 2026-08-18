"use client";

import { useRef, useState } from "react";
import { Brain, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  ApiError,
  apiGetLatestForecast,
  apiRegenerateForecast,
} from "@/lib/api";
import type { DistrictForecastResponseDTO } from "@/lib/types";

interface GeneratePredictionButtonProps {
  rdhsId: number;
  districtName: string;
  /** True when a prediction already exists for the coming target week. */
  alreadyCurrent: boolean;
  /** Extra lock (e.g. while the page is still loading forecast status). */
  locked?: boolean;
  latestWeekLabel?: string;
  onGenerated: (record: DistrictForecastResponseDTO | null) => void;
  onError?: (err: Error) => void;
  onStart?: () => void;
}

export function GeneratePredictionButton({
  rdhsId,
  districtName,
  alreadyCurrent,
  locked = false,
  latestWeekLabel,
  onGenerated,
  onError,
  onStart,
}: GeneratePredictionButtonProps) {
  const [running, setRunning] = useState(false);
  const inFlight = useRef(false);

  const onClick = async () => {
    if (inFlight.current || locked || alreadyCurrent) return;
    inFlight.current = true;
    setRunning(true);
    onStart?.();

    try {
      const result = await apiRegenerateForecast(rdhsId);
      const record = result ?? (await apiGetLatestForecast(rdhsId));
      onGenerated(record);
      toast.success(
        record?.targetWeekStart
          ? `Prediction generated for ${districtName} (week of ${record.targetWeekStart}).`
          : `Prediction generated for ${districtName}.`,
      );
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        toast.info(
          err.message ||
            (latestWeekLabel
              ? `${districtName} already has a prediction for the week of ${latestWeekLabel}.`
              : `${districtName} already has a prediction for the current week.`),
        );
        onGenerated(await apiGetLatestForecast(rdhsId).catch(() => null));
        return;
      }
      if (err instanceof ApiError && err.status === 403) {
        toast.error(
          "You are not allowed to generate a prediction for this district.",
        );
        onError?.(err);
        return;
      }
      if (err instanceof ApiError && err.status === 422) {
        const message =
          err.message ||
          "Not enough weekly history to generate a prediction for this district.";
        toast.error(message);
        onError?.(err);
        return;
      }
      if (err instanceof ApiError && (err.status === 502 || err.status === 504)) {
        toast.error(
          err.message || "The forecast service is unavailable. Try again later.",
        );
        onError?.(err);
        return;
      }
      const fallback =
        err instanceof Error
          ? err
          : new Error(`Failed to generate prediction for ${districtName}`);
      toast.error(fallback.message);
      onError?.(fallback);
    } finally {
      inFlight.current = false;
      setRunning(false);
    }
  };

  return (
    <Button
      className="gap-2"
      onClick={onClick}
      disabled={running || alreadyCurrent || locked}
      aria-busy={running}
      title={
        alreadyCurrent
          ? "A prediction already exists for the current week"
          : `Generate LSTM prediction for ${districtName}`
      }
    >
      {running ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Generating…
        </>
      ) : (
        <>
          <Brain className="h-4 w-4" />
          Generate Prediction
        </>
      )}
    </Button>
  );
}
