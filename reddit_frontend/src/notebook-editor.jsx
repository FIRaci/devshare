import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Plus, Code2, FileText, BookOpen, Edit3 } from 'lucide-react'
import { NotebookCellItem } from './notebook-cell-item'
import { parseMarkdownToBlocks, compileBlocksToMarkdown, generateBlockId } from './notebook-block-parser'
import { LANGUAGE_OPTIONS } from './code-insert-modal'

export default function NotebookEditor({ value = '', onChange }) {
  const [mode, setMode] = useState('notebook') // 'notebook' | 'raw'
  const [blocks, setBlocks] = useState(() => parseMarkdownToBlocks(value))
  const lastEmittedValue = useRef(value)

  // Sync external changes (e.g. initialPost or external toolbar insertions)
  useEffect(() => {
    if (value !== lastEmittedValue.current) {
      lastEmittedValue.current = value
      setBlocks(parseMarkdownToBlocks(value))
    }
  }, [value])

  const notifyChange = useCallback((updatedBlocks) => {
    setBlocks(updatedBlocks)
    const compiled = compileBlocksToMarkdown(updatedBlocks)
    lastEmittedValue.current = compiled
    onChange?.(compiled)
  }, [onChange])

  const handleUpdateContent = useCallback((blockId, content) => {
    setBlocks(prev => {
      const next = prev.map(b => b.id === blockId ? { ...b, content } : b)
      const compiled = compileBlocksToMarkdown(next)
      lastEmittedValue.current = compiled
      onChange?.(compiled)
      return next
    })
  }, [onChange])

  const handleUpdateLang = useCallback((blockId, lang) => {
    setBlocks(prev => {
      const next = prev.map(b => b.id === blockId ? { ...b, lang } : b)
      const compiled = compileBlocksToMarkdown(next)
      lastEmittedValue.current = compiled
      onChange?.(compiled)
      return next
    })
  }, [onChange])

  const handleLoadTemplate = useCallback((blockId, sampleCode) => {
    setBlocks(prev => {
      const next = prev.map(b => b.id === blockId ? { ...b, content: sampleCode } : b)
      const compiled = compileBlocksToMarkdown(next)
      lastEmittedValue.current = compiled
      onChange?.(compiled)
      return next
    })
  }, [onChange])

  const handleMoveBlock = useCallback((index, direction) => {
    setBlocks(prev => {
      const targetIndex = index + direction
      if (targetIndex < 0 || targetIndex >= prev.length) return prev
      const next = [...prev]
      const [moved] = next.splice(index, 1)
      next.splice(targetIndex, 0, moved)
      const compiled = compileBlocksToMarkdown(next)
      lastEmittedValue.current = compiled
      onChange?.(compiled)
      return next
    })
  }, [onChange])

  const handleRemoveBlock = useCallback((blockId) => {
    setBlocks(prev => {
      if (prev.length <= 1) return prev
      const next = prev.filter(b => b.id !== blockId)
      const compiled = compileBlocksToMarkdown(next)
      lastEmittedValue.current = compiled
      onChange?.(compiled)
      return next
    })
  }, [onChange])

  const handleAddBlock = (index, type, lang = 'python') => {
    const defaultSample = type === 'code'
      ? (LANGUAGE_OPTIONS.find(l => l.id === lang)?.sample || '')
      : ''
    const newBlock = {
      id: generateBlockId(),
      type,
      lang: type === 'code' ? lang : undefined,
      content: defaultSample
    }
    const next = [...blocks]
    next.splice(index, 0, newBlock)
    notifyChange(next)
  }

  const handleSwitchMode = (newMode) => {
    if (newMode === mode) return
    if (newMode === 'notebook') {
      setBlocks(parseMarkdownToBlocks(value))
    }
    setMode(newMode)
  }

  const textCount = blocks.filter(b => b.type === 'text').length
  const codeCount = blocks.filter(b => b.type === 'code').length

  return (
    <div className="notebook-editor-container">
      {/* View Switcher & Quick Meta Header */}
      <div className="notebook-toolbar-header">
        <div className="notebook-mode-pills">
          <button
            type="button"
            className={`notebook-mode-btn ${mode === 'notebook' ? 'active' : ''}`}
            onClick={() => handleSwitchMode('notebook')}
          >
            <BookOpen size={14} />
            <span>Notebook Cells</span>
          </button>
          <button
            type="button"
            className={`notebook-mode-btn ${mode === 'raw' ? 'active' : ''}`}
            onClick={() => handleSwitchMode('raw')}
          >
            <Edit3 size={14} />
            <span>Raw Markdown</span>
          </button>
        </div>

        <div className="notebook-stats">
          <span>{textCount} Text</span>
          <span className="notebook-stats-dot">•</span>
          <span>{codeCount} Code (``` fixed)</span>
        </div>
      </div>

      {mode === 'raw' ? (
        <textarea
          className="md-editor notebook-raw-textarea"
          value={value}
          onChange={e => {
            lastEmittedValue.current = e.target.value
            onChange?.(e.target.value)
          }}
          placeholder="Write raw markdown with standard ```language syntax..."
          rows={10}
        />
      ) : (
        <div className="notebook-cells-list">
          {blocks.map((block, idx) => (
            <React.Fragment key={block.id}>
              <NotebookCellItem
                block={block}
                index={idx}
                totalBlocks={blocks.length}
                onUpdateContent={handleUpdateContent}
                onUpdateLang={handleUpdateLang}
                onLoadTemplate={handleLoadTemplate}
                onMoveBlock={handleMoveBlock}
                onRemoveBlock={handleRemoveBlock}
              />

              {/* Inter-cell Add Controls */}
              <div className="notebook-inter-add">
                <button
                  type="button"
                  className="notebook-inter-btn"
                  onClick={() => handleAddBlock(idx + 1, 'text')}
                >
                  <Plus size={12} /> Add Text
                </button>
                <button
                  type="button"
                  className="notebook-inter-btn"
                  onClick={() => handleAddBlock(idx + 1, 'code')}
                >
                  <Code2 size={12} /> Add Code
                </button>
              </div>
            </React.Fragment>
          ))}

          {/* Bottom Add Bar */}
          <div className="notebook-bottom-bar">
            <span className="notebook-bottom-hint">Append new section:</span>
            <div className="notebook-bottom-actions">
              <button
                type="button"
                className="btn-notebook-add btn-notebook-add-text"
                onClick={() => handleAddBlock(blocks.length, 'text')}
              >
                <FileText size={14} />
                <span>+ Markdown Text Section</span>
              </button>
              <button
                type="button"
                className="btn-notebook-add btn-notebook-add-code"
                onClick={() => handleAddBlock(blocks.length, 'code', 'python')}
              >
                <Code2 size={14} />
                <span>+ Jupyter / Code Cell</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
