'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWebAuthStore } from '../lib/webAuthStore.js';

const C = {
  nav: {
    backgroundColor: '#0a1f14',
    borderBottom: '1px solid #1a3a2a',
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  logo: { color: '#4caf50', fontWeight: 800, fontSize: 18, textDecoration: 'none' },
  links: { display: 'flex', gap: 8, alignItems: 'center' },
  link: (active) => ({
    color: active ? '#4caf50' : '#81c784',
    textDecoration: 'none',
    padding: '6px 14px',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: active ? 700 : 400,
    backgroundColor: active ? '#1a3a2a' : 'transparent',
  }),
};

export function Nav() {
  const pathname = usePathname();
  const user = useWebAuthStore((s) => s.user);

  return (
    <nav style={C.nav}>
      <Link href="/" style={C.logo}>📖 Torah App</Link>
      <div style={C.links}>
        <Link href="/" style={C.link(pathname === '/')}>בית</Link>
        <Link href="/search" style={C.link(pathname === '/search')}>חיפוש</Link>
        <Link href="/library" style={C.link(pathname === '/library')}>
          {user ? '🔖 ספריה' : '👤 ספריה'}
        </Link>
        {!user && (
          <Link href="/auth" style={{ ...C.link(false), backgroundColor: '#4caf50', color: '#0a1f14', fontWeight: 700 }}>
            כניסה
          </Link>
        )}
      </div>
    </nav>
  );
}
