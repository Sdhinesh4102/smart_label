import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Lock, Mail, Eye, EyeOff } from 'lucide-react'

export default function AuthScreen() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { error } = await signIn(email, password)
      if (error) throw error
    } catch (err) {
      setError(err.message || 'An error occurred during authentication')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '2rem' }}>
      <div style={{ background: 'white', padding: '3rem', borderRadius: '16px', width: '100%', maxWidth: '450px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2rem', color: '#0f172a', margin: '0 0 0.5rem 0', fontWeight: '800' }}>
          Welcome Back
        </h2>
        <p style={{ color: '#64748b', marginBottom: '2rem' }}>
          Sign in to access your Smart QR Promo Suite.
        </p>

        {error && (
          <div style={{ background: '#fef2f2', color: '#ef4444', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleAuth} style={{ textAlign: 'left' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', color: '#475569', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                <Mail size={18} />
              </div>
              <input 
                type="email" 
                required 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', borderRadius: '8px', border: '2px solid #e2e8f0', outline: 'none', fontSize: '1rem', boxSizing: 'border-box' }}
                placeholder="admin@example.com"
              />
            </div>
          </div>
          
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', color: '#475569', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                <Lock size={18} />
              </div>
              <input 
                type={showPassword ? "text" : "password"} 
                required 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                style={{ width: '100%', padding: '0.75rem 3rem 0.75rem 2.75rem', borderRadius: '8px', border: '2px solid #e2e8f0', outline: 'none', fontSize: '1rem', boxSizing: 'border-box' }}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', top: '50%', right: '0.5rem', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ width: '100%', padding: '1rem', background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.1rem', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 10px 25px rgba(59, 130, 246, 0.3)', transition: 'transform 0.2s', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Processing...' : 'Sign In'}
          </button>
        </form>

        <p style={{ marginTop: '2rem', fontSize: '0.9rem', color: '#64748b' }}>
          Need access? Ask the Smart QR Promo Suite administrator for an invitation.
        </p>
      </div>
    </div>
  )
}
