import { SAMPLES } from './language-samples.js'

export const LANGUAGE_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'popular', label: 'Popular' },
  { id: 'web', label: 'Web & Frontend' },
  { id: 'backend', label: 'Backend & APIs' },
  { id: 'systems', label: 'Systems & Native' },
  { id: 'mobile', label: 'Mobile' },
  { id: 'data', label: 'Data & AI' },
  { id: 'devops', label: 'DevOps & Shell' },
  { id: 'web3', label: 'Web3' }
]

export const LANGUAGE_OPTIONS = [
  // Popular
  { id: 'python', label: 'Python', category: 'popular', sample: SAMPLES.python },
  { id: 'typescript', label: 'TypeScript', category: 'popular', sample: SAMPLES.typescript },
  { id: 'javascript', label: 'JavaScript', category: 'popular', sample: SAMPLES.javascript },
  { id: 'sql', label: 'SQL / PostgreSQL', category: 'popular', sample: SAMPLES.sql },
  { id: 'rust', label: 'Rust', category: 'popular', sample: SAMPLES.rust },
  { id: 'go', label: 'Go (Golang)', category: 'popular', sample: SAMPLES.go },
  { id: 'cpp', label: 'C++', category: 'popular', sample: SAMPLES.cpp },
  { id: 'csharp', label: 'C# / .NET', category: 'popular', sample: SAMPLES.csharp },
  { id: 'java', label: 'Java', category: 'popular', sample: SAMPLES.java },

  // Web & Frontend
  { id: 'jsx', label: 'React (JSX/TSX)', category: 'web', sample: SAMPLES.jsx },
  { id: 'html', label: 'HTML5', category: 'web', sample: SAMPLES.html },
  { id: 'css', label: 'CSS3', category: 'web', sample: SAMPLES.css },
  { id: 'tailwind', label: 'Tailwind CSS', category: 'web', sample: SAMPLES.tailwind },
  { id: 'json', label: 'JSON Data', category: 'web', sample: SAMPLES.json },
  { id: 'graphql', label: 'GraphQL', category: 'web', sample: SAMPLES.graphql },
  { id: 'markdown', label: 'Markdown', category: 'web', sample: SAMPLES.markdown },

  // Backend & APIs
  { id: 'php', label: 'PHP 8', category: 'backend', sample: SAMPLES.php },
  { id: 'ruby', label: 'Ruby / Rails', category: 'backend', sample: SAMPLES.ruby },
  { id: 'scala', label: 'Scala', category: 'backend', sample: SAMPLES.scala },
  { id: 'elixir', label: 'Elixir / Phoenix', category: 'backend', sample: SAMPLES.elixir },

  // Systems & Native
  { id: 'c', label: 'C Language', category: 'systems', sample: SAMPLES.c },
  { id: 'zig', label: 'Zig', category: 'systems', sample: SAMPLES.zig },
  { id: 'lua', label: 'Lua', category: 'systems', sample: SAMPLES.lua },

  // Mobile
  { id: 'swift', label: 'Swift (iOS/SwiftUI)', category: 'mobile', sample: SAMPLES.swift },
  { id: 'kotlin', label: 'Kotlin (Android)', category: 'mobile', sample: SAMPLES.kotlin },
  { id: 'dart', label: 'Dart / Flutter', category: 'mobile', sample: SAMPLES.dart },

  // Data & AI
  { id: 'ipynb', label: 'Jupyter Notebook', category: 'data', sample: SAMPLES.ipynb },
  { id: 'r', label: 'R (Data & Stats)', category: 'data', sample: SAMPLES.r },

  // DevOps & Shell
  { id: 'bash', label: 'Bash / Shell', category: 'devops', sample: SAMPLES.bash },
  { id: 'powershell', label: 'PowerShell', category: 'devops', sample: SAMPLES.powershell },
  { id: 'dockerfile', label: 'Dockerfile', category: 'devops', sample: SAMPLES.dockerfile },
  { id: 'yaml', label: 'YAML / CI-CD', category: 'devops', sample: SAMPLES.yaml },

  // Web3
  { id: 'solidity', label: 'Solidity (EVM)', category: 'web3', sample: SAMPLES.solidity }
]

export function getLanguageOption(id = '') {
  const cleanId = (id || '').toLowerCase().trim()
  return (
    LANGUAGE_OPTIONS.find(opt => opt.id === cleanId) ||
    LANGUAGE_OPTIONS.find(opt => opt.id === 'python') ||
    LANGUAGE_OPTIONS[0]
  )
}

export function searchLanguages(query = '', category = 'all') {
  const q = (query || '').toLowerCase().trim()
  return LANGUAGE_OPTIONS.filter(opt => {
    const matchCategory =
      category === 'all' ||
      (category === 'popular' && opt.category === 'popular') ||
      opt.category === category

    if (!matchCategory) return false
    if (!q) return true

    return (
      opt.id.toLowerCase().includes(q) ||
      opt.label.toLowerCase().includes(q) ||
      opt.category.toLowerCase().includes(q)
    )
  })
}
