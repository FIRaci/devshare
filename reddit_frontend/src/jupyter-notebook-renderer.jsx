import React, { useState, useMemo } from 'react'
import HighlightedLine from './code-syntax-highlighter'
import { Check, Copy, Terminal, Play, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'

// Parse raw content into Jupyter cells (supports JSON ipynb or commented Python notebook)
function parseNotebookContent(rawContent) {
  if (!rawContent || typeof rawContent !== 'string') return []

  const trimmed = rawContent.trim()

  // 1. Try parsing as direct .ipynb JSON
  if (trimmed.startsWith('{') && trimmed.includes('"cells"')) {
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed.cells)) {
        return parsed.cells.map((cell, idx) => {
          const source = Array.isArray(cell.source) ? cell.source.join('') : (cell.source || '')
          let outputText = ''
          if (Array.isArray(cell.outputs)) {
            outputText = cell.outputs.map(out => {
              if (out.text) return Array.isArray(out.text) ? out.text.join('') : out.text
              if (out.data?.['text/plain']) {
                const plain = out.data['text/plain']
                return Array.isArray(plain) ? plain.join('') : plain
              }
              return ''
            }).filter(Boolean).join('\n')
          }
          return {
            type: cell.cell_type === 'markdown' ? 'markdown' : 'code',
            execCount: cell.execution_count ?? idx + 1,
            code: source,
            output: outputText
          }
        })
      }
    } catch {
      // Not valid JSON, proceed to text parser
    }
  }

  // 2. Parse text containing # In [x] / # Out [x] or --- output ---
  const lines = rawContent.split('\n')
  const cells = []
  let currentCell = null
  let currentSection = 'code' // 'code' or 'output'

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const inMatch = line.match(/^#?\s*(?:In\s*\[(\d+)\]|\[In\s*(\d+)\]):?/i)
    const outMatch = line.match(/^#?\s*(?:Out\s*\[(\d+)\]|\[Out\s*(\d+)\]|---+\s*output\s*---+):?/i)

    if (inMatch) {
      if (currentCell) cells.push(currentCell)
      currentCell = {
        type: 'code',
        execCount: inMatch[1] || inMatch[2] || (cells.length + 1),
        codeLines: [],
        outputLines: []
      }
      currentSection = 'code'
      continue
    }

    if (outMatch) {
      if (!currentCell) {
        currentCell = {
          type: 'code',
          execCount: cells.length + 1,
          codeLines: [],
          outputLines: []
        }
      }
      currentSection = 'output'
      continue
    }

    if (!currentCell) {
      currentCell = {
        type: 'code',
        execCount: 1,
        codeLines: [],
        outputLines: []
      }
    }

    if (currentSection === 'code') {
      currentCell.codeLines.push(line)
    } else {
      currentCell.outputLines.push(line)
    }
  }

  if (currentCell) cells.push(currentCell)

  return cells.map(c => ({
    type: 'code',
    execCount: c.execCount,
    code: c.codeLines.join('\n'),
    output: c.outputLines.join('\n').trim()
  }))
}

const JupyterNotebookRenderer = React.memo(function JupyterNotebookRenderer({ content }) {
  const [copiedIdx, setCopiedIdx] = useState(null)
  const cells = useMemo(() => parseNotebookContent(content), [content])

  const copyCellCode = (text, idx) => {
    navigator.clipboard.writeText(text)
    setCopiedIdx(idx)
    toast.success('Cell code copied!')
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  if (!cells.length) return null

  return (
    <div className="jupyter-notebook">
      <div className="jupyter-header">
        <div className="jupyter-title">
          <BookOpen size={14} className="jupyter-icon" />
          <span>Jupyter Notebook ({cells.length} cells)</span>
        </div>
        <span className="jupyter-kernel-badge">Python 3 (ipykernel)</span>
      </div>

      <div className="jupyter-cells-list">
        {cells.map((cell, idx) => {
          const lines = cell.code.split('\n')
          const isCopied = copiedIdx === idx

          return (
            <div key={idx} className="jupyter-cell">
              {/* Code Input Area */}
              <div className="jupyter-input-row">
                <div className="jupyter-in-gutter">
                  <span>In [{cell.execCount}]:</span>
                </div>
                <div className="jupyter-code-box">
                  <button
                    className="jupyter-cell-copy"
                    title="Copy cell code"
                    onClick={() => copyCellCode(cell.code, idx)}
                  >
                    {isCopied ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
                  </button>
                  <pre className="jupyter-code-pre">
                    <code>
                      {lines.map((line, lIdx) => (
                        <div key={lIdx} className="jupyter-code-line">
                          <span className="jupyter-line-num">{lIdx + 1}</span>
                          <span className="jupyter-line-content">
                            <HighlightedLine line={line} lang="python" />
                          </span>
                        </div>
                      ))}
                    </code>
                  </pre>
                </div>
              </div>

              {/* Cell Output Area (if present) */}
              {cell.output && (
                <div className="jupyter-output-row">
                  <div className="jupyter-out-gutter">
                    <span>Out [{cell.execCount}]:</span>
                  </div>
                  <div className="jupyter-output-box">
                    <pre className="jupyter-output-pre">
                      <code>{cell.output}</code>
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
})

export default JupyterNotebookRenderer
