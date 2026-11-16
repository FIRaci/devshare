import React from 'react'

/**
 * Official SVG brand logos for programming languages and data formats.
 * Crisp vector representations matching official developer brand documentation.
 */

export function PythonIcon({ size = 18, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" className={className}>
      <path fill="#3776AB" d="M63.5 8C33.4 8 35.3 21 35.3 21l.1 13.5h28.7v4.1H23.5S8 36.9 8 67.2c0 30.3 13.7 29.3 13.7 29.3h8.2v-11.6s-.4-13.8 13.6-13.8h28.4s13.3.2 13.3-13.1V21.1S88.9 8 63.5 8zm-15.3 8.3c2.7 0 4.8 2.2 4.8 4.9 0 2.7-2.2 4.9-4.8 4.9s-4.8-2.2-4.8-4.9c0-2.7 2.1-4.9 4.8-4.9z"/>
      <path fill="#FFD43B" d="M64.5 120c30.1 0 28.2-13 28.2-13l-.1-13.5H63.9v-4.1h40.6s15.5 1.7 15.5-28.6c0-30.3-13.7-29.3-13.7-29.3h-8.2v11.6s.4 13.8-13.6 13.8H46.1s-13.3-.2-13.3 13.1v36.9s-1.7 13.1 23.7 13.1zm15.3-8.3c-2.7 0-4.8-2.2-4.8-4.9 0-2.7 2.2-4.9 4.8-4.9s4.8 2.2 4.8 4.9c0 2.7-2.1 4.9-4.8 4.9z"/>
    </svg>
  )
}

export function TypeScriptIcon({ size = 18, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" className={className}>
      <rect width="128" height="128" rx="20" fill="#3178C6"/>
      <path fill="#FFFFFF" d="M70.5 73.1c0 6.6 2.3 11.2 8.4 13.5 4.6 1.7 10.7 1.8 15.7-.3 3.6-1.5 5.8-4.3 6.4-8 .9-5.1-1.3-8.9-7-11.8l-8.5-4.4c-6.8-3.4-11.2-6.5-13.3-9.5-3.3-4.6-3.8-10.4-1.4-15.7 3.3-7.3 10.8-11.5 20.8-11.5 11.8 0 20.1 5.3 22.8 14.5l-11.1 5.4c-1.6-4.6-5.2-7.3-10.8-7.3-3.6 0-6.7 1.1-8.5 2.9-2 2-2.5 4.6-1.7 7.2 1 3.2 4.1 5.4 9.5 8.1l8.7 4.5c8.3 4.2 13.5 8.2 15.8 12.3 3.3 5.9 3.1 13.2-.6 19.3-4.5 7.4-13.4 11.7-24.8 11.7-16.1 0-26.6-7.8-28.7-21.6l13-3.3zM23.1 42.4h39.7v12.2H47.4v48.6H33.2V54.6H23.1V42.4z"/>
    </svg>
  )
}

export function JupyterIcon({ size = 18, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" className={className}>
      <path fill="#767677" d="M64 12c-28.7 0-52 23.3-52 52 0 13.2 5 25.3 13.3 34.4l-7.3 7.3C9.2 94.6 4 80 4 64 4 30.9 30.9 4 64 4c16 0 30.6 5.2 41.7 14l-7.3 7.3C89.3 17 77.2 12 64 12z"/>
      <path fill="#F37626" d="M64 124c28.7 0 52-23.3 52-52 0-13.2-5-25.3-13.3-34.4l7.3-7.3C118.8 33.4 124 48 124 64c0 33.1-26.9 60-60 60-16 0-30.6-5.2-41.7-14l7.3-7.3c9.1 8.3 21.2 13.3 34.4 13.3z"/>
      <circle cx="64" cy="64" r="14" fill="#F37626"/>
      <circle cx="38" cy="44" r="9" fill="#767677"/>
      <circle cx="90" cy="84" r="9" fill="#F37626"/>
    </svg>
  )
}

