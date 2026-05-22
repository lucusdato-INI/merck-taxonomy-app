import type {
  ProductKey,
  ProductConfig,
  PlatformMapping,
  CampaignTypeKey,
  CampaignTypeAcronym,
  ObjectiveKey,
  ObjectiveAcronym,
  ContentPurposeAcronym,
  AdFormat,
  MatchType,
} from "./types";

// ── Product Configurations ────────────────────────────────────────────────────

export const PRODUCTS: Record<ProductKey, ProductConfig> = {
  PCN: {
    product_name: "Capvaxive",
    product_acronym: "PCN",
    default_audience: "HCCO",
    default_content_purpose: "PRDAW",
    personas: {
      type: "paired",
      pairs: {
        female: {
          pair_name: "Harriet-Alma",
          individual_names: ["Harriet", "Alma"],
          gender: "All",
          gender_acronym: "A",
          age_demo: "50-99",
        },
        male: {
          pair_name: "Henri-Archie",
          individual_names: ["Henry", "Archie"],
          gender: "All",
          gender_acronym: "A",
          age_demo: "50-99",
        },
      },
      geo_behavior: "national",
      geo_code: "NTL",
      province: "NA",
    },
    provinces_en: ["AB", "BC", "ON", "QC"],
    provinces_fr: ["QC"],
  },
  GSL: {
    product_name: "Gardasil 9",
    product_acronym: "GSL",
    default_audience: "HCCO",
    default_content_purpose: "DA",
    personas: {
      type: "individual",
      named: {
        "Sofia-Maya": { gender: "Female", gender_acronym: "F", age_demo: "27-45" },
        "Chris-Adam": { gender: "Male", gender_acronym: "M", age_demo: "27-45" },
        Jamal: { gender: "All", gender_acronym: "A", age_demo: "18-26" },
        Lila: { gender: "Female", gender_acronym: "F", age_demo: "27-45" },
        Adam: { gender: "Male", gender_acronym: "M", age_demo: "27-45" },
        Maya: { gender: "Female", gender_acronym: "F", age_demo: "30-45" },
        Chris: { gender: "Male", gender_acronym: "M", age_demo: "27-45" },
      },
      geo_behavior: "per_province",
      geo_code: "LCL",
    },
    provinces_en: ["AB", "BC", "ON"],
    provinces_fr: ["QC"],
  },
  GSL_HCP: {
    product_name: "Gardasil 9 HCP",
    product_acronym: "GSL",
    default_audience: "HCP",
    default_content_purpose: "DA",
    personas: {
      type: "individual",
      named: {
        AllAdults: { gender: "All", gender_acronym: "A", age_demo: "18-99" },
      },
      geo_behavior: "per_province",
      geo_code: "LCL",
    },
    provinces_en: ["AB", "BC", "ON"],
    provinces_fr: ["QC"],
  },
};

// ── Platform Mappings ─────────────────────────────────────────────────────────

