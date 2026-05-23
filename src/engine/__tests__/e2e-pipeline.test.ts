import { describe, it, expect } from 'vitest'
import ExcelJS from 'exceljs'
import { parseBlockingChart } from '../bcParser'
import { explodeRows, countYellowCells } from '../rowExploder'
import { generateFormulaSheet } from '../formulaSheetWriter'
import { PRODUCTS } from '../config'
import type { CampaignMeta } from '../types'

async function createTestBlockingChart(): Promise<File> {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Blocking Chart')

  ws.getRow(1).values = ['Campaign Name:', 'Capvaxive YOTM 2026']
  ws.getRow(2).values = ['Product:', 'Capvaxive']
  ws.getRow(3).values = ['Flight Start:', '2026-04-01']
  ws.getRow(4).values = []
  ws.getRow(5).values = ['Tactics', 'Language', 'Targeting', 'Formats', 'KPI']
  ws.getRow(6).values = ['Meta', 'EN/FR', 'Harriet-Alma', '1x1, 9x16', 'Awareness']
  ws.getRow(7).values = ['TikTok', 'EN', 'Henri-Archie', '9x16', 'Traffic']
  ws.getRow(8).values = ['YouTube', 'EN', '50+ Targeting', '1920x1080', 'CPM']
  ws.getRow(9).values = ['Google Search', 'EN/FR', '', '', '']

  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  return new File([blob], 'test-capvaxive-bc.xlsx', { type: blob.type })
}

