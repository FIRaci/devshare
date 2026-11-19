import React, { useState, useRef } from 'react'
import { Image as ImageIcon, Video, Link as LinkIcon, FileText, X } from 'lucide-react'

export const AttachmentThumb = React.memo(function AttachmentThumb({ att, i, onRemove }) {
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

export const PostAttachmentSection = React.memo(function PostAttachmentSection({
  attachments = [],
  onAddAttachment,
  onRemoveAttachment,
  uploadFile
}) {
  const [linkInput, setLinkInput] = useState('')
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [uploadingIdx, setUploadingIdx] = useState(-1)
  const imageRef = useRef(null)
  const videoRef = useRef(null)
  const fileRef = useRef(null)

  const handleFiles = async (files, type) => {
    for (const file of Array.from(files)) {
      setUploadingIdx(attachments.length)
      const att = await uploadFile(file, type)
      if (att) {
        onAddAttachment(att)
      }
      setUploadingIdx(-1)
    }
  }

  const addLink = () => {
    if (!linkInput.trim()) return
    let url = linkInput.trim()
    if (!url.startsWith('http')) url = 'https://' + url
    onAddAttachment({ type: 'LINK', url, name: url })
    setLinkInput('')
    setShowLinkInput(false)
  }

  return (
    <div className="post-attachments-wrapper">
      {attachments.length > 0 && (
        <div className="att-preview-strip">
          {attachments.map((att, i) => (
            <AttachmentThumb key={i} att={att} i={i} onRemove={onRemoveAttachment} />
          ))}
        </div>
      )}

      {showLinkInput && (
        <div className="attach-link-row">
          <input
            type="url"
            placeholder="https://..."
            value={linkInput}
            onChange={e => setLinkInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); addLink() }
              if (e.key === 'Escape') setShowLinkInput(false)
            }}
            autoFocus
          />
          <button type="button" className="btn-post" onClick={addLink} style={{ padding: '8px 14px' }}>Add</button>
          <button type="button" className="btn-outline" onClick={() => setShowLinkInput(false)} style={{ padding: '8px 12px' }}><X size={14}/></button>
        </div>
      )}

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
    </div>
  )
})
