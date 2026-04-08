// ── Чек полезной привычки ──────────────────

function toggleCheck(habitId) {
  const h  = habits.find(x => x.id === habitId);
  if (!h || h.bad) return;
  const tk = _todayKey();
  if (!h.checks) h.checks = {};

  let allDoneCelebration = false;

  if (h.checks[tk]) {
    delete h.checks[tk];
    delete h.times?.[tk];
  } else {
    h.checks[tk] = true;
    if (!h.times) h.times = {};
    h.times[tk] = new Date().toISOString();

    const good = habits.filter(hh => !hh.bad);
    const sched = good.filter(hh => _isWorkDay(hh, tk));
    const done  = sched.filter(hh => hh.checks?.[tk]).length;
    if (sched.length > 0 && done >= sched.length) {
      allDoneCelebration = true;
    }
  }

  saveData();

  const reduceMotion = typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const el = document.getElementById('hcard-' + habitId);
  const willFlip = currentScreen === 'today' && el && el.classList.contains('hcard') && !reduceMotion;

  if (!willFlip) {
    checkBadges();
    if (allDoneCelebration) {
      spawnConfetti();
      showToast('🎉 100% — все привычки выполнены!');
      showPtsToast(25);
    }
  }

  if (willFlip) {
    _patchAllGoodHCards(tk);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        _renderTodayChromeForFlip();
        renderNav();
      });
    });

    if (allDoneCelebration) {
      setTimeout(() => {
        spawnConfetti({ lite: true });
        showToast('🎉 100% — все привычки выполнены!');
        showPtsToast(25);
      }, 500);
    }

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      checkBadges();
      _refreshTodayAfterFlip(tk);
      renderNav();
    };

    const onEnd = (e) => {
      if (e.target !== el) return;
      if (e.propertyName !== 'transform' && e.propertyName !== '-webkit-transform') return;
      el.removeEventListener('transitionend', onEnd);
      clearTimeout(fallbackTimer);
      finish();
    };
    el.addEventListener('transitionend', onEnd);
    const fallbackTimer = setTimeout(() => {
      el.removeEventListener('transitionend', onEnd);
      finish();
    }, 1600);
    return;
  }

  renderToday();
  renderNav();
}

// ── Вредные привычки ──────────────────────

function markBadClean(habitId) {
  const h = habits.find(x => x.id === habitId);
  if (!h) return;
  if (!h.slips) h.slips = {};
  if (!h.clean) h.clean = {};
  cleanTodaySet.add(habitId);
  h.clean[_todayKey()] = true;
  delete h.slips[_todayKey()];
  saveData();
  if (!_flipBadCard(habitId, 'clean')) {
    renderToday();
  }
  _renderTodayChromeForFlip();
  renderNav();
  showToast('✓ ' + h.name + ' — сдержался!');
}

function resetBadCard(habitId) {
  const h = habits.find(x => x.id === habitId);
  if (!h) return;
  if (!h.slips) h.slips = {};
  if (!h.clean) h.clean = {};
  cleanTodaySet.delete(habitId);
  delete h.clean[_todayKey()];
  delete h.slips[_todayKey()];
  saveData();
  if (!_unflipBadCard(habitId)) {
    renderToday();
  }
  _renderTodayChromeForFlip();
  renderNav();
}

// ── Срыв вредной привычки ─────────────────

function openSlip(habitId) {
  const h = habits.find(x => x.id === habitId);
  if (!h) return;
  const modal = document.getElementById('slipModal');
  modal.innerHTML = `
    <div class="modal-title">Записать срыв</div>
    <p style="font-size:13px;color:var(--text2);margin-bottom:14px">
      ${esc(h.name)}<br>
      <span style="font-size:12px;color:var(--text3)">
        Стрик будет сброшен. Честность — часть прогресса.
      </span>
    </p>
    <div class="field">
      <label class="field-label">Что спровоцировало? (необязательно)</label>
      <input class="field-input" id="slipTrigger"
             placeholder="напр. стресс, компания...">
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-ghost" onclick="closeSlip()">Отмена</button>
      <button type="button" class="btn btn-danger"
              onclick="confirmSlip('${h.id}')">Записать срыв</button>
    </div>`;
  document.getElementById('slipOverlay').classList.add('open');
}

