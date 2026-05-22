import ExcelJS from 'exceljs'
import type { CampaignMeta, Language, ParsedTactic } from './types'
import { matchPlatform, isSkippedPlatform, inferAdFormat, PRODUCTS } from './config'
import {
  getCellString,
  getCellDate,
  findHeaderRow,
  findColumnByAnyName,
} from '../utils/excelHelpers'
import { parseDimensions, cleanCampaignName, toYearMonth } from '../utils/formatters'

export interface BCParseResult {
  tactics: ParsedTactic[]
  meta: Partial<CampaignMeta>
  warnings: string[]
}

const SKIP_ROW_KEYWORDS = ['TOTAL', 'BUDGET', 'REVISION']
const SECTION_HEADERS = ['DIGITAL', 'SOCIAL', 'H1', 'H2', 'SEARCH', 'INFLUENCER']

export async function parseBlockingChart(file: File): Promise<BCParseResult> {
  const buffer = await file.arrayBuffer()
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer)

  const warnings: string[] = []
  const sheetNames = workbook.worksheets.map((s) => s.name)

  const isMultiTab = sheetNames.some(
    (n) =>
      n.toUpperCase().includes('QUEBEC') ||
      n.toUpperCase().includes('ONTARIO') ||
      n.toUpperCase().includes('ALBERTA'),
  )

  const meta = extractMetadata(workbook)

  const tactics: ParsedTactic[] = isMultiTab
    ? parseMultiTab(workbook, warnings)
    : parseSingleTab(workbook, warnings)

  return { tactics, meta, warnings }
}

function extractMetadata(workbook: ExcelJS.Workbook): Partial<CampaignMeta> {
  const meta: Partial<CampaignMeta> = {}
  const sheet =
    workbook.worksheets.find((s) => s.name.toUpperCase().includes('BLOCKING')) ??
    workbook.worksheets[0]

  if (!sheet) return meta

  for (let r = 1; r <= Math.min(15, sheet.rowCount); r++) {
    const row = sheet.getRow(r)
    for (let c = 1; c <= Math.min(row.cellCount, 10); c++) {
      const val = getCellString(row, c).toUpperCase()

      if (val.includes('CAMPAIGN') && val.includes('NAME')) {
        const next = getCellString(row, c + 1) || getCellString(row, c + 2)
        if (next) meta.campaignName = cleanCampaignName(next)
      }

      if (val.includes('MARKET') || val.includes('COUNTRY')) {
        // Market is always CA — no extraction needed
      }

      if (val.includes('PRODUCT')) {
        const next = getCellString(row, c + 1) || getCellString(row, c + 2)
        if (next) {
          const upper = next.toUpperCase()
          for (const [key, config] of Object.entries(PRODUCTS)) {
            if (upper.includes(config.product_name.toUpperCase())) {
              meta.product = key as keyof typeof PRODUCTS
              meta.audience = config.default_audience
              meta.contentPurpose = config.default_content_purpose
            }
          }
        }
      }

      if (val.includes('FLIGHT') || val.includes('START DATE')) {
        const dateVal = getCellDate(row, c + 1)
        if (dateVal) {
          meta.yearMonth = toYearMonth(dateVal)
          meta.startDate = dateVal.toISOString()
        }
      }
    }
  }

  return meta
}

function parseSingleTab(workbook: ExcelJS.Workbook, warnings: string[]): ParsedTactic[] {
  const sheet =
    workbook.worksheets.find((s) => s.name.toUpperCase().includes('BLOCKING')) ??
    workbook.worksheets[0]

  if (!sheet) {
    warnings.push('No worksheet found')
    return []
  }

  const headerResult = findHeaderRow(sheet, ['TACTICS', 'SITES', 'PLATFORM'])
  if (!headerResult) {
    warnings.push('Could not find header row with Tactics/Sites/Platform column')
    return []
  }

  const { rowNumber: headerRow, headers } = headerResult

  const tacticCol = findColumnByAnyName(headers, ['TACTICS', 'SITES', 'PLATFORM']) ?? 1
  const langCol = findColumnByAnyName(headers, ['LANGUAGE', 'LANG'])
  const audienceCol = findColumnByAnyName(headers, ['AUDIENCE', 'TARGETING', 'TARGET'])
  const formatsCol = findColumnByAnyName(headers, ['FORMATS', 'FORMAT', 'SIZE', 'DIMENSIONS'])
  const placementCol = findColumnByAnyName(headers, ['PLACEMENT', 'PLACEMENTS'])
  const regionCol = findColumnByAnyName(headers, ['REGION', 'MARKET', 'PROVINCE'])

  const tactics: ParsedTactic[] = []
  let lastTacticName = ''
  let idCounter = 0

  for (let r = headerRow + 1; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r)
    let tacticName = getCellString(row, tacticCol)

    if (!tacticName && lastTacticName) {
      tacticName = lastTacticName
    }
    if (tacticName) lastTacticName = tacticName

    if (!tacticName) continue

    const upper = tacticName.toUpperCase().trim()
    if (SKIP_ROW_KEYWORDS.some((k) => upper.includes(k))) continue
    if (SECTION_HEADERS.includes(upper)) continue

    if (isSkippedPlatform(tacticName)) continue

    const match = matchPlatform(tacticName)
    const included = match !== null

    const langRaw = langCol ? getCellString(row, langCol) : ''
    const languages = parseLanguages(langRaw)
    const targeting = audienceCol ? getCellString(row, audienceCol) : ''
    const formats = formatsCol ? getCellString(row, formatsCol) : ''
    const placement = placementCol ? getCellString(row, placementCol) : ''
    const region = regionCol ? getCellString(row, regionCol) : ''
    const dims = parseDimensions(formats)

    idCounter++
    const tactic: ParsedTactic = {
      id: `tactic-${idCounter}`,
      platform: tacticName.trim(),
      platformKey: match?.key ?? '',
      language: languages,
      targetingDescription: targeting,
      placementDescription: placement,
      region,
      dimensions: dims,
      adFormat: dims[0] ? inferAdFormat(dims[0]) : 'IMG',
      buyType: match?.mapping.defaultBuyType ?? '',
      included,
      personas: [],
      promoIdEN: '',
      promoIdFR: '',
      creativeName: '',
      isInfluencer: false,
      influencerName: '',
      matchType: 'BPE',
    }

    tactics.push(tactic)
  }

  if (tactics.length === 0) {
    warnings.push('No tactics found in the blocking chart')
  }

  return tactics
}

