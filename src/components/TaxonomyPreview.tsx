import { useState, useCallback } from 'react'
import type { TaxonomyRow } from '../engine/types'

type TabType = 'social' | 'digital' | 'search'
type StringField = 'campaignString' | 'adSetString' | 'adString' | 'utmString'

interface TaxonomyPreviewProps {
  rows: TaxonomyRow[]
  overrides: Record<string, Record<string, string>>
  onOverride: (rowIndex: number, field: StringField, value: string) => void
}

const TAB_LABELS: Record<TabType, string> = {
  social: 'Social',
  digital: 'Digital',
  search: 'Search',
}

const FIELD_LABELS: Record<TabType, { field: StringField; label: string }[]> = {
  social: [
    { field: 'campaignString', label: 'Campaign' },
    { field: 'adSetString', label: 'Ad Set' },
    { field: 'adString', label: 'Ad' },
    { field: 'utmString', label: 'UTM' },
  ],
  digital: [
    { field: 'campaignString', label: 'Campaign' },
    { field: 'adSetString', label: 'Placement/Ad Name' },
    { field: 'adString', label: 'Creative' },
    { field: 'utmString', label: 'UTM' },
  ],
  search: [
    { field: 'campaignString', label: 'Campaign' },
    { field: 'adSetString', label: 'Ad Set' },
    { field: 'utmString', label: 'UTM' },
  ],
}

export default function TaxonomyPreview({ rows, overrides, onOverride }: TaxonomyPreviewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('social')
  const [editingCell, setEditingCell] = useState<{ idx: number; field: StringField } | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const socialCount = rows.filter((r) => r.type === 'social').length
  const digitalCount = rows.filter((r) => r.type === 'digital').length
  const searchCount = rows.filter((r) => r.type === 'search').length
  const counts: Record<TabType, number> = {
    social: socialCount,
    digital: digitalCount,
    search: searchCount,
  }

  const errorCount = rows.reduce(
    (n, r) => n + r.validationErrors.filter((e) => e.severity === 'error').length,
    0,
  )
  const warningCount = rows.reduce(
    (n, r) => n + r.validationErrors.filter((e) => e.severity === 'warning').length,
    0,
  )

  const filteredRows = rows
    .map((r, i) => ({ row: r, globalIdx: i }))
    .filter((x) => x.row.type === activeTab)

  const copyToClipboard = useCallback((text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(null), 1500)
    })
  }, [])

  const getDisplay = (globalIdx: number, field: StringField, row: TaxonomyRow): string => {
    return overrides[globalIdx]?.[field] ?? row[field]
  }

  const hasOverride = (globalIdx: number, field: StringField): boolean => {
    return !!overrides[globalIdx]?.[field]
  }

  const fields = FIELD_LABELS[activeTab]

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center gap-6 rounded-lg border border-gray-200 bg-gray-50 px-5 py-3">
        <span className="text-sm text-gray-700">
          <strong>{socialCount}</strong> social, <strong>{digitalCount}</strong> digital,{' '}
          <strong>{searchCount}</strong> search
        </span>
        <span className="text-sm">
          {errorCount > 0 ? (
            <span className="font-medium text-red-600">{errorCount} errors</span>
          ) : (
            <span className="font-medium text-green-600">0 errors</span>
          )}
        </span>
        {warningCount > 0 && (
          <span className="text-sm font-medium text-amber-600">{warningCount} warnings</span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {(Object.keys(TAB_LABELS) as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {TAB_LABELS[tab]} ({counts[tab]})
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="max-h-[500px] overflow-x-auto overflow-y-auto rounded-lg border border-gray-200">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 z-10 bg-gray-50">
            <tr>
              <th className="w-10 px-3 py-2 text-left font-medium text-gray-700">#</th>
              {fields.map((f) => (
                <th key={f.field} className="px-3 py-2 text-left font-medium text-gray-700">
                  {f.label}
                </th>
              ))}
              <th className="w-16 px-3 py-2 text-left font-medium text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map(({ row, globalIdx }, localIdx) => {
              const rowErrors = row.validationErrors.filter((e) => e.severity === 'error')
              const rowWarnings = row.validationErrors.filter((e) => e.severity === 'warning')

              return (
                <tr
                  key={globalIdx}
                  className={`border-b border-gray-100 ${localIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                >
                  <td className="px-3 py-2 text-gray-400">{localIdx + 1}</td>
                  {fields.map((f) => {
                    const value = getDisplay(globalIdx, f.field, row)
                    const overridden = hasOverride(globalIdx, f.field)
                    const isEditing =
                      editingCell?.idx === globalIdx && editingCell?.field === f.field
                    const cellKey = `${globalIdx}-${f.field}`

                    return (
                      <td key={f.field} className="max-w-md px-3 py-2">
                        {isEditing ? (
                          <input
                            autoFocus
                            defaultValue={value}
                            onBlur={(e) => {
                              onOverride(globalIdx, f.field, e.target.value)
                              setEditingCell(null)
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                onOverride(globalIdx, f.field, (e.target as HTMLInputElement).value)
                                setEditingCell(null)
                              }
                              if (e.key === 'Escape') setEditingCell(null)
                            }}
                            className="w-full rounded border border-blue-400 px-2 py-1 font-mono text-xs focus:outline-none"
                          />
                        ) : (
                          <div className="group flex items-center gap-1">
                            {overridden && (
                              <span
                                className="h-2 w-2 shrink-0 rounded-full bg-blue-500"
                                title="Manually overridden"
                              />
                            )}
                            <span
                              className={`cursor-pointer truncate font-mono text-xs hover:text-blue-600 ${
                                !value || value === 'TBD' ? 'italic text-gray-400' : 'text-gray-900'
                              }`}
                              onClick={() => value && copyToClipboard(value, cellKey)}
                              onDoubleClick={() =>
                                setEditingCell({ idx: globalIdx, field: f.field })
                              }
                              title="Click to copy · Double-click to edit"
                            >
                              {value || '—'}
                            </span>
                            {copiedKey === cellKey && (
                              <span className="whitespace-nowrap text-xs text-green-600">
                                Copied
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    )
                  })}
                  <td className="px-3 py-2">
                    {rowErrors.length > 0 ? (
                      <span
                        className="cursor-help text-red-600"
                        title={rowErrors.map((e) => `[${e.ruleId}] ${e.message}`).join('\n')}
                      >
                        &#10005; {rowErrors.length}
                      </span>
                    ) : rowWarnings.length > 0 ? (
                      <span
                        className="cursor-help text-amber-500"
                        title={rowWarnings.map((e) => `[${e.ruleId}] ${e.message}`).join('\n')}
                      >
                        &#9888; {rowWarnings.length}
                      </span>
                    ) : (
                      <span className="text-green-600">&#10003;</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Inline validation detail */}
      {filteredRows.some(({ row }) => row.validationErrors.length > 0) && (
        <div className="space-y-1">
          {filteredRows
            .filter(({ row }) => row.validationErrors.length > 0)
            .slice(0, 20)
            .map(({ row, globalIdx }) =>
              row.validationErrors.map((err, i) => (
                <div
                  key={`${globalIdx}-${i}`}
                  className={`rounded px-3 py-1.5 text-xs ${
                    err.severity === 'error'
                      ? 'bg-red-50 text-red-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  <span className="font-medium">[{err.ruleId}]</span> {err.message}
                </div>
              )),
            )}
        </div>
      )}
    </div>
  )
}
