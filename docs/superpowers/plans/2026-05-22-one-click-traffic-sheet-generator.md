# One-Click Traffic Sheet Generator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the 5-step form app into a one-click blocking chart to formula-based traffic sheet converter with CTT dictionary integration.

**Architecture:** Upload BC → parse + auto-detect fields → explode rows (langs × dims × provinces) with confidence tagging → write formula-based Excel with yellow unknown cells → download. The CTT dictionary JSON replaces hardcoded dropdown vocabularies. UI simplifies to single page: upload zone + result summary + download button.

**Tech Stack:** React 18, TypeScript, Vite, ExcelJS (browser build), Tailwind CSS v4, Vitest

---

### Task 1: Add New Types

**Files:**
- Modify: `src/engine/types.ts`
- Test: `src/engine/__tests__/types.test.ts`

- [ ] **Step 1: Write the type definitions**

Add `CellValue`, `ExplodedRow`, and `GenerationResult` types to `src/engine/types.ts`. Keep all existing types — they're still used by the parser.

```typescript
// Add to end of src/engine/types.ts

export type Confidence = 'auto' | 'inferred' | 'default' | 'unknown'

export interface CellValue {
  value: string
  confidence: Confidence
}

export interface ExplodedRow {
  channel: ChannelType
  fields: Record<string, CellValue>
  tacticId: string
}

export interface GenerationResult {
  rows: ExplodedRow[]
  meta: {
    product: string
    campaignName: string
    yearMonth: string
  }
  warnings: string[]
  yellowCellCount: number
}
```

- [ ] **Step 2: Run typecheck to verify**

Run: `npm run typecheck`
Expected: PASS — new types don't conflict with existing ones.

- [ ] **Step 3: Commit**

```bash
git add src/engine/types.ts
git commit -m "feat: add CellValue, ExplodedRow, GenerationResult types"
```

---

### Task 2: Create CTT Mappings Module

**Files:**
- Create: `src/engine/cttMappings.ts`
- Create: `src/engine/__tests__/cttMappings.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/engine/__tests__/cttMappings.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { toAcronym, toFullName, getValidValues } from '../cttMappings'

describe('cttMappings', () => {
  describe('toAcronym', () => {
    it('maps campaign type full name to acronym', () => {
      expect(toAcronym('campaignType', 'Branded')).toBe('BRND')
      expect(toAcronym('campaignType', 'Unbranded')).toBe('NON')
      expect(toAcronym('campaignType', 'Co-Branded')).toBe('CBRDN')
      expect(toAcronym('campaignType', 'Mix Branding')).toBe('MIX')
    })

    it('maps objective full name to acronym', () => {
      expect(toAcronym('objective', 'Awareness')).toBe('AW')
      expect(toAcronym('objective', 'Traffic')).toBe('TF')
      expect(toAcronym('objective', 'Conversion')).toBe('CV')
      expect(toAcronym('objective', 'Consideration')).toBe('CONSD')
    })

    it('maps audience full name to acronym', () => {
      expect(toAcronym('audience', 'Healthcare Consumer')).toBe('HCCO')
      expect(toAcronym('audience', 'Healthcare Professional')).toBe('HCP')
    })

    it('maps content purpose full name to acronym', () => {
      expect(toAcronym('contentPurpose', 'Product Awareness')).toBe('PRDAW')
      expect(toAcronym('contentPurpose', 'Disease Awareness')).toBe('DA')
      expect(toAcronym('contentPurpose', 'Corporate')).toBe('COR')
    })

    it('maps ad format full name to acronym', () => {
      expect(toAcronym('adFormat', 'Image')).toBe('IMG')
      expect(toAcronym('adFormat', 'Video')).toBe('VID')
      expect(toAcronym('adFormat', 'Audio')).toBe('AUDIO')
      expect(toAcronym('adFormat', 'Text')).toBe('TXT')
    })

    it('maps buy type full name to acronym', () => {
      expect(toAcronym('buyType', 'Cost per Thousand Impressions')).toBe('CPM')
      expect(toAcronym('buyType', 'Cost per Click')).toBe('CPC')
      expect(toAcronym('buyType', 'Flat rate')).toBe('FLAT')
    })

    it('maps match type full name to acronym', () => {
      expect(toAcronym('matchType', 'Broad')).toBe('BROD')
      expect(toAcronym('matchType', 'Exact')).toBe('EXCT')
    })

    it('maps geo full name to acronym', () => {
      expect(toAcronym('geo', 'National')).toBe('NTL')
      expect(toAcronym('geo', 'Local')).toBe('LCL')
    })

    it('returns input unchanged for unknown values', () => {
      expect(toAcronym('campaignType', 'UnknownType')).toBe('UnknownType')
    })
  })

  describe('toFullName', () => {
    it('maps acronym back to full name', () => {
      expect(toFullName('campaignType', 'BRND')).toBe('Branded')
      expect(toFullName('objective', 'AW')).toBe('Awareness')
      expect(toFullName('audience', 'HCCO')).toBe('Healthcare Consumer')
    })

    it('returns input unchanged for unknown acronyms', () => {
      expect(toFullName('campaignType', 'XYZZY')).toBe('XYZZY')
    })
  })

  describe('getValidValues', () => {
    it('returns shared field values', () => {
      const markets = getValidValues('market')
      expect(markets).toContain('CANADA')
      expect(markets.length).toBeGreaterThan(100)
    })

    it('returns medium-specific source values', () => {
      const socialSources = getValidValues('source', 'Paid Social')
      expect(socialSources).toContain('Meta')
      expect(socialSources).toContain('TikTok')

      const searchSources = getValidValues('source', 'Search')
      expect(searchSources).toContain('Google')
      expect(searchSources).toContain('Bing')
    })

    it('returns shared values when no medium specified', () => {
      const audiences = getValidValues('audience')
      expect(audiences).toContain('Healthcare Consumer')
      expect(audiences).toContain('Healthcare Professional')
    })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/engine/__tests__/cttMappings.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement cttMappings.ts**

Create `src/engine/cttMappings.ts`:

```typescript
import dictionary from './ctt-taxonomy-dictionary.json'

type MappingCategory =
  | 'campaignType'
  | 'objective'
  | 'audience'
  | 'contentPurpose'
  | 'adFormat'
  | 'buyType'
  | 'matchType'
  | 'geo'

