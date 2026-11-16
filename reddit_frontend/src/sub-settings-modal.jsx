import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Settings as SettingsIcon, X, Edit3, Users, Shield, Crown } from 'lucide-react'
import toast from 'react-hot-toast'
import UserAvatar from './UserAvatar'
import { getToken } from './api'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const bearer = () => getToken() ? { Authorization: `Bearer ${getToken()}` } : {}

/**
 * Isolated Subreddit Settings Modal.
 * Localizes tab switching, moderator adding/removal, and description edits
 * to completely eliminate parent feed/App re-renders.
 */
const SubSettingsModal = React.memo(function SubSettingsModal({
  subredditName,
  user,
  subreddits = [],
  onClose,
  onSaved
}) {
  const [tab, setTab] = useState('info')
  const [desc, setDesc] = useState('')
  const [members, setMembers] = useState([])
  const [saving, setSaving] = useState(false)
  const modAddRef = useRef(null)

  const currentSub = subreddits.find((s) => s.name === subredditName)
  const isOwnerOrAdmin = user?.role === 'ADMIN' || currentSub?.creator?.id === user?.id

  // Fetch initial subreddit details & member roster
  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch(`${API}/subreddits/${subredditName}/members`)
      if (res.ok) {
        const data = await res.json()
        setMembers(data)
      }
    } catch {
      // Ignored
    }
  }, [subredditName])

  useEffect(() => {
    if (currentSub?.description) {
      setDesc(currentSub.description)
    }
    fetchMembers()
  }, [currentSub, fetchMembers])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleSaveDescription = async () => {
    setSaving(true)
    const tid = toast.loading('Saving...')
    try {
      const r = await fetch(`${API}/subreddits/${subredditName}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...bearer() },
        body: JSON.stringify({ description: desc })
      })
      if (r.ok) {
        toast.success('Saved!', { id: tid })
        onSaved?.()
        onClose()
      } else {
        throw new Error()
      }
    } catch {
      toast.error('Failed to save', { id: tid })
    } finally {
      setSaving(false)
    }
  }

  const handleAddModerator = async () => {
    const inp = modAddRef.current
    if (!inp) return
    const uid = inp.value.trim()
    if (!uid) return
    const tid = toast.loading('Adding moderator...')
    try {
      const r = await fetch(`${API}/subreddits/${subredditName}/moderators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...bearer() },
        body: JSON.stringify({ userId: uid })
      })
      const d = await r.json()
      if (r.ok) {
        toast.success(d.message || 'Moderator added', { id: tid })
        inp.value = ''
        fetchMembers()
      } else {
        toast.error(d.error || 'Failed to add moderator', { id: tid })
      }
    } catch {
      toast.error('Failed to add moderator', { id: tid })
    }
  }

  const handleRemoveModerator = async (memberId) => {
    const tid = toast.loading('Removing...')
    try {
      const r = await fetch(`${API}/subreddits/${subredditName}/moderators/${memberId}`, {
        method: 'DELETE',
        headers: { ...bearer() }
      })
      if (r.ok) {
        toast.success('Removed', { id: tid })
        fetchMembers()
      } else {
        throw new Error()
      }
    } catch {
      toast.error('Failed to remove moderator', { id: tid })
    }
  }

  return (
    <motion.div
      className="modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
      onClick={onClose}
    >
      <motion.div
        className="modal modal-wide"
        initial={{ scale: 0.96, opacity: 0, y: 6 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 6 }}
        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h3>
            <SettingsIcon size={16} style={{ marginRight: 6, display: 'inline', verticalAlign: 'text-bottom' }} />
            d/{subredditName} Settings
          </h3>
          <button type="button" onClick={onClose} aria-label="Close settings">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', gap: 0, padding: 0, maxHeight: '60vh' }}>
          {/* Settings Left Tabs */}
          <div className="settings-tabs" style={{ width: 140, borderRight: '1px solid var(--border)', padding: '12px 0', flexShrink: 0 }}>
            {[
              { id: 'info', label: 'Info', icon: <Edit3 size={14} /> },
              { id: 'members', label: 'Members', icon: <Users size={14} /> },
              { id: 'moderators', label: 'Moderators', icon: <Shield size={14} /> }
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`settings-tab ${tab === t.id ? 'active' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '10px 16px',
                  border: 'none',
                  background: tab === t.id ? 'var(--surface-hover)' : 'transparent',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  fontSize: 13,
                  textAlign: 'left'
                }}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          {/* Settings Right Tab Pane */}
          <div style={{ flex: 1, padding: 16, overflowY: 'auto' }}>
            {tab === 'info' && (
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>
                  Description
                </label>
                <textarea
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  rows={4}
                  maxLength={500}
                  style={{ width: '100%' }}
                  placeholder="Describe your community rules, mission, and topics..."
                />
                <div className="modal-footer" style={{ marginTop: 12 }}>
                  <button type="button" className="btn-outline" onClick={onClose}>
                    Cancel
                  </button>
                  <button type="button" className="btn-post" disabled={saving} onClick={handleSaveDescription}>
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            )}

            {tab === 'members' && (
              <div>
                <h4 style={{ margin: '0 0 12px', fontSize: 14 }}>Members ({members.length})</h4>
                {members.length === 0 ? (
                  <p style={{ color: 'var(--text-2)', fontSize: 13 }}>No members yet.</p>
                ) : (
                  members.map((m) => (
                    <div
                      key={m.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 0',
                        borderBottom: '1px solid var(--border)'
                      }}
                    >
                      <UserAvatar user={m} size={28} />
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 13 }}>u/{m.username}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-2)', marginLeft: 4 }}>({m.role})</span>
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{m.karma} karma</span>
                    </div>
                  ))
                )}
              </div>
            )}

            {tab === 'moderators' && (
              <div>
                <h4 style={{ margin: '0 0 12px', fontSize: 14 }}>Moderators</h4>
                {members
                  .filter((m) => m.role === 'OWNER' || m.role === 'MODERATOR')
                  .map((m) => (
                    <div
                      key={m.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 0',
                        borderBottom: '1px solid var(--border)'
                      }}
                    >
                      <UserAvatar user={m} size={28} />
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 13 }}>u/{m.username}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-2)', marginLeft: 4 }}>
                          {m.role === 'OWNER' ? (
                            <>
                              <Crown size={11} style={{ color: '#f59e0b', display: 'inline', marginRight: 2 }} />
                              Owner
                            </>
                          ) : (
                            'Moderator'
                          )}
                        </span>
                      </div>
                      {m.role === 'MODERATOR' && isOwnerOrAdmin && (
                        <button
                          type="button"
                          className="btn-outline"
                          style={{ padding: '3px 8px', fontSize: 11, color: 'var(--red)' }}
                          onClick={() => handleRemoveModerator(m.id)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}

                {isOwnerOrAdmin && (
                  <div style={{ marginTop: 16 }}>
                    <p style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 8 }}>
                      Add a moderator by user ID:
                    </p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        ref={modAddRef}
                        placeholder="User ID..."
                        style={{ flex: 1 }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleAddModerator()
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="btn-post"
                        style={{ padding: '6px 12px', fontSize: 12 }}
                        onClick={handleAddModerator}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
})

export default SubSettingsModal
