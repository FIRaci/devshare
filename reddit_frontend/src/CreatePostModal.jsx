import React, { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import CodeInsertModal from './code-insert-modal'
import NotebookEditor from './notebook-editor'
import { PostPreviewCard } from './post-preview-card'
import { PostAttachmentSection } from './post-attachment-section'
import { PostModalHeader } from './post-modal-header'
import { PostModalFooter } from './post-modal-footer'
import { PostModalCommunityPrompt } from './post-modal-community-prompt'
import { useCreatePostForm } from './use-create-post-form'

const CreatePostModal = React.memo(function CreatePostModal({
  subreddits = [],
  joinedSubs = new Set(),
  user,
  onClose,
  onSuccess,
  onExploreRedirect,
  initialPost = null
}) {
  const [viewMode, setViewMode] = useState('editor') // 'editor' | 'split' | 'preview'
  const [showCodeModal, setShowCodeModal] = useState(false)

  const {
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
    handleInsertCodeSnippet,
    submit
  } = useCreatePostForm({ initialPost, onSuccess, onClose })

  // Lock background body scroll while modal is active
  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [])

  const availableSubreddits = useMemo(() => {
    return subreddits.filter(s => joinedSubs.has(s.name))
  }, [subreddits, joinedSubs])

  const currentSub = availableSubreddits.find(s => s.id === newPost.subredditId)

  const renderEditorWorkspace = () => (
    <>
      <NotebookEditor
        value={newPost.content}
        onChange={val => setNewPost(p => ({ ...p, content: val }))}
      />
      <PostAttachmentSection
        attachments={attachments}
        onAddAttachment={att => {
          setAttachments(prev => [...prev, att])
          setAttachmentsTouched(true)
        }}
        onRemoveAttachment={idx => {
          setAttachments(prev => prev.filter((_, i) => i !== idx))
          setAttachmentsTouched(true)
        }}
        uploadFile={uploadFile}
      />
    </>
  )

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
        className="modal modal-wide modal-blog-editor"
        initial={{ scale: 0.96, opacity: 0, y: 6 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 6 }}
        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
        onClick={e => e.stopPropagation()}
      >
        <PostModalHeader
          isEdit={isEdit}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onClose={onClose}
        />

        {availableSubreddits.length === 0 ? (
          <PostModalCommunityPrompt
            onClose={onClose}
            onExploreRedirect={onExploreRedirect}
          />
        ) : (
          <form onSubmit={submit} className="modal-post-form">
            <div className="modal-body modal-scroll-area">
              <div className="blog-meta-select-bar">
                <label className="blog-community-picker">
                  <span className="blog-picker-label">Publishing to:</span>
                  <select
                    className="blog-community-select"
                    value={newPost.subredditId}
                    onChange={e => setNewPost(p => ({ ...p, subredditId: e.target.value }))}
                    required
                  >
                    <option value="">Choose a community... *</option>
                    {availableSubreddits.map(s => (
                      <option key={s.id} value={s.id}>
                        d/{s.name}
                      </option>
                    ))}
                  </select>
                </label>

                {currentSub && (
                  <span className="blog-community-badge">
                    d/{currentSub.name}
                  </span>
                )}
              </div>

              <div className="blog-title-group">
                <input
                  type="text"
                  className="blog-title-input"
                  placeholder="Title of your blog post or code snippet... *"
                  value={newPost.title}
                  onChange={e => setNewPost(p => ({ ...p, title: e.target.value }))}
                  required
                  maxLength={300}
                />
                <span className="blog-title-counter">{newPost.title.length}/300</span>
              </div>

              {viewMode === 'split' ? (
                <div className="post-split-layout">
                  <div className="post-split-col post-split-editor-col">
                    {renderEditorWorkspace()}
                  </div>
                  <div className="post-split-col post-split-preview-col">
                    <PostPreviewCard
                      title={newPost.title}
                      content={newPost.content}
                      subredditName={currentSub?.name || ''}
                      authorName={user?.username || 'you'}
                      attachments={attachments}
                    />
                  </div>
                </div>
              ) : viewMode === 'preview' ? (
                <PostPreviewCard
                  title={newPost.title}
                  content={newPost.content}
                  subredditName={currentSub?.name || ''}
                  authorName={user?.username || 'you'}
                  attachments={attachments}
                />
              ) : (
                renderEditorWorkspace()
              )}
            </div>

            <PostModalFooter
              wordCount={wordCount}
              readTimeMin={readTimeMin}
              isEdit={isEdit}
              submitting={submitting}
              disabled={!newPost.title.trim() || !newPost.subredditId}
              onClose={onClose}
            />
          </form>
        )}
      </motion.div>

      <CodeInsertModal
        isOpen={showCodeModal}
        onClose={() => setShowCodeModal(false)}
        onInsert={handleInsertCodeSnippet}
      />
    </motion.div>
  )
})

export default CreatePostModal
