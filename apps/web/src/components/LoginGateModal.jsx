'use client';
import { useRouter } from 'next/navigation';
import { useWebPlayerStore } from '../lib/webPlayerStore.js';

const C = {
  overlay: {
    position: 'fixed', inset: 0, backgroundColor: '#000a', zIndex: 400,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  sheet: {
    backgroundColor: '#0a1f14', border: '1px solid #1a3a2a', borderRadius: 20,
    padding: '32px 28px', maxWidth: 380, width: '100%',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
    textAlign: 'center', position: 'relative',
  },
  closeBtn: {
    position: 'absolute', top: 14, right: 16, background: 'none',
    border: 'none', color: '#4a7c59', fontSize: 20, cursor: 'pointer',
  },
  icon: { fontSize: 52 },
  title: { color: '#e8f5e9', fontSize: 18, fontWeight: 700 },
  body: { color: '#81c784', fontSize: 14, lineHeight: 1.6 },
  loginBtn: {
    padding: '12px 36px', borderRadius: 14, backgroundColor: '#4caf50',
    color: '#0a1f14', fontWeight: 800, fontSize: 15, border: 'none',
    cursor: 'pointer', marginTop: 6,
  },
};

export function LoginGateModal() {
  const visible = useWebPlayerStore((s) => s.loginGateVisible);
  const dismiss = useWebPlayerStore((s) => s.dismissLoginGate);
  const router = useRouter();

  if (!visible) return null;

  return (
    <div style={C.overlay} onClick={dismiss}>
      <div style={C.sheet} onClick={(e) => e.stopPropagation()}>
        <button style={C.closeBtn} onClick={dismiss}>✕</button>
        <div style={C.icon}>📚</div>
        <div style={C.title}>הגעת למגבלת החינמי</div>
        <div style={C.body}>האזנת ל-5 שיעורים החודש. כנס לחשבון כדי להמשיך להאזין.</div>
        <button style={C.loginBtn} onClick={() => { dismiss(); router.push('/auth'); }}>
          כניסה / הרשמה
        </button>
      </div>
    </div>
  );
}
