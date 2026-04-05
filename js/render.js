// ── Спидометр ──────────────────────────────

const _GAUGE_CX = 100, _GAUGE_CY = 105;
const _GAUGE_R_OUT = 78, _GAUGE_R_IN = 58;
const _GAUGE_SEGS = 7;
const _GAUGE_GAP  = 3;
const _GAUGE_ARC  = (180 - _GAUGE_GAP * (_GAUGE_SEGS - 1)) / _GAUGE_SEGS;

function _gaugePt(r, deg) {
  const rad = deg * Math.PI / 180;
  return [
    _GAUGE_CX + r * Math.cos(rad),
    _GAUGE_CY - r * Math.sin(rad),
  ];
}

function _gaugeSegPath(startDeg, endDeg) {
  const [x1, y1] = _gaugePt(_GAUGE_R_OUT, startDeg);
  const [x2, y2] = _gaugePt(_GAUGE_R_OUT, endDeg);
  const [x3, y3] = _gaugePt(_GAUGE_R_IN,  endDeg);
  const [x4, y4] = _gaugePt(_GAUGE_R_IN,  startDeg);
  return `M${x1.toFixed(2)} ${y1.toFixed(2)}
          A${_GAUGE_R_OUT} ${_GAUGE_R_OUT} 0 0 0 ${x2.toFixed(2)} ${y2.toFixed(2)}
          L${x3.toFixed(2)} ${y3.toFixed(2)}
          A${_GAUGE_R_IN} ${_GAUGE_R_IN} 0 0 1 ${x4.toFixed(2)} ${y4.toFixed(2)}Z`;
}

function _renderGaugeSegments(pct) {
  const container = document.getElementById('gaugeSegments');
  if (!container) return;
  container.innerHTML = '';
  const activeCount = Math.round(pct / 100 * _GAUGE_SEGS);
  for (let i = 0; i < _GAUGE_SEGS; i++) {
    const segStart = 180 - i * (_GAUGE_ARC + _GAUGE_GAP);
    const segEnd   = segStart - _GAUGE_ARC;
    const isActive = i < activeCount;
    const fill = isActive
      ? (i < 2 ? 'var(--accent3)'
       : i < 4 ? 'var(--accent2)'
       : i < 6 ? 'var(--accent)'
       :          '#1a4d38')
      : 'var(--border2)';
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', _gaugeSegPath(segStart, segEnd));
    path.setAttribute('fill', fill);
    container.appendChild(path);
  }
}

let _gaugeCurrentPct = 0;
let _gaugeTargetPct  = 0;
let _gaugeRafId      = null;

function _animateGauge(pct) {
  _gaugeTargetPct = pct;
  if (_gaugeRafId) cancelAnimationFrame(_gaugeRafId);
  _gaugeStep();
}

function _gaugeStep() {
  const diff = _gaugeTargetPct - _gaugeCurrentPct;
  if (Math.abs(diff) < 0.5) {
    _gaugeCurrentPct = _gaugeTargetPct;
    _drawGauge(_gaugeCurrentPct);
    return;
  }
  _gaugeCurrentPct += diff * 0.14;
  _drawGauge(_gaugeCurrentPct);
  _gaugeRafId = requestAnimationFrame(_gaugeStep);
}

function _drawGauge(pct) {
  // Стрелка: -90° = 0%, 0° = 50%, +90° = 100%
  const rot = -90 + pct * 1.8;
  const needle = document.getElementById('gaugeNeedle');
  if (needle) {
    needle.setAttribute('transform',
      `rotate(${rot.toFixed(1)} ${_GAUGE_CX} ${_GAUGE_CY})`);
  }
  // Текст
  const val = Math.round(pct);
  const pctEl = document.getElementById('gaugePct');
  if (pctEl) {
    pctEl.textContent = val + '%';
    pctEl.setAttribute('fill', val >= 100 ? '#1a4d38' : 'var(--text1)');
  }
  const lblEl = document.getElementById('gaugeLbl');
  if (lblEl) {
    lblEl.textContent = val >= 100 ? 'отлично!' : 'выполнено';
  }
  // Сегменты
  _renderGaugeSegments(pct);
}

