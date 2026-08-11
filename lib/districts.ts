export const SRI_LANKA_DISTRICTS = [
  { id: 1, name: "Colombo" },
  { id: 2, name: "Gampaha" },
  { id: 3, name: "Kalutara" },
  { id: 4, name: "Kandy" },
  { id: 5, name: "Matale" },
  { id: 6, name: "Nuwara Eliya" },
  { id: 7, name: "Galle" },
  { id: 8, name: "Matara" },
  { id: 9, name: "Hambantota" },
  { id: 10, name: "Jaffna" },
  { id: 11, name: "Kilinochchi" },
  { id: 12, name: "Mannar" },
  { id: 13, name: "Vavuniya" },
  { id: 14, name: "Mullaitivu" },
  { id: 15, name: "Batticaloa" },
  { id: 16, name: "Ampara" },
  { id: 17, name: "Trincomalee" },
  { id: 18, name: "Kurunegala" },
  { id: 19, name: "Puttalam" },
  { id: 20, name: "Anuradhapura" },
  { id: 21, name: "Polonnaruwa" },
  { id: 22, name: "Badulla" },
  { id: 23, name: "Monaragala" },
  { id: 24, name: "Ratnapura" },
  { id: 25, name: "Kegalle" },
] as const;

export function districtIdFromName(name: string | null | undefined): number {
  if (!name) return 1;
  const match = SRI_LANKA_DISTRICTS.find(
    (d) => d.name.toLowerCase() === name.toLowerCase(),
  );
  return match?.id ?? 1;
}

export function districtNameFromId(id: number): string | null {
  return SRI_LANKA_DISTRICTS.find((d) => d.id === id)?.name ?? null;
}

/**
 * 26 RDHS divisions. IDs are LSTM `rdhs_model_id` values (alphabetical 0–25),
 * matching backend V7 and POST /api/v1/admin/forecasts/{rdhsId}/regenerate.
 */
export const SRI_LANKA_RDHS_ZONES = [
  { id: 4, name: "Colombo" },
  { id: 6, name: "Gampaha" },
  { id: 10, name: "Kalutara" },
  { id: 11, name: "Kandy" },
  { id: 16, name: "Matale" },
  { id: 20, name: "Nuwara Eliya" },
  { id: 5, name: "Galle" },
  { id: 17, name: "Matara" },
  { id: 7, name: "Hambantota" },
  { id: 8, name: "Jaffna" },
  { id: 13, name: "Kilinochchi" },
  { id: 15, name: "Mannar" },
  { id: 25, name: "Vavuniya" },
  { id: 19, name: "Mullaitivu" },
  { id: 3, name: "Batticaloa" },
  { id: 0, name: "Ampara" },
  { id: 9, name: "Kalmunai" },
  { id: 24, name: "Trincomalee" },
  { id: 14, name: "Kurunegala" },
  { id: 22, name: "Puttalam" },
  { id: 1, name: "Anuradhapura" },
  { id: 21, name: "Polonnaruwa" },
  { id: 2, name: "Badulla" },
  { id: 18, name: "Monaragala" },
  { id: 23, name: "Ratnapura" },
  { id: 12, name: "Kegalle" },
] as const;

/** 26 RDHS divisions (Ampara is split; Kalmunai is the 26th). */
export const SRI_LANKA_RDHS = [
  "Colombo",
  "Gampaha",
  "Kalutara",
  "Kandy",
  "Matale",
  "Nuwara Eliya",
  "Galle",
  "Matara",
  "Hambantota",
  "Jaffna",
  "Kilinochchi",
  "Mannar",
  "Vavuniya",
  "Mullaitivu",
  "Batticaloa",
  "Ampara",
  "Kalmunai",
  "Trincomalee",
  "Kurunegala",
  "Puttalam",
  "Anuradhapura",
  "Polonnaruwa",
  "Badulla",
  "Monaragala",
  "Ratnapura",
  "Kegalle",
] as const;

export function rdhsNameFromId(id: number): string | null {
  return SRI_LANKA_RDHS_ZONES.find((z) => z.id === id)?.name ?? null;
}

export function rdhsIdFromName(name: string | null | undefined): number | null {
  if (!name) return null;
  const match = SRI_LANKA_RDHS_ZONES.find(
    (z) => z.name.toLowerCase() === name.toLowerCase(),
  );
  return match?.id ?? null;
}
