import { useState, useEffect } from 'react'
import type {
  CampaignMeta,
  ProductKey,
  CampaignTypeKey,
  ObjectiveKey,
  AudienceCode,
  ContentPurposeAcronym,
} from '../engine/types'
import { PRODUCTS, CAMPAIGN_TYPE_MAP, OBJECTIVE_MAP, CONTENT_PURPOSE_MAP } from '../engine/config'

const PRODUCT_OPTIONS: { label: string; value: ProductKey }[] = [
  { label: 'Capvaxive (PCN)', value: 'PCN' },
  { label: 'Gardasil 9 Consumer (GSL)', value: 'GSL' },
  { label: 'Gardasil 9 HCP (GSL_HCP)', value: 'GSL_HCP' },
]

const CONTENT_PURPOSE_LABELS: Record<ContentPurposeAcronym, string> = {
  PRDAW: 'Product Awareness',
  DA: 'Disease Awareness',
  COR: 'Corporate',
}

interface CampaignFormProps {
  initialMeta: Partial<CampaignMeta>
  onSubmit: (meta: CampaignMeta) => void
}

export default function CampaignForm({ initialMeta, onSubmit }: CampaignFormProps) {
  const [product, setProduct] = useState<ProductKey | ''>(initialMeta.product ?? '')
  const [campaignName, setCampaignName] = useState(initialMeta.campaignName ?? '')
  const [campaignType, setCampaignType] = useState<CampaignTypeKey>(
    initialMeta.campaignType ?? 'Branded',
  )
  const [objective, setObjective] = useState<ObjectiveKey | ''>(initialMeta.objective ?? '')
  const [yearMonth, setYearMonth] = useState(initialMeta.yearMonth ?? '')
  const [audience, setAudience] = useState<AudienceCode>(initialMeta.audience ?? 'HCCO')
  const [contentPurpose, setContentPurpose] = useState<ContentPurposeAcronym | ''>(
    initialMeta.contentPurpose ?? '',
  )
  const [targetUrl, setTargetUrl] = useState(initialMeta.targetUrl ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!product) return
    const config = PRODUCTS[product]
    setAudience(config.default_audience)
    setContentPurpose(config.default_content_purpose)
  }, [product])

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!product) errs.product = 'Required'
    if (!campaignName.trim()) errs.campaignName = 'Required'
    if (!objective) errs.objective = 'Required'
    if (!yearMonth) errs.yearMonth = 'Required'
    else if (!/^\d{6}$/.test(yearMonth)) errs.yearMonth = 'Must be YYYYMM'
    if (!contentPurpose) errs.contentPurpose = 'Required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    onSubmit({
      product: product as ProductKey,
      campaignName: campaignName.trim(),
      campaignType,
      objective: objective as ObjectiveKey,
      yearMonth,
      audience,
      contentPurpose: contentPurpose as ContentPurposeAcronym,
      targetUrl: targetUrl.trim(),
      startDate: initialMeta.startDate ?? '',
      endDate: initialMeta.endDate ?? '',
    })
  }

  const fieldClass = (name: string) =>
    `w-full rounded-md border px-3 py-2 text-sm ${errors[name] ? 'border-red-400' : 'border-gray-300'} focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-x-6 gap-y-5">
        {/* Product */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Product</label>
          <select
            value={product}
            onChange={(e) => setProduct(e.target.value as ProductKey)}
            className={fieldClass('product')}
          >
            <option value="">Select product…</option>
            {PRODUCT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {errors.product && <p className="mt-1 text-xs text-red-500">{errors.product}</p>}
        </div>

        {/* Campaign Name */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Campaign Name (Short)
          </label>
          <input
            type="text"
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
            placeholder="e.g. YOTM2026"
            className={fieldClass('campaignName')}
          />
          {errors.campaignName && (
            <p className="mt-1 text-xs text-red-500">{errors.campaignName}</p>
          )}
        </div>

        {/* Campaign Type */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Campaign Type</label>
          <select
            value={campaignType}
            onChange={(e) => setCampaignType(e.target.value as CampaignTypeKey)}
            className={fieldClass('campaignType')}
          >
            {(Object.keys(CAMPAIGN_TYPE_MAP) as CampaignTypeKey[]).map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>

        {/* Objective */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Objective</label>
          <select
            value={objective}
            onChange={(e) => setObjective(e.target.value as ObjectiveKey)}
            className={fieldClass('objective')}
          >
            <option value="">Select objective…</option>
            {(Object.keys(OBJECTIVE_MAP) as ObjectiveKey[]).map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
          {errors.objective && <p className="mt-1 text-xs text-red-500">{errors.objective}</p>}
        </div>

        {/* Year & Month */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Year &amp; Month</label>
          <input
            type="text"
            value={yearMonth}
            onChange={(e) => setYearMonth(e.target.value)}
            placeholder="YYYYMM"
            maxLength={6}
            className={fieldClass('yearMonth')}
          />
          {errors.yearMonth && <p className="mt-1 text-xs text-red-500">{errors.yearMonth}</p>}
        </div>

        {/* Audience */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Audience</label>
          <select
            value={audience}
            onChange={(e) => setAudience(e.target.value as AudienceCode)}
            className={fieldClass('audience')}
          >
            <option value="HCCO">HCCO</option>
            <option value="HCP">HCP</option>
          </select>
        </div>

        {/* Content Purpose */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Content Purpose</label>
          <select
            value={contentPurpose}
            onChange={(e) => setContentPurpose(e.target.value as ContentPurposeAcronym)}
            className={fieldClass('contentPurpose')}
          >
            <option value="">Select…</option>
            {(Object.keys(CONTENT_PURPOSE_MAP) as string[]).map((label) => {
              const acr = CONTENT_PURPOSE_MAP[label]
              return (
                <option key={acr} value={acr}>
                  {label}
                </option>
              )
            })}
          </select>
          {errors.contentPurpose && (
            <p className="mt-1 text-xs text-red-500">{errors.contentPurpose}</p>
          )}
          {contentPurpose && (
            <p className="mt-1 text-xs text-gray-400">
              Acronym: {contentPurpose} &mdash; {CONTENT_PURPOSE_LABELS[contentPurpose]}
            </p>
          )}
        </div>

        {/* Target URL */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Target URL</label>
          <input
            type="text"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            placeholder="https://…"
            className={fieldClass('targetUrl')}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          Continue
        </button>
      </div>
    </form>
  )
}