// ── Навбар (аватар и pts) ──────────────────

function renderNav() {
  const { total } = calcPoints();
  const stage = getStage(total);
  const pic = document.getElementById('navAvPic');
  if (!pic) return;

  const src = gender === 'female' ? stage.f : stage.m;
  if (src) {
    pic.innerHTML = `<img src="${src}" alt="">`;
  } else {
    pic.textContent = stage.emoji;
    pic.style.background = stage.color + '33';
  }

  const avt = document.getElementById('navAvText');
  if (avt) {
    avt.textContent =
      stage.nameRU + ' · ' + total.toLocaleString() + ' pts';
  }
}

// ── Экран Сегодня ──────────────────────────

/** Дашборд без пересборки списков полезных/бонусных/вредных карточек */
function _renderTodayChrome() {
  const tk = _todayKey();
  const good    = habits.filter(h => !h.bad);
  const bad     = habits.filter(h =>  h.bad);
  const scheduled = good.filter(h => _isWorkDay(h, tk));
  const bonuses   = good.filter(h => !_isWorkDay(h, tk));

  document.getElementById('todayDate').textContent =
    TODAY.toLocaleDateString('ru-RU', {
      weekday: 'long', day: 'numeric', month: 'long'
    });

  const schedTotal = scheduled.length || 1;
  const done  = scheduled.filter(h => h.checks?.[tk]).length;
  const bonusDone = bonuses.filter(h => h.checks?.[tk]).length;
  const basePct  = Math.round(done / schedTotal * 100);
  const displayPct = Math.min(100, basePct);
  document.getElementById('donutMeta').textContent =
    done + ' из ' + scheduled.length + ' привычек';
  _animateGauge(displayPct);

  let bestS = 0, bestName = '';
  good.forEach(h => {
    const s = calcStreak(h);
    if (s > bestS) { bestS = s; bestName = (h.icon || '') + ' ' + h.name; }
  });
  document.getElementById('streakVal').textContent  = bestS;
  document.getElementById('streakName').textContent = bestS > 0 ? bestName.trim() : '';

  if (moodEnabled) {
    document.getElementById('moodSection').classList.remove('hidden');
    _renderMood(tk);
  } else {
    document.getElementById('moodSection').classList.add('hidden');
  }

  document.getElementById('goodBadge').textContent =
    done + ' из ' + scheduled.length +
    (bonusDone > 0 ? ' +' + bonusDone : '');

  const bonusSection = document.getElementById('bonusSection');
  if (bonuses.length > 0) {
    bonusSection.classList.remove('hidden');
  } else {
    bonusSection.classList.add('hidden');
  }

  const badSection = document.getElementById('badSection');
  if (bad.length > 0) {
    badSection.classList.remove('hidden');
  } else {
    badSection.classList.add('hidden');
  }

  _renderHeatmap30();
  _renderXP();
  _renderBadgesGrid();
}

/** Лёгкое обновление дашборда во время флипа: без RAF спидометра и без тяжёлых перерисовок */
function _renderTodayChromeForFlip() {
  const tk = _todayKey();
  const good    = habits.filter(h => !h.bad);
  const bad     = habits.filter(h =>  h.bad);
  const scheduled = good.filter(h => _isWorkDay(h, tk));
  const bonuses   = good.filter(h => !_isWorkDay(h, tk));

  const schedTotal = scheduled.length || 1;
  const done  = scheduled.filter(h => h.checks?.[tk]).length;
  const bonusDone = bonuses.filter(h => h.checks?.[tk]).length;
  const basePct  = Math.round(done / schedTotal * 100);
  const displayPct = Math.min(100, basePct);
  document.getElementById('donutMeta').textContent =
    done + ' из ' + scheduled.length + ' привычек';

  if (_gaugeRafId) cancelAnimationFrame(_gaugeRafId);
  _gaugeRafId = null;
  _gaugeTargetPct = displayPct;
  _gaugeCurrentPct = displayPct;
  _drawGauge(displayPct);

  let bestS = 0, bestName = '';
  good.forEach(h => {
    const s = calcStreak(h);
    if (s > bestS) { bestS = s; bestName = (h.icon || '') + ' ' + h.name; }
  });
  document.getElementById('streakVal').textContent  = bestS;
  document.getElementById('streakName').textContent = bestS > 0 ? bestName.trim() : '';

  document.getElementById('goodBadge').textContent =
    done + ' из ' + scheduled.length +
    (bonusDone > 0 ? ' +' + bonusDone : '');

  const bonusSection = document.getElementById('bonusSection');
  if (bonuses.length > 0) {
    bonusSection.classList.remove('hidden');
  } else {
    bonusSection.classList.add('hidden');
  }

  const badSection = document.getElementById('badSection');
  if (bad.length > 0) {
    badSection.classList.remove('hidden');
    _renderBadProgress(bad, tk);
  } else {
    badSection.classList.add('hidden');
  }
}

