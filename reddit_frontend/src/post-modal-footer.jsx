import React from 'react'

export const PostModalFooter = React.memo(function PostModalFooter({
  wordCount = 0,
  readTimeMin = 1,
  isEdit = false,
  submitting = false,
  disabled = false,
  onClose
}) {
  return (
    <div className="modal-footer">
      <div className="modal-footer-left">
        <span className="post-modal-stats-tag">
          {wordCount} words • ~{readTimeMin} min read
        </span>
        <span className="post-modal-save-indicator">Auto-synced</span>
      </div>
      <div className="modal-footer-right">
        <button type="button" className="btn-outline" onClick={onClose}>
          Cancel
        </button>
        <button
          type="submit"
          className="btn-post"
          disabled={disabled || submitting}
        >
          {submitting
            ? (isEdit ? 'Saving...' : 'Publishing...')
            : (isEdit ? 'Save Changes' : 'Publish Article')}
        </button>
      </div>
    </div>
  )
})
