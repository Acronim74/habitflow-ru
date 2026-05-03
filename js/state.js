// ── Глобальное состояние ───────────────────
let habits        = [];   // активные привычки
let archived      = [];   // архивированные
let earnedBadges  = [];   // id полученных бейджей
let moodLog       = {};   // { "YYYY-MM-DD": 0..4 }
let moodEnabled   = false; // дневник настроения вкл/выкл
/** Карточка «Прогресс дня» (сегменты) на экране «Сегодня» */
let dayProgressWidgetEnabled = true;
/** Карточка «Личный рекорд» на экране «Сегодня» */
let bestStreakWidgetEnabled = true;
/** Карточка «Серия» на экране «Сегодня» (по умолчанию вкл.; в старых дампах ключа нет) */
let seriesWidgetEnabled = true;
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
let _editingId = null; // id редактируемой привычки, null = создание новой

// ── Сохранение ─────────────────────────────
function saveData() {
  try {
    const data = {
      schemaVersion: SCHEMA_VERSION,
      habits,
      archived,
      earnedBadges,
      moodLog,
      moodEnabled,
      dayProgressWidgetEnabled,
      bestStreakWidgetEnabled,
      seriesWidgetEnabled,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch (e) {
    if (e.name === 'QuotaExceededError' && typeof showToast === 'function') {
      showToast('⚠️ Хранилище переполнено — сделай экспорт резервной копии');
    }
  }
}

// ── Загрузка ───────────────────────────────
function loadData() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    const d = JSON.parse(raw);
    _runMigrations(d);
    habits       = Array.isArray(d.habits)       ? d.habits       : [];
    archived     = Array.isArray(d.archived)     ? d.archived     : [];
    earnedBadges = Array.isArray(d.earnedBadges) ? d.earnedBadges : [];
    moodLog      = (d.moodLog && typeof d.moodLog === 'object') ? d.moodLog : {};
    moodEnabled  = d.moodEnabled || false;
    dayProgressWidgetEnabled = d.dayProgressWidgetEnabled === undefined ? true : !!d.dayProgressWidgetEnabled;
    bestStreakWidgetEnabled = d.bestStreakWidgetEnabled === undefined ? true : !!d.bestStreakWidgetEnabled;
    seriesWidgetEnabled = d.seriesWidgetEnabled === undefined ? true : !!d.seriesWidgetEnabled;
    _migrateData();
    _syncCleanTodaySetFromData();
  } catch (_e) {
    // повреждённые данные — игнорируем, сбрасываем к дефолту
  }
}

function _syncCleanTodaySetFromData() {
  const tk = _todayKey();
  cleanTodaySet = new Set();
  habits.filter(h => h.bad).forEach(h => {
    if (h.clean?.[tk]) cleanTodaySet.add(h.id);
  });
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
    if (!h.clean)     h.clean    = {};
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

  // Чистим значок "Чемпион", если он был выдан по старому багу
  if (earnedBadges.includes('champion') && !_checkChampion()) {
    earnedBadges = earnedBadges.filter(id => id !== 'champion');
  }
}

// ── Миграции схемы данных ──────────────────
function _runMigrations(d) {
  const v = d.schemaVersion || 0;

  // v0 → v1: moodLog переехал из h.notes в отдельный объект
  if (v < 1) {
    if (!d.moodLog) d.moodLog = {};
    const allHabits = [
      ...(Array.isArray(d.habits)   ? d.habits   : []),
      ...(Array.isArray(d.archived) ? d.archived : []),
    ];
    allHabits.forEach(h => {
      if (h.notes) {
        Object.entries(h.notes).forEach(([dk, note]) => {
          if (note.mood !== undefined && d.moodLog[dk] === undefined) {
            d.moodLog[dk] = note.mood;
          }
          delete note.mood;
        });
      }
    });
  }

  // Здесь будут добавляться новые миграции:
  // if (v < 2) { ... }
  // if (v < 3) { ... }
}
