import ExcelJS from 'exceljs'
import type { ExplodedRow } from './types'
import { getValidValues } from './cttMappings'

const HEADER_FILL: ExcelJS.FillPattern = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFD5E8F0' },
}

const YELLOW_FILL: ExcelJS.FillPattern = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFFFFF00' },
}

const HEADER_FONT: Partial<ExcelJS.Font> = { bold: true }

const BORDER_STYLE: Partial<ExcelJS.Borders> = {
  top: { style: 'thin' },
  left: { style: 'thin' },
  bottom: { style: 'thin' },
  right: { style: 'thin' },
}

const SOCIAL_HEADERS = [
  'Market',
  'Product',
  'Campaign Name',
  'Campaign Type',
  'Objective',
  'Year & Month',
  'Custom Tag 1',
  'Campaign',
  'Start date',
  'End Date',
  'Channel',
  'Source',
  'Audience',
  'Persona',
  'Gender',
  'Gender Acronym',
  'Age Demo',
  'Placement',
  'Tactic Type',
  'Geo',
  'Language',
  'Province',
  'Ad Set',
  'Promomats ID',
  'Content Purposes',
  'Ad Format',
  'Ad Dimensions',
  'Custom Tag 3',
  'Ad',
  'Tag?',
  'Tag Type',
  'Target URL',
  'utm_source=',
  'utm_medium',
  'utm_campaign=',
  'utm_adset=',
  'utm_content=',
  'UTM (String Formula)',
]

const SOCIAL_FIELD_KEYS = [
  'market',
  'product',
  'campaignName',
  'campaignType',
  'objective',
  'yearMonth',
  'customTag1',
  null,
  'startDate',
  'endDate',
  'channel',
  'source',
  'audience',
  'persona',
  'genderFull',
  'genderAcronym',
  'ageDemo',
  'placement',
  'tacticType',
  'geo',
  'language',
  'province',
  null,
  'promoId',
  'contentPurpose',
  'adFormat',
  'adDimensions',
  'customTag3',
  null,
  null,
  null,
  'targetUrl',
  null,
  'utmMedium',
  null,
  null,
  null,
  null,
]

const DIGITAL_HEADERS = [
  'Market',
  'Product',
  'Campaign Name',
  'Campaign Type',
  'Objective',
  'Year & Month',
  'Custom Tag 1',
  'Campaign',
  'Start date',
  'End Date',
  'Channel',
  'Source',
  'Site',
  'Audience',
  'Persona',
  'Gender',
  'Gender Acronym',
  'Age Demo',
  'Placement',
  'Tactic Type',
  'Geo',
  'Buy Type',
  'Language',
  'Placement/Ad Name',
  'Promomats ID',
  'Content Purposes',
  'Ad Format',
  'Ad Dimensions',
  'Creative Name',
  'Geo Targeting',
  'Creative',
  'Tag?',
  'Tag Type',
  'Landing Page',
  'utm_source=',
  'utm_medium',
  'utm_campaign=',
  'utm_adset=',
  'utm_content=',
  'UTM (String Formula)',
]

const DIGITAL_FIELD_KEYS = [
  'market',
  'product',
  'campaignName',
  'campaignType',
  'objective',
  'yearMonth',
  'customTag1',
  null,
  'startDate',
  'endDate',
  'channel',
  'source',
  'site',
  'audience',
  'persona',
  'genderFull',
  'genderAcronym',
  'ageDemo',
  'placement',
  'tacticType',
  'geo',
  'buyType',
  'language',
  null,
  'promoId',
  'contentPurpose',
  'adFormat',
  'adDimensions',
  'creativeName',
  'geoTargeting',
  null,
  null,
  null,
  'targetUrl',
  null,
  'utmMedium',
  null,
  null,
  null,
  null,
]

const SEARCH_HEADERS = [
  'Market',
  'Product',
  'Campaign Name',
  'Campaign Type',
  'Objective',
  'Year & Month',
  'Custom Tag 1',
  'Campaign',
  'Channel',
  'Source',
  'Audience',
  'Persona',
  'Gender Acronym',
  'Age Demo',
  'Promomats ID',
  'Content Purposes',
  'Match Type',
  'Ad Format',
  'Ad Dimensions',
  'Language',
  'Custom Tag 2',
  'Ad Set',
  'Landing Page (https://)',
  'utm_source=',
  'utm_medium',
  'utm_campaign=',
  'utm_adset=',
  'UTM (String Formula)',
]

const SEARCH_FIELD_KEYS = [
  'market',
  'product',
  'campaignName',
  'campaignType',
  'objective',
  'yearMonth',
  'customTag1',
  null,
  'channel',
  'source',
  'audience',
  'persona',
  'genderAcronym',
  'ageDemo',
  'promoId',
  'contentPurpose',
  'matchType',
  'adFormat',
  'adDimensions',
  'language',
  'customTag2',
  null,
  'targetUrl',
  null,
  'utmMedium',
  null,
  null,
  null,
]

