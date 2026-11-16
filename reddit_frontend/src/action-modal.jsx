import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'
import CommentComposer from './CommentComposer'
import { getToken } from './api'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const bearer = () => getToken() ? { Authorization: `Bearer ${getToken()}` } : {}

/**
 * Isolated Action Modal: handles REPORT, DELETE, DELETE_COMMENT, DELETE_SUB, NOTE, EDIT_COMMENT.
 * Completely isolates form input state and network actions to eliminate parent feed re-renders.
 */
const ActionModal = React.memo(function ActionModal({
  action, // { type, post }
  onClose,
  onSuccess
}) {
  const { type, post } = action || {}
  const [text, setText] = useState(type === 'EDIT_COMMENT' ? (post?.content || '') : '')
  const [attachments, setAttachments] = useState(type === 'EDIT_COMMENT' ? (post?.attachments || []) : [])
  const [submitting, setSubmitting] = useState(false)

  // Escape key support
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!action || !type) return null

  const getTitle = () => {
    switch (type) {
      case 'REPORT':
        return 'Report Post'
      case 'DELETE':
        return 'Confirm Post Deletion'
      case 'DELETE_SUB':
        return 'Delete Community'
      case 'DELETE_COMMENT':
        return 'Delete Comment'
      case 'EDIT_COMMENT':
        return 'Edit Comment'
      case 'NOTE':
        return 'Add Community Note'
      default:
        return 'Confirm Action'
    }
  }

  const handleExecute = async () => {
    if (submitting) return
    const tid = toast.loading('Processing...')
    setSubmitting(true)

    try {
      if (type === 'REPORT') {
        const cleanReason = text.trim()
        if (!cleanReason) {
          toast.error('Reason required', { id: tid })
          setSubmitting(false)
          return
        }
        await fetch(`${API}/reports`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...bearer() },
          body: JSON.stringify({ type: 'POST', targetId: post.id, reason: cleanReason })
        })
        toast.success('Report sent!', { id: tid })
        onSuccess?.({ type, post, reason: cleanReason })
      } else if (type === 'DELETE') {
        await fetch(`${API}/posts/${post.id}`, { method: 'DELETE', headers: { ...bearer() } })
        toast.success('Post deleted', { id: tid })
        onSuccess?.({ type, post })
      } else if (type === 'DELETE_COMMENT') {
        await fetch(`${API}/comments/${post.id}`, { method: 'DELETE', headers: { ...bearer() } })
        toast.success('Comment deleted', { id: tid })
        onSuccess?.({ type, post })
      } else if (type === 'DELETE_SUB') {
        await fetch(`${API}/subreddits/${post.subreddit?.name || post.name}`, { method: 'DELETE', headers: { ...bearer() } })
        toast.success('Community deleted', { id: tid })
        onSuccess?.({ type, post })
      } else if (type === 'NOTE') {
        const cleanNote = text.trim()
        if (!cleanNote) {
          toast.error('Note required', { id: tid })
          setSubmitting(false)
          return
        }
        await fetch(`${API}/posts/${post.id}/note`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...bearer() },
          body: JSON.stringify({ communityNote: cleanNote })
        })
        toast.success('Note added!', { id: tid })
        onSuccess?.({ type, post, note: cleanNote })
      }
      onClose()
    } catch {
      toast.error('Action failed', { id: tid })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditCommentSubmit = async (content, updatedAttachments) => {
    const tid = toast.loading('Saving...')
    try {
      const payload = { content, ...(updatedAttachments.length ? { attachments: updatedAttachments } : {}) }
      const res = await fetch(`${API}/comments/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...bearer() },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        toast.success('Comment updated', { id: tid })
        onSuccess?.({ type: 'EDIT_COMMENT', post, content, attachments: updatedAttachments })
        onClose()
      } else {
        throw new Error()
      }
    } catch {
      toast.error('Failed to save', { id: tid })
    }
  }

  const isDeleteAction = type.startsWith('DELETE')

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
          <h3>{getTitle()}</h3>
          <button type="button" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {isDeleteAction ? (
            <p style={{ margin: '8px 0 16px', color: 'var(--text-2)', lineHeight: 1.5 }}>
              Are you sure you want to permanently delete this? This action cannot be undone.
            </p>
          ) : type === 'EDIT_COMMENT' ? (
            <CommentComposer
              onSubmit={handleEditCommentSubmit}
              onCancel={onClose}
              initialContent={text}
              initialAttachments={attachments}
              submitLabel="Save"
              placeholder="Edit your comment…"
            />
          ) : (
            <textarea
              autoFocus
              placeholder={type === 'REPORT' ? 'Reason for reporting...' : 'Enter your community note...'}
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              maxLength={500}
              style={{ width: '100%', resize: 'vertical' }}
            />
          )}

          {type !== 'EDIT_COMMENT' && (
            <div className="modal-footer" style={{ marginTop: 16 }}>
              <button type="button" className="btn-outline" onClick={onClose}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-post"
                style={{ background: isDeleteAction ? 'var(--red)' : 'var(--primary)' }}
                disabled={submitting}
                onClick={handleExecute}
              >
                {isDeleteAction ? 'Delete' : 'Submit'}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
})

export default ActionModal