function renderToday() {
  const tk = _todayKey();
  const good    = habits.filter(h => !h.bad);
  const bad     = habits.filter(h =>  h.bad);
  const scheduled = good.filter(h => _isWorkDay(h, tk));
  const bonuses   = good.filter(h => !_isWorkDay(h, tk));

  _renderTodayChrome();

  const goodList = document.getElementById('goodList');
  goodList.innerHTML = '';
  _sortHabits(scheduled).forEach(h => {
    goodList.appendChild(_buildHCard(h, tk, false));
  });

  if (bonuses.length > 0) {
    const bonusList = document.getElementById('bonusList');
    bonusList.innerHTML = '';
    bonuses.forEach(h => bonusList.appendChild(_buildHCard(h, tk, true)));
  }

  if (bad.length > 0) {
    const badList = document.getElementById('badList');
    badList.innerHTML = '';
    bad.forEach(h => badList.appendChild(_buildBCard(h, tk)));
    _renderBadProgress(bad, tk);
  }
}

function _hCardWrapClass(h, tk, isBonus) {
  const isDone = !!h.checks?.[tk];
  let wrapCls = 'hcard';
  if (isBonus && isDone)   wrapCls += ' hc-bonus-done';
  else if (isBonus)        wrapCls += ' hc-bonus';
  else if (isDone)         wrapCls += ' hc-done';
  else if (_isNextCard(h)) wrapCls += ' hc-active';
  return wrapCls;
}

/** Обновить существующую карточку в DOM (для CSS-анимации флипа без пересоздания узла) */
function _patchHCardFromModel(h, tk, isBonus) {
  const el = document.getElementById('hcard-' + h.id);
  if (!el || !el.classList.contains('hcard')) return;

  const streak = calcStreak(h);
  const timeStr = h.times?.[tk]
    ? new Date(h.times[tk]).toLocaleTimeString('ru-RU',
        { hour: '2-digit', minute: '2-digit' })
    : '';
  const subText = streak > 0
    ? `🔥 ${streak} дней подряд${scheduleLabel(h)}`
    : (scheduleLabel(h).slice(3) || 'Нет стрика');
  const subCls = streak > 0
    ? 'hcard-sub hs-streak'
    : 'hcard-sub' + (isBonus ? ' hs-bonus' : '');

  el.className = _hCardWrapClass(h, tk, isBonus);
  const sub = el.querySelector('.hcard-sub');
  if (sub) {
    sub.className = subCls;
    sub.textContent = subText;
  }
  const timeEl = el.querySelector('.hcard-back-time');
  if (timeEl) timeEl.textContent = timeStr || '—';

  const back = el.querySelector('.hcard-back');
  if (back) {
    back.className = 'hcard-back' + (isBonus ? ' hback-bonus' : '');
  }
}

function _patchAllGoodHCards(tk) {
  const good = habits.filter(h => !h.bad);
  good.filter(h => _isWorkDay(h, tk)).forEach(h => _patchHCardFromModel(h, tk, false));
  good.filter(h => !_isWorkDay(h, tk)).forEach(h => _patchHCardFromModel(h, tk, true));
}

