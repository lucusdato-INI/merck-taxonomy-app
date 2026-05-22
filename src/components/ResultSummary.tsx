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
              {showWarnings ? 'Hide' : 'Show'} {warnings.length} warning
              {warnings.length !== 1 ? 's' : ''}
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