export function SQLIcon({ size = 18, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" className={className}>
      <ellipse cx="64" cy="28" rx="46" ry="16" fill="#336791"/>
      <path fill="#295173" d="M18 28v24c0 8.8 20.6 16 46 16s46-7.2 46-16V28H18z"/>
      <path fill="#336791" d="M18 52v24c0 8.8 20.6 16 46 16s46-7.2 46-16V52H18z"/>
      <path fill="#295173" d="M18 76v24c0 8.8 20.6 16 46 16s46-7.2 46-16V76H18z"/>
      <circle cx="94" cy="98" r="14" fill="#00BCD4"/>
      <path fill="#FFFFFF" d="M91 91l7 7-7 7" stroke="#FFF" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

export function TerminalIcon({ size = 18, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" className={className}>
      <rect x="8" y="16" width="112" height="96" rx="16" fill="#181824" stroke="#334155" strokeWidth="4"/>
      <circle cx="26" cy="30" r="4.5" fill="#EF4444"/>
      <circle cx="39" cy="30" r="4.5" fill="#F59E0B"/>
      <circle cx="52" cy="30" r="4.5" fill="#10B981"/>
      <path d="M28 58l18 14-18 14" stroke="#4ADE80" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <line x1="58" y1="86" x2="84" y2="86" stroke="#4ADE80" strokeWidth="6" strokeLinecap="round"/>
    </svg>
  )
}

export function JSONIcon({ size = 18, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" className={className}>
      <rect width="128" height="128" rx="20" fill="#292929"/>
      <text x="64" y="78" fill="#FACC15" fontFamily="monospace" fontSize="48" fontWeight="bold" textAnchor="middle">{"{ }"}</text>
    </svg>
  )
}

export function HTMLIcon({ size = 18, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" className={className}>
      <path fill="#E34F26" d="M19.1 113.6L9.6 7.4h108.8l-9.5 106.2-44.9 12.4z"/>
      <path fill="#EF652A" d="M64 116.8l37.2-10.3 8-89.5H64z"/>
      <path fill="#EBEBEB" d="M64 47.9H44.6l-1.3-14.8H64V19.8H26.3L30 61.2H64zm0 39.8l-.2.1-15.6-4.2-1-11.2H33.8l1.9 21.9 28.1 7.8.2-.1z"/>
      <path fill="#FFFFFF" d="M63.9 61.2h18.2l-1.7 19.3-16.5 4.4V99l28.2-7.8.2-2.3 3.3-36.6.9-10.4.9-9.8H63.9v13.3h33.8l-1.2 13.3H63.9z"/>
    </svg>
  )
}

export function RustIcon({ size = 18, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" className={className}>
      <circle cx="64" cy="64" r="54" fill="#000000" stroke="#CE412B" strokeWidth="4"/>
      <circle cx="64" cy="64" r="42" fill="#CE412B"/>
      <text x="64" y="80" fill="#FFFFFF" fontFamily="sans-serif" fontSize="56" fontWeight="900" textAnchor="middle">R</text>
    </svg>
  )
}

export function GoIcon({ size = 18, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" className={className}>
      <rect width="128" height="128" rx="20" fill="#00ADD8"/>
      <text x="64" y="78" fill="#FFFFFF" fontFamily="sans-serif" fontSize="44" fontWeight="900" textAnchor="middle">GO</text>
    </svg>
  )
}

/**
 * Returns the official brand icon component for a given language ID.
 */
export function getLanguageBrandIcon(langId = '', size = 18) {
  const l = (langId || '').toLowerCase()
  if (['py', 'python', 'python3'].includes(l)) return <PythonIcon size={size} />
  if (['ts', 'tsx', 'typescript', 'js', 'javascript'].includes(l)) return <TypeScriptIcon size={size} />
  if (['ipynb', 'jupyter', 'notebook'].includes(l)) return <JupyterIcon size={size} />
  if (['sql', 'mysql', 'postgres', 'sqlite'].includes(l)) return <SQLIcon size={size} />
  if (['sh', 'bash', 'zsh', 'terminal', 'cmd'].includes(l)) return <TerminalIcon size={size} />
  if (['json'].includes(l)) return <JSONIcon size={size} />
  if (['html', 'css', 'htm'].includes(l)) return <HTMLIcon size={size} />
  if (['go', 'golang'].includes(l)) return <GoIcon size={size} />
  return <RustIcon size={size} />
}
