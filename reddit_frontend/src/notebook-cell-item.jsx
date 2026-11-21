import React, { useRef } from 'react'
import { Lock, ArrowUp, ArrowDown, Trash2, Sparkles, Image as ImageIcon } from 'lucide-react'
import { LanguageCombobox } from './language-combobox'
import { TextCellToolbar } from './text-cell-toolbar'
import { NotebookImageCell } from './notebook-image-cell'
import { getLanguageOption } from './language-options'

function wrapSelection(textarea, before, after = '', defaultText = '') {
  if (!textarea) return null
  const start = textarea.selectionStart ?? 0
  const end = textarea.selectionEnd ?? 0
  const text = textarea.value || ''
  const selected = text.slice(start, end) || defaultText
  const newContent = text.slice(0, start) + before + selected + after + text.slice(end)
  const newCursor = start + before.length + selected.length + after.length
  return { newContent, newCursor }
}

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
  onRemoveBlock,
  onAddBlockAfter
}) {
  const isCode = block.type === 'code'
  const isImage = block.type === 'image'
  const lang = block.lang || 'python'
  const textareaRef = useRef(null)
  const currentOption = getLanguageOption(lang)

  const handleTextFormat = (before, after, defaultText) => {
    const res = wrapSelection(textareaRef.current, before, after, defaultText)
    if (res) {
      onUpdateContent(block.id, res.newContent)
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus()
          textareaRef.current.setSelectionRange(res.newCursor, res.newCursor)
        }
      }, 0)
    } else {
      onUpdateContent(block.id, `${block.content || ''}\n${before}${defaultText}${after}`)
    }
  }

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
              <LanguageCombobox
                selectedLang={lang}
                onSelectLang={(newLang, sample) => onUpdateLang(block.id, newLang, sample)}
              />
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
            <TextCellToolbar
              onFormat={handleTextFormat}
              onConvertToCode={() => onAddBlockAfter?.(index, 'code')}
            />
          )}
        </div>

        <div className="notebook-cell-actions">
          {isCode && (
            <button
              type="button"
              className="notebook-cell-btn notebook-cell-template-btn"
              title="Load example boilerplate code for this language"
              onClick={() => onLoadTemplate(block.id, currentOption.sample)}
            >
              <Sparkles size={12} color="var(--primary)" />
              <span>Example</span>
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
            ref={textareaRef}
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
