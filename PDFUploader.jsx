import { useState, useRef, useCallback } from 'react'
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || ''
const ACCEPTED = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']

export default function PDFUploader({ onUploadComplete }) {
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState(null) // 'success' | 'error' | null
  const [message, setMessage] = useState('')
  const [fileName, setFileName] = useState('')
  const inputRef = useRef(null)

  const reset = () => {
    setStatus(null)
    setMessage('')
    setProgress(0)
    setFileName('')
  }

  const uploadFile = useCallback(async (file) => {
    if (!ACCEPTED.includes(file.type)) {
      setStatus('error')
      setMessage('Only PDF and DOCX files are supported.')
      return
    }
    if (file.size > 50 * 1024 * 1024) {
      setStatus('error')
      setMessage('File must be under 50 MB.')
      return
    }

    setUploading(true)
    setProgress(10)
    setFileName(file.name)
    setStatus(null)
    setMessage('')

    const formData = new FormData()
    formData.append('file', file)

    try {
      // Simulate progress while uploading
      const progressInterval = setInterval(() => {
        setProgress(p => Math.min(p + 8, 85))
      }, 300)

      const res = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setProgress(100)

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Upload failed.' }))
        throw new Error(err.detail || `HTTP ${res.status}`)
      }

      setStatus('success')
      setMessage(`"${file.name}" indexed successfully!`)
      onUploadComplete?.()
    } catch (err) {
      setStatus('error')
      setMessage(err.message || 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }, [onUploadComplete])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }, [uploadFile])

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) uploadFile(file)
    e.target.value = ''
  }

  return (
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-widest font-mono mb-3">Upload document</p>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer
          transition-all duration-200
          ${dragOver ? 'border-purple-500 bg-purple-900/20' : 'border-border hover:border-purple-700 hover:bg-purple-900/10'}
          ${uploading ? 'cursor-not-allowed opacity-70' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx"
          className="hidden"
          onChange={handleFileChange}
          disabled={uploading}
        />

        <div className="flex flex-col items-center gap-2">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${dragOver ? 'bg-purple-600' : 'bg-surface'}`}>
            <Upload size={18} className={dragOver ? 'text-white' : 'text-purple-400'} />
          </div>
          <div>
            <p className="text-sm text-gray-300 font-medium">
              {uploading ? `Uploading ${fileName}…` : 'Drop PDF or DOCX here'}
            </p>
            <p className="text-xs text-gray-600 mt-0.5">or click to browse · max 50 MB</p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {uploading && (
        <div className="mt-3">
          <div className="h-1.5 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-600 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1.5 font-mono">{progress}% · processing chunks…</p>
        </div>
      )}

      {/* Status message */}
      {status && !uploading && (
        <div className={`mt-3 flex items-start gap-2 p-3 rounded-lg text-xs ${
          status === 'success'
            ? 'bg-green-900/20 border border-green-800/40 text-green-300'
            : 'bg-red-900/20 border border-red-800/40 text-red-300'
        }`}>
          {status === 'success'
            ? <CheckCircle size={14} className="shrink-0 mt-0.5" />
            : <AlertCircle size={14} className="shrink-0 mt-0.5" />}
          <span className="flex-1">{message}</span>
          <button onClick={reset} className="shrink-0 opacity-60 hover:opacity-100">
            <X size={12} />
          </button>
        </div>
      )}
    </div>
  )
}
