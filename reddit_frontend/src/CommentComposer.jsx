import React, { useState, useRef, useEffect } from 'react'
import { Image as ImageIcon, Video, Link as LinkIcon, FileText, Bold, Italic, Code, Hash, Quote, List, Minus, Eye, Send, X, Paperclip } from 'lucide-react'
import toast from 'react-hot-toast'
import MarkdownRenderer from './MarkdownRenderer'
import { getToken } from './api'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const bearer = () => getToken() ? { Authorization: `Bearer ${getToken()}` } : {}

function insertAtCursor(textarea, before, after = '', defaultText = '') {
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selected = textarea.value.slice(start, end) || defaultText
  const newText = textarea.value.slice(0, start) + before + selected + after + textarea.value.slice(end)
  return { value: newText, cursor: start + before.length + selected.length + after.length }
}

export default function CommentComposer({ onSubmit, onCancel, placeholder = 'Share your thoughts…', initialContent = '', initialAttachments = [], submitLabel = 'Comment', submitting: externalSubmitting }) {
  const [content, setContent] = useState(initialContent)
  const [attachments, setAttachments] = useState(initialAttachments)
  const [preview, setPreview] = useState(false)
  const [expanded, setExpanded] = useState(!!initialContent)
  const [showToolbar, setShowToolbar] = useState(false)
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkInput, setLinkInput] = useState('')
  const [uploadingIdx, setUploadingIdx] = useState(-1)
  const [submitting, setSubmitting] = useState(false)
  const textareaRef = useRef(null)
  const imageRef = useRef(null)
  const videoRef = useRef(null)
  const fileRef = useRef(null)
  const composerRef = useRef(null)

  const isSubmitting = externalSubmitting ?? submitting

  const uploadFile = async (file, type) => {
    const fd = new FormData(); fd.append('file', file)
    const tId = toast.loading('Uploading...')
    try {
      const r = await fetch(`${API}/upload`, { method: 'POST', headers: bearer(), body: fd })
      const d = await r.json()
      if (!r.ok) throw new Error()
      toast.success('Uploaded!', { id: tId })
      return { type, url: d.url, name: file.name, size: file.size }
    } catch {
      toast.error('Upload failed', { id: tId })
      return null
    }
  }

  const handleFiles = async (files, type) => {
    for (const file of Array.from(files)) {
      setUploadingIdx(attachments.length)
      const att = await uploadFile(file, type)
      if (att) setAttachments(prev => [...prev, att])
      setUploadingIdx(-1)
    }
  }

  const addLink = () => {
    if (!linkInput.trim()) return
    let url = linkInput.trim()
    if (!url.startsWith('http')) url = 'https://' + url
    setAttachments(prev => [...prev, { type: 'LINK', url, name: url }])
    setLinkInput(''); setShowLinkInput(false)
  }

  const removeAttachment = (idx) => setAttachments(prev => prev.filter((_, i) => i !== idx))

  const toolbar = (before, after, defaultText, e) => {
    e.preventDefault()
    const ta = textareaRef.current
    if (!ta) return
    const { value, cursor } = insertAtCursor(ta, before, after, defaultText)
    setContent(value)
    setTimeout(() => { ta.focus(); ta.setSelectionRange(cursor, cursor) }, 0)
  }

  const handleSubmit = async () => {
    if (!content.trim()) return
    setSubmitting(true)
    try { await onSubmit(content.trim(), attachments) } catch { toast.error('Failed to submit') }
    setSubmitting(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleSubmit() }
    if (e.key === 'Escape' && expanded && !content && !attachments.length) { setExpanded(false); setShowToolbar(false) }
  }

  const handleFocus = () => setExpanded(true)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (composerRef.current && !composerRef.current.contains(e.target)) {
        if (!content && !attachments.length && !initialContent) { setExpanded(false); setShowToolbar(false) }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [content, attachments, initialContent])

  useEffect(() => {
    if (expanded && textareaRef.current) textareaRef.current.focus()
  }, [expanded])

  const hasContent = content.trim().length > 0 || attachments.length > 0

  if (!expanded) {
    return (
      <div className="comment-composer collapsed" ref={composerRef}>
        <div className="comment-composer-bar" onClick={() => setExpanded(true)}>
          <div className="comment-composer-avatar" />
          <span className="comment-composer-placeholder">{placeholder}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="comment-composer expanded" ref={composerRef}>
      {showToolbar && (
        <div className="md-toolbar comment-md-toolbar">
          <button type="button" className="md-tool" title="Bold" onClick={e => toolbar('**', '**', 'bold text', e)}><Bold size={13}/></button>
          <button type="button" className="md-tool" title="Italic" onClick={e => toolbar('*', '*', 'italic text', e)}><Italic size={13}/></button>
          <button type="button" className="md-tool" title="Code" onClick={e => toolbar('`', '`', 'code', e)}><Code size={13}/></button>
          <div className="md-tool-sep"/>
          <button type="button" className="md-tool" title="Heading" onClick={e => toolbar('## ', '', 'Heading', e)}><Hash size={13}/></button>
          <button type="button" className="md-tool" title="Quote" onClick={e => toolbar('> ', '', 'quote', e)}><Quote size={13}/></button>
          <button type="button" className="md-tool" title="List" onClick={e => toolbar('- ', '', 'item', e)}><List size={13}/></button>
          <button type="button" className="md-tool" title="Divider" onClick={e => toolbar('\n---\n', '', '', e)}><Minus size={13}/></button>
          <div className="md-tool-sep"/>
          <button type="button" className={`md-tool ${preview ? 'active' : ''}`} title="Preview" onClick={() => setPreview(p => !p)}><Eye size={13}/></button>
        </div>
      )}

      {preview ? (
        <div className="comment-preview-area">
          {content ? <MarkdownRenderer content={content} /> : <span className="comment-preview-empty">Nothing to preview</span>}
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          placeholder={placeholder}
          value={content}
          onChange={e => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          rows={3}
          className="comment-textarea"
        />
      )}

      {attachments.length > 0 && (
        <div className="comment-attachments">
          {attachments.map((att, i) => (
            <div key={i} className="comment-att-chip">
              {(att.type === 'IMAGE' || /\.(gif|jpe?g|png|webp|svg)(\?|$)/i.test(att.url || '')) && <img src={att.url} alt="" className="comment-att-thumb" />}
              {att.type === 'VIDEO' && <video src={att.url} className="comment-att-thumb" muted />}
              {att.type !== 'IMAGE' && att.type !== 'VIDEO' && (
                <div className="comment-att-icon">{att.type === 'LINK' ? <LinkIcon size={12}/> : <FileText size={12}/>}</div>
              )}
              <span className="comment-att-name">{att.name?.split('/').pop()?.slice(0, 20) || att.type}</span>
              <button className="comment-att-remove" onClick={() => removeAttachment(i)}><X size={11}/></button>
            </div>
          ))}
        </div>
      )}

      {showLinkInput && (
        <div className="comment-link-row">
          <input type="url" placeholder="Paste a link..." value={linkInput} onChange={e => setLinkInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addLink() } if (e.key === 'Escape') setShowLinkInput(false) }} autoFocus />
          <button type="button" className="comment-link-add" onClick={addLink}>Add</button>
          <button type="button" className="comment-link-cancel" onClick={() => setShowLinkInput(false)}><X size={13}/></button>
        </div>
      )}

      <div className="comment-composer-actions">
        <div className="comment-composer-tools">
          <button type="button" className={`comment-tool-btn ${showToolbar ? 'active' : ''}`} title="Formatting" onClick={() => setShowToolbar(v => !v)}>
            <Bold size={14}/><span className="comment-tool-label">B</span>
          </button>
          <button type="button" className="comment-tool-btn" title="Attach image" onClick={() => imageRef.current?.click()}>
            <ImageIcon size={14}/>
          </button>
          <button type="button" className="comment-tool-btn" title="Attach video" onClick={() => videoRef.current?.click()}>
            <Video size={14}/>
          </button>
          <button type="button" className="comment-tool-btn" title="Attach file" onClick={() => fileRef.current?.click()}>
            <Paperclip size={14}/>
          </button>
          <button type="button" className="comment-tool-btn" title="Add link" onClick={() => setShowLinkInput(v => !v)}>
            <LinkIcon size={14}/>
          </button>
          <input ref={imageRef} type="file" accept="image/*" hidden multiple onChange={e => handleFiles(e.target.files, 'IMAGE')} />
          <input ref={videoRef} type="file" accept="video/*" hidden multiple onChange={e => handleFiles(e.target.files, 'VIDEO')} />
          <input ref={fileRef} type="file" hidden multiple onChange={e => handleFiles(e.target.files, 'FILE')} />
          {uploadingIdx >= 0 && <span className="comment-uploading">Uploading...</span>}
        </div>
        <div className="comment-composer-submit">
          {onCancel && <button type="button" className="comment-cancel-btn" onClick={onCancel}>Cancel</button>}
          <span className="char-count">{content.length}</span>
          <button className="comment-submit-btn" disabled={isSubmitting || !hasContent} onClick={handleSubmit}>
            <Send size={13}/>{isSubmitting ? '…' : submitLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
