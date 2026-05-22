import { useState, useRef, useCallback } from 'react'

interface FileUploaderProps {
  onFileUploaded: (file: File) => Promise<void>
  isLoading: boolean
  error: string | null
  fileName: string | null
}

export default function FileUploader({
  onFileUploaded,
  isLoading,
  error,
  fileName,
}: FileUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(
    (file: File) => {
      if (!file.name.endsWith('.xlsx')) return
      onFileUploaded(file)
    },
    [onFileUploaded],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile],
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file)
    },
    [handleFile],
  )

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragOver(true)
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-lg border-2 border-dashed p-12 text-center transition-colors ${
          isDragOver
            ? 'border-blue-500 bg-blue-50'
            : fileName
              ? 'border-green-400 bg-green-50'
              : error
                ? 'border-red-400 bg-red-50'
                : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        {isLoading ? (
          <div className="space-y-3">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
            <p className="text-sm text-gray-600">Parsing blocking chart…</p>
          </div>
        ) : fileName ? (
          <div className="space-y-2">
            <p className="text-2xl text-green-600">&#10003;</p>
            <p className="font-medium text-gray-900">{fileName}</p>
            <p className="text-xs text-gray-500">Click or drag to replace</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-3xl text-gray-400">&#8593;</p>
            <p className="font-medium text-gray-700">Drop your blocking chart here</p>
            <p className="text-sm text-gray-500">or click to browse &mdash; .xlsx only</p>
          </div>
        )}
      </div>

      <input ref={inputRef} type="file" accept=".xlsx" onChange={handleChange} className="hidden" />

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  )
}
