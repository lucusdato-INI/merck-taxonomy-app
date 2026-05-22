import type {
  CampaignMeta,
  ParsedTactic,
  TaxonomyRow,
  Language,
  ProductKey,
  PersonaPaired,
  PersonaIndividual,
} from './types'
import { PRODUCTS, PLATFORM_MAPPINGS, CAMPAIGN_TYPE_MAP, OBJECTIVE_MAP } from './config'
import { removeSpaces } from '../utils/formatters'

interface PersonaContext {
  name: string
  genderFull: string
  genderAcronym: string
  ageDmo: string
}

interface RowContext {
  persona: PersonaContext
  language: Language
  province: string
  dimension: string
  geo: string
}

export function buildTaxonomy(meta: CampaignMeta, tactics: ParsedTactic[]): TaxonomyRow[] {
  const rows: TaxonomyRow[] = []

  for (const tactic of tactics) {
    if (!tactic.included || !tactic.platformKey) continue

    const platformMapping = PLATFORM_MAPPINGS[tactic.platformKey]
    if (!platformMapping) continue

    const contexts = explodeRows(meta.product, tactic)

    for (const ctx of contexts) {
      const promoId = ctx.language === 'FR' ? tactic.promoIdFR || 'TBD' : tactic.promoIdEN || 'TBD'
      const creativeName = tactic.creativeName || 'na'
      const contentPurpose = meta.contentPurpose
      const customTag3 = removeSpaces(creativeName)

      if (platformMapping.channel === 'SOC') {
        rows.push(
          buildSocialRow(meta, tactic, platformMapping, ctx, promoId, contentPurpose, customTag3),
        )
      } else if (platformMapping.channel === 'DISP') {
        rows.push(
          buildDigitalRow(
            meta,
            tactic,
            platformMapping,
            ctx,
            promoId,
            contentPurpose,
            creativeName,
          ),
        )
      } else if (platformMapping.channel === 'search') {
        rows.push(buildSearchRow(meta, tactic, platformMapping, ctx, promoId, contentPurpose))
      }
    }
  }

  return deduplicateRows(rows)
}

function explodeRows(productKey: ProductKey, tactic: ParsedTactic): RowContext[] {
  const config = PRODUCTS[productKey]
  const personas = config.personas
  const contexts: RowContext[] = []

  const dimensions = tactic.dimensions.length > 0 ? tactic.dimensions : ['TBD']
  const languages = tactic.language.length > 0 ? tactic.language : (['EN'] as Language[])

  if (personas.type === 'paired') {
    const paired = personas as PersonaPaired

    for (const pairEntry of Object.values(paired.pairs)) {
      for (const lang of languages) {
        for (const dim of dimensions) {
          contexts.push({
            persona: {
              name: pairEntry.pair_name,
              genderFull: pairEntry.gender,
              genderAcronym: pairEntry.gender_acronym,
              ageDmo: pairEntry.age_demo,
            },
            language: lang,
            province: paired.province,
            dimension: dim,
            geo: paired.geo_code,
          })
        }
      }
    }
  } else {
    const individual = personas as PersonaIndividual
    const selectedPersonas =
      tactic.personas.length > 0 ? tactic.personas : Object.keys(individual.named)

    for (const personaName of selectedPersonas) {
      const personaDef = individual.named[personaName]
      if (!personaDef) continue

      for (const lang of languages) {
        const provinces = lang === 'FR' ? config.provinces_fr : config.provinces_en
        for (const province of provinces) {
          for (const dim of dimensions) {
            contexts.push({
              persona: {
                name: personaName,
                genderFull: personaDef.gender,
                genderAcronym: personaDef.gender_acronym,
                ageDmo: personaDef.age_demo,
              },
              language: lang,
              province,
              dimension: dim,
              geo: individual.geo_code,
            })
          }
        }
      }
    }
  }

  return contexts
}

