import React, { useState, useEffect, useRef, useCallback } from 'react'
import toast from 'react-hot-toast'
import { NotebookCellItem } from './notebook-cell-item'
import { NotebookInterAdd, NotebookBottomBar } from './notebook-add-controls'
import { NotebookViewTabs } from './notebook-view-tabs'
import { parseMarkdownToBlocks, compileBlocksToMarkdown, generateBlockId } from './notebook-block-parser'
import { getLanguageOption } from './language-options'
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

  const handleUpdateContent = useCallback((blockId, content) => {
    setBlocks(prev => {
      const next = prev.map(b => b.id === blockId ? { ...b, content } : b)
      const compiled = compileBlocksToMarkdown(next)
      lastEmittedValue.current = compiled
      queueMicrotask(() => onChange?.(compiled))
      return next
    })
  }, [onChange])

  const handleUpdateLang = useCallback((blockId, lang, sampleCode) => {
    const template = sampleCode || getLanguageOption(lang)?.sample || ''
    setBlocks(prev => {
      const next = prev.map(b => b.id === blockId ? { ...b, lang, content: template } : b)
      const compiled = compileBlocksToMarkdown(next)
      lastEmittedValue.current = compiled
      queueMicrotask(() => onChange?.(compiled))
      return next
    })
  }, [onChange])

  const handleLoadTemplate = useCallback((blockId, sampleCode) => {
    setBlocks(prev => {
      const next = prev.map(b => b.id === blockId ? { ...b, content: sampleCode } : b)
      const compiled = compileBlocksToMarkdown(next)
      lastEmittedValue.current = compiled
      queueMicrotask(() => onChange?.(compiled))
      return next
    })
  }, [onChange])

  const handleUpdateImage = useCallback((blockId, updates) => {
    setBlocks(prev => {
      const next = prev.map(b => b.id === blockId ? { ...b, ...updates } : b)
      const compiled = compileBlocksToMarkdown(next)
      lastEmittedValue.current = compiled
      queueMicrotask(() => onChange?.(compiled))
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
      queueMicrotask(() => onChange?.(compiled))
      return next
    })
  }, [onChange])

  const handleRemoveBlock = useCallback((blockId) => {
    setBlocks(prev => {
      if (prev.length <= 1) return prev
      const next = prev.filter(b => b.id !== blockId)
      const compiled = compileBlocksToMarkdown(next)
      lastEmittedValue.current = compiled
      queueMicrotask(() => onChange?.(compiled))
      return next
    })
  }, [onChange])

  const handleAddBlock = useCallback((index, type, lang = 'python') => {
    const defaultSample = type === 'code' ? (getLanguageOption(lang)?.sample || '') : ''
    const newBlock = {
      id: generateBlockId(),
      type,
      lang: type === 'code' ? lang : undefined,
      content: defaultSample,
      url: type === 'image' ? '' : undefined,
      caption: type === 'image' ? '' : undefined
    }
    setBlocks(prev => {
      const next = [...prev]
      next.splice(index, 0, newBlock)
      const compiled = compileBlocksToMarkdown(next)
      lastEmittedValue.current = compiled
      queueMicrotask(() => onChange?.(compiled))
      return next
    })
  }, [onChange])

  const handleSwitchMode = (newMode) => {
    if (newMode === 'notebook') setBlocks(parseMarkdownToBlocks(value))
    setMode(newMode)
  }

  const textCount = blocks.filter(b => b.type === 'text').length
  const codeCount = blocks.filter(b => b.type === 'code').length
  const imageCount = blocks.filter(b => b.type === 'image').length

  return (
    <div className="notebook-editor-container">
      <NotebookViewTabs
        mode={mode}
        onSwitchMode={handleSwitchMode}
        textCount={textCount}
        codeCount={codeCount}
        imageCount={imageCount}
      />

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
                onAddBlockAfter={(pos) => handleAddBlock(pos + 1, 'code')}
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
