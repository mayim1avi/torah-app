import './globals.css';
import { Providers } from '../src/components/Providers.jsx';
import { Nav } from '../src/components/Nav.jsx';
import { MiniPlayer } from '../src/components/MiniPlayer.jsx';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Torah App',
  description: 'האזן לשיעורי תורה',
};

export default function RootLayout({ children }) {
  return (
    <html lang="he" dir="rtl">
      <body>
        <Providers>
          <Nav />
          <main>{children}</main>
          <MiniPlayer />
        </Providers>
      </body>
    </html>
  );
}
