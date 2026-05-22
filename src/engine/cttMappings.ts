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
