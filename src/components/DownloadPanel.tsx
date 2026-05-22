import { useState } from 'react'
import type { TaxonomyRow, CampaignMeta } from '../engine/types'
import { generateTrafficSheet } from '../engine/trafficSheetWriter'

interface DownloadPanelProps {
  meta: CampaignMeta
  rows: TaxonomyRow[]
}

export default function DownloadPanel({ meta, rows }: DownloadPanelProps) {
  const [downloading, setDownloading] = useState(false)

  const errorCount = rows.reduce(
    (n, r) => n + r.validationErrors.filter((e) => e.severity === 'error').length,
    0,
  )
  const warningCount = rows.reduce(
    (n, r) => n + r.validationErrors.filter((e) => e.severity === 'warning').length,
    0,
  )
  const socialCount = rows.filter((r) => r.type === 'social').length
  const digitalCount = rows.filter((r) => r.type === 'digital').length
  const searchCount = rows.filter((r) => r.type === 'search').length

  const handleDownload = async () => {
    setDownloading(true)
    try {
      await generateTrafficSheet(meta, rows)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-6">
        <h3 className="font-medium text-gray-900">Traffic Sheet Summary</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="rounded-md border border-gray-200 bg-white p-3">
            <p className="text-gray-500">Social</p>
            <p className="text-2xl font-semibold text-gray-900">{socialCount}</p>
          </div>
          <div className="rounded-md border border-gray-200 bg-white p-3">
            <p className="text-gray-500">Digital</p>
            <p className="text-2xl font-semibold text-gray-900">{digitalCount}</p>
          </div>
          <div className="rounded-md border border-gray-200 bg-white p-3">
            <p className="text-gray-500">Search</p>
            <p className="text-2xl font-semibold text-gray-900">{searchCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm">
          {errorCount > 0 ? (
            <span className="font-medium text-red-600">
              {errorCount} validation errors &mdash; fix before downloading
            </span>
          ) : (
            <span className="font-medium text-green-600">No validation errors</span>
          )}
          {warningCount > 0 && <span className="text-amber-600">{warningCount} warnings</span>}
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleDownload}
          disabled={errorCount > 0 || downloading}
          className="rounded-lg bg-blue-600 px-8 py-3 text-base font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {downloading ? 'Generating…' : 'Download Traffic Sheet'}
        </button>
      </div>

      {errorCount > 0 && (
        <p className="text-center text-sm text-gray-500">
          Resolve all validation errors in Step 4 before downloading.
        </p>
      )}
    </div>
  )
}