interface SheetMeta {
  product: string
  campaignName: string
  yearMonth: string
}

export async function generateFormulaSheet(
  rows: ExplodedRow[],
  meta: SheetMeta,
): Promise<ExcelJS.Buffer> {
  const workbook = new ExcelJS.Workbook()

  const socialRows = rows.filter((r) => r.channel === 'SOC')
  const digitalRows = rows.filter((r) => r.channel === 'DISP')
  const searchRows = rows.filter((r) => r.channel === 'search')

  if (socialRows.length > 0) {
    writeSocialTab(workbook, socialRows, meta)
    writeDropdownTab(workbook, 'Social Dropdown List', 'Paid Social')
  }

  if (digitalRows.length > 0) {
    writeDigitalTab(workbook, digitalRows, meta)
    writeDropdownTab(workbook, 'Display Dropdown List', 'Display')
  }

  if (searchRows.length > 0) {
    writeSearchTab(workbook, searchRows, meta)
    writeDropdownTab(workbook, 'Search Dropdown List', 'Search')
  }

  const buffer = await workbook.xlsx.writeBuffer()
  return buffer
}

function writeSocialTab(wb: ExcelJS.Workbook, rows: ExplodedRow[], meta: SheetMeta): void {
  const tabName = `${meta.product} ${meta.campaignName} Social Taxonomy`
  const sheet = wb.addWorksheet(tabName)
  addHeaders(sheet, SOCIAL_HEADERS)

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    const rowNum = i + 2
    const dataRow = sheet.getRow(rowNum)

    for (let col = 0; col < SOCIAL_FIELD_KEYS.length; col++) {
      const fieldKey = SOCIAL_FIELD_KEYS[col]
      if (fieldKey === null) continue

      const cellVal = r.fields[fieldKey]
      if (!cellVal) continue

      const cell = dataRow.getCell(col + 1)
      cell.value = cellVal.value
      cell.numFmt = '@'
      if (cellVal.confidence === 'unknown') {
        cell.fill = YELLOW_FILL
      }
    }

    const rn = rowNum
    // H: Campaign = A&"_"&B&"_"&C&"_"&D&"_"&E&"_"&F&"_"&G
    dataRow.getCell(8).value = {
      formula: `A${rn}&"_"&B${rn}&"_"&C${rn}&"_"&D${rn}&"_"&E${rn}&"_"&F${rn}&"_"&G${rn}`,
    }
    // W: Ad Set = K&"_"&L&"_"&M&"_"&N&"_"&P&"_"&Q&"_"&R&"_"&S&"_"&T&"_"&U&"+"&V
    dataRow.getCell(23).value = {
      formula: `K${rn}&"_"&L${rn}&"_"&M${rn}&"_"&N${rn}&"_"&P${rn}&"_"&Q${rn}&"_"&R${rn}&"_"&S${rn}&"_"&T${rn}&"_"&U${rn}&"+"&V${rn}`,
    }
    // AC: Ad = X&"_"&Y&"_"&Z&"_"&AA&"_"&N&"+"&Q&"+"&O&"+"&U&"+"&V&"+"&AB
    dataRow.getCell(29).value = {
      formula: `X${rn}&"_"&Y${rn}&"_"&Z${rn}&"_"&AA${rn}&"_"&N${rn}&"+"&Q${rn}&"+"&O${rn}&"+"&U${rn}&"+"&V${rn}&"+"&AB${rn}`,
    }
    // AG: utm_source = L
    dataRow.getCell(33).value = { formula: `L${rn}` }
    // AI: utm_campaign = same as Campaign
    dataRow.getCell(35).value = {
      formula: `A${rn}&"_"&B${rn}&"_"&C${rn}&"_"&D${rn}&"_"&E${rn}&"_"&F${rn}&"_"&G${rn}`,
    }
    // AJ: utm_adset = M&"_"&N&"_"&P&"_"&Q&"_"&R&"_"&S&"_"&T&"_"&U&"+"&V
    dataRow.getCell(36).value = {
      formula: `M${rn}&"_"&N${rn}&"_"&P${rn}&"_"&Q${rn}&"_"&R${rn}&"_"&S${rn}&"_"&T${rn}&"_"&U${rn}&"+"&V${rn}`,
    }
    // AK: utm_content = AC
    dataRow.getCell(37).value = { formula: `AC${rn}` }
    // AL: UTM full string
    dataRow.getCell(38).value = {
      formula: `AF${rn}&"?"&$AG$1&"="&AG${rn}&"&"&$AH$1&"="&AH${rn}&"&"&$AI$1&"="&AI${rn}&"&"&$AJ$1&"="&AJ${rn}&"&"&$AK$1&"="&AK${rn}`,
    }

    dataRow.commit()
  }

  sheet.views = [{ state: 'frozen', ySplit: 1, xSplit: 0 }]
  autoFitColumns(sheet)
}

