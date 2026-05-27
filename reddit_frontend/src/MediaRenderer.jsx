import React, { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import Lightbox from './Lightbox'
import { FileText, Play, MessageCircle, Music } from 'lucide-react'

function extractIframeSrc(html) {
  if (typeof html !== 'string') return null
  const m = html.match(/<iframe[^>]+src=["']([^"']+)["']/i)
  return m ? m[1] : null
}

const FacebookIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
)

const InstagramIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
)

const platformMeta = {
  twitter:  { icon: MessageCircle, label: 'X / Twitter',  color: '#1DA1F2' },
  facebook: { icon: FacebookIcon,  label: 'Facebook',    color: '#1877F2' },
  instagram:{ icon: InstagramIcon, label: 'Instagram',   color: '#E1306C' },
  tiktok:   { icon: Music,         label: 'TikTok',      color: '#00f2fe' },
  youtube:  { icon: Play,          label: 'YouTube',     color: '#FF0000' },
}

function EmbedIframe({ html, title }) {
  const src = extractIframeSrc(html)
  if (!src) return null

  return (
    <div className="embed-iframe-wrap">
      <iframe src={src} title={title || 'Embed'} className="embed-iframe" sandbox="allow-scripts allow-presentation" loading="lazy" allowFullScreen />
    </div>
  )
}

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
  if (typeof bytes !== 'number') return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

function extractYoutubeId(url) {
  if (typeof url !== 'string') return null
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-z0-9_-]{11})/i)
  return m ? m[1] : null
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
            <div key={i} className={`att-image-wrap ${imageItems.length === 1 ? 'single' : ''}`} onClick={e => { if (!isFeed) { e.stopPropagation(); handleImageClick(att) } }}>
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
        const platform = preview?.platform
        const ytId = platform === 'youtube' && preview?.videoId ? preview.videoId : extractYoutubeId(att.url)

        if (ytId) {
          return (
            <div key={i} className="yt-embed-wrap" onClick={e => e.stopPropagation()}>
              <iframe src={`https://www.youtube-nocookie.com/embed/${ytId}`} title={preview?.title || 'YouTube video'} className="yt-embed" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen loading="lazy" />
            </div>
          )
        }

        if (preview?.embedHtml) {
          return <EmbedIframe key={i} html={preview.embedHtml} title={preview?.title} />
        }

        const meta = platformMeta[platform] || null
        const hostname = (() => { try { return new URL(att.url).hostname.replace('www.', '') } catch { return att.url } })()

        return (
          <a key={i} href={att.url} target="_blank" rel="noreferrer" className={`link-preview-card${meta ? ` link-${platform}` : ''}`} onClick={e => e.stopPropagation()}>
            {preview?.image && (
              <div className="link-card-img-wrap">
                <img src={preview.image} alt="" />
              </div>
            )}
            <div className="link-card-body">
              {meta && (
                <div className="link-card-platform">
                  <meta.icon size={12} /> {meta.label}
                </div>
              )}
              <h4 className="link-card-title">{preview?.title || hostname}</h4>
              {preview?.description && <p className="link-card-desc">{preview.description}</p>}
              <div className="link-card-meta">
                {preview?.siteName && <span>{preview.siteName}</span>}
                <span>{hostname}</span>
              </div>
            </div>
          </a>
        )
      })}

      <AnimatePresence>
        {lightboxOpen && lightboxItems.length > 0 && (
          <Lightbox items={lightboxItems} startIndex={lightboxIndex} onClose={() => setLightboxOpen(false)} />
        )}
      </AnimatePresence>
    </>
  )
}
