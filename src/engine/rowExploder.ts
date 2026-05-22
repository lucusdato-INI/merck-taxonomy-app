import type { CampaignMeta, ParsedTactic, ExplodedRow, CellValue, ProductConfig } from './types'
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

    // geo code is based on persona type (national vs local), not province list
    const geo = product?.personas.type === 'paired' ? 'NTL' : 'LCL'

    for (const persona of personaList) {
      for (const lang of languages) {
        const provinces = getProvinces(product, lang)
        for (const province of provinces) {
          for (const dim of dimensions) {
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
              placement: cv(
                tactic.placement || platform.defaultPlacement,
                tactic.placement ? 'auto' : 'inferred',
              ),
              tacticType: cv(
                tactic.tacticType || platform.defaultTacticType,
                tactic.tacticType ? 'auto' : 'inferred',
              ),
              geo: cv(geo, 'default'),
              buyType: cv(
                (tactic.buyType || platform.defaultBuyType) as string,
                tactic.buyType ? 'inferred' : platform.defaultBuyType ? 'inferred' : 'unknown',
              ),
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

function getProvinces(product: ProductConfig | null, lang: string): string[] {
  if (!product) return ['NA']
  // Always use provinces_en/provinces_fr regardless of persona type.
  // The geo field (NTL/LCL) is what captures the national vs local distinction.
  return lang === 'FR' ? product.provinces_fr : product.provinces_en
}

function getPersonaDef(
  product: ProductConfig | null,
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