function confirmSlip(habitId) {
  const h = habits.find(x => x.id === habitId);
  if (!h) return;
  const tk = _todayKey();
  const trigger = document.getElementById('slipTrigger')?.value.trim();

  if (!h.slips) h.slips = {};
  h.slips[tk] = true;
  cleanTodaySet.delete(habitId);
  if (h.clean) delete h.clean[tk];
  if (!h.notes) h.notes = {};
  if (!h.notes[tk]) h.notes[tk] = {};
  if (trigger) h.notes[tk].trigger = trigger;

  saveData();
  closeSlip();
  if (!_flipBadCard(habitId, 'slipped')) {
    renderToday();
  }
  _renderTodayChromeForFlip();
  renderNav();
  checkBadges();
  showToast('Срыв записан · завтра новый шанс');
}

function closeSlip(e) {
  if (e && e.target !== document.getElementById('slipOverlay')) return;
  document.getElementById('slipOverlay').classList.remove('open');
}

// ── Настроение ─────────────────────────────

function saveMood(idx, tk) {
  moodLog[tk] = idx;
  saveData();
  _renderMood(tk);
}

// ── Создание привычки ─────────────────────

function openCreate(type) {
  _editingId      = null;
  _createType     = type || 'good';
  _createIcon     = _createType === 'bad' ? '🚫' : '⭐';
  _createCat      = '';
  _createSchedule = null;

  const modal = document.getElementById('createModal');
  modal.innerHTML = `
    <div class="modal-title">
      ${_createType === 'bad' ? 'Вредная привычка' : 'Новая привычка'}
    </div>

    <div class="field flex gap-8" style="margin-bottom:14px">
      <button type="button" class="btn ${_createType==='good'?'btn-primary':'btn-ghost'} full"
              onclick="setCreateType('good')">Полезная</button>
      <button type="button" class="btn ${_createType==='bad'?'btn-danger':'btn-ghost'} full"
              onclick="setCreateType('bad')">Вредная</button>
    </div>

    <div class="field">
      <label class="field-label">Иконка</label>
      <div id="iconGrid" style="display:flex;flex-wrap:wrap;gap:6px"></div>
    </div>

    <div class="field">
      <label class="field-label">Название</label>
      <input class="field-input" id="createName"
             placeholder="напр. Пробежка, Не курить...">
    </div>

    <div class="field">
      <label class="field-label">Категория</label>
      <div id="catGrid" style="display:flex;flex-wrap:wrap;gap:6px"></div>
    </div>

    <div class="field" id="scheduleField"
         ${_createType==='bad' ? 'style="display:none"' : ''}>
      <label class="field-label">Расписание</label>
      <div style="display:flex;gap:6px;flex-wrap:wrap" id="schedPresets">
        <button type="button" class="btn btn-primary btn-sm" data-preset="every"
                onclick="setSchedule(this,'every')">Каждый день</button>
        <button type="button" class="btn btn-ghost btn-sm" data-preset="weekdays"
                onclick="setSchedule(this,'weekdays')">Будни</button>
        <button type="button" class="btn btn-ghost btn-sm" data-preset="weekend"
                onclick="setSchedule(this,'weekend')">Выходные</button>
        <button type="button" class="btn btn-ghost btn-sm" data-preset="custom"
                onclick="setSchedule(this,'custom')">Свои дни</button>
      </div>
      <div id="dayPicker" style="display:none;flex-wrap:wrap;gap:5px;margin-top:8px"></div>
    </div>

    <div class="field">
      <label class="field-label">Описание (необязательно)</label>
      <input class="field-input" id="createDesc"
             placeholder="Зачем эта привычка?">
    </div>

    <div class="modal-footer">
      <button type="button" class="btn btn-ghost" onclick="closeCreate()">Отмена</button>
      <button type="button" class="btn btn-primary" onclick="saveNewHabit()">Создать</button>
    </div>`;

  _buildIconGrid();
  _buildCatGrid();
  document.getElementById('createOverlay').classList.add('open');
  document.getElementById('createName').focus();
}

