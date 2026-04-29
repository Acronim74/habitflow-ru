// ── Константы ──────────────────────────────
const LS_KEY = 'habitflow_data';
const SCHEMA_VERSION = 1;
const TODAY  = new Date();

// Стадии развития персонажа
const STAGES = [
  { pts:0,     nameRU:'Начало',        emoji:'🌱',
    color:'#52b788', glow:'#95d5b2', ring:'#2d6a4f' },
  { pts:500,   nameRU:'В ритме',       emoji:'🏃',
    color:'#4a90d9', glow:'#89c4f0', ring:'#2167a8' },
  { pts:2000,  nameRU:'Устойчивость',  emoji:'⚔️',
    color:'#e07b39', glow:'#f0b07a', ring:'#b05a1a' },
  { pts:6000,  nameRU:'Сила привычки', emoji:'👑',
    color:'#c47fd4', glow:'#dba8e8', ring:'#8e3fa8' },
  { pts:15000, nameRU:'Опора',         emoji:'🎯',
    color:'#e85d4a', glow:'#f5a09a', ring:'#b02a1a' },
  { pts:35000, nameRU:'Мастер',        emoji:'🔥',
    color:'#d4a017', glow:'#f0cc6a', ring:'#a07010' },
];

// Бейджи достижений
const BADGES = [
  { id:'fire',
    emoji:'🔥', nameRU:'Первый огонь',
    descRU:'Серия 7 дней у любой привычки',
    check: () => habits.some(h => !h.bad && calcStreak(h) >= 7) },
  { id:'diamond',
    emoji:'💎', nameRU:'Бриллиант',
    descRU:'Серия 30 дней у любой привычки',
    check: () => habits.some(h => !h.bad && calcStreak(h) >= 30) },
  { id:'champion',
    emoji:'🏆', nameRU:'Чемпион',
    descRU:'100% выполнение за полный месяц',
    check: () => _checkChampion() },
  { id:'century',
    emoji:'⚡', nameRU:'Центурион',
    descRU:'Серия 100 дней у любой привычки',
    check: () => habits.some(h => !h.bad && calcStreak(h) >= 100) },
  { id:'owl',
    emoji:'🌙', nameRU:'Сова',
    descRU:'Отметка после 21:00 в 7 разных дней',
    check: () => _checkTimeBadge(21, 24, 7) },
  { id:'bird',
    emoji:'🌅', nameRU:'Жаворонок',
    descRU:'Отметка до 07:00 в 7 разных дней',
    check: () => _checkTimeBadge(0, 7, 7) },
  { id:'legend',
    emoji:'🎯', nameRU:'Легенда',
    descRU:'Серия 365 дней у любой привычки',
    check: () => habits.some(h => !h.bad && calcStreak(h) >= 365) },
  { id:'lucky',
    emoji:'🍀', nameRU:'Удача',
    descRU:'7 и более привычек за один день',
    check: () => _checkLucky() },
];

// Настроение — подписи
const MOOD_LABELS = [
  'Тяжело', 'Так себе', 'Нормально', 'Хорошо', 'Отлично'
];

/** Одна палитра для кнопок настроения, графика и аналитики */
const MOOD_COLORS = [
  '#c62828',
  '#e65100',
  '#f9a825',
  '#2e7d32',
  '#14532d',
];

// Категории привычек
const CATEGORIES = [
  { name:'Здоровье',   icon:'💪' },
  { name:'Спорт',      icon:'🏃' },
  { name:'Питание',    icon:'🥗' },
  { name:'Сон',        icon:'😴' },
  { name:'Учёба',      icon:'📚' },
  { name:'Работа',     icon:'💼' },
  { name:'Медитация',  icon:'🧘' },
  { name:'Творчество', icon:'🎨' },
  { name:'Финансы',    icon:'💰' },
  { name:'Социальное', icon:'👥' },
];

// Системы очков (справочно в комментариях в ТЗ)

// ── Демо-данные для онбординга ─────────────
const DEMO_HABITS = [
  {
    id: 'demo-1',
    name: 'Утренняя пробежка',
    icon: '🏃',
    category: 'Спорт',
    desc: 'Бег 20–30 минут каждое утро',
    bad: false,
    schedule: null,
    checks: {},
    slips: {},
    clean: {},
    times: {},
    notes: {},
    createdAt: '',
  },
  {
    id: 'demo-2',
    name: 'Читать 20 минут',
    icon: '📚',
    category: 'Учёба',
    desc: 'Любая книга перед сном',
    bad: false,
    schedule: [0,1,2,3,4],
    checks: {},
    slips: {},
    clean: {},
    times: {},
    notes: {},
    createdAt: '',
  },
  {
    id: 'demo-3',
    name: 'Медитация',
    icon: '🧘',
    category: 'Здоровье',
    desc: '10 минут утром',
    bad: false,
    schedule: null,
    checks: {},
    slips: {},
    clean: {},
    times: {},
    notes: {},
    createdAt: '',
  },
  {
    id: 'demo-4',
    name: 'Не курить',
    icon: '🚫',
    category: '',
    desc: '',
    bad: true,
    schedule: null,
    checks: {},
    slips: {},
    clean: {},
    times: {},
    notes: {},
    createdAt: '',
  },
];
