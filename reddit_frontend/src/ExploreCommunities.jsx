import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Compass, Search, Users, MessageSquare, Check, Plus, Sparkles, Globe, Terminal, Cpu, Database, Flame, Shield } from 'lucide-react'
import toast from 'react-hot-toast'

// Curated Discord-style preset themes for developer communities
const THEME_PRESETS = [
  { match: /web|frontend|react|vue|html|css/i, banner: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)', iconBg: '#0284c7', icon: '🌐' },
  { match: /type|ts|js|node|bun|deno/i, banner: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', iconBg: '#1e40af', icon: '⚡' },
  { match: /python|ai|ml|data/i, banner: 'linear-gradient(135deg, #f59e0b 0%, #3b82f6 100%)', iconBg: '#d97706', icon: '🐍' },
  { match: /announce|general|devshare/i, banner: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)', iconBg: '#7c3aed', icon: '✨' },
  { match: /devops|docker|k8s|cloud|linux/i, banner: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)', iconBg: '#059669', icon: '☁️' },
  { match: /rust|cpp|c|go|systems/i, banner: 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)', iconBg: '#c2410c', icon: '⚙️' },
  { match: /db|sql|postgres|mongo/i, banner: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', iconBg: '#4338ca', icon: '🗄️' },
]

function getCommunityTheme(name = '') {
  for (const preset of THEME_PRESETS) {
    if (preset.match.test(name)) return preset
  }
  // Deterministic fallback gradient
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  const colors = [
    'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
    'linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%)',
    'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
    'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)'
  ]
  const banner = colors[Math.abs(hash) % colors.length]
  return { banner, iconBg: '#4f46e5', icon: '💻' }
}

const CATEGORIES = [
  { id: 'all', label: 'All Communities' },
  { id: 'web', label: 'Web & Frontend', match: /web|frontend|react|vue|html|css|js/i },
  { id: 'languages', label: 'Languages', match: /type|python|rust|cpp|go|bun/i },
  { id: 'cloud', label: 'Cloud & DevOps', match: /devops|docker|k8s|cloud|linux|sql/i },
  { id: 'joined', label: 'My Communities' }
]

const ExploreCommunities = React.memo(function ExploreCommunities({
  subreddits = [],
  joinedSubs = new Set(),
  onJoinToggle,
  onSelectSubreddit,
  onCreateSubClick,
  user
}) {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const filteredSubs = useMemo(() => {
    return subreddits.filter((sub) => {
      // Search text query
      const matchesSearch = !search.trim() ||
        sub.name.toLowerCase().includes(search.toLowerCase()) ||
        (sub.description && sub.description.toLowerCase().includes(search.toLowerCase()))

      if (!matchesSearch) return false

      // Category filter
      if (selectedCategory === 'joined') {
        return joinedSubs.has(sub.name)
      }
      if (selectedCategory !== 'all') {
        const cat = CATEGORIES.find((c) => c.id === selectedCategory)
        if (cat?.match && !cat.match.test(sub.name)) return false
      }
      return true
    })
  }, [subreddits, search, selectedCategory, joinedSubs])

  return (
    <div className="explore-page">
      {/* Discord-style Hero Banner */}
      <div className="explore-hero">
        <div className="explore-hero-content">
          <div className="explore-hero-badge">
            <Compass size={14} />
            <span>DISCOVER COMMUNITIES</span>
          </div>
          <h1>Find your community on DevShare</h1>
          <p>
            From TypeScript to Python, systems engineering to web dev, join developer communities that match your passions.
          </p>

          <div className="explore-search-wrap">
            <Search size={18} className="explore-search-icon" />
            <input
              type="text"
              placeholder="Explore topics, technologies, or communities..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="explore-search-input"
            />
            {search && (
              <button type="button" className="explore-search-clear" onClick={() => setSearch('')}>
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category Pills & Action Header */}
      <div className="explore-nav-bar">
        <div className="explore-categories">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`explore-cat-pill ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.label}
              {cat.id === 'joined' && joinedSubs.size > 0 && (
                <span className="cat-count-badge">{joinedSubs.size}</span>
              )}
            </button>
          ))}
        </div>

        <button type="button" className="btn-post btn-create-community" onClick={onCreateSubClick}>
          <Plus size={15} /> Create Community
        </button>
      </div>

      {/* Discord-style Grid */}
      {filteredSubs.length === 0 ? (
        <div className="explore-empty">
          <Compass size={48} color="var(--text-3)" />
          <h3>No communities found</h3>
          <p>Try a different keyword or create your own community now!</p>
          <button type="button" className="btn-post" style={{ marginTop: 12 }} onClick={onCreateSubClick}>
            <Plus size={15} /> Create Community
          </button>
        </div>
      ) : (
        <div className="explore-grid">
          {filteredSubs.map((sub) => {
            const isJoined = joinedSubs.has(sub.name)
            const theme = getCommunityTheme(sub.name)
            const memberCount = sub._count?.subscribers ?? (isJoined ? 1 : 0)
            const postCount = sub._count?.posts ?? 0

            return (
              <motion.div
                key={sub.id || sub.name}
                className="discord-community-card"
                whileHover={{ y: -3 }}
                transition={{ duration: 0.15 }}
                onClick={() => onSelectSubreddit(sub.name)}
              >
                {/* Banner header */}
                <div
                  className="discord-card-banner"
                  style={{ background: sub.bannerUrl ? `url(${sub.bannerUrl}) center/cover` : theme.banner }}
                />

                {/* Overlapping Discord squircle icon */}
                <div className="discord-card-header">
                  <div className="discord-card-icon" style={{ background: theme.iconBg }}>
                    {theme.icon}
                  </div>
                  <div className="discord-card-meta">
                    <span className="discord-card-tag">d/{sub.name}</span>
                    {sub.creator && <span className="verified-badge" title="Verified Creator">✓</span>}
                  </div>
                </div>

                {/* Body info */}
                <div className="discord-card-body">
                  <h3 className="discord-card-title">d/{sub.name}</h3>
                  <p className="discord-card-desc">
                    {sub.description || 'Welcome to the developer hub for sharing, coding, and connecting.'}
                  </p>

                  <div className="discord-card-stats">
                    <span className="stat-item">
                      <Users size={13} /> {memberCount} {memberCount === 1 ? 'member' : 'members'}
                    </span>
                    <span className="stat-dot">·</span>
                    <span className="stat-item">
                      <MessageSquare size={13} /> {postCount} posts
                    </span>
                  </div>
                </div>

                {/* Footer Join Button */}
                <div className="discord-card-footer" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className={`discord-join-btn ${isJoined ? 'joined' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      onJoinToggle(sub.name)
                    }}
                  >
                    {isJoined ? (
                      <>
                        <Check size={14} /> Joined
                      </>
                    ) : (
                      <>
                        <Plus size={14} /> Join
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
})

export default ExploreCommunities
