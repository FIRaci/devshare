import React from 'react'
import { Plus, Code2, FileText, Image as ImageIcon } from 'lucide-react'

export const NotebookInterAdd = React.memo(function NotebookInterAdd({ onAdd }) {
  return (
    <div className="notebook-inter-add">
      <button type="button" className="notebook-inter-btn" onClick={() => onAdd('text')}>
        <Plus size={11} /> Text
      </button>
      <button type="button" className="notebook-inter-btn" onClick={() => onAdd('code')}>
        <Code2 size={11} /> Code
      </button>
      <button type="button" className="notebook-inter-btn" onClick={() => onAdd('image')}>
        <ImageIcon size={11} /> Image
      </button>
    </div>
  )
})

export const NotebookBottomBar = React.memo(function NotebookBottomBar({ onAdd }) {
  return (
    <div className="notebook-bottom-bar">
      <span className="notebook-bottom-hint">Append new section:</span>
      <div className="notebook-bottom-actions">
        <button
          type="button"
          className="btn-notebook-add btn-notebook-add-text"
          onClick={() => onAdd('text')}
        >
          <FileText size={14} />
          <span>+ Text</span>
        </button>
        <button
          type="button"
          className="btn-notebook-add btn-notebook-add-code"
          onClick={() => onAdd('code', 'python')}
        >
          <Code2 size={14} />
          <span>+ Code</span>
        </button>
        <button
          type="button"
          className="btn-notebook-add btn-notebook-add-image"
          onClick={() => onAdd('image')}
        >
          <ImageIcon size={14} />
          <span>+ Image</span>
        </button>
      </div>
    </div>
  )
})