export const PLATFORM_MAPPINGS: Record<string, PlatformMapping> = {
  META: {
    channel: "SOC",
    source: "meta",
    site: "",
    utmMedium: "paid-social",
    customTag1: "Social",
    defaultBuyType: "",
    defaultPlacement: "CSTM",
    defaultTacticType: "DEMO",
  },
  TIKTOK: {
    channel: "SOC",
    source: "tiktok",
    site: "",
    utmMedium: "paid-social",
    customTag1: "Social",
    defaultBuyType: "",
    defaultPlacement: "CSTM",
    defaultTacticType: "DEMO",
  },
  REDDIT: {
    channel: "SOC",
    source: "reddit",
    site: "",
    utmMedium: "paid-social",
    customTag1: "Social",
    defaultBuyType: "",
    defaultPlacement: "CSTM",
    defaultTacticType: "DEMO",
  },
  LINKEDIN: {
    channel: "SOC",
    source: "linkedin",
    site: "",
    utmMedium: "paid-social",
    customTag1: "Social",
    defaultBuyType: "",
    defaultPlacement: "CSTM",
    defaultTacticType: "DEMO",
  },
  PINTEREST: {
    channel: "SOC",
    source: "pinterest",
    site: "",
    utmMedium: "paid-social",
    customTag1: "Social",
    defaultBuyType: "",
    defaultPlacement: "CSTM",
    defaultTacticType: "DEMO",
  },
  "NATIVE TOUCH": {
    channel: "DISP",
    source: "nativetouch",
    site: "nativetouch",
    utmMedium: "display",
    customTag1: "Digital",
    defaultBuyType: "CPM",
    defaultPlacement: "CSTM",
    defaultTacticType: "DEMO",
  },
  "THE WEATHER NETWORK": {
    channel: "DISP",
    source: "theweathernetwork",
    site: "theweathernetwork",
    utmMedium: "display",
    customTag1: "Digital",
    defaultBuyType: "CPM",
    defaultPlacement: "CSTM",
    defaultTacticType: "DEMO",
  },
  YOUTUBE: {
    channel: "DISP",
    source: "youtube",
    site: "YouTube",
    utmMedium: "display",
    customTag1: "Digital",
    defaultBuyType: "CPM",
    defaultPlacement: "CTV",
    defaultTacticType: "CSTM",
  },
  "YOUTUBE (DEMAND GEN)": {
    channel: "DISP",
    source: "youtube",
    site: "YouTube",
    utmMedium: "display",
    customTag1: "Digital",
    defaultBuyType: "CPM",
    defaultPlacement: "CTV",
    defaultTacticType: "CSTM",
  },
  SPOTIFY: {
    channel: "DISP",
    source: "spotify",
    site: "Spotify",
    utmMedium: "display",
    customTag1: "Digital",
    defaultBuyType: "CPM",
    defaultPlacement: "CSTM",
    defaultTacticType: "CSTM",
  },
  ACAST: {
    channel: "DISP",
    source: "acast",
    site: "Acast",
    utmMedium: "display",
    customTag1: "Digital",
    defaultBuyType: "FLAT",
    defaultPlacement: "CSTM",
    defaultTacticType: "CSTM",
  },
  "GOOGLE SEARCH": {
    channel: "search",
    source: "google",
    site: "",
    utmMedium: "CPC",
    customTag1: "Search",
    defaultBuyType: "",
    defaultPlacement: "CSTM",
    defaultTacticType: "CSTM",
  },
  PMAX: {
    channel: "search",
    source: "google",
    site: "",
    utmMedium: "CPC",
    customTag1: "Search+Pmax",
    defaultBuyType: "",
    defaultPlacement: "CSTM",
    defaultTacticType: "CSTM",
  },
  MEDSCAPE: {
    channel: "DISP",
    source: "medscape",
    site: "Medscape",
    utmMedium: "display",
    customTag1: "Digital",
    defaultBuyType: "CPM",
    defaultPlacement: "CSTM",
    defaultTacticType: "CSTM",
  },
  CHN: {
    channel: "DISP",
    source: "chn",
    site: "CHN",
    utmMedium: "display",
    customTag1: "Digital",
    defaultBuyType: "CPM",
    defaultPlacement: "CSTM",
    defaultTacticType: "CSTM",
  },
  DV360: {
    channel: "DISP",
    source: "dv360",
    site: "DV360",
    utmMedium: "display",
    customTag1: "Digital",
    defaultBuyType: "CPM",
    defaultPlacement: "CSTM",
    defaultTacticType: "CSTM",
  },
  "DV360- GUMGUM": {
    channel: "DISP",
    source: "dv360",
    site: "DV360",
    utmMedium: "display",
    customTag1: "Digital",
    defaultBuyType: "CPM",
    defaultPlacement: "CSTM",
    defaultTacticType: "CSTM",
  },
  "KINESSO (DV360)": {
    channel: "DISP",
    source: "dv360",
    site: "DV360",
    utmMedium: "display",
    customTag1: "Digital",
    defaultBuyType: "CPM",
    defaultPlacement: "CSTM",
    defaultTacticType: "CSTM",
  },
  "SCREEN-ON-DEMAND": {
    channel: "DISP",
    source: "screen-on-demand",
    site: "Amazon",
    utmMedium: "display",
    customTag1: "Digital",
    defaultBuyType: "CPM",
    defaultPlacement: "CTV",
    defaultTacticType: "CSTM",
  },
  GRINDR: {
    channel: "DISP",
    source: "grindr",
    site: "Grindr",
    utmMedium: "display",
    customTag1: "Digital",
    defaultBuyType: "CPM",
    defaultPlacement: "CSTM",
    defaultTacticType: "CSTM",
  },
  DEXERTO: {
    channel: "DISP",
    source: "dexerto",
    site: "Dexerto",
    utmMedium: "display",
    customTag1: "Digital",
    defaultBuyType: "CPM",
    defaultPlacement: "CSTM",
    defaultTacticType: "CSTM",
  },
};

export const SKIPPED_PLATFORMS = [
  "BROADCAST TV",
  "RADIO",
  "IMD",
  "CMAJ",
  "JAMC",
  "STINGRAY",
  "EIUM",
  "COMMUNIMED",
];

// ── Dropdown Vocabularies ─────────────────────────────────────────────────────

