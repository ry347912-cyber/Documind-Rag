import { useState, useEffect, useCallback } from 'react'
import { FileText, Trash2, Loader2, AlertCircle, RefreshCw } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || ''

function StatusDot({ status }) {
  const map = {
    ready: 'bg-green-500',
    processing: 'bg-yellow-500 animate-pulse',
    error: 'bg-red-500',
  }
  return (
    <span className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${map[status] || 'bg-gray-500'}`} />
  )
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function DocumentList({ selectedIds, onSelectionChange, onDocumentsLoaded, onDeleted }) {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const fetchDocs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/api/documents`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setDocs(data)
      onDocumentsLoaded?.(data)
    } catch (err) {
      setError('Could not load documents.')
    } finally {
      setLoading(false)
    }
  }, [onDocumentsLoaded])

  useEffect(() => { fetchDocs() }, [fetchDocs])

  const toggleSelect = (id) => {
    onSelectionChange(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleDelete = async (e, doc) => {
    e.stopPropagation()
    if (!window.confirm(`Delete "${doc.original_filename}"?`)) return
    setDeleting(doc.id)
    try {
      const res = await fetch(`${API_URL}/api/documents/${doc.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setDocs(prev => prev.filter(d => d.id !== doc.id))
      onDeleted?.(doc.id)
    } catch {
      alert('Failed to delete document.')
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 size={20} className="text-purple-400 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="flex items-center gap-2 text-red-400 text-xs mb-3">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
        <button onClick={fetchDocs} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors">
          <RefreshCw size={12} /> Retry
        </button>
      </div>
    )
  }

  if (docs.length === 0) {
    return (
      <div className="p-4 text-center py-10">
        <FileText size={28} className="text-gray-700 mx-auto mb-2" />
        <p className="text-xs text-gray-500">No documents yet.</p>
        <p className="text-xs text-gray-600 mt-1">Upload a PDF or DOCX above.</p>
      </div>
    )
  }

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-500 uppercase tracking-widest font-mono">Documents</p>
        <button onClick={fetchDocs} className="text-gray-600 hover:text-white transition-colors">
          <RefreshCw size={12} />
        </button>
      </div>

      <div className="space-y-1.5">
        {docs.map(doc => {
          const isSelected = selectedIds.includes(doc.id)
          const isReady = doc.status === 'ready'
          const isDeleting = deleting === doc.id

          return (
            <div
              key={doc.id}
              onClick={() => isReady && toggleSelect(doc.id)}
              className={`
                flex items-start gap-2.5 p-2.5 rounded-lg border transition-all duration-150 group
                ${isReady ? 'cursor-pointer' : 'cursor-default'}
                ${isSelected
                  ? 'border-purple-600/60 bg-purple-900/20'
                  : 'border-transparent hover:border-border hover:bg-surface'
                }
              `}
            >
              {/* Checkbox */}
              <div className={`
                w-4 h-4 rounded shrink-0 mt-0.5 border flex items-center justify-center transition-colors
                ${isSelected ? 'bg-purple-600 border-purple-600' : 'border-border'}
                ${!isReady ? 'opacity-30' : ''}
              `}>
                {isSelected && (
                  <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                    <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <StatusDot status={doc.status} />
                  <p className="text-xs text-gray-200 truncate font-medium">{doc.original_filename}</p>
                </div>
                <p className="text-xs text-gray-600 font-mono">
                  {formatSize(doc.file_size)} · {doc.total_chunks} chunks · {doc.total_pages}p
                </p>
              </div>

              {/* Delete button */}
              <button
                onClick={(e) => handleDelete(e, doc)}
                disabled={isDeleting}
                className="shrink-0 text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 mt-0.5"
              >
                {isDeleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
              </button>
            </div>
          )
        })}
      </div>

      {selectedIds.length > 0 && (
        <div className="mt-3 text-xs text-purple-400 font-mono text-center">
          {selectedIds.length} selected for querying
        </div>
      )}
    </div>
  )
}
