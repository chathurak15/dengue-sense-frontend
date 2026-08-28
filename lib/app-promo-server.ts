/** Drop the edited screen-record film at public/app-promo/preview.mp4 (or .webm). */

import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  APP_PROMO_VIDEO_SRC,
  APP_PROMO_VIDEO_WEBM_SRC,
} from "@/lib/app-promo";

export function getPromoVideoSrc(): string | null {
  const dir = join(process.cwd(), "public", "app-promo");
  if (existsSync(join(dir, "preview.mp4"))) return APP_PROMO_VIDEO_SRC;
  if (existsSync(join(dir, "preview.webm"))) return APP_PROMO_VIDEO_WEBM_SRC;
  return null;
}