describe('E2E pipeline: blocking chart → formula sheet', () => {
  it('parses a blocking chart and produces rows', async () => {
    const file = await createTestBlockingChart()
    const result = await parseBlockingChart(file)

    expect(result.tactics.length).toBeGreaterThan(0)
    expect(result.meta.product).toBe('PCN')
  })

  it('explodes tactics into rows with correct channel distribution', async () => {
    const file = await createTestBlockingChart()
    const result = await parseBlockingChart(file)

    const meta: CampaignMeta = {
      product: (result.meta.product ?? '') as CampaignMeta['product'],
      campaignName: result.meta.campaignName ?? '',
      campaignType: '' as CampaignMeta['campaignType'],
      objective: (result.meta.objective ?? '') as CampaignMeta['objective'],
      yearMonth: result.meta.yearMonth ?? '',
      audience: (result.meta.audience ?? '') as CampaignMeta['audience'],
      contentPurpose: (result.meta.contentPurpose ?? '') as CampaignMeta['contentPurpose'],
      targetUrl: '',
      startDate: result.meta.startDate ?? '',
      endDate: result.meta.endDate ?? '',
    }

    const rows = explodeRows(meta, result.tactics)

    const socialRows = rows.filter((r) => r.channel === 'SOC')
    const digitalRows = rows.filter((r) => r.channel === 'DISP')
    const searchRows = rows.filter((r) => r.channel === 'search')

    expect(socialRows.length).toBeGreaterThan(0)
    expect(digitalRows.length).toBeGreaterThan(0)
    expect(searchRows.length).toBeGreaterThan(0)
    expect(rows.length).toBe(socialRows.length + digitalRows.length + searchRows.length)
  })

  it('generates an Excel workbook with all channel tabs', async () => {
    const file = await createTestBlockingChart()
    const result = await parseBlockingChart(file)

    const meta: CampaignMeta = {
      product: (result.meta.product ?? '') as CampaignMeta['product'],
      campaignName: result.meta.campaignName ?? '',
      campaignType: '' as CampaignMeta['campaignType'],
      objective: (result.meta.objective ?? '') as CampaignMeta['objective'],
      yearMonth: result.meta.yearMonth ?? '',
      audience: (result.meta.audience ?? '') as CampaignMeta['audience'],
      contentPurpose: (result.meta.contentPurpose ?? '') as CampaignMeta['contentPurpose'],
      targetUrl: '',
      startDate: result.meta.startDate ?? '',
      endDate: result.meta.endDate ?? '',
    }

    const rows = explodeRows(meta, result.tactics)
    const productConfig = result.meta.product ? PRODUCTS[result.meta.product] : null
    const sheetMeta = {
      product: productConfig?.product_acronym ?? 'UNKNOWN',
      campaignName: meta.campaignName,
      yearMonth: meta.yearMonth,
    }

    const buffer = await generateFormulaSheet(rows, sheetMeta)
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.load(buffer)

    const sheetNames = wb.worksheets.map((s) => s.name)
    // Excel truncates sheet names to 31 chars
    expect(sheetNames.some((n) => n.includes('Social'))).toBe(true)
    expect(sheetNames.some((n) => n.includes('Digital'))).toBe(true)
    expect(sheetNames.some((n) => n.includes('Search'))).toBe(true)
    expect(sheetNames.some((n) => n.includes('Dropdown'))).toBe(true)
  })

  it('generates formulas in the Campaign column', async () => {
    const file = await createTestBlockingChart()
    const result = await parseBlockingChart(file)

    const meta: CampaignMeta = {
      product: (result.meta.product ?? '') as CampaignMeta['product'],
      campaignName: result.meta.campaignName ?? '',
      campaignType: '' as CampaignMeta['campaignType'],
      objective: (result.meta.objective ?? '') as CampaignMeta['objective'],
      yearMonth: result.meta.yearMonth ?? '',
      audience: (result.meta.audience ?? '') as CampaignMeta['audience'],
      contentPurpose: (result.meta.contentPurpose ?? '') as CampaignMeta['contentPurpose'],
      targetUrl: '',
      startDate: result.meta.startDate ?? '',
      endDate: result.meta.endDate ?? '',
    }

    const rows = explodeRows(meta, result.tactics)
    const productConfig = result.meta.product ? PRODUCTS[result.meta.product] : null
    const sheetMeta = {
      product: productConfig?.product_acronym ?? 'UNKNOWN',
      campaignName: meta.campaignName,
      yearMonth: meta.yearMonth,
    }

    const buffer = await generateFormulaSheet(rows, sheetMeta)
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.load(buffer)

    const socialSheet = wb.worksheets.find((s) => s.name.includes('Social'))!
    const campaignCell = socialSheet.getCell('H2')
    expect(campaignCell.formula).toBeDefined()
    expect(campaignCell.formula).toContain('&"_"&')
  })

  it('has yellow-highlighted cells for unknown values', async () => {
    const file = await createTestBlockingChart()
    const result = await parseBlockingChart(file)

    const meta: CampaignMeta = {
      product: (result.meta.product ?? '') as CampaignMeta['product'],
      campaignName: result.meta.campaignName ?? '',
      campaignType: '' as CampaignMeta['campaignType'],
      objective: (result.meta.objective ?? '') as CampaignMeta['objective'],
      yearMonth: result.meta.yearMonth ?? '',
      audience: (result.meta.audience ?? '') as CampaignMeta['audience'],
      contentPurpose: (result.meta.contentPurpose ?? '') as CampaignMeta['contentPurpose'],
      targetUrl: '',
      startDate: result.meta.startDate ?? '',
      endDate: result.meta.endDate ?? '',
    }

    const rows = explodeRows(meta, result.tactics)
    const yellows = countYellowCells(rows)
    expect(yellows).toBeGreaterThan(0)

    const productConfig = result.meta.product ? PRODUCTS[result.meta.product] : null
    const sheetMeta = {
      product: productConfig?.product_acronym ?? 'UNKNOWN',
      campaignName: meta.campaignName,
      yearMonth: meta.yearMonth,
    }

    const buffer = await generateFormulaSheet(rows, sheetMeta)
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.load(buffer)

    let yellowCellCount = 0
    for (const ws of wb.worksheets) {
      if (ws.name === 'CTT Dictionary') continue
      ws.eachRow((row) => {
        row.eachCell((cell) => {
          const fill = cell.fill as ExcelJS.FillPattern
          if (fill?.fgColor?.argb === 'FFFFFF00') {
            yellowCellCount++
          }
        })
      })
    }
    expect(yellowCellCount).toBeGreaterThan(0)
  })
})
