import React from 'react'
import { Compass } from 'lucide-react'

export const PostModalCommunityPrompt = React.memo(function PostModalCommunityPrompt({
  onClose,
  onExploreRedirect
}) {
  return (
    <div className="modal-body" style={{ textAlign: 'center', padding: '40px 20px' }}>
      <div style={{ fontSize: 44, marginBottom: 14 }}>🚀</div>
      <h3 style={{ fontSize: 19, fontWeight: 800, marginBottom: 8 }}>
        Join a Community First
      </h3>
      <p style={{ color: 'var(--text-2)', fontSize: 13.5, lineHeight: 1.6, maxWidth: 460, margin: '0 auto 24px' }}>
        On DevShare, you must be a member of a community before you can publish articles or code in it. Explore developer communities to join!
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
  )
})
