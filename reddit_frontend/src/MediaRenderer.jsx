import React, { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import Lightbox from './Lightbox'
import { FileText, ExternalLink } from 'lucide-react'

function getMediaItems(post) {
  const items = []
  if (post.attachments && Array.isArray(post.attachments)) {
    post.attachments.forEach(att => items.push(att))
  }
  if (post.mediaUrl && !post.attachments?.length) {
    items.push({ type: post.mediaType || 'IMAGE', url: post.mediaUrl, name: '' })
  }
  return items
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

export default function MediaRenderer({ post, isFeed = false }) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const allItems = getMediaItems(post)
  if (!allItems.length) return null

  const lightboxItems = allItems.filter(a => a.type === 'IMAGE' || a.type === 'FILE' || /\.(gif|jpe?g|png|webp|svg)(\?|$)/i.test(a.url || ''))
  const linkItems = allItems.filter(a => a.type === 'LINK')
  const imageItems = allItems.filter(a => a.type === 'IMAGE' || /\.(gif|jpe?g|png|webp|svg|bmp)(\?|$)/i.test(a.url || ''))
  const videoItems = allItems.filter(a => a.type === 'VIDEO' || /\.(mp4|webm|mov|avi)(\?|$)/i.test(a.url || ''))
  const fileItems = allItems.filter(a => a.type === 'FILE')

  const handleImageClick = (clickedItem) => {
    const idx = lightboxItems.findIndex(i => i.url === clickedItem.url)
    setLightboxIndex(idx >= 0 ? idx : 0)
    setLightboxOpen(true)
  }

  const displayImages = imageItems.slice(0, 4)
  const gridClass = `att-image-grid count-${Math.min(displayImages.length, 4)}`

  return (
    <>
      {imageItems.length > 0 && (
        <div className={gridClass}>
          {displayImages.map((att, i) => (
            <div
              key={i}
              className={`att-image-wrap ${imageItems.length === 1 ? 'single' : ''}`}
              onClick={e => {
                if (isFeed) return
                e.stopPropagation()
                handleImageClick(att)
              }}
            >
              <img src={att.url} alt={att.name || ''} className="att-image" loading="lazy" />
              {i === 3 && imageItems.length > 4 && (
                <div className="att-overflow-badge">+{imageItems.length - 4}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {videoItems.map((att, i) => (
        <div key={i} className="att-video-wrap" onClick={e => { if (!isFeed) e.stopPropagation() }}>
          <video src={att.url} controls className="att-video" />
        </div>
      ))}

      {fileItems.length > 0 && (
        <div className="att-files-list">
          {fileItems.map((att, i) => (
            <a key={i} href={att.url} download className="file-attachment-card" onClick={e => e.stopPropagation()}>
              <FileText size={18} className="file-att-icon" />
              <div className="file-att-info">
                <span className="file-att-name">{att.name || 'File'}</span>
                {att.size && <small className="file-att-size">{formatSize(att.size)}</small>}
              </div>
            </a>
          ))}
        </div>
      )}

      {linkItems.map((att, i) => {
        const preview = att.linkPreview
        return (
          <a key={i} href={att.url} target="_blank" rel="noreferrer" className="link-preview-card" onClick={e => e.stopPropagation()}>
            {preview?.image && <img src={preview.image} alt="" />}
            <div className="link-preview-info">
              <h4>{preview?.title || att.url}</h4>
              {preview?.description && <p>{preview.description}</p>}
              <small><ExternalLink size={10} style={{ marginRight: 4 }} />{att.url}</small>
            </div>
          </a>
        )
      })}

      <AnimatePresence>
        {lightboxOpen && lightboxItems.length > 0 && (
          <Lightbox
            items={lightboxItems}
            startIndex={lightboxIndex}
            onClose={() => setLightboxOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
