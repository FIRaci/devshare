import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Code2, Check, RefreshCw, Lock } from 'lucide-react'
import { getLanguageBrandIcon } from './language-icons'

export const LANGUAGE_OPTIONS = [
  { id: 'python',     label: 'Python',           sample: 'def hello_world():\n    print("Hello from DevShare!")\n\nhello_world()' },
  { id: 'typescript', label: 'TypeScript / JS',  sample: 'interface User {\n  id: string;\n  name: string;\n}\n\nconst greet = (u: User): string => `Hello ${u.name}`;' },
  { id: 'ipynb',      label: 'Jupyter Cell',     sample: '# In [1]:\nimport pandas as pd\ndf = pd.DataFrame({"framework": ["Bun", "Node"], "req_s": [120000, 45000]})\nprint(df)\n\n# Out [1]:\n#   framework   req_s\n# 0       Bun  120000\n# 1      Node   45000' },
  { id: 'sql',        label: 'SQL Query',        sample: 'SELECT u.id, u.username, COUNT(p.id) AS post_count\nFROM "User" u\nLEFT JOIN "Post" p ON p."authorId" = u.id\nGROUP BY u.id, u.username\nORDER BY post_count DESC\nLIMIT 10;' },
  { id: 'bash',       label: 'Bash / Terminal',  sample: '# Install and start DevShare locally\ngit clone https://github.com/FIRaci/devshare.git\ncd devshare\nbun install\nbun run dev' },
  { id: 'json',       label: 'JSON Data',        sample: '{\n  "name": "DevShare",\n  "version": "1.0.0",\n  "techStack": ["Bun", "Elysia", "React", "Prisma"]\n}' },
  { id: 'html',       label: 'HTML / CSS',       sample: '<div class="dev-card">\n  <h2>Hello DevShare</h2>\n  <p>Sharing code made effortless.</p>\n</div>' },
  { id: 'rust',       label: 'Rust / C++ / Go',  sample: 'fn main() {\n    let message = "DevShare: High Performance";\n    println!("{}", message);\n}' }
]

const CodeInsertModal = React.memo(function CodeInsertModal({ isOpen, onClose, onInsert, initialSelectedText = '' }) {
  const [selectedLang, setSelectedLang] = useState('python')
  const defaultOption = LANGUAGE_OPTIONS[0]
  const [codeSnippet, setCodeSnippet] = useState(initialSelectedText || defaultOption.sample)

  // Reset template state when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialSelectedText) {
        setCodeSnippet(initialSelectedText)
      } else {
        setSelectedLang('python')
        setCodeSnippet(defaultOption.sample)
      }
    }
  }, [isOpen, initialSelectedText])

  if (!isOpen) return null

  const activeOption = LANGUAGE_OPTIONS.find(l => l.id === selectedLang) || defaultOption

  // Auto-switch template immediately when language pill is clicked
  const handleSelectLang = (opt) => {
    setSelectedLang(opt.id)
    setCodeSnippet(opt.sample)
  }

  const handleInsert = () => {
    const code = codeSnippet.trim() || activeOption.sample
    const formatted = `\n\`\`\`${selectedLang}\n${code}\n\`\`\`\n`
    onInsert(formatted, selectedLang, code)
    onClose()
  }

  return (
    <motion.div
      className="modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
      onClick={onClose}
      style={{ zIndex: 600 }}
    >
      <motion.div
        className="modal modal-code-inserter"
        initial={{ scale: 0.96, opacity: 0, y: 6 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 6 }}
        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Code2 size={18} color="var(--primary)" />
            <h3>Insert Code / Jupyter Notebook</h3>
          </div>
          <button type="button" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body" style={{ gap: 14 }}>
          {/* Quick Language Selector with Official Brand SVGs */}
          <div>
            <label className="input-hint" style={{ fontWeight: 700, marginBottom: 8, display: 'block', letterSpacing: 0.3 }}>
              CHOOSE LANGUAGE / FORMAT (Template auto-loads instantly):
            </label>
            <div className="code-lang-selector-grid">
              {LANGUAGE_OPTIONS.map(opt => (
                <button
                  type="button"
                  key={opt.id}
                  className={`code-lang-pill ${selectedLang === opt.id ? 'active' : ''}`}
                  onClick={() => handleSelectLang(opt)}
                >
                  <span className="lang-icon">{getLanguageBrandIcon(opt.id, 18)}</span>
                  <span className="lang-label">{opt.label}</span>
                  {selectedLang === opt.id && <Check size={13} className="check-icon" />}
                </button>
              ))}
            </div>
          </div>

          {/* Code Input Area with Fixed Boundaries */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label className="input-hint" style={{ fontWeight: 700 }}>
                CODE CONTENT (``` is fixed automatically, just enter code):
              </label>
              <button
                type="button"
                className="btn-link-sample"
                onClick={() => setCodeSnippet(activeOption.sample)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                <RefreshCw size={12} /> Reload {activeOption.label} template
              </button>
            </div>

            {/* Visual Fixed Frame */}
            <div className="code-editor-fixed-frame">
              <div className="code-editor-locked-bar">
                <span className="code-locked-tag">
                  {getLanguageBrandIcon(selectedLang, 15)}
                  <code>```{selectedLang}</code>
                </span>
                <span className="code-locked-badge">
                  <Lock size={11} style={{ marginRight: 3 }} /> Fixed Boundary (Locked)
                </span>
              </div>

              <textarea
                className="code-inserter-textarea"
                placeholder={`Type or paste your ${activeOption.label} code here...`}
                value={codeSnippet}
                onChange={e => setCodeSnippet(e.target.value)}
                rows={8}
                autoFocus
              />

              <div className="code-editor-locked-bottom">
                <span className="code-locked-tag">
                  <code>```</code>
                </span>
                <span className="code-locked-badge">
                  <Lock size={11} style={{ marginRight: 3 }} /> Fixed Boundary (Locked)
                </span>
              </div>
            </div>
          </div>

          {selectedLang === 'ipynb' && (
            <div className="ipynb-tip-box">
              💡 <strong>Jupyter Tip:</strong> Format code with <code># In [1]:</code> and output with <code># Out [1]:</code> to render interactive computational cells.
            </div>
          )}

          <div className="modal-footer" style={{ marginTop: 8 }}>
            <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
            <button type="button" className="btn-post" onClick={handleInsert}>
              <Code2 size={15} /> Insert Code Block
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
})

export default CodeInsertModal
