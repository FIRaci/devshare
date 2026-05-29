import React, { useState, useRef } from 'react'
import { Image as ImageIcon, Video, Link as LinkIcon, FileText, Bold, Italic, Code, Hash, Quote, List, Minus, Eye, Send, X } from 'lucide-react'
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
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkInput, setLinkInput] = useState('')
  const [uploadingIdx, setUploadingIdx] = useState(-1)
  const [submitting, setSubmitting] = useState(false)
  const textareaRef = useRef(null)
  const imageRef = useRef(null)
  const videoRef = useRef(null)
  const fileRef = useRef(null)

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
      if (att) {
        setAttachments(prev => [...prev, att])
      }
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

  const removeAttachment = (idx) => {
    setAttachments(prev => prev.filter((_, i) => i !== idx))
  }

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
    try {
      await onSubmit(content.trim(), attachments)
    } catch {
      toast.error('Failed to submit')
    }
    setSubmitting(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="comment-composer">
      {/* Markdown toolbar */}
      <div className="md-toolbar" style={{ marginBottom: 0, borderBottom: 0 }}>
        <button type="button" className="md-tool" title="Bold" onClick={e => toolbar('**', '**', 'bold text', e)}><Bold size={13}/></button>
        <button type="button" className="md-tool" title="Italic" onClick={e => toolbar('*', '*', 'italic text', e)}><Italic size={13}/></button>
        <button type="button" className="md-tool" title="Inline code" onClick={e => toolbar('`', '`', 'code', e)}><Code size={13}/></button>
        <button type="button" className="md-tool" title="Code block" onClick={e => toolbar('```\n', '\n```', 'code here', e)}><span style={{fontSize:10, fontFamily:'monospace'}}>{'<>'}</span></button>
        <div className="md-tool-sep"/>
        <button type="button" className="md-tool" title="Heading" onClick={e => toolbar('## ', '', 'Heading', e)}><Hash size={13}/></button>
        <button type="button" className="md-tool" title="Quote" onClick={e => toolbar('> ', '', 'quote', e)}><Quote size={13}/></button>
        <button type="button" className="md-tool" title="List" onClick={e => toolbar('- ', '', 'item', e)}><List size={13}/></button>
        <button type="button" className="md-tool" title="Divider" onClick={e => toolbar('\n---\n', '', '', e)}><Minus size={13}/></button>
        <div className="md-tool-sep"/>
        <button type="button" className={`md-tool ${preview ? 'active' : ''}`} title="Toggle preview" onClick={() => setPreview(p => !p)}><Eye size={13}/></button>
      </div>

      {preview ? (
        <div className="md-preview-area" style={{ minHeight: 80, marginBottom: 8, padding: 10, fontSize: 13 }}>
          {content ? <MarkdownRenderer content={content} /> : <span style={{ color: 'var(--text-2)', fontStyle: 'italic' }}>Nothing to preview</span>}
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          placeholder={placeholder}
          value={content}
          onChange={e => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
          className="comment-textarea"
        />
      )}

      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="att-preview-strip" style={{ marginBottom: 6 }}>
          {attachments.map((att, i) => (
            <div key={i} className="att-preview-chip">
              {(att.type === 'IMAGE' || /\.(gif|jpe?g|png|webp|svg)(\?|$)/i.test(att.url || '')) && <img src={att.url} alt="" className="att-thumb" />}
              {att.type === 'VIDEO' && <video src={att.url} className="att-thumb" muted />}
              {att.type !== 'IMAGE' && att.type !== 'VIDEO' && (
                <div className="att-chip-icon">{att.type === 'LINK' ? <LinkIcon size={14}/> : <FileText size={14}/>}</div>
              )}
              <span className="att-chip-name">{att.name?.split('/').pop()?.slice(0, 24) || att.type}</span>
              <button className="att-chip-remove" onClick={() => removeAttachment(i)}><X size={12}/></button>
            </div>
          ))}
        </div>
      )}

      {/* Link input */}
      {showLinkInput && (
        <div className="attach-link-row" style={{ marginBottom: 6 }}>
          <input type="url" placeholder="https://..." value={linkInput} onChange={e => setLinkInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addLink() } if (e.key === 'Escape') setShowLinkInput(false) }} autoFocus />
          <button type="button" className="btn-post" onClick={addLink} style={{ padding: '6px 12px', fontSize: 12 }}>Add</button>
          <button type="button" className="btn-outline" onClick={() => setShowLinkInput(false)} style={{ padding: '6px 10px' }}><X size={13}/></button>
        </div>
      )}

      {/* Attach bar */}
      <div className="post-attach-bar" style={{ marginBottom: 8 }}>
        <label className="attach-btn" title="Add images">
          <ImageIcon size={14}/><span>Image</span>
          <input ref={imageRef} type="file" accept="image/*" hidden multiple onChange={e => handleFiles(e.target.files, 'IMAGE')} />
        </label>
        <label className="attach-btn" title="Add videos">
          <Video size={14}/><span>Video</span>
          <input ref={videoRef} type="file" accept="video/*" hidden multiple onChange={e => handleFiles(e.target.files, 'VIDEO')} />
        </label>
        <label className="attach-btn" title="Add files">
          <FileText size={14}/><span>File</span>
          <input ref={fileRef} type="file" hidden multiple onChange={e => handleFiles(e.target.files, 'FILE')} />
        </label>
        <button type="button" className="attach-btn" onClick={() => setShowLinkInput(s => !s)} title="Add link">
          <LinkIcon size={14}/><span>Link</span>
        </button>
        {uploadingIdx >= 0 && <span style={{ color: 'var(--text-2)', fontSize: 11 }}>Uploading...</span>}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
          <span className="char-count">{content.length} chars</span>
          {onCancel && <button type="button" className="btn-cancel" onClick={onCancel} style={{ padding: '5px 10px', fontSize: 12 }}>Cancel</button>}
          <button className="btn-post" disabled={isSubmitting || !content.trim()} onClick={handleSubmit} style={{ padding: '5px 12px', fontSize: 12 }}>
            <Send size={12}/>{isSubmitting ? '…' : submitLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
