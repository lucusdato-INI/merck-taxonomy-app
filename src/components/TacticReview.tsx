import { useState, useMemo } from 'react'
import type {
  ParsedTactic,
  ProductKey,
  Language,
  AdFormat,
  BuyType,
  MatchType,
} from '../engine/types'
import {
  PRODUCTS,
  PLATFORM_MAPPINGS,
  BUY_TYPES,
  AD_FORMAT_MAP,
  MATCH_TYPE_MAP,
  AD_DIMENSIONS,
  PLACEMENTS,
  TACTIC_TYPES,
} from '../engine/config'

interface TacticReviewProps {
  tactics: ParsedTactic[]
  product: ProductKey
  onUpdate: (tactics: ParsedTactic[]) => void
  onGenerate: () => void
}

function getPersonaOptions(product: ProductKey): string[] {
  const config = PRODUCTS[product]
  if (config.personas.type === 'paired') {
    return Object.values(config.personas.pairs).map((p) => p.pair_name)
  }
  return Object.keys(config.personas.named)
}

function languageDisplay(langs: Language[]): string {
  if (langs.length === 2) return 'EN/FR'
  return langs[0] ?? 'EN'
}

function languageFromDisplay(display: string): Language[] {
  if (display === 'EN/FR') return ['EN', 'FR']
  if (display === 'FR') return ['FR']
  return ['EN']
}

function channelLabel(platformKey: string): string {
  const mapping = PLATFORM_MAPPINGS[platformKey]
  if (!mapping) return ''
  if (mapping.channel === 'SOC') return 'Social'
  if (mapping.channel === 'DISP') return 'Digital'
  if (mapping.channel === 'search') return 'Search'
  return ''
}

function channelColor(platformKey: string): string {
  const mapping = PLATFORM_MAPPINGS[platformKey]
  if (!mapping) return 'bg-gray-100 text-gray-600'
  if (mapping.channel === 'SOC') return 'bg-indigo-100 text-indigo-700'
  if (mapping.channel === 'DISP') return 'bg-emerald-100 text-emerald-700'
  if (mapping.channel === 'search') return 'bg-amber-100 text-amber-700'
  return 'bg-gray-100 text-gray-600'
}

