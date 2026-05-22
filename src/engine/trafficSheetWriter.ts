import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import type { CampaignMeta, TaxonomyRow } from "./types";
import { PRODUCTS } from "./config";
import { VALIDATION_RULE_DESCRIPTIONS } from "./validator";
import { formatDateMDY } from "../utils/formatters";

const HEADER_FILL: ExcelJS.FillPattern = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFD5E8F0" },
};

const ALT_ROW_FILL: ExcelJS.FillPattern = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFF5F5F5" },
};

const HEADER_FONT: Partial<ExcelJS.Font> = { bold: true };

const BORDER_STYLE: Partial<ExcelJS.Borders> = {
  top: { style: "thin" },
  left: { style: "thin" },
  bottom: { style: "thin" },
  right: { style: "thin" },
};

// ── Column Definitions ────────────────────────────────────────────────────────

const SOCIAL_COLUMNS = [
  "Market", "Product", "Campaign Name", "Campaign Type", "Objective",
  "Year & Month", "Custom Tag 1", "Campaign", "Start date", "End Date",
  "Channel", "Source", "Audience", "Persona", "Gender", "Gender Acronym",
  "Age Demo", "Placement", "Tactic Type", "Geo", "(Custom Tag 2) Language",
  "(Custom Tag 2) Province", "Ad Set", "Promomats ID", "Content Purposes",
  "Ad Format", "Ad Dimensions", "Custom Tag 3", "Ad", "Tag?",
  "utm_source=", "utm_medium=", "utm_campaign=", "utm_adset=", "utm_content=", "UTM Tag",
];

const DIGITAL_COLUMNS = [
  "Market", "Product", "Campaign Name", "Campaign Type", "Objective",
  "Year & Month", "Custom Tag 1", "Campaign", "Start date", "End Date",
  "Channel", "Source", "Site", "Audience", "Persona", "Gender",
  "Gender Acronym", "Age Demo", "Placement", "Tactic Type", "Geo",
  "Buy Type", "(Custom Tag 2) Language", "Placement/Ad Name", "Promomats ID",
  "Content Purposes", "Ad Format", "Ad Dimensions", "Creative Name",
  "Geo Targeting", "Creative",
  "utm_source=", "utm_medium=", "utm_campaign=", "utm_adset=", "utm_content=", "UTM Tag",
];

const SEARCH_COLUMNS = [
  "Market", "Product", "Campaign Name", "Campaign Type", "Objective",
  "Year & Month", "Custom Tag 1", "Campaign", "Channel", "Source",
  "Audience", "Persona", "Gender Acronym", "Age Demo", "Promomats ID",
  "Content Purposes", "Match Type", "Ad Format", "Ad Dimensions",
  "Language", "Custom Tag 2", "Ad Set", "Landing Page (https://)",
  "utm_source=", "utm_medium=", "utm_campaign=", "utm_adset=", "UTM Tag",
];

// ── Public API ────────────────────────────────────────────────────────────────

export async function generateTrafficSheet(
  meta: CampaignMeta,
  rows: TaxonomyRow[],
): Promise<void> {
  const workbook = new ExcelJS.Workbook();

  const socialRows = rows.filter((r) => r.type === "social");
  const digitalRows = rows.filter((r) => r.type === "digital");
  const searchRows = rows.filter((r) => r.type === "search");

  writeSocialTab(workbook, meta, socialRows);
  writeSocialDropdownTab(workbook);
  writeDigitalTab(workbook, meta, digitalRows);
  writeDigitalDropdownTab(workbook);
  writeSearchTab(workbook, meta, searchRows);
  writeSearchDropdownTab(workbook);
  writeFeedbackTab(workbook);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const product = PRODUCTS[meta.product].product_acronym;
  const filename = `${product}_${meta.campaignName}_${meta.yearMonth}_Traffic_Sheet.xlsx`;
  saveAs(blob, filename);
}

// ── Social Tab ────────────────────────────────────────────────────────────────

function writeSocialTab(
  wb: ExcelJS.Workbook,
  meta: CampaignMeta,
  rows: TaxonomyRow[],
): void {
  const sheet = wb.addWorksheet("Social Taxonomy");
  addHeaders(sheet, SOCIAL_COLUMNS);

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const f = r.fields;
    const startDate = meta.startDate ? formatDateMDY(new Date(meta.startDate)) : "";
    const endDate = meta.endDate ? formatDateMDY(new Date(meta.endDate)) : "";

    const dataRow = sheet.addRow([
      f.market, f.product, f.campaignName, f.campaignType, f.objective,
      f.yearMonth, f.customTag1, r.campaignString, startDate, endDate,
      f.channel, f.source, f.audience, f.persona, f.genderFull, f.genderAcronym,
      f.ageDemo, f.placement, f.tacticType, f.geo, f.language,
      f.province, r.adSetString, f.promoId, f.contentPurpose,
      f.adFormat, f.adDimensions, f.customTag3, r.adString, "",
      f.utmSource, f.utmMedium, r.campaignString,
      r.adSetString.split("_").slice(2).join("_"),
      r.adString, r.utmString,
    ]);

    if (i % 2 === 1) applyAltRow(dataRow);
    applyTextFormat(dataRow);
  }

  sheet.views = [{ state: "frozen", ySplit: 1, xSplit: 0 }];
  autoFitColumns(sheet);
}

