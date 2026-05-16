import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast, { Toaster } from 'react-hot-toast'
import { Search, Plus, MessageSquare, ArrowBigUp, ArrowBigDown, Share2, Bookmark, Home, TrendingUp, LayoutGrid, Moon, Sun, Bell, X, ArrowLeft, Send, RefreshCw, Clock, Flame, Award, Layers, ChevronDown, LogIn, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useAuth } from './AuthContext'
import AuthPage from './AuthPage'
import ProfilePage from './ProfilePage'
import './App.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'
console.log('Current API Endpoint:', API)
const timeAgo = (d) => { const diff=Date.now()-new Date(d).getTime(),m=Math.floor(diff/60000); if(m<1)return 'just now'; if(m<60)return `${m}m`; const h=Math.floor(m/60); if(h<24)return `${h}h`; return `${Math.floor(h/24)}d` }
const applyVote = (votes=[], type, uid='me') => { const ex=votes.find(v=>v.userId===uid); if(ex?.type===type) return votes.filter(v=>v.userId!==uid); return [...votes.filter(v=>v.userId!==uid),{type,userId:uid}] }
const getScore = (votes=[]) => votes.reduce((a,v)=>a+(v.type==='UP'?1:-1),0)
const myVote = (votes=[]) => votes.find(v=>v.userId==='me')?.type??null

// ── VoteButtons (filled icons when active) ───────────────────────────────────
function VoteButtons({ votes, onVote, onAuthRequired, size=22, vertical=true }) {
  const { user } = useAuth()
  const score = getScore(votes)
  const my = myVote(votes)
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
}

// ── CommentItem ──────────────────────────────────────────────────────────────
function CommentItem({ comment, depth=0, onReply, onAuthRequired }) {
  const { user } = useAuth()
  const [showReply, setShowReply] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [localVotes, setLocalVotes] = useState(comment.votes??[])

  const handleVote = async (type) => {
    if (!user) { onAuthRequired?.(); return }
    const prev=localVotes; setLocalVotes(applyVote(localVotes,type))
    try { await fetch(`${API}/comments/${comment.id}/vote`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type})}) }
    catch { setLocalVotes(prev) }
  }

  const handleReplyClick = () => {
    if (!user) { onAuthRequired?.(); return }
    setShowReply(s=>!s)
  }

  const submitReply = async () => {
    if(!replyText.trim())return; setSubmitting(true)
    try {
      const res=await fetch(`${API}/comments`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({content:replyText,postId:comment.postId,parentId:comment.id})})
      if(res.ok){toast.success('Reply posted!');setReplyText('');setShowReply(false);onReply()}
    } catch { toast.error('Failed') } finally { setSubmitting(false) }
  }

  const my=myVote(localVotes),score=getScore(localVotes)
  return (
    <div className={`comment-item depth-${Math.min(depth,4)}`}>
      <div className="comment-vote-bar">
        <button className={`c-vote up ${my==='UP'?'active-up':''}`} onClick={()=>handleVote('UP')}><ArrowBigUp size={13} fill={my==='UP'?'currentColor':'none'} strokeWidth={my==='UP'?2:1.5}/></button>
        <span className={`c-score ${score>0?'pos':score<0?'neg':''}`}>{score}</span>
        <button className={`c-vote down ${my==='DOWN'?'active-down':''}`} onClick={()=>handleVote('DOWN')}><ArrowBigDown size={13} fill={my==='DOWN'?'currentColor':'none'} strokeWidth={my==='DOWN'?2:1.5}/></button>
      </div>
      <div className="comment-body">
        <div className="comment-meta"><span className="c-author">u/{comment.author?.username}</span><span className="c-time">{timeAgo(comment.createdAt)}</span></div>
        <p className="c-content">{comment.content}</p>
        <div className="comment-actions">
          <button className="reply-btn" onClick={handleReplyClick}><MessageSquare size={11}/> Reply</button>
        </div>
        <AnimatePresence>
          {showReply&&<motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}} className="reply-box">
            <textarea autoFocus value={replyText} onChange={e=>setReplyText(e.target.value)} placeholder="Your reply…" rows={3}/>
            <div className="reply-actions">
              <button className="btn-cancel" onClick={()=>setShowReply(false)}>Cancel</button>
              <button className="btn-post" disabled={submitting||!replyText.trim()} onClick={submitReply}><Send size={12}/>{submitting?'…':'Reply'}</button>
            </div>
          </motion.div>}
        </AnimatePresence>
        {comment.replies?.length>0&&<div className="replies">{comment.replies.map(r=><CommentItem key={r.id} comment={{...r,postId:comment.postId}} depth={depth+1} onReply={onReply} onAuthRequired={onAuthRequired}/>)}</div>}
      </div>
    </div>
  )
}

