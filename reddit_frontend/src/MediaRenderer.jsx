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

const GithubIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
)

const CodepenIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" /><line x1="12" y1="22" x2="12" y2="15.5" /><polyline points="22 8.5 12 15.5 2 8.5" /><polyline points="2 15.5 12 8.5 22 15.5" /><line x1="12" y1="2" x2="12" y2="8.5" /></svg>
)

const StackblitzIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M10.797 14.182H3.635L14.743 0l-1.54 9.818h7.162L9.257 24l1.54-9.818z"/></svg>
)

const FigmaIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M8 24c2.2 0 4-1.8 4-4v-4H8c-2.2 0-4 1.8-4 4s1.8 4 4 4zM4 12c0-2.2 1.8-4 4-4h4v8H8c-2.2 0-4-1.8-4-4zm8-12H8C5.8 0 4 1.8 4 4s1.8 4 4 4h4V0zm4 0h-4v8h4c2.2 0 4-1.8 4-4s-1.8-4-4-4zm0 8h-4v8h4c2.2 0 4-1.8 4-4s-1.8-4-4-4z"/></svg>
)

const platformMeta = {
  twitter:    { icon: MessageCircle, label: 'X / Twitter',  color: '#1DA1F2' },
  facebook:   { icon: FacebookIcon,  label: 'Facebook',    color: '#1877F2' },
  instagram:  { icon: InstagramIcon, label: 'Instagram',   color: '#E1306C' },
  tiktok:     { icon: Music,         label: 'TikTok',      color: '#00f2fe' },
  youtube:    { icon: Play,          label: 'YouTube',     color: '#FF0000' },
  github:     { icon: GithubIcon,    label: 'GitHub',      color: '#24292e' },
  codepen:    { icon: CodepenIcon,   label: 'CodePen',     color: '#47cf73' },
  stackblitz: { icon: StackblitzIcon,label: 'StackBlitz',  color: '#1389FD' },
  figma:      { icon: FigmaIcon,     label: 'Figma',       color: '#F24E1E' },
}

function SafeEmbed({ html, title }) {
  const iframeSrc = extractIframeSrc(html)
  if (iframeSrc) {
    return (
      <div className="embed-iframe-wrap">
        <iframe src={iframeSrc} title={title || 'Embed'} className="embed-iframe" sandbox="allow-scripts allow-presentation" loading="lazy" allowFullScreen />
      </div>
    )
  }
  return (
    <div className="embed-iframe-wrap">
      <iframe srcDoc={html} title={title || 'Embed'} className="embed-iframe" sandbox="allow-scripts allow-presentation" loading="lazy" style={{ minHeight: 200 }} />
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

const MediaRenderer = React.memo(function MediaRenderer({ post, isFeed = false }) {
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
        const urlStr = att.url || ''
        const urlLower = urlStr.toLowerCase()
        let detectedPlatform = preview?.platform
        if (!detectedPlatform || detectedPlatform === 'website') {
          if (urlLower.includes('github.com')) detectedPlatform = 'github'
          else if (urlLower.includes('codepen.io')) detectedPlatform = 'codepen'
          else if (urlLower.includes('stackblitz.com')) detectedPlatform = 'stackblitz'
          else if (urlLower.includes('figma.com')) detectedPlatform = 'figma'
        }

        const ytId = detectedPlatform === 'youtube' && preview?.videoId ? preview.videoId : extractYoutubeId(att.url)

        if (ytId) {
          return (
            <div key={i} className="yt-embed-wrap" onClick={e => e.stopPropagation()}>
              <iframe src={`https://www.youtube-nocookie.com/embed/${ytId}`} title={preview?.title || 'YouTube video'} className="yt-embed" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen loading="lazy" />
            </div>
          )
        }

        if (preview?.embedHtml) {
          return <SafeEmbed key={i} html={preview.embedHtml} title={preview?.title} />
        }

        if (detectedPlatform === 'codepen') {
          const m = urlStr.match(/codepen\.io\/([^/]+)\/pen\/([^/?#]+)/i)
          if (m) {
            return (
              <div key={i} className="embed-iframe-wrap" onClick={e => e.stopPropagation()}>
                <iframe src={`https://codepen.io/${m[1]}/embed/${m[2]}?default-tab=result`} title="CodePen Embed" className="embed-iframe" sandbox="allow-scripts allow-presentation" loading="lazy" style={{ height: 320 }} />
              </div>
            )
          }
        }

        if (detectedPlatform === 'stackblitz') {
          const m = urlStr.match(/stackblitz\.com\/edit\/([^/?#]+)/i)
          if (m) {
            return (
              <div key={i} className="embed-iframe-wrap" onClick={e => e.stopPropagation()}>
                <iframe src={`https://stackblitz.com/edit/${m[1]}?embed=1&view=preview`} title="StackBlitz Embed" className="embed-iframe" sandbox="allow-scripts allow-presentation" loading="lazy" style={{ height: 360 }} />
              </div>
            )
          }
        }

        const platformInline = detectedPlatform && platformMeta[detectedPlatform]
        if (platformInline && (preview?.image || preview?.videoUrl)) {
          return (
            <div key={i} className="platform-embed-wrap" onClick={e => e.stopPropagation()}>
              <a href={att.url} target="_blank" rel="noreferrer" className="platform-embed-badge" style={{ color: platformInline.color }}>
                <platformInline.icon size={14} /> {platformInline.label}
              </a>
              {preview.videoUrl
                ? <video src={preview.videoUrl} controls className="platform-embed-vid" />
                : <img src={preview.image} alt="" className="platform-embed-img" loading="lazy" />
              }
            </div>
          )
        }

        const meta = platformInline
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
})

export default MediaRenderer