function buildSocialRow(
  meta: CampaignMeta,
  tactic: ParsedTactic,
  platform: (typeof PLATFORM_MAPPINGS)[string],
  ctx: RowContext,
  promoId: string,
  contentPurpose: string,
  customTag3: string,
): TaxonomyRow {
  const campaignTypeAcr = CAMPAIGN_TYPE_MAP[meta.campaignType]
  const objectiveAcr = meta.objective ? OBJECTIVE_MAP[meta.objective] : 'TBD'

  const ct1 = tactic.isInfluencer ? 'Social+Influencer' : platform.customTag1

  const campaignString = [
    'CA',
    PRODUCTS[meta.product].product_acronym,
    meta.campaignName,
    campaignTypeAcr,
    objectiveAcr,
    meta.yearMonth,
    ct1,
  ].join('_')

  const ct2 = `${ctx.language}+${ctx.province}`

  let adSetString = [
    platform.channel,
    platform.source,
    meta.audience,
    ctx.persona.name,
    ctx.persona.genderAcronym,
    ctx.persona.ageDmo,
    platform.defaultPlacement,
    platform.defaultTacticType,
    ctx.geo,
    ct2,
  ].join('_')

  if (tactic.isInfluencer && tactic.influencerName) {
    adSetString += `+${tactic.influencerName}`
  }

  const cf3 = [
    ctx.persona.name,
    ctx.persona.ageDmo,
    ctx.persona.genderFull,
    ctx.language,
    ctx.province,
    customTag3,
  ].join('+')

  const adString = [promoId, contentPurpose, tactic.adFormat, ctx.dimension, cf3].join('_')

  const adSetForUtm = adSetString.split('_').slice(2).join('_')

  const utmString = meta.targetUrl
    ? `${meta.targetUrl}?utm_source=${platform.source}&utm_medium=paid-social&utm_campaign=${campaignString}&utm_adset=${adSetForUtm}&utm_content=${adString}`
    : ''

  return {
    type: 'social',
    campaignString,
    adSetString,
    adString,
    utmString,
    tacticId: tactic.id,
    validationErrors: [],
    fields: {
      market: 'CA',
      product: PRODUCTS[meta.product].product_acronym,
      campaignName: meta.campaignName,
      campaignType: campaignTypeAcr,
      objective: objectiveAcr,
      yearMonth: meta.yearMonth,
      customTag1: ct1,
      startDate: meta.startDate,
      endDate: meta.endDate,
      channel: platform.channel,
      source: platform.source,
      audience: meta.audience,
      persona: ctx.persona.name,
      genderFull: ctx.persona.genderFull,
      genderAcronym: ctx.persona.genderAcronym,
      ageDemo: ctx.persona.ageDmo,
      placement: platform.defaultPlacement,
      tacticType: platform.defaultTacticType,
      geo: ctx.geo,
      language: ctx.language,
      province: ctx.province,
      customTag2: ct2,
      promoId,
      contentPurpose,
      adFormat: tactic.adFormat,
      adDimensions: ctx.dimension,
      customTag3,
      utmSource: platform.source,
      utmMedium: 'paid-social',
    },
  }
}

function buildDigitalRow(
  meta: CampaignMeta,
  tactic: ParsedTactic,
  platform: (typeof PLATFORM_MAPPINGS)[string],
  ctx: RowContext,
  promoId: string,
  contentPurpose: string,
  creativeName: string,
): TaxonomyRow {
  const campaignTypeAcr = CAMPAIGN_TYPE_MAP[meta.campaignType]
  const objectiveAcr = meta.objective ? OBJECTIVE_MAP[meta.objective] : 'TBD'

  const campaignString = [
    'CA',
    PRODUCTS[meta.product].product_acronym,
    meta.campaignName,
    campaignTypeAcr,
    objectiveAcr,
    meta.yearMonth,
    'Digital',
  ].join('_')

  const placementString = [
    platform.channel,
    platform.source,
    platform.site,
    meta.audience,
    ctx.persona.name,
    ctx.persona.genderAcronym,
    ctx.persona.ageDmo,
    platform.defaultPlacement,
    platform.defaultTacticType,
    ctx.geo,
    tactic.buyType || platform.defaultBuyType,
    ctx.language,
  ].join('_')

  const cleanCreativeName = removeSpaces(creativeName)
  const cf3 = [
    cleanCreativeName,
    ctx.persona.name,
    ctx.persona.ageDmo,
    ctx.persona.genderFull,
    ctx.province,
    ctx.language,
    platform.source,
  ].join('+')

  const creativeString = [promoId, contentPurpose, tactic.adFormat, ctx.dimension, cf3].join('_')

  const placementForUtm = placementString.split('_').slice(3).join('_')

  const utmSource = `${platform.source}_${platform.site}`
  const utmString = meta.targetUrl
    ? `${meta.targetUrl}?utm_source=${utmSource}&utm_medium=display&utm_campaign=${campaignString}&utm_adset=${placementForUtm}&utm_content=${creativeString}`
    : ''

  return {
    type: 'digital',
    campaignString,
    adSetString: placementString,
    adString: creativeString,
    utmString,
    tacticId: tactic.id,
    validationErrors: [],
    fields: {
      market: 'CA',
      product: PRODUCTS[meta.product].product_acronym,
      campaignName: meta.campaignName,
      campaignType: campaignTypeAcr,
      objective: objectiveAcr,
      yearMonth: meta.yearMonth,
      customTag1: 'Digital',
      startDate: meta.startDate,
      endDate: meta.endDate,
      channel: platform.channel,
      source: platform.source,
      site: platform.site,
      audience: meta.audience,
      persona: ctx.persona.name,
      genderFull: ctx.persona.genderFull,
      genderAcronym: ctx.persona.genderAcronym,
      ageDemo: ctx.persona.ageDmo,
      placement: platform.defaultPlacement,
      tacticType: platform.defaultTacticType,
      geo: ctx.geo,
      buyType: (tactic.buyType || platform.defaultBuyType) as string,
      language: ctx.language,
      province: ctx.province,
      promoId,
      contentPurpose,
      adFormat: tactic.adFormat,
      adDimensions: ctx.dimension,
      creativeName: cleanCreativeName,
      geoTargeting: ctx.province,
      utmSource,
      utmMedium: 'display',
    },
  }
}