// ── PostCard ─────────────────────────────────────────────────────────────────
function PostCard({ post:init, onClick, onAuthRequired, onAction, onUserClick }) {
  const { user } = useAuth()
  const [post,setPost]=useState(init)
  useEffect(()=>setPost(init),[init])
  const handleVote=async(type)=>{
    const prev=post.votes; setPost(p=>({...p,votes:applyVote(p.votes,type)}))
    try{await fetch(`${API}/posts/${post.id}/vote`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type})})}
    catch{setPost(p=>({...p,votes:prev}));toast.error('Vote failed')}
  }
  const handleSave = (e) => {
    e.stopPropagation()
    if (!user) { onAuthRequired?.(); return }
    toast('Saved ⭐')
  }

  return (
    <motion.div className="post-card" initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} whileHover={{y:-1}} layout>
      <VoteButtons votes={post.votes} onVote={handleVote} onAuthRequired={onAuthRequired}/>
      <div className="post-body" onClick={onClick}>
        <div className="post-meta"><span className="sub-badge">d/{post.subreddit?.name}</span><span className="meta-dot">·</span><span className="meta-user" style={{display:'inline-flex',alignItems:'center',gap:4}} onClick={e=>{e.stopPropagation(); onUserClick?.(post.author?.username)}}><span style={{width:16,height:16,borderRadius:'50%',background:post.author?.avatarUrl?'transparent':(post.author?.avatarColor??'var(--primary)'),display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:9,color:'white',fontWeight:700,flexShrink:0,overflow:'hidden'}}>{post.author?.avatarUrl?<img src={post.author.avatarUrl} alt="" style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>:post.author?.username?.[0]?.toUpperCase()}</span>u/{post.author?.username}</span><span className="meta-dot">·</span><span className="meta-text">{timeAgo(post.createdAt)}</span></div>
        <h3 className="post-title">{post.title}</h3>
        {post.content&&<p className="post-excerpt">{post.content}</p>}
        {post.communityNote && (
          <div className="community-note">
            <strong>Community Note:</strong> {post.communityNote}
          </div>
        )}
        <div className="post-actions">
          <button className="action-btn" onClick={e=>{e.stopPropagation();onClick()}}><MessageSquare size={13}/>{post._count?.comments??0} Comments</button>
          <button className="action-btn" onClick={e=>{e.stopPropagation();navigator.clipboard.writeText(window.location.href);toast.success('Link copied!')}}><Share2 size={13}/> Share</button>
          <button className="action-btn" onClick={handleSave}><Bookmark size={13}/> Save</button>
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
}