function _reorderGoodListIfNeeded(tk) {
  const list = document.getElementById('goodList');
  if (!list) return false;
  const good = habits.filter(h => !h.bad);
  const scheduled = good.filter(h => _isWorkDay(h, tk));
  const sorted = _sortHabits(scheduled);
  if (sorted.length !== list.children.length) return false;
  for (let i = 0; i < sorted.length; i++) {
    const inner = document.getElementById('hcard-' + sorted[i].id);
    if (!inner) return false;
    const wrap = inner.closest('.hcard-flip-wrap');
    if (!wrap || wrap.parentNode !== list) return false;
  }
  sorted.forEach(h => {
    const wrap = document.getElementById('hcard-' + h.id).closest('.hcard-flip-wrap');
    list.appendChild(wrap);
  });
  return true;
}

function _reorderBonusListIfNeeded(tk) {
  const bonusList = document.getElementById('bonusList');
  const good = habits.filter(h => !h.bad);
  const bonuses = good.filter(h => !_isWorkDay(h, tk));
  if (bonuses.length === 0) {
    return !bonusList || bonusList.children.length === 0;
  }
  if (!bonusList || bonuses.length !== bonusList.children.length) return false;
  for (let i = 0; i < bonuses.length; i++) {
    const inner = document.getElementById('hcard-' + bonuses[i].id);
    if (!inner) return false;
    const wrap = inner.closest('.hcard-flip-wrap');
    if (!wrap || wrap.parentNode !== bonusList) return false;
  }
  bonuses.forEach(h => {
    const wrap = document.getElementById('hcard-' + h.id).closest('.hcard-flip-wrap');
    bonusList.appendChild(wrap);
  });
  return true;
}

/** После флипа: без innerHTML — только порядок + патч + полный chrome (без «прыжка» от пересборки) */
function _refreshTodayAfterFlip(tk) {
  if (!_reorderGoodListIfNeeded(tk) || !_reorderBonusListIfNeeded(tk)) {
    renderToday();
    return;
  }
  _patchAllGoodHCards(tk);
  _renderTodayChrome();
}

// ── Настроение ─────────────────────────────

function _renderMood(tk) {
  const row = document.getElementById('moodRow');
  row.innerHTML = '';
  const saved = moodLog[tk] ?? -1;

  MOOD_LABELS.forEach((lbl, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mood-btn' + (saved === i ? ' selected' : '');
    if (typeof MOOD_IMAGES !== 'undefined' && MOOD_IMAGES[i] && MOOD_IMAGES[i].src) {
      btn.innerHTML = `<img src="${MOOD_IMAGES[i].src}"
        alt="${esc(lbl)}" style="width:22px;height:22px;object-fit:cover;
        border-radius:50%">`;
    } else {
      const emojis = ['😞','😐','🙂','😊','🤩'];
      btn.textContent = emojis[i] || '·';
    }
    btn.title = lbl;
    btn.onclick = () => saveMood(i, tk);
    row.appendChild(btn);
  });
}

// ── Карточка полезной привычки ─────────────

