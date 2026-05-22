export type ProductKey = 'PCN' | 'GSL' | 'GSL_HCP'

export type CampaignTypeKey = 'Branded' | 'UnBranded' | 'Co-Branded'
export type CampaignTypeAcronym = 'BRND' | 'NON' | 'CBRDN'

export type ObjectiveKey = 'Awareness' | 'Consideration' | 'Traffic' | 'Conversion'
export type ObjectiveAcronym = 'AW' | 'CONSD' | 'TF' | 'CV'

export type AudienceCode = 'HCCO' | 'HCP'
export type ContentPurposeAcronym = 'PRDAW' | 'DA' | 'COR'
export type GenderFull = 'All' | 'Male' | 'Female'
export type GenderAcronym = 'A' | 'M' | 'F'
export type GeoCode = 'NTL' | 'LCL'
export type Language = 'EN' | 'FR'
export type MatchType = 'BROD' | 'BPE' | 'BMM' | 'PHRS' | 'EXCT'
export type AdFormat = 'IMG' | 'VID' | 'AUDIO' | 'TXT' | 'CSTM' | 'CAN' | 'NAT'
export type BuyType = 'CPM' | 'CPC' | 'CPA' | 'CPCV' | 'FLAT'
export type ChannelType = 'SOC' | 'DISP' | 'search'

export interface PersonaPaired {
  type: 'paired'
  pairs: Record<
    string,
    {
      pair_name: string
      individual_names: string[]
      gender: GenderFull
      gender_acronym: GenderAcronym
      age_demo: string
    }
  >
  geo_behavior: 'national'
  geo_code: 'NTL'
  province: 'NA'
}

export interface PersonaIndividual {
  type: 'individual'
  named: Record<
    string,
    {
      gender: GenderFull
      gender_acronym: GenderAcronym
      age_demo: string
    }
  >
  geo_behavior: 'per_province'
  geo_code: 'LCL'
}

export interface ProductConfig {
  product_name: string
  product_acronym: string
  default_audience: AudienceCode
  default_content_purpose: ContentPurposeAcronym
  personas: PersonaPaired | PersonaIndividual
  provinces_en: string[]
  provinces_fr: string[]
}

export interface PlatformMapping {
  channel: ChannelType
  source: string
  site: string
  utmMedium: string
  customTag1: string
  defaultBuyType: BuyType | ''
  defaultPlacement: string
  defaultTacticType: string
}

export interface ParsedTactic {
  id: string
  platform: string
  platformKey: string
  language: Language[]
  targetingDescription: string
  placementDescription: string
  region: string
  dimensions: string[]
  adFormat: AdFormat
  buyType: BuyType | ''
  included: boolean
  personas: string[]
  promoIdEN: string
  promoIdFR: string
  creativeName: string
  isInfluencer: boolean
  influencerName: string
  matchType: MatchType
}

export interface CampaignMeta {
  product: ProductKey
  campaignName: string
  campaignType: CampaignTypeKey
  objective: ObjectiveKey | ''
  yearMonth: string
  audience: AudienceCode
  contentPurpose: ContentPurposeAcronym
  targetUrl: string
  startDate: string
  endDate: string
}

export interface TaxonomyRow {
  type: 'social' | 'digital' | 'search'
  campaignString: string
  adSetString: string
  adString: string
  utmString: string
  fields: Record<string, string>
  tacticId: string
  validationErrors: ValidationResult[]
}

export type ValidationSeverity = 'error' | 'warning'

export interface ValidationResult {
  ruleId: string
  message: string
  severity: ValidationSeverity
  field?: string
}
