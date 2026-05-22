import { describe, it, expect } from 'vitest'
import { explodeRows } from '../rowExploder'
import type { ParsedTactic } from '../types'

function makeTactic(overrides: Partial<ParsedTactic> = {}): ParsedTactic {
  return {
    id: 'tactic-1',
    platform: 'META',
    platformKey: 'META',
    language: ['EN'],
    targetingDescription: '',
    placementDescription: '',
    region: '',
    dimensions: ['1x1'],
    adFormat: 'IMG',
    buyType: '',
    placement: 'CSTM',
    tacticType: 'DEMO',
    included: true,
    personas: [],
    promoIdEN: '',
    promoIdFR: '',
    creativeName: '',
    isInfluencer: false,
    influencerName: '',
    matchType: 'BPE',
    ...overrides,
  }
}

describe('explodeRows', () => {
  const baseMeta = {
    product: 'PCN' as const,
    campaignName: 'YOTM2026',
    yearMonth: '202604',
    campaignType: '' as const,
    objective: '' as const,
    audience: 'HCCO' as const,
    contentPurpose: 'PRDAW' as const,
    targetUrl: '',
    startDate: '',
    endDate: '',
  }

  it('generates one row per language × dimension for unknown personas', () => {
    const tactic = makeTactic({ language: ['EN', 'FR'], dimensions: ['1x1', '9x16'] })
    const rows = explodeRows(baseMeta, [tactic])
    // EN has provinces [AB, BC, ON, QC], FR has [QC] for PCN
    // But persona unknown → 1 row per lang × dim × province
    // EN: 4 provinces × 2 dims = 8, FR: 1 province × 2 dims = 2 = 10
    expect(rows.length).toBe(10)
    expect(rows[0].fields.persona.confidence).toBe('unknown')
  })

  it('explodes for named personas from targeting', () => {
    const tactic = makeTactic({ personas: ['Harriet-Alma', 'Henri-Archie'] })
    const rows = explodeRows(baseMeta, [tactic])
    // 2 personas × 1 lang × 1 dim × 4 provinces = 8
    expect(rows.length).toBe(8)
    expect(rows[0].fields.persona.confidence).toBe('auto')
  })

  it('marks promomats ID as unknown', () => {
    const tactic = makeTactic()
    const rows = explodeRows(baseMeta, [tactic])
    expect(rows[0].fields.promoId.confidence).toBe('unknown')
    expect(rows[0].fields.promoId.value).toBe('')
  })

  it('marks auto-detected fields with auto confidence', () => {
    const tactic = makeTactic()
    const rows = explodeRows(baseMeta, [tactic])
    expect(rows[0].fields.channel.confidence).toBe('auto')
    expect(rows[0].fields.source.confidence).toBe('auto')
    expect(rows[0].fields.language.confidence).toBe('auto')
  })

  it('marks product defaults with default confidence', () => {
    const tactic = makeTactic()
    const rows = explodeRows(baseMeta, [tactic])
    expect(rows[0].fields.audience.confidence).toBe('default')
    expect(rows[0].fields.contentPurpose.confidence).toBe('default')
    expect(rows[0].fields.geo.confidence).toBe('default')
  })

  it('skips excluded tactics', () => {
    const tactic = makeTactic({ included: false })
    const rows = explodeRows(baseMeta, [tactic])
    expect(rows.length).toBe(0)
  })

  it('skips tactics with no platform match', () => {
    const tactic = makeTactic({ platformKey: '' })
    const rows = explodeRows(baseMeta, [tactic])
    expect(rows.length).toBe(0)
  })
})
