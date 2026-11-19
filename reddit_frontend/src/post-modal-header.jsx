import React from 'react'
import { X, Edit3, Sparkles, Eye } from 'lucide-react'

export const PostModalHeader = React.memo(function PostModalHeader({
  isEdit = false,
  viewMode = 'editor',
  onViewModeChange,
  onClose
}) {
  return (
    <div className="modal-head">
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <h3 style={{ margin: 0, fontSize: 17 }}>
          {isEdit ? 'Edit Post' : 'Create Article'}
        </h3>
        <div className="post-modal-view-tabs">
          <button
            type="button"
            className={`post-modal-tab ${viewMode === 'editor' ? 'active' : ''}`}
            onClick={() => onViewModeChange('editor')}
          >
            <Edit3 size={13} /> Editor
          </button>
          <button
            type="button"
            className={`post-modal-tab ${viewMode === 'split' ? 'active' : ''}`}
            onClick={() => onViewModeChange('split')}
          >
            <Sparkles size={13} /> Split View
          </button>
          <button
            type="button"
            className={`post-modal-tab ${viewMode === 'preview' ? 'active' : ''}`}
            onClick={() => onViewModeChange('preview')}
          >
            <Eye size={13} /> Full Preview
          </button>
        </div>
      </div>
      <button type="button" onClick={onClose} title="Close">
        <X size={18} />
      </button>
    </div>
  )
})
