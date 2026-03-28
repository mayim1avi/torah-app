'use client';
import { useRouter } from 'next/navigation';
import { useCategories, useCurrentParasha } from '@torah-app/api-client';

const C = {
  page: { maxWidth: 900, margin: '0 auto', padding: '32px 16px' },
  hero: { marginBottom: 32 },
  heroTitle: { fontSize: 32, fontWeight: 800, color: '#e8f5e9', marginBottom: 8 },
  heroSub: { color: '#81c784', fontSize: 16 },
  sectionTitle: { color: '#81c784', fontSize: 13, fontWeight: 700, marginBottom: 16, letterSpacing: 0.4 },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: 12,
  },
  parshaCard: {
    backgroundColor: '#0d2b1a',
    border: '2px solid #4caf50',
    borderRadius: 14,
    padding: '18px 16px',
    cursor: 'pointer',
    textAlign: 'right',
    gridColumn: '1 / -1',
  },
  parshaLabel: { color: '#4caf50', fontSize: 11, fontWeight: 700, letterSpacing: 0.6, marginBottom: 4 },
  parshaName: { color: '#e8f5e9', fontSize: 20, fontWeight: 800, marginBottom: 4 },
  parshaSub: { color: '#81c784', fontSize: 12 },
  card: {
    backgroundColor: '#0a1f14',
    border: '1px solid #1a3a2a',
    borderRadius: 14,
    padding: '18px 16px',
    cursor: 'pointer',
    textAlign: 'right',
  },
  cardName: { color: '#e8f5e9', fontSize: 15, fontWeight: 700, marginBottom: 4 },
  cardSub: { color: '#4a7c59', fontSize: 12 },
  loading: { display: 'flex', justifyContent: 'center', padding: 48, color: '#81c784', fontSize: 16 },
};

function formatShabbatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'long' });
}

export default function HomePage() {
  const router = useRouter();
  const { data: categories = [], isLoading } = useCategories();
  const { data: parshaData } = useCurrentParasha();
  const parasha = parshaData?.parasha;

  if (isLoading) return <div style={C.loading}>טוען...</div>;

  return (
    <div style={C.page}>
      <div style={C.hero}>
        <h1 style={C.heroTitle}>📖 Torah App</h1>
        <p style={C.heroSub}>בחר קטגוריה להאזנה לשיעורי תורה</p>
      </div>

      {parasha?.categoryId && (
        <>
          <div style={C.sectionTitle}>הפרשה השבועית</div>
          <div style={{ ...C.grid, marginBottom: 32 }}>
            <div
              style={C.parshaCard}
              onClick={() => router.push(`/category/${parasha.categoryId}`)}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#112e1e'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#0d2b1a'; }}
            >
              <div style={C.parshaLabel}>פרשת השבוע</div>
              <div style={C.parshaName}>פרשת {parasha.hebrewName}</div>
              <div style={C.parshaSub}>שבת {formatShabbatDate(parasha.shabbatDate)}</div>
            </div>
          </div>
        </>
      )}

      <div style={C.sectionTitle}>קטגוריות</div>
      <div style={C.grid}>
        {categories.map((cat) => (
          <CategoryCard
            key={cat.id}
            cat={cat}
            onClick={() => router.push(`/category/${cat.id}`)}
          />
        ))}
      </div>
    </div>
  );
}

function CategoryCard({ cat, onClick }) {
  return (
    <div
      style={C.card}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#4caf50';
        e.currentTarget.style.backgroundColor = '#0f2a1a';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#1a3a2a';
        e.currentTarget.style.backgroundColor = '#0a1f14';
      }}
    >
      <div style={C.cardName}>{cat.name}</div>
      {cat.child_count > 0 && (
        <div style={C.cardSub}>{cat.child_count} תת-קטגוריות</div>
      )}
      {cat.lesson_count > 0 && (
        <div style={C.cardSub}>{cat.lesson_count} שיעורים</div>
      )}
    </div>
  );
}
