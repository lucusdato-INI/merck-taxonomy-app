import type { TaxonomyRow, ValidationResult } from "./types";

type Rule = (row: TaxonomyRow) => ValidationResult | null;

const VALID_CHARS = /^[a-zA-Z0-9\-_+]+$/;

const v01: Rule = (row) => {
  if (row.type !== "social" && row.type !== "digital") return null;
  const ct3 = row.fields.customTag3 ?? row.fields.creativeName;
  if (ct3 && ct3.includes(" ")) {
    return {
      ruleId: "V01",
      severity: "error",
      message: "No spaces allowed in Custom Tag 3 / Creative Name values",
      field: "customTag3",
    };
  }
  return null;
};

const v02: Rule = (row) => {
  if (row.type !== "social" && row.type !== "digital") return null;
  const gf = row.fields.genderFull;
  if (gf && !["All", "Male", "Female"].includes(gf)) {
    return {
      ruleId: "V02",
      severity: "error",
      message: `Gender at Ad/Creative level must be full word (All/Male/Female), got "${gf}"`,
      field: "genderFull",
    };
  }
  return null;
};

const v03: Rule = (row) => {
  if (row.type !== "social" && row.type !== "digital") return null;
  const ga = row.fields.genderAcronym;
  if (ga && !["A", "M", "F"].includes(ga)) {
    return {
      ruleId: "V03",
      severity: "error",
      message: `Gender at Ad Set level must be single-letter acronym (A/M/F), got "${ga}"`,
      field: "genderAcronym",
    };
  }
  return null;
};

const v04: Rule = (row) => {
  if (row.type !== "social") return null;
  const ct2 = row.fields.customTag2;
  if (!ct2) return null;
  const parts = ct2.split("+");
  if (parts.length >= 2 && ["AB", "BC", "ON", "QC", "SK", "MB", "NB", "NL", "NS", "PE", "NA"].includes(parts[0])) {
    return {
      ruleId: "V04",
      severity: "error",
      message: `Custom Tag 2 must follow Language+Province order, got "${ct2}"`,
      field: "customTag2",
    };
  }
  return null;
};

const v05: Rule = (row) => {
  if (row.type !== "digital") return null;
  const parts = row.adString.split("_");
  if (parts.length < 5) return null;
  const cf3 = parts[4];
  const cf3Parts = cf3.split("+");
  if (cf3Parts.length >= 7) {
    const lastPart = cf3Parts[cf3Parts.length - 1];
    if (!lastPart || lastPart === cf3Parts[0]) {
      return {
        ruleId: "V05",
        severity: "error",
        message: "Digital Creative CF3 order must be: CreativeName+Persona+Age+Gender+Province+Language+Platform",
        field: "adString",
      };
    }
  }
  return null;
};

const v06: Rule = (row) => {
  if (row.type !== "social") return null;
  const parts = row.adString.split("_");
  if (parts.length < 5) return null;
  const cf3 = parts[4];
  const cf3Parts = cf3.split("+");
  if (cf3Parts.length >= 6) {
    const personaName = row.fields.persona;
    if (personaName && cf3Parts[0] !== personaName) {
      return {
        ruleId: "V06",
        severity: "error",
        message: "Social Ad CF3 order must be: Persona+Age+Gender+Language+Province+CustomTag3",
        field: "adString",
      };
    }
  }
  return null;
};

const v07: Rule = (row) => {
  if (row.type !== "social") return null;
  const ct1 = row.fields.customTag1;
  if (ct1 && ct1.includes("Influencer") && ct1 !== "Social+Influencer") {
    return {
      ruleId: "V07",
      severity: "warning",
      message: "Influencer campaigns must have Custom Tag 1 = \"Social+Influencer\"",
      field: "customTag1",
    };
  }
  return null;
};

const v08: Rule = (row) => {
  if (row.type !== "search") return null;
  const ct1 = row.fields.customTag1;
  if (!ct1) return null;
  if (!/\+(?:EN|FR)$/.test(ct1)) {
    return {
      ruleId: "V08",
      severity: "error",
      message: "Search Campaign Custom Tag 1 must include language suffix (e.g., Search+EN)",
      field: "customTag1",
    };
  }
  return null;
};

const v09: Rule = (row) => {
  if (row.type !== "search") return null;
  const source = row.fields.source;
  if (source && source !== "google") {
    return {
      ruleId: "V09",
      severity: "error",
      message: `Search Ad Set source must be "google", got "${source}"`,
      field: "source",
    };
  }
  return null;
};

const v10: Rule = (row) => {
  const strings = [row.campaignString, row.adSetString, row.adString].filter(Boolean);
  for (const s of strings) {
    const withoutSeparators = s.replace(/_/g, "");
    if (!VALID_CHARS.test(withoutSeparators)) {
      const invalid = withoutSeparators.replace(/[a-zA-Z0-9\-_+]/g, "");
      return {
        ruleId: "V10",
        severity: "error",
        message: `Taxonomy strings may only contain letters, numbers, dashes, underscores, and plus signs. Found: "${invalid}"`,
      };
    }
  }
  return null;
};

