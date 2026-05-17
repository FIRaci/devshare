import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'

export default function Lightbox({ items, startIndex = 0, onClose }) {
  const [idx, setIdx] = useState(startIndex)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const pointerRef = useRef(null) // tracking pointer for pan
  const hasDragged = useRef(false)

  const current = items[idx]
  const isImage = current?.type === 'IMAGE' || /\.(gif|jpe?g|png|webp|svg|bmp|ico)(\?|$)/i.test(current?.url || '')
  const isVideo = current?.type === 'VIDEO' || /\.(mp4|webm|mov|avi|mkv)(\?|$)/i.test(current?.url || '')

  // Reset on item change
  useEffect(() => { setZoom(1); setPan({ x: 0, y: 0 }) }, [idx])

  // Completely lock body scroll
  useEffect(() => {
    const scrollY = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.overflow = ''
      window.scrollTo(0, scrollY)
    }
  }, [])

  // Keyboard
  const handleKey = useCallback((e) => {
    if (e.key === 'Escape') onClose()
    if (e.key === 'ArrowRight' || e.key === 'd') setIdx(i => Math.min(i + 1, items.length - 1))
    if (e.key === 'ArrowLeft' || e.key === 'a') setIdx(i => Math.max(i - 1, 0))
    if (e.key === '+' || e.key === '=') setZoom(z => Math.min(5, +(z + 0.25).toFixed(2)))
    if (e.key === '-') setZoom(z => { const n = Math.max(1, +(z - 0.25).toFixed(2)); if (n === 1) setPan({ x: 0, y: 0 }); return n })
    if (e.key === '0') { setZoom(1); setPan({ x: 0, y: 0 }) }
  }, [items.length, onClose])

  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleKey])

  // Wheel zoom
  const handleWheel = (e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.15 : 0.15
    setZoom(z => {
      const next = Math.min(5, Math.max(1, +(z + delta).toFixed(2)))
      if (next === 1) setPan({ x: 0, y: 0 })
      return next
    })
  }

  // Pointer pan
  const handlePointerDown = (e) => {
    if (zoom <= 1) return
    e.currentTarget.setPointerCapture(e.pointerId)
    hasDragged.current = false
    pointerRef.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y }
  }
  const handlePointerMove = (e) => {
    if (!pointerRef.current) return
    const dx = e.clientX - pointerRef.current.x
    const dy = e.clientY - pointerRef.current.y
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) hasDragged.current = true
    setPan({ x: pointerRef.current.px + dx, y: pointerRef.current.py + dy })
  }
  const handlePointerUp = () => { pointerRef.current = null }

  // Click image: only close if not zoomed & not dragged
  const handleImgClick = (e) => { e.stopPropagation() }

  // Backdrop click = close
  const handleBackdrop = () => { if (!hasDragged.current) onClose() }

  const zoomBtn = (delta) => setZoom(z => {
    const next = Math.min(5, Math.max(1, +(z + delta).toFixed(2)))
    if (next === 1) setPan({ x: 0, y: 0 })
    return next
  })

  return (
    <div className="lb-root" onWheel={handleWheel} style={{ touchAction: 'none' }}>
      <motion.div
        className="lb-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.12 }}
        onClick={handleBackdrop}
      >
        {/* ── Toolbar ── */}
        <div className="lb-bar" onClick={e => e.stopPropagation()}>
          <span className="lb-counter">{idx + 1} / {items.length}</span>
          <div className="lb-bar-right">
            {isImage && <>
              <button className="lb-icon" title="Zoom out (-)" onClick={() => zoomBtn(-0.25)}><ZoomOut size={16}/></button>
              <span className="lb-pct">{Math.round(zoom * 100)}%</span>
              <button className="lb-icon" title="Zoom in (+)" onClick={() => zoomBtn(0.25)}><ZoomIn size={16}/></button>
              <button className="lb-icon" title="Reset (0)" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }) }}><RotateCcw size={15}/></button>
            </>}
            <a className="lb-icon" href={current?.url} download target="_blank" rel="noreferrer" title="Download" onClick={e => e.stopPropagation()}>
              <Download size={16}/>
            </a>
            <button className="lb-icon lb-x" title="Close (Esc)" onClick={onClose}><X size={18}/></button>
          </div>
        </div>

        {/* ── Stage ── */}
        <div className="lb-stage" onClick={handleBackdrop}>

          {/* Left arrow */}
          {items.length > 1 && (
            <button
              className="lb-arrow lb-arrow-l"
              disabled={idx === 0}
              onClick={e => { e.stopPropagation(); setIdx(i => i - 1) }}
            ><ChevronLeft size={28}/></button>
          )}

          {/* Media */}
          <AnimatePresence mode="wait">
            <motion.div
              key={idx}
              className="lb-media"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.1 }}
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: 'center center',
                cursor: zoom > 1 ? (pointerRef.current ? 'grabbing' : 'grab') : 'default',
              }}
              onClick={handleImgClick}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            >
              {isImage && (
                <img
                  src={current.url}
                  alt={current.name || ''}
                  className="lb-img"
                  draggable={false}
                  onDoubleClick={() => { setZoom(z => z > 1 ? 1 : 2.5); setPan({ x: 0, y: 0 }) }}
                />
              )}
              {isVideo && (
                <video
                  src={current.url}
                  controls
                  autoPlay
                  className="lb-video"
                  onClick={e => e.stopPropagation()}
                />
              )}
              {!isImage && !isVideo && (
                <div className="lb-file-card" onClick={e => e.stopPropagation()}>
                  <span style={{ fontSize: 56 }}>📄</span>
                  <p className="lb-file-name">{current.name || 'File'}</p>
                  <a href={current.url} download className="btn-post" style={{ marginTop: 12 }}>Download</a>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Right arrow */}
          {items.length > 1 && (
            <button
              className="lb-arrow lb-arrow-r"
              disabled={idx === items.length - 1}
              onClick={e => { e.stopPropagation(); setIdx(i => i + 1) }}
            ><ChevronRight size={28}/></button>
          )}
        </div>

        {/* ── Thumbnails ── */}
        {items.length > 1 && (
          <div className="lb-thumbs" onClick={e => e.stopPropagation()}>
            {items.map((item, i) => (
              <button key={i} className={`lb-thumb ${i === idx ? 'active' : ''}`} onClick={() => setIdx(i)}>
                {(item.type === 'IMAGE' || /\.(gif|jpe?g|png|webp|svg)(\?|$)/i.test(item.url || ''))
                  ? <img src={item.url} alt="" />
                  : <div className="lb-thumb-icon">{item.type === 'VIDEO' ? '▶' : '📄'}</div>
                }
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}