// ── Digital Tab ───────────────────────────────────────────────────────────────

function writeDigitalTab(
  wb: ExcelJS.Workbook,
  meta: CampaignMeta,
  rows: TaxonomyRow[],
): void {
  const sheet = wb.addWorksheet("Digital Taxonomy");
  addHeaders(sheet, DIGITAL_COLUMNS);

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const f = r.fields;
    const startDate = meta.startDate ? formatDateMDY(new Date(meta.startDate)) : "";
    const endDate = meta.endDate ? formatDateMDY(new Date(meta.endDate)) : "";

    const dataRow = sheet.addRow([
      f.market, f.product, f.campaignName, f.campaignType, f.objective,
      f.yearMonth, f.customTag1, r.campaignString, startDate, endDate,
      f.channel, f.source, f.site, f.audience, f.persona, f.genderFull,
      f.genderAcronym, f.ageDemo, f.placement, f.tacticType, f.geo,
      f.buyType, f.language, r.adSetString, f.promoId,
      f.contentPurpose, f.adFormat, f.adDimensions, f.creativeName,
      f.geoTargeting, r.adString,
      f.utmSource, f.utmMedium, r.campaignString,
      r.adSetString.split("_").slice(3).join("_"),
      r.adString, r.utmString,
    ]);

    if (i % 2 === 1) applyAltRow(dataRow);
    applyTextFormat(dataRow);
  }

  sheet.views = [{ state: "frozen", ySplit: 1, xSplit: 0 }];
  autoFitColumns(sheet);
}

// ── Search Tab ────────────────────────────────────────────────────────────────

function writeSearchTab(
  wb: ExcelJS.Workbook,
  meta: CampaignMeta,
  rows: TaxonomyRow[],
): void {
  const sheet = wb.addWorksheet("Search Taxonomy");
  addHeaders(sheet, SEARCH_COLUMNS);

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const f = r.fields;

    const dataRow = sheet.addRow([
      f.market, f.product, f.campaignName, f.campaignType, f.objective,
      f.yearMonth, f.customTag1, r.campaignString, f.channel, f.source,
      f.audience, f.persona, f.genderAcronym, f.ageDemo, f.promoId,
      f.contentPurpose, f.matchType, f.adFormat, f.adDimensions,
      f.language, f.customTag2, r.adSetString, meta.targetUrl,
      f.utmSource, f.utmMedium, r.campaignString,
      r.adSetString.split("_").slice(2).join("_"),
      r.utmString,
    ]);

    if (i % 2 === 1) applyAltRow(dataRow);
    applyTextFormat(dataRow);
  }

  sheet.views = [{ state: "frozen", ySplit: 1, xSplit: 0 }];
  autoFitColumns(sheet);
}

// ── Dropdown Tabs ─────────────────────────────────────────────────────────────

function writeSocialDropdownTab(wb: ExcelJS.Workbook): void {
  const sheet = wb.addWorksheet("Social Dropdown List");
  const columns: Record<string, string[]> = {
    "Market": ["CA"],
    "Product": ["PCN", "GSL", "NON"],
    "Campaign Type": ["BRND", "NON", "CBRDN"],
    "Objective": ["AW", "CONSD", "TF", "CV"],
    "Channel": ["SOC"],
    "Source": ["meta", "tiktok", "reddit", "linkedin", "pinterest", "instagram"],
    "Audience": ["HCCO", "HCP"],
    "Gender": ["All", "Male", "Female"],
    "Gender Acronym": ["A", "M", "F"],
    "Age Demo": ["18-26", "18-99", "27-45", "30-45", "50-99"],
    "Placement": ["CSTM", "CTV", "ISTR", "AUN", "IF"],
    "Tactic Type": ["CSTM", "DEMO", "BEH"],
    "Geo": ["NTL", "LCL"],
    "Content Purposes": ["PRDAW", "DA", "COR"],
    "Ad Format": ["IMG", "VID", "AUDIO", "TXT", "CSTM", "CAN", "NAT"],
    "Province": ["AB", "BC", "ON", "QC", "SK", "MB", "NB", "NL", "NS", "PE", "NA"],
    "Language": ["EN", "FR"],
  };
  writeDropdownSheet(sheet, columns);
}

