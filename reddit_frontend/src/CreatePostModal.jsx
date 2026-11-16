import React, { useState, useRef, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Image as ImageIcon, Video, Link as LinkIcon, FileText, Bold, Italic, Code, Hash, Quote, List, Minus, Eye, Code2, Compass } from 'lucide-react'
import toast from 'react-hot-toast'
import MarkdownRenderer from './MarkdownRenderer'
import CodeInsertModal from './code-insert-modal'
import { getToken } from './api'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const bearer = () => getToken() ? { Authorization: `Bearer ${getToken()}` } : {}
const bearerJson = () => getToken() ? { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }

// Markdown toolbar helper
function insertAtCursor(textarea, before, after = '', defaultText = '') {
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selected = textarea.value.slice(start, end) || defaultText
  const newText = textarea.value.slice(0, start) + before + selected + after + textarea.value.slice(end)
  return { value: newText, cursor: start + before.length + selected.length + after.length }
}

const AttachmentThumb = React.memo(function AttachmentThumb({ att, i, onRemove }) {
  const isImage = att.type === 'IMAGE'
  const isVideo = att.type === 'VIDEO'
  return (
    <div className="att-preview-chip">
      {isImage && <img src={att.url} alt="" className="att-thumb" />}
      {isVideo && <video src={att.url} className="att-thumb" muted />}
      {!isImage && !isVideo && (
        <div className="att-chip-icon">{att.type === 'LINK' ? <LinkIcon size={14}/> : <FileText size={14}/>}</div>
      )}
      <span className="att-chip-name">{att.name?.split('/').pop()?.slice(0, 24) || att.type}</span>
      <button type="button" className="att-chip-remove" onClick={() => onRemove(i)}><X size={12}/></button>
    </div>
  )
})

