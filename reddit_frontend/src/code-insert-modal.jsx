import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Code2, BookOpen, Terminal, Database, FileCode, Check } from 'lucide-react'

const LANGUAGE_OPTIONS = [
  { id: 'python',     label: 'Python',           icon: '🐍', sample: 'def hello_world():\n    print("Hello from DevShare!")\n\nhello_world()' },
  { id: 'typescript', label: 'TypeScript / JS',  icon: '⚡', sample: 'interface User {\n  id: string;\n  name: string;\n}\n\nconst greet = (u: User) => `Hello ${u.name}`;' },
  { id: 'ipynb',      label: 'Jupyter Cell',     icon: '📓', sample: '# In [1]:\nimport pandas as pd\ndf = pd.DataFrame({"framework": ["Bun", "Node"], "req_s": [120000, 45000]})\nprint(df)\n\n# Out [1]:\n#   framework   req_s\n# 0       Bun  120000\n# 1      Node   45000' },
  { id: 'sql',        label: 'SQL Query',        icon: '🗄️', sample: 'SELECT u.id, u.username, COUNT(p.id) AS post_count\nFROM "User" u\nLEFT JOIN "Post" p ON p."authorId" = u.id\nGROUP BY u.id, u.username\nORDER BY post_count DESC\nLIMIT 10;' },
  { id: 'bash',       label: 'Bash / Terminal',  icon: '💻', sample: '# Install and start DevShare locally\ngit clone https://github.com/FIRaci/devshare.git\ncd devshare\nbun install\nbun run dev' },
  { id: 'json',       label: 'JSON Data',        icon: '📦', sample: '{\n  "name": "DevShare",\n  "version": "1.0.0",\n  "techStack": ["Bun", "Elysia", "React", "Prisma"]\n}' },
  { id: 'html',       label: 'HTML / CSS',       icon: '🌐', sample: '<div class="dev-card">\n  <h2>Hello DevShare</h2>\n  <p>Sharing code made effortless.</p>\n</div>' },
  { id: 'rust',       label: 'Rust / C++ / Go',  icon: '⚙️', sample: 'fn main() {\n    let message = "DevShare: High Performance";\n    println!("{}", message);\n}' }
]

export default function CodeInsertModal({ isOpen, onClose, onInsert, initialSelectedText = '' }) {
  const [selectedLang, setSelectedLang] = useState('python')
  const [codeSnippet, setCodeSnippet] = useState(initialSelectedText || '')

  if (!isOpen) return null

  const activeOption = LANGUAGE_OPTIONS.find(l => l.id === selectedLang) || LANGUAGE_OPTIONS[0]

  const handleApplySample = (sampleCode, langId) => {
    setSelectedLang(langId)
    if (!codeSnippet.trim()) {
      setCodeSnippet(sampleCode)
    }
  }

  const handleInsert = () => {
    const code = codeSnippet.trim() || activeOption.sample
    const formatted = `\n\`\`\`${selectedLang}\n${code}\n\`\`\`\n`
    onInsert(formatted)
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 600 }}>
      <motion.div
        className="modal modal-code-inserter"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
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
          {/* Quick Language Selector */}
          <div>
            <label className="input-hint" style={{ fontWeight: 700, marginBottom: 6, display: 'block' }}>
              CHOOSE LANGUAGE / FORMAT:
            </label>
            <div className="code-lang-selector-grid">
              {LANGUAGE_OPTIONS.map(opt => (
                <button
                  type="button"
                  key={opt.id}
                  className={`code-lang-pill ${selectedLang === opt.id ? 'active' : ''}`}
                  onClick={() => handleApplySample(opt.sample, opt.id)}
                >
                  <span className="lang-icon">{opt.icon}</span>
                  <span className="lang-label">{opt.label}</span>
                  {selectedLang === opt.id && <Check size={12} className="check-icon" />}
                </button>
              ))}
            </div>
          </div>

          {/* Code Input Area */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label className="input-hint" style={{ fontWeight: 700 }}>
                CODE CONTENT (Paste or edit code directly without markdown backticks):
              </label>
              <button
                type="button"
                className="btn-link-sample"
                onClick={() => setCodeSnippet(activeOption.sample)}
              >
                Use {activeOption.label} template
              </button>
            </div>

            <textarea
              className="code-inserter-textarea"
              placeholder={`Paste your ${activeOption.label} code here...`}
              value={codeSnippet}
              onChange={e => setCodeSnippet(e.target.value)}
              rows={8}
            />
          </div>

          {selectedLang === 'ipynb' && (
            <div className="ipynb-tip-box">
              💡 <strong>Jupyter Tip:</strong> You can format cells with <code># In [1]:</code> for code and <code># Out [1]:</code> for cell output, or paste raw <code>.ipynb</code> JSON directly.
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
    </div>
  )
}
