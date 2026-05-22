import { useState, useCallback } from 'react'
import { saveAs } from 'file-saver'
import { parseBlockingChart, explodeRows, countYellowCells, generateFormulaSheet, PRODUCTS } from './engine'
import type { ExplodedRow, CampaignMeta } from './engine/types'
import FileUploader from './components/FileUploader'
import ResultSummary from './components/ResultSummary'

type AppState = 'upload' | 'processing' | 'result'

function App() {
  const [state, setState] = useState<AppState>('upload')
  const [isLoading, setIsLoading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  const [rows, setRows] = useState<ExplodedRow[]>([])
  const [meta, setMeta] = useState<{ product: string; campaignName: string; yearMonth: string }>({
    product: '',
    campaignName: '',
    yearMonth: '',
  })
  const [warnings, setWarnings] = useState<string[]>([])
  const [yellowCount, setYellowCount] = useState(0)

  const handleUpload = useCallback(async (file: File) => {
    setIsLoading(true)
    setUploadError(null)
    setState('processing')

    try {
      const result = await parseBlockingChart(file)
      const parsedMeta = result.meta as Partial<CampaignMeta>

      if (result.tactics.length === 0) {
        setUploadError(result.warnings.join(' ') || 'No tactics found in the blocking chart.')
        setState('upload')
        return
      }

      const campaignMeta: CampaignMeta = {
        product: parsedMeta.product ?? ('' as CampaignMeta['product']),
        campaignName: parsedMeta.campaignName ?? '',
        campaignType: '' as CampaignMeta['campaignType'],
        objective: parsedMeta.objective ?? ('' as CampaignMeta['objective']),
        yearMonth: parsedMeta.yearMonth ?? '',
        audience: parsedMeta.audience ?? ('' as CampaignMeta['audience']),
        contentPurpose: parsedMeta.contentPurpose ?? ('' as CampaignMeta['contentPurpose']),
        targetUrl: '',
        startDate: parsedMeta.startDate ?? '',
        endDate: parsedMeta.endDate ?? '',
      }

      const productConfig = parsedMeta.product ? PRODUCTS[parsedMeta.product] : null
      const exploded = explodeRows(campaignMeta, result.tactics)
      const yellows = countYellowCells(exploded)

      setFileName(file.name)
      setRows(exploded)
      setMeta({
        product: productConfig?.product_acronym ?? 'UNKNOWN',
        campaignName: parsedMeta.campaignName ?? file.name.replace(/\.xlsx$/i, ''),
        yearMonth: parsedMeta.yearMonth ?? '',
      })
      setWarnings(result.warnings)
      setYellowCount(yellows)
      setState('result')
    } catch {
      setUploadError(
        'Could not read the blocking chart. Please ensure it is a valid .xlsx file with tactic/platform data.',
      )
      setState('upload')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleDownload = useCallback(async () => {
    const buffer = await generateFormulaSheet(rows, meta)
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const filename = `${meta.product}_${meta.campaignName}_${meta.yearMonth}_Traffic_Sheet.xlsx`
    saveAs(blob, filename)
  }, [rows, meta])

  const handleReset = useCallback(() => {
    setState('upload')
    setFileName(null)
    setRows([])
    setWarnings([])
    setYellowCount(0)
    setUploadError(null)
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-900">CTT Traffic Sheet Generator</h1>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-8">
        {(state === 'upload' || state === 'processing') && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Upload a blocking chart (.xlsx) to generate a formula-based traffic sheet.
            </p>
            <FileUploader
              onFileUploaded={handleUpload}
              isLoading={isLoading}
              error={uploadError}
              fileName={null}
            />
          </div>
        )}

        {state === 'result' && (
          <ResultSummary
            product={meta.product}
            campaignName={meta.campaignName}
            socialCount={rows.filter((r) => r.channel === 'SOC').length}
            digitalCount={rows.filter((r) => r.channel === 'DISP').length}
            searchCount={rows.filter((r) => r.channel === 'search').length}
            yellowCellCount={yellowCount}
            warnings={warnings}
            onDownload={handleDownload}
            onReset={handleReset}
          />
        )}
      </main>
    </div>
  )
}

export default App
