import React from 'react'
import MarkdownRenderer from './MarkdownRenderer'
import { FileText, Link as LinkIcon } from 'lucide-react'

export const PostPreviewCard = React.memo(function PostPreviewCard({
  title = '',
  content = '',
  subredditName = '',
  authorName = 'you',
  attachments = []
}) {
  return (
    <div className="post-live-preview-card">
      <div className="post-preview-banner">
        <span className="post-preview-sub-tag">
          {subredditName ? `d/${subredditName}` : 'd/select-community'}
        </span>
        <span className="post-preview-meta">
          u/{authorName} • Article Preview
        </span>
      </div>

      <h1 className="post-preview-title">
        {title.trim() || 'Untitled Article Preview'}
      </h1>

      <div className="post-preview-body">
        {content ? (
          <MarkdownRenderer content={content} />
        ) : (
          <p style={{ color: 'var(--text-2)', fontStyle: 'italic', padding: '16px 0' }}>
            Live preview will appear here as you type in the editor...
          </p>
        )}
      </div>

      {attachments.length > 0 && (
        <div className="att-preview-strip" style={{ marginTop: 14 }}>
          {attachments.map((att, i) => (
            <div key={i} className="att-preview-chip">
              {att.type === 'IMAGE' && <img src={att.url} alt="" className="att-thumb" />}
              {att.type === 'VIDEO' && <video src={att.url} className="att-thumb" muted />}
              {att.type !== 'IMAGE' && att.type !== 'VIDEO' && (
                <div className="att-chip-icon">{att.type === 'LINK' ? <LinkIcon size={14}/> : <FileText size={14}/>}</div>
              )}
              <span className="att-chip-name">{att.name?.split('/').pop()?.slice(0, 24) || att.type}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
})
