// ── Навигация ─────────────────────────────

let _obStep = 0;
const _OB_TOTAL = 6;

/** Короткие заголовки для строки прогресса (как в макете). */
const _OB_HEADINGS = [
  'ПРИВЕТСТВИЕ',
  'ОТМЕТКИ',
  'СОЗДАНИЕ ПРИВЫЧКИ',
  'СЕРИИ И ОЧКИ',
  'АНАЛИТИКА И ЗНАЧКИ',
  'ТВОИ ДАННЫЕ',
];

function _updateTopBarMeta() {
  const screenEl = document.getElementById('navScreenName');
  const mainEl   = document.getElementById('navDateMain');
  const weekEl   = document.getElementById('navDateWeek');
  const legacyEl = document.getElementById('todayDate');

  const map = {
    today: 'Сегодня',
    habits: 'Привычки',
    analytics: 'Аналитика',
    badges: 'Значки',
  };
  const d = new Date();
  const dateMain = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  const dateWeek = d.toLocaleDateString('ru-RU', { weekday: 'long' });

  if (screenEl) screenEl.textContent = map[currentScreen] || 'Сегодня';
  if (mainEl) mainEl.textContent = dateMain;
  if (weekEl) weekEl.textContent = dateWeek;

  // Совместимость со старым id (если он где-то останется)
  if (legacyEl) {
    legacyEl.textContent = d.toLocaleDateString('ru-RU', {
      weekday: 'long', day: 'numeric', month: 'long',
    });
  }
}

function navigate(screen) {
  currentScreen = screen;

  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.screen === screen);
  });

  document.querySelectorAll('.bottom-nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.screen === screen);
  });

  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
  });
  const id = 'screen' + screen.charAt(0).toUpperCase() + screen.slice(1);
  const el = document.getElementById(id);
  if (el) el.classList.add('active');

  _updateTopBarMeta();
  renderScreen();
}

function renderScreen() {
  if (currentScreen === 'today')     renderToday();
  if (currentScreen === 'habits')    renderHabits();
  if (currentScreen === 'analytics') renderAnalytics();
  if (currentScreen === 'badges')    renderBadges();
}

function renderAll() {
  renderNav();
  renderScreen();
  _syncMoodToggleUI();
  _syncDayProgressWidgetToggleUI();
  _syncBestStreakWidgetToggleUI();
  _syncSeriesWidgetToggleUI();
}