function openEdit(habitId) {
  const h = habits.find(x => x.id === habitId);
  if (!h) return;

  _editingId      = habitId;
  _createType     = h.bad ? 'bad' : 'good';
  _createIcon     = h.icon || (h.bad ? '🚫' : '⭐');
  _createCat      = h.category || '';
  _createSchedule = (!h.schedule || h.schedule.length === 0)
    ? null
    : [...h.schedule];

  const modal = document.getElementById('createModal');
  modal.innerHTML = `
    <div class="modal-title">Редактировать привычку</div>

    <div class="field">
      <label class="field-label">Иконка</label>
      <div id="iconGrid" style="display:flex;flex-wrap:wrap;gap:6px"></div>
    </div>

    <div class="field">
      <label class="field-label">Название</label>
      <input class="field-input" id="createName"
             value="${esc(h.name)}"
             placeholder="напр. Пробежка, Не курить...">
    </div>

    <div class="field">
      <label class="field-label">Категория</label>
      <div id="catGrid" style="display:flex;flex-wrap:wrap;gap:6px"></div>
    </div>

    <div class="field" id="scheduleField"
         ${h.bad ? 'style="display:none"' : ''}>
      <label class="field-label">Расписание</label>
      <div style="display:flex;gap:6px;flex-wrap:wrap" id="schedPresets">
        <button type="button" class="btn ${!h.schedule || h.schedule.length===0 ? 'btn-primary' : 'btn-ghost'} btn-sm"
                onclick="setSchedule(this,'every')">Каждый день</button>
        <button type="button" class="btn ${JSON.stringify(h.schedule)==='[0,1,2,3,4]' ? 'btn-primary' : 'btn-ghost'} btn-sm"
                onclick="setSchedule(this,'weekdays')">Будни</button>
        <button type="button" class="btn ${JSON.stringify(h.schedule)==='[5,6]' ? 'btn-primary' : 'btn-ghost'} btn-sm"
                onclick="setSchedule(this,'weekend')">Выходные</button>
        <button type="button" class="btn ${h.schedule && h.schedule.length>0 && JSON.stringify(h.schedule)!=='[0,1,2,3,4]' && JSON.stringify(h.schedule)!=='[5,6]' ? 'btn-primary' : 'btn-ghost'} btn-sm"
                onclick="setSchedule(this,'custom')">Свои дни</button>
      </div>
      <div id="dayPicker" style="display:none;flex-wrap:wrap;gap:5px;margin-top:8px"></div>
    </div>

    <div class="field">
      <label class="field-label">Описание (необязательно)</label>
      <input class="field-input" id="createDesc"
             value="${esc(h.desc || '')}"
             placeholder="Зачем эта привычка?">
    </div>

    <div class="modal-footer">
      <button type="button" class="btn btn-ghost"
              onclick="closeCreate()">Отмена</button>
      <button type="button" class="btn btn-primary"
              onclick="saveNewHabit()">Сохранить</button>
    </div>`;

  _buildIconGrid();
  _buildCatGrid();

  // Если свои дни — показываем пикер сразу
  if (h.schedule && h.schedule.length > 0 &&
      JSON.stringify(h.schedule) !== '[0,1,2,3,4]' &&
      JSON.stringify(h.schedule) !== '[5,6]') {
    const picker = document.getElementById('dayPicker');
    if (picker) {
      picker.style.display = 'flex';
      const days = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
      days.forEach((d, i) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = d;
        btn.className = 'btn ' + (_createSchedule.includes(i) ? 'btn-primary' : 'btn-ghost');
        btn.style.cssText = 'padding:5px 8px;font-size:12px;min-width:36px';
        btn.onclick = () => {
          const idx = _createSchedule.indexOf(i);
          if (idx >= 0) _createSchedule.splice(idx, 1);
          else _createSchedule.push(i);
          _createSchedule.sort((a,b)=>a-b);
          btn.className = 'btn ' + (_createSchedule.includes(i) ? 'btn-primary' : 'btn-ghost');
          btn.style.cssText = 'padding:5px 8px;font-size:12px;min-width:36px';
        };
        picker.appendChild(btn);
      });
    }
  }

  document.getElementById('createOverlay').classList.add('open');
  document.getElementById('createName').focus();
}

function setCreateType(type) {
  _createType = type;
  openCreate(type);
}

function setSchedule(btn, preset) {
  document.querySelectorAll('#schedPresets .btn').forEach(b => {
    b.className = b === btn ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm';
  });
  const picker = document.getElementById('dayPicker');
  if (preset === 'every')    { _createSchedule = null;          picker.style.display = 'none'; }
  if (preset === 'weekdays') { _createSchedule = [0,1,2,3,4];   picker.style.display = 'none'; }
  if (preset === 'weekend')  { _createSchedule = [5,6];         picker.style.display = 'none'; }
  if (preset === 'custom') {
    picker.style.display = 'flex';
    _createSchedule = _createSchedule && _createSchedule.length ? _createSchedule : [0,1,2,3,4,5,6];
    const days = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
    picker.innerHTML = '';
    days.forEach((d, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = d;
      b.className = 'btn ' +
        (_createSchedule.includes(i) ? 'btn-primary' : 'btn-ghost');
      b.style.cssText = 'padding:5px 8px;font-size:12px;min-width:36px';
      b.onclick = () => {
        const idx = _createSchedule.indexOf(i);
        if (idx >= 0) _createSchedule.splice(idx, 1);
        else _createSchedule.push(i);
        _createSchedule.sort((a,b)=>a-b);
        b.className = 'btn ' +
          (_createSchedule.includes(i) ? 'btn-primary' : 'btn-ghost');
      };
      picker.appendChild(b);
    });
  }
}

