import React, { useState, useEffect, useCallback, useRef, useMemo, useDeferredValue } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast, { Toaster } from 'react-hot-toast'
import { Search, Plus, MessageSquare, ArrowBigUp, ArrowBigDown, Share2, Bookmark, Home, TrendingUp, LayoutGrid, Moon, Sun, Bell, X, ArrowLeft, Send, Clock, Flame, Award, Layers, ChevronDown, LogIn, PanelLeftClose, PanelLeftOpen, Edit3, Settings as SettingsIcon, Shield, Users, Crown, ArrowUpDown, Compass } from 'lucide-react'
import { useAuth } from './AuthContext'
import AuthPage from './AuthPage'
import ProfilePage from './ProfilePage'
import MediaRenderer from './MediaRenderer'
import MarkdownRenderer from './MarkdownRenderer'
import CreatePostModal from './CreatePostModal'
import CreateCommunityModal from './create-community-modal'
import SubSettingsModal from './sub-settings-modal'
import ActionModal from './action-modal'
import ExploreCommunities from './ExploreCommunities'
import CommentComposer from './CommentComposer'
import UserAvatar from './UserAvatar'
import { getToken } from './api'
import './App.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const bearer = () => getToken() ? { Authorization: `Bearer ${getToken()}` } : {}
const bearerJson = () => getToken() ? { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
const timeAgo = (d) => { const diff=Date.now()-new Date(d).getTime(),m=Math.floor(diff/60000); if(m<1)return 'just now'; if(m<60)return `${m}m`; const h=Math.floor(m/60); if(h<24)return `${h}h`; return `${Math.floor(h/24)}d` }
const applyVote = (votes, type, uid) => { if(!uid)return votes; const ex=votes.find(v=>v.userId===uid); if(ex?.type===type) return votes.filter(v=>v.userId!==uid); return [...votes.filter(v=>v.userId!==uid),{type,userId:uid}] }
const getScore = (votes=[]) => votes.reduce((a,v)=>a+(v.type==='UP'?1:-1),0)
const myVote = (votes, uid) => votes?.find(v=>v.userId===uid)?.type??null

// ── VoteButtons (filled icons when active) ───────────────────────────────────
const VoteButtons = React.memo(function VoteButtons({ votes, onVote, onAuthRequired, size=22, vertical=true }) {
  const { user } = useAuth()
  const score = getScore(votes)
  const my = myVote(votes, user?.id)
  const Wrap = vertical ? 'div' : React.Fragment
  const wrapProps = vertical ? { className:'vote-col' } : {}
  const handleClick = (e, type) => {
    e.stopPropagation()
    if (!user) { onAuthRequired?.(); return }
    onVote(type)
  }
  return (
    <Wrap {...wrapProps}>
      <motion.button whileTap={{scale:1.35}} className={`v-btn up ${my==='UP'?'voted-up':''}`} onClick={e=>handleClick(e,'UP')}>
        <ArrowBigUp size={size} fill={my==='UP'?'currentColor':'none'} strokeWidth={my==='UP'?2:1.5}/>
      </motion.button>
      <motion.span key={score} initial={{scale:1.3}} animate={{scale:1}} className={`v-count ${score>0?'hot':score<0?'cold':''}`}>
        {Math.abs(score)>=1000?`${(score/1000).toFixed(1)}k`:score}
      </motion.span>
      <motion.button whileTap={{scale:1.35}} className={`v-btn down ${my==='DOWN'?'voted-down':''}`} onClick={e=>handleClick(e,'DOWN')}>
        <ArrowBigDown size={size} fill={my==='DOWN'?'currentColor':'none'} strokeWidth={my==='DOWN'?2:1.5}/>
      </motion.button>
    </Wrap>
  )
})

// ── CommentItem ──────────────────────────────────────────────────────────────
const CommentItem = React.memo(function CommentItem({ comment, depth=1, onReply, onAuthRequired, onAction, isMod }) {
  const { user } = useAuth()
  const [showReply, setShowReply] = useState(false)
  const [localVotes, setLocalVotes] = useState(comment.votes??[])

  const handleVote = async (type) => {
    if (!user) { onAuthRequired?.(); return }
    const prev=localVotes; setLocalVotes(applyVote(localVotes,type,user.id))
    try { const res=await fetch(`${API}/comments/${comment.id}/vote`,{method:'POST',headers:{'Content-Type':'application/json',...bearer()},body:JSON.stringify({type})}); if(!res.ok) throw new Error('Vote failed') }
    catch { setLocalVotes(prev) }
  }

  const submitReply = async (content, attachments) => {
    const payload = { content, postId: comment.postId, parentId: comment.id, attachments: attachments.length ? attachments : undefined }
    const res=await fetch(`${API}/comments`,{method:'POST',headers:{'Content-Type':'application/json',...bearer()},body:JSON.stringify(payload)})
    if(res.ok){toast.success('Reply posted!');setShowReply(false);onReply()}
    else toast.error('Reply failed')
  }

  const my=myVote(localVotes,user?.id),score=getScore(localVotes)
  return (
    <div className={`comment-item depth-${Math.min(depth,4)}`}>
      <div className="comment-vote-bar">
        <button className={`c-vote up ${my==='UP'?'active-up':''}`} onClick={()=>handleVote('UP')}><ArrowBigUp size={13} fill={my==='UP'?'currentColor':'none'} strokeWidth={my==='UP'?2:1.5}/></button>
        <span className={`c-score ${score>0?'pos':score<0?'neg':''}`}>{score}</span>
        <button className={`c-vote down ${my==='DOWN'?'active-down':''}`} onClick={()=>handleVote('DOWN')}><ArrowBigDown size={13} fill={my==='DOWN'?'currentColor':'none'} strokeWidth={my==='DOWN'?2:1.5}/></button>
      </div>
      <div className="comment-body">
        <div className="comment-meta"><span className="c-author" style={{display:'inline-flex',alignItems:'center',gap:4}}><UserAvatar user={comment.author} size={16} />u/{comment.author?.username}</span><span className="c-time">{timeAgo(comment.createdAt)}</span></div>
        <div className="c-content"><MarkdownRenderer content={comment.content} /></div>
        <MediaRenderer post={comment} />
        <div className="comment-actions">
          <button className="reply-btn" onClick={()=>{if(!user){onAuthRequired?.();return}setShowReply(s=>!s)}}><MessageSquare size={11}/> Reply</button>
          {(user?.role === 'ADMIN' || user?.username === comment.author?.username || isMod) && (
            <>
              {user?.username === comment.author?.username && <button className="reply-btn" onClick={() => onAction?.('EDIT_COMMENT', comment)} style={{color:'var(--text-2)'}}>Edit</button>}
              <button className="reply-btn" onClick={() => onAction?.('DELETE_COMMENT', comment)} style={{color:'var(--red)'}}>Delete</button>
            </>
          )}
        </div>
        <AnimatePresence>
          {showReply&&<motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}} className="reply-box">
            <CommentComposer onSubmit={submitReply} onCancel={()=>setShowReply(false)} placeholder="Your reply…" submitLabel="Reply" />
          </motion.div>}
        </AnimatePresence>
        {comment.replies?.length>0&&<div className="replies">{comment.replies.map(r=><CommentItem key={r.id} comment={{...r,postId:comment.postId}} depth={depth+1} onReply={onReply} onAuthRequired={onAuthRequired} onAction={onAction}/>)}</div>}
      </div>
    </div>
  )
})