/** Синхронизирует переключатель дневника настроения: вкладка «Привычки» и меню «Виджеты». */
function _syncMoodToggleUI() {
  const on = moodEnabled;
  ['moodToggleBtn', 'moodToggleBurger'].forEach(id => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.style.background = on ? 'var(--accent)' : 'var(--border2)';
    const knob = btn.querySelector('.mood-toggle-knob') || btn.firstElementChild;
    if (knob) knob.style.left = on ? '23px' : '3px';
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
}

/** Переключатель карточки «Прогресс дня» в меню «Виджеты». */
function _syncDayProgressWidgetToggleUI() {
  const on = dayProgressWidgetEnabled;
  const btn = document.getElementById('dayProgressWidgetToggleBurger');
  if (!btn) return;
  btn.style.background = on ? 'var(--accent)' : 'var(--border2)';
  const knob = btn.querySelector('.mood-toggle-knob') || btn.firstElementChild;
  if (knob) knob.style.left = on ? '23px' : '3px';
  btn.setAttribute('aria-pressed', on ? 'true' : 'false');
}

/** Переключатель карточки «Личный рекорд» в меню «Виджеты». */
function _syncBestStreakWidgetToggleUI() {
  const on = bestStreakWidgetEnabled;
  const btn = document.getElementById('bestStreakWidgetToggleBurger');
  if (!btn) return;
  btn.style.background = on ? 'var(--accent)' : 'var(--border2)';
  const knob = btn.querySelector('.mood-toggle-knob') || btn.firstElementChild;
  if (knob) knob.style.left = on ? '23px' : '3px';
  btn.setAttribute('aria-pressed', on ? 'true' : 'false');
}

/** Переключатель карточки «Серия» в меню «Виджеты». */
function _syncSeriesWidgetToggleUI() {
  const on = seriesWidgetEnabled;
  const btn = document.getElementById('seriesWidgetToggleBurger');
  if (!btn) return;
  btn.style.background = on ? 'var(--accent)' : 'var(--border2)';
  const knob = btn.querySelector('.mood-toggle-knob') || btn.firstElementChild;
  if (knob) knob.style.left = on ? '23px' : '3px';
  btn.setAttribute('aria-pressed', on ? 'true' : 'false');
}

// ── Экран Привычки ────────────────────────

function renderHabits() {
  const screen = document.getElementById('screenHabits');
  const good   = habits.filter(h => !h.bad);
  const bad    = habits.filter(h =>  h.bad);

  screen.innerHTML = `
    <div class="page-grid">
      <div></div>
      <div>
        <div class="flex" style="justify-content:space-between;
             align-items:center;margin-bottom:16px">
          <div>
            <h1 style="font-size:20px;font-weight:500">Привычки</h1>
            <p style="font-size:12px;color:var(--text3);margin-top:2px">
              ${habits.length} привычек · ${archived.length} в архиве
            </p>
          </div>
          <button type="button" class="btn btn-primary"
                  onclick="openCreate('good')">+ Добавить</button>
        </div>

        ${good.length > 0 ? `
          <div class="sec-header">
            <span class="sec-label">Полезные</span>
            <span class="sec-badge">${good.length}</span>
          </div>
          <div id="hgGoodList" style="display:flex;flex-direction:column;gap:8px">
          </div>` : ''}

        ${bad.length > 0 ? `
          <div class="sec-header" style="margin-top:8px">
            <span class="sec-label">Вредные</span>
            <span class="sec-badge bad">${bad.length}</span>
          </div>
          <div id="hgBadList" style="display:flex;flex-direction:column;gap:8px">
          </div>` : ''}

        ${habits.length === 0 ? `
          <div style="text-align:center;padding:48px 0;color:var(--text3)">
            <div style="font-size:32px;margin-bottom:12px">🌿</div>
            <div style="font-size:14px">Добавь первую привычку</div>
          </div>` : ''}

        <!-- Дневник настроения -->
        <div style="margin-top:24px;padding-top:16px;
                    border-top:0.5px solid var(--border)">
          <div class="flex" style="justify-content:space-between;
                                    align-items:center">
            <div>
              <div style="font-size:14px;font-weight:500">
                Дневник настроения
              </div>
              <div style="font-size:12px;color:var(--text3);margin-top:2px">
                Отмечай настроение каждый день - видно в аналитике
              </div>
            </div>
            <button type="button"
                    onclick="toggleMood()"
                    id="moodToggleBtn"
                    aria-pressed="${moodEnabled ? 'true' : 'false'}"
                    aria-label="Дневник настроения"
                    style="width:44px;height:24px;border-radius:12px;
                           border:none;cursor:pointer;
                           position:relative;transition:background .2s;
                           background:${moodEnabled ? 'var(--accent)' : 'var(--border2)'}">
              <span class="mood-toggle-knob" style="display:block;width:18px;height:18px;border-radius:50%;
                          background:#fff;position:absolute;top:3px;
                          transition:left .2s;
                          left:${moodEnabled ? '23px' : '3px'}">
              </span>
            </button>
          </div>
        </div>

        ${archived.length > 0 ? `
          <div style="margin-top:24px;padding-top:16px;
                      border-top:0.5px solid var(--border)">
            <button type="button"
                    onclick="toggleArchiveSection()"
                    style="display:flex;justify-content:space-between;
                           align-items:center;width:100%;background:transparent;
                           border:none;cursor:pointer;padding:0;font-family:inherit">
              <div>
                <div style="font-size:14px;font-weight:500;color:var(--text1)">
                  Архив
                </div>
                <div style="font-size:12px;color:var(--text3);margin-top:2px">
                  ${archived.length} привычек
                </div>
              </div>
              <div id="archiveChevron"
                   style="font-size:16px;color:var(--text3);
                          transition:transform .2s">▾</div>
            </button>
            <div id="archiveList"
                 style="display:none;flex-direction:column;
                        gap:8px;margin-top:12px"></div>
          </div>` : ''}
      </div>
      <div></div>
    </div>`;

  good.forEach(h => {
    const card = _buildHabitManageCard(h);
    document.getElementById('hgGoodList')?.appendChild(card);
  });
  bad.forEach(h => {
    const card = _buildHabitManageCard(h);
    document.getElementById('hgBadList')?.appendChild(card);
  });

  if (archived.length > 0) {
    const archiveList = document.getElementById('archiveList');
    if (archiveList) {
      archived.forEach(h => {
        const card = _buildArchivedCard(h);
        archiveList.appendChild(card);
      });
    }
  }
}

function toggleArchiveSection() {
  const list     = document.getElementById('archiveList');
  const chevron  = document.getElementById('archiveChevron');
  if (!list) return;
  const isOpen = list.style.display === 'flex';
  list.style.display    = isOpen ? 'none' : 'flex';
  list.style.flexDirection = 'column';
  if (chevron) chevron.style.transform = isOpen ? '' : 'rotate(180deg)';
}

function _buildArchivedCard(h) {
  const div = document.createElement('div');
  div.className = 'panel panel-body';
  div.style.cssText = 'cursor:default;opacity:0.7';
  div.innerHTML = `
    <div class="flex" style="justify-content:space-between;align-items:flex-start">
      <div class="flex gap-8 items-center">
        <span style="font-size:20px">${h.icon || '⭐'}</span>
        <div>
          <div style="font-size:13px;font-weight:500;color:var(--text1)">
            ${esc(h.name)}
          </div>
          <div style="font-size:11px;color:var(--text3);margin-top:2px">
            ${h.bad ? '🚫 Вредная' : '✅ Полезная'}
            ${esc(scheduleLabel(h))}
          </div>
        </div>
      </div>
      <div class="flex gap-6">
        <button type="button" class="btn btn-ghost"
                style="font-size:12px;padding:5px 10px"
                onclick="restoreHabit('${h.id}')">
          Восстановить
        </button>
        <button type="button" class="btn btn-ghost"
                style="font-size:12px;padding:5px 10px;color:var(--bad);
                       border-color:var(--bad-light)"
                onclick="confirmDeleteArchived('${h.id}')">
          Удалить
        </button>
      </div>
    </div>`;
  return div;
}

function confirmDeleteArchived(habitId) {
  const h = archived.find(x => x.id === habitId);
  if (!h) return;
  const ok = confirm('Удалить «' + h.name + '» из архива?\nВся история будет удалена безвозвратно.');
  if (!ok) return;
  archived = archived.filter(x => x.id !== habitId);
  saveData();
  renderHabits();
  showToast('Привычка удалена из архива');
}

function toggleMood() {
  moodEnabled = !moodEnabled;
  saveData();
  _syncMoodToggleUI();

  const moodSection = document.getElementById('moodSection');
  if (moodSection) {
    if (moodEnabled) {
      moodSection.classList.remove('hidden');
      _renderMood(_todayKey());
    } else {
      moodSection.classList.add('hidden');
    }
  }

  showToast(moodEnabled ? '😊 Дневник настроения включён' : 'Дневник настроения выключен');
}

function toggleDayProgressWidget() {
  dayProgressWidgetEnabled = !dayProgressWidgetEnabled;
  saveData();
  _syncDayProgressWidgetToggleUI();
  const dayProgressSection = document.getElementById('dayProgressSection');
  if (dayProgressSection) {
    dayProgressSection.classList.toggle('hidden', !dayProgressWidgetEnabled);
  }
  showToast(dayProgressWidgetEnabled
    ? 'Карточка «Прогресс дня» на экране «Сегодня» включена'
    : 'Карточка «Прогресс дня» скрыта');
}

function toggleBestStreakWidget() {
  bestStreakWidgetEnabled = !bestStreakWidgetEnabled;
  saveData();
  _syncBestStreakWidgetToggleUI();
  const streakBestSection = document.getElementById('streakBestSection');
  if (streakBestSection) {
    streakBestSection.classList.toggle('hidden', !bestStreakWidgetEnabled);
  }
  showToast(bestStreakWidgetEnabled
    ? 'Карточка «Личный рекорд» на экране «Сегодня» включена'
    : 'Карточка «Личный рекорд» скрыта');
}

function toggleSeriesWidget() {
  seriesWidgetEnabled = !seriesWidgetEnabled;
  saveData();
  _syncSeriesWidgetToggleUI();
  const streakSeriesSection = document.getElementById('streakSeriesSection');
  if (streakSeriesSection) {
    streakSeriesSection.classList.toggle('hidden', !seriesWidgetEnabled);
  }
  showToast(seriesWidgetEnabled
    ? 'Карточка «Серия» на экране «Сегодня» включена'
    : 'Карточка «Серия» скрыта');
}

function _buildHabitManageCard(h) {
  const streak = h.bad ? calcCleanStreakAt(h, _todayKey()) : calcStreak(h);
  const best   = bestStreak(h);
  const div = document.createElement('div');
  div.className = 'panel panel-body';
  div.style.cursor = 'default';
  div.innerHTML = `
    <div class="flex" style="justify-content:space-between;align-items:flex-start">
      <div class="flex gap-8 items-center">
        <span style="font-size:20px">${h.icon || '⭐'}</span>
        <div>
          <div style="font-size:13px;font-weight:500">${esc(h.name)}</div>
          <div style="font-size:11px;color:var(--text3);margin-top:2px">
            ${esc(h.category || '')}${esc(scheduleLabel(h))}
          </div>
        </div>
      </div>
      <div class="flex gap-6">
        <button type="button" class="btn btn-ghost"
                style="font-size:12px;padding:5px 10px"
                onclick="openEdit('${h.id}')">Изменить</button>
        <button type="button" class="btn btn-ghost"
                style="font-size:12px;padding:5px 10px"
                onclick="openDelete('${h.id}')">Удалить</button>
      </div>
    </div>
    <div class="flex gap-12 mt-8" style="font-size:12px;color:var(--text3)">
      <span>${h.bad ? '🛡️' : '🔥'} Стрик: ${streak} дн.</span>
      <span>🏆 Рекорд: ${best} дн.</span>
    </div>`;
  return div;
}

// ── Экран Аналитика ───────────────────────

function renderAnalytics() {
  const screen = document.getElementById('screenAnalytics');
  const { total, month } = calcPoints();
  const good = habits.filter(h => !h.bad);
  const bad  = habits.filter(h =>  h.bad);

  screen.innerHTML = `
    <div class="page-grid">
      <div></div>
      <div style="max-width:min(1200px,100%)">

        <div style="display:flex;justify-content:space-between;
                    align-items:center;margin-bottom:16px">
          <h1 style="font-size:20px;font-weight:500">Аналитика</h1>
          <div style="display:flex;gap:4px" id="periodTabs">
            <button type="button" class="btn btn-sm ${_analyticsPeriod==='week'    ?'btn-primary':'btn-ghost'}"
                    onclick="setAnalyticsPeriod('week')">Неделя</button>
            <button type="button" class="btn btn-sm ${_analyticsPeriod==='month'   ?'btn-primary':'btn-ghost'}"
                    onclick="setAnalyticsPeriod('month')">Месяц</button>
            <button type="button" class="btn btn-sm ${_analyticsPeriod==='quarter' ?'btn-primary':'btn-ghost'}"
                    onclick="setAnalyticsPeriod('quarter')">Квартал</button>
            <button type="button" class="btn btn-sm ${_analyticsPeriod==='year'    ?'btn-primary':'btn-ghost'}"
                    onclick="setAnalyticsPeriod('year')">Год</button>
          </div>
        </div>

        <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap">
          <div class="panel panel-body" style="flex:1 1 180px;min-width:0;text-align:center">
            <div style="font-size:11px;color:var(--text3);margin-bottom:4px">Всего очков</div>
            <div style="font-size:22px;font-weight:500">${total.toLocaleString()}</div>
          </div>
          <div class="panel panel-body" style="flex:1 1 180px;min-width:0;text-align:center">
            <div style="font-size:11px;color:var(--text3);margin-bottom:4px">За месяц</div>
            <div style="font-size:22px;font-weight:500">${month.toLocaleString()}</div>
          </div>
          <div class="panel panel-body" style="flex:1 1 180px;min-width:0;text-align:center">
            <div style="font-size:11px;color:var(--text3);margin-bottom:4px">Привычек</div>
            <div style="font-size:22px;font-weight:500">${habits.length}</div>
          </div>
        </div>

        ${(good.length > 0 || bad.length > 0) ? `
          <div style="display:flex;gap:12px;align-items:stretch;flex-wrap:wrap">
        ${good.length > 0 ? `
          <div class="panel panel-body" style="flex:1 1 300px;min-width:0">
            <div class="panel-title">Полезные привычки</div>
            <div id="hmGoodWrap"></div>
            <div id="hmGoodStats" style="display:flex;gap:16px;margin-top:12px;
                 padding-top:12px;border-top:0.5px solid var(--border)"></div>
          </div>` : ''}
        ${bad.length > 0 ? `
          <div class="panel panel-body" style="flex:1 1 300px;min-width:0">
            <div class="panel-title">Вредные привычки</div>
            <div id="hmBadWrap"></div>
            <div id="hmBadStats" style="display:flex;gap:16px;margin-top:12px;
                 padding-top:12px;border-top:0.5px solid var(--border)"></div>
          </div>` : ''}
          </div>` : ''}

        ${moodEnabled ? `
          <div class="panel panel-body" style="margin-top:12px">
            <div class="panel-title">Настроение</div>
            <div id="moodChartWrap"></div>
            <div id="moodChartStats"
                 style="display:flex;gap:16px;flex-wrap:wrap;margin-top:12px;
                        padding-top:12px;border-top:0.5px solid var(--border)">
            </div>
          </div>` : ''}

        ${habits.length === 0 ? `
          <div style="text-align:center;padding:48px 0;color:var(--text3)">
            <div style="font-size:32px;margin-bottom:12px">🌿</div>
            <div>Добавь привычки для аналитики</div>
          </div>` : ''}

      </div>
      <div></div>
    </div>`;

  if (good.length > 0) _renderHmGood();
  if (bad.length > 0)  _renderHmBad();
  if (moodEnabled) _renderMoodChart();
}

function setAnalyticsPeriod(period) {
  _analyticsPeriod = period;
  renderAnalytics();
}

function _getPeriodDates() {
  const dates = [];
  const end = new Date(TODAY);
  const start = new Date(TODAY);

  if (_analyticsPeriod === 'week') {
    start.setDate(start.getDate() - 6);
  } else if (_analyticsPeriod === 'month') {
    start.setDate(1);
  } else if (_analyticsPeriod === 'quarter') {
    start.setMonth(start.getMonth() - 2);
    start.setDate(1);
  } else {
    start.setFullYear(start.getFullYear() - 1);
    start.setDate(start.getDate() + 1);
  }

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(_dateKey(new Date(d)));
  }
  return dates;
}