function _buildHCard(h, tk, isBonus) {
  const isDone  = !!h.checks?.[tk];
  const streak  = calcStreak(h);
  const timeStr = h.times?.[tk]
    ? new Date(h.times[tk]).toLocaleTimeString('ru-RU',
        { hour:'2-digit', minute:'2-digit' })
    : '';

  let wrapCls = 'hcard';
  if (isBonus && isDone)   wrapCls += ' hc-bonus-done';
  else if (isBonus)        wrapCls += ' hc-bonus';
  else if (isDone)         wrapCls += ' hc-done';
  else if (_isNextCard(h)) wrapCls += ' hc-active';

  const subText = streak > 0
    ? `🔥 ${streak} дней подряд${scheduleLabel(h)}`
    : (scheduleLabel(h).slice(3) || 'Нет стрика');
  const subCls = streak > 0
    ? 'hcard-sub hs-streak'
    : 'hcard-sub' + (isBonus ? ' hs-bonus' : '');

  const backCls  = 'hcard-back' + (isBonus ? ' hback-bonus' : '');
  const backIco  = isBonus ? '★' : '✓';
  const backTitle = isBonus ? 'Бонус засчитан!' : 'Выполнено!';

  const wrap = document.createElement('div');
  wrap.className = 'hcard-flip-wrap';
  wrap.innerHTML = `
    <div class="${wrapCls}" id="hcard-${h.id}">

      <div class="hcard-front">
        <div class="hcard-row" onclick="toggleCheck('${h.id}')">
          <div class="hcard-done-zone">
            <div class="hcard-done-ico">${backIco}</div>
            <div class="hcard-done-lbl">${isBonus ? 'бонус' : 'готово'}</div>
          </div>
          <div class="hcard-body">
            <div class="hcard-top">
              <span class="hcard-ico">${h.icon || '⭐'}</span>
              <span class="hcard-name">${esc(h.name)}</span>
            </div>
            <div class="${subCls}">${esc(subText)}</div>
          </div>
          <div class="hcard-check-zone">
            <div class="hcard-btn"></div>
          </div>
        </div>
        <div class="hcard-bar-track">
          <div class="hcard-bar"></div>
        </div>
      </div>

      <div class="${backCls}">
        <div class="hcard-back-ico">${backIco}</div>
        <div class="hcard-back-info">
          <div class="hcard-back-title">${backTitle}</div>
          <div class="hcard-back-time">${esc(timeStr) || '—'}</div>
        </div>
        <button type="button" class="hcard-back-undo"
                onclick="toggleCheck('${h.id}')">
          отменить
        </button>
      </div>

    </div>`;
  return wrap;
}

function _isNextCard(h) {
  const tk = _todayKey();
  if (h.checks?.[tk]) return false;
  const good = habits.filter(hh => !hh.bad && _isWorkDay(hh, tk));
  const firstUndone = good.find(hh => !hh.checks?.[tk]);
  return firstUndone?.id === h.id;
}

function _sortHabits(list) {
  const tk = _todayKey();
  return [...list].sort((a, b) => {
    const aDone = !!a.checks?.[tk], bDone = !!b.checks?.[tk];
    if (aDone !== bDone) return aDone ? 1 : -1;
    return 0;
  });
}

// ── Карточка вредной привычки ──────────────

function _buildBCard(h, tk) {
  const isClean   = cleanTodaySet.has(h.id);
  const isSlipped = !!h.slips?.[tk];
  const streak    = calcCleanStreakAt(h, tk);

  let cls = 'bcard';
  if (isClean)   cls += ' bc-clean';
  if (isSlipped) cls += ' bc-slipped';

  const leftIco = isClean ? '✓' : isSlipped ? '✕' : '';
  const leftLbl = isClean ? 'чисто' : isSlipped ? 'срыв' : '';
  let subText = isClean
    ? `${streak} чистых дней подряд`
    : isSlipped
    ? 'Стрик сброшен · завтра новый шанс'
    : `${streak} чист. дн. · отметь сегодня`;
  const subCls = isClean ? 'bcard-sub bs-ok'
               : isSlipped ? 'bcard-sub bs-bad'
               : 'bcard-sub';

  const div = document.createElement('div');
  div.className = cls;
  div.id = 'bcard-' + h.id;
  div.innerHTML = `
    <div class="bcard-row">
      <div class="bcard-result-zone"
           onclick="event.stopPropagation();resetBadCard('${h.id}')">
        <div class="bcard-result-ico">${leftIco}</div>
        <div class="bcard-result-lbl">${leftLbl}</div>
      </div>
      <div class="bcard-body">
        <div class="bcard-top">
          <span class="bcard-ico">${h.icon || '🚫'}</span>
          <span class="bcard-name">${esc(h.name)}</span>
        </div>
        <div class="${subCls}">${esc(subText)}</div>
      </div>
      <div class="bcard-btns">
        <button type="button" class="btn-green"
                onclick="event.stopPropagation();markBadClean('${h.id}')"
                title="Выдержал">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2.5 7L5.5 10L11.5 4" stroke="var(--accent)"
              stroke-width="1.8" stroke-linecap="round"
              stroke-linejoin="round"/>
          </svg>
        </button>
        <button type="button" class="btn-red"
                onclick="event.stopPropagation();openSlip('${h.id}')"
                title="Был срыв">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M4 4L10 10M10 4L4 10" stroke="var(--bad)"
              stroke-width="1.8" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </div>
    <div class="bcard-bar-track">
      <div class="bcard-bar"></div>
    </div>`;
  return div;
}