const ACRONYM_MAPS: Record<MappingCategory, Record<string, string>> = {
  campaignType: {
    Branded: 'BRND',
    Unbranded: 'NON',
    'Co-Branded': 'CBRDN',
    'Mix Branding': 'MIX',
    Other: 'OTH',
    Competitor: 'COMP',
  },
  objective: {
    Action: 'ACT',
    Awareness: 'AW',
    Advocacy: 'ADV',
    Consideration: 'CONSD',
    Engagement: 'ENG',
    'Event Invitation': 'EVNT',
    Followers: 'FOL',
    Traffic: 'TF',
    'App Installs': 'APP',
    'Video Views': 'VV',
    'Lead Gen': 'LG',
    'Page Like': 'PL',
    Conversion: 'CV',
    'Direct Response': 'DR',
    Retention: 'RET',
    Sales: 'SAL',
    Research: 'RES',
    'Ask Doctor': 'ASKDR',
    Prescribe: 'PRSC',
  },
  audience: {
    'Healthcare Professional': 'HCP',
    'Healthcare Consumer': 'HCCO',
    Dentist: 'DENT',
    'General Practitioner': 'GP',
    'General Public': 'GP',
    'Government and Policy Stakeholders': 'GOV',
    'Health Authorities': 'HA',
    'Hospitals and Academic Centers': 'HOSP',
    'Internal Use Only': 'INT',
    'Journalists and Press': 'PRESS',
    Nurse: 'NURSE',
    'Patient Organization': 'PTORG',
    Payers: 'PAY',
    Pharmacist: 'PHARM',
    'Professional Bodies': 'PROF',
    'Specialist Physician': 'SPEC',
    'Not Applicable': 'NA',
  },
  contentPurpose: {
    'Access and Support': 'AS',
    'Clinical Studies and Research': 'CSR',
    Corporate: 'COR',
    'Disease Awareness': 'DA',
    Education: 'EDU',
    'Educational Event': 'EDEV',
    Epidemiology: 'EPI',
    'Patient Profiles and Stories': 'PPS',
    'Patient Support Programs': 'PSP',
    'Product Awareness': 'PRDAW',
    'Product Family Commitment': 'PFC',
    'Resources and Tools': 'RT',
    'Treatment Paradigms': 'TP',
    'Not Applicable': 'NA',
  },
  adFormat: {
    Canvas: 'CAN',
    Carousel: 'CRSL',
    Custom: 'CSTM',
    Image: 'IMG',
    LinkAd: 'LNKAD',
    Video: 'VID',
    Animation: 'ANIM',
    Text: 'TXT',
    Native: 'NAT',
    Banner: 'BNR',
    Audio: 'AUDIO',
    Content: 'CNTNT',
    Convention: 'CONV',
    'Digital Display (Non-Targeted Banner)': 'DDNT',
    'Digital Display (Targeted Banner)': 'DDT',
    'Direct Mail': 'DM',
    Email: 'EMAIL',
    'In Office': 'INOFF',
    Influencers: 'INFL',
    'Long Form': 'LF',
    MedEd: 'MEDED',
    Newsletter: 'NL',
    'Short Form': 'SF',
    SMS: 'SMS',
    Social: 'SOC',
  },
  buyType: {
    'Cost per Action': 'CPA',
    'Cost per Click': 'CPC',
    'Cost per Completed View': 'CPCV',
    'Cost per Engagement': 'CPE',
    'Cost per Thousand Impressions': 'CPM',
    'Cost per Thousand Viewable Impressions': 'CPVM',
    'Cost per unique visitor/visits': 'CPUV',
    'Cost per View': 'CPV',
    'Flat rate': 'FLAT',
    Free: 'FREE',
  },
  matchType: {
    Broad: 'BROD',
    'Broad, Phase, Exact': 'BPE',
    'Broad Match Modified': 'BMM',
    Phrase: 'PHRS',
    Exact: 'EXCT',
  },
  geo: {
    International: 'INTL',
    'MSD Region': 'MSDR',
    'MSD Cluster': 'MSDC',
    National: 'NTL',
    'Sub-national': 'SUBN',
    City: 'CTY',
    Local: 'LCL',
    Precision: 'PREC',
  },
}

const REVERSE_MAPS: Record<MappingCategory, Record<string, string>> = {} as typeof ACRONYM_MAPS

for (const [category, map] of Object.entries(ACRONYM_MAPS)) {
  REVERSE_MAPS[category as MappingCategory] = {}
  for (const [fullName, acronym] of Object.entries(map)) {
    REVERSE_MAPS[category as MappingCategory][acronym] = fullName
  }
}

export function toAcronym(category: MappingCategory, fullName: string): string {
  return ACRONYM_MAPS[category]?.[fullName] ?? fullName
}

export function toFullName(category: MappingCategory, acronym: string): string {
  return REVERSE_MAPS[category]?.[acronym] ?? acronym
}

type DictionaryMedium = 'Paid Social' | 'Search' | 'Display'