function _buildIconGrid() {
  const icons = [
    '⭐','🏃','💧','📚','🧘','💪','🥗','😴','💼','🎨',
    '💰','👥','🚫','🚬','🍔','📱','🍷','🎮','🛒','☕',
  ];
  const wrap = document.getElementById('iconGrid');
  if (!wrap) return;
  wrap.innerHTML = '';
  icons.forEach(ico => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = ico;
    btn.className = 'btn ' + (ico === _createIcon ? 'btn-primary' : 'btn-ghost');
    btn.style.cssText = 'width:36px;height:36px;padding:0;font-size:16px;border-radius:var(--r-md)';
    btn.onclick = () => {
      _createIcon = ico;
      _buildIconGrid();
    };
    wrap.appendChild(btn);
  });
}

function _buildCatGrid() {
  const wrap = document.getElementById('catGrid');
  if (!wrap) return;
  wrap.innerHTML = '';
  CATEGORIES.forEach(cat => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = cat.icon + ' ' + cat.name;
    btn.className = 'btn ' +
      (cat.name === _createCat ? 'btn-primary' : 'btn-ghost');
    btn.style.cssText = 'font-size:12px;padding:5px 10px';
    btn.onclick = () => {
      _createCat = _createCat === cat.name ? '' : cat.name;
      _buildCatGrid();
    };
    wrap.appendChild(btn);
  });
}

function saveNewHabit() {
  const nameEl = document.getElementById('createName');
  const name = nameEl.value.trim();
  if (!name) {
    nameEl.classList.add('error');
    nameEl.focus();
    setTimeout(() => nameEl.classList.remove('error'), 1500);
    return;
  }
  const desc = document.getElementById('createDesc')?.value.trim() || '';

  // ── Редактирование существующей ──
  if (_editingId) {
    const h = habits.find(x => x.id === _editingId);
    if (h) {
      h.name     = name;
      h.icon     = _createIcon;
      h.category = _createCat;
      h.desc     = desc;
      h.schedule = _createType === 'bad' ? null : _createSchedule;
      saveData();
      renderAll();
      showToast('✓ «' + name + '» обновлена');
    }
    closeCreate();
    return;
  }

  // ── Создание новой ──
  const h = {
    id:        _uuid(),
    name,
    icon:      _createIcon,
    category:  _createCat,
    desc,
    bad:       _createType === 'bad',
    schedule:  _createType === 'bad' ? null : _createSchedule,
    checks:    {},
    slips:     {},
    clean:     {},
    times:     {},
    notes:     {},
    createdAt: _todayKey(),
  };
  habits.push(h);
  saveData();
  closeCreate();
  renderToday();
  renderNav();
  showToast('✓ «' + name + '» добавлена');
}

function closeCreate(e) {
  if (e && e.target !== document.getElementById('createOverlay')) return;
  document.getElementById('createOverlay').classList.remove('open');
  _editingId = null;
}

// ── Удаление и архив ──────────────────────

function openDelete(habitId) {
  const h = habits.find(x => x.id === habitId);
  if (!h) return;
  const modal = document.getElementById('deleteModal');
  modal.innerHTML = `
    <div class="modal-title">Удалить привычку</div>
    <p style="font-size:13px;color:var(--text2);margin-bottom:16px">
      «${esc(h.name)}»<br>
      <span style="font-size:12px;color:var(--text3)">
        Вся история будет удалена безвозвратно.
        Лучше архивировать.
      </span>
    </p>
    <div class="modal-footer">
      <button type="button" class="btn btn-ghost"
              onclick="archiveHabit('${h.id}')">В архив</button>
      <button type="button" class="btn btn-ghost"
              onclick="closeDelete()">Отмена</button>
      <button type="button" class="btn btn-danger"
              onclick="confirmDelete('${h.id}')">Удалить</button>
    </div>`;
  document.getElementById('deleteOverlay').classList.add('open');
}

function confirmDelete(habitId) {
  habits = habits.filter(x => x.id !== habitId);
  saveData();
  closeDelete();
  renderAll();
  showToast('Привычка удалена');
}

function archiveHabit(habitId) {
  const h = habits.find(x => x.id === habitId);
  if (!h) return;
  habits   = habits.filter(x => x.id !== habitId);
  archived = [...archived, h];
  saveData();
  closeDelete();
  renderAll();
  showToast('«' + h.name + '» перемещена в архив');
}

