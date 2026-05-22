export type {
  ProductKey,
  CampaignMeta,
  ParsedTactic,
  ExplodedRow,
  CellValue,
  Confidence,
  GenerationResult,
  PlatformMapping,
} from './types'

export {
  PRODUCTS,
  PLATFORM_MAPPINGS,
  SKIPPED_PLATFORMS,
  matchPlatform,
  isSkippedPlatform,
  normalizeDimension,
  inferAdFormat,
  mapKpiToObjective,
  detectProduct,
} from './config'

export { parseBlockingChart } from './bcParser'
export type { BCParseResult } from './bcParser'

export { explodeRows, countYellowCells } from './rowExploder'

export { generateFormulaSheet } from './formulaSheetWriter'

export { toAcronym, toFullName, getValidValues } from './cttMappings'