function parseMultiTab(workbook: ExcelJS.Workbook, warnings: string[]): ParsedTactic[] {
  const tactics: ParsedTactic[] = []
  let idCounter = 0

  const relevantSheets = workbook.worksheets.filter((s) => {
    const upper = s.name.toUpperCase()
    return (
      !upper.includes('BUDGET SPLIT') &&
      !upper.includes('SUMMARY') &&
      (upper.includes('BLOCKING') ||
        upper.includes('QUEBEC') ||
        upper.includes('QC') ||
        upper.includes('ONTARIO') ||
        upper.includes('ON') ||
        upper.includes('ALBERTA') ||
        upper.includes('AB') ||
        upper.includes('BC'))
    )
  })

  for (const sheet of relevantSheets) {
    const headerResult = findHeaderRow(sheet, ['SITES', 'TACTICS', 'PLATFORM'])
    if (!headerResult) continue

    const { rowNumber: headerRow, headers } = headerResult

    const siteCol = findColumnByAnyName(headers, ['SITES', 'TACTICS', 'PLATFORM']) ?? 1
    const langCol = findColumnByAnyName(headers, ['LANGUAGE', 'LANG'])
    const placementCol = findColumnByAnyName(headers, ['PLACEMENT', 'PLACEMENTS'])
    const targetingCol = findColumnByAnyName(headers, ['TARGETING', 'TARGET', 'AUDIENCE'])
    const regionCol = findColumnByAnyName(headers, ['REGION', 'MARKET', 'PROVINCE'])

    for (let r = headerRow + 1; r <= sheet.rowCount; r++) {
      const row = sheet.getRow(r)
      const siteName = getCellString(row, siteCol)
      if (!siteName) continue

      const upper = siteName.toUpperCase().trim()
      if (SKIP_ROW_KEYWORDS.some((k) => upper.includes(k))) continue
      if (SECTION_HEADERS.includes(upper)) continue
      if (isSkippedPlatform(siteName)) continue

      const match = matchPlatform(siteName)
      const included = match !== null

      const langRaw = langCol ? getCellString(row, langCol) : ''
      const languages = parseLanguages(langRaw)
      const targeting = targetingCol ? getCellString(row, targetingCol) : ''
      const placement = placementCol ? getCellString(row, placementCol) : ''
      const region = regionCol ? getCellString(row, regionCol) : sheet.name

      idCounter++
      tactics.push({
        id: `tactic-${idCounter}`,
        platform: siteName.trim(),
        platformKey: match?.key ?? '',
        language: languages,
        targetingDescription: targeting,
        placementDescription: placement,
        region,
        dimensions: ['TBD'],
        adFormat: 'IMG',
        buyType: match?.mapping.defaultBuyType ?? '',
        included,
        personas: [],
        promoIdEN: '',
        promoIdFR: '',
        creativeName: '',
        isInfluencer: false,
        influencerName: '',
        matchType: 'BPE',
      })
    }
  }

  if (tactics.length === 0) {
    warnings.push('No tactics found across blocking chart tabs')
  }

  return tactics
}

function parseLanguages(raw: string): Language[] {
  const upper = raw.toUpperCase().trim()
  if (upper === 'EN/FR' || upper === 'FR/EN') return ['EN', 'FR']
  if (upper === 'FR') return ['FR']
  if (upper === 'EN') return ['EN']
  if (!upper) return ['EN']
  return ['EN']
}
