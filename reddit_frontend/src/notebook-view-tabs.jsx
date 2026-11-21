import React from 'react'
import { BookOpen, Edit3 } from 'lucide-react'

export const NotebookViewTabs = React.memo(function NotebookViewTabs({
  mode = 'notebook',
  onSwitchMode,
  textCount = 0,
  codeCount = 0,
  imageCount = 0
}) {
  return (
    <div className="notebook-toolbar-header">
      <div className="notebook-mode-pills">
        <button
          type="button"
          className={`notebook-mode-btn ${mode === 'notebook' ? 'active' : ''}`}
          onClick={() => onSwitchMode('notebook')}
        >
          <BookOpen size={14} />
          <span>Notebook Cells</span>
        </button>
        <button
          type="button"
          className={`notebook-mode-btn ${mode === 'raw' ? 'active' : ''}`}
          onClick={() => onSwitchMode('raw')}
        >
          <Edit3 size={14} />
          <span>Raw Markdown</span>
        </button>
      </div>

      <div className="notebook-stats">
        <span>{textCount} Text</span>
        <span className="notebook-stats-dot">•</span>
        <span>{codeCount} Code</span>
        <span className="notebook-stats-dot">•</span>
        <span>{imageCount} Images</span>
      </div>
    </div>
  )
})
