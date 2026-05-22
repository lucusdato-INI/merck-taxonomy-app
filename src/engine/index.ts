export type {
  ProductKey,
  CampaignMeta,
  ParsedTactic,
  TaxonomyRow,
  ValidationResult,
  PlatformMapping,
} from "./types";

export {
  PRODUCTS,
  PLATFORM_MAPPINGS,
  SKIPPED_PLATFORMS,
  CAMPAIGN_TYPE_MAP,
  OBJECTIVE_MAP,
  CONTENT_PURPOSE_MAP,
  AD_FORMAT_MAP,
  MATCH_TYPE_MAP,
  GENDER_MAP,
  GEO_MAP,
  PROVINCES,
  AGE_DEMOS,
  BUY_TYPES,
  PLACEMENTS,
  TACTIC_TYPES,
  AD_DIMENSIONS,
  LANGUAGES,
  SOCIAL_SOURCES,
  matchPlatform,
  isSkippedPlatform,
  normalizeDimension,
  inferAdFormat,
  mapKpiToObjective,
} from "./config";

export { parseBlockingChart } from "./bcParser";
export type { BCParseResult } from "./bcParser";

export { buildTaxonomy } from "./taxonomyBuilder";

export { validateAll, validateRow, VALIDATION_RULE_DESCRIPTIONS } from "./validator";

export { generateTrafficSheet } from "./trafficSheetWriter";
