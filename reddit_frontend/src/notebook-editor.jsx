import React, { useState, useEffect, useRef, useCallback } from 'react'
import { BookOpen, Edit3 } from 'lucide-react'
import toast from 'react-hot-toast'
import { NotebookCellItem } from './notebook-cell-item'
import { NotebookInterAdd, NotebookBottomBar } from './notebook-add-controls'
import { parseMarkdownToBlocks, compileBlocksToMarkdown, generateBlockId } from './notebook-block-parser'
import { LANGUAGE_OPTIONS } from './code-insert-modal'
import { getToken } from './api'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export default function NotebookEditor({ value = '', onChange }) {
  const [mode, setMode] = useState('notebook')
  const [blocks, setBlocks] = useState(() => parseMarkdownToBlocks(value))
  const lastEmittedValue = useRef(value)

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

  // Automatically update template when switching language in cell
  const handleUpdateLang = useCallback((blockId, lang) => {
    const template = LANGUAGE_OPTIONS.find(l => l.id === lang)?.sample || ''
    setBlocks(prev => {
      const next = prev.map(b => b.id === blockId ? { ...b, lang, content: template } : b)
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

  const handleUpdateImage = useCallback((blockId, updates) => {
    setBlocks(prev => {
      const next = prev.map(b => b.id === blockId ? { ...b, ...updates } : b)
      const compiled = compileBlocksToMarkdown(next)
      lastEmittedValue.current = compiled
      onChange?.(compiled)
      return next
    })
  }, [onChange])

  const handleUploadImageFile = useCallback(async (file, blockId) => {
    const token = getToken()
    const fd = new FormData()
    fd.append('file', file)
    const tId = toast.loading('Uploading image...')
    try {
      const res = await fetch(`${API}/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Upload failed')
      toast.success('Image uploaded!', { id: tId })
      handleUpdateImage(blockId, { url: d.url })
    } catch (err) {
      toast.error(err.message || 'Upload failed', { id: tId })
    }
  }, [handleUpdateImage])

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
      content: defaultSample,
      url: type === 'image' ? '' : undefined,
      caption: type === 'image' ? '' : undefined
    }
    const next = [...blocks]
    next.splice(index, 0, newBlock)
    notifyChange(next)
  }

  const textCount = blocks.filter(b => b.type === 'text').length
  const codeCount = blocks.filter(b => b.type === 'code').length
  const imageCount = blocks.filter(b => b.type === 'image').length

  return (
    <div className="notebook-editor-container">
      {/* View Switcher Header */}
      <div className="notebook-toolbar-header">
        <div className="notebook-mode-pills">
          <button
            type="button"
            className={`notebook-mode-btn ${mode === 'notebook' ? 'active' : ''}`}
            onClick={() => { setBlocks(parseMarkdownToBlocks(value)); setMode('notebook') }}
          >
            <BookOpen size={14} />
            <span>Notebook Cells</span>
          </button>
          <button
            type="button"
            className={`notebook-mode-btn ${mode === 'raw' ? 'active' : ''}`}
            onClick={() => setMode('raw')}
          >
            <Edit3 size={14} />
            <span>Raw Markdown</span>
          </button>
        </div>

        <div className="notebook-stats">
          <span>{textCount} Text</span>
          <span className="notebook-stats-dot">•</span>
          <span>{codeCount} Code</span>
          <span className="notebook-stats-dot">•</span>
          <span>{imageCount} Images</span>
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
                onUpdateImage={handleUpdateImage}
                onUploadImageFile={handleUploadImageFile}
                onMoveBlock={handleMoveBlock}
                onRemoveBlock={handleRemoveBlock}
              />

              <NotebookInterAdd onAdd={(type, lang) => handleAddBlock(idx + 1, type, lang)} />
            </React.Fragment>
          ))}

          <NotebookBottomBar onAdd={(type, lang) => handleAddBlock(blocks.length, type, lang)} />
        </div>
      )}
    </div>
  )
}
