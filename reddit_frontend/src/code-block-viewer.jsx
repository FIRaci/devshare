import React, { useState } from 'react'
import HighlightedLine, { normalizeLanguage } from './code-syntax-highlighter'
import JupyterNotebookRenderer from './jupyter-notebook-renderer'
import { Copy, Check, WrapText, Code2 } from 'lucide-react'
import toast from 'react-hot-toast'

const LANG_COLORS = {
  javascript: '#F7DF1E',
  typescript: '#3178C6',
  python:     '#3776AB',
  sql:        '#E38C00',
  bash:       '#4EAA25',
  html:       '#E34F26',
  css:        '#1572B6',
  json:       '#9B51E0',
  cpp:        '#00599C',
  go:         '#00ADD8',
  rust:       '#DEA584',
  java:       '#B07219',
  ipynb:      '#FF6F00'
}

export default function CodeBlockViewer({ content, lang = '' }) {
  const [copied, setCopied] = useState(false)
  const [wrap, setWrap] = useState(false)

  const normLang = normalizeLanguage(lang)

  // Route to Jupyter renderer if language is ipynb/notebook or content has jupyter markers
  const isJupyter = normLang === 'ipynb' || (
    content && (
      (content.includes('"cells"') && content.trim().startsWith('{')) ||
      /^#?\s*In\s*\[\d+\]/im.test(content)
    )
  )

  if (isJupyter) {
    return <JupyterNotebookRenderer content={content} />
  }

  const lines = (content || '').split('\n')
  const langColor = LANG_COLORS[normLang] || 'var(--primary)'
  const displayLang = (lang || 'code').toUpperCase()

  const copyCode = () => {
    navigator.clipboard.writeText(content || '')
    setCopied(true)
    toast.success('Code copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="code-block-container">
      {/* Code Header Bar */}
      <div className="code-block-header">
        <div className="code-block-meta">
          <div className="code-dots">
            <span className="dot dot-red" />
            <span className="dot dot-yellow" />
            <span className="dot dot-green" />
          </div>
          <span className="code-lang-badge" style={{ borderColor: langColor }}>
            <span className="code-lang-dot" style={{ background: langColor }} />
            {displayLang}
          </span>
          <span className="code-line-count">{lines.length} {lines.length === 1 ? 'line' : 'lines'}</span>
        </div>

        <div className="code-block-actions">
          <button
            type="button"
            className={`code-action-btn ${wrap ? 'active' : ''}`}
            title={wrap ? 'Disable word wrap' : 'Enable word wrap'}
            onClick={() => setWrap(!wrap)}
          >
            <WrapText size={13} />
            <span className="action-label">Wrap</span>
          </button>

          <button
            type="button"
            className="code-action-btn copy-btn"
            title="Copy code"
            onClick={copyCode}
          >
            {copied ? (
              <>
                <Check size={13} color="#10B981" />
                <span className="action-label" style={{ color: '#10B981' }}>Copied</span>
              </>
            ) : (
              <>
                <Copy size={13} />
                <span className="action-label">Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Body with Line Numbers */}
      <div className={`code-block-body ${wrap ? 'wrap-lines' : ''}`}>
        <pre className="code-pre">
          <code>
            {lines.map((line, idx) => (
              <div key={idx} className="code-line-row">
                <span className="code-line-num">{idx + 1}</span>
                <span className="code-line-text">
                  <HighlightedLine line={line} lang={normLang} />
                </span>
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  )
}
