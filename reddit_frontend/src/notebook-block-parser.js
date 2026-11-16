/**
 * Notebook Block Parser:
 * Bi-directional converter between standard Markdown text and structured Jupyter-style blocks.
 */

let blockCounter = 1

export function generateBlockId() {
  return `block_${Date.now()}_${blockCounter++}`
}

/**
 * Parses raw Markdown text into structured blocks:
 * - type: 'text' (normal Markdown text / explanations)
 * - type: 'code' (code cells with fixed ``` boundaries)
 */
export function parseMarkdownToBlocks(markdown = '') {
  if (!markdown || typeof markdown !== 'string') {
    return [{ id: generateBlockId(), type: 'text', content: '' }]
  }

  const blocks = []
  // Regex matches ```language \n code ```
  const codeBlockRegex = /```(\w+)?\r?\n([\s\S]*?)```/g
  let lastIndex = 0
  let match

  while ((match = codeBlockRegex.exec(markdown)) !== null) {
    const textBefore = markdown.slice(lastIndex, match.index)
    if (textBefore.trim()) {
      blocks.push({
        id: generateBlockId(),
        type: 'text',
        content: textBefore.trim()
      })
    }

    const lang = (match[1] || 'python').toLowerCase()
    const codeContent = match[2] || ''

    blocks.push({
      id: generateBlockId(),
      type: 'code',
      lang,
      content: codeContent.replace(/\r\n/g, '\n').trim()
    })

    lastIndex = match.index + match[0].length
  }

  // Any remaining text after the last code block
  const remainingText = markdown.slice(lastIndex)
  if (remainingText.trim()) {
    blocks.push({
      id: generateBlockId(),
      type: 'text',
      content: remainingText.trim()
    })
  }

  // Ensure at least one block exists
  if (blocks.length === 0) {
    blocks.push({ id: generateBlockId(), type: 'text', content: '' })
  }

  return blocks
}

/**
 * Compiles structured blocks back into valid Markdown string.
 * Fixed ``` boundaries are generated automatically.
 */
export function compileBlocksToMarkdown(blocks = []) {
  if (!Array.isArray(blocks) || blocks.length === 0) return ''

  return blocks
    .map((block) => {
      if (block.type === 'code') {
        const lang = block.lang || 'python'
        const code = (block.content || '').trim()
        return `\`\`\`${lang}\n${code}\n\`\`\``
      }
      return (block.content || '').trim()
    })
    .filter(Boolean)
    .join('\n\n')
}
