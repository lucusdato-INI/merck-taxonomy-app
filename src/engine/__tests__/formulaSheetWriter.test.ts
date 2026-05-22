import { describe, it, expect } from 'vitest'
import ExcelJS from 'exceljs'
import { generateFormulaSheet } from '../formulaSheetWriter'
import type { ExplodedRow, CellValue } from '../types'

function cv(value: string, confidence: CellValue['confidence'] = 'auto'): CellValue {
  return { value, confidence }
}

function makeSocialRow(overrides: Partial<Record<string, CellValue>> = {}): ExplodedRow {
  return {
    channel: 'SOC',
    tacticId: 'tactic-1',
    fields: {
      market: cv('CA', 'default'),
      product: cv('PCN'),
      campaignName: cv('YOTM2026'),
      campaignType: cv('', 'unknown'),
      objective: cv('TF', 'inferred'),
      yearMonth: cv('202604'),
      customTag1: cv('Social'),
      startDate: cv(''),
      endDate: cv(''),
      channel: cv('SOC'),
      source: cv('meta'),
      site: cv(''),
      audience: cv('HCCO', 'default'),
      persona: cv('Harriet-Alma'),
      genderFull: cv('All'),
      genderAcronym: cv('A'),
      ageDemo: cv('50-99'),
      placement: cv('CSTM', 'inferred'),
      tacticType: cv('DEMO', 'inferred'),
      geo: cv('NTL', 'default'),
      language: cv('EN'),
      province: cv('NA', 'default'),
      promoId: cv('', 'unknown'),
      contentPurpose: cv('PRDAW', 'default'),
      adFormat: cv('IMG', 'inferred'),
      adDimensions: cv('1x1'),
      customTag3: cv('', 'unknown'),
      targetUrl: cv('', 'unknown'),
      utmMedium: cv('paid-social'),
      buyType: cv(''),
      creativeName: cv('', 'unknown'),
      geoTargeting: cv('NA', 'default'),
      matchType: cv('', 'unknown'),
      isInfluencer: cv('false'),
      influencerName: cv(''),
      ...overrides,
    },
  }
}

describe('generateFormulaSheet', () => {
  it('creates a workbook with social taxonomy tab', async () => {
    const rows = [makeSocialRow()]
    const meta = { product: 'PCN', campaignName: 'YOTM2026', yearMonth: '202604' }
    const buffer = await generateFormulaSheet(rows, meta)
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.load(buffer)

    const sheet = wb.getWorksheet('PCN YOTM2026 Social Taxonomy')
    expect(sheet).toBeDefined()
  })

  it('writes formula in Campaign column (H)', async () => {
    const rows = [makeSocialRow()]
    const meta = { product: 'PCN', campaignName: 'YOTM2026', yearMonth: '202604' }
    const buffer = await generateFormulaSheet(rows, meta)
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.load(buffer)

    const sheet = wb.getWorksheet('PCN YOTM2026 Social Taxonomy')!
    const cell = sheet.getCell('H2')
    expect(cell.formula).toContain('A2&"_"&B2')
  })

  it('writes formula in Ad Set column (W)', async () => {
    const rows = [makeSocialRow()]
    const meta = { product: 'PCN', campaignName: 'YOTM2026', yearMonth: '202604' }
    const buffer = await generateFormulaSheet(rows, meta)
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.load(buffer)

    const sheet = wb.getWorksheet('PCN YOTM2026 Social Taxonomy')!
    const cell = sheet.getCell('W2')
    expect(cell.formula).toContain('K2&"_"&L2')
  })

  it('applies yellow fill to unknown cells', async () => {
    const rows = [makeSocialRow()]
    const meta = { product: 'PCN', campaignName: 'YOTM2026', yearMonth: '202604' }
    const buffer = await generateFormulaSheet(rows, meta)
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.load(buffer)

    const sheet = wb.getWorksheet('PCN YOTM2026 Social Taxonomy')!
    const promoCell = sheet.getCell('X2')
    const fill = promoCell.fill as ExcelJS.FillPattern
    expect(fill.fgColor?.argb).toBe('FFFFFF00')
  })

  it('does not create tabs for channels with no rows', async () => {
    const rows = [makeSocialRow()]
    const meta = { product: 'PCN', campaignName: 'YOTM2026', yearMonth: '202604' }
    const buffer = await generateFormulaSheet(rows, meta)
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.load(buffer)

    expect(wb.getWorksheet('PCN YOTM2026 Digital Taxonomy')).toBeUndefined()
    expect(wb.getWorksheet('PCN YOTM2026 Search Taxonomy')).toBeUndefined()
  })
})