const v11: Rule = (row) => {
  if (row.type !== "social" && row.type !== "digital") return null;
  if (!row.utmString) return null;

  const utmAdset = extractUtmParam(row.utmString, "utm_adset");
  if (!utmAdset) return null;

  const expectedSlice = row.type === "social" ? 2 : 3;
  const expectedAdset = row.adSetString.split("_").slice(expectedSlice).join("_");

  if (utmAdset !== expectedAdset) {
    return {
      ruleId: "V11",
      severity: "error",
      message: "UTM utm_adset must align with Ad Set string (without channel/source prefix)",
      field: "utmString",
    };
  }
  return null;
};

const v12: Rule = (row) => {
  if (row.type !== "social" && row.type !== "digital") return null;
  if (!row.utmString || !row.adString) return null;

  const utmContent = extractUtmParam(row.utmString, "utm_content");
  if (utmContent && utmContent !== row.adString) {
    return {
      ruleId: "V12",
      severity: "error",
      message: "UTM utm_content must align with the Ad/Creative string",
      field: "utmString",
    };
  }
  return null;
};

const v13: Rule = (row) => {
  if (row.type !== "digital") return null;
  const parts = row.adString.split("_");
  if (parts.length < 5) return null;
  const cf3 = parts[4];
  const cf3Parts = cf3.split("+");
  const source = row.fields.source;
  if (source && cf3Parts.length > 0 && cf3Parts[cf3Parts.length - 1] !== source) {
    return {
      ruleId: "V13",
      severity: "error",
      message: "Digital Creative must append the platform name as the last CF3 element",
      field: "adString",
    };
  }
  return null;
};

const v14: Rule = (row) => {
  if (row.type !== "digital") return null;
  const site = row.fields.site;
  const source = row.fields.source;

  if (source && source !== source.toLowerCase()) {
    return {
      ruleId: "V14",
      severity: "error",
      message: `Source must be lowercase per CTT conventions, got "${source}"`,
      field: "source",
    };
  }

  if (site) {
    const siteLower = site.toLowerCase();
    if (row.adSetString.includes(site) && site !== siteLower && site !== capitalizeFirst(siteLower)) {
      return {
        ruleId: "V14",
        severity: "error",
        message: `Site name formatting does not match CTT conventions: "${site}"`,
        field: "site",
      };
    }
  }
  return null;
};

const ALL_RULES: Rule[] = [v01, v02, v03, v04, v05, v06, v07, v08, v09, v10, v11, v12, v13, v14];

export function validateRow(row: TaxonomyRow): ValidationResult[] {
  const results: ValidationResult[] = [];
  for (const rule of ALL_RULES) {
    const result = rule(row);
    if (result) results.push(result);
  }
  return results;
}

export function validateAll(rows: TaxonomyRow[]): TaxonomyRow[] {
  return rows.map((row) => ({
    ...row,
    validationErrors: validateRow(row),
  }));
}

export const VALIDATION_RULE_DESCRIPTIONS: { id: string; description: string }[] = [
  { id: "V01", description: "No spaces allowed in Custom Tag 3 values. Auto-sanitize by removing spaces." },
  { id: "V02", description: "Gender at Ad/Creative level must be the full word: \"All\", \"Male\", or \"Female\"." },
  { id: "V03", description: "Gender at Ad Set/Placement level must be the single-letter acronym: \"A\", \"M\", or \"F\"." },
  { id: "V04", description: "Custom Tag 2 must follow Language+Province order (e.g., \"EN+ON\")." },
  { id: "V05", description: "Digital Creative CF3 field order must be: CreativeName+Persona+Age+Gender+Province+Language+Platform." },
  { id: "V06", description: "Social Ad CF3 field order must be: Persona+Age+Gender+Language+Province+CustomTag3." },
  { id: "V07", description: "Influencer campaigns must have Custom Tag 1 = \"Social+Influencer\"." },
  { id: "V08", description: "Search Campaign Custom Tag 1 must include language suffix (e.g., \"Search+EN\")." },
  { id: "V09", description: "Search/Pmax Ad Set source field must always be \"google\"." },
  { id: "V10", description: "Taxonomy strings may only contain: letters, numbers, dashes, underscores, and plus signs." },
  { id: "V11", description: "UTM utm_adset must be aligned with Ad Set (without channel/source prefix)." },
  { id: "V12", description: "UTM utm_content must be aligned with Ad/Creative string." },
  { id: "V13", description: "Digital Creative must append the platform name as the last CF3 element." },
  { id: "V14", description: "Site names must be lowercase and formatted per CTT conventions." },
];

function extractUtmParam(url: string, param: string): string | null {
  const idx = url.indexOf(`${param}=`);
  if (idx === -1) return null;
  const start = idx + param.length + 1;
  const end = url.indexOf("&", start);
  return end === -1 ? url.slice(start) : url.slice(start, end);
}

function capitalizeFirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