const CreatePostModal = React.memo(function CreatePostModal({ subreddits = [], joinedSubs = new Set(), user, onClose, onSuccess, onExploreRedirect, initialPost = null }) {
  const isEdit = Boolean(initialPost)
  const [newPost, setNewPost] = useState({ title: '', content: '', subredditId: '' })
  const [attachments, setAttachments] = useState([]) // [{type, url, name, size, linkPreview?}]
  const [attachmentsTouched, setAttachmentsTouched] = useState(false)
  const [linkInput, setLinkInput] = useState('')
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingIdx, setUploadingIdx] = useState(-1)
  const [preview, setPreview] = useState(false)
  const [showCodeModal, setShowCodeModal] = useState(false)
  const textareaRef = useRef(null)
  const imageRef = useRef(null)
  const videoRef = useRef(null)
  const fileRef = useRef(null)

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
        setAttachmentsTouched(true)
      }
      setUploadingIdx(-1)
    }
  }

  const addLink = () => {
    if (!linkInput.trim()) return
    let url = linkInput.trim()
    if (!url.startsWith('http')) url = 'https://' + url
    setAttachments(prev => [...prev, { type: 'LINK', url, name: url }])
    setAttachmentsTouched(true)
    setLinkInput('')
    setShowLinkInput(false)
  }

  const removeAttachment = (idx) => {
    setAttachments(prev => prev.filter((_, i) => i !== idx))
    setAttachmentsTouched(true)
  }

  const getInitialAttachments = (post) => {
    if (post?.attachments && Array.isArray(post.attachments)) return post.attachments
    if (post?.mediaUrl) {
      return [{
        type: post.mediaType || 'IMAGE',
        url: post.mediaUrl,
        name: post.mediaUrl.split('/').pop() || ''
      }]
    }
    return []
  }

  // Reset/adjust state in the render phase when initialPost changes
  const [prevInitialPost, setPrevInitialPost] = useState(initialPost)
  if (initialPost !== prevInitialPost) {
    if (initialPost) {
      setNewPost({
        title: initialPost.title || '',
        content: initialPost.content || '',
        subredditId: initialPost.subredditId || initialPost.subreddit?.id || ''
      })
      setAttachments(getInitialAttachments(initialPost))
      setAttachmentsTouched(false)
      setPreview(false)
    } else {
      setNewPost({ title: '', content: '', subredditId: '' })
      setAttachments([])
      setAttachmentsTouched(false)
      setPreview(false)
    }
    setPrevInitialPost(initialPost)
  }

  const toolbar = (before, after, defaultText, e) => {
    e.preventDefault()
    const ta = textareaRef.current
    if (!ta) return
    const { value, cursor } = insertAtCursor(ta, before, after, defaultText)
    setNewPost(p => ({ ...p, content: value }))
    setTimeout(() => { ta.focus(); ta.setSelectionRange(cursor, cursor) }, 0)
  }

  const handleInsertCodeSnippet = (formattedCode) => {
    const ta = textareaRef.current
    if (!ta) {
      setNewPost(p => ({ ...p, content: (p.content || '') + formattedCode }))
      return
    }
    const { value, cursor } = insertAtCursor(ta, formattedCode, '', '')
    setNewPost(p => ({ ...p, content: value }))
    setTimeout(() => { ta.focus(); ta.setSelectionRange(cursor, cursor) }, 0)
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!newPost.title.trim() || !newPost.subredditId) return
    setSubmitting(true)
    const tId = toast.loading(isEdit ? 'Saving...' : 'Posting...')
    try {
      const payload = {
        title: newPost.title,
        content: newPost.content,
        subredditId: newPost.subredditId,
        ...(isEdit
          ? { ...(attachmentsTouched ? { attachments } : {}) }
          : { attachments: attachments.length ? attachments : undefined }
        )
      }

      const res = await fetch(`${API}/posts${isEdit ? `/${initialPost.id}` : ''}`, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: bearerJson(),
        body: JSON.stringify(payload)
      })
      const d = await res.json()
      if (!res.ok) { toast.error(d.error || 'Failed', { id: tId }); return }
      toast.success(isEdit ? 'Post updated!' : 'Post created!', { id: tId })
      onSuccess?.(d)
      onClose()
    } catch { toast.error('Failed to connect', { id: tId }) }
    finally { setSubmitting(false) }
  }

  const availableSubreddits = useMemo(() => {
    return subreddits.filter(s => joinedSubs.has(s.name))
  }, [subreddits, joinedSubs])

  return (
    <motion.div
      className="modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
      onClick={onClose}
    >
      <motion.div
        className="modal modal-wide"
        initial={{ scale: 0.96, opacity: 0, y: 6 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 6 }}
        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-head">
          <h3>{isEdit ? 'Edit Post' : 'Create Post'}</h3>
          <button type="button" onClick={onClose}><X size={18}/></button>
        </div>

        {availableSubreddits.length === 0 ? (
          <div className="modal-body" style={{ textAlign: 'center', padding: '36px 20px' }}>
            <div style={{ fontSize: 42, marginBottom: 14 }}>🚀</div>
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Join a Community First</h3>
            <p style={{ color: 'var(--text-2)', fontSize: 13, lineHeight: 1.6, maxWidth: 440, margin: '0 auto 20px' }}>
              On DevShare, you must be a member of a community before you can publish posts in it. Explore developer communities to join!
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button type="button" className="btn-outline" onClick={onClose}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-post"
                onClick={() => {
                  onClose()
                  onExploreRedirect?.()
                }}
              >
                <Compass size={15} style={{ marginRight: 5 }} /> Explore Communities
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="modal-body">
            {/* Community select */}
            <select
              value={newPost.subredditId}
              onChange={e => setNewPost(p => ({ ...p, subredditId: e.target.value }))}
              required
            >
              <option value="">Choose a community you've joined *</option>
              {availableSubreddits.map(s => (
                <option key={s.id} value={s.id}>
                  d/{s.name} ✓ (Joined)
                </option>
              ))}
            </select>

            {/* Title */}
            <input
              type="text"
              placeholder="Title *"
              value={newPost.title}
              onChange={e => setNewPost(p => ({ ...p, title: e.target.value }))}
              required
              maxLength={300}
            />
          <small style={{ color: 'var(--text-2)', textAlign: 'right', display: 'block', marginTop: -6, marginBottom: 4 }}>{newPost.title.length}/300</small>

          {/* Markdown toolbar */}
          <div className="md-toolbar">
            <button type="button" className="md-tool" title="Bold (**text**)" onClick={e => toolbar('**', '**', 'bold text', e)}><Bold size={14}/></button>
            <button type="button" className="md-tool" title="Italic (*text*)" onClick={e => toolbar('*', '*', 'italic text', e)}><Italic size={14}/></button>
            <button type="button" className="md-tool" title="Inline code (`code`)" onClick={e => toolbar('`', '`', 'code', e)}><Code size={14}/></button>
            <button type="button" className="md-tool md-tool-code" title="Insert Code Block / Jupyter Notebook" onClick={e => { e.preventDefault(); setShowCodeModal(true) }}>
              <Code2 size={14} color="var(--primary)"/>
              <span style={{ fontSize: 11, fontWeight: 700, marginLeft: 3 }}>Code</span>
            </button>
            <div className="md-tool-sep"/>
            <button type="button" className="md-tool" title="Heading" onClick={e => toolbar('## ', '', 'Heading', e)}><Hash size={14}/></button>
            <button type="button" className="md-tool" title="Quote" onClick={e => toolbar('> ', '', 'quote', e)}><Quote size={14}/></button>
            <button type="button" className="md-tool" title="List" onClick={e => toolbar('- ', '', 'item', e)}><List size={14}/></button>
            <button type="button" className="md-tool" title="Divider" onClick={e => toolbar('\n---\n', '', '', e)}><Minus size={14}/></button>
            <div className="md-tool-sep"/>
            <button
              type="button"
              className={`md-tool ${preview ? 'active' : ''}`}
              title="Toggle preview"
              onClick={() => setPreview(p => !p)}
            ><Eye size={14}/></button>
          </div>

          {/* Content editor / preview */}
          {preview ? (
            <div className="md-preview-area">
              {newPost.content ? <MarkdownRenderer content={newPost.content} /> : <p style={{ color: 'var(--text-2)', fontStyle: 'italic' }}>Nothing to preview yet...</p>}
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              placeholder="Write your post... (Markdown supported: **bold**, *italic*, `code`, ```blocks```, # headings, > quotes, - lists)"
              value={newPost.content}
              onChange={e => setNewPost(p => ({ ...p, content: e.target.value }))}
              rows={7}
              className="md-editor"
            />
          )}

          {/* Attachments preview strip */}
          {attachments.length > 0 && (
            <div className="att-preview-strip">
              {attachments.map((att, i) => <AttachmentThumb key={i} att={att} i={i} onRemove={removeAttachment} />)}
            </div>
          )}

          {/* Link input */}
          {showLinkInput && (
            <div className="attach-link-row">
              <input
                type="url"
                placeholder="https://..."
                value={linkInput}
                onChange={e => setLinkInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addLink() } if (e.key === 'Escape') setShowLinkInput(false) }}
                autoFocus
              />
              <button type="button" className="btn-post" onClick={addLink} style={{ padding: '8px 14px' }}>Add</button>
              <button type="button" className="btn-outline" onClick={() => setShowLinkInput(false)} style={{ padding: '8px 12px' }}><X size={14}/></button>
            </div>
          )}

          {/* Attach bar */}
          <div className="post-attach-bar">
            <label className="attach-btn" title="Add images">
              <ImageIcon size={15}/><span>Image</span>
              <input ref={imageRef} type="file" accept="image/*" hidden multiple onChange={e => handleFiles(e.target.files, 'IMAGE')} />
            </label>
            <label className="attach-btn" title="Add videos">
              <Video size={15}/><span>Video</span>
              <input ref={videoRef} type="file" accept="video/*" hidden multiple onChange={e => handleFiles(e.target.files, 'VIDEO')} />
            </label>
            <label className="attach-btn" title="Add files">
              <FileText size={15}/><span>File</span>
              <input ref={fileRef} type="file" hidden multiple onChange={e => handleFiles(e.target.files, 'FILE')} />
            </label>
            <button type="button" className="attach-btn" onClick={() => setShowLinkInput(s => !s)} title="Add link">
              <LinkIcon size={15}/><span>Link</span>
            </button>
            {uploadingIdx >= 0 && <span style={{ color: 'var(--text-2)', fontSize: 12 }}>Uploading...</span>}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-post" disabled={submitting || !newPost.title.trim() || !newPost.subredditId}>
              {submitting ? (isEdit ? 'Saving...' : 'Posting...') : (isEdit ? 'Save' : 'Post')}
            </button>
          </div>
        </form>
        )}
      </motion.div>

      <CodeInsertModal
        isOpen={showCodeModal}
        onClose={() => setShowCodeModal(false)}
        onInsert={handleInsertCodeSnippet}
        initialSelectedText={textareaRef.current ? textareaRef.current.value.slice(textareaRef.current.selectionStart, textareaRef.current.selectionEnd) : ''}
      />
    </motion.div>
  )
})

export default CreatePostModal
