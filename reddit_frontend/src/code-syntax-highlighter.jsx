import React from 'react'

// Token types and their corresponding CSS class names
// .hl-keyword, .hl-string, .hl-comment, .hl-number, .hl-boolean, .hl-func, .hl-type, .hl-operator, .hl-prop, .hl-tag, .hl-attr

const KEYWORDS_BY_LANG = {
  javascript: [
    'const', 'let', 'var', 'function', 'return', 'import', 'export', 'default', 'from', 'as',
    'class', 'extends', 'super', 'this', 'new', 'if', 'else', 'switch', 'case', 'break',
    'continue', 'for', 'while', 'do', 'in', 'of', 'try', 'catch', 'finally', 'throw',
    'async', 'await', 'yield', 'typeof', 'instanceof', 'void', 'delete', 'debugger'
  ],
  typescript: [
    'const', 'let', 'var', 'function', 'return', 'import', 'export', 'default', 'from', 'as',
    'class', 'extends', 'super', 'this', 'new', 'if', 'else', 'switch', 'case', 'break',
    'continue', 'for', 'while', 'do', 'in', 'of', 'try', 'catch', 'finally', 'throw',
    'async', 'await', 'yield', 'typeof', 'instanceof', 'void', 'delete',
    'interface', 'type', 'enum', 'namespace', 'declare', 'module', 'abstract', 'implements',
    'public', 'private', 'protected', 'readonly', 'static', 'override', 'keyof', 'readonly', 'never'
  ],
  python: [
    'def', 'class', 'import', 'from', 'as', 'return', 'if', 'elif', 'else', 'for', 'while',
    'break', 'continue', 'in', 'is', 'not', 'and', 'or', 'try', 'except', 'finally', 'raise',
    'with', 'lambda', 'yield', 'global', 'nonlocal', 'pass', 'assert', 'async', 'await', 'del',
    'match', 'case', 'self', 'cls'
  ],
  sql: [
    'SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'FULL', 'CROSS',
    'ON', 'GROUP', 'BY', 'HAVING', 'ORDER', 'ASC', 'DESC', 'LIMIT', 'OFFSET', 'UNION', 'ALL',
    'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE', 'TABLE', 'ALTER', 'DROP',
    'INDEX', 'VIEW', 'DATABASE', 'SCHEMA', 'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'CHECK',
    'UNIQUE', 'DEFAULT', 'NULL', 'NOT', 'AND', 'OR', 'IN', 'BETWEEN', 'LIKE', 'ILIKE', 'IS',
    'EXISTS', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'AS', 'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX'
  ],
  bash: [
    'if', 'then', 'else', 'elif', 'fi', 'for', 'while', 'do', 'done', 'in', 'case', 'esac',
    'function', 'return', 'exit', 'export', 'source', 'alias', 'local', 'readonly',
    'echo', 'cat', 'cd', 'ls', 'mkdir', 'rm', 'cp', 'mv', 'chmod', 'chown', 'curl', 'wget',
    'git', 'npm', 'bun', 'bunx', 'npx', 'yarn', 'pnpm', 'node', 'python', 'docker', 'docker-compose'
  ],
  json: [],
  html: ['DOCTYPE', 'html', 'head', 'body', 'div', 'span', 'p', 'a', 'img', 'script', 'style', 'link', 'meta'],
  css: ['import', 'media', 'keyframes', 'root', 'font-face']
}

// Map common aliases to canonical languages
export function normalizeLanguage(lang) {
  if (!lang) return 'text'
  const l = lang.toLowerCase().trim()
  if (['js', 'jsx', 'mjs', 'cjs'].includes(l)) return 'javascript'
  if (['ts', 'tsx'].includes(l)) return 'typescript'
  if (['py', 'python3', 'python2'].includes(l)) return 'python'
  if (['sh', 'bash', 'zsh', 'shell'].includes(l)) return 'bash'
  if (['sql', 'mysql', 'postgres', 'postgresql', 'sqlite'].includes(l)) return 'sql'
  if (['json'].includes(l)) return 'json'
  if (['html', 'htm', 'xml', 'svg'].includes(l)) return 'html'
  if (['css', 'scss', 'sass', 'less'].includes(l)) return 'css'
  if (['ipynb', 'jupyter', 'notebook'].includes(l)) return 'ipynb'
  if (['cpp', 'c++', 'c', 'h', 'hpp'].includes(l)) return 'cpp'
  if (['go', 'golang'].includes(l)) return 'go'
  if (['rs', 'rust'].includes(l)) return 'rust'
  if (['java', 'kt', 'kotlin'].includes(l)) return 'java'
  return l
}

