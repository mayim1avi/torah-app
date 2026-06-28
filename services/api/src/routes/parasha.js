import { HDate, HebrewCalendar } from '@hebcal/core';

// Map hebcal English parsha name → our category ID
// Double parshiyot map to the first parsha's category
const PARASHA_TO_ID = {
  'Bereshit': 51,
  'Noach': 52,
  'Lech-Lecha': 53,
  'Vayera': 54,
  'Chayei Sara': 55,
  'Toldot': 56,
  'Vayetzei': 57,
  'Vayishlach': 58,
  'Vayeshev': 59,
  'Miketz': 60,
  'Vayigash': 61,
  'Vayechi': 62,
  'Shemot': 63,
  'Vaera': 64,
  'Bo': 65,
  'Beshalach': 66,
  'Yitro': 67,
  'Mishpatim': 68,
  'Terumah': 69,
  'Tetzaveh': 70,
  'Ki Tisa': 71,
  'Vayakhel': 72,
  'Pekudei': 73,
  'Vayakhel-Pekudei': 72,
  'Vayikra': 74,
  'Tzav': 75,
  'Shmini': 76,
  'Tazria': 77,
  'Metzora': 78,
  'Tazria-Metzora': 77,
  'Achrei Mot': 79,
  'Kedoshim': 80,
  'Achrei Mot-Kedoshim': 79,
  'Emor': 81,
  'Behar': 82,
  'Bechukotai': 83,
  'Behar-Bechukotai': 82,
  'Bamidbar': 84,
  'Nasso': 85,
  "Beha'alotcha": 86,
  'Shlach': 87,
  'Korach': 88,
  'Chukat': 89,
  'Balak': 90,
  'Chukat-Balak': 89,
  'Pinchas': 91,
  'Matot': 92,
  'Masei': 93,
  'Matot-Masei': 92,
  'Devarim': 94,
  'Vaetchanan': 95,
  'Eikev': 96,
  "Re'eh": 97,
  'Shoftim': 98,
  'Ki Teitzei': 99,
  'Ki Tavo': 100,
  'Nitzavim': 101,
  'Vayeilech': 102,
  'Nitzavim-Vayeilech': 101,
  "Ha'azinu": 103,
  'Vezot HaBracha': 104,
};

function getUpcomingParasha() {
  const today = new HDate();
  const end = new HDate(new Date(Date.now() + 8 * 24 * 3600 * 1000));
  const events = HebrewCalendar.calendar({ start: today, end, sedrot: true, il: true });
  // flag 1024 = PARASHA_HASHAVUA
  return events.find(e => e.getFlags() === 1024) ?? null;
}

export default async function parashaRoutes(fastify) {
  fastify.get('/parasha/current', async () => {
    const event = getUpcomingParasha();
    if (!event) return { parasha: null };

    // getDesc() returns e.g. "Parashat Tzav"
    const name = event.getDesc().replace('Parashat ', '');
    const categoryId = PARASHA_TO_ID[name] ?? null;
    const hebrewName = event.render('he').replace(/^פָּרָשַׁת\s*/, '').replace(/^פרשת\s*/, '');
    const shabbatDate = event.getDate().greg();

    return { parasha: { name, hebrewName, categoryId, shabbatDate } };
  });
}
