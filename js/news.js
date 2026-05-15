// ── HabitFlow — Новости и обновления ──────────
// Для добавления обновления: добавь объект в начало CHANGELOG
// Для добавления новости/совета: добавь объект в начало NEWS

const APP_VERSION = '1.1';

// ─── Список обновлений приложения ─────────────
// Показывается в модалке при первом запуске после обновления
// и в ленте новостей в разделе "Обновления"
const CHANGELOG = [
  {
    version: '1.1',
    date_ru: '16 мая 2026',
    date_en: 'May 16, 2026',
    title_ru: 'Цели и дорожные карты',
    title_en: 'Goals & Roadmaps',
    items_ru: [
      'Новый раздел «Цели» — три готовых 63-дневных трека',
      'Этапы с прогрессом: каждые 21 день — новый уровень',
      'Описания привычек: зачем выполнять и как это работает',
      'Превью первого этапа прямо на карточке цели',
    ],
    items_en: [
      'New Goals section — three ready-made 63-day tracks',
      'Stage progression: every 21 days unlocks the next level',
      'Habit descriptions: why each habit works and how to do it',
      'Stage 1 preview right on the goal card',
    ],
  },
];

// ─── Контентные новости и советы ──────────────
// Показываются в ленте новостей
// tag_ru / tag_en — короткий лейбл: "совет", "исследование", "обновление"
const NEWS = [
  // Пример — раскомментируй и заполни когда будет первая новость:
  // {
  //   id: 'n1',
  //   date_ru: '20 мая 2026',
  //   date_en: 'May 20, 2026',
  //   tag_ru: 'совет',
  //   tag_en: 'tip',
  //   title_ru: 'Заголовок новости',
  //   title_en: 'News title',
  //   body_ru: 'Текст новости. Может быть несколько предложений.',
  //   body_en: 'News body text. Can be multiple sentences.',
  // },
];
