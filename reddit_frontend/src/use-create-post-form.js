import { useState, useRef, useMemo } from 'react'
import toast from 'react-hot-toast'
import { getToken } from './api'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const bearer = () => getToken() ? { Authorization: `Bearer ${getToken()}` } : {}
const bearerJson = () => getToken() ? { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }

function insertAtCursor(textarea, before, after = '', defaultText = '') {
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selected = textarea.value.slice(start, end) || defaultText
  const newText = textarea.value.slice(0, start) + before + selected + after + textarea.value.slice(end)
  return { value: newText, cursor: start + before.length + selected.length + after.length }
}

function getInitialAttachments(post) {
  if (post?.attachments && Array.isArray(post.attachments)) return post.attachments
  if (post?.mediaUrl) {
    return [{
      type: post.mediaType || 'IMAGE',
      url: post.mediaUrl,
      name: post.mediaUrl.split('/').pop() || ''
    }]
  }
  return []
}

export function useCreatePostForm({ initialPost = null, onSuccess, onClose }) {
  const isEdit = Boolean(initialPost)
  const [newPost, setNewPost] = useState(() => ({
    title: initialPost?.title || '',
    content: initialPost?.content || '',
    subredditId: initialPost?.subredditId || initialPost?.subreddit?.id || ''
  }))
  const [attachments, setAttachments] = useState(() => getInitialAttachments(initialPost))
  const [attachmentsTouched, setAttachmentsTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const textareaRef = useRef(null)

  const [prevInitialPost, setPrevInitialPost] = useState(initialPost)
  if (initialPost !== prevInitialPost) {
    if (initialPost) {
      setNewPost({
        title: initialPost.title || '',
        content: initialPost.content || '',
        subredditId: initialPost.subredditId || initialPost.subreddit?.id || ''
      })
      setAttachments(getInitialAttachments(initialPost))
      setAttachmentsTouched(false)
    } else {
      setNewPost({ title: '', content: '', subredditId: '' })
      setAttachments([])
      setAttachmentsTouched(false)
    }
    setPrevInitialPost(initialPost)
  }

  const uploadFile = async (file, type) => {
    const fd = new FormData()
    fd.append('file', file)
    const tId = toast.loading('Uploading media...')
    try {
      const r = await fetch(`${API}/upload`, { method: 'POST', headers: bearer(), body: fd })
      const d = await r.json()
      if (!r.ok) throw new Error()
      toast.success('Uploaded!', { id: tId })
      return { type, url: d.url, name: file.name, size: file.size }
    } catch {
      toast.error('Upload failed', { id: tId })
      return null
    }
  }

  const handleToolbarFormat = (before, after, defaultText, e) => {
    e.preventDefault()
    const ta = textareaRef.current
    if (!ta) {
      setNewPost(p => ({
        ...p,
        content: p.content ? `${p.content}\n\n${before}${defaultText}${after}` : `${before}${defaultText}${after}`
      }))
      return
    }
    const { value, cursor } = insertAtCursor(ta, before, after, defaultText)
    setNewPost(p => ({ ...p, content: value }))
    setTimeout(() => { ta.focus(); ta.setSelectionRange(cursor, cursor) }, 0)
  }

  const handleInsertCodeSnippet = (formattedCode) => {
    const ta = textareaRef.current
    if (!ta) {
      setNewPost(p => ({
        ...p,
        content: p.content ? `${p.content.trim()}\n\n${formattedCode.trim()}` : formattedCode.trim()
      }))
      return
    }
    const { value, cursor } = insertAtCursor(ta, formattedCode, '', '')
    setNewPost(p => ({ ...p, content: value }))
    setTimeout(() => { ta.focus(); ta.setSelectionRange(cursor, cursor) }, 0)
  }

  const wordCount = useMemo(() => {
    const text = `${newPost.title} ${newPost.content}`.trim()
    return text ? text.split(/\s+/).filter(Boolean).length : 0
  }, [newPost.title, newPost.content])

  const readTimeMin = Math.max(1, Math.ceil(wordCount / 200))

  const submit = async (e) => {
    e.preventDefault()
    if (!newPost.title.trim() || !newPost.subredditId) return
    setSubmitting(true)
    const tId = toast.loading(isEdit ? 'Saving changes...' : 'Publishing article...')
    try {
      const payload = {
        title: newPost.title,
        content: newPost.content,
        subredditId: newPost.subredditId,
        ...(isEdit
          ? { ...(attachmentsTouched ? { attachments } : {}) }
          : { attachments: attachments.length ? attachments : undefined }
        )
      }

      const res = await fetch(`${API}/posts${isEdit ? `/${initialPost.id}` : ''}`, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: bearerJson(),
        body: JSON.stringify(payload)
      })
      const d = await res.json()
      if (!res.ok) {
        toast.error(d.error || 'Failed', { id: tId })
        return
      }
      toast.success(isEdit ? 'Article updated!' : 'Article published!', { id: tId })
      onSuccess?.(d)
      onClose()
    } catch {
      toast.error('Failed to connect to server', { id: tId })
    } finally {
      setSubmitting(false)
    }
  }

  return {
    isEdit,
    newPost,
    setNewPost,
    attachments,
    setAttachments,
    setAttachmentsTouched,
    submitting,
    wordCount,
    readTimeMin,
    uploadFile,
    handleToolbarFormat,
    handleInsertCodeSnippet,
    submit
  }
}
