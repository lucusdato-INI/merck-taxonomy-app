import { useState, useCallback } from 'react'
import type { CampaignMeta, ParsedTactic, TaxonomyRow } from './engine/types'
import { parseBlockingChart, buildTaxonomy, validateAll, PRODUCTS } from './engine'
import FileUploader from './components/FileUploader'
import CampaignForm from './components/CampaignForm'
import TacticReview from './components/TacticReview'
import TaxonomyPreview from './components/TaxonomyPreview'
import DownloadPanel from './components/DownloadPanel'

const STEPS = [
  'Upload Blocking Chart',
  'Campaign Configuration',
  'Review Tactics',
  'Preview & Validate',
  'Download',
]

type StringField = 'campaignString' | 'adSetString' | 'adString' | 'utmString'

function App() {
  const [step, setStep] = useState(0)

  // Step 1
  const [isLoading, setIsLoading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [parsedMeta, setParsedMeta] = useState<Partial<CampaignMeta>>({})
  const [warnings, setWarnings] = useState<string[]>([])

  // Step 2
  const [meta, setMeta] = useState<CampaignMeta | null>(null)

  // Step 3
  const [tactics, setTactics] = useState<ParsedTactic[]>([])

  // Step 4
  const [rows, setRows] = useState<TaxonomyRow[]>([])
  const [overrides, setOverrides] = useState<Record<string, Record<string, string>>>({})

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleUpload = useCallback(async (file: File) => {
    setIsLoading(true)
    setUploadError(null)
    try {
      const result = await parseBlockingChart(file)
      setFileName(file.name)
      setParsedMeta(result.meta)
      setTactics(result.tactics)
      setWarnings(result.warnings)

      if (result.tactics.length === 0 && result.warnings.length > 0) {
        setUploadError(result.warnings.join(' '))
      } else {
        setStep(1)
      }
    } catch {
      setUploadError(
        'Could not read the blocking chart. Please ensure it is a valid .xlsx file with tactic/platform data.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleFormSubmit = useCallback(
    (m: CampaignMeta) => {
      setMeta(m)

      const config = PRODUCTS[m.product]
      const personaNames =
        config.personas.type === 'paired'
          ? Object.values(config.personas.pairs).map((p) => p.pair_name)
          : Object.keys(config.personas.named)

      setTactics((prev) =>
        prev.map((t) => ({
          ...t,
          personas: t.personas.length > 0 ? t.personas : [...personaNames],
        })),
      )

      setStep(2)
    },
    [],
  )

  const handleGenerate = useCallback(() => {
    if (!meta) return
    const included = tactics.filter((t) => t.included)
    const built = buildTaxonomy(meta, included)
    const validated = validateAll(built)
    setRows(validated)
    setOverrides({})
    setStep(3)
  }, [meta, tactics])

  const handleOverride = useCallback((rowIndex: number, field: StringField, value: string) => {
    setOverrides((prev) => ({
      ...prev,
      [rowIndex]: { ...prev[rowIndex], [field]: value },
    }))
  }, [])

  const goToStep = (target: number) => {
    if (target <= step) setStep(target)
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-900">MSD CTT Taxonomy Generator</h1>
      </header>

      {/* Step indicator */}
      <nav className="border-b border-gray-100 bg-gray-50 px-6 py-3">
        <div className="mx-auto flex max-w-5xl items-center gap-1">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center">
              {i > 0 && (
                <div
                  className={`mx-1 h-px w-8 ${i <= step ? 'bg-blue-300' : 'bg-gray-200'}`}
                />
              )}
              <button
                onClick={() => goToStep(i)}
                disabled={i > step}
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  i === step
                    ? 'bg-blue-600 text-white'
                    : i < step
                      ? 'cursor-pointer bg-blue-100 text-blue-700 hover:bg-blue-200'
                      : 'cursor-not-allowed bg-gray-100 text-gray-400'
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] ${
                    i === step
                      ? 'border-white/30'
                      : i < step
                        ? 'border-blue-300'
                        : 'border-gray-300'
                  }`}
                >
                  {i < step ? '✓' : i + 1}
                </span>
                {label}
              </button>
            </div>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6">
          <p className="mb-1 text-sm text-gray-500">
            Step {step + 1} of {STEPS.length}
          </p>
          <h2 className="text-lg font-semibold text-gray-900">{STEPS[step]}</h2>
        </div>

        {step === 0 && (
          <div className="space-y-4">
            <FileUploader
              onFileUploaded={handleUpload}
              isLoading={isLoading}
              error={uploadError}
              fileName={fileName}
            />
            {warnings.length > 0 && !uploadError && (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                <p className="mb-1 font-medium">Warnings:</p>
                <ul className="list-inside list-disc space-y-1">
                  {warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {step === 1 && <CampaignForm initialMeta={parsedMeta} onSubmit={handleFormSubmit} />}

        {step === 2 && meta && (
          <TacticReview
            tactics={tactics}
            product={meta.product}
            onUpdate={setTactics}
            onGenerate={handleGenerate}
          />
        )}

        {step === 3 && (
          <div className="space-y-6">
            <TaxonomyPreview rows={rows} overrides={overrides} onOverride={handleOverride} />
            <div className="flex justify-end">
              <button
                onClick={() => setStep(4)}
                className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                Continue to Download
              </button>
            </div>
          </div>
        )}

        {step === 4 && meta && <DownloadPanel meta={meta} rows={rows} />}
      </main>
    </div>
  )
}

export default App
