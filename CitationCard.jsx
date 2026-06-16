import { BookOpen } from 'lucide-react'

/**
 * Renders a purple citation badge.
 * Props:
 *   filename  – source file name
 *   page      – page number
 *   onClick   – optional click handler
 */
export default function CitationCard({ filename, page, onClick }) {
  return (
    <button
      onClick={onClick}
      title={`${filename} · Page ${page}`}
      className="
        inline-flex items-center gap-1.5
        bg-purple-900/30 hover:bg-purple-900/50
        border border-purple-800/50 hover:border-purple-600
        text-purple-300 hover:text-purple-200
        rounded-md px-2 py-0.5
        text-xs font-mono
        transition-all duration-150
        cursor-pointer
        select-none
      "
    >
      <BookOpen size={10} />
      <span>Page {page}</span>
      <span className="text-purple-500">·</span>
      <span className="max-w-[120px] truncate">{filename}</span>
    </button>
  )
}
