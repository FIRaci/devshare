/**
 * Notebook Block Parser:
 * Bi-directional converter between standard Markdown text and structured Jupyter/Blog-style blocks.
 * Supports:
 * - 'text' (Markdown explanations, titles, lists)
 * - 'code' (Code cells with fixed ``` boundaries)
 * - 'image' (Media blocks with URL and caption)
 */

let blockCounter = 1

export function generateBlockId() {
  return `block_${Date.now()}_${blockCounter++}`
}

/**
 * Parses raw Markdown text into structured blocks:
 * - type: 'text' (normal Markdown text / explanations)
 * - type: 'code' (code cells with fixed ``` boundaries)
 * - type: 'image' (embedded images ![caption](url))
 */
export function parseMarkdownToBlocks(markdown = '') {
  if (!markdown || typeof markdown !== 'string') {
    return [{ id: generateBlockId(), type: 'text', content: '' }]
  }

  const tokens = []

  // 1. Find all code blocks
  const codeBlockRegex = /```(\w+)?\r?\n([\s\S]*?)```/g
  let match

  while ((match = codeBlockRegex.exec(markdown)) !== null) {
    tokens.push({
      type: 'code',
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      lang: (match[1] || 'python').toLowerCase(),
      content: (match[2] || '').replace(/\r\n/g, '\n').trim()
    })
  }

  // 2. Find all image tokens: ![alt](url)
  const imageRegex = /!\[(.*?)\]\(([^\s)]+)\)/g
  while ((match = imageRegex.exec(markdown)) !== null) {
    const s = match.index
    const e = match.index + match[0].length
    const insideCode = tokens.some(t => t.type === 'code' && s >= t.startIndex && e <= t.endIndex)
    if (!insideCode) {
      tokens.push({
        type: 'image',
        startIndex: s,
        endIndex: e,
        caption: match[1] || '',
        url: match[2] || ''
      })
    }
  }

  // Sort tokens by startIndex
  tokens.sort((a, b) => a.startIndex - b.startIndex)

  const blocks = []
  let lastIndex = 0

  for (const token of tokens) {
    const textBefore = markdown.slice(lastIndex, token.startIndex).trim()
    if (textBefore) {
      blocks.push({
        id: generateBlockId(),
        type: 'text',
        content: textBefore
      })
    }

    if (token.type === 'code') {
      blocks.push({
        id: generateBlockId(),
        type: 'code',
        lang: token.lang,
        content: token.content
      })
    } else if (token.type === 'image') {
      blocks.push({
        id: generateBlockId(),
        type: 'image',
        caption: token.caption,
        url: token.url
      })
    }

    lastIndex = token.endIndex
  }

  // Any remaining text after the last token
  const remainingText = markdown.slice(lastIndex).trim()
  if (remainingText) {
    blocks.push({
      id: generateBlockId(),
      type: 'text',
      content: remainingText
    })
  }

  if (blocks.length === 0) {
    blocks.push({ id: generateBlockId(), type: 'text', content: '' })
  }

  return blocks
}

/**
 * Compiles structured blocks back into valid Markdown string.
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
      if (block.type === 'image') {
        if (!block.url) return ''
        const caption = (block.caption || '').trim()
        return `![${caption}](${block.url.trim()})`
      }
      return (block.content || '').trim()
    })
    .filter(Boolean)
    .join('\n\n')
}
