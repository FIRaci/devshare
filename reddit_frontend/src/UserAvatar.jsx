export default function UserAvatar({ user, size = 16, style = {} }) {
  const bg = user?.avatarUrl ? 'transparent' : (user?.avatarColor ?? 'var(--primary)')
  return (
    <span style={{
      width: size, height: size, borderRadius: '50%', background: bg,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.max(9, size * 0.56), color: 'white', fontWeight: 700,
      flexShrink: 0, overflow: 'hidden', ...style
    }}>
      {user?.avatarUrl
        ? <img src={user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        : user?.username?.[0]?.toUpperCase()
      }
    </span>
  )
}
