import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut } from 'lucide-react'

// Discord-style lightbox for images/videos
export default function Lightbox({ items, startIndex = 0, onClose }) {
  const [idx, setIdx] = useState(startIndex)
  const [zoom, setZoom] = useState(1)
  const [dragging, setDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [dragStart, setDragStart] = useState(null)

  const current = items[idx]
  const isImage = current?.type === 'IMAGE' || (!current?.type && /\.(gif|jpe?g|png|webp|svg|bmp)(\?|$)/i.test(current?.url || ''))
  const isVideo = current?.type === 'VIDEO' || (!current?.type && /\.(mp4|webm|mov|avi)(\?|$)/i.test(current?.url || ''))

  useEffect(() => {
    setZoom(1)
    setDragOffset({ x: 0, y: 0 })
  }, [idx])

  const handleKey = useCallback((e) => {
    if (e.key === 'Escape') onClose()
    if (e.key === 'ArrowRight') setIdx(i => Math.min(i + 1, items.length - 1))
    if (e.key === 'ArrowLeft') setIdx(i => Math.max(i - 1, 0))
  }, [items.length, onClose])

  useEffect(() => {
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [handleKey])

  const handleMouseDown = (e) => {
    if (zoom > 1) {
      setDragging(true)
      setDragStart({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y })
    }
  }
  const handleMouseMove = (e) => {
    if (dragging && dragStart) {
      setDragOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
    }
  }
  const handleMouseUp = () => setDragging(false)

  return (
    <motion.div
      className="lightbox-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Top bar */}
      <div className="lightbox-topbar" onClick={e => e.stopPropagation()}>
        <span className="lightbox-counter">{idx + 1} / {items.length}</span>
        <div className="lightbox-controls">
          {isImage && (
            <>
              <button className="lb-btn" onClick={() => setZoom(z => Math.max(1, z - 0.25))} title="Zoom out"><ZoomOut size={18}/></button>
              <span className="lb-zoom">{Math.round(zoom * 100)}%</span>
              <button className="lb-btn" onClick={() => setZoom(z => Math.min(4, z + 0.25))} title="Zoom in"><ZoomIn size={18}/></button>
            </>
          )}
          <a className="lb-btn" href={current?.url} download target="_blank" rel="noreferrer" title="Download"><Download size={18}/></a>
          <button className="lb-btn lb-close" onClick={onClose}><X size={20}/></button>
        </div>
      </div>

      {/* Main media */}
      <div className="lightbox-stage" onClick={e => e.stopPropagation()}>
        {items.length > 1 && (
          <button className="lb-nav lb-prev" onClick={() => setIdx(i => Math.max(i - 1, 0))} disabled={idx === 0}>
            <ChevronLeft size={28}/>
          </button>
        )}

        <div
          className="lightbox-media-wrap"
          style={{ cursor: zoom > 1 ? (dragging ? 'grabbing' : 'grab') : 'default' }}
          onMouseDown={handleMouseDown}
          onDoubleClick={() => setZoom(z => z > 1 ? 1 : 2)}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              style={{ transform: `scale(${zoom}) translate(${dragOffset.x / zoom}px, ${dragOffset.y / zoom}px)`, transformOrigin: 'center center' }}
            >
              {isImage && <img src={current.url} alt={current.name || ''} className="lightbox-img" draggable={false} />}
              {isVideo && <video src={current.url} controls autoPlay className="lightbox-video" />}
              {!isImage && !isVideo && (
                <div className="lightbox-file-view">
                  <div className="lightbox-file-icon">📄</div>
                  <p className="lightbox-file-name">{current.name || 'File'}</p>
                  <a href={current.url} download className="btn-post" style={{ marginTop: 16 }}>Download</a>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {items.length > 1 && (
          <button className="lb-nav lb-next" onClick={() => setIdx(i => Math.min(i + 1, items.length - 1))} disabled={idx === items.length - 1}>
            <ChevronRight size={28}/>
          </button>
        )}
      </div>

      {/* Bottom thumbnail strip */}
      {items.length > 1 && (
        <div className="lightbox-thumbs" onClick={e => e.stopPropagation()}>
          {items.map((item, i) => (
            <button
              key={i}
              className={`lb-thumb ${i === idx ? 'active' : ''}`}
              onClick={() => setIdx(i)}
            >
              {(item.type === 'IMAGE' || /\.(gif|jpe?g|png|webp|svg)(\?|$)/i.test(item.url || ''))
                ? <img src={item.url} alt="" />
                : <div className="lb-thumb-icon">{item.type === 'VIDEO' ? '▶' : '📄'}</div>
              }
            </button>
          ))}
        </div>
      )}
    </motion.div>
  )
}
