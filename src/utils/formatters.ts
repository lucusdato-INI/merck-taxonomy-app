export function sanitizeTaxonomyString(s: string): string {
  return s.replace(/[^a-zA-Z0-9\-_+]/g, "");
}

export function removeSpaces(s: string): string {
  return s.replace(/\s+/g, "");
}

export function toYearMonth(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}${m}`;
}

export function formatDateMDY(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const y = date.getFullYear();
  return `${m}/${d}/${y}`;
}

export function cleanCampaignName(raw: string): string {
  return raw
    .trim()
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .replace(/\s+/g, "");
}

export function parseDimensions(raw: string): string[] {
  if (!raw || raw.trim().toUpperCase() === "TBD") return ["TBD"];
  return raw
    .split(/[,;\n]+/)
    .map((d) => d.trim().replace(/(\d+)\s*:\s*(\d+)/g, "$1x$2"))
    .filter(Boolean);
}
