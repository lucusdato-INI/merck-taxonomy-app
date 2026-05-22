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
