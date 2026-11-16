import React from 'react'
import { Lock, ArrowUp, ArrowDown, Trash2, RefreshCw, FileText, Image as ImageIcon } from 'lucide-react'
import { getLanguageBrandIcon } from './language-icons'
import { LANGUAGE_OPTIONS } from './code-insert-modal'
import { NotebookImageCell } from './notebook-image-cell'

export const NotebookCellItem = React.memo(function NotebookCellItem({
  block,
  index,
  totalBlocks,
  onUpdateContent,
  onUpdateLang,
  onLoadTemplate,
  onUpdateImage,
  onUploadImageFile,
  onMoveBlock,
  onRemoveBlock
}) {
  const isCode = block.type === 'code'
  const isImage = block.type === 'image'
  const lang = block.lang || 'python'
  const currentOption = LANGUAGE_OPTIONS.find(l => l.id === lang) || LANGUAGE_OPTIONS[0]

  return (
    <div className={`notebook-cell ${isCode ? 'notebook-cell-code' : isImage ? 'notebook-cell-image' : 'notebook-cell-text'}`}>
      {/* Cell Header */}
      <div className="notebook-cell-header">
        <div className="notebook-cell-meta">
          <span className="notebook-cell-badge">
            {isCode ? `[${index + 1}] Code` : isImage ? `[${index + 1}] Image` : `[${index + 1}] Text`}
          </span>

          {isCode ? (
            <div className="notebook-lang-select-group">
              <span className="notebook-brand-icon">{getLanguageBrandIcon(lang, 16)}</span>
              <select
                className="notebook-lang-dropdown"
                value={lang}
                onChange={e => onUpdateLang(block.id, e.target.value)}
              >
                {LANGUAGE_OPTIONS.map(opt => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <span className="notebook-locked-pill">
                <Lock size={11} />
                <code>```{lang}</code>
              </span>
            </div>
          ) : isImage ? (
            <span className="notebook-text-label" style={{ color: '#8B5CF6' }}>
              <ImageIcon size={14} style={{ marginRight: 5 }} />
              Blog Image Section
            </span>
          ) : (
            <span className="notebook-text-label">
              <FileText size={13} style={{ marginRight: 4 }} />
              Markdown Text Area
            </span>
          )}
        </div>

        <div className="notebook-cell-actions">
          {isCode && (
            <button
              type="button"
              className="notebook-cell-btn"
              title="Load template for this language"
              onClick={() => onLoadTemplate(block.id, currentOption.sample)}
            >
              <RefreshCw size={12} />
              <span>Template</span>
            </button>
          )}

          <button
            type="button"
            className="notebook-cell-btn"
            disabled={index === 0}
            title="Move cell up"
            onClick={() => onMoveBlock(index, -1)}
          >
            <ArrowUp size={13} />
          </button>

          <button
            type="button"
            className="notebook-cell-btn"
            disabled={index === totalBlocks - 1}
            title="Move cell down"
            onClick={() => onMoveBlock(index, 1)}
          >
            <ArrowDown size={13} />
          </button>

          {totalBlocks > 1 && (
            <button
              type="button"
              className="notebook-cell-btn notebook-cell-btn-delete"
              title="Delete this cell"
              onClick={() => onRemoveBlock(block.id)}
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Cell Body */}
      <div className="notebook-cell-body">
        {isCode ? (
          <div className="notebook-code-wrapper">
            <div className="notebook-line-gutter">
              <span>&gt;</span>
            </div>
            <textarea
              className="notebook-code-textarea"
              placeholder={`Enter ${currentOption.label} code here (no backticks needed)...`}
              value={block.content || ''}
              onChange={e => onUpdateContent(block.id, e.target.value)}
              rows={Math.max(4, (block.content || '').split('\n').length)}
              spellCheck={false}
            />
          </div>
        ) : isImage ? (
          <NotebookImageCell
            block={block}
            onUpdateImage={onUpdateImage}
            onUploadImageFile={onUploadImageFile}
          />
        ) : (
          <textarea
            className="notebook-text-textarea"
            placeholder="Type normal markdown text, post description, headings (#), or lists (-)..."
            value={block.content || ''}
            onChange={e => onUpdateContent(block.id, e.target.value)}
            rows={Math.max(3, (block.content || '').split('\n').length)}
          />
        )}
      </div>

      {/* Code Cell Locked Bottom Boundary */}
      {isCode && (
        <div className="notebook-code-footer">
          <span className="notebook-locked-pill">
            <Lock size={11} />
            <code>```</code> (Fixed Boundary)
          </span>
          <span className="notebook-code-hint">Code is automatically wrapped in ```</span>
        </div>
      )}
    </div>
  )
})