// ── PostDetail ────────────────────────────────────────────────────────────────
function PostDetail({ post:init, onBack, onAuthRequired, onAction, onUserClick }) {
  const { user } = useAuth()
  const [post,setPost]=useState(init)
  const [comments,setComments]=useState([])
  const [commentText,setCommentText]=useState('')
  const [submitting,setSubmitting]=useState(false)
  const fetch2=useCallback(async()=>{try{const r=await fetch(`${API}/comments/post/${post.id}`);if(r.ok)setComments(await r.json())}catch{}},[post.id])
  useEffect(()=>{fetch2()},[fetch2])
  const handleVote=async(type)=>{
    const prev=post.votes; setPost(p=>({...p,votes:applyVote(p.votes,type)}))
    try{await fetch(`${API}/posts/${post.id}/vote`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type})})}
    catch{setPost(p=>({...p,votes:prev}));toast.error('Vote failed')}
  }
  const handleCommentFocus = () => {
    if (!user) { onAuthRequired?.(); return }
  }
  const submitComment=async()=>{
    if (!user) { onAuthRequired?.(); return }
    if(!commentText.trim())return; setSubmitting(true)
    try{const r=await fetch(`${API}/comments`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({content:commentText,postId:post.id})});if(r.ok){toast.success('Commented!');setCommentText('');fetch2();setPost(p=>({...p,_count:{...p._count,comments:(p._count?.comments??0)+1}}))}}
    catch{toast.error('Failed')}finally{setSubmitting(false)}
  }

  return (
    <motion.div initial={{opacity:0,x:16}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-16}} className="post-detail-view">
      <button className="back-btn" onClick={onBack}><ArrowLeft size={15}/> Back</button>
      <div className="post-card detail-card">
        <VoteButtons votes={post.votes} onVote={handleVote} onAuthRequired={onAuthRequired}/>
        <div className="post-body">
          <div className="post-meta"><span className="sub-badge">d/{post.subreddit?.name}</span><span className="meta-dot">·</span><span className="meta-user" onClick={e=>{e.stopPropagation(); onUserClick?.(post.author?.username)}}>u/{post.author?.username}</span><span className="meta-dot">·</span><span className="meta-text">{timeAgo(post.createdAt)}</span></div>
          <h1 className="post-title-full">{post.title}</h1>
          {post.content&&<p className="post-content-full">{post.content}</p>}
          {post.communityNote && (
            <div className="community-note">
              <strong>Community Note:</strong> {post.communityNote}
            </div>
          )}
          <div className="post-actions">
            <button className="action-btn" onClick={e=>{e.stopPropagation(); if(!user){onAuthRequired?.();return} onAction('REPORT', post)}} style={{color:'var(--red)'}}>Report</button>
            {user?.role === 'ADMIN' && (
              <>
                <button className="action-btn" onClick={e=>{e.stopPropagation(); onAction('DELETE', post)}} style={{color:'var(--red)'}}>Delete</button>
                <button className="action-btn" onClick={e=>{e.stopPropagation(); onAction('NOTE', post)}} style={{color:'var(--primary)'}}>Add Note</button>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="comments-panel">
        <h4 className="comments-heading">{post._count?.comments??0} Comments</h4>
        {!user
          ? <div className="auth-prompt" onClick={onAuthRequired}><LogIn size={16}/> Log in to comment and vote</div>
          : <div className="comment-compose">
              <textarea value={commentText} onChange={e=>setCommentText(e.target.value)} onFocus={handleCommentFocus} placeholder="Share your thoughts…" rows={4}/>
              <div className="compose-actions">
                <span className="char-count">{commentText.length} chars</span>
                <button className="btn-post" onClick={submitComment} disabled={submitting||!commentText.trim()}><Send size={13}/>{submitting?'Posting…':'Comment'}</button>
              </div>
            </div>
        }
        {comments.length===0
          ?<div className="empty-comments"><MessageSquare size={34}/><p>No comments yet.</p></div>
          :<div className="comment-list">{comments.map(c=><CommentItem key={c.id} comment={{...c,postId:post.id}} onReply={fetch2} onAuthRequired={onAuthRequired}/>)}</div>
        }
      </div>
    </motion.div>
  )
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const { user, logout } = useAuth()
  const [posts,setPosts]=useState([])
  const [subreddits,setSubreddits]=useState([])
  const [loading,setLoading]=useState(true)
  const [isDark,setIsDark]=useState(false)
  const [selectedSub,setSelectedSub]=useState(null)
  const [selectedPost,setSelectedPost]=useState(null)
  const [profileUser,setProfileUser]=useState(null)
  const [joinedSubs,setJoinedSubs]=useState(new Set())
  const [showAuth,setShowAuth]=useState(false)
  const [showUserMenu,setShowUserMenu]=useState(false)
  const [showCreatePost,setShowCreatePost]=useState(false)
  const [showCreateSub,setShowCreateSub]=useState(false)
  const [sortBy,setSortBy]=useState('new')
  const [searchQuery,setSearchQuery]=useState('')
  const [newPost,setNewPost]=useState({title:'',content:'',subredditId:''})
  const [newSub,setNewSub]=useState({name:'',description:''})
  const [leftCollapsed,setLeftCollapsed]=useState(false)
  const [actionModal,setActionModal]=useState(null) // { type: 'REPORT'|'DELETE'|'NOTE', post }
  const [actionText,setActionText]=useState('')

  // Right sidebar only shows on main feed (not profile, not post detail)
  const showRightSidebar = !profileUser && !selectedPost

  useEffect(()=>{document.body.setAttribute('data-theme',isDark?'dark':'light')},[isDark])
  useEffect(()=>{fetchAll()},[selectedSub])

  const fetchAll=async()=>{
    setLoading(true)
    try{
      const [pr,sr]=await Promise.all([fetch(selectedSub?`${API}/subreddits/${selectedSub}`:`${API}/posts`),fetch(`${API}/subreddits`)])
      const pd=await pr.json(),sd=await sr.json()
      setPosts(selectedSub?(pd.posts??[]):pd); setSubreddits(sd)
    }catch{toast.error('Failed to load')}finally{setLoading(false)}
  }

  const [submittingPost,setSubmittingPost]=useState(false)
  const [submittingSub,setSubmittingSub]=useState(false)

  const submitPost=async(e)=>{
    e.preventDefault(); if(submittingPost) return; setSubmittingPost(true); const tId = toast.loading('Posting...')
    try {
      const res=await fetch(`${API}/posts`,{method:'POST',headers:{'Content-Type':'application/json','x-user-id':user?.id},body:JSON.stringify({title:newPost.title,content:newPost.content,subredditId:newPost.subredditId})})
      const d=await res.json(); if(!res.ok){ toast.error(d.error??'Failed', {id: tId}); return }
      toast.success('Post created!', {id: tId}); setShowCreatePost(false); setNewPost({title:'',content:'',subredditId:''}); fetchAll()
    } catch { toast.error('Failed to connect', {id: tId}) } finally { setSubmittingPost(false) }
  }

  const submitSub=async(e)=>{
    e.preventDefault(); if(submittingSub) return; setSubmittingSub(true); const tId = toast.loading('Creating...')
    try {
      const res=await fetch(`${API}/subreddits`,{method:'POST',headers:{'Content-Type':'application/json','x-user-id':user?.id},body:JSON.stringify({name:newSub.name,description:newSub.description})})
      const d=await res.json(); if(!res.ok){ toast.error(d.error??'Failed', {id: tId}); return }
      toast.success(`d/${newSub.name} created!`, {id: tId}); setShowCreateSub(false); setNewSub({name:'',description:''}); fetchAll()
    } catch { toast.error('Failed to connect', {id: tId}) } finally { setSubmittingSub(false) }
  }

  const toggleJoin=(n)=>setJoinedSubs(prev=>{const nx=new Set(prev);if(nx.has(n)){nx.delete(n);toast(`Left d/${n}`)}else{nx.add(n);toast.success(`Joined d/${n}!`)};return nx})

  const displayPosts=[...posts]
    .filter(p=>!searchQuery||p.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a,b)=>{
      if(sortBy==='top')return getScore(b.votes)-getScore(a.votes)
      if(sortBy==='hot')return(getScore(b.votes)+(b._count?.comments??0)*2)-(getScore(a.votes)+(a._count?.comments??0)*2)
      return new Date(b.createdAt)-new Date(a.createdAt)
    })

  const navHome=()=>{setSelectedSub(null);setSelectedPost(null);setProfileUser(null)}

  return (
    <div className="app">
      <Toaster position="bottom-right" toastOptions={{style:{background:'var(--surface)',color:'var(--text)',border:'1px solid var(--border)',borderRadius:'12px',fontSize:'13px'}}}/>

      <nav className="navbar">
        <button className="brand" onClick={navHome}><div className="logo-mark"><Layers size={15} strokeWidth={2.5}/></div><span className="logo-word">DevShare</span></button>
        <div className="search-wrap">
          <Search size={14} className="s-icon"/>
          <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Search posts…"/>
          {searchQuery&&<button className="s-clear" onClick={()=>setSearchQuery('')}><X size={12}/></button>}
        </div>
        <div className="nav-actions">
          <button className="icon-btn" onClick={()=>setIsDark(d=>!d)}>{isDark?<Sun size={18}/>:<Moon size={18}/>}</button>
          <button className="icon-btn" onClick={()=>toast('No notifications 🔔')}><Bell size={18}/></button>
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
                {showUserMenu&&<motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} className="user-dropdown" onMouseLeave={()=>setShowUserMenu(false)}>
                  <button onClick={()=>{setProfileUser(user.username);setShowUserMenu(false)}}>My Profile</button>
                  <button onClick={()=>{logout();setShowUserMenu(false);toast('Logged out')}}>Log Out</button>
                </motion.div>}
              </AnimatePresence>
            </div>
          ):(
            <button className="login-btn" onClick={()=>setShowAuth(true)}><LogIn size={16}/> Log in</button>
          )}
          <button className="create-btn" onClick={()=>{ if(!user){setShowAuth(true);return}; setShowCreatePost(true)}}><Plus size={16}/> Create</button>
        </div>
      </nav>

      <div className={`body-grid ${leftCollapsed?'left-collapsed':''} ${!showRightSidebar?'no-right':''}`}>
        <aside className={`sidebar-left ${leftCollapsed?'collapsed':''}`}>
          <button className="collapse-btn" onClick={()=>setLeftCollapsed(c=>!c)} title={leftCollapsed?'Expand sidebar':'Collapse sidebar'}>
            {leftCollapsed?<PanelLeftOpen size={17}/>:<PanelLeftClose size={17}/>}
          </button>
          {!leftCollapsed && (
            <nav className="side-nav">
              <p className="side-label">FEEDS</p>
              <button className={`side-link ${!selectedSub&&!profileUser?'active':''}`} onClick={navHome}><Home size={16}/> Home</button>
              <button className="side-link" onClick={()=>{setSortBy('hot');navHome()}}><Flame size={16}/> Popular</button>
              <button className="side-link" onClick={()=>{setSortBy('new');navHome()}}><TrendingUp size={16}/> New</button>
              <div className="side-divider"/>
              <div className="side-label-row">
                <p className="side-label">COMMUNITIES</p>
                <button className="create-sub-btn" onClick={()=>setShowCreateSub(true)}><Plus size={12}/></button>
              </div>
              {subreddits.map(sub=>(
                <button key={sub.id} className={`side-link community-link ${selectedSub===sub.name?'active':''}`} onClick={()=>{setSelectedSub(sub.name);setSelectedPost(null);setProfileUser(null)}}>
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
            ) : selectedPost ? (
              <PostDetail key="detail" post={selectedPost} onBack={()=>setSelectedPost(null)} onAuthRequired={()=>setShowAuth(true)} onAction={(type, post)=>setActionModal({type, post})} onUserClick={setProfileUser}/>
            ) : (
              <motion.div key="feed" initial={{opacity:0}} animate={{opacity:1}}>
                <div className="feed-header">
                  <h2>{selectedSub?`d/${selectedSub}`:'Home'}</h2>
                  {selectedSub && user?.role === 'ADMIN' && (
                    <button className="action-btn" onClick={() => setActionModal({ type: 'DELETE_SUB', post: { subreddit: { name: selectedSub } } })} style={{color:'var(--red)', marginLeft: '10px', display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '13px'}}><X size={14}/> Delete</button>
                  )}
                  <div className="sort-tabs">
                    {[{id:'hot',icon:<Flame size={13}/>,label:'Hot'},{id:'new',icon:<Clock size={13}/>,label:'New'},{id:'top',icon:<Award size={13}/>,label:'Top'}].map(s=>(
                      <button key={s.id} className={`sort-tab ${sortBy===s.id?'active':''}`} onClick={()=>setSortBy(s.id)}>{s.icon}{s.label}</button>
                    ))}
                    <button className="sort-tab" onClick={fetchAll}><RefreshCw size={13}/></button>
                  </div>
                </div>
                <div className="create-stub" onClick={()=>{ if(!user){setShowAuth(true);return}; setShowCreatePost(true)}}>
                  <div className="stub-avatar">{user?user.username[0].toUpperCase():'?'}</div>
                  <div className="stub-input">{user ? "What's on your mind?" : 'Log in to post...'}</div>
                  <button className="stub-btn"><Plus size={15}/></button>
                </div>
                {loading
                  ?<div className="skeleton-list">{[1,2,3].map(n=><div key={n} className="skeleton"/>)}</div>
                  :displayPosts.length===0
                    ?<div className="empty-feed"><LayoutGrid size={40}/><p>No posts found</p><button className="btn-post" onClick={()=>{if(!user){setShowAuth(true);return};setShowCreatePost(true)}}>Create first post</button></div>
                    :displayPosts.map(post=><PostCard key={post.id} post={post} onClick={()=>setSelectedPost(post)} onAuthRequired={()=>setShowAuth(true)} onAction={(type, p)=>setActionModal({type, post: p})} onUserClick={setProfileUser}/>)
                }
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {showRightSidebar && (
          <aside className="sidebar-right">
            <div className="info-card">
              <div className="info-banner"><Layers size={26} color="white" opacity={0.4}/></div>
              <div className="info-body">
                <div className="info-brand"><Layers size={16} color="var(--primary)"/><h4>DevShare</h4></div>
                <p>Your community hub for developers.</p>
                {!user&&<button className="btn-post w-full" onClick={()=>setShowAuth(true)}><LogIn size={14}/> Join DevShare</button>}
                {user&&<button className="btn-post w-full" onClick={()=>setShowCreatePost(true)}><Plus size={14}/> Create Post</button>}
                <button className="btn-outline w-full" onClick={()=>setShowCreateSub(true)}>Create Community</button>
              </div>
            </div>
            <div className="info-card">
              <div className="info-body">
                <h4 className="card-title">Top Communities</h4>
                {subreddits.slice(0,6).map((sub,i)=>(
                  <div key={sub.id} className="community-row">
                    <span className="rank">#{i+1}</span>
                    <div className="sub-icon sm">{sub.name[0].toUpperCase()}</div>
                    <div className="sub-row-info">
                      <button className="sub-row-name" onClick={()=>{setSelectedSub(sub.name);setSelectedPost(null);setProfileUser(null)}}>d/{sub.name}</button>
                      <small>{sub._count?.posts} posts</small>
                    </div>
                    <button className={`join-btn ${joinedSubs.has(sub.name)?'joined':''}`} onClick={()=>toggleJoin(sub.name)}>{joinedSubs.has(sub.name)?'Joined':'Join'}</button>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        )}
      </div>

      <AnimatePresence>
        {showAuth&&<AuthPage key="auth" onClose={()=>setShowAuth(false)}/>}
        {showCreatePost&&(
          <div className="modal-backdrop" onClick={()=>setShowCreatePost(false)}>
            <motion.div className="modal" initial={{scale:.95,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:.95,opacity:0}} onClick={e=>e.stopPropagation()}>
              <div className="modal-head"><h3>Create Post</h3><button onClick={()=>setShowCreatePost(false)}><X size={18}/></button></div>
              <form onSubmit={submitPost} className="modal-body">
                <select value={newPost.subredditId} onChange={e=>setNewPost(p=>({...p,subredditId:e.target.value}))} required>
                  <option value="">Choose a community</option>
                  {subreddits.map(s=><option key={s.id} value={s.id}>d/{s.name}</option>)}
                </select>
                <input type="text" placeholder="Title *" value={newPost.title} onChange={e=>setNewPost(p=>({...p,title:e.target.value}))} required/>
                <textarea placeholder="Text (optional)" value={newPost.content} onChange={e=>setNewPost(p=>({...p,content:e.target.value}))} rows={5}/>
                <div className="modal-footer">
                  <button type="button" className="btn-outline" onClick={()=>setShowCreatePost(false)}>Cancel</button>
                  <button type="submit" className="btn-post" disabled={submittingPost}>{submittingPost ? 'Posting...' : 'Post'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
        {showCreateSub&&(
          <div className="modal-backdrop" onClick={()=>setShowCreateSub(false)}>
            <motion.div className="modal" initial={{scale:.95,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:.95,opacity:0}} onClick={e=>e.stopPropagation()}>
              <div className="modal-head"><h3>Create Community</h3><button onClick={()=>setShowCreateSub(false)}><X size={18}/></button></div>
              <form onSubmit={submitSub} className="modal-body">
                <div className="prefix-input"><span>d/</span><input type="text" placeholder="name" value={newSub.name} onChange={e=>setNewSub(p=>({...p,name:e.target.value.replace(/\s/g,'_')}))} required minLength={3} maxLength={21}/></div>
                <small className="input-hint">{newSub.name.length}/21</small>
                <textarea placeholder="Description (optional)" value={newSub.description} onChange={e=>setNewSub(p=>({...p,description:e.target.value}))} rows={3}/>
                <div className="modal-footer">
                  <button type="button" className="btn-outline" onClick={()=>setShowCreateSub(false)}>Cancel</button>
                  <button type="submit" className="btn-post" disabled={submittingSub}>{submittingSub ? 'Creating...' : 'Create'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
        {actionModal && (
          <div className="modal-backdrop" onClick={()=>setActionModal(null)}>
            <motion.div className="modal" initial={{scale:.95,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:.95,opacity:0}} onClick={e=>e.stopPropagation()}>
              <div className="modal-head">
                <h3>{actionModal.type === 'REPORT' ? 'Report Post' : actionModal.type === 'DELETE' ? 'Confirm Deletion' : actionModal.type === 'DELETE_SUB' ? 'Delete Community' : 'Add Community Note'}</h3>
                <button onClick={()=>setActionModal(null)}><X size={18}/></button>
              </div>
              <div className="modal-body">
                {actionModal.type === 'DELETE' ? (
                  <p>Are you sure you want to permanently delete this post? This action cannot be undone.</p>
                ) : actionModal.type === 'DELETE_SUB' ? (
                  <p>Are you sure you want to permanently delete d/{actionModal.post.subreddit.name}? This action cannot be undone.</p>
                ) : (
                  <textarea 
                    autoFocus
                    placeholder={actionModal.type === 'REPORT' ? "Reason for reporting..." : "Enter your community note..."} 
                    value={actionText} 
                    onChange={e=>setActionText(e.target.value)} 
                    rows={4} 
                  />
                )}
                <div className="modal-footer" style={{ marginTop: 16 }}>
                  <button className="btn-outline" onClick={()=>setActionModal(null)}>Cancel</button>
                  <button 
                    className="btn-post" 
                    style={{ background: (actionModal.type === 'DELETE' || actionModal.type === 'DELETE_SUB') ? 'var(--red)' : 'var(--primary)' }}
                    onClick={async () => {
                      const { type, post } = actionModal;
                      const tid = toast.loading('Processing...');
                      try {
                        if (type === 'REPORT') {
                          if(!actionText.trim()) return toast.error('Reason required', { id: tid });
                          await fetch(`${API}/reports`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-user-id': user.id }, body: JSON.stringify({ type: 'POST', targetId: post.id, reason: actionText }) });
                          toast.success('Report sent!', { id: tid });
                        } else if (type === 'DELETE') {
                          await fetch(`${API}/posts/${post.id}`, { method: 'DELETE', headers: { 'x-user-id': user.id }});
                          toast.success('Post deleted', { id: tid });
                          setSelectedPost(null);
                          fetchAll();
                        } else if (type === 'DELETE_SUB') {
                          await fetch(`${API}/subreddits/${post.subreddit.name}`, { method: 'DELETE', headers: { 'x-user-id': user.id }});
                          toast.success('Community deleted', { id: tid });
                          navHome();
                          fetchAll();
                        } else if (type === 'NOTE') {
                          if(!actionText.trim()) return toast.error('Note required', { id: tid });
                          await fetch(`${API}/posts/${post.id}/note`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'x-user-id': user.id }, body: JSON.stringify({ communityNote: actionText }) });
                          toast.success('Note added!', { id: tid });
                          fetchAll();
                        }
                        setActionModal(null); setActionText('');
                      } catch { toast.error('Action failed', { id: tid }); }
                    }}
                  >
                    {(actionModal.type === 'DELETE' || actionModal.type === 'DELETE_SUB') ? 'Delete' : 'Submit'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
