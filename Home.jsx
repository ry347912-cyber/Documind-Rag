import { useNavigate } from 'react-router-dom'
import { FileText, Zap, BookOpen, Shield, ArrowRight, Cpu, Database, MessageSquare } from 'lucide-react'

const TECH_BADGES = [
  { label: 'Python 3.11', color: 'bg-blue-900/40 text-blue-300 border-blue-800' },
  { label: 'FastAPI', color: 'bg-green-900/40 text-green-300 border-green-800' },
  { label: 'LangChain', color: 'bg-yellow-900/40 text-yellow-300 border-yellow-800' },
  { label: 'OpenAI GPT-4o', color: 'bg-purple-900/40 text-purple-300 border-purple-800' },
  { label: 'ChromaDB', color: 'bg-orange-900/40 text-orange-300 border-orange-800' },
  { label: 'PostgreSQL', color: 'bg-sky-900/40 text-sky-300 border-sky-800' },
  { label: 'React 18', color: 'bg-cyan-900/40 text-cyan-300 border-cyan-800' },
  { label: 'Docker', color: 'bg-blue-900/40 text-blue-300 border-blue-800' },
]

const USE_CASES = [
  { icon: BookOpen, title: 'Research Papers', desc: 'Ask deep questions across multiple academic papers and get cited answers.' },
  { icon: Shield, title: 'Legal Documents', desc: 'Query contracts and policies — every answer points to the exact clause.' },
  { icon: FileText, title: 'Technical Docs', desc: 'Navigate massive manuals or codebases with pinpoint semantic search.' },
  { icon: Zap, title: 'Financial Reports', desc: 'Instantly surface key figures from earnings calls and 10-K filings.' },
]

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="min-h-full bg-bg text-white">
      {/* Nav */}
      <nav className="border-b border-border px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-purple-600 rounded-lg flex items-center justify-center">
            <Cpu size={14} className="text-white" />
          </div>
          <span className="font-semibold text-white tracking-tight">DocuMind</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/how-it-works')} className="text-gray-400 hover:text-white text-sm transition-colors">
            How it works
          </button>
          <button onClick={() => navigate('/chat')} className="btn-primary text-sm py-2 px-4">
            Try it free
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-purple-900/30 border border-purple-800/50 rounded-full px-4 py-1.5 mb-8">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse-slow" />
          <span className="text-purple-300 text-xs font-medium tracking-wide uppercase">RAG-powered · GPT-4o · Cited answers</span>
        </div>

        <h1 className="text-6xl font-bold tracking-tight leading-tight mb-6">
          Chat with your{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600">
            documents
          </span>
          .
          <br />
          Get cited answers.
        </h1>

        <p className="text-gray-400 text-xl max-w-2xl mx-auto leading-relaxed mb-10">
          Upload PDFs or DOCX files. Ask anything. Every answer includes exact source citations
          so you always know where the information came from.
        </p>

        <div className="flex items-center justify-center gap-4">
          <button onClick={() => navigate('/chat')} className="btn-primary flex items-center gap-2 text-base px-7 py-3">
            Start chatting <ArrowRight size={16} />
          </button>
          <button onClick={() => navigate('/how-it-works')} className="btn-ghost text-base px-7 py-3">
            See how it works
          </button>
        </div>

        {/* Demo chat mockup */}
        <div className="mt-16 card text-left max-w-2xl mx-auto shadow-2xl shadow-purple-950/30">
          <div className="flex items-center gap-1.5 mb-4">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
            <span className="ml-3 text-gray-500 text-xs font-mono">documind · chat</span>
          </div>

          <div className="space-y-3">
            <div className="flex justify-end">
              <div className="bg-purple-600/20 border border-purple-600/30 rounded-xl rounded-tr-sm px-4 py-2.5 text-sm text-purple-100 max-w-xs">
                What are the key risks mentioned in the annual report?
              </div>
            </div>
            <div className="flex justify-start">
              <div className="bg-surface border border-border rounded-xl rounded-tl-sm px-4 py-3 text-sm text-gray-200 max-w-sm">
                The report identifies three primary risks: supply chain disruptions
                <span className="inline-block ml-1 text-xs bg-purple-900/50 text-purple-300 border border-purple-800/60 rounded px-1.5 py-0.5">Page 12 · report.pdf</span>,
                regulatory changes in the EU market
                <span className="inline-block ml-1 text-xs bg-purple-900/50 text-purple-300 border border-purple-800/60 rounded px-1.5 py-0.5">Page 34 · report.pdf</span>,
                and increased competition from Asian manufacturers
                <span className="inline-block ml-1 text-xs bg-purple-900/50 text-purple-300 border border-purple-800/60 rounded px-1.5 py-0.5">Page 41 · report.pdf</span>.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-semibold text-center mb-10 text-white">Built for every type of document</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {USE_CASES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card hover:border-purple-800/60 transition-colors">
              <div className="w-9 h-9 bg-purple-900/40 rounded-lg flex items-center justify-center mb-3">
                <Icon size={16} className="text-purple-400" />
              </div>
              <h3 className="font-medium text-white mb-1.5 text-sm">{title}</h3>
              <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* RAG pipeline visual */}
      <section className="max-w-5xl mx-auto px-6 py-8 mb-8">
        <div className="card border-purple-800/30">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-4 font-mono">Pipeline</p>
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { icon: FileText, label: 'PDF / DOCX' },
              { label: '→' },
              { icon: Database, label: 'Chunk & Embed' },
              { label: '→' },
              { icon: Database, label: 'ChromaDB' },
              { label: '→' },
              { icon: Cpu, label: 'GPT-4o' },
              { label: '→' },
              { icon: MessageSquare, label: 'Cited Answer' },
            ].map((step, i) =>
              step.label === '→' ? (
                <span key={i} className="text-gray-600 text-lg">→</span>
              ) : (
                <div key={i} className="flex items-center gap-1.5 bg-bg border border-border rounded-lg px-3 py-2">
                  {step.icon && <step.icon size={13} className="text-purple-400" />}
                  <span className="text-xs text-gray-300 font-mono">{step.label}</span>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* Tech badges */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <p className="text-xs text-gray-500 text-center mb-4 uppercase tracking-widest font-mono">Built with</p>
        <div className="flex flex-wrap justify-center gap-2">
          {TECH_BADGES.map(({ label, color }) => (
            <span key={label} className={`border text-xs font-mono px-3 py-1 rounded-full ${color}`}>
              {label}
            </span>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-gray-600 text-sm">
        DocuMind · BTech Placement Project · Built with RAG + GPT-4o
      </footer>
    </div>
  )
}
