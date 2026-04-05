// ── Глобальное состояние ───────────────────
let habits        = [];   // активные привычки
let archived      = [];   // архивированные
let earnedBadges  = [];   // id полученных бейджей
let gender        = null; // 'female' | 'male' | null
let moodLog       = {};   // { "YYYY-MM-DD": 0..4 }
let moodEnabled   = false; // дневник настроения вкл/выкл
let currentScreen = 'today';
let cleanTodaySet = new Set(); // runtime only, не сохраняется

/** Период теплокарт на экране «Аналитика»: 'year' | 'quarter' | 'month' | 'week' */
let _analyticsPeriod = 'month';

// ── Временные состояния форм ───────────────
let _createType     = 'good'; // 'good' | 'bad'
let _createIcon     = '⭐';
let _createCat      = '';
let _createSchedule = null;   // null = каждый день
                               // [] = кастомные дни недели (0=Пн..6=Вс)

// ── Сохранение ─────────────────────────────
function saveData() {
  try {
    const data = {
      habits,
      archived,
      earnedBadges,
      gender,
      moodLog,
      moodEnabled,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Ошибка сохранения:', e);
  }
}

// ── Загрузка ───────────────────────────────
function loadData() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    const d = JSON.parse(raw);
    habits       = Array.isArray(d.habits)       ? d.habits       : [];
    archived     = Array.isArray(d.archived)     ? d.archived     : [];
    earnedBadges = Array.isArray(d.earnedBadges) ? d.earnedBadges : [];
    gender       = d.gender || null;
    moodLog      = (d.moodLog && typeof d.moodLog === 'object') ? d.moodLog : {};
    moodEnabled  = d.moodEnabled || false;
    _migrateData();
  } catch (e) {
    console.error('Ошибка загрузки:', e);
  }
}

// ── Миграция старых данных ─────────────────
function _migrateData() {
  [...habits, ...archived].forEach(h => {
    delete h._cleanToday;
    if (!h.id)        h.id       = _uuid();
    if (!h.checks)    h.checks   = {};
    if (!h.times)     h.times    = {};
    if (!h.notes)     h.notes    = {};
    if (!h.slips)     h.slips    = {};
    if (!h.category)  h.category = '';
    if (!h.icon)      h.icon     = h.bad ? '🚫' : '⭐';
    if (!h.createdAt) h.createdAt = _todayKey();
    if (h.schedule === undefined) h.schedule = null;
  });

  let moodMigrateDirty = false;
  habits.forEach(h => {
    if (h.notes) {
      Object.entries(h.notes).forEach(([dk, note]) => {
        if (note.mood !== undefined) {
          if (moodLog[dk] === undefined) moodLog[dk] = note.mood;
          delete note.mood;
          moodMigrateDirty = true;
        }
      });
    }
  });
  if (moodMigrateDirty) saveData();
}