function restoreHabit(habitId) {
  const h = archived.find(x => x.id === habitId);
  if (!h) return;
  archived = archived.filter(x => x.id !== habitId);
  habits   = [...habits, h];
  saveData();
  renderAll();
  showToast('«' + h.name + '» восстановлена');
}

function closeDelete(e) {
  if (e && e.target !== document.getElementById('deleteOverlay')) return;
  document.getElementById('deleteOverlay').classList.remove('open');
}

// ── Экспорт / Импорт ─────────────────────

function exportData() {
  const data = JSON.stringify({
    schemaVersion: SCHEMA_VERSION,
    habits,
    archived,
    earnedBadges,
    gender,
    moodLog,
    moodEnabled,
    dayProgressWidgetEnabled,
    bestStreakWidgetEnabled,
    seriesWidgetEnabled,
    savedAt: new Date().toISOString(),
  }, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'habitflow-backup-' + _todayKey() + '.json';
  a.click();
  URL.revokeObjectURL(a.href);
  showToast('💾 Резервная копия сохранена');
}

function triggerImport() {
  document.getElementById('importFile').click();
}

function importData(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = e => {
    try {
      const d = JSON.parse(e.target.result);

      // Проверка что файл похож на данные HabitFlow
      if (!d.habits && !d.archived && !d.earnedBadges) {
        showToast('Файл не похож на резервную копию HabitFlow');
        event.target.value = '';
        return;
      }

      // Подсчёт текущих данных для предупреждения
      const currentCount = habits.length + archived.length;
      const importCount  = (d.habits?.length || 0) + (d.archived?.length || 0);

      if (currentCount > 0) {
        const ok = confirm(
          'Текущие данные будут заменены данными из файла.\n\n' +
          'Сейчас: ' + currentCount + ' привычек\n' +
          'В файле: ' + importCount  + ' привычек\n\n' +
          'Продолжить?'
        );
        if (!ok) {
          event.target.value = '';
          return;
        }
      }

      // Запускаем миграции схемы
      _runMigrations(d);

      habits       = Array.isArray(d.habits)       ? d.habits       : [];
      archived     = Array.isArray(d.archived)     ? d.archived     : [];
      earnedBadges = Array.isArray(d.earnedBadges) ? d.earnedBadges : [];
      gender       = d.gender       || null;
      moodLog      = (d.moodLog && typeof d.moodLog === 'object') ? d.moodLog : {};
      moodEnabled  = d.moodEnabled  || false;
      dayProgressWidgetEnabled = d.dayProgressWidgetEnabled === undefined ? true : !!d.dayProgressWidgetEnabled;
      bestStreakWidgetEnabled = d.bestStreakWidgetEnabled === undefined ? true : !!d.bestStreakWidgetEnabled;
      seriesWidgetEnabled = d.seriesWidgetEnabled === undefined ? true : !!d.seriesWidgetEnabled;

      _migrateData();
      _syncCleanTodaySetFromData();
      saveData();
      renderAll();
      showToast('✓ Загружено: ' + habits.length + ' привычек');

    } catch (err) {
      console.error('Ошибка импорта:', err);
      showToast('Ошибка: файл повреждён или имеет неверный формат');
    }

    event.target.value = '';
  };

  reader.readAsText(file);
}

// ── Флип вредных карточек ──────────────────

function _flipBadCard(habitId, state) {
  const card = document.getElementById('bcard-' + habitId);
  if (!card) return false;
  const bg   = state === 'clean' ? 'var(--accent)' : 'var(--bad)';
  const ico  = state === 'clean' ? '✓' : '✕';
  const title = state === 'clean' ? 'Выдержал!' : 'Срыв записан';
  const h = habits.find(x => x.id === habitId);
  if (!h) return false;
  const streak = calcCleanStreakAt(h, _todayKey());
  const sub   = state === 'clean'
    ? streak + ' чистых дней'
    : 'Завтра новый шанс';
  // Обновляем обратную сторону
  const back = card.querySelector('[data-face="back"]');
  if (back) {
    back.style.background = bg;
    const icoEl = back.querySelector('[data-role="back-ico"]');
    const titleEl = back.querySelector('[data-role="back-title"]');
    const subEl = back.querySelector('[data-role="back-sub"]');
    if (icoEl) icoEl.textContent = ico;
    if (titleEl) titleEl.textContent = title;
    if (subEl) subEl.textContent = sub;
  }
  // Флипаем
  requestAnimationFrame(() => {
    card.style.transform = 'rotateX(-180deg)';
  });
  return true;
}

function _unflipBadCard(habitId) {
  const card = document.getElementById('bcard-' + habitId);
  if (!card) return false;
  requestAnimationFrame(() => {
    card.style.transform = 'rotateX(0deg)';
  });
  return true;
}