function writeDigitalDropdownTab(wb: ExcelJS.Workbook): void {
  const sheet = wb.addWorksheet("Display Dropdown List");
  const columns: Record<string, string[]> = {
    "Market": ["CA"],
    "Product": ["PCN", "GSL", "NON"],
    "Campaign Type": ["BRND", "NON", "CBRDN"],
    "Objective": ["AW", "CONSD", "TF", "CV"],
    "Channel": ["DISP"],
    "Source": ["nativetouch", "theweathernetwork", "youtube", "spotify", "acast", "medscape", "chn", "dv360", "screen-on-demand", "grindr", "dexerto"],
    "Audience": ["HCCO", "HCP"],
    "Gender": ["All", "Male", "Female"],
    "Gender Acronym": ["A", "M", "F"],
    "Age Demo": ["18-26", "18-99", "27-45", "30-45", "50-99"],
    "Placement": ["CSTM", "CTV", "ISTR", "AUN"],
    "Tactic Type": ["CSTM", "DEMO", "BEH"],
    "Geo": ["NTL", "LCL"],
    "Buy Type": ["CPM", "CPC", "CPA", "CPCV", "FLAT"],
    "Content Purposes": ["PRDAW", "DA", "COR"],
    "Ad Format": ["IMG", "VID", "AUDIO", "TXT", "CSTM", "CAN", "NAT"],
    "Province": ["AB", "BC", "ON", "QC", "SK", "MB", "NB", "NL", "NS", "PE", "NA"],
    "Language": ["EN", "FR"],
  };
  writeDropdownSheet(sheet, columns);
}

function writeSearchDropdownTab(wb: ExcelJS.Workbook): void {
  const sheet = wb.addWorksheet("Search Dropdown List");
  const columns: Record<string, string[]> = {
    "Market": ["CA"],
    "Product": ["PCN", "GSL", "NON"],
    "Campaign Type": ["BRND", "NON", "CBRDN"],
    "Objective": ["AW", "CONSD", "TF", "CV"],
    "Channel": ["search"],
    "Source": ["google"],
    "Audience": ["HCCO", "HCP"],
    "Gender Acronym": ["A", "M", "F"],
    "Age Demo": ["18-26", "18-99", "27-45", "30-45", "50-99"],
    "Content Purposes": ["PRDAW", "DA", "COR"],
    "Match Type": ["BROD", "BPE", "BMM", "PHRS", "EXCT"],
    "Ad Format": ["IMG", "VID", "AUDIO", "TXT", "CSTM"],
    "Language": ["EN", "FR"],
  };
  writeDropdownSheet(sheet, columns);
}

// ── Feedback Tab ──────────────────────────────────────────────────────────────

function writeFeedbackTab(wb: ExcelJS.Workbook): void {
  const sheet = wb.addWorksheet("Feedback");
  addHeaders(sheet, ["Rule", "Description"]);

  for (let i = 0; i < VALIDATION_RULE_DESCRIPTIONS.length; i++) {
    const { id, description } = VALIDATION_RULE_DESCRIPTIONS[i];
    const row = sheet.addRow([id, description]);
    if (i % 2 === 1) applyAltRow(row);
  }

  autoFitColumns(sheet);
}

// ── Shared Helpers ────────────────────────────────────────────────────────────

function addHeaders(sheet: ExcelJS.Worksheet, columns: string[]): void {
  const headerRow = sheet.addRow(columns);
  headerRow.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.border = BORDER_STYLE;
  });
}

function writeDropdownSheet(sheet: ExcelJS.Worksheet, columns: Record<string, string[]>): void {
  const headers = Object.keys(columns);
  addHeaders(sheet, headers);

  const maxLen = Math.max(...Object.values(columns).map((v) => v.length));
  for (let i = 0; i < maxLen; i++) {
    const rowData = headers.map((h) => columns[h][i] ?? "");
    sheet.addRow(rowData);
  }

  autoFitColumns(sheet);
}

function applyAltRow(row: ExcelJS.Row): void {
  row.eachCell((cell) => {
    cell.fill = ALT_ROW_FILL;
  });
}

function applyTextFormat(row: ExcelJS.Row): void {
  row.eachCell((cell) => {
    cell.numFmt = "@";
  });
}

function autoFitColumns(sheet: ExcelJS.Worksheet): void {
  sheet.columns.forEach((col) => {
    let maxLen = 10;
    col.eachCell?.({ includeEmpty: false }, (cell) => {
      const len = String(cell.value ?? "").length;
      if (len > maxLen) maxLen = len;
    });
    col.width = Math.min(maxLen + 2, 50);
  });
}
