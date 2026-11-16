import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'
import { getToken } from './api'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const bearer = () => getToken() ? { Authorization: `Bearer ${getToken()}` } : {}

/**
 * Isolated modal component for creating a new community/subreddit.
 * State is isolated locally so keystrokes do NOT re-render the parent App.
 */
const CreateCommunityModal = React.memo(function CreateCommunityModal({ onClose, onSuccess }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const submitSub = async (e) => {
    e.preventDefault()
    const cleanName = name.trim().replace(/\s/g, '_')
    if (!cleanName || cleanName.length < 3) {
      toast.error('Community name must be at least 3 characters')
      return
    }
    if (submitting) return
    setSubmitting(true)
    const tId = toast.loading('Creating...')

    try {
      const res = await fetch(`${API}/subreddits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...bearer() },
        body: JSON.stringify({ name: cleanName, description: description.trim() })
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Failed to create community', { id: tId })
        return
      }
      toast.success(`d/${cleanName} created!`, { id: tId })
      onSuccess?.(data, cleanName)
      onClose()
    } catch {
      toast.error('Failed to connect to server', { id: tId })
    } finally {
      setSubmitting(false)
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
        className="modal"
        initial={{ scale: 0.96, opacity: 0, y: 6 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 6 }}
        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h3>Create Community</h3>
          <button type="button" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={submitSub} className="modal-body">
          <div className="prefix-input">
            <span>d/</span>
            <input
              type="text"
              placeholder="community_name"
              value={name}
              onChange={(e) => setName(e.target.value.replace(/\s/g, '_'))}
              required
              minLength={3}
              maxLength={21}
              autoFocus
            />
          </div>
          <small className="input-hint">{name.length}/21</small>
          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={300}
          />
          <div className="modal-footer">
            <button type="button" className="btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-post" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
})

export default CreateCommunityModal
