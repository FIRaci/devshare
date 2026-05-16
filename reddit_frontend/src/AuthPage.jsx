import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Layers, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'

export default function AuthPage({ onClose }) {
  const { login, register } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [form, setForm] = useState({ identifier: '', username: '', email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(form.identifier, form.password)
        toast.success('Welcome back! 👋')
      } else {
        await register(form.username, form.email, form.password)
        toast.success('Account created! 🎉')
      }
      onClose()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <motion.div
        className="auth-modal"
        initial={{ scale: 0.93, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.93, opacity: 0 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="auth-left">
          <div className="auth-brand"><Layers size={32} color="white"/></div>
          <h2>DevShare</h2>
          <p>Join the community where developers share, vote, and grow together.</p>
        </div>

        <div className="auth-right">
          <div className="auth-tabs">
            <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Log In</button>
            <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Sign Up</button>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {mode === 'register' && (
              <>
                <div className="field">
                  <label>Username</label>
                  <input placeholder="devshare_user" value={form.username} onChange={e => set('username', e.target.value)} required minLength={3} maxLength={20}/>
                </div>
                <div className="field">
                  <label>Email</label>
                  <input type="email" placeholder="you@example.com" value={form.email} onChange={e => set('email', e.target.value)} required/>
                </div>
              </>
            )}
            {mode === 'login' && (
              <div className="field">
                <label>Username or Email</label>
                <input placeholder="Enter username or email" value={form.identifier} onChange={e => set('identifier', e.target.value)} required/>
              </div>
            )}
            <div className="field">
              <label>Password</label>
              <div className="pw-wrap">
                <input type={showPw ? 'text' : 'password'} placeholder="Min. 6 characters" value={form.password} onChange={e => set('password', e.target.value)} required minLength={6}/>
                <button type="button" className="pw-toggle" onClick={() => setShowPw(s => !s)}>
                  {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Please wait…' : (mode === 'login' ? 'Log In' : 'Create Account')}
              {!loading && <ArrowRight size={16}/>}
            </button>
          </form>

          <p className="auth-switch">
            {mode === 'login' ? "Don't have an account? " : "Already have one? "}
            <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
              {mode === 'login' ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
