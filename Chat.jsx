import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Cpu, ArrowLeft } from 'lucide-react'
import PDFUploader from '../components/PDFUploader.jsx'
import DocumentList from '../components/DocumentList.jsx'
import ChatWindow from '../components/ChatWindow.jsx'

export default function Chat() {
  const navigate = useNavigate()
  const [documents, setDocuments] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [refreshKey, setRefreshKey] = useState(0)

  const handleUploadComplete = () => {
    setRefreshKey(k => k + 1)
  }

  const handleDocumentsLoaded = (docs) => {
    setDocuments(docs)
    // Auto-select ready documents
    const readyIds = docs.filter(d => d.status === 'ready').map(d => d.id)
    setSelectedIds(prev => {
      const existing = new Set(prev)
      readyIds.forEach(id => existing.add(id))
      return [...existing]
    })
  }

  const handleDeleted = (id) => {
    setSelectedIds(prev => prev.filter(i => i !== id))
  }

  return (
    <div className="h-screen flex flex-col bg-bg overflow-hidden">
      {/* Top bar */}
      <header className="border-b border-border px-4 py-3 flex items-center gap-3 shrink-0">
        <button
          onClick={() => navigate('/')}
          className="text-gray-500 hover:text-white transition-colors p-1"
          aria-label="Back to home"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-purple-600 rounded-md flex items-center justify-center">
            <Cpu size={12} className="text-white" />
          </div>
          <span className="font-semibold text-white text-sm">DocuMind</span>
        </div>
        <div className="ml-auto text-xs text-gray-500 font-mono">
          {selectedIds.length} doc{selectedIds.length !== 1 ? 's' : ''} selected
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <aside className="w-72 border-r border-border flex flex-col shrink-0 overflow-hidden">
          <div className="p-4 border-b border-border shrink-0">
            <PDFUploader onUploadComplete={handleUploadComplete} />
          </div>
          <div className="flex-1 overflow-y-auto">
            <DocumentList
              key={refreshKey}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              onDocumentsLoaded={handleDocumentsLoaded}
              onDeleted={handleDeleted}
            />
          </div>
        </aside>

        {/* Chat area */}
        <main className="flex-1 overflow-hidden">
          <ChatWindow selectedDocumentIds={selectedIds} />
        </main>
      </div>
    </div>
  )
}
