import React from 'react'
import { Bold, Italic, Code, Heading2, Quote, List, Minus, Code2 } from 'lucide-react'

export const TextCellToolbar = React.memo(function TextCellToolbar({
  onFormat,
  onConvertToCode
}) {
  return (
    <div className="text-cell-toolbar" onClick={e => e.stopPropagation()}>
      <button
        type="button"
        className="text-cell-tool-btn"
        title="Bold (**text**)"
        onClick={() => onFormat('**', '**', 'bold text')}
      >
        <Bold size={12} />
      </button>

      <button
        type="button"
        className="text-cell-tool-btn"
        title="Italic (*text*)"
        onClick={() => onFormat('*', '*', 'italic text')}
      >
        <Italic size={12} />
      </button>

      <button
        type="button"
        className="text-cell-tool-btn"
        title="Heading (## Title)"
        onClick={() => onFormat('## ', '', 'Heading')}
      >
        <Heading2 size={13} />
      </button>

      <button
        type="button"
        className="text-cell-tool-btn"
        title="Inline code (`code`)"
        onClick={() => onFormat('`', '`', 'code')}
      >
        <Code size={12} />
      </button>

      <button
        type="button"
        className="text-cell-tool-btn"
        title="Blockquote (> quote)"
        onClick={() => onFormat('> ', '', 'quote')}
      >
        <Quote size={12} />
      </button>

      <button
        type="button"
        className="text-cell-tool-btn"
        title="Bulleted List (- item)"
        onClick={() => onFormat('- ', '', 'list item')}
      >
        <List size={12} />
      </button>

      <button
        type="button"
        className="text-cell-tool-btn"
        title="Horizontal Divider (---)"
        onClick={() => onFormat('\n---\n', '', '')}
      >
        <Minus size={12} />
      </button>

      {onConvertToCode && (
        <>
          <div className="text-cell-tool-sep" />
          <button
            type="button"
            className="text-cell-tool-btn text-cell-tool-code-btn"
            title="Convert to Code cell or insert snippet"
            onClick={onConvertToCode}
          >
            <Code2 size={12} />
            <span>+ Code</span>
          </button>
        </>
      )}
    </div>
  )
})
