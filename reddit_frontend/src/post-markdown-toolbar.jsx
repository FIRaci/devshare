import React from 'react'
import { Bold, Italic, Code, Hash, Quote, List, Minus, Code2 } from 'lucide-react'

export const PostMarkdownToolbar = React.memo(function PostMarkdownToolbar({
  onFormat,
  onOpenCodeModal
}) {
  return (
    <div className="md-toolbar">
      <button type="button" className="md-tool" title="Bold (**text**)" onClick={e => onFormat('**', '**', 'bold text', e)}>
        <Bold size={14}/>
      </button>
      <button type="button" className="md-tool" title="Italic (*text*)" onClick={e => onFormat('*', '*', 'italic text', e)}>
        <Italic size={14}/>
      </button>
      <button type="button" className="md-tool" title="Inline code (`code`)" onClick={e => onFormat('`', '`', 'code', e)}>
        <Code size={14}/>
      </button>
      <button type="button" className="md-tool md-tool-code" title="Insert Code Block / Jupyter Notebook" onClick={e => { e.preventDefault(); onOpenCodeModal() }}>
        <Code2 size={14} color="var(--primary)"/>
        <span style={{ fontSize: 11, fontWeight: 700, marginLeft: 3 }}>Code</span>
      </button>
      <div className="md-tool-sep"/>
      <button type="button" className="md-tool" title="Heading" onClick={e => onFormat('## ', '', 'Heading', e)}>
        <Hash size={14}/>
      </button>
      <button type="button" className="md-tool" title="Quote" onClick={e => onFormat('> ', '', 'quote', e)}>
        <Quote size={14}/>
      </button>
      <button type="button" className="md-tool" title="List" onClick={e => onFormat('- ', '', 'item', e)}>
        <List size={14}/>
      </button>
      <button type="button" className="md-tool" title="Divider" onClick={e => onFormat('\n---\n', '', '', e)}>
        <Minus size={14}/>
      </button>
    </div>
  )
})