// Tokenize a single line of code with regex tokens
export function tokenizeLine(line, lang = 'javascript') {
  const normLang = normalizeLanguage(lang)
  const keywords = KEYWORDS_BY_LANG[normLang] || KEYWORDS_BY_LANG.javascript
  const keywordSet = new Set(keywords.map(k => normLang === 'sql' ? k.toUpperCase() : k))

  const tokens = []
  let i = 0
  const len = line.length

  while (i < len) {
    // 1. Comments
    // JS/TS // or /*
    if ((normLang === 'javascript' || normLang === 'typescript' || normLang === 'cpp' || normLang === 'go' || normLang === 'rust' || normLang === 'java') && line.slice(i, i + 2) === '//') {
      tokens.push({ type: 'comment', text: line.slice(i) })
      break
    }
    // Python # or Bash #
    if ((normLang === 'python' || normLang === 'bash' || normLang === 'ipynb') && line[i] === '#') {
      tokens.push({ type: 'comment', text: line.slice(i) })
      break
    }
    // SQL --
    if (normLang === 'sql' && line.slice(i, i + 2) === '--') {
      tokens.push({ type: 'comment', text: line.slice(i) })
      break
    }

    // 2. Strings: Double quotes, Single quotes, Backticks
    if (line[i] === '"' || line[i] === "'" || line[i] === '`') {
      const quote = line[i]
      let j = i + 1
      while (j < len) {
        if (line[j] === '\\') { j += 2; continue }
        if (line[j] === quote) { j++; break }
        j++
      }
      tokens.push({ type: 'string', text: line.slice(i, j) })
      i = j
      continue
    }

    // 3. Numbers (hex, float, int)
    if (/[0-9]/.test(line[i]) && (i === 0 || /[^a-zA-Z0-9_$]/.test(line[i - 1]))) {
      let j = i
      while (j < len && /[0-9a-fA-FxX._]/.test(line[j])) j++
      tokens.push({ type: 'number', text: line.slice(i, j) })
      i = j
      continue
    }

    // 4. Identifiers / Keywords / Functions
    if (/[a-zA-Z_$]/.test(line[i])) {
      let j = i
      while (j < len && /[a-zA-Z0-9_$]/.test(line[j])) j++
      const word = line.slice(i, j)
      const checkWord = normLang === 'sql' ? word.toUpperCase() : word

      // Booleans and nulls
      if (['true', 'false', 'null', 'undefined', 'True', 'False', 'None'].includes(word)) {
        tokens.push({ type: 'boolean', text: word })
      } else if (keywordSet.has(checkWord)) {
        tokens.push({ type: 'keyword', text: word })
      } else if (j < len && line[j] === '(') {
        // Function call
        tokens.push({ type: 'func', text: word })
      } else if (/^[A-Z][a-zA-Z0-9]*$/.test(word) && (normLang === 'typescript' || normLang === 'python' || normLang === 'javascript')) {
        // Class or Type definition / PascalCase
        tokens.push({ type: 'type', text: word })
      } else {
        tokens.push({ type: 'ident', text: word })
      }
      i = j
      continue
    }

    // 5. Operators & Punctuation
    if (/[=+\-*/%&|^!<>?:~]/.test(line[i])) {
      let j = i
      while (j < len && /[=+\-*/%&|^!<>?:~]/.test(line[j])) j++
      tokens.push({ type: 'operator', text: line.slice(i, j) })
      i = j
      continue
    }

    // 6. Whitespace and other characters
    tokens.push({ type: 'plain', text: line[i] })
    i++
  }

  return tokens
}

// Render a highlighted line with line tokens
export default function HighlightedLine({ line, lang = 'javascript' }) {
  if (!line) return <span>{'\n'}</span>
  const tokens = tokenizeLine(line, lang)

  return (
    <>
      {tokens.map((tok, idx) => {
        if (tok.type === 'keyword') return <span key={idx} className="hl-keyword">{tok.text}</span>
        if (tok.type === 'string') return <span key={idx} className="hl-string">{tok.text}</span>
        if (tok.type === 'comment') return <span key={idx} className="hl-comment">{tok.text}</span>
        if (tok.type === 'number') return <span key={idx} className="hl-number">{tok.text}</span>
        if (tok.type === 'boolean') return <span key={idx} className="hl-boolean">{tok.text}</span>
        if (tok.type === 'func') return <span key={idx} className="hl-func">{tok.text}</span>
        if (tok.type === 'type') return <span key={idx} className="hl-type">{tok.text}</span>
        if (tok.type === 'operator') return <span key={idx} className="hl-operator">{tok.text}</span>
        return <span key={idx}>{tok.text}</span>
      })}
    </>
  )
}
