'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@torah-app/api-client';
import { useWebAuthStore } from '../../src/lib/webAuthStore.js';

const C = {
  page: {
    minHeight: 'calc(100vh - 56px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#0a1f14', border: '1px solid #1a3a2a',
    borderRadius: 20, padding: '36px 32px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
    width: '100%', maxWidth: 400,
  },
  logo: { fontSize: 60, marginBottom: 4 },
  title: { color: '#e8f5e9', fontSize: 26, fontWeight: 800 },
  subtitle: { color: '#81c784', fontSize: 15, marginBottom: 8 },
  input: {
    width: '100%', backgroundColor: '#1a3a2a',
    border: '1px solid #2d5c40', borderRadius: 12,
    padding: '13px 16px', color: '#e8f5e9', fontSize: 15,
    direction: 'rtl', outline: 'none',
  },
  error: { color: '#ef9a9a', fontSize: 13, textAlign: 'center' },
  submitBtn: (loading) => ({
    width: '100%', backgroundColor: loading ? '#2d5c40' : '#4caf50',
    border: 'none', borderRadius: 14, padding: '14px 0',
    color: loading ? '#4a7c59' : '#0a1f14',
    fontSize: 16, fontWeight: 800, cursor: loading ? 'default' : 'pointer',
  }),
  switchBtn: {
    background: 'none', border: 'none', color: '#4caf50',
    fontSize: 14, cursor: 'pointer', marginTop: 4,
  },
};

export default function AuthPage() {
  const router = useRouter();
  const login = useWebAuthStore((s) => s.login);
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password.trim()) { setError('נא למלא אימייל וסיסמה'); return; }
    if (mode === 'register' && !name.trim()) { setError('נא למלא שם'); return; }

    setLoading(true);
    try {
      const res = mode === 'login'
        ? await api.login({ email: email.trim(), password })
        : await api.register({ name: name.trim(), email: email.trim(), password });
      login(res.token, res.user);
      router.replace('/library');
    } catch (e) {
      setError(e.message || 'שגיאה, נסה שוב');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={C.page}>
      <form style={C.card} onSubmit={handleSubmit}>
        <span style={C.logo}>📖</span>
        <div style={C.title}>Torah App</div>
        <div style={C.subtitle}>{mode === 'login' ? 'כניסה לחשבון' : 'יצירת חשבון חדש'}</div>

        {mode === 'register' && (
          <input
            style={C.input}
            placeholder="שם מלא"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
        )}
        <input
          style={C.input}
          type="email"
          placeholder="אימייל"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <input
          style={C.input}
          type="password"
          placeholder="סיסמה (לפחות 6 תווים)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
        />

        {error && <div style={C.error}>{error}</div>}

        <button type="submit" style={C.submitBtn(loading)} disabled={loading}>
          {loading ? '...' : mode === 'login' ? 'כניסה' : 'הרשמה'}
        </button>

        <button
          type="button"
          style={C.switchBtn}
          onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
        >
          {mode === 'login' ? 'אין לך חשבון? הירשם כאן' : 'כבר יש לך חשבון? כנס כאן'}
        </button>
      </form>
    </div>
  );
}