export function getValidValues(fieldName: string, medium?: DictionaryMedium): string[] {
  const shared = dictionary.sharedFields as Record<string, { values?: string[] }>
  if (shared[fieldName]?.values) {
    return shared[fieldName].values
  }

  if (medium) {
    const perMedium = dictionary.perMedium as Record<
      string,
      { uniqueDropdowns?: Record<string, { values: string[] }> }
    >
    const mediumConfig = perMedium[medium]
    if (mediumConfig?.uniqueDropdowns?.[fieldName]) {
      return mediumConfig.uniqueDropdowns[fieldName].values
    }
  }

  return []
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/engine/__tests__/cttMappings.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/engine/cttMappings.ts src/engine/__tests__/cttMappings.test.ts
git commit -m "feat: add CTT dictionary mapping layer with bidirectional lookups"
```

---

### Task 3: Slim Down config.ts

**Files:**
- Modify: `src/engine/config.ts`

- [ ] **Step 1: Remove dropdown vocabulary exports**

Remove these exports from `src/engine/config.ts` (lines 313-398):
- `CAMPAIGN_TYPE_MAP`
- `OBJECTIVE_MAP`
- `CONTENT_PURPOSE_MAP`
- `AD_FORMAT_MAP`
- `MATCH_TYPE_MAP`
- `GENDER_MAP`
- `GEO_MAP`
- `PROVINCES`
- `AGE_DEMOS`
- `BUY_TYPES`
- `PLACEMENTS`
- `TACTIC_TYPES`
- `AD_DIMENSIONS`
- `LANGUAGES`
- `SOCIAL_SOURCES`

Keep: `PRODUCTS`, `PLATFORM_MAPPINGS`, `SKIPPED_PLATFORMS`, `matchPlatform`, `isSkippedPlatform`, `normalizeDimension`, `inferAdFormat`, `mapKpiToObjective`.

Add a product detection function:

```typescript
export function detectProduct(text: string): ProductKey | null {
  const upper = text.toUpperCase()
  if (upper.includes('CAPVAXIVE') || upper.includes('PCN')) return 'PCN'
  if (upper.includes('HCP') && (upper.includes('GARDASIL') || upper.includes('G9'))) return 'GSL_HCP'
  if (upper.includes('GARDASIL') || upper.includes('G9') || upper.includes('GSL')) return 'GSL'
  return null
}
```

- [ ] **Step 2: Update imports in config.ts**

Remove the type imports that are no longer used: `CampaignTypeKey`, `CampaignTypeAcronym`, `ObjectiveKey`, `ObjectiveAcronym`, `ContentPurposeAcronym`, `AdFormat`, `MatchType`.

The import line should become:

```typescript
import type { ProductKey, ProductConfig, PlatformMapping } from './types'
```

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: Errors in files that import the removed exports (taxonomyBuilder.ts, trafficSheetWriter.ts, validator.ts, index.ts). These files will be replaced/removed in later tasks. For now, just note the errors and move on.

- [ ] **Step 4: Commit**

```bash
git add src/engine/config.ts
git commit -m "refactor: slim config.ts to product configs + platform mappings, add detectProduct"
```

---

### Task 4: Enhanced BC Parser

**Files:**
- Modify: `src/engine/bcParser.ts`
- Create: `src/engine/__tests__/bcParser.test.ts`

- [ ] **Step 1: Write failing tests for enhanced metadata extraction**

Create `src/engine/__tests__/bcParser.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { parseTargetingText, detectProductFromText } from '../bcParser'

describe('parseTargetingText', () => {
  it('extracts named personas', () => {
    const result = parseTargetingText('Maya', 'GSL')
    expect(result.personas).toEqual(['Maya'])
  })

  it('extracts multiple personas separated by commas', () => {
    const result = parseTargetingText('F27-45 60%, M27-45 35%, A18-26 5%', 'GSL')
    expect(result.ageDemos).toContain('27-45')
    expect(result.genders).toContain('F')
    expect(result.genders).toContain('M')
  })

  it('extracts age range from demographic format', () => {
    const result = parseTargetingText('F27-45', 'GSL')
    expect(result.ageDemos).toContain('27-45')
    expect(result.genders).toContain('F')
  })

  it('extracts 50+ as age demo', () => {
    const result = parseTargetingText('50+ Targeting', 'PCN')
    expect(result.ageDemos).toContain('50-99')
  })

  it('returns empty for HCP professional targeting', () => {
    const result = parseTargetingText('HCP List', 'GSL_HCP')
    expect(result.personas).toEqual([])
    expect(result.ageDemos).toEqual([])
  })
})

describe('detectProductFromText', () => {
  it('detects Capvaxive', () => {
    expect(detectProductFromText('MERCK - HCC Capvaxive')).toBe('PCN')
  })

  it('detects Gardasil consumer', () => {
    expect(detectProductFromText('Gardasil G9 - Branded and Unbranded')).toBe('GSL')
  })

  it('detects Gardasil HCP', () => {
    expect(detectProductFromText('MERCK - 2026 HCP For Them Too')).toBe('GSL_HCP')
    expect(detectProductFromText('G9 HCP - For Them Too 2026')).toBe('GSL_HCP')
  })

  it('returns null for unknown', () => {
    expect(detectProductFromText('Random text')).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/engine/__tests__/bcParser.test.ts`
Expected: FAIL — functions not exported.

- [ ] **Step 3: Add parseTargetingText and detectProductFromText to bcParser.ts**

Add these exported functions to `src/engine/bcParser.ts`:

```typescript
import { PRODUCTS, detectProduct } from './config'
import type { ProductKey } from './types'

export function detectProductFromText(text: string): ProductKey | null {
  return detectProduct(text)
}

interface TargetingParseResult {
  personas: string[]
  ageDemos: string[]
  genders: string[]
}

const KNOWN_PERSONAS = [
  'Sofia-Maya', 'Chris-Adam', 'Jamal', 'Lila', 'Adam', 'Maya', 'Chris',
  'Harriet-Alma', 'Henri-Archie', 'AllAdults',
]

export function parseTargetingText(text: string, productKey: string): TargetingParseResult {
  const result: TargetingParseResult = { personas: [], ageDemos: [], genders: [] }
  if (!text) return result

  for (const persona of KNOWN_PERSONAS) {
    if (text.includes(persona)) {
      result.personas.push(persona)
    }
  }

  const demoPattern = /([FMA])(\d{2})-(\d{2,3})/gi
  let match: RegExpExecArray | null
  while ((match = demoPattern.exec(text)) !== null) {
    const gender = match[1].toUpperCase()
    const ageRange = `${match[2]}-${match[3]}`
    if (!result.genders.includes(gender)) result.genders.push(gender)
    if (!result.ageDemos.includes(ageRange)) result.ageDemos.push(ageRange)
  }

  if (text.includes('50+')) {
    if (!result.ageDemos.includes('50-99')) result.ageDemos.push('50-99')
  }

  return result
}
```

- [ ] **Step 4: Update extractMetadata to use detectProduct**

Update the `extractMetadata` function in `src/engine/bcParser.ts` to also scan the title rows (rows 1-5) for product keywords using `detectProduct`:

```typescript
function extractMetadata(workbook: ExcelJS.Workbook): Partial<CampaignMeta> {
  const meta: Partial<CampaignMeta> = {}
  const sheet =
    workbook.worksheets.find((s) => s.name.toUpperCase().includes('BLOCKING')) ??
    workbook.worksheets[0]

  if (!sheet) return meta

  for (let r = 1; r <= Math.min(15, sheet.rowCount); r++) {
    const row = sheet.getRow(r)
    for (let c = 1; c <= Math.min(row.cellCount, 10); c++) {
      const val = getCellString(row, c)
      const upper = val.toUpperCase()

      if (!meta.product) {
        const detected = detectProduct(val)
        if (detected) {
          meta.product = detected
          const config = PRODUCTS[detected]
          meta.audience = config.default_audience
          meta.contentPurpose = config.default_content_purpose
        }
      }

      if (upper.includes('CAMPAIGN') && upper.includes('NAME')) {
        const next = getCellString(row, c + 1) || getCellString(row, c + 2)
        if (next) meta.campaignName = cleanCampaignName(next)
      }

      if (!meta.campaignName && (upper.includes('MERCK') || upper.includes('GARDASIL') || upper.includes('CAPVAXIVE'))) {
        meta.campaignName = cleanCampaignName(val)
      }

      if (upper.includes('FLIGHT') || upper.includes('START DATE')) {
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
```

- [ ] **Step 5: Add KPI column parsing to single-tab and multi-tab parsers**

In `parseSingleTab`, add KPI column detection after the existing column lookups:

```typescript
const kpiCol = findColumnByAnyName(headers, ['KPI'])
```

Then in the tactic object construction, use the KPI value:

```typescript
const kpiRaw = kpiCol ? getCellString(row, kpiCol) : ''
// ... existing tactic object, but update buyType:
buyType: match?.mapping.defaultBuyType || (kpiRaw.toUpperCase() === 'CPM' ? 'CPM' : kpiRaw.toUpperCase() === 'CPC' ? 'CPC' : match?.mapping.defaultBuyType ?? ''),
```

- [ ] **Step 6: Run tests**

Run: `npx vitest run src/engine/__tests__/bcParser.test.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/engine/bcParser.ts src/engine/__tests__/bcParser.test.ts
git commit -m "feat: enhance BC parser with targeting text parsing and product detection"
```

---

### Task 5: Row Exploder with Confidence Tagging

**Files:**
- Create: `src/engine/rowExploder.ts`
- Create: `src/engine/__tests__/rowExploder.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/engine/__tests__/rowExploder.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { explodeRows } from '../rowExploder'
import type { ParsedTactic, CellValue } from '../types'

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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/engine/__tests__/rowExploder.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement rowExploder.ts**

Create `src/engine/rowExploder.ts`:

```typescript
import type { CampaignMeta, ParsedTactic, ExplodedRow, CellValue, ChannelType } from './types'
import { PRODUCTS, PLATFORM_MAPPINGS } from './config'

function cv(value: string, confidence: CellValue['confidence']): CellValue {
  return { value, confidence }
}

export function explodeRows(meta: CampaignMeta, tactics: ParsedTactic[]): ExplodedRow[] {
  const rows: ExplodedRow[] = []
  const product = meta.product ? PRODUCTS[meta.product] : null

  for (const tactic of tactics) {
    if (!tactic.included || !tactic.platformKey) continue

    const platform = PLATFORM_MAPPINGS[tactic.platformKey]
    if (!platform) continue

    const languages = tactic.language.length > 0 ? tactic.language : (['EN'] as const)
    const dimensions = tactic.dimensions.length > 0 ? tactic.dimensions : ['']
    const hasPersonas = tactic.personas.length > 0
    const personaList = hasPersonas ? tactic.personas : ['']

    for (const persona of personaList) {
      for (const lang of languages) {
        const provinces = getProvinces(meta.product, lang, product)
        for (const province of provinces) {
          for (const dim of dimensions) {
            const geo = product?.personas.type === 'paired' ? 'NTL' : 'LCL'
            const personaDef = getPersonaDef(product, persona)

            const fields: Record<string, CellValue> = {
              market: cv('CA', 'default'),
              product: cv(product?.product_acronym ?? '', meta.product ? 'auto' : 'unknown'),
              campaignName: cv(meta.campaignName ?? '', meta.campaignName ? 'auto' : 'unknown'),
              campaignType: cv('', 'unknown'),
              objective: cv(meta.objective ?? '', meta.objective ? 'inferred' : 'unknown'),
              yearMonth: cv(meta.yearMonth ?? '', meta.yearMonth ? 'auto' : 'unknown'),
              customTag1: cv(platform.customTag1, 'auto'),
              startDate: cv(meta.startDate ?? '', meta.startDate ? 'auto' : 'unknown'),
              endDate: cv(meta.endDate ?? '', meta.endDate ? 'auto' : 'unknown'),
              channel: cv(platform.channel, 'auto'),
              source: cv(platform.source, 'auto'),
              site: cv(platform.site, 'auto'),
              audience: cv(meta.audience ?? '', meta.audience ? 'default' : 'unknown'),
              persona: cv(persona, hasPersonas ? 'auto' : 'unknown'),
              genderFull: cv(personaDef?.gender ?? 'All', hasPersonas ? 'auto' : 'default'),
              genderAcronym: cv(personaDef?.gender_acronym ?? 'A', hasPersonas ? 'auto' : 'default'),
              ageDemo: cv(personaDef?.age_demo ?? '', personaDef?.age_demo ? 'auto' : 'unknown'),
              placement: cv(tactic.placement || platform.defaultPlacement, tactic.placement ? 'auto' : 'inferred'),
              tacticType: cv(tactic.tacticType || platform.defaultTacticType, tactic.tacticType ? 'auto' : 'inferred'),
              geo: cv(geo, 'default'),
              buyType: cv((tactic.buyType || platform.defaultBuyType) as string, tactic.buyType ? 'inferred' : platform.defaultBuyType ? 'inferred' : 'unknown'),
              language: cv(lang, 'auto'),
              province: cv(province, 'default'),
              promoId: cv('', 'unknown'),
              contentPurpose: cv(meta.contentPurpose ?? '', meta.contentPurpose ? 'default' : 'unknown'),
              adFormat: cv(tactic.adFormat, 'inferred'),
              adDimensions: cv(dim, dim ? 'auto' : 'unknown'),
              creativeName: cv('', 'unknown'),
              customTag3: cv('', 'unknown'),
              geoTargeting: cv(province, 'default'),
              matchType: cv('', 'unknown'),
              targetUrl: cv('', 'unknown'),
              utmMedium: cv(platform.utmMedium, 'auto'),
              isInfluencer: cv(tactic.isInfluencer ? 'true' : 'false', 'auto'),
              influencerName: cv(tactic.influencerName, tactic.influencerName ? 'auto' : 'unknown'),
            }

            if (tactic.isInfluencer) {
              fields.customTag1 = cv('Social+Influencer', 'inferred')
            }

            rows.push({
              channel: platform.channel,
              fields,
              tacticId: tactic.id,
            })
          }
        }
      }
    }
  }

  return rows
}

function getProvinces(
  productKey: string | undefined,
  lang: string,
  product: ReturnType<typeof PRODUCTS[keyof typeof PRODUCTS]> | null,
): string[] {
  if (!product) return ['NA']
  if (product.personas.type === 'paired') return ['NA']
  return lang === 'FR' ? product.provinces_fr : product.provinces_en
}

function getPersonaDef(
  product: ReturnType<typeof PRODUCTS[keyof typeof PRODUCTS]> | null,
  personaName: string,
): { gender: string; gender_acronym: string; age_demo: string } | null {
  if (!product || !personaName) return null

  if (product.personas.type === 'paired') {
    for (const pair of Object.values(product.personas.pairs)) {
      if (pair.pair_name === personaName) {
        return { gender: pair.gender, gender_acronym: pair.gender_acronym, age_demo: pair.age_demo }
      }
    }
  } else {
    const def = product.personas.named[personaName]
    if (def) return { gender: def.gender, gender_acronym: def.gender_acronym, age_demo: def.age_demo }
  }
  return null
}

export function countYellowCells(rows: ExplodedRow[]): number {
  let count = 0
  for (const row of rows) {
    for (const cell of Object.values(row.fields)) {
      if (cell.confidence === 'unknown') count++
    }
  }
  return count
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/engine/__tests__/rowExploder.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/engine/rowExploder.ts src/engine/__tests__/rowExploder.test.ts
git commit -m "feat: add row exploder with confidence tagging per cell"
```

---

### Task 6: Formula Sheet Writer — Core + Social Tab

**Files:**
- Create: `src/engine/formulaSheetWriter.ts`
- Create: `src/engine/__tests__/formulaSheetWriter.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/engine/__tests__/formulaSheetWriter.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/engine/__tests__/formulaSheetWriter.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement formulaSheetWriter.ts with Social tab**

Create `src/engine/formulaSheetWriter.ts`:

```typescript
import ExcelJS from 'exceljs'
import type { ExplodedRow, CellValue } from './types'
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

// Social column layout: field keys in order A-AL
const SOCIAL_HEADERS = [
  'Market', 'Product', 'Campaign Name', 'Campaign Type', 'Objective',
  'Year & Month', 'Custom Tag 1', 'Campaign', 'Start date', 'End Date',
  'Channel', 'Source', 'Audience', 'Persona', 'Gender', 'Gender Acronym',
  'Age Demo', 'Placement', 'Tactic Type', 'Geo', 'Language', 'Province',
  'Ad Set', 'Promomats ID', 'Content Purposes', 'Ad Format', 'Ad Dimensions',
  'Custom Tag 3', 'Ad', 'Tag?', 'Tag Type', 'Target URL',
  'utm_source=', 'utm_medium', 'utm_campaign=', 'utm_adset=', 'utm_content=',
  'UTM (String Formula)',
]

const SOCIAL_FIELD_KEYS = [
  'market', 'product', 'campaignName', 'campaignType', 'objective',
  'yearMonth', 'customTag1', null, 'startDate', 'endDate',
  'channel', 'source', 'audience', 'persona', 'genderFull', 'genderAcronym',
  'ageDemo', 'placement', 'tacticType', 'geo', 'language', 'province',
  null, 'promoId', 'contentPurpose', 'adFormat', 'adDimensions',
  'customTag3', null, null, null, 'targetUrl',
  null, 'utmMedium', null, null, null,
  null,
]

const DIGITAL_HEADERS = [
  'Market', 'Product', 'Campaign Name', 'Campaign Type', 'Objective',
  'Year & Month', 'Custom Tag 1', 'Campaign', 'Start date', 'End Date',
  'Channel', 'Source', 'Site', 'Audience', 'Persona', 'Gender',
  'Gender Acronym', 'Age Demo', 'Placement', 'Tactic Type', 'Geo',
  'Buy Type', 'Language', 'Placement/Ad Name',
  'Promomats ID', 'Content Purposes', 'Ad Format', 'Ad Dimensions',
  'Creative Name', 'Geo Targeting', 'Creative', 'Tag?', 'Tag Type',
  'Landing Page', 'utm_source=', 'utm_medium', 'utm_campaign=',
  'utm_adset=', 'utm_content=', 'UTM (String Formula)',
]

const DIGITAL_FIELD_KEYS = [
  'market', 'product', 'campaignName', 'campaignType', 'objective',
  'yearMonth', 'customTag1', null, 'startDate', 'endDate',
  'channel', 'source', 'site', 'audience', 'persona', 'genderFull',
  'genderAcronym', 'ageDemo', 'placement', 'tacticType', 'geo',
  'buyType', 'language', null,
  'promoId', 'contentPurpose', 'adFormat', 'adDimensions',
  'creativeName', 'geoTargeting', null, null, null,
  'targetUrl', null, 'utmMedium', null,
  null, null, null,
]

const SEARCH_HEADERS = [
  'Market', 'Product', 'Campaign Name', 'Campaign Type', 'Objective',
  'Year & Month', 'Custom Tag 1', 'Campaign',
  'Channel', 'Source', 'Audience', 'Persona', 'Gender Acronym',
  'Age Demo', 'Promomats ID', 'Content Purposes', 'Match Type',
  'Ad Format', 'Ad Dimensions', 'Language', 'Custom Tag 2', 'Ad Set',
  'Landing Page (https://)', 'utm_source=', 'utm_medium', 'utm_campaign=',
  'utm_adset=', 'UTM (String Formula)',
]

const SEARCH_FIELD_KEYS = [
  'market', 'product', 'campaignName', 'campaignType', 'objective',
  'yearMonth', 'customTag1', null,
  'channel', 'source', 'audience', 'persona', 'genderAcronym',
  'ageDemo', 'promoId', 'contentPurpose', 'matchType',
  'adFormat', 'adDimensions', 'language', 'customTag2', null,
  'targetUrl', null, 'utmMedium', null,
  null, null,
]

interface SheetMeta {
  product: string
  campaignName: string
  yearMonth: string
}

export async function generateFormulaSheet(
  rows: ExplodedRow[],
  meta: SheetMeta,
): Promise<Buffer> {
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
  return buffer as Buffer
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
    dataRow.getCell(8).value = { formula: `A${rn}&"_"&B${rn}&"_"&C${rn}&"_"&D${rn}&"_"&E${rn}&"_"&F${rn}&"_"&G${rn}` }
    // W: Ad Set = K&"_"&L&"_"&M&"_"&N&"_"&P&"_"&Q&"_"&R&"_"&S&"_"&T&"_"&U&"+"&V
    dataRow.getCell(23).value = { formula: `K${rn}&"_"&L${rn}&"_"&M${rn}&"_"&N${rn}&"_"&P${rn}&"_"&Q${rn}&"_"&R${rn}&"_"&S${rn}&"_"&T${rn}&"_"&U${rn}&"+"&V${rn}` }
    // AC: Ad = X&"_"&Y&"_"&Z&"_"&AA&"_"&N&"+"&Q&"+"&O&"+"&U&"+"&V&"+"&AB
    dataRow.getCell(29).value = { formula: `X${rn}&"_"&Y${rn}&"_"&Z${rn}&"_"&AA${rn}&"_"&N${rn}&"+"&Q${rn}&"+"&O${rn}&"+"&U${rn}&"+"&V${rn}&"+"&AB${rn}` }
    // AG: utm_source = L
    dataRow.getCell(33).value = { formula: `L${rn}` }
    // AI: utm_campaign = same as Campaign
    dataRow.getCell(35).value = { formula: `A${rn}&"_"&B${rn}&"_"&C${rn}&"_"&D${rn}&"_"&E${rn}&"_"&F${rn}&"_"&G${rn}` }
    // AJ: utm_adset = M&"_"&N&"_"&P&"_"&Q&"_"&R&"_"&S&"_"&T&"_"&U&"+"&V
    dataRow.getCell(36).value = { formula: `M${rn}&"_"&N${rn}&"_"&P${rn}&"_"&Q${rn}&"_"&R${rn}&"_"&S${rn}&"_"&T${rn}&"_"&U${rn}&"+"&V${rn}` }
    // AK: utm_content = AC
    dataRow.getCell(37).value = { formula: `AC${rn}` }
    // AL: UTM full string
    dataRow.getCell(38).value = { formula: `AF${rn}&"?"&$AG$1&"="&AG${rn}&"&"&$AH$1&"="&AH${rn}&"&"&$AI$1&"="&AI${rn}&"&"&$AJ$1&"="&AJ${rn}&"&"&$AK$1&"="&AK${rn}` }

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
    dataRow.getCell(8).value = { formula: `A${rn}&"_"&B${rn}&"_"&C${rn}&"_"&D${rn}&"_"&E${rn}&"_"&F${rn}&"_"&G${rn}` }
    // X: Placement/Ad Name = K&"_"&L&"_"&M&"_"&N&"_"&O&"_"&Q&"_"&R&"_"&S&"_"&T&"_"&U&"_"&V&"_"&W
    dataRow.getCell(24).value = { formula: `K${rn}&"_"&L${rn}&"_"&M${rn}&"_"&N${rn}&"_"&O${rn}&"_"&Q${rn}&"_"&R${rn}&"_"&S${rn}&"_"&T${rn}&"_"&U${rn}&"_"&V${rn}&"_"&W${rn}` }
    // AE: Creative = Y&"_"&Z&"_"&AA&"_"&AB&"_"&AC&"+"&O&"+"&R&"+"&P&"+"&AD&"+"&W&"+"&M
    dataRow.getCell(31).value = { formula: `Y${rn}&"_"&Z${rn}&"_"&AA${rn}&"_"&AB${rn}&"_"&AC${rn}&"+"&O${rn}&"+"&R${rn}&"+"&P${rn}&"+"&AD${rn}&"+"&W${rn}&"+"&M${rn}` }
    // AI: utm_source = L&"_"&M
    dataRow.getCell(35).value = { formula: `L${rn}&"_"&M${rn}` }
    // AK: utm_campaign
    dataRow.getCell(37).value = { formula: `A${rn}&"_"&B${rn}&"_"&C${rn}&"_"&D${rn}&"_"&E${rn}&"_"&F${rn}&"_"&G${rn}` }
    // AL: utm_adset = N&"_"&O&"_"&Q&"_"&R&"_"&S&"_"&T&"_"&U&"_"&V&"_"&W
    dataRow.getCell(38).value = { formula: `N${rn}&"_"&O${rn}&"_"&Q${rn}&"_"&R${rn}&"_"&S${rn}&"_"&T${rn}&"_"&U${rn}&"_"&V${rn}&"_"&W${rn}` }
    // AM: utm_content = AE
    dataRow.getCell(39).value = { formula: `AE${rn}` }
    // AN: UTM full string
    dataRow.getCell(40).value = { formula: `AH${rn}&"?"&$AI$1&"="&AI${rn}&"&"&$AJ$1&"="&AJ${rn}&"&"&$AK$1&"="&AK${rn}&"&"&$AL$1&"="&AL${rn}&"&"&$AM$1&"="&AM${rn}` }

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
    dataRow.getCell(8).value = { formula: `A${rn}&"_"&B${rn}&"_"&C${rn}&"_"&D${rn}&"_"&E${rn}&"_"&F${rn}&"_"&G${rn}&"+"&T${rn}` }
    // V: Ad Set = I&"_"&J&"_"&K&"_"&L&"_"&M&"_"&N&"_"&O&"_"&P&"_"&Q&"_"&R&"_"&S&"+"&T&"+"&U
    dataRow.getCell(22).value = { formula: `I${rn}&"_"&J${rn}&"_"&K${rn}&"_"&L${rn}&"_"&M${rn}&"_"&N${rn}&"_"&O${rn}&"_"&P${rn}&"_"&Q${rn}&"_"&R${rn}&"_"&S${rn}&"+"&T${rn}&"+"&U${rn}` }
    // X: utm_source = J
    dataRow.getCell(24).value = { formula: `J${rn}` }
    // Z: utm_campaign = same as Campaign
    dataRow.getCell(26).value = { formula: `A${rn}&"_"&B${rn}&"_"&C${rn}&"_"&D${rn}&"_"&E${rn}&"_"&F${rn}&"_"&G${rn}&"+"&T${rn}` }
    // AA: utm_adset = K&"_"&L&"_"&M&"_"&N&"_"&O&"_"&P&"_"&Q&"_"&R&"_"&S&"+"&T&"+"&U
    dataRow.getCell(27).value = { formula: `K${rn}&"_"&L${rn}&"_"&M${rn}&"_"&N${rn}&"_"&O${rn}&"_"&P${rn}&"_"&Q${rn}&"_"&R${rn}&"_"&S${rn}&"+"&T${rn}&"+"&U${rn}` }
    // AB: UTM full string
    dataRow.getCell(28).value = { formula: `W${rn}&"?"&$X$1&"="&X${rn}&"&"&$Y$1&"="&Y${rn}&"&"&$Z$1&"="&Z${rn}&"&"&$AA$1&"="&AA${rn}` }

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
    'market', 'product', 'campaignType', 'objective', 'audience',
    'gender', 'contentPurpose', 'adFormat',
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
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/engine/__tests__/formulaSheetWriter.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/engine/formulaSheetWriter.ts src/engine/__tests__/formulaSheetWriter.test.ts
git commit -m "feat: add formula-based Excel writer for Social, Digital, and Search tabs"
```

---

### Task 7: Update Engine Exports

**Files:**
- Modify: `src/engine/index.ts`

- [ ] **Step 1: Rewrite index.ts with new exports**

Replace `src/engine/index.ts` with:

```typescript
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
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: May still have errors from old component imports — those will be resolved in the next tasks.

- [ ] **Step 3: Commit**

```bash
git add src/engine/index.ts
git commit -m "refactor: update engine exports for one-click converter"
```

---

### Task 8: ResultSummary Component

**Files:**
- Create: `src/components/ResultSummary.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/ResultSummary.tsx`:

```typescript
import { useState } from 'react'

interface ResultSummaryProps {
  product: string
  campaignName: string
  socialCount: number
  digitalCount: number
  searchCount: number
  yellowCellCount: number
  warnings: string[]
  onDownload: () => Promise<void>
  onReset: () => void
}

export default function ResultSummary({
  product,
  campaignName,
  socialCount,
  digitalCount,
  searchCount,
  yellowCellCount,
  warnings,
  onDownload,
  onReset,
}: ResultSummaryProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [showWarnings, setShowWarnings] = useState(false)

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      await onDownload()
    } finally {
      setIsDownloading(false)
    }
  }

  const totalRows = socialCount + digitalCount + searchCount

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Traffic Sheet Ready</h3>
          <p className="text-sm text-gray-500">
            {product} &mdash; {campaignName}
          </p>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="rounded-md bg-blue-50 p-3 text-center">
            <p className="text-2xl font-bold text-blue-700">{socialCount}</p>
            <p className="text-xs text-blue-600">Social rows</p>
          </div>
          <div className="rounded-md bg-purple-50 p-3 text-center">
            <p className="text-2xl font-bold text-purple-700">{digitalCount}</p>
            <p className="text-xs text-purple-600">Digital rows</p>
          </div>
          <div className="rounded-md bg-green-50 p-3 text-center">
            <p className="text-2xl font-bold text-green-700">{searchCount}</p>
            <p className="text-xs text-green-600">Search rows</p>
          </div>
        </div>

        {yellowCellCount > 0 && (
          <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
            <span className="font-medium">{yellowCellCount} cells</span> highlighted yellow need
            planner input (promomats IDs, creative names, target URLs, etc.)
          </div>
        )}

        {warnings.length > 0 && (
          <div className="mb-4">
            <button
              onClick={() => setShowWarnings(!showWarnings)}
              className="text-sm text-gray-500 underline hover:text-gray-700"
            >
              {showWarnings ? 'Hide' : 'Show'} {warnings.length} warning{warnings.length !== 1 ? 's' : ''}
            </button>
            {showWarnings && (
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-gray-600">
                {warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <button
          onClick={handleDownload}
          disabled={isDownloading || totalRows === 0}
          className="w-full rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {isDownloading ? 'Generating...' : `Download Traffic Sheet (${totalRows} rows)`}
        </button>

        <button
          onClick={onReset}
          className="mt-3 w-full text-center text-sm text-gray-500 underline hover:text-gray-700"
        >
          Upload Another
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: PASS for this file (though other files may still have errors).

- [ ] **Step 3: Commit**

```bash
git add src/components/ResultSummary.tsx
git commit -m "feat: add ResultSummary component for one-click converter output"
```

---

### Task 9: Simplify App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Rewrite App.tsx as single-page converter**

Replace `src/App.tsx` with:

```typescript
import { useState, useCallback } from 'react'
import { saveAs } from 'file-saver'
import { parseBlockingChart, explodeRows, countYellowCells, generateFormulaSheet, PRODUCTS } from './engine'
import type { ExplodedRow, CampaignMeta } from './engine/types'
import FileUploader from './components/FileUploader'
import ResultSummary from './components/ResultSummary'

type AppState = 'upload' | 'processing' | 'result'

function App() {
  const [state, setState] = useState<AppState>('upload')
  const [isLoading, setIsLoading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  const [rows, setRows] = useState<ExplodedRow[]>([])
  const [meta, setMeta] = useState<{ product: string; campaignName: string; yearMonth: string }>({
    product: '',
    campaignName: '',
    yearMonth: '',
  })
  const [warnings, setWarnings] = useState<string[]>([])
  const [yellowCount, setYellowCount] = useState(0)

  const handleUpload = useCallback(async (file: File) => {
    setIsLoading(true)
    setUploadError(null)
    setState('processing')

    try {
      const result = await parseBlockingChart(file)
      const parsedMeta = result.meta as Partial<CampaignMeta>

      if (result.tactics.length === 0) {
        setUploadError(result.warnings.join(' ') || 'No tactics found in the blocking chart.')
        setState('upload')
        return
      }

      const campaignMeta: CampaignMeta = {
        product: parsedMeta.product ?? ('' as CampaignMeta['product']),
        campaignName: parsedMeta.campaignName ?? '',
        campaignType: '' as CampaignMeta['campaignType'],
        objective: parsedMeta.objective ?? ('' as CampaignMeta['objective']),
        yearMonth: parsedMeta.yearMonth ?? '',
        audience: parsedMeta.audience ?? ('' as CampaignMeta['audience']),
        contentPurpose: parsedMeta.contentPurpose ?? ('' as CampaignMeta['contentPurpose']),
        targetUrl: '',
        startDate: parsedMeta.startDate ?? '',
        endDate: parsedMeta.endDate ?? '',
      }

      const productConfig = parsedMeta.product ? PRODUCTS[parsedMeta.product] : null
      const exploded = explodeRows(campaignMeta, result.tactics)
      const yellows = countYellowCells(exploded)

      setFileName(file.name)
      setRows(exploded)
      setMeta({
        product: productConfig?.product_acronym ?? 'UNKNOWN',
        campaignName: parsedMeta.campaignName ?? file.name.replace(/\.xlsx$/i, ''),
        yearMonth: parsedMeta.yearMonth ?? '',
      })
      setWarnings(result.warnings)
      setYellowCount(yellows)
      setState('result')
    } catch {
      setUploadError(
        'Could not read the blocking chart. Please ensure it is a valid .xlsx file with tactic/platform data.',
      )
      setState('upload')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleDownload = useCallback(async () => {
    const buffer = await generateFormulaSheet(rows, meta)
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const filename = `${meta.product}_${meta.campaignName}_${meta.yearMonth}_Traffic_Sheet.xlsx`
    saveAs(blob, filename)
  }, [rows, meta])

  const handleReset = useCallback(() => {
    setState('upload')
    setFileName(null)
    setRows([])
    setWarnings([])
    setYellowCount(0)
    setUploadError(null)
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-900">CTT Traffic Sheet Generator</h1>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-8">
        {(state === 'upload' || state === 'processing') && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Upload a blocking chart (.xlsx) to generate a formula-based traffic sheet.
            </p>
            <FileUploader
              onFileUploaded={handleUpload}
              isLoading={isLoading}
              error={uploadError}
              fileName={null}
            />
          </div>
        )}

        {state === 'result' && (
          <ResultSummary
            product={meta.product}
            campaignName={meta.campaignName}
            socialCount={rows.filter((r) => r.channel === 'SOC').length}
            digitalCount={rows.filter((r) => r.channel === 'DISP').length}
            searchCount={rows.filter((r) => r.channel === 'search').length}
            yellowCellCount={yellowCount}
            warnings={warnings}
            onDownload={handleDownload}
            onReset={handleReset}
          />
        )}
      </main>
    </div>
  )
}

export default App
```

- [ ] **Step 2: Update the App test**

Replace `src/App.test.tsx` with:

```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the app header', () => {
    render(<App />)
    expect(screen.getByText('CTT Traffic Sheet Generator')).toBeInTheDocument()
  })

  it('shows upload instructions', () => {
    render(<App />)
    expect(screen.getByText(/upload a blocking chart/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Run tests**

Run: `npm run test`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/App.test.tsx
git commit -m "feat: simplify App.tsx to single-page one-click converter"
```

---

### Task 10: Remove Old Components and Files

**Files:**
- Remove: `src/components/CampaignForm.tsx`
- Remove: `src/components/TacticReview.tsx`
- Remove: `src/components/TaxonomyPreview.tsx`
- Remove: `src/components/DownloadPanel.tsx`
- Remove: `src/engine/validator.ts`
- Remove: `src/engine/trafficSheetWriter.ts`
- Remove: `src/engine/taxonomyBuilder.ts`

- [ ] **Step 1: Delete old component files**

```bash
rm src/components/CampaignForm.tsx
rm src/components/TacticReview.tsx
rm src/components/TaxonomyPreview.tsx
rm src/components/DownloadPanel.tsx
```

- [ ] **Step 2: Delete old engine files**

```bash
rm src/engine/validator.ts
rm src/engine/trafficSheetWriter.ts
rm src/engine/taxonomyBuilder.ts
```

- [ ] **Step 3: Run full build to verify nothing references deleted files**

Run: `npm run build`
Expected: PASS — no imports reference deleted files.

If there are errors, fix any remaining imports that reference deleted files.

- [ ] **Step 4: Run tests**

Run: `npm run test`
Expected: PASS

- [ ] **Step 5: Run lint and format**

Run: `npm run lint && npm run format`

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: remove old multi-step components and engine files"
```

---

### Task 11: End-to-End Verification

**Files:**
- No new files — manual verification

- [ ] **Step 1: Start dev server**

Run: `npm run dev`
Expected: App starts successfully at localhost.

- [ ] **Step 2: Test in browser**

Open the app in a browser. Verify:
1. Title says "CTT Traffic Sheet Generator"
2. Upload zone is visible with instructions
3. Upload a test blocking chart (Capvaxive or Gardasil)
4. Summary card appears with product, campaign name, row counts
5. Yellow cell count is displayed
6. Warnings are collapsible
7. Download button works and generates an .xlsx file

- [ ] **Step 3: Verify the downloaded Excel file**

Open the downloaded .xlsx in Excel/Google Sheets. Verify:
1. Tab names are dynamic (e.g., "PCN YOTM2026 Social Taxonomy")
2. Formula columns (Campaign, Ad Set, Ad, UTM) contain formulas, not plain text
3. Yellow-highlighted cells exist for unknown fields (Promomats ID, Creative Name, etc.)
4. Filling in a yellow cell causes the formula columns to auto-update
5. Dropdown list tabs contain CTT dictionary values

- [ ] **Step 4: Run full CI pipeline**

Run: `npm run lint && npm run typecheck && npm run test && npm run build`
Expected: All PASS.

- [ ] **Step 5: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve issues found during end-to-end verification"
```
