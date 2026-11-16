import React, { useState } from 'react'
import { Upload, Link as LinkIcon } from 'lucide-react'

export const NotebookImageCell = React.memo(function NotebookImageCell({
  block,
  onUpdateImage,
  onUploadImageFile
}) {
  const [urlInput, setUrlInput] = useState('')

  if (block.url) {
    return (
      <div className="notebook-image-wrapper">
        <div className="notebook-image-display">
          <img src={block.url} alt={block.caption || 'Blog image'} className="notebook-img-preview" />
          <div className="notebook-img-meta-row">
            <input
              type="text"
              className="notebook-img-caption-input"
              placeholder="Add an image caption (optional)..."
              value={block.caption || ''}
              onChange={e => onUpdateImage(block.id, { caption: e.target.value })}
            />
            <button
              type="button"
              className="notebook-cell-btn"
              onClick={() => onUpdateImage(block.id, { url: '' })}
            >
              Change Image
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="notebook-image-wrapper">
      <div className="notebook-image-picker">
        <label className="btn-notebook-upload">
          <Upload size={14} />
          <span>Upload Image File</span>
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={e => {
              if (e.target.files?.[0]) onUploadImageFile(e.target.files[0], block.id)
            }}
          />
        </label>
        <span className="notebook-or-divider">or enter direct URL</span>
        <div className="notebook-url-input-row">
          <input
            type="url"
            placeholder="https://example.com/image.png"
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault()
                if (urlInput.trim()) {
                  onUpdateImage(block.id, { url: urlInput.trim() })
                  setUrlInput('')
                }
              }
            }}
          />
          <button
            type="button"
            className="btn-post"
            style={{ padding: '6px 12px', fontSize: 12 }}
            onClick={() => {
              if (urlInput.trim()) {
                onUpdateImage(block.id, { url: urlInput.trim() })
                setUrlInput('')
              }
            }}
          >
            <LinkIcon size={12} style={{ marginRight: 4 }} /> Embed
          </button>
        </div>
      </div>
    </div>
  )
})