// ── PostCard ─────────────────────────────────────────────────────────────────
const PostCard = React.memo(function PostCard({ post:init, onClick, onAuthRequired, onAction, onUserClick }) {
  const { user } = useAuth()
  const [post, setPost] = useState(init)
  useEffect(() => { setPost(init) }, [init])
  const invalidateCache = () => {
    const cached = sessionStorage.getItem('ds:posts')
    if (cached) {
      const posts = JSON.parse(cached)
      const idx = posts.findIndex(p => p.id === post.id)
      if (idx !== -1) posts[idx] = { ...posts[idx], bookmarks: post.bookmarks }
      sessionStorage.setItem('ds:posts', JSON.stringify(posts))
    }
  }
  const handleVote=async(type)=>{
    const prev=post.votes; setPost(p=>({...p,votes:applyVote(p.votes,type,user?.id)}))
    try{const res=await fetch(`${API}/posts/${post.id}/vote`,{method:'POST',headers:{'Content-Type':'application/json',...bearer()},body:JSON.stringify({type})}); if(!res.ok) throw new Error('Vote failed')}
    catch{setPost(p=>({...p,votes:prev}));toast.error('Vote failed')}
  }
  const handleSave = async (e) => {
    e.stopPropagation()
    if (!user) { onAuthRequired?.(); return }
    const prev = post.bookmarks
    const isSaved = post.bookmarks?.some(b => b.userId === user.id)
    setPost(p => ({ ...p, bookmarks: isSaved ? p.bookmarks.filter(b => b.userId !== user.id) : [...(p.bookmarks||[]), { userId: user.id }] }))
    try {
      const res = await fetch(`${API}/posts/${post.id}/save`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...bearer() } })
      if (!res.ok) throw new Error()
      const data = await res.json()
      if (data.saved) { toast.success('Saved!'); invalidateCache() }
      else { toast('Removed'); invalidateCache() }
    } catch { setPost(p => ({ ...p, bookmarks: prev })); toast.error('Failed to save') }
  }

  const isSaved = post.bookmarks?.some(b => b.userId === user?.id)

  return (
    <motion.div className="post-card" initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} whileHover={{y:-1}}>
      <VoteButtons votes={post.votes} onVote={handleVote} onAuthRequired={onAuthRequired}/>
      <div className="post-body" onClick={onClick}>
        <div className="post-meta"><span className="sub-badge">d/{post.subreddit?.name}</span><span className="meta-dot">·</span><span className="meta-user" style={{display:'inline-flex',alignItems:'center',gap:4}} onClick={e=>{e.stopPropagation(); onUserClick?.(post.author?.username)}}><UserAvatar user={post.author} size={16} />u/{post.author?.username}</span><span className="meta-dot">·</span><span className="meta-text">{timeAgo(post.createdAt)}</span></div>
        <h3 className="post-title">{post.title}</h3>
        {post.content&&<p className="post-excerpt">{post.content}</p>}
        <MediaRenderer post={post} isFeed={true} />
        {post.communityNote && (
          <div className="community-note">
            <strong>Community Note:</strong> {post.communityNote}
          </div>
        )}
        <div className="post-actions">
          <button className="action-btn" onClick={e=>{e.stopPropagation();onClick()}}><MessageSquare size={13}/>{post._count?.comments??0} Comments</button>
            <button className="action-btn" onClick={e=>{e.stopPropagation();navigator.clipboard.writeText(`${window.location.origin}#/post/${post.id}`);toast.success('Link copied!')}}><Share2 size={13}/> Share</button>
          <button className={`action-btn ${isSaved?'saved':''}`} onClick={handleSave}><Bookmark size={13} fill={isSaved?'currentColor':'none'}/> {isSaved?'Saved':'Save'}</button>
          <button className="action-btn" onClick={e=>{e.stopPropagation(); if(!user){onAuthRequired?.();return} onAction('REPORT', post)}} style={{color:'var(--red)'}}>Report</button>
          {user?.role === 'ADMIN' && (
            <>
              <button className="action-btn" onClick={e=>{e.stopPropagation(); onAction('DELETE', post)}} style={{color:'var(--red)'}}>Delete</button>
              <button className="action-btn" onClick={e=>{e.stopPropagation(); onAction('NOTE', post)}} style={{color:'var(--primary)'}}>Add Note</button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
})