function _buildGoodData(dates) {
  const good = habits.filter(h => !h.bad);
  const result = {};
  dates.forEach(dk => {
    const scheduled = good.filter(h => _isWorkDay(h, dk));
    const done = scheduled.filter(h => h.checks?.[dk]).length;
    result[dk] = {
      done,
      total: scheduled.length,
      pct: scheduled.length > 0 ? done / scheduled.length : null
    };
  });
  return result;
}

function _buildBadData(dates) {
  const bad = habits.filter(h => h.bad);
  const result = {};
  dates.forEach(dk => {
    const slips = bad.filter(h => h.slips?.[dk]).length;
    let clean = 0;
    let neutral = 0;
    bad.forEach(h => {
      const day = _localMidnight(dk);
      if (day < _localMidnight(h.createdAt)) return;
      if (h.slips?.[dk]) return;
      if (h.clean?.[dk]) clean++;
      else neutral++;
    });
    result[dk] = {
      slips,
      clean,
      neutral,
      total: bad.length,
    };
  });
  return result;
}

function _renderHmGood() {
  const dates  = _getPeriodDates();
  const gData  = _buildGoodData(dates);
  const wrap   = document.getElementById('hmGoodWrap');
  const stats  = document.getElementById('hmGoodStats');
  if (!wrap) return;

  const RU_MONTHS = ['Янв','Фев','Мар','Апр','Май','Июн',
                     'Июл','Авг','Сен','Окт','Ноя','Дек'];
  const DOW_SHORT = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
  const tk = _todayKey();

  function goodCellBg(pct) {
    if (pct === null) return '#e8e8e0';
    if (pct === 0)    return '#e8e8e0';
    if (pct < 0.4)    return 'var(--accent3)';
    if (pct < 0.7)    return 'var(--accent2)';
    if (pct < 1)      return 'var(--accent)';
    return 'var(--hm-lv4)';
  }

  if (_analyticsPeriod === 'week') {
    let html = `
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:8px">`;
    dates.forEach(dk => {
      const v = gData[dk];
      const pct = v.pct ?? 0;
      const barH = Math.max(4, Math.round(pct * 80));
      const bg = goodCellBg(v.pct);
      const dowIdx = (new Date(dk).getDay() + 6) % 7;
      const isToday = dk === tk;
      html += `
        <div style="display:flex;flex-direction:column;align-items:center;gap:5px">
          <div style="width:100%;height:80px;background:var(--bg);
                      border-radius:6px;overflow:hidden;
                      display:flex;align-items:flex-end">
            <div style="width:100%;height:${barH}px;
                        background:${bg};border-radius:3px 3px 0 0;
                        transition:height .3s ease"></div>
          </div>
          <div style="font-size:11px;color:${isToday?'var(--accent)':'var(--text3)'};
                      font-weight:${isToday?500:400}">
            ${DOW_SHORT[dowIdx]}
          </div>
          <div style="font-size:11px;font-weight:500;color:var(--accent)">
            ${v.pct !== null ? Math.round(v.pct*100)+'%' : '—'}
          </div>
        </div>`;
    });
    html += '</div>';
    wrap.innerHTML = html;
  }

  else if (_analyticsPeriod === 'month') {
    const y = TODAY.getFullYear(), m = TODAY.getMonth();
    const daysInMonth = new Date(y, m+1, 0).getDate();
    const firstDow = (new Date(y, m, 1).getDay() + 6) % 7;

    let html = `
      <div style="display:grid;grid-template-columns:repeat(7,1fr);
                  gap:3px;margin-bottom:4px">
        ${DOW_SHORT.map(d =>
          `<div style="font-size:10px;color:var(--text4);text-align:center">${d}</div>`
        ).join('')}
      </div>
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px">`;

    for (let i = 0; i < firstDow; i++) html += '<div></div>';
    for (let d = 1; d <= daysInMonth; d++) {
      const dk = y+'-'+String(m+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
      const v  = gData[dk];
      const isFuture = new Date(y,m,d) > TODAY;
      const isToday  = dk === tk;
      const bg = isFuture ? 'var(--border)' : goodCellBg(v?.pct ?? null);
      const outline = isToday
        ? 'outline:2px solid var(--accent);outline-offset:1px;' : '';
      const pctText = !isFuture && v?.pct !== null
        ? `<span style="font-size:8px;color:${v.pct>=0.7?'#fff':'var(--accent)'}">
            ${Math.round((v.pct??0)*100)}%</span>`
        : `<span style="font-size:9px;color:var(--text4)">${d}</span>`;
      html += `<div style="aspect-ratio:1;border-radius:5px;background:${bg};
                            ${outline}opacity:${isFuture?0.3:1};
                            display:flex;align-items:center;justify-content:center"
                    title="${dk}">${pctText}</div>`;
    }
    html += '</div>';
    wrap.innerHTML = html;
  }

  else if (_analyticsPeriod === 'quarter') {
    const curM = TODAY.getMonth();
    const curY = TODAY.getFullYear();
    const months = [curM-2, curM-1, curM];
    let html = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px">';

    months.forEach(mi => {
      let m = mi;
      let y = curY;
      while (m < 0) { m += 12; y--; }
      while (m > 11) { m -= 12; y++; }

      const daysInMonth = new Date(y, m+1, 0).getDate();
      const firstDow = (new Date(y, m, 1).getDay() + 6) % 7;

      html += `<div>
        <div style="font-size:11px;font-weight:500;color:var(--text2);
                    margin-bottom:6px">${RU_MONTHS[m]}</div>
        <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;
                    margin-bottom:2px">
          ${DOW_SHORT.map(d =>
            `<div style="font-size:8px;color:var(--text4);text-align:center">${d[0]}</div>`
          ).join('')}
        </div>
        <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px">`;

      for (let i=0; i<firstDow; i++) html += '<div></div>';
      for (let d=1; d<=daysInMonth; d++) {
        const dk = y+'-'+String(m+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
        const v = gData[dk];
        const isFuture = new Date(y,m,d) > TODAY;
        const isToday  = dk === tk;
        const bg = isFuture ? 'var(--border)' : goodCellBg(v?.pct ?? null);
        const outline = isToday
          ? 'outline:1.5px solid var(--accent);outline-offset:1px;' : '';
        html += `<div style="aspect-ratio:1;border-radius:3px;background:${bg};
                              ${outline}opacity:${isFuture?0.3:1}"
                      title="${dk}"></div>`;
      }
      html += '</div></div>';
    });
    html += '</div>';
    wrap.innerHTML = html;
  }

  else {
    if (window.innerWidth <= 480) {
      const nowY = TODAY.getFullYear();
      const months = Array.from({ length: 12 }, (_, i) => i);

      function renderHalfYear(startMonth) {
        const half = months.slice(startMonth, startMonth + 6);
        let block = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">';

        half.forEach(m => {
          const daysInMonth = new Date(nowY, m + 1, 0).getDate();
          const firstDow = (new Date(nowY, m, 1).getDay() + 6) % 7;

          block += `<div>
            <div style="font-size:10px;font-weight:500;color:var(--text2);margin-bottom:4px">
              ${RU_MONTHS[m]}
            </div>
            <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:1px;
                        margin-bottom:2px">
              ${DOW_SHORT.map(d =>
                `<div style="font-size:7px;color:var(--text4);text-align:center">${d[0]}</div>`
              ).join('')}
            </div>
            <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:1px">`;

          for (let i = 0; i < firstDow; i++) block += '<div></div>';
          for (let d = 1; d <= daysInMonth; d++) {
            const dk = nowY + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
            const day = new Date(nowY, m, d);
            const isFuture = day > TODAY;
            const isToday = dk === tk;
            const v = gData[dk];
            const bg = isFuture ? 'var(--border)' : goodCellBg(v?.pct ?? null);
            const outline = isToday ? 'outline:1px solid var(--accent);outline-offset:1px;' : '';
            block += `<div style="aspect-ratio:1;border-radius:2px;background:${bg};
                                  ${outline}opacity:${isFuture ? 0.3 : 1}"
                            title="${dk}"></div>`;
          }
          block += '</div></div>';
        });

        block += '</div>';
        return block;
      }

      wrap.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:12px">
          <div>${renderHalfYear(0)}</div>
          <div>${renderHalfYear(6)}</div>
        </div>
        <div style="display:flex;align-items:center;gap:5px;
                    margin-top:8px;justify-content:flex-end;flex-wrap:wrap">
          <div style="width:10px;height:10px;border-radius:2px;background:var(--border)"></div>
          <div style="width:10px;height:10px;border-radius:2px;background:var(--accent3)"></div>
          <div style="width:10px;height:10px;border-radius:2px;background:var(--accent2)"></div>
          <div style="width:10px;height:10px;border-radius:2px;background:var(--accent)"></div>
          <div style="width:10px;height:10px;border-radius:2px;background:var(--hm-lv4)"></div>
          <span style="font-size:10px;color:var(--text4);margin-left:2px">меньше → больше</span>
        </div>`;
    } else {
    const s = new Date(TODAY);
    s.setFullYear(s.getFullYear() - 1);
    s.setDate(s.getDate() + 1);
    while ((s.getDay() + 6) % 7 !== 0) s.setDate(s.getDate() + 1);

    const isPhone = window.innerWidth <= 480;
    const gap = isPhone ? 1 : 3;
    const cell = isPhone ? 5 : 11;
    const monthFont = isPhone ? 7 : 9;
    const monthHeight = isPhone ? 7 : 10;
    const monthBottom = isPhone ? 1 : 2;
    const todayOutline = isPhone
      ? 'outline:1px solid var(--accent);outline-offset:1px;'
      : 'outline:1.5px solid var(--accent);outline-offset:1px;';

    let html = `<div style="display:flex;gap:${gap}px;align-items:flex-start;overflow-x:auto">`;
    const cur = new Date(s);
    let prevM = -1;

    while (cur <= TODAY) {
      const m = cur.getMonth();
      let col = `<div style="display:flex;flex-direction:column;gap:${gap}px">`;
      col += `<div style="font-size:${monthFont}px;color:var(--text4);height:${monthHeight}px;
                           margin-bottom:${monthBottom}px;white-space:nowrap">
                ${m !== prevM ? RU_MONTHS[m] : ''}</div>`;
      prevM = m;
      col += `<div style="display:flex;flex-direction:column;gap:${gap}px">`;

      for (let i = 0; i < 7; i++) {
        const d = new Date(cur); d.setDate(d.getDate() + i);
        const dk = _dateKey(d);
        if (d > TODAY) {
          col += `<div style="width:${cell}px;height:${cell}px;border-radius:2px;opacity:0"></div>`;
          continue;
        }
        const v  = gData[dk];
        const bg = goodCellBg(v?.pct ?? null);
        const isToday = dk === tk;
        const outline = isToday
          ? todayOutline : '';
        col += `<div style="width:${cell}px;height:${cell}px;border-radius:2px;
                             background:${bg};${outline}"
                     title="${dk}: ${v?.pct !== null ? Math.round((v?.pct??0)*100)+'%' : '—'}">
                </div>`;
      }
      col += '</div></div>';
      html += col;
      cur.setDate(cur.getDate() + 7);
    }
    html += '</div>';

    html += `
      <div style="display:flex;align-items:center;gap:5px;
                  margin-top:8px;justify-content:flex-end">
        <div style="width:10px;height:10px;border-radius:2px;background:var(--border)"></div>
        <div style="width:10px;height:10px;border-radius:2px;background:var(--accent3)"></div>
        <div style="width:10px;height:10px;border-radius:2px;background:var(--accent2)"></div>
        <div style="width:10px;height:10px;border-radius:2px;background:var(--accent)"></div>
        <div style="width:10px;height:10px;border-radius:2px;background:var(--hm-lv4)"></div>
        <span style="font-size:10px;color:var(--text4);margin-left:2px">меньше → больше</span>
      </div>`;
    wrap.innerHTML = html;
    }
  }

  const allDates = Object.keys(gData);
  const activeDays = allDates.filter(dk => (gData[dk].pct ?? 0) > 0).length;
  const perfectDays = allDates.filter(dk => gData[dk].pct === 1).length;
  const withPct = allDates.filter(dk => gData[dk].pct !== null);
  const avgPct = withPct.length > 0
    ? Math.round(
        withPct.reduce((s, dk) => s + (gData[dk].pct ?? 0), 0) / withPct.length * 100
      )
    : 0;

  stats.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:2px">
      <div style="font-size:16px;font-weight:500">${activeDays}</div>
      <div style="font-size:10px;color:var(--text3)">активных дней</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:2px">
      <div style="font-size:16px;font-weight:500">${perfectDays}</div>
      <div style="font-size:10px;color:var(--text3)">идеальных дней</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:2px">
      <div style="font-size:16px;font-weight:500">${avgPct}%</div>
      <div style="font-size:10px;color:var(--text3)">средний % за период</div>
    </div>`;
}

function _renderHmBad() {
  const dates = _getPeriodDates();
  const bData = _buildBadData(dates);
  const wrap  = document.getElementById('hmBadWrap');
  const stats = document.getElementById('hmBadStats');
  if (!wrap) return;

  const bad = habits.filter(h => h.bad);
  const N   = bad.length;
  const RU_MONTHS = ['Янв','Фев','Мар','Апр','Май','Июн',
                     'Июл','Авг','Сен','Окт','Ноя','Дек'];
  const DOW_SHORT = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
  const tk = _todayKey();

  function buildStackCell(dk, size) {
    const v = bData[dk];
    const isFuture = dk > tk;
    const isToday  = dk === tk;
    const outline  = isToday
      ? `outline:${size>12?2:1.5}px solid var(--bad);outline-offset:1px;` : '';

    if (isFuture || !v) {
      return `<div style="width:${size}px;height:${size}px;border-radius:${size>12?5:2}px;
                           background:var(--border);${outline}opacity:${isFuture?0.3:1}"
                   title="${dk}"></div>`;
    }

    const stripH = Math.max(1, Math.floor((size - (N-1)) / N));
    let strips = '';
    for (let i = 0; i < v.clean; i++) {
      strips += `<div style="height:${stripH}px;background:#52b788;flex-shrink:0"></div>`;
    }
    for (let i = 0; i < v.slips; i++) {
      strips += `<div style="height:${stripH}px;background:#f5c0a8;flex-shrink:0"></div>`;
    }
    for (let i = 0; i < v.neutral; i++) {
      strips += `<div style="height:${stripH}px;background:var(--border);flex-shrink:0"></div>`;
    }
    return `<div style="width:${size}px;height:${size}px;border-radius:${size>12?5:2}px;
                         overflow:hidden;${outline}
                         display:flex;flex-direction:column;gap:1px;padding:${size>12?2:1}px;"
                 title="${dk}: ${v.clean}/${N} чисто, ${v.slips} срыв">
              ${strips}
            </div>`;
  }

  if (_analyticsPeriod === 'week') {
    let html = '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:8px">';
    dates.forEach(dk => {
      const v = bData[dk];
      const dowIdx = (new Date(dk).getDay() + 6) % 7;
      const isToday = dk === tk;
      html += `
        <div style="display:flex;flex-direction:column;align-items:center;gap:5px">
          ${buildStackCell(dk, 40)}
          <div style="font-size:11px;color:${isToday?'var(--bad)':'var(--text3)'};
                      font-weight:${isToday?500:400}">
            ${DOW_SHORT[dowIdx]}
          </div>
          <div style="font-size:10px;color:var(--text3)">
            ${v ? v.slips+' срыв' : '—'}
          </div>
        </div>`;
    });
    html += '</div>';
    wrap.innerHTML = html;
  }

  else if (_analyticsPeriod === 'month') {
    const y = TODAY.getFullYear(), m = TODAY.getMonth();
    const daysInMonth = new Date(y, m+1, 0).getDate();
    const firstDow = (new Date(y, m, 1).getDay() + 6) % 7;

    let html = `
      <div style="display:grid;grid-template-columns:repeat(7,1fr);
                  gap:3px;margin-bottom:4px">
        ${DOW_SHORT.map(d =>
          `<div style="font-size:10px;color:var(--text4);text-align:center">${d}</div>`
        ).join('')}
      </div>
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px">`;

    for (let i=0; i<firstDow; i++) html += '<div></div>';
    for (let d=1; d<=daysInMonth; d++) {
      const dk = y+'-'+String(m+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
      html += buildStackCell(dk, 36);
    }
    html += '</div>';
    wrap.innerHTML = html;
  }

  else if (_analyticsPeriod === 'quarter') {
    const curM = TODAY.getMonth();
    const curY = TODAY.getFullYear();
    const months = [curM-2, curM-1, curM];
    let html = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px">';

    months.forEach(mi => {
      let m = mi;
      let y = curY;
      while (m < 0) { m += 12; y--; }
      while (m > 11) { m -= 12; y++; }

      const daysInMonth = new Date(y, m+1, 0).getDate();
      const firstDow = (new Date(y, m, 1).getDay() + 6) % 7;

      html += `<div>
        <div style="font-size:11px;font-weight:500;color:var(--text2);
                    margin-bottom:6px">${RU_MONTHS[m]}</div>
        <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;
                    margin-bottom:2px">
          ${DOW_SHORT.map(d =>
            `<div style="font-size:8px;color:var(--text4);text-align:center">${d[0]}</div>`
          ).join('')}
        </div>
        <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px">`;

      for (let i=0; i<firstDow; i++) html += '<div></div>';
      for (let d=1; d<=daysInMonth; d++) {
        const dk = y+'-'+String(m+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
        html += buildStackCell(dk, 14);
      }
      html += '</div></div>';
    });
    html += '</div>';
    wrap.innerHTML = html;
  }

  else {
    if (window.innerWidth <= 480) {
      const nowY = TODAY.getFullYear();
      const months = Array.from({ length: 12 }, (_, i) => i);

      function renderHalfYear(startMonth) {
        const half = months.slice(startMonth, startMonth + 6);
        let block = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">';

        half.forEach(m => {
          const daysInMonth = new Date(nowY, m + 1, 0).getDate();
          const firstDow = (new Date(nowY, m, 1).getDay() + 6) % 7;

          block += `<div>
            <div style="font-size:10px;font-weight:500;color:var(--text2);margin-bottom:4px">
              ${RU_MONTHS[m]}
            </div>
            <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:1px;
                        margin-bottom:2px">
              ${DOW_SHORT.map(d =>
                `<div style="font-size:7px;color:var(--text4);text-align:center">${d[0]}</div>`
              ).join('')}
            </div>
            <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:1px">`;

          for (let i = 0; i < firstDow; i++) block += '<div></div>';
          for (let d = 1; d <= daysInMonth; d++) {
            const dk = nowY + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
            block += buildStackCell(dk, 8);
          }
          block += '</div></div>';
        });

        block += '</div>';
        return block;
      }

      wrap.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:12px">
          <div>${renderHalfYear(0)}</div>
          <div>${renderHalfYear(6)}</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;
                    margin-top:8px;flex-wrap:wrap">
          <div style="display:flex;align-items:center;gap:4px">
            <div style="width:12px;height:12px;border-radius:2px;
                        background:#52b788"></div>
            <span style="font-size:10px;color:var(--text4)">сдержался</span>
          </div>
          <div style="display:flex;align-items:center;gap:4px">
            <div style="width:12px;height:12px;border-radius:2px;
                        background:var(--bad-light)"></div>
            <span style="font-size:10px;color:var(--text4)">срыв</span>
          </div>
          <div style="display:flex;align-items:center;gap:4px">
            <div style="width:12px;height:12px;border-radius:2px;
                        background:var(--border)"></div>
            <span style="font-size:10px;color:var(--text4)">не отмечено</span>
          </div>
          <span style="font-size:10px;color:var(--text4);margin-left:4px">
            Каждая полоска = одна привычка
          </span>
        </div>`;
    } else {
    const s = new Date(TODAY);
    s.setFullYear(s.getFullYear() - 1);
    s.setDate(s.getDate() + 1);
    while ((s.getDay() + 6) % 7 !== 0) s.setDate(s.getDate() + 1);

    const isPhone = window.innerWidth <= 480;
    const gap = isPhone ? 1 : 3;
    const cell = isPhone ? 5 : 11;
    const monthFont = isPhone ? 7 : 9;
    const monthHeight = isPhone ? 7 : 10;
    const monthBottom = isPhone ? 1 : 2;

    let html = `<div style="display:flex;gap:${gap}px;align-items:flex-start;overflow-x:auto">`;
    const cur = new Date(s);
    let prevM = -1;

    while (cur <= TODAY) {
      const m = cur.getMonth();
      let col = `<div style="display:flex;flex-direction:column;gap:${gap}px">`;
      col += `<div style="font-size:${monthFont}px;color:var(--text4);height:${monthHeight}px;
                           margin-bottom:${monthBottom}px;white-space:nowrap">
                ${m !== prevM ? RU_MONTHS[m] : ''}</div>`;
      prevM = m;
      col += `<div style="display:flex;flex-direction:column;gap:${gap}px">`;

      for (let i=0; i<7; i++) {
        const d = new Date(cur); d.setDate(d.getDate()+i);
        col += buildStackCell(_dateKey(d), cell);
      }
      col += '</div></div>';
      html += col;
      cur.setDate(cur.getDate() + 7);
    }
    html += '</div>';

    html += `
      <div style="display:flex;align-items:center;gap:8px;
                  margin-top:8px;flex-wrap:wrap">
        <div style="display:flex;align-items:center;gap:4px">
          <div style="width:12px;height:12px;border-radius:2px;
                      background:#52b788"></div>
          <span style="font-size:10px;color:var(--text4)">сдержался</span>
        </div>
        <div style="display:flex;align-items:center;gap:4px">
          <div style="width:12px;height:12px;border-radius:2px;
                      background:var(--bad-light)"></div>
          <span style="font-size:10px;color:var(--text4)">срыв</span>
        </div>
        <div style="display:flex;align-items:center;gap:4px">
          <div style="width:12px;height:12px;border-radius:2px;
                      background:var(--border)"></div>
          <span style="font-size:10px;color:var(--text4)">не отмечено</span>
        </div>
        <span style="font-size:10px;color:var(--text4);margin-left:4px">
          Каждая полоска = одна привычка
        </span>
      </div>`;
    wrap.innerHTML = html;
    }
  }

  const allSlips   = Object.values(bData).reduce((s,v) => s + v.slips, 0);
  const perfectDay = Object.values(bData).filter(v => v.slips === 0 && v.clean > 0).length;
  const cleanStrk  = (() => {
    let s = 0, d = new Date(TODAY);
    while (true) {
      const v = bData[_dateKey(d)];
      if (!v || v.slips > 0 || v.neutral > 0) break;
      s++; d.setDate(d.getDate()-1);
    }
    return s;
  })();

  stats.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:2px">
      <div style="font-size:16px;font-weight:500">${allSlips}</div>
      <div style="font-size:10px;color:var(--text3)">срывов за период</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:2px">
      <div style="font-size:16px;font-weight:500">${perfectDay}</div>
      <div style="font-size:10px;color:var(--text3)">чистых дней</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:2px">
      <div style="font-size:16px;font-weight:500">${cleanStrk} дн.</div>
      <div style="font-size:10px;color:var(--text3)">текущий стрик</div>
    </div>`;
}

function _moodDotSvg(fill, size = 20) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 22 22" `
    + `style="display:block;flex-shrink:0" aria-hidden="true">`
    + `<circle cx="11" cy="11" r="9" fill="${fill}"/></svg>`;
}

function _renderMoodChart() {
  const wrap  = document.getElementById('moodChartWrap');
  const stats = document.getElementById('moodChartStats');
  if (!wrap) return;

  const dates = _getPeriodDates();
  const tk    = _todayKey();

  const moodData = {};
  dates.forEach(dk => {
    const m = moodLog[dk];
    if (m !== undefined && m !== null) moodData[dk] = m;
  });

  const recorded = Object.values(moodData);
  const avgMood  = recorded.length > 0
    ? recorded.reduce((s, v) => s + v, 0) / recorded.length
    : null;

  const W = 600, H = 100;
  const PAD_L = 24, PAD_R = 12, PAD_T = 10, PAD_B = 20;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  const points = dates
    .map((dk, i) => ({
      dk, i,
      x: PAD_L + (i / Math.max(dates.length - 1, 1)) * chartW,
      y: moodData[dk] !== undefined
        ? PAD_T + chartH - (moodData[dk] / 4) * chartH
        : null,
      mood: moodData[dk],
    }))
    .filter(p => p.y !== null);

  let pathD = '';
  let areaD = '';
  if (points.length > 0) {
    pathD = points.map((p, i) =>
      (i === 0 ? 'M' : 'L') + p.x.toFixed(1) + ',' + p.y.toFixed(1)
    ).join(' ');

    areaD = pathD
      + ` L${points[points.length - 1].x.toFixed(1)},${(PAD_T + chartH).toFixed(1)}`
      + ` L${points[0].x.toFixed(1)},${(PAD_T + chartH).toFixed(1)} Z`;
  }

  const yLabels = [4, 2, 0].map(v => ({
    y: PAD_T + chartH - (v / 4) * chartH,
    color: MOOD_COLORS[v],
  }));

  const xStep = Math.max(1, Math.floor(dates.length / 7));
  const xLabels = dates
    .filter((_, i) => i % xStep === 0 || i === dates.length - 1)
    .map(dk => {
      const [_, m, d] = dk.split('-').map(Number);
      const x = PAD_L + (dates.indexOf(dk) / Math.max(dates.length - 1, 1)) * chartW;
      const label = _analyticsPeriod === 'week'
        ? ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'][(new Date(dk).getDay() + 6) % 7]
        : d + '.' + String(m).padStart(2, '0');
      return { x, label };
    });

  const svgContent = `
    <svg viewBox="0 0 ${W} ${H}" style="width:100%;height:${H}px">
      <defs>
        <linearGradient id="moodArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.15"/>
          <stop offset="100%" stop-color="var(--accent)" stop-opacity="0"/>
        </linearGradient>
      </defs>

      ${yLabels.map(l => `
        <line x1="${PAD_L}" y1="${l.y.toFixed(1)}"
              x2="${W - PAD_R}" y2="${l.y.toFixed(1)}"
              stroke="var(--border)" stroke-width="0.5"/>
        <circle cx="${PAD_L - 11}" cy="${(l.y + 2).toFixed(1)}"
                r="5" fill="${l.color}"
                stroke="var(--surface)" stroke-width="0.75"/>
      `).join('')}

      <line x1="${PAD_L}" y1="${PAD_T + chartH}"
            x2="${W - PAD_R}" y2="${PAD_T + chartH}"
            stroke="var(--border)" stroke-width="0.5"/>

      ${xLabels.map(l => `
        <text x="${l.x.toFixed(1)}" y="${H - 4}"
              font-size="9" text-anchor="middle"
              fill="var(--text4)">${l.label}</text>
      `).join('')}

      ${areaD ? `<path d="${areaD}" fill="url(#moodArea)"/>` : ''}

      ${pathD ? `
        <path d="${pathD}"
              fill="none" stroke="var(--accent)"
              stroke-width="2" stroke-linecap="round"
              stroke-linejoin="round"/>
      ` : ''}

      ${points.map(p => `
        <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}"
                r="3" fill="${MOOD_COLORS[p.mood]}"
                stroke="#fff" stroke-width="1.5">
          <title>${p.dk}: ${MOOD_LABELS[p.mood]}</title>
        </circle>
      `).join('')}

      ${dates.includes(tk) ? (() => {
        const todayX = PAD_L + (dates.indexOf(tk) / Math.max(dates.length - 1, 1)) * chartW;
        return `<line x1="${todayX.toFixed(1)}" y1="${PAD_T}"
                      x2="${todayX.toFixed(1)}" y2="${PAD_T + chartH}"
                      stroke="var(--accent2)" stroke-width="1"
                      stroke-dasharray="3 3"/>`;
      })() : ''}

      ${points.length === 0 ? `
        <text x="${W / 2}" y="${H / 2}" text-anchor="middle"
              font-size="11" fill="var(--text4)">
          Нет данных за период
        </text>
      ` : ''}
    </svg>`;

  wrap.innerHTML = svgContent;

  const best  = recorded.length > 0 ? Math.max(...recorded) : null;
  const worst = recorded.length > 0 ? Math.min(...recorded) : null;

  if (!stats) return;
  stats.innerHTML = recorded.length === 0
    ? `<span style="font-size:12px;color:var(--text3)">
         Отмечай настроение каждый день - здесь появится статистика
       </span>`
    : `
    <div style="display:flex;flex-direction:column;gap:2px">
      <div style="display:flex;align-items:center;min-height:22px">
        ${avgMood !== null ? _moodDotSvg(MOOD_COLORS[Math.round(avgMood)], 22) : '—'}
      </div>
      <div style="font-size:10px;color:var(--text3)">
        среднее за период
        ${avgMood !== null ? '(' + avgMood.toFixed(1) + '/4)' : ''}
      </div>
    </div>
    <div style="display:flex;flex-direction:column;gap:2px">
      <div style="font-size:16px;font-weight:500">${recorded.length}</div>
      <div style="font-size:10px;color:var(--text3)">дней отмечено</div>
    </div>
    ${best !== null ? `
    <div style="display:flex;flex-direction:column;gap:2px">
      <div style="display:flex;align-items:center;min-height:22px">
        ${_moodDotSvg(MOOD_COLORS[best], 22)}
      </div>
      <div style="font-size:10px;color:var(--text3)">лучший день</div>
    </div>` : ''}
    ${worst !== null && worst !== best ? `
    <div style="display:flex;flex-direction:column;gap:2px">
      <div style="display:flex;align-items:center;min-height:22px">
        ${_moodDotSvg(MOOD_COLORS[worst], 22)}
      </div>
      <div style="font-size:10px;color:var(--text3)">тяжелый день</div>
    </div>` : ''}`;
}

// ── Экран Значки ──────────────────────────

function renderBadges() {
  const screen = document.getElementById('screenBadges');
  const { total } = calcPoints();
  const stage    = getStage(total);
  const stageIdx = getStageIdx(total);
  const next     = nextStage(total);

  screen.innerHTML = `
    <div class="page-grid">
      <div></div>
      <div>
        <h1 style="font-size:20px;font-weight:500;margin-bottom:4px">
          Значки
        </h1>
        <p style="font-size:12px;color:var(--text3);margin-bottom:16px">
          ${earnedBadges.length} получено · Стадия ${stageIdx + 1} из ${STAGES.length}
        </p>

        <div class="panel panel-body" style="text-align:center;margin-bottom:12px">
          <div id="badgesAvatar"
               style="width:80px;height:80px;border-radius:50%;
                      background:${stage.color}33;margin:0 auto 12px;
                      display:flex;align-items:center;justify-content:center;
                      font-size:36px;border:3px solid ${stage.color}">
          </div>
          <div style="font-size:16px;font-weight:500">${esc(stage.nameRU)}</div>
          <div style="font-size:12px;color:var(--text3);margin-top:2px">
            ${total.toLocaleString()} pts
            ${next ? ' · ещё ' + (next.pts - total).toLocaleString()
                     + ' до ' + esc(next.nameRU) : ''}
          </div>
        </div>

        <div class="panel panel-body">
          <div class="panel-title">
            Все значки · ${earnedBadges.length} из ${BADGES.length}
          </div>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px">
            ${BADGES.map(b => {
              const earned = earnedBadges.includes(b.id);
              return `
                <div style="text-align:center;opacity:${earned ? 1 : 0.3}">
                  <div style="font-size:32px;margin-bottom:4px">${b.emoji}</div>
                  <div style="font-size:12px;font-weight:500">${esc(b.nameRU)}</div>
                  <div style="font-size:11px;color:var(--text3)">
                    ${earned ? '✓ Получен' : esc(b.descRU)}
                  </div>
                </div>`;
            }).join('')}
          </div>
        </div>
      </div>
      <div></div>
    </div>`;

  const src = gender === 'female' ? stage.f : stage.m;
  const avEl = document.getElementById('badgesAvatar');
  if (src && avEl) {
    avEl.innerHTML = `<img src="${src}" alt=""
      style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
  } else if (avEl) {
    avEl.textContent = stage.emoji;
  }
}

// ── Тосты ─────────────────────────────────

function showToast(msg) {
  const wrap = document.getElementById('toastWrap');
  const div  = document.createElement('div');
  div.className   = 'toast';
  div.textContent = msg;
  wrap.appendChild(div);
  requestAnimationFrame(() => {
    div.style.opacity   = '1';
    div.style.transform = 'translateY(0)';
  });
  setTimeout(() => {
    div.style.opacity   = '0';
    div.style.transform = 'translateY(8px)';
    setTimeout(() => div.remove(), 300);
  }, 2800);
}

function showPtsToast(pts) {
  showToast('+' + pts + ' pts');
}

function _showBadgeToast(b) {
  const el = document.getElementById('badgeToast');
  if (!el) return;
  document.getElementById('badgeToastEmoji').textContent = b.emoji;
  document.getElementById('badgeToastTitle').textContent = b.nameRU;
  document.getElementById('badgeToastDesc').textContent  = b.descRU;
  el.style.display = 'flex';
  setTimeout(() => { el.style.display = 'none'; }, 4000);
}

// ── Онбординг-мастер ──────────────────────

function _obRender() {
  _obProgress();
  _obContent();
  _obFooterRender();
}

function _obProgress() {
  const wrap = document.getElementById('obProgress');
  if (!wrap) return;
  const n = _obStep + 1;
  let dots = '';
  for (let i = 0; i < _OB_TOTAL; i++) {
    const cls = i < _obStep ? 'done' : i === _obStep ? 'active' : '';
    dots += `<div class="ob-dot ${cls}"></div>`;
  }
  wrap.innerHTML = `
    <div class="ob-progress-head">Шаг ${n} из ${_OB_TOTAL} — ${_OB_HEADINGS[_obStep]}</div>
    <div class="ob-progress-bar">
      ${dots}
      <span class="ob-step-label">${n} / ${_OB_TOTAL}</span>
    </div>`;
}

function _obContent() {
  const body = document.getElementById('obBody');
  if (!body) return;
  body.innerHTML = _obSteps()[_obStep];
}

function _obFooterRender() {
  const footer = document.getElementById('obFooter');
  if (!footer) return;
  const isFirst = _obStep === 0;
  const isLast  = _obStep === _OB_TOTAL - 1;

  if (isFirst) {
    footer.innerHTML = `
      <button type="button" class="ob-btn-skip"
              onclick="obSkip()">Пропустить</button>
      <button type="button" class="ob-btn-next"
              onclick="obNext()">Начать →</button>`;
  } else if (isLast) {
    footer.innerHTML = `
      <button type="button" class="ob-btn-back"
              onclick="obPrev()">← Назад</button>
      <button type="button" class="ob-btn-demo"
              onclick="loadDemoData()">Демо-данные</button>
      <button type="button" class="ob-btn-next"
              onclick="obSkip()">Начать!</button>`;
  } else {
    footer.innerHTML = `
      <button type="button" class="ob-btn-back"
              onclick="obPrev()">← Назад</button>
      <button type="button" class="ob-btn-next"
              onclick="obNext()">Далее →</button>`;
  }
}

function obNext() {
  if (_obStep < _OB_TOTAL - 1) {
    _obStep++;
    _obRender();
  }
}

function obPrev() {
  if (_obStep > 0) {
    _obStep--;
    _obRender();
  }
}

function openOnboarding() {
  _obStep = 0;
  _obRender();
  const el = document.getElementById('onboardingScreen');
  if (el) el.style.display = 'flex';
}

function obSkip() {
  const el = document.getElementById('onboardingScreen');
  if (el) el.style.display = 'none';
  saveData();
  renderAll();
}

function loadDemoData() {
  const yesterday = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return _dateKey(d);
  })();
  const twoDaysAgo = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 2);
    return _dateKey(d);
  })();

  habits = JSON.parse(JSON.stringify(DEMO_HABITS));
  habits.forEach(h => { h.createdAt = twoDaysAgo; });

  habits[0].checks[twoDaysAgo] = true;
  habits[0].checks[yesterday]  = true;
  habits[1].checks[yesterday]  = true;
  habits[2].checks[twoDaysAgo] = true;
  habits[2].checks[yesterday]  = true;

  archived     = [];
  earnedBadges = [];
  gender       = null;
  moodLog      = { [yesterday]: 3, [twoDaysAgo]: 2 };
  moodEnabled  = true;

  _migrateData();
  _syncCleanTodaySetFromData();
  saveData();
  obSkip();
  showToast('Демо-данные загружены · добавь свои привычки!');
}

function _obSteps() {
  return [

    `<div class="ob-ico">🌿</div>
     <div class="ob-title">Добро пожаловать в HabitFlow</div>
     <div class="ob-text">Трекер привычек который работает полностью офлайн.
       Твои данные хранятся только на этом устройстве — никаких серверов и подписок.</div>
     <div class="ob-hint">
       <div class="ob-hint-ico">💡</div>
       <div class="ob-hint-text">За минуту покажем как всё устроено.
         Или сразу начни — всё интуитивно.</div>
     </div>`,

    `<div class="ob-ico">✅</div>
     <div class="ob-title">Отмечай привычки</div>
     <div class="ob-text">Нажми кнопку справа — карточка перевернётся и
       покажет время выполнения. Нажми «отменить» чтобы снять отметку.</div>
     <div class="ob-preview">
       <div class="ob-card-front">
         <div class="ob-card-row">
           <div class="ob-card-body">
             <div class="ob-card-name">🏃 Утренняя пробежка</div>
             <div class="ob-card-sub">Начни серию сегодня</div>
           </div>
           <div class="ob-card-check">
             <div class="ob-card-btn"></div>
           </div>
         </div>
         <div class="ob-card-bar"></div>
       </div>
       <div class="ob-card-back">
         <div class="ob-card-back-ico">✓</div>
         <div>
           <div class="ob-card-back-title">Выполнено!</div>
           <div class="ob-card-back-time">07:24</div>
         </div>
         <div class="ob-card-back-undo">отменить</div>
       </div>
     </div>
     <div class="ob-hint">
       <div class="ob-hint-ico">💡</div>
       <div class="ob-hint-text">Для вредных привычек — две кнопки:
         ✓ Выдержал или ✕ Был срыв.</div>
     </div>`,

    `<div class="ob-ico-plus" aria-hidden="true">+</div>
     <div class="ob-title">Как создать привычку</div>
     <div class="ob-text">Нажми «Добавить привычку» — откроется форма. Вот что в ней есть:</div>
     <div class="ob-preview ob-preview-create">
       <div class="ob-preview-label">Тип привычки</div>
       <div class="ob-type-row">
         <div class="ob-type-btn good">
           <span class="ob-type-glyph" aria-hidden="true">✓</span>
           Полезная
         </div>
         <div class="ob-type-btn bad">
           <span class="ob-type-glyph" aria-hidden="true">🚫</span>
           Вредная
         </div>
       </div>
       <div class="ob-preview-label">Иконка</div>
       <div class="ob-icon-row">
         <div class="ob-icon-btn sel">🏃</div>
         <div class="ob-icon-btn">📚</div>
         <div class="ob-icon-btn">🧘</div>
         <div class="ob-icon-btn">💪</div>
         <div class="ob-icon-btn">💧</div>
         <div class="ob-icon-btn">😴</div>
         <div class="ob-icon-btn">🚫</div>
         <div class="ob-icon-btn">🚬</div>
       </div>
       <div class="ob-preview-label">Название</div>
       <div class="ob-field ob-field-placeholder">Утренняя пробежка</div>
       <div class="ob-preview-label">Расписание</div>
       <div class="ob-sched-row">
         <div class="ob-sched-btn sel">Каждый день</div>
         <div class="ob-sched-btn">Будни</div>
         <div class="ob-sched-btn">Выходные</div>
         <div class="ob-sched-btn">Свои дни</div>
       </div>
     </div>
     <div class="ob-hint">
       <div class="ob-hint-ico">💡</div>
       <div class="ob-hint-text">Расписание влияет на прогресс дня. Привычка «Будни»
         не считается пропуском в выходной — но её можно отметить как бонус.</div>
     </div>
     <div class="ob-hint">
       <div class="ob-hint-ico">💡</div>
       <div class="ob-hint-text">Для вредных привычек расписание недоступно — они
         отслеживаются каждый день.</div>
     </div>`,

    `<div class="ob-ico">🔥</div>
     <div class="ob-title">Серии и очки</div>
     <div class="ob-text">Каждая отметка приносит очки.
       Чем дольше серия — тем больше множитель.</div>
     <div class="ob-pts-row">
       <span class="ob-pts-pill good">Полезная +10 pts</span>
       <span class="ob-pts-pill bad">Вредная +5 pts</span>
       <span class="ob-pts-pill bonus">Бонус +10 pts</span>
     </div>
     <div class="ob-mult-card">
       7+ дней подряд → <strong style="color:var(--accent)">×2</strong><br>
       30+ дней подряд → <strong style="color:var(--accent)">×3</strong><br>
       100+ дней подряд → <strong style="color:var(--accent)">×5</strong>
     </div>
     <div class="ob-hint" style="margin-top:10px">
       <div class="ob-hint-ico">💡</div>
       <div class="ob-hint-text">Закрыл все запланированные привычки за день —
         дополнительно +25 pts.</div>
     </div>`,

    `<div class="ob-ico">📊</div>
     <div class="ob-title">Аналитика и значки</div>
     <div class="ob-text">В аналитике — тепловые карты за неделю, месяц,
       квартал или год. В значках — твой персонаж растёт по мере
       накопления очков.</div>
     <div class="ob-badge-row">
       <div class="ob-badge-item">
         <div class="ob-badge-ico">🔥</div>
         <div class="ob-badge-lbl">Первый огонь</div>
       </div>
       <div class="ob-badge-item">
         <div class="ob-badge-ico">💎</div>
         <div class="ob-badge-lbl">Бриллиант</div>
       </div>
       <div class="ob-badge-item">
         <div class="ob-badge-ico locked">🏆</div>
         <div class="ob-badge-lbl">Чемпион</div>
       </div>
       <div class="ob-badge-item">
         <div class="ob-badge-ico locked">⚡</div>
         <div class="ob-badge-lbl">Центурион</div>
       </div>
       <div class="ob-badge-item">
         <div class="ob-badge-ico locked">🍀</div>
         <div class="ob-badge-lbl">Удача</div>
       </div>
     </div>
     <div class="ob-hint">
       <div class="ob-hint-ico">💡</div>
       <div class="ob-hint-text">Стадии: Начало → В ритме → Устойчивость →
         Сила привычки → Опора → Мастер</div>
     </div>`,

    `<div class="ob-ico">💾</div>
     <div class="ob-title">Твои данные в безопасности</div>
     <div class="ob-text">Всё хранится локально на этом устройстве.
       Делай резервные копии через кнопки в навбаре.</div>
     <div class="ob-data-row">
       <div class="ob-data-ico">💾</div>
       <div class="ob-data-text">Экспорт — скачать резервную копию (.json)</div>
     </div>
     <div class="ob-data-row">
       <div class="ob-data-ico">📂</div>
       <div class="ob-data-text">Импорт — восстановить из файла</div>
     </div>
     <div class="ob-data-row">
       <div class="ob-data-ico">❓</div>
       <div class="ob-data-text">Помощь — полная документация</div>
     </div>
     <div class="ob-hint" style="margin-top:4px">
       <div class="ob-hint-ico">💡</div>
       <div class="ob-hint-text">Попробуй демо-данные чтобы увидеть приложение
         в действии — их можно удалить в любой момент.</div>
     </div>`,
  ];
}


// ── Помощь (модалка — тот же HTML-контент, без отдельного окна) ──

const GUIDE_MODAL_HTML = `
<div class="wrap">

  <h1>🌿 HabitFlow</h1>
  <p class="subtitle">Офлайн-трекер привычек · данные хранятся только на этом устройстве</p>

  <h2>Экраны приложения</h2>

  <div class="card">
    <div class="card-title">☀️ Сегодня</div>
    <p>Главный экран. Показывает прогресс дня, карточки привычек и статистику.
    Отмечай привычки здесь — карточка перевернётся и покажет время выполнения.</p>
  </div>

  <div class="card">
    <div class="card-title">✅ Привычки</div>
    <p>Список всех привычек. Здесь можно добавить новую, отправить в архив или удалить.
    Также здесь включается и выключается дневник настроения.</p>
  </div>

  <div class="card">
    <div class="card-title">📊 Аналитика</div>
    <p>Тепловые карты активности за неделю, месяц, квартал или год.
    Отдельные карты для полезных и вредных привычек.
    Если включён дневник настроения — появится линейный график настроения.</p>
  </div>

  <div class="card">
    <div class="card-title">🏅 Значки</div>
    <p>Твой персонаж и достижения. Стадии развития: Начало → В ритме → Устойчивость →
    Сила привычки → Опора → Мастер. Значки получаешь за конкретные результаты.</p>
  </div>

  <h2>Типы привычек</h2>

  <div class="card">
    <span class="tag tag-good">Полезная</span>
    <p>Нажми кнопку справа — карточка перевернётся. Показывает время отметки и кнопку
    «отменить». Отмечай каждый день чтобы наращивать серию.</p>
    <div class="divider"></div>
    <p><span class="pts">+10 pts</span> за каждую отметку &nbsp;·&nbsp;
    <span class="pts">+25 pts</span> если закрыл все запланированные за день</p>
  </div>

  <div class="card">
    <span class="tag tag-bad">Вредная</span>
    <p>Две кнопки: ✓ Выдержал или ✕ Был срыв. После нажатия карточка перевернётся —
    зелёная если выдержал, красная если был срыв. Нажми на цвет чтобы отменить.</p>
    <div class="divider"></div>
    <p><span class="pts">+5 pts</span> за чистый день · при срыве очки не начисляются</p>
  </div>

  <div class="card">
    <span class="tag tag-bonus">Бонусная</span>
    <p>Полезная привычка с расписанием (например «Будни»). В выходной она становится
    бонусной — можно отметить добровольно и получить дополнительные очки.</p>
    <div class="divider"></div>
    <p><span class="pts">+10 pts</span> за бонусную отметку</p>
  </div>

  <h2>Серии и множители</h2>

  <div class="card">
    <p>Чем дольше серия — тем больше очков за каждую отметку:</p>
    <ul style="margin-top: 8px;">
      <li>7+ дней подряд: <span class="pts">×2</span></li>
      <li>30+ дней подряд: <span class="pts">×3</span></li>
      <li>100+ дней подряд: <span class="pts">×5</span></li>
    </ul>
  </div>

  <h2>Расписание</h2>

  <div class="card">
    <p>При создании привычки можно выбрать расписание: каждый день, будни, выходные
    или свои дни. В дни когда привычка не запланирована — она не влияет на прогресс,
    но её всё равно можно отметить как бонусную.</p>
  </div>

  <h2>Данные и резервные копии</h2>

  <div class="card">
    <p>Данные хранятся в браузере на этом устройстве. Если очистить данные браузера —
    история может быть потеряна.</p>
    <div class="divider"></div>
    <p>💾 <strong>Экспорт</strong> — скачивает файл резервной копии (.json)<br>
    📂 <strong>Импорт</strong> — загружает ранее сохранённый файл.<br>
    Делай резервные копии регулярно, особенно перед обновлением браузера.</p>
  </div>

  <h2>Темы оформления</h2>

  <div class="card">
    <p>Переключатель тем находится в навбаре рядом с аватаром.
    Доступны четыре темы: ☀️ Светлая, 🌙 Тёмная, ◈ Трон, ◉ Blade Runner.</p>
  </div>

  <p class="footer">HabitFlow · работает полностью офлайн</p>

</div>
`;

function openGuide() {
  const body = document.getElementById('guideBody');
  const ov = document.getElementById('guideOverlay');
  if (!body || !ov) return;

  if (!body.dataset.ready) {
    body.innerHTML = GUIDE_MODAL_HTML;
    body.dataset.ready = '1';
  }

  ov.classList.add('open');
}

function closeGuide(e) {
  if (e && e.target !== document.getElementById('guideOverlay')) return;
  const el = document.getElementById('guideOverlay');
  if (el) el.classList.remove('open');
}

// ── Бургер-меню ────────────────────────────

function toggleBurger() {
  const drawer  = document.getElementById('burgerDrawer');
  const overlay = document.getElementById('burgerOverlay');
  const btn     = document.getElementById('burgerBtn');
  if (!drawer) return;
  const isOpen = drawer.classList.contains('open');
  if (isOpen) {
    closeBurger();
  } else {
    drawer.classList.add('open');
    overlay.classList.add('open');
    btn.classList.add('open');
    _syncMoodToggleUI();
    _syncSeriesWidgetToggleUI();
  }
}

function closeBurger() {
  const drawer  = document.getElementById('burgerDrawer');
  const overlay = document.getElementById('burgerOverlay');
  const btn     = document.getElementById('burgerBtn');
  if (drawer)  drawer.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
  if (btn)     btn.classList.remove('open');
}

// ── Инициализация ─────────────────────────

function setTheme(theme, save = true) {
  const allowed = new Set(['light', 'dark', 'tron', 'blade']);
  const t = allowed.has(theme) ? theme : 'light';
  document.documentElement.setAttribute('data-theme', t);

  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === t);
  });

  if (save) {
    localStorage.setItem('habitflow_theme', t);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadData();

  const isFirstRun = !localStorage.getItem(LS_KEY);
  const onboarding = document.getElementById('onboardingScreen');
  if (onboarding) {
    if (isFirstRun) {
      _obStep = 0;
      _obRender();
      onboarding.style.display = 'flex';
    } else {
      onboarding.style.display = 'none';
    }
  }

  const savedTheme = localStorage.getItem('habitflow_theme') || 'light';
  setTheme(savedTheme, false);

  navigate('today');
  renderNav();
  checkBadges();
  _syncMoodToggleUI();
  _syncDayProgressWidgetToggleUI();
  _syncBestStreakWidgetToggleUI();
  _syncSeriesWidgetToggleUI();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/habitflow/sw.js')
        .then(reg => {
          // Проверяем обновления каждый раз при открытии
          reg.update();

          // Когда новый SW готов — перезагружаем страницу
          reg.addEventListener('updatefound', () => {
            const newSW = reg.installing;
            if (!newSW) return;
            newSW.addEventListener('statechange', () => {
              if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
                // Новая версия готова — тихо применяем
                newSW.postMessage('SKIP_WAITING');
              }
            });
          });
        })
        .catch(err => console.log('SW error:', err));

      // Перезагружаем когда SW поменялся
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    });
  }
});