// ── Прогресс-полоса вредных ────────────────

function _renderBadProgress(bad, tk) {
  const total   = bad.length;
  const clean   = bad.filter(h => cleanTodaySet.has(h.id)).length;
  const slipped = bad.filter(h => !!h.slips?.[tk]).length;
  const neutral = total - clean - slipped;

  const gPct = total ? Math.round(clean   / total * 100) : 0;
  const rPct = total ? Math.round(slipped / total * 100) : 0;

  document.getElementById('badBarGreen').style.width = gPct + '%';
  document.getElementById('badBarRed').style.width   = rPct + '%';

  document.getElementById('badPct').textContent =
    clean + ' из ' + total;
  document.getElementById('badPct').style.color =
    slipped > 0 && clean === 0 ? 'var(--bad)' : 'var(--accent)';

  document.getElementById('badLgGreen').textContent = 'Выдержал: ' + clean;
  document.getElementById('badLgRed').textContent   = 'Срывов: '   + slipped;
  document.getElementById('badLgGray').textContent  = 'Не отмечено: ' + neutral;

  document.getElementById('badBadge').textContent =
    clean === total
      ? 'все сдержались ✓'
      : clean + ' ✓' + (slipped > 0 ? ' · ' + slipped + ' срыв' : '');
}

// ── Хитмап 30 дней ────────────────────────

function _renderHeatmap30() {
  const wrap = document.getElementById('heatmap30');
  wrap.innerHTML = '';
  const tk = _todayKey();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(TODAY);
    d.setDate(d.getDate() - i);
    const dk = _dateKey(d);
    const good = habits.filter(h => !h.bad && _isWorkDay(h, dk));
    const done = good.length > 0
      ? good.filter(h => h.checks?.[dk]).length / good.length
      : 0;
    const cell = document.createElement('div');
    cell.className = 'hm-cell'
      + (done === 0     ? ''
       : done < 0.4     ? ' lv1'
       : done < 0.7     ? ' lv2'
       : done < 1       ? ' lv3'
       :                   ' lv4')
      + (dk === tk      ? ' today' : '');
    cell.title = dk + ': ' + Math.round(done * 100) + '%';
    wrap.appendChild(cell);
  }
}

// ── XP и стадия ───────────────────────────

function _renderXP() {
  const { total } = calcPoints();
  const stage    = getStage(total);
  const next     = nextStage(total);

  document.getElementById('xpStage').textContent = stage.nameRU;
  document.getElementById('xpNext').textContent  =
    next ? '→ ' + next.nameRU : 'Макс. уровень';

  const pct = next
    ? Math.round((total - stage.pts) / (next.pts - stage.pts) * 100)
    : 100;
  document.getElementById('xpFill').style.width = Math.min(100, Math.max(0, pct)) + '%';
  document.getElementById('xpCur').textContent  = total.toLocaleString() + ' pts';
  document.getElementById('xpMax').textContent  =
    next ? next.pts.toLocaleString() + ' pts' : '—';
}

// ── Сетка значков ─────────────────────────

function _renderBadgesGrid() {
  const grid = document.getElementById('badgesGrid');
  grid.innerHTML = '';
  BADGES.forEach(b => {
    const earned = earnedBadges.includes(b.id);
    const cell = document.createElement('div');
    cell.className = 'badge-cell ' + (earned ? 'earned' : 'locked');
    cell.textContent = b.emoji;
    cell.title = b.nameRU + (earned ? '' : ' · ' + b.descRU);
    grid.appendChild(cell);
  });
  document.getElementById('badgesTitle').textContent =
    'Значки · ' + earnedBadges.length + ' из ' + BADGES.length;
}
