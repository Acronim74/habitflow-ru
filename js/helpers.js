// ── Утилиты ────────────────────────────────

function _uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
    .replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

function _todayKey() {
  return _dateKey(TODAY);
}

function _dateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Локальная полночь для YYYY-MM-DD (не new Date(str) — в UTC иначе ломаются сравнения в восточных TZ). */
function _localMidnight(dateKeyStr) {
  if (!dateKeyStr) return new Date(0);
  const p = String(dateKeyStr).split('-').map(Number);
  if (p.length < 3 || p.some(n => Number.isNaN(n))) return new Date(0);
  return new Date(p[0], p[1] - 1, p[2]);
}

function _daysAgo(dateKeyStr) {
  const [y, m, d] = dateKeyStr.split('-').map(Number);
  const past = new Date(y, m - 1, d);
  const diff = TODAY - past;
  return Math.floor(diff / 86400000);
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Расписание ─────────────────────────────

function _isWorkDay(h, dateKeyStr) {
  if (!h.schedule || h.schedule.length === 0) return true;
  const [y, m, d] = dateKeyStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const dow = (date.getDay() + 6) % 7;
  return h.schedule.includes(dow);
}

function _prevWorkDay(h, dateKeyStr) {
  const [y, m, d] = dateKeyStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  for (let i = 1; i <= 60; i++) {
    date.setDate(date.getDate() - 1);
    const key = _dateKey(date);
    if (_isWorkDay(h, key)) return key;
  }
  return null;
}

// ── Стрики ─────────────────────────────────

function calcStreakAt(h, dateKeyStr) {
  let streak = 0;
  let cur = dateKeyStr;
  while (true) {
    if (!_isWorkDay(h, cur)) {
      cur = _prevWorkDay(h, cur);
      if (!cur) break;
      continue;
    }
    if (!h.checks?.[cur]) break;
    streak++;
    cur = _prevWorkDay(h, cur);
    if (!cur) break;
  }
  return streak;
}

function calcStreak(h) {
  return calcStreakAt(h, _todayKey());
}

function calcCleanStreakAt(h, dateKeyStr) {
  let streak = 0;
  const [y, m, d] = dateKeyStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const created = _localMidnight(h.createdAt);
  while (date >= created) {
    const key = _dateKey(date);
    if (h.slips?.[key]) break;
    streak++;
    date.setDate(date.getDate() - 1);
  }
  return streak;
}

function bestStreak(h) {
  const keys = Object.keys(h.checks || {}).sort();
  let best = 0, cur = 0, prev = null;
  keys.forEach(k => {
    if (prev) {
      const [py, pm, pd] = prev.split('-').map(Number);
      const [ky, km, kd] = k.split('-').map(Number);
      const diff = (new Date(ky, km-1, kd) - new Date(py, pm-1, pd)) / 86400000;
      cur = diff === 1 ? cur + 1 : 1;
    } else {
      cur = 1;
    }
    if (cur > best) best = cur;
    prev = k;
  });
  return best;
}

// ── Очки ───────────────────────────────────

function calcPoints() {
  const allDates = new Set();

  habits.forEach(h => {
    Object.keys(h.checks || {}).forEach(k => allDates.add(k));
    Object.keys(h.slips  || {}).forEach(k => allDates.add(k));
    Object.keys(h.clean || {}).forEach(k => allDates.add(k));
  });

  habits.filter(h => h.bad).forEach(h => {
    const d = _localMidnight(h.createdAt);
    while (d <= TODAY) {
      allDates.add(_dateKey(d));
      d.setDate(d.getDate() + 1);
    }
  });

  const curMonth = _todayKey().slice(0, 7);
  let total = 0, month = 0;

  allDates.forEach(dk => {
    let dayPts = 0;
    const goodHabits = habits.filter(h => !h.bad);
    const scheduledToday = goodHabits.filter(h => _isWorkDay(h, dk));
    let scheduledDone = 0;

    habits.forEach(h => {
      if (h.bad) {
        const day = _localMidnight(dk);
        const created = _localMidnight(h.createdAt);
        if (day < created) return;
        if (h.slips?.[dk]) return;
        if (!h.clean?.[dk]) return;
        const base = 5;
        const streak = calcCleanStreakAt(h, dk);
        let mult = 1;
        if (_daysAgo(dk) <= 3) {
          if      (streak >= 100) mult = 5;
          else if (streak >= 30)  mult = 3;
          else if (streak >= 7)   mult = 2;
        }
        dayPts += base * mult;
      } else {
        const isBonus = !_isWorkDay(h, dk) && h.checks?.[dk];
        if (!_isWorkDay(h, dk) && !isBonus) return;
        if (!h.checks?.[dk]) return;
        if (_isWorkDay(h, dk)) scheduledDone++;
        const base = 10;
        const streak = calcStreakAt(h, dk);
        let mult = 1;
        if (_daysAgo(dk) <= 3) {
          if      (streak >= 100) mult = 5;
          else if (streak >= 30)  mult = 3;
          else if (streak >= 7)   mult = 2;
        }
        dayPts += base * mult;
      }
    });

    if (scheduledToday.length > 0 &&
        scheduledDone >= scheduledToday.length) {
      dayPts += 25;
    }

    total += dayPts;
    if (dk.slice(0, 7) === curMonth) month += dayPts;
  });

  return { total, month };
}

// ── Стадии ─────────────────────────────────

function getStage(pts) {
  for (let i = STAGES.length - 1; i >= 0; i--) {
    if (pts >= STAGES[i].pts) return STAGES[i];
  }
  return STAGES[0];
}

function getStageIdx(pts) {
  for (let i = STAGES.length - 1; i >= 0; i--) {
    if (pts >= STAGES[i].pts) return i;
  }
  return 0;
}

function nextStage(pts) {
  for (let i = 0; i < STAGES.length; i++) {
    if (pts < STAGES[i].pts) return STAGES[i];
  }
  return null;
}

// ── Бейджи ─────────────────────────────────

function checkBadges() {
  let newBadges = [];
  BADGES.forEach(b => {
    if (!earnedBadges.includes(b.id) && b.check()) {
      earnedBadges.push(b.id);
      newBadges.push(b);
    }
  });
  if (newBadges.length > 0) {
    saveData();
    newBadges.forEach(b => _showBadgeToast(b));
    if (typeof renderNav === 'function') renderNav();
    if (currentScreen === 'today' && typeof _renderBadgesGrid === 'function') {
      _renderBadgesGrid();
    }
  }
}

function _checkChampion() {
  if (!habits.some(h => !h.bad)) return false;
  const y = TODAY.getFullYear();
  const m = TODAY.getMonth();
  for (let d = 1; d < TODAY.getDate(); d++) {
    const dk = _dateKey(new Date(y, m, d));
    const good = habits.filter(h => !h.bad && _isWorkDay(h, dk));
    if (good.length === 0) continue;
    const done = good.filter(h => h.checks?.[dk]).length;
    if (done < good.length) return false;
  }
  return TODAY.getDate() > 1;
}

function _checkTimeBadge(fromH, toH, minDays) {
  const days = new Set();
  habits.forEach(h => {
    if (h.bad) return;
    Object.entries(h.times || {}).forEach(([dk, iso]) => {
      if (!iso) return;
      const hour = new Date(iso).getHours();
      const ok = toH === 24
        ? hour >= fromH
        : hour >= fromH && hour < toH;
      if (ok) days.add(dk);
    });
  });
  return days.size >= minDays;
}

function _checkLucky() {
  const tk = _todayKey();
  const done = habits.filter(h => !h.bad && h.checks?.[tk]).length;
  return done >= 7;
}

// ── Расписание — подпись ───────────────────

function scheduleLabel(h) {
  if (!h.schedule || h.schedule.length === 0 ||
      h.schedule.length === 7) return '';
  const names = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
  if (JSON.stringify(h.schedule) === JSON.stringify([0,1,2,3,4]))
    return ' · Будни';
  if (JSON.stringify(h.schedule) === JSON.stringify([5,6]))
    return ' · Выходные';
  return ' · ' + h.schedule.map(i => names[i]).join(',');
}

// ── Конфетти ───────────────────────────────

/** @param {{ lite?: boolean }} [opts] — lite: меньше частиц и кадров, не конкурирует с длинным CSS-flip */
function spawnConfetti(opts) {
  const lite = !!(opts && opts.lite);
  const canvas = document.getElementById('confCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = [
    '#52b788','#74c69d','#c8e6d4',
    '#d4a017','#f0cc6a',
    '#4a90d9','#c47fd4','#e07b39',
  ];
  const count = lite ? 48 : 130;
  const maxFrames = lite ? 72 : 160;
  const fadeStart = lite ? 40 : 70;
  const pieces = Array.from({ length: count }, () => ({
    x:       Math.random() * canvas.width,
    y:       -10 - Math.random() * 120,
    w:       6   + Math.random() * 8,
    h:       3   + Math.random() * 4,
    color:   colors[Math.floor(Math.random() * colors.length)],
    vx:      (Math.random() - 0.5) * 4,
    vy:      2   + Math.random() * 4,
    rot:     Math.random() * Math.PI * 2,
    vrot:    (Math.random() - 0.5) * 0.2,
    opacity: 1,
  }));

  let frame = 0;
  (function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      p.x   += p.vx;
      p.y   += p.vy;
      p.rot += p.vrot;
      p.vy  += 0.07;
      if (frame > fadeStart) p.opacity = Math.max(0, p.opacity - 0.013);
      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    frame++;
    if (frame < maxFrames) requestAnimationFrame(draw);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  })();
}
