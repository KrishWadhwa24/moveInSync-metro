import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../services/api';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = isLogin ? await login(form) : await register(form);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/search');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* Left panel */}
      <div style={styles.left}>
        <div style={styles.brand}>
          <div style={styles.logo}>M</div>
          <h1 style={styles.brandName}>MetroBook</h1>
          <p style={styles.tagline}>Delhi Metro — Fast. Smart. Connected.</p>
        </div>
        <div style={styles.lines}>
          {/* Decorative metro lines */}
          <div style={{ ...styles.line, background: '#FFD700', top: '30%', width: '60%' }} />
          <div style={{ ...styles.line, background: '#0057e7', top: '45%', width: '80%' }} />
          <div style={{ ...styles.line, background: '#FF4500', top: '60%', width: '50%' }} />
          <div style={{ ...styles.dot, background: '#FFD700', top: '28.5%', left: '55%' }} />
          <div style={{ ...styles.dot, background: '#0057e7', top: '43.5%', left: '75%' }} />
          <div style={{ ...styles.dot, background: '#FF4500', top: '58.5%', left: '45%' }} />
        </div>
      </div>

      {/* Right panel - form */}
      <div style={styles.right}>
        <div style={styles.card}>
          <h2 style={styles.title}>{isLogin ? 'Welcome back' : 'Create account'}</h2>
          <p style={styles.subtitle}>{isLogin ? 'Sign in to book your metro ride' : 'Join MetroBook today'}</p>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                style={styles.input}
                required
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                style={styles.input}
                required
              />
            </div>

            {error && <div style={styles.error}>{error}</div>}

            <button type="submit" style={styles.btn} disabled={loading}>
              {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Register'}
            </button>
          </form>

          <p style={styles.toggle}>
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <span style={styles.link} onClick={() => { setIsLogin(!isLogin); setError(''); }}>
              {isLogin ? 'Register' : 'Sign In'}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    display: 'flex',
    height: '100vh',
    fontFamily: "'Segoe UI', sans-serif",
    background: '#0a0a0a',
  },
  left: {
    flex: 1,
    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  brand: { textAlign: 'center', zIndex: 2 },
  logo: {
    width: 70, height: 70,
    background: '#FFD700',
    borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 36, fontWeight: 900, color: '#0a0a0a',
    margin: '0 auto 16px',
  },
  brandName: { color: '#fff', fontSize: 42, fontWeight: 800, margin: 0 },
  tagline: { color: '#888', fontSize: 14, marginTop: 8 },
  lines: { position: 'absolute', inset: 0, pointerEvents: 'none' },
  line: {
    position: 'absolute', height: 3, left: '10%',
    borderRadius: 2, opacity: 0.3,
  },
  dot: {
    position: 'absolute', width: 12, height: 12,
    borderRadius: '50%', opacity: 0.6,
    transform: 'translateY(-50%)',
  },
  right: {
    width: 440,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#111',
    padding: 40,
  },
  card: { width: '100%' },
  title: { color: '#fff', fontSize: 28, fontWeight: 700, margin: '0 0 6px' },
  subtitle: { color: '#666', fontSize: 14, margin: '0 0 32px' },
  form: { display: 'flex', flexDirection: 'column', gap: 20 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { color: '#aaa', fontSize: 13, fontWeight: 500 },
  input: {
    padding: '12px 16px',
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: 8,
    color: '#fff',
    fontSize: 15,
    outline: 'none',
  },
  error: {
    background: '#2a1a1a',
    border: '1px solid #ff4444',
    color: '#ff6666',
    padding: '10px 14px',
    borderRadius: 8,
    fontSize: 13,
  },
  btn: {
    padding: '13px',
    background: '#FFD700',
    color: '#0a0a0a',
    border: 'none',
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: 4,
  },
  toggle: { color: '#666', fontSize: 13, textAlign: 'center', marginTop: 24 },
  link: { color: '#FFD700', cursor: 'pointer', fontWeight: 600 },
};