function buildSearchRow(
  meta: CampaignMeta,
  tactic: ParsedTactic,
  platform: (typeof PLATFORM_MAPPINGS)[string],
  ctx: RowContext,
  promoId: string,
  contentPurpose: string,
): TaxonomyRow {
  const campaignTypeAcr = CAMPAIGN_TYPE_MAP[meta.campaignType]
  const objectiveAcr = meta.objective ? OBJECTIVE_MAP[meta.objective] : 'TBD'

  const ct1WithLang = `${platform.customTag1}+${ctx.language}`

  const campaignString = [
    'CA',
    PRODUCTS[meta.product].product_acronym,
    meta.campaignName,
    campaignTypeAcr,
    objectiveAcr,
    meta.yearMonth,
    ct1WithLang,
  ].join('_')

  const ct2 = `${ctx.language}+${removeSpaces(tactic.creativeName || 'na')}`

  const adSetString = [
    'search',
    platform.source,
    meta.audience,
    ctx.persona.name,
    ctx.persona.genderAcronym,
    ctx.persona.ageDmo,
    promoId,
    contentPurpose,
    tactic.matchType,
    tactic.adFormat,
    `${ctx.dimension}+${ct2}`,
  ].join('_')

  const adSetForUtm = adSetString.split('_').slice(2).join('_')

  const utmString = meta.targetUrl
    ? `${meta.targetUrl}?utm_source=${platform.source}&utm_medium=CPC&utm_campaign=${campaignString}&utm_adset=${adSetForUtm}`
    : ''

  return {
    type: 'search',
    campaignString,
    adSetString,
    adString: '',
    utmString,
    tacticId: tactic.id,
    validationErrors: [],
    fields: {
      market: 'CA',
      product: PRODUCTS[meta.product].product_acronym,
      campaignName: meta.campaignName,
      campaignType: campaignTypeAcr,
      objective: objectiveAcr,
      yearMonth: meta.yearMonth,
      customTag1: ct1WithLang,
      channel: 'search',
      source: platform.source,
      audience: meta.audience,
      persona: ctx.persona.name,
      genderAcronym: ctx.persona.genderAcronym,
      ageDemo: ctx.persona.ageDmo,
      promoId,
      contentPurpose,
      matchType: tactic.matchType,
      adFormat: tactic.adFormat,
      adDimensions: ctx.dimension,
      language: ctx.language,
      customTag2: ct2,
      utmSource: platform.source,
      utmMedium: 'CPC',
    },
  }
}

function deduplicateRows(rows: TaxonomyRow[]): TaxonomyRow[] {
  const seen = new Set<string>()
  return rows.filter((row) => {
    const key = `${row.adSetString}|${row.adString}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