function writeDigitalTab(wb: ExcelJS.Workbook, rows: ExplodedRow[], meta: SheetMeta): void {
  const tabName = `${meta.product} ${meta.campaignName} Digital Taxonomy`
  const sheet = wb.addWorksheet(tabName)
  addHeaders(sheet, DIGITAL_HEADERS)

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    const rowNum = i + 2
    const dataRow = sheet.getRow(rowNum)

    for (let col = 0; col < DIGITAL_FIELD_KEYS.length; col++) {
      const fieldKey = DIGITAL_FIELD_KEYS[col]
      if (fieldKey === null) continue

      const cellVal = r.fields[fieldKey]
      if (!cellVal) continue

      const cell = dataRow.getCell(col + 1)
      cell.value = cellVal.value
      cell.numFmt = '@'
      if (cellVal.confidence === 'unknown') {
        cell.fill = YELLOW_FILL
      }
    }

    const rn = rowNum
    // H: Campaign
    dataRow.getCell(8).value = {
      formula: `A${rn}&"_"&B${rn}&"_"&C${rn}&"_"&D${rn}&"_"&E${rn}&"_"&F${rn}&"_"&G${rn}`,
    }
    // X: Placement/Ad Name = K&"_"&L&"_"&M&"_"&N&"_"&O&"_"&Q&"_"&R&"_"&S&"_"&T&"_"&U&"_"&V&"_"&W
    dataRow.getCell(24).value = {
      formula: `K${rn}&"_"&L${rn}&"_"&M${rn}&"_"&N${rn}&"_"&O${rn}&"_"&Q${rn}&"_"&R${rn}&"_"&S${rn}&"_"&T${rn}&"_"&U${rn}&"_"&V${rn}&"_"&W${rn}`,
    }
    // AE: Creative = Y&"_"&Z&"_"&AA&"_"&AB&"_"&AC&"+"&O&"+"&R&"+"&P&"+"&AD&"+"&W&"+"&M
    dataRow.getCell(31).value = {
      formula: `Y${rn}&"_"&Z${rn}&"_"&AA${rn}&"_"&AB${rn}&"_"&AC${rn}&"+"&O${rn}&"+"&R${rn}&"+"&P${rn}&"+"&AD${rn}&"+"&W${rn}&"+"&M${rn}`,
    }
    // AI: utm_source = L&"_"&M
    dataRow.getCell(35).value = { formula: `L${rn}&"_"&M${rn}` }
    // AK: utm_campaign
    dataRow.getCell(37).value = {
      formula: `A${rn}&"_"&B${rn}&"_"&C${rn}&"_"&D${rn}&"_"&E${rn}&"_"&F${rn}&"_"&G${rn}`,
    }
    // AL: utm_adset = N&"_"&O&"_"&Q&"_"&R&"_"&S&"_"&T&"_"&U&"_"&V&"_"&W
    dataRow.getCell(38).value = {
      formula: `N${rn}&"_"&O${rn}&"_"&Q${rn}&"_"&R${rn}&"_"&S${rn}&"_"&T${rn}&"_"&U${rn}&"_"&V${rn}&"_"&W${rn}`,
    }
    // AM: utm_content = AE
    dataRow.getCell(39).value = { formula: `AE${rn}` }
    // AN: UTM full string
    dataRow.getCell(40).value = {
      formula: `AH${rn}&"?"&$AI$1&"="&AI${rn}&"&"&$AJ$1&"="&AJ${rn}&"&"&$AK$1&"="&AK${rn}&"&"&$AL$1&"="&AL${rn}&"&"&$AM$1&"="&AM${rn}`,
    }

    dataRow.commit()
  }

  sheet.views = [{ state: 'frozen', ySplit: 1, xSplit: 0 }]
  autoFitColumns(sheet)
}

