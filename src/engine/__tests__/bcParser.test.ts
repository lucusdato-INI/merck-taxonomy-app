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