export default function TacticReview({
  tactics,
  product,
  onUpdate,
  onGenerate,
}: TacticReviewProps) {
  const personaOptions = useMemo(() => getPersonaOptions(product), [product])
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  const isSearch = (t: ParsedTactic) =>
    t.platformKey && PLATFORM_MAPPINGS[t.platformKey]?.channel === 'search'

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const updateTactic = (id: string, patch: Partial<ParsedTactic>) => {
    onUpdate(tactics.map((t) => (t.id === id ? { ...t, ...patch } : t)))
  }

  const togglePersona = (tacticId: string, persona: string) => {
    const tactic = tactics.find((t) => t.id === tacticId)
    if (!tactic) return
    const next = tactic.personas.includes(persona)
      ? tactic.personas.filter((p) => p !== persona)
      : [...tactic.personas, persona]
    updateTactic(tacticId, { personas: next })
  }

  const toggleDimension = (tacticId: string, dim: string) => {
    const tactic = tactics.find((t) => t.id === tacticId)
    if (!tactic) return
    const next = tactic.dimensions.includes(dim)
      ? tactic.dimensions.filter((d) => d !== dim)
      : [...tactic.dimensions, dim]
    updateTactic(tacticId, { dimensions: next.length > 0 ? next : ['TBD'] })
  }

  const includedCount = tactics.filter((t) => t.included).length

  const expandAll = () => setExpandedIds(new Set(tactics.map((t) => t.id)))
  const collapseAll = () => setExpandedIds(new Set())
  const selectAll = () =>
    onUpdate(tactics.map((t) => ({ ...t, included: t.platformKey ? true : t.included })))
  const deselectUnrecognized = () =>
    onUpdate(tactics.map((t) => ({ ...t, included: t.platformKey ? t.included : false })))

  const allDimensionOptions = useMemo(() => {
    const custom = new Set<string>()
    for (const t of tactics) {
      for (const d of t.dimensions) {
        if (d && d !== 'TBD' && !AD_DIMENSIONS.includes(d)) custom.add(d)
      }
    }
    return [...AD_DIMENSIONS, ...custom]
  }, [tactics])

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="text-sm text-gray-600">
            <span className="font-medium">{includedCount}</span> of {tactics.length} tactics
            included
          </p>
          <span className="text-gray-300">|</span>
          <button onClick={expandAll} className="text-xs text-blue-600 hover:underline">
            Expand all
          </button>
          <button onClick={collapseAll} className="text-xs text-blue-600 hover:underline">
            Collapse all
          </button>
          <span className="text-gray-300">|</span>
          <button onClick={selectAll} className="text-xs text-blue-600 hover:underline">
            Select all recognized
          </button>
          <button onClick={deselectUnrecognized} className="text-xs text-blue-600 hover:underline">
            Deselect unknown
          </button>
        </div>
        <button
          onClick={onGenerate}
          disabled={includedCount === 0}
          className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Generate Taxonomy
        </button>
      </div>

      {/* Tactic cards */}
      <div className="space-y-2">
        {tactics.map((t) => {
          const expanded = expandedIds.has(t.id)
          const channel = channelLabel(t.platformKey)

          return (
            <div
              key={t.id}
              className={`rounded-lg border transition-colors ${
                !t.platformKey
                  ? 'border-amber-300 bg-amber-50/50'
                  : !t.included
                    ? 'border-gray-200 bg-gray-50 opacity-60'
                    : 'border-gray-200 bg-white'
              }`}
            >
              {/* Summary row */}
              <div
                className="flex cursor-pointer items-center gap-3 px-4 py-3"
                onClick={() => toggleExpand(t.id)}
              >
                {/* Include checkbox */}
                <input
                  type="checkbox"
                  checked={t.included}
                  onChange={(e) => {
                    e.stopPropagation()
                    updateTactic(t.id, { included: e.target.checked })
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="h-4 w-4 rounded border-gray-300"
                />

                {/* Platform name */}
                <span className="w-44 shrink-0 text-sm font-medium text-gray-900">
                  {t.platformKey || t.platform}
                  {!t.platformKey && (
                    <span className="ml-1.5 text-xs font-normal text-amber-600">(unknown)</span>
                  )}
                </span>

                {/* Channel badge */}
                {channel && (
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${channelColor(t.platformKey)}`}
                  >
                    {channel}
                  </span>
                )}

                {/* Language */}
                <span className="w-12 shrink-0 text-xs text-gray-500">
                  {languageDisplay(t.language)}
                </span>

                {/* Targeting summary */}
                <span className="min-w-0 flex-1 truncate text-xs text-gray-500">
                  {t.targetingDescription || t.placementDescription || '—'}
                </span>

                {/* Dimensions summary */}
                <span className="shrink-0 text-xs text-gray-400">
                  {t.dimensions.filter((d) => d !== 'TBD').length > 0
                    ? t.dimensions.join(', ')
                    : 'No dimensions'}
                </span>

                {/* Expand chevron */}
                <svg
                  className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>

              {/* Expanded detail */}
              {expanded && (
                <div className="border-t border-gray-100 px-4 pb-4 pt-3">
                  {/* Row 1: Core identifiers */}
                  <div className="mb-3 grid grid-cols-4 gap-4">
                    <Field label="Platform">
                      <select
                        value={t.platformKey}
                        onChange={(e) => {
                          const newKey = e.target.value
                          const mapping = PLATFORM_MAPPINGS[newKey]
                          updateTactic(t.id, {
                            platformKey: newKey,
                            placement: mapping?.defaultPlacement ?? t.placement,
                            tacticType: mapping?.defaultTacticType ?? t.tacticType,
                            buyType: mapping?.defaultBuyType ?? t.buyType,
                          })
                        }}
                        className="field-select"
                      >
                        {!t.platformKey && <option value="">{t.platform}</option>}
                        {Object.keys(PLATFORM_MAPPINGS).map((k) => (
                          <option key={k} value={k}>
                            {k}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Language">
                      <select
                        value={languageDisplay(t.language)}
                        onChange={(e) =>
                          updateTactic(t.id, { language: languageFromDisplay(e.target.value) })
                        }
                        className="field-select"
                      >
                        <option value="EN">EN</option>
                        <option value="FR">FR</option>
                        <option value="EN/FR">EN/FR</option>
                      </select>
                    </Field>

                    <Field label="Targeting">
                      <p
                        className="truncate px-1 py-1.5 text-sm text-gray-500"
                        title={t.targetingDescription}
                      >
                        {t.targetingDescription || '—'}
                      </p>
                    </Field>

                    <Field label="Region">
                      <p className="px-1 py-1.5 text-sm text-gray-500">{t.region || '—'}</p>
                    </Field>
                  </div>

                  {/* Row 2: Taxonomy field dropdowns */}
                  <div className="mb-3 grid grid-cols-4 gap-4">
                    <Field label="Placement">
                      <select
                        value={t.placement}
                        onChange={(e) => updateTactic(t.id, { placement: e.target.value })}
                        className="field-select"
                      >
                        {Object.keys(PLACEMENTS).map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Tactic Type">
                      <select
                        value={t.tacticType}
                        onChange={(e) => updateTactic(t.id, { tacticType: e.target.value })}
                        className="field-select"
                      >
                        {Object.keys(TACTIC_TYPES).map((tt) => (
                          <option key={tt} value={tt}>
                            {tt}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Ad Format">
                      <select
                        value={t.adFormat}
                        onChange={(e) =>
                          updateTactic(t.id, { adFormat: e.target.value as AdFormat })
                        }
                        className="field-select"
                      >
                        {Object.entries(AD_FORMAT_MAP).map(([label, acr]) => (
                          <option key={acr} value={acr}>
                            {acr} — {label}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Buy Type">
                      <select
                        value={t.buyType}
                        onChange={(e) =>
                          updateTactic(t.id, { buyType: e.target.value as BuyType | '' })
                        }
                        className="field-select"
                      >
                        <option value="">—</option>
                        {BUY_TYPES.map((bt) => (
                          <option key={bt} value={bt}>
                            {bt}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  {/* Row 3: Personas & Dimensions multi-selects */}
                  <div className="mb-3 grid grid-cols-4 gap-4">
                    {/* Personas multi-select */}
                    <Field label="Personas">
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenDropdown(
                              openDropdown === `persona-${t.id}` ? null : `persona-${t.id}`,
                            )
                          }
                          className="field-select w-full text-left"
                        >
                          {t.personas.length > 0 ? `${t.personas.length} selected` : 'Select…'}
                        </button>
                        {openDropdown === `persona-${t.id}` && (
                          <DropdownPanel>
                            {personaOptions.map((p) => (
                              <CheckboxItem
                                key={p}
                                label={p}
                                checked={t.personas.includes(p)}
                                onChange={() => togglePersona(t.id, p)}
                              />
                            ))}
                          </DropdownPanel>
                        )}
                      </div>
                    </Field>

                    {/* Dimensions multi-select */}
                    <Field label="Dimensions">
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenDropdown(openDropdown === `dim-${t.id}` ? null : `dim-${t.id}`)
                          }
                          className="field-select w-full text-left"
                        >
                          {t.dimensions.filter((d) => d !== 'TBD').length > 0
                            ? t.dimensions.join(', ')
                            : 'Select…'}
                        </button>
                        {openDropdown === `dim-${t.id}` && (
                          <DropdownPanel>
                            {allDimensionOptions.map((d) => (
                              <CheckboxItem
                                key={d}
                                label={d}
                                checked={t.dimensions.includes(d)}
                                onChange={() => toggleDimension(t.id, d)}
                              />
                            ))}
                          </DropdownPanel>
                        )}
                      </div>
                    </Field>

                    {/* Match Type (search only) */}
                    <Field label="Match Type">
                      {isSearch(t) ? (
                        <select
                          value={t.matchType}
                          onChange={(e) =>
                            updateTactic(t.id, { matchType: e.target.value as MatchType })
                          }
                          className="field-select"
                        >
                          {Object.entries(MATCH_TYPE_MAP).map(([label, acr]) => (
                            <option key={acr} value={acr}>
                              {acr} — {label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="px-1 py-1.5 text-sm text-gray-300">N/A</p>
                      )}
                    </Field>

                    {/* Influencer toggle */}
                    <Field label="Influencer">
                      <div className="flex items-center gap-2 py-1.5">
                        <input
                          type="checkbox"
                          checked={t.isInfluencer}
                          onChange={(e) => updateTactic(t.id, { isInfluencer: e.target.checked })}
                          className="rounded border-gray-300"
                        />
                        {t.isInfluencer && (
                          <input
                            type="text"
                            value={t.influencerName}
                            onChange={(e) => updateTactic(t.id, { influencerName: e.target.value })}
                            placeholder="Name"
                            className="field-input flex-1"
                          />
                        )}
                      </div>
                    </Field>
                  </div>

                  {/* Row 4: Text inputs */}
                  <div className="grid grid-cols-3 gap-4">
                    <Field label="Promomats ID (EN)">
                      <input
                        type="text"
                        value={t.promoIdEN}
                        onChange={(e) => updateTactic(t.id, { promoIdEN: e.target.value })}
                        placeholder="CA-XXX-XXXXX"
                        className="field-input"
                      />
                    </Field>

                    <Field label="Promomats ID (FR)">
                      <input
                        type="text"
                        value={t.promoIdFR}
                        onChange={(e) => updateTactic(t.id, { promoIdFR: e.target.value })}
                        placeholder="CA-XXX-XXXXX"
                        className="field-input"
                      />
                    </Field>

                    <Field label="Creative Name">
                      <input
                        type="text"
                        value={t.creativeName}
                        onChange={(e) => updateTactic(t.id, { creativeName: e.target.value })}
                        placeholder="na"
                        className="field-input"
                      />
                    </Field>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-gray-400">
        {label}
      </label>
      {children}
    </div>
  )
}

function DropdownPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute left-0 z-30 mt-1 max-h-52 w-48 overflow-y-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg">
      {children}
    </div>
  )
}

function CheckboxItem({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 px-3 py-1 text-sm hover:bg-gray-50">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="rounded border-gray-300"
      />
      <span className="truncate">{label}</span>
    </label>
  )
}
