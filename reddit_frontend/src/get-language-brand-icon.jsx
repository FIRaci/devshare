import React from 'react'
import {
  PythonIcon,
  TypeScriptIcon,
  JupyterIcon,
  SQLIcon,
  TerminalIcon,
  JSONIcon,
  HTMLIcon,
  RustIcon,
  GoIcon,
  DockerIcon,
  GenericBadgeIcon
} from './language-icons'

export function getLanguageBrandIcon(langId = '', size = 18) {
  const l = (langId || '').toLowerCase()
  if (['py', 'python', 'python3'].includes(l)) return <PythonIcon size={size} />
  if (['ts', 'tsx', 'typescript', 'js', 'javascript'].includes(l)) return <TypeScriptIcon size={size} />
  if (['jsx', 'react'].includes(l)) return <GenericBadgeIcon size={size} label="JSX" bg="#087EA4" />
  if (['ipynb', 'jupyter', 'notebook'].includes(l)) return <JupyterIcon size={size} />
  if (['sql', 'mysql', 'postgres', 'sqlite'].includes(l)) return <SQLIcon size={size} />
  if (['sh', 'bash', 'zsh', 'terminal', 'cmd'].includes(l)) return <TerminalIcon size={size} />
  if (['json'].includes(l)) return <JSONIcon size={size} />
  if (['html', 'css', 'htm', 'tailwind'].includes(l)) return <HTMLIcon size={size} />
  if (['go', 'golang'].includes(l)) return <GoIcon size={size} />
  if (['rust', 'rs'].includes(l)) return <RustIcon size={size} />
  if (['dockerfile', 'docker', 'docker-compose'].includes(l)) return <DockerIcon size={size} />
  if (['cpp', 'c++', 'c'].includes(l)) return <GenericBadgeIcon size={size} label="C++" bg="#00599C" />
  if (['csharp', 'cs', 'c#', 'dotnet'].includes(l)) return <GenericBadgeIcon size={size} label="C#" bg="#68217A" />
  if (['java'].includes(l)) return <GenericBadgeIcon size={size} label="JAVA" bg="#EA2D2E" />
  if (['php'].includes(l)) return <GenericBadgeIcon size={size} label="PHP" bg="#777BB4" />
  if (['ruby', 'rb'].includes(l)) return <GenericBadgeIcon size={size} label="RB" bg="#CC342D" />
  if (['swift'].includes(l)) return <GenericBadgeIcon size={size} label="SW" bg="#F05138" />
  if (['kotlin', 'kt'].includes(l)) return <GenericBadgeIcon size={size} label="KT" bg="#7F52FF" />
  if (['dart', 'flutter'].includes(l)) return <GenericBadgeIcon size={size} label="DART" bg="#0175C2" />
  if (['yaml', 'yml'].includes(l)) return <GenericBadgeIcon size={size} label="YML" bg="#CB171E" />
  if (['graphql', 'gql'].includes(l)) return <GenericBadgeIcon size={size} label="GQL" bg="#E10098" />
  if (['solidity', 'sol'].includes(l)) return <GenericBadgeIcon size={size} label="SOL" bg="#363636" />
  if (['r'].includes(l)) return <GenericBadgeIcon size={size} label="R" bg="#276DC3" />
  return <GenericBadgeIcon size={size} label="< / >" bg="#334155" />
}
