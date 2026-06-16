import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Bot, User, Loader2, FileSearch } from 'lucide-react'
import CitationCard from './CitationCard.jsx'

const API_URL = import.meta.env.VITE_API_URL || ''

function parseInlineCitations(text) {
  // Match [Source: filename.pdf, Page 5]
  const regex = /\[Source:\s*([^,]+),\s*Page\s*(\d+)\]/g
  const parts = []
  let last = 0
  let match

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push({ type: 'text', content: text.slice(last, match.index) })
    }
    parts.push({ type: 'citation', filename: match[1].trim(), page: parseInt(match[2], 10) })
    last = match.index + match[0].length
  }
  if (last < text.length) {
    parts.push({ type: 'text', content: text.slice(last) })
  }
  return parts
}

function Message({ role, content, citations, streaming }) {
  const isUser = role === 'user'
  const parts = isUser ? null : parseInlineCitations(content)

  return (
    <div className={`flex gap-3 animate-slide-up ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`
        w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs mt-0.5
        ${isUser ? 'bg-purple-600' : 'bg-surface border border-border'}
      `}>
        {isUser ? <User size={13} /> : <Bot size={13} className="text-purple-400" />}
      </div>

      {/* Bubble */}
      <div className={`max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
        <div className={`
          rounded-2xl px-4 py-3 text-sm leading-relaxed
          ${isUser
            ? 'bg-purple-600 text-white rounded-tr-sm'
            : 'bg-surface border border-border text-gray-100 rounded-tl-sm'
          }
          ${streaming ? 'cursor-blink' : ''}
        `}>
          {isUser ? (
            content
          ) : (
            <span>
              {parts?.map((part, i) =>
                part.type === 'text' ? (
                  <span key={i}>{part.content}</span>
                ) : (
                  <span key={i} className="inline-block mx-0.5 align-middle">
                    <CitationCard filename={part.filename} page={part.page} />
                  </span>
                )
              )}
            </span>
          )}
        </div>

        {/* Citation badges below the bubble */}
        {!isUser && citations && citations.length > 0 && !streaming && (
          <div className="flex flex-wrap gap-1.5 px-1">
            {citations.map((c, i) => (
              <CitationCard key={i} filename={c.filename} page={c.page} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ChatWindow({ selectedDocumentIds }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const abortRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(async () => {
    const question = input.trim()
    if (!question || loading) return

    if (selectedDocumentIds.length === 0) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Please select at least one document from the sidebar before asking a question.',
        citations: [],
      }])
      return
    }

    setInput('')
    setMessages(prev => [
      ...prev,
      { role: 'user', content: question },
      { role: 'assistant', content: '', citations: [], streaming: true },
    ])
    setLoading(true)

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch(`${API_URL}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, document_ids: selectedDocumentIds }),
        signal: controller.signal,
      })

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let citations = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() // keep incomplete last line

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const event = JSON.parse(line.slice(6))

            if (event.type === 'citations') {
              citations = event.citations
              setMessages(prev => {
                const updated = [...prev]
                updated[updated.length - 1] = { ...updated[updated.length - 1], citations }
                return updated
              })
            } else if (event.type === 'token') {
              setMessages(prev => {
                const updated = [...prev]
                const last = updated[updated.length - 1]
                updated[updated.length - 1] = {
                  ...last,
                  content: last.content + event.content,
                }
                return updated
              })
            } else if (event.type === 'done') {
              setMessages(prev => {
                const updated = [...prev]
                updated[updated.length - 1] = { ...updated[updated.length - 1], streaming: false }
                return updated
              })
            } else if (event.type === 'error') {
              throw new Error(event.message)
            }
          } catch {
            // skip malformed SSE line
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') return
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: `Error: ${err.message}`,
          streaming: false,
        }
        return updated
      })
    } finally {
      setLoading(false)
    }
  }, [input, loading, selectedDocumentIds])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const isEmpty = messages.length === 0

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-14 h-14 rounded-2xl bg-surface border border-border flex items-center justify-center mb-4">
              <FileSearch size={24} className="text-purple-400" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">Ask your documents anything</h2>
            <p className="text-gray-500 text-sm max-w-xs">
              Select documents from the sidebar, then ask a question. Every answer includes exact page citations.
            </p>
            {selectedDocumentIds.length === 0 && (
              <p className="mt-4 text-xs text-yellow-500/80 bg-yellow-900/20 border border-yellow-800/30 rounded-lg px-3 py-2">
                ← Upload and select a document first
              </p>
            )}
          </div>
        ) : (
          messages.map((msg, i) => (
            <Message key={i} {...msg} />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="border-t border-border px-4 py-4 shrink-0">
        <div className="flex items-end gap-3 bg-surface border border-border rounded-xl px-4 py-3 focus-within:border-purple-600 transition-colors">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about your documents…"
            rows={1}
            className="flex-1 bg-transparent text-white placeholder-gray-600 text-sm resize-none focus:outline-none leading-relaxed max-h-32"
            style={{ fieldSizing: 'content' }}
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="shrink-0 w-8 h-8 bg-purple-600 hover:bg-purple-500 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg flex items-center justify-center transition-colors"
          >
            {loading
              ? <Loader2 size={14} className="text-white animate-spin" />
              : <Send size={14} className="text-white" />
            }
          </button>
        </div>
        <p className="text-xs text-gray-700 text-center mt-2">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