function writeSearchTab(wb: ExcelJS.Workbook, rows: ExplodedRow[], meta: SheetMeta): void {
  const tabName = `${meta.product} ${meta.campaignName} Search Taxonomy`
  const sheet = wb.addWorksheet(tabName)
  addHeaders(sheet, SEARCH_HEADERS)

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    const rowNum = i + 2
    const dataRow = sheet.getRow(rowNum)

    for (let col = 0; col < SEARCH_FIELD_KEYS.length; col++) {
      const fieldKey = SEARCH_FIELD_KEYS[col]
      if (fieldKey === null) continue

      const cellVal = r.fields[fieldKey]
      if (!cellVal) continue

      const cell = dataRow.getCell(col + 1)
      cell.value = cellVal.value
      cell.numFmt = '@'
      if (cellVal.confidence === 'unknown') {
        cell.fill = YELLOW_FILL
      }
    }

    const rn = rowNum
    // H: Campaign = A&"_"&B&"_"&C&"_"&D&"_"&E&"_"&F&"_"&G&"+"&T (appends +Language)
    dataRow.getCell(8).value = {
      formula: `A${rn}&"_"&B${rn}&"_"&C${rn}&"_"&D${rn}&"_"&E${rn}&"_"&F${rn}&"_"&G${rn}&"+"&T${rn}`,
    }
    // V: Ad Set = I&"_"&J&"_"&K&"_"&L&"_"&M&"_"&N&"_"&O&"_"&P&"_"&Q&"_"&R&"_"&S&"+"&T&"+"&U
    dataRow.getCell(22).value = {
      formula: `I${rn}&"_"&J${rn}&"_"&K${rn}&"_"&L${rn}&"_"&M${rn}&"_"&N${rn}&"_"&O${rn}&"_"&P${rn}&"_"&Q${rn}&"_"&R${rn}&"_"&S${rn}&"+"&T${rn}&"+"&U${rn}`,
    }
    // X: utm_source = J
    dataRow.getCell(24).value = { formula: `J${rn}` }
    // Z: utm_campaign = same as Campaign
    dataRow.getCell(26).value = {
      formula: `A${rn}&"_"&B${rn}&"_"&C${rn}&"_"&D${rn}&"_"&E${rn}&"_"&F${rn}&"_"&G${rn}&"+"&T${rn}`,
    }
    // AA: utm_adset = K&"_"&L&"_"&M&"_"&N&"_"&O&"_"&P&"_"&Q&"_"&R&"_"&S&"+"&T&"+"&U
    dataRow.getCell(27).value = {
      formula: `K${rn}&"_"&L${rn}&"_"&M${rn}&"_"&N${rn}&"_"&O${rn}&"_"&P${rn}&"_"&Q${rn}&"_"&R${rn}&"_"&S${rn}&"+"&T${rn}&"+"&U${rn}`,
    }
    // AB: UTM full string
    dataRow.getCell(28).value = {
      formula: `W${rn}&"?"&$X$1&"="&X${rn}&"&"&$Y$1&"="&Y${rn}&"&"&$Z$1&"="&Z${rn}&"&"&$AA$1&"="&AA${rn}`,
    }

    dataRow.commit()
  }

  sheet.views = [{ state: 'frozen', ySplit: 1, xSplit: 0 }]
  autoFitColumns(sheet)
}

function writeDropdownTab(
  wb: ExcelJS.Workbook,
  tabName: string,
  medium: 'Paid Social' | 'Display' | 'Search',
): void {
  const sheet = wb.addWorksheet(tabName)

  const fieldNames = [
    'market',
    'product',
    'campaignType',
    'objective',
    'audience',
    'gender',
    'contentPurpose',
    'adFormat',
  ]
  const mediumFields = ['source', 'placement', 'tacticType', 'geo']
  if (medium === 'Display') mediumFields.push('buyType')
  if (medium === 'Search') mediumFields.push('matchType')

  const allFields = [...fieldNames, ...mediumFields]
  const headers = allFields.map((f) => f.charAt(0).toUpperCase() + f.slice(1))
  addHeaders(sheet, headers)

  const columns: string[][] = allFields.map((f) => {
    const vals = getValidValues(f, medium as 'Paid Social' | 'Search' | 'Display')
    return vals.length > 0 ? vals : getValidValues(f)
  })

  const maxLen = Math.max(...columns.map((c) => c.length))
  for (let i = 0; i < maxLen; i++) {
    const rowData = columns.map((c) => c[i] ?? '')
    sheet.addRow(rowData)
  }

  autoFitColumns(sheet)
}

function addHeaders(sheet: ExcelJS.Worksheet, columns: string[]): void {
  const headerRow = sheet.addRow(columns)
  headerRow.eachCell((cell) => {
    cell.fill = HEADER_FILL
    cell.font = HEADER_FONT
    cell.border = BORDER_STYLE
  })
}

function autoFitColumns(sheet: ExcelJS.Worksheet): void {
  sheet.columns.forEach((col) => {
    let maxLen = 10
    col.eachCell?.({ includeEmpty: false }, (cell) => {
      const len = String(cell.value ?? '').length
      if (len > maxLen) maxLen = len
    })
    col.width = Math.min(maxLen + 2, 50)
  })
}