// ── PostDetail ────────────────────────────────────────────────────────────────
function PostDetail({ post:init, onBack, onAuthRequired, onAction, onUserClick }) {
  const { user } = useAuth()
  const [post,setPost]=useState(init)
  const isMod = post?.subreddit?.moderators?.some(m => m.id === user?.id) ?? false
  const [comments,setComments]=useState([])
  const fetch2=useCallback(async()=>{try{const r=await fetch(`${API}/comments/post/${post.id}`);if(r.ok)setComments(await r.json())}catch{/* Ignored */}},[post.id])
  useEffect(() => {
    let active = true
    Promise.resolve().then(() => {
      if (active) fetch2()
    })
    return () => { active = false }
  }, [fetch2])
  const handleVote=async(type)=>{
    const prev=post.votes; setPost(p=>({...p,votes:applyVote(p.votes,type,user?.id)}))
    try{const res=await fetch(`${API}/posts/${post.id}/vote`,{method:'POST',headers:{'Content-Type':'application/json',...bearer()},body:JSON.stringify({type})}); if(!res.ok) throw new Error('Vote failed')}
    catch{setPost(p=>({...p,votes:prev}));toast.error('Vote failed')}
  }
  const submitComment=async(content, attachments)=>{
    if (!user) { onAuthRequired?.(); return }
    const payload = { content, postId: post.id, attachments: attachments.length ? attachments : undefined }
    const r=await fetch(`${API}/comments`,{method:'POST',headers:{'Content-Type':'application/json',...bearer()},body:JSON.stringify(payload)})
    if(r.ok){toast.success('Commented!');fetch2();setPost(p=>({...p,_count:{...p._count,comments:(p._count?.comments??0)+1}}))}
    else toast.error('Comment failed')
  }

  return (
    <motion.div initial={{opacity:0,x:16}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-16}} className="post-detail-view">
      <button className="back-btn" onClick={() => onBack(post)}><ArrowLeft size={15}/> Back</button>
      <div className="post-card detail-card">
        <VoteButtons votes={post.votes} onVote={handleVote} onAuthRequired={onAuthRequired}/>
        <div className="post-body">
          <div className="post-meta"><span className="sub-badge">d/{post.subreddit?.name}</span><span className="meta-dot">·</span><span className="meta-user" style={{display:'inline-flex',alignItems:'center',gap:4}} onClick={e=>{e.stopPropagation(); onUserClick?.(post.author?.username)}}><UserAvatar user={post.author} size={16} />u/{post.author?.username}</span><span className="meta-dot">·</span><span className="meta-text">{timeAgo(post.createdAt)}</span></div>
          <h1 className="post-title" style={{fontSize:24,margin:'0 0 16px 0',color:'var(--text)',lineHeight:1.3}}>{post.title}</h1>
          {post.content && <div style={{marginBottom:16}}><MarkdownRenderer content={post.content} /></div>}
          
          <MediaRenderer post={post} />
          
          {post.communityNote && (
            <div className="community-note">
              <strong>Community Note:</strong> {post.communityNote}
            </div>
          )}
          <div className="post-actions">
          <button className="action-btn" onClick={e=>{e.stopPropagation();navigator.clipboard.writeText(`${window.location.origin}#/post/${post.id}`);toast.success('Link copied!')}}><Share2 size={13}/> Share</button>
            <button className={`action-btn ${post.bookmarks?.some(b=>b.userId===user?.id)?'saved':''}`} onClick={async(e)=>{e.stopPropagation();if(!user){onAuthRequired?.();return}const prev=post.bookmarks;const isSaved=post.bookmarks?.some(b=>b.userId===user.id);setPost(p=>({...p,bookmarks:isSaved?p.bookmarks.filter(b=>b.userId!==user.id):[...(p.bookmarks||[]),{userId:user.id}]}));try{const res=await fetch(`${API}/posts/${post.id}/save`,{method:'POST',headers:{'Content-Type':'application/json',...bearer()}});if(!res.ok)throw new Error();const data=await res.json();if(data.saved)toast.success('Saved!');else toast('Removed');const cached=sessionStorage.getItem('ds:posts');if(cached){const posts=JSON.parse(cached);const idx=posts.findIndex(p=>p.id===post.id);if(idx!==-1)posts[idx]={...posts[idx],bookmarks:post.bookmarks};sessionStorage.setItem('ds:posts',JSON.stringify(posts))}}catch{setPost(p=>({...p,bookmarks:prev}));toast.error('Failed to save')}}}><Bookmark size={13} fill={post.bookmarks?.some(b=>b.userId===user?.id)?'currentColor':'none'}/> {post.bookmarks?.some(b=>b.userId===user?.id)?'Saved':'Save'}</button>
            <button className="action-btn" onClick={e=>{e.stopPropagation(); if(!user){onAuthRequired?.();return} onAction('REPORT', post)}} style={{color:'var(--red)'}}>Report</button>
            {(user?.role === 'ADMIN' || user?.username === post.author?.username) && (
              <>
                <button className="action-btn" onClick={e=>{e.stopPropagation(); onAction('EDIT_POST', post)}} style={{color:'var(--text-2)'}}>Edit</button>
                <button className="action-btn" onClick={e=>{e.stopPropagation(); onAction('DELETE', post)}} style={{color:'var(--red)'}}>Delete</button>
              </>
            )}
            {user?.role === 'ADMIN' && (
              <button className="action-btn" onClick={e=>{e.stopPropagation(); onAction('NOTE', post)}} style={{color:'var(--primary)'}}>Add Note</button>
            )}
          </div>
        </div>
      </div>
      <div className="comments-panel">
        <h4 className="comments-heading">{post._count?.comments??0} Comments</h4>
        {!user
          ? <div className="auth-prompt" onClick={onAuthRequired}><LogIn size={16}/> Log in to comment and vote</div>
          : <CommentComposer onSubmit={submitComment} />
        }
        {comments.length===0
          ?<div className="empty-comments"><MessageSquare size={34}/><p>No comments yet.</p></div>
          :<div className="comment-list">{comments.map(c=><CommentItem key={c.id} comment={{...c,postId:post.id}} onReply={fetch2} onAuthRequired={onAuthRequired} onAction={onAction} isMod={isMod}/>)}</div>
        }
      </div>
    </motion.div>
  )
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const { user, logout, updateUser } = useAuth()
  const [posts,setPosts]=useState([])
  const [subreddits,setSubreddits]=useState(() => {
    try {
      const cached = sessionStorage.getItem('ds:subs')
      return cached ? JSON.parse(cached) : []
    } catch {
      return []
    }
  })
  const [loading,setLoading]=useState(true)
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('ds:theme')
    if (saved) return saved === 'dark'
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true
  })

  useEffect(() => {
    const theme = isDark ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', theme)
    document.body.setAttribute('data-theme', theme)
    localStorage.setItem('ds:theme', theme)
  }, [isDark])
  const [selectedSub,setSelectedSub]=useState(null)
  const [selectedPost,setSelectedPost]=useState(null)
  const [profileUser,setProfileUser]=useState(null)
  const [joinedSubs,setJoinedSubs]=useState(new Set())
  const [prevUser, setPrevUser] = useState(user)
  const [prevSubs, setPrevSubs] = useState(subreddits)
  if (user !== prevUser || subreddits !== prevSubs) {
    if (user?.subscriptions) {
      setJoinedSubs(new Set(user.subscriptions.map(s => subreddits.find(sub => sub.id === s.subredditId)?.name).filter(Boolean)))
    } else {
      setJoinedSubs(new Set())
    }
    setPrevUser(user)
    setPrevSubs(subreddits)
  }
  const [showAuth,setShowAuth]=useState(false)
  const [showUserMenu,setShowUserMenu]=useState(false)
  const [showCreatePost,setShowCreatePost]=useState(false)
  const [editPost, setEditPost] = useState(null)
  const [showCreateSub,setShowCreateSub]=useState(false)
  const [isExploreView, setIsExploreView] = useState(false)
  const [feedLoading, setFeedLoading] = useState(false)
  const [sortBy,setSortBy]=useState('new')
  const [sortDesc,setSortDesc]=useState(true)
  const [searchQuery,setSearchQuery]=useState('')
  const [leftCollapsed,setLeftCollapsed]=useState(false)
  const [mobileMenuOpen, setMobileMenuOpen]=useState(false)
  const [actionModal,setActionModal]=useState(null) // { type: 'REPORT'|'DELETE'|'NOTE'|..., post }
  const [notifications, setNotifications] = useState([])
  const [showNotifs, setShowNotifs] = useState(false)
  const [showSubSettings, setShowSubSettings] = useState(false)

  const deferredSearch = useDeferredValue(searchQuery)

  const fetchNotifs = useCallback(async () => {
    if (!user) { setNotifications([]); return; }
    try {
      const res = await fetch(`${API}/notifications`, { headers: { ...bearer() } })
      if (res.ok) setNotifications(await res.json())
    } catch {
      // Ignored
    }
  }, [user])
  useEffect(() => {
    let active = true
    Promise.resolve().then(() => {
      if (active) fetchNotifs()
    })
    return () => { active = false }
  }, [fetchNotifs])

  const fetchPosts = useCallback(async (showLoader = false) => {
    if (showLoader) setFeedLoading(true)
    try {
      const order = sortDesc ? 'desc' : 'asc'
      const params = new URLSearchParams()
      params.set('sort', sortBy)
      params.set('order', order)
      if (deferredSearch.trim()) params.set('q', deferredSearch.trim())
      if (selectedSub) params.set('subreddit', selectedSub)

      const res = await fetch(`${API}/posts?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setPosts(data)
        if (!selectedSub && !deferredSearch.trim() && sortBy === 'new' && sortDesc) {
          sessionStorage.setItem('ds:posts', JSON.stringify(data))
        }
      }
    } catch {
      // Ignored
    } finally {
      setFeedLoading(false)
      setLoading(false)
    }
  }, [selectedSub, sortBy, sortDesc, deferredSearch])

  const fetchAll = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true)
    try {
      const [sr] = await Promise.all([
        fetch(`${API}/subreddits`),
        fetchPosts(false)
      ])
      if (sr.ok) {
        const sd = await sr.json()
        setSubreddits(sd)
        sessionStorage.setItem('ds:subs', JSON.stringify(sd))
      }
    } catch {
      // Ignored
    } finally {
      setLoading(false)
    }
  }, [fetchPosts])

  useEffect(() => {
    let active = true
    Promise.resolve().then(() => {
      if (active) fetchAll()
    })
    return () => { active = false }
  }, [fetchAll])

  // Refresh posts when sort, direction, or search changes
  useEffect(() => {
    fetchPosts(true)
  }, [fetchPosts])

  // Handle shared post URLs: #/post/{id}
  const openSharedPost = () => {
    const match = window.location.hash.match(/^#\/post\/(.+)/)
    if (!match) return
    fetch(`${API}/posts/${match[1]}`).then(r => r.json()).then(d => { if (d && !d.error) setSelectedPost(d) }).catch(() => {})
    window.history.replaceState(null, '', '/')
  }
  useEffect(() => { openSharedPost(); window.addEventListener('hashchange', openSharedPost); return () => window.removeEventListener('hashchange', openSharedPost) }, [])

  const toggleJoin=async(n)=>{
    if (!user) { setShowAuth(true); return; }
    const sub = subreddits.find(s => s.name === n);
    if (!sub) return;

    const prev = new Set(joinedSubs);
    const nx = new Set(prev);
    if(nx.has(n)) nx.delete(n); else nx.add(n);
    setJoinedSubs(nx);

    const oldSubs = user.subscriptions || [];
    const newSubs = nx.has(n) 
      ? [...oldSubs, { subredditId: sub.id }] 
      : oldSubs.filter(s => s.subredditId !== sub.id);
    updateUser({ subscriptions: newSubs });

    try {
      const res = await fetch(`${API}/subreddits/${n}/join`, { method: 'POST', headers: { ...bearer() } });
      if (!res.ok) throw new Error();
      toast(nx.has(n) ? `Joined d/${n}!` : `Left d/${n}`);
      fetchAll();
    } catch {
      setJoinedSubs(prev);
      updateUser({ subscriptions: oldSubs });
      toast.error('Failed to update subscription');
    }
  }

  const [visibleCount, setVisibleCount] = useState(20)

  useEffect(() => { setVisibleCount(20) }, [selectedSub, sortBy, sortDesc, deferredSearch])

  const displayPosts = posts

  const navHome = () => {
    setSelectedSub(null)
    setSelectedPost(null)
    setProfileUser(null)
    setIsExploreView(false)
  }

  const handleOpenCreatePost = () => {
    if (!user) {
      setShowAuth(true)
      return
    }
    if (joinedSubs.size === 0) {
      toast('You must join a community before you can post! Exploring communities...', { icon: '🚀' })
      setSelectedSub(null)
      setSelectedPost(null)
      setProfileUser(null)
      setIsExploreView(true)
      return
    }
    setShowCreatePost(true)
  }

  const handlePostUpdated = (updated) => {
    if (!updated) return
    setPosts(prev => prev.map(p => p.id === updated.id ? updated : p))
    if (selectedPost?.id === updated.id) setSelectedPost(updated)
    const cached = sessionStorage.getItem('ds:posts')
    if (cached) {
      try {
        const list = JSON.parse(cached)
        const idx = list.findIndex(p => p.id === updated.id)
        if (idx !== -1) {
          list[idx] = updated
          sessionStorage.setItem('ds:posts', JSON.stringify(list))
        }
      } catch {
        // Ignored
      }
    }
  }

  const handleAction = (type, post) => {
    if (type === 'EDIT_POST') {
      setEditPost(post)
      setActionModal(null)
      return
    }
    setActionModal({ type, post })
  }

  const handleActionSuccess = ({ type, note }) => {
    if (type === 'DELETE') {
      setSelectedPost(null)
      fetchAll(false)
    } else if (type === 'DELETE_COMMENT' || type === 'EDIT_COMMENT') {
      if (selectedPost) setSelectedPost({ ...selectedPost })
    } else if (type === 'DELETE_SUB') {
      navHome()
      fetchAll(false)
    } else if (type === 'NOTE') {
      if (selectedPost) setSelectedPost({ ...selectedPost, communityNote: note })
      fetchAll(false)
    }
  }

  return (
    <div className="app">
      <Toaster position="bottom-right" toastOptions={{style:{background:'var(--surface)',color:'var(--text)',border:'1px solid var(--border)',borderRadius:'12px',fontSize:'13px'}}}/>

      <nav className="navbar">
        <div style={{display:'flex', alignItems:'center'}}>
          <button className="mobile-menu-btn" onClick={()=>setMobileMenuOpen(s=>!s)}>
            <Layers size={18} />
          </button>
          <button className="brand" onClick={navHome}><div className="logo-mark"><Layers size={15} strokeWidth={2.5}/></div><span className="logo-word">DevShare</span></button>
        </div>
        <div className="search-wrap">
          <Search size={14} className="s-icon"/>
          <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Search posts…"/>
          {searchQuery&&<button className="s-clear" onClick={()=>setSearchQuery('')}><X size={12}/></button>}
        </div>
        <div className="nav-actions">
          <button className="icon-btn" onClick={()=>setIsDark(d=>!d)}>{isDark?<Sun size={18}/>:<Moon size={18}/>}</button>
          <div className="notif-wrap" style={{position:'relative'}}>
            <button className="icon-btn" onClick={()=>{if(!user)setShowAuth(true); else setShowNotifs(s=>!s)}}>
              <Bell size={18}/>
              {notifications.filter(n=>!n.isRead).length > 0 && <span className="notif-badge">{notifications.filter(n=>!n.isRead).length}</span>}
            </button>
            <AnimatePresence>
              {showNotifs && (
                <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }} className="notif-dropdown">
                  <div className="notif-head">
                    <h4>Notifications</h4>
                    {notifications.some(n=>!n.isRead) && <button className="mark-read-btn" onClick={async()=>{
                      await fetch(`${API}/notifications/readAll`, {method:'POST', headers:{...bearer()}});
                      fetchNotifs();
                    }}>Mark all read</button>}
                  </div>
                  <div className="notif-body">
                    {notifications.length === 0 ? <p className="notif-empty">No new notifications</p> : 
                      notifications.map(n => (
                        <div key={n.id} className={`notif-item ${!n.isRead?'unread':''}`}
                          onClick={() => {
                            if (n.postId) {
                              // Fetch the post and navigate to it
                              fetch(`${API}/posts/${n.postId}`).then(r=>r.json()).then(p=>{if(p&&!p.error)setSelectedPost(p)}).catch(()=>{})
                              setShowNotifs(false)
                            }
                          }}
                          style={{ cursor: n.postId ? 'pointer' : 'default' }}>
                          <div className="notif-actor-avatar" style={{
                            width: 24, height: 24, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
                            background: n.actor?.avatarUrl ? 'transparent' : (n.actor?.avatarColor ?? 'var(--primary)'),
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 10, color: 'white', fontWeight: 700
                          }}>
                            {n.actor?.avatarUrl
                              ? <img src={n.actor.avatarUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                              : n.actor?.username?.[0]?.toUpperCase()}
                          </div>
                          <div className="notif-text">
                            {n.type === 'POST_IN_SUBREDDIT' ? `u/${n.actor?.username} posted in a community you follow` : n.type === 'COMMENT_ON_POST' ? `u/${n.actor?.username} commented on your post` : `u/${n.actor?.username} replied to your comment`}
                          </div>
                          <span className="notif-time">{timeAgo(n.createdAt)}</span>
                        </div>
                      ))
                    }
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {user ? (
            <div className="user-menu-wrap">
              <button className="user-chip" onClick={()=>setShowUserMenu(s=>!s)}>
                <div className="user-avatar" style={{
                  background: user.avatarUrl ? 'transparent' : (user.avatarColor ?? 'var(--primary)'),
                  color: 'white', fontSize: 13, fontWeight: 700, overflow: 'hidden', padding: 0
                }}>
                  {user.avatarUrl
                    ? <img src={user.avatarUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
                    : user.username[0].toUpperCase()
                  }
                </div>
                <span>{user.username}</span>
                <ChevronDown size={13}/>
              </button>
              <AnimatePresence>
                {showUserMenu&&<motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }} className="user-dropdown" onMouseLeave={()=>setShowUserMenu(false)}>
                  <button onClick={()=>{setProfileUser(user.username);setShowUserMenu(false)}}>My Profile</button>
                  <button onClick={()=>{logout();setShowUserMenu(false);toast('Logged out')}}>Log Out</button>
                </motion.div>}
              </AnimatePresence>
            </div>
          ):(
            <button className="login-btn" onClick={()=>setShowAuth(true)}><LogIn size={16}/> Log in</button>
          )}
          <button className="create-btn" onClick={handleOpenCreatePost}><Plus size={16}/> Create</button>
        </div>
      </nav>

      <div className={`body-grid ${leftCollapsed?'left-collapsed':''}`}>
        {mobileMenuOpen && <div className="modal-backdrop" style={{zIndex:99}} onClick={()=>setMobileMenuOpen(false)}/>}
        <aside className={`sidebar-left ${leftCollapsed?'collapsed':''} ${mobileMenuOpen?'open':''}`}>
          <button className="collapse-btn" onClick={()=>setLeftCollapsed(c=>!c)} title={leftCollapsed?'Expand sidebar':'Collapse sidebar'}>
            {leftCollapsed?<PanelLeftOpen size={17}/>:<PanelLeftClose size={17}/>}
          </button>
          {!leftCollapsed && (
            <nav className="side-nav">
              <p className="side-label">FEEDS</p>
              <button className={`side-link ${!selectedSub && !profileUser && !isExploreView ? 'active' : ''}`} onClick={navHome}><Home size={16}/> Home</button>
              <button className={`side-link ${isExploreView ? 'active' : ''}`} onClick={() => { setSelectedSub(null); setSelectedPost(null); setProfileUser(null); setIsExploreView(true); }}><Compass size={16}/> Explore</button>
              <div className="side-divider"/>
              <div className="side-label-row">
                <p className="side-label">COMMUNITIES</p>
                <button className="create-sub-btn" onClick={()=>setShowCreateSub(true)}><Plus size={12}/></button>
              </div>
              {subreddits.map(sub=>(
                <button key={sub.id} className={`side-link community-link ${selectedSub===sub.name?'active':''}`} onClick={()=>{setSelectedSub(sub.name);setSelectedPost(null);setProfileUser(null);setIsExploreView(false)}}>
                  <div className="sub-icon">{sub.name[0].toUpperCase()}</div>
                  <div className="sub-link-info"><span>d/{sub.name}</span><small>{sub._count?.posts} posts</small></div>
                </button>
              ))}
            </nav>
          )}
        </aside>

        <main className="feed-area">
          <AnimatePresence mode="wait">
            {profileUser ? (
              <ProfilePage key="profile" username={profileUser} onBack={()=>setProfileUser(null)} onPostClick={p=>{setSelectedPost(p);setProfileUser(null)}} onUsernameChange={setProfileUser} onProfileSaved={fetchAll}/>
            ) : isExploreView ? (
              <ExploreCommunities
                key="explore"
                subreddits={subreddits}
                joinedSubs={joinedSubs}
                onJoinToggle={toggleJoin}
                onSelectSubreddit={(subName) => { setSelectedSub(subName); setIsExploreView(false); }}
                onCreateSubClick={() => setShowCreateSub(true)}
                user={user}
              />
            ) : selectedPost ? (
              <PostDetail key="detail" post={selectedPost} onBack={(updatedPost)=>{setSelectedPost(null); if(updatedPost) setPosts(prev=>prev.map(p=>p.id===updatedPost.id?updatedPost:p))}} onAuthRequired={()=>setShowAuth(true)} onAction={handleAction} onUserClick={setProfileUser}/>
            ) : (
              <motion.div key="feed" initial={{opacity:0}} animate={{opacity:1}}>
                <div className="feed-header">
                  <h2>{selectedSub?`d/${selectedSub}`:'Home'}</h2>
                  {selectedSub && (user?.role === 'ADMIN' || subreddits.find(s=>s.name===selectedSub)?.creator?.id === user?.id) && (
                    <>
                      <button className="action-btn" onClick={() => setShowSubSettings(true)} style={{color:'var(--text-2)', marginLeft:'auto', display:'flex', alignItems:'center', gap:'4px', background:'transparent', border:'none', cursor:'pointer', fontSize:'13px'}}><SettingsIcon size={14}/> Settings</button>
                      <button className="action-btn" onClick={() => setActionModal({ type: 'DELETE_SUB', post: { subreddit: { name: selectedSub } } })} style={{color:'var(--red)', display:'flex', alignItems:'center', gap:'4px', background:'transparent', border:'none', cursor:'pointer', fontSize:'13px'}}><X size={14}/> Delete</button>
                    </>
                  )}
                  <div className="sort-tabs">
                    {feedLoading && <span className="feed-spinner" title="Loading posts..." />}
                    {[{id:'hot',icon:<Flame size={13}/>,label:'Hot'},{id:'new',icon:<Clock size={13}/>,label:'New'},{id:'top',icon:<Award size={13}/>,label:'Top'}].map(s=>(
                      <button key={s.id} className={`sort-tab ${sortBy===s.id?'active':''}`} onClick={()=>setSortBy(s.id)}>{s.icon}{s.label}</button>
                    ))}
                    <button className={`sort-tab ${!sortDesc?'active':''}`} onClick={()=>setSortDesc(d=>!d)} title={sortDesc?'Descending':'Ascending'}><ArrowUpDown size={13}/></button>
                  </div>
                </div>
                <div className="create-stub" onClick={handleOpenCreatePost}>
                  <div className="stub-avatar" style={{background: user?.avatarUrl ? 'transparent' : (user?.avatarColor ?? 'var(--primary)'), overflow: 'hidden'}}>{user?.avatarUrl ? <img src={user.avatarUrl} style={{width:'100%',height:'100%',objectFit:'cover'}} alt=""/> : (user?user.username[0].toUpperCase():'?')}</div>
                  <div className="stub-input">{user ? "What's on your mind?" : 'Log in to post...'}</div>
                  <button className="stub-btn"><Plus size={15}/></button>
                </div>
                {loading
                  ?<div className="skeleton-list">{[1,2,3].map(n=><div key={n} className="skeleton"/>)}</div>
                  :displayPosts.length===0
                    ?<div className="empty-feed"><LayoutGrid size={40}/><p>No posts found</p><button className="btn-post" onClick={handleOpenCreatePost}>Create first post</button></div>
                    :(
                      <>
                        {displayPosts.slice(0, visibleCount).map(post=><PostCard key={post.id} post={post} onClick={()=>setSelectedPost(post)} onAuthRequired={()=>setShowAuth(true)} onAction={handleAction} onUserClick={setProfileUser}/> )}
                        {displayPosts.length > visibleCount && (
                          <div style={{display:'flex',justifyContent:'center',padding:'18px 0'}}>
                            <button className="btn-outline" onClick={()=>setVisibleCount(c=>c+20)}>
                              Load more posts ({displayPosts.length - visibleCount} remaining)
                            </button>
                          </div>
                        )}
                      </>
                    )
                }
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      <AnimatePresence>
        {showAuth&&<AuthPage key="auth" onClose={()=>setShowAuth(false)}/>}
        {showCreatePost && (
          <CreatePostModal
            subreddits={subreddits}
            joinedSubs={joinedSubs}
            user={user}
            onClose={() => setShowCreatePost(false)}
            onSuccess={() => fetchAll()}
            onExploreRedirect={() => { setIsExploreView(true); setSelectedSub(null); setSelectedPost(null); }}
          />
        )}
        {editPost && (
          <CreatePostModal
            subreddits={subreddits}
            joinedSubs={joinedSubs}
            user={user}
            initialPost={editPost}
            onClose={() => setEditPost(null)}
            onSuccess={(updated) => { handlePostUpdated(updated); setEditPost(null) }}
          />
        )}
        {showCreateSub && (
          <CreateCommunityModal
            key="create-sub-modal"
            onClose={() => setShowCreateSub(false)}
            onSuccess={(data, name) => {
              joinedSubs.add(name)
              setJoinedSubs(new Set(joinedSubs))
              updateUser({ subscriptions: [...(user?.subscriptions || []), { subredditId: data.id }] })
              fetchAll()
            }}
          />
        )}
        {showSubSettings && selectedSub && (
          <SubSettingsModal
            key={`sub-settings-${selectedSub}`}
            subredditName={selectedSub}
            user={user}
            subreddits={subreddits}
            onClose={() => setShowSubSettings(false)}
            onSaved={() => fetchAll()}
          />
        )}
        {actionModal && (
          <ActionModal
            key="action-modal"
            action={actionModal}
            onClose={() => setActionModal(null)}
            onSuccess={handleActionSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