export const CAMPAIGN_TYPE_MAP: Record<CampaignTypeKey, CampaignTypeAcronym> = {
  Branded: "BRND",
  UnBranded: "NON",
  "Co-Branded": "CBRDN",
};

export const OBJECTIVE_MAP: Record<ObjectiveKey, ObjectiveAcronym> = {
  Awareness: "AW",
  Consideration: "CONSD",
  Traffic: "TF",
  Conversion: "CV",
};

export const CONTENT_PURPOSE_MAP: Record<string, ContentPurposeAcronym> = {
  "Product Awareness": "PRDAW",
  "Disease Awareness": "DA",
  Corporate: "COR",
};

export const AD_FORMAT_MAP: Record<string, AdFormat> = {
  Image: "IMG",
  Video: "VID",
  Audio: "AUDIO",
  Text: "TXT",
  Custom: "CSTM",
  Canvas: "CAN",
  Native: "NAT",
};

export const MATCH_TYPE_MAP: Record<string, MatchType> = {
  Broad: "BROD",
  "Broad, Phase, Exact": "BPE",
  "Broad Match Modified": "BMM",
  Phrase: "PHRS",
  Exact: "EXCT",
};

export const GENDER_MAP: Record<string, { full: string; acronym: string }> = {
  Female: { full: "Female", acronym: "F" },
  Male: { full: "Male", acronym: "M" },
  All: { full: "All", acronym: "A" },
  "Non-Applicable": { full: "Non-Applicable", acronym: "NA" },
};

export const GEO_MAP: Record<string, string> = {
  National: "NTL",
  Local: "LCL",
};

export const PROVINCES = ["AB", "BC", "ON", "QC", "SK", "MB", "NB", "NL", "NS", "PE", "NA"];

export const AGE_DEMOS = ["18-26", "18-99", "20-26", "24-45", "25-44", "27-45", "30-45", "50-99"];

export const BUY_TYPES = ["CPM", "CPC", "CPA", "CPCV", "FLAT"] as const;

export const PLACEMENTS = {
  CSTM: "CSTM",
  CTV: "CTV",
  ISTR: "ISTR",
  AUN: "AUN",
  IF: "IF",
  YTP: "YTP",
  YTC: "YTC",
};

export const TACTIC_TYPES = {
  CSTM: "CSTM",
  DEMO: "DEMO",
  BEH: "BEH",
};

export const AD_DIMENSIONS = [
  "300x250",
  "320x50",
  "728x90",
  "160x600",
  "1x1",
  "9x16",
  "1920x1080",
  "1920x1920",
  "NA",
];

export const LANGUAGES = ["EN", "FR", "EN/FR"] as const;

export const SOCIAL_SOURCES = ["meta", "tiktok", "reddit", "linkedin", "pinterest", "instagram"];

// ── Platform Matching ─────────────────────────────────────────────────────────

const platformKeysDescByLength = Object.keys(PLATFORM_MAPPINGS).sort(
  (a, b) => b.length - a.length,
);

export function matchPlatform(raw: string): { key: string; mapping: PlatformMapping } | null {
  const normalized = raw.trim().toUpperCase();

  for (const key of platformKeysDescByLength) {
    if (normalized === key || normalized.includes(key)) {
      return { key, mapping: PLATFORM_MAPPINGS[key] };
    }
  }
  return null;
}

export function isSkippedPlatform(raw: string): boolean {
  const normalized = raw.trim().toUpperCase();
  return SKIPPED_PLATFORMS.some((s) => normalized.includes(s));
}

// ── Dimension Helpers ─────────────────────────────────────────────────────────

export function normalizeDimension(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "TBD";
  return trimmed.replace(/(\d+)\s*:\s*(\d+)/g, "$1x$2");
}

export function inferAdFormat(dimension: string): AdFormat {
  const d = dimension.toLowerCase();
  if (/\d+s|sec/i.test(d)) return "AUDIO";
  if (/1920|1080/.test(d)) return "VID";
  if (["300x250", "728x90", "320x50", "160x600"].includes(d)) return "IMG";
  return "IMG";
}

// ── Objective Mapping from BC KPI ─────────────────────────────────────────────

const KPI_METRICS = ["CPM", "CTR", "CPA", "CPC", "CPCV", "CPV", "ROAS", "ROI"];

export function mapKpiToObjective(kpi: string): ObjectiveKey | "" {
  const normalized = kpi.trim();
  const upper = normalized.toUpperCase();

  if (KPI_METRICS.includes(upper)) return "";

  const directMap: Record<string, ObjectiveKey> = {
    AWARENESS: "Awareness",
    CONSIDERATION: "Consideration",
    TRAFFIC: "Traffic",
    CONVERSION: "Conversion",
  };

  return directMap[upper] ?? "";
}
