// Cargador de Horas — Kimai
// Hecho por Juan Lofredo
//
// Cómo usarlo: entrá a https://kimai.ayi.group/es/timesheet/, abrí la consola
// del navegador (F12), pegá este script completo y presioná Enter.
// Instrucciones detalladas en el README.md de este mismo repositorio.

(() => {
  document.getElementById('kimai-loader')?.remove();
  document.getElementById('base-day-modal')?.remove();
  document.getElementById('kimai-fonts')?.remove();

  document.head.insertAdjacentHTML('beforeend', `
    <style id="kimai-fonts">
      #kimai-loader, #base-day-modal { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
      .kd-btn { transition: background .12s ease, border-color .12s ease, transform .1s ease; }
      .kd-btn:hover:not(:disabled) { filter: brightness(0.97); }
      .kd-btn:disabled { opacity: 0.35; cursor: not-allowed !important; }
      .kd-day:hover:not(:disabled) { border-color: #64748b !important; }
      .kd-day:disabled { cursor: not-allowed !important; }
      #kimai-loader ::-webkit-scrollbar, #base-day-modal ::-webkit-scrollbar { width: 6px; }
      #kimai-loader ::-webkit-scrollbar-thumb, #base-day-modal ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
    </style>
  `);

  const NAVY = '#1e293b';
  const ACCENT = '#2563eb';
  const MIN_YEAR = 2026;
  const MIN_MONTH = 5; // junio (0-indexed)

  const HTML = `
    <div id="kimai-loader" style="
      position: fixed; inset: 0; background: rgba(15, 23, 42, 0.55);
      z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px;
    ">
      <div style="
        background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px;
        box-shadow: 0 20px 50px rgba(0,0,0,0.25); max-width: 760px; width: 100%; max-height: 92vh; overflow-y: auto;
      ">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; border-bottom: 1px solid #e2e8f0; padding-bottom: 18px;">
          <div>
            <h1 style="margin: 0; color: ${NAVY}; font-size: 19px; font-weight: 700;">Juan Lofredo</h1>
            <p style="margin: 4px 0 0; color: #64748b; font-size: 13px;">Carga de horas · Kimai</p>
          </div>
          <button onclick="document.getElementById('kimai-loader').remove()" class="kd-btn" style="
            background: #f1f5f9; border: 1px solid #e2e8f0; color: #475569;
            width: 30px; height: 30px; border-radius: 6px; cursor: pointer; font-size: 14px;
          ">✕</button>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
          <button id="prev-month" class="kd-btn" style="
            background: #fff; color: ${NAVY}; border: 1px solid #cbd5e1;
            width: 30px; height: 30px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600;
          ">‹</button>
          <h2 id="month-year" style="margin: 0; color: ${NAVY}; font-size: 14px; font-weight: 700; text-transform: capitalize;"></h2>
          <button id="next-month" class="kd-btn" style="
            background: #fff; color: ${NAVY}; border: 1px solid #cbd5e1;
            width: 30px; height: 30px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600;
          ">›</button>
        </div>

        <div id="weekday-header" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; margin-bottom: 6px; text-align: center;"></div>
        <div id="calendar" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; margin-bottom: 16px;"></div>

        <div style="display: flex; gap: 16px; margin-bottom: 18px; font-size: 11.5px; color: #64748b;">
          <span><span style="display:inline-block;width:9px;height:9px;border-radius:2px;background:#dbeafe;border:1px solid #93c5fd;margin-right:5px;"></span>Seleccionado</span>
          <span><span style="display:inline-block;width:9px;height:9px;border-radius:2px;background:#dcfce7;border:1px solid #86efac;margin-right:5px;"></span>Ya cargado</span>
          <span><span style="display:inline-block;width:9px;height:9px;border-radius:2px;background:#fff;border:1px solid #cbd5e1;margin-right:5px;"></span>Disponible</span>
        </div>

        <div id="selection-box" style="display: none; background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px 16px; border-radius: 8px; margin-bottom: 18px;">
          <p style="margin: 0 0 8px; color: #334155; font-size: 12.5px; font-weight: 600;">
            <span id="selected-count"></span> seleccionados
          </p>
          <div id="selected-days" style="display: flex; flex-wrap: wrap; gap: 5px;"></div>
        </div>

        <div style="display: flex; gap: 8px;">
          <button id="clear-selection" class="kd-btn" style="
            flex: 1; background: #fff; color: #475569; border: 1px solid #cbd5e1;
            padding: 11px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600;
          ">Limpiar selección</button>
          <button id="load-button" class="kd-btn" style="
            flex: 2; background: ${ACCENT}; color: white; border: none;
            padding: 11px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600;
          ">Elegir día base y cargar</button>
        </div>

        <div id="progress" style="display: none; margin-top: 20px; padding: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span id="progress-text" style="color: ${NAVY}; font-weight: 700; font-size: 12.5px;"></span>
            <span id="progress-time" style="color: #64748b; font-size: 11.5px;"></span>
          </div>
          <div style="background: #e2e8f0; height: 6px; border-radius: 3px; overflow: hidden;">
            <div id="progress-bar" style="height: 100%; background: ${ACCENT}; width: 0%; transition: width .3s ease;"></div>
          </div>
          <div id="log" style="margin-top: 12px; max-height: 170px; overflow-y: auto; font-size: 11.5px; color: #475569; line-height: 1.9; font-family: ui-monospace, monospace;"></div>
        </div>

        <div id="done-banner" style="display: none; margin-top: 18px; padding: 16px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; text-align: center;">
          <div style="color: #15803d; font-weight: 700; font-size: 14px;" id="done-text"></div>
          <div style="color: #4d7c5f; font-size: 12px; margin-top: 4px;">La página se va a recargar sola en unos segundos.</div>
        </div>
      </div>
    </div>

    <div id="base-day-modal" style="
      position: fixed; inset: 0; background: rgba(15,23,42,0.55);
      z-index: 10000; display: none; align-items: center; justify-content: center; padding: 20px;
    ">
      <div style="
        background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 28px;
        box-shadow: 0 20px 50px rgba(0,0,0,0.25); max-width: 420px; width: 100%; max-height: 90vh; overflow-y: auto;
      ">
        <h2 style="margin: 0 0 3px; color: ${NAVY}; font-size: 16px; font-weight: 700;">Elegí el día base</h2>
        <p style="color: #64748b; margin: 0 0 16px; font-size: 12.5px;">Solo se pueden elegir días ya cargados</p>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <button id="base-prev-month" class="kd-btn" style="
            background: #fff; color: ${NAVY}; border: 1px solid #cbd5e1;
            width: 28px; height: 28px; border-radius: 6px; cursor: pointer; font-weight: 600;
          ">‹</button>
          <h3 id="base-month-year" style="margin: 0; color: ${NAVY}; font-size: 13px; font-weight: 700; text-transform: capitalize;"></h3>
          <button id="base-next-month" class="kd-btn" style="
            background: #fff; color: ${NAVY}; border: 1px solid #cbd5e1;
            width: 28px; height: 28px; border-radius: 6px; cursor: pointer; font-weight: 600;
          ">›</button>
        </div>

        <div id="base-weekday-header" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px; margin-bottom: 5px; text-align: center;"></div>
        <div id="base-calendar" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px; margin-bottom: 16px;"></div>

        <div id="base-day-preview" style="
          background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px; border-radius: 8px; margin-bottom: 20px; display: none;
        ">
          <h4 style="margin: 0 0 10px; color: ${NAVY}; font-size: 12px; font-weight: 700;">Registros del <span id="preview-day"></span></h4>
          <div id="preview-entries" style="display: flex; flex-direction: column; gap: 7px;"></div>
        </div>

        <div style="display: flex; gap: 8px;">
          <button id="cancel-base" class="kd-btn" style="
            flex: 1; background: #fff; color: #475569; border: 1px solid #cbd5e1;
            padding: 10px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600;
          ">Cancelar</button>
          <button id="confirm-base" class="kd-btn" disabled style="
            flex: 1; background: #cbd5e1; color: #fff; border: none;
            padding: 10px; border-radius: 8px; cursor: not-allowed; font-size: 13px; font-weight: 600;
          ">Confirmar y cargar</button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', HTML);

  const monthNames = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const weekdayLabels = ['L','M','X','J','V','S','D'];

  function isAtMin(date) {
    return date.getFullYear() === MIN_YEAR && date.getMonth() === MIN_MONTH;
  }
  function clampToMin(date) {
    if (date.getFullYear() < MIN_YEAR || (date.getFullYear() === MIN_YEAR && date.getMonth() < MIN_MONTH)) {
      date.setFullYear(MIN_YEAR, MIN_MONTH, 1);
    }
    return date;
  }

  let mainDate = new Date();
  mainDate.setDate(1);
  let selectedDays = new Set();

  let baseDate = new Date();
  baseDate.setDate(1);
  baseDate.setMonth(baseDate.getMonth() - 1);
  clampToMin(baseDate);
  let selectedBaseDay = null;
  let selectedBaseEntries = [];

  function getLoadedDaysForMonth(year, month) {
    const loaded = new Set();
    document.querySelectorAll('table tbody tr').forEach(row => {
      const dateCell = row.querySelector('td:nth-child(2)');
      if (dateCell) {
        const parts = dateCell.textContent.trim().split('/');
        if (parseInt(parts[1]) === month + 1 && parseInt(parts[2]) === year) {
          loaded.add(parseInt(parts[0]));
        }
      }
    });
    return loaded;
  }

  function getEntriesForDate(day, month, year) {
    const entries = [];
    document.querySelectorAll('table tbody tr').forEach(row => {
      const dateCell = row.querySelector('td:nth-child(2)');
      if (!dateCell) return;
      const parts = dateCell.textContent.trim().split('/');
      if (parseInt(parts[0]) === day && parseInt(parts[1]) === month + 1 && parseInt(parts[2]) === year) {
        const timeStart = row.querySelector('td:nth-child(3)')?.textContent.trim();
        const timeEnd = row.querySelector('td:nth-child(4)')?.textContent.trim();
        const duration = row.querySelector('td:nth-child(5)')?.textContent.trim();
        const client = row.querySelector('td:nth-child(6)')?.textContent.trim();
        const project = row.querySelector('td:nth-child(7)')?.textContent.trim();
        const activity = row.querySelector('td:nth-child(8)')?.textContent.trim();
        const link = row.querySelector('a[href*="/timesheet/"]');
        const id = link ? (link.href.match(/\/timesheet\/(\d+)/) || [])[1] : null;
        if (timeStart && timeEnd && id) {
          entries.push({ id, start: timeStart, end: timeEnd, duration, client, project, activity });
        }
      }
    });
    return entries;
  }

  async function duplicateEntry(entryId, newDate) {
    const getRes = await fetch(`/es/timesheet/${entryId}/duplicate`, { method: 'GET' });
    const html = await getRes.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const formEl = doc.querySelector('form');
    if (!formEl) throw new Error('No se encontró el formulario');

    const tempDiv = document.createElement('div');
    tempDiv.style.display = 'none';
    tempDiv.innerHTML = formEl.outerHTML;
    document.body.appendChild(tempDiv);
    const liveForm = tempDiv.querySelector('form');

    const dateField = liveForm.querySelector('[name="timesheet_edit_form[begin_date]"]');
    if (!dateField) { tempDiv.remove(); throw new Error('No se encontró el campo de fecha'); }
    dateField.value = newDate;

    const fd = new FormData(liveForm);
    const postRes = await fetch(liveForm.action, {
      method: 'POST', body: fd, headers: { 'X-Requested-With': 'XMLHttpRequest' }
    });
    const postText = await postRes.text();
    tempDiv.remove();

    const failed = postText.includes('id="form_modal"');
    if (failed) throw new Error('El servidor rechazó el formulario');
    return true;
  }

  function renderWeekdayHeader(container) {
    container.innerHTML = weekdayLabels.map(d =>
      `<div style="font-size: 10.5px; font-weight: 700; color: #94a3b8;">${d}</div>`
    ).join('');
  }

  function renderMainCalendar() {
    const year = mainDate.getFullYear();
    const month = mainDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startOffset = (firstDay.getDay() + 6) % 7;

    document.getElementById('month-year').textContent = `${monthNames[month]} ${year}`;
    document.getElementById('prev-month').disabled = isAtMin(mainDate);
    renderWeekdayHeader(document.getElementById('weekday-header'));

    const loadedDays = getLoadedDaysForMonth(year, month);
    const calendar = document.getElementById('calendar');
    calendar.innerHTML = '';

    for (let i = 0; i < startOffset; i++) calendar.appendChild(document.createElement('div'));

    for (let day = 1; day <= daysInMonth; day++) {
      const isLoaded = loadedDays.has(day);
      const isSelected = selectedDays.has(day);
      const dow = new Date(year, month, day).getDay();
      const isWeekend = dow === 0 || dow === 6;

      const btn = document.createElement('button');
      btn.textContent = day;
      btn.className = 'kd-day kd-btn';
      btn.disabled = isLoaded;
      btn.style.cssText = `
        padding: 10px 0; border-radius: 6px; border: 1px solid ${isSelected ? '#93c5fd' : isLoaded ? '#86efac' : '#e2e8f0'};
        background: ${isSelected ? '#dbeafe' : isLoaded ? '#dcfce7' : isWeekend ? '#f8fafc' : '#fff'};
        color: ${isSelected ? '#1d4ed8' : isLoaded ? '#15803d' : isWeekend ? '#94a3b8' : '#1e293b'};
        font-weight: 600; font-size: 13px; cursor: ${isLoaded ? 'not-allowed' : 'pointer'};
      `;
      if (isLoaded) btn.title = 'Ya cargado';
      else btn.onclick = () => {
        selectedDays.has(day) ? selectedDays.delete(day) : selectedDays.add(day);
        renderMainCalendar();
        updateSelectedDisplay();
      };

      calendar.appendChild(btn);
    }
  }

  function updateSelectedDisplay() {
    const count = selectedDays.size;
    const box = document.getElementById('selection-box');
    box.style.display = count > 0 ? 'block' : 'none';
    if (count === 0) return;
    document.getElementById('selected-count').textContent = `${count} día${count !== 1 ? 's' : ''}`;
    const display = document.getElementById('selected-days');
    display.innerHTML = '';
    Array.from(selectedDays).sort((a, b) => a - b).forEach(day => {
      const tag = document.createElement('span');
      tag.textContent = `${day}/${mainDate.getMonth() + 1}`;
      tag.style.cssText = `background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; padding: 4px 9px; border-radius: 5px; font-size: 11.5px; font-weight: 600;`;
      display.appendChild(tag);
    });
  }

  function renderBaseCalendar() {
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startOffset = (firstDay.getDay() + 6) % 7;

    document.getElementById('base-month-year').textContent = `${monthNames[month]} ${year}`;
    document.getElementById('base-prev-month').disabled = isAtMin(baseDate);
    renderWeekdayHeader(document.getElementById('base-weekday-header'));

    const loadedDays = getLoadedDaysForMonth(year, month);
    const calendar = document.getElementById('base-calendar');
    calendar.innerHTML = '';

    for (let i = 0; i < startOffset; i++) calendar.appendChild(document.createElement('div'));

    for (let day = 1; day <= daysInMonth; day++) {
      const isLoaded = loadedDays.has(day);
      const isSelected = selectedBaseDay && selectedBaseDay.day === day && selectedBaseDay.month === month && selectedBaseDay.year === year;

      const btn = document.createElement('button');
      btn.textContent = day;
      btn.className = 'kd-day kd-btn';
      btn.disabled = !isLoaded;
      btn.style.cssText = `
        padding: 7px 0; border-radius: 6px; border: 1px solid ${isSelected ? '#93c5fd' : isLoaded ? '#86efac' : '#f1f5f9'};
        background: ${isSelected ? '#dbeafe' : isLoaded ? '#dcfce7' : '#f8fafc'};
        color: ${isSelected ? '#1d4ed8' : isLoaded ? '#15803d' : '#cbd5e1'};
        font-weight: 600; font-size: 12.5px; cursor: ${isLoaded ? 'pointer' : 'not-allowed'};
      `;

      if (isLoaded) {
        btn.onclick = () => {
          selectedBaseDay = { day, month, year };
          selectedBaseEntries = getEntriesForDate(day, month, year);
          renderBaseCalendar();
          showBaseDayPreview(day, month, year);
        };
      }

      calendar.appendChild(btn);
    }
  }

  function showBaseDayPreview(day, month, year) {
    const preview = document.getElementById('base-day-preview');
    document.getElementById('preview-day').textContent = `${day}/${month + 1}/${year}`;
    const entriesDiv = document.getElementById('preview-entries');
    entriesDiv.innerHTML = '';

    selectedBaseEntries.forEach(entry => {
      const card = document.createElement('div');
      card.style.cssText = `background: #fff; border: 1px solid #e2e8f0; padding: 9px 11px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;`;
      card.innerHTML = `
        <div>
          <div style="font-weight: 700; color: ${NAVY}; font-size: 12.5px;">${entry.start} – ${entry.end}</div>
          <div style="color: #64748b; font-size: 11px; margin-top: 3px; line-height: 1.5;">
            ${entry.client}<br>${entry.project} · ${entry.activity}
          </div>
        </div>
        <div style="color: ${ACCENT}; font-weight: 700; font-size: 11.5px;">${entry.duration}</div>
      `;
      entriesDiv.appendChild(card);
    });

    preview.style.display = 'block';

    const confirmBtn = document.getElementById('confirm-base');
    const ok = selectedBaseEntries.length > 0;
    confirmBtn.disabled = !ok;
    confirmBtn.style.cursor = ok ? 'pointer' : 'not-allowed';
    confirmBtn.style.background = ok ? ACCENT : '#cbd5e1';
  }

  document.getElementById('prev-month').onclick = () => {
    if (isAtMin(mainDate)) return;
    mainDate.setMonth(mainDate.getMonth() - 1);
    clampToMin(mainDate);
    renderMainCalendar();
  };
  document.getElementById('next-month').onclick = () => { mainDate.setMonth(mainDate.getMonth() + 1); renderMainCalendar(); };
  document.getElementById('clear-selection').onclick = () => { selectedDays.clear(); renderMainCalendar(); updateSelectedDisplay(); };

  document.getElementById('base-prev-month').onclick = () => {
    if (isAtMin(baseDate)) return;
    baseDate.setMonth(baseDate.getMonth() - 1);
    clampToMin(baseDate);
    renderBaseCalendar();
  };
  document.getElementById('base-next-month').onclick = () => { baseDate.setMonth(baseDate.getMonth() + 1); renderBaseCalendar(); };

  document.getElementById('load-button').onclick = () => {
    if (selectedDays.size === 0) return;
    selectedBaseDay = null;
    selectedBaseEntries = [];
    document.getElementById('base-day-preview').style.display = 'none';
    const confirmBtn = document.getElementById('confirm-base');
    confirmBtn.disabled = true;
    confirmBtn.style.background = '#cbd5e1';
    confirmBtn.style.cursor = 'not-allowed';
    renderBaseCalendar();
    document.getElementById('base-day-modal').style.display = 'flex';
  };

  document.getElementById('cancel-base').onclick = () => {
    document.getElementById('base-day-modal').style.display = 'none';
  };

  document.getElementById('confirm-base').onclick = async () => {
    if (!selectedBaseEntries.length) return;
    document.getElementById('base-day-modal').style.display = 'none';
    document.getElementById('progress').style.display = 'block';

    const log = document.getElementById('log');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const progressTime = document.getElementById('progress-time');

    let done = 0;
    let failed = 0;
    const total = selectedDays.size * selectedBaseEntries.length;
    const startTime = Date.now();

    for (const day of Array.from(selectedDays).sort((a, b) => a - b)) {
      for (const entry of selectedBaseEntries) {
        const fecha = `${day}/${mainDate.getMonth() + 1}/${mainDate.getFullYear()}`;
        const row = document.createElement('div');
        try {
          await duplicateEntry(entry.id, fecha);
          done++;
          row.innerHTML = `<span style="color:#16a34a;">OK</span>  ${fecha}  ${entry.start}-${entry.end}`;
        } catch (e) {
          failed++;
          row.innerHTML = `<span style="color:#dc2626;">ERROR</span>  ${fecha}  ${entry.start}-${entry.end} — ${e.message}`;
        }
        log.appendChild(row);
        log.scrollTop = log.scrollHeight;

        const processed = done + failed;
        const pct = Math.round((processed / total) * 100);
        progressBar.style.width = pct + '%';
        progressText.textContent = `${processed}/${total} procesadas (${done} ok, ${failed} error)`;
        const elapsed = (Date.now() - startTime) / 1000;
        const remaining = Math.round((total - processed) / (processed / elapsed));
        progressTime.textContent = isFinite(remaining) ? `${remaining}s restantes` : '';

        await new Promise(r => setTimeout(r, 350));
      }
    }

    const daysOk = Math.floor(done / selectedBaseEntries.length);
    document.getElementById('done-banner').style.display = 'block';
    document.getElementById('done-text').textContent = failed === 0
      ? `Listo — se cargaron ${daysOk} días correctamente`
      : `Se cargaron ${daysOk} días. ${failed} entradas fallaron, revisá el detalle arriba`;

    setTimeout(() => location.reload(), 3000);
  };

  renderMainCalendar();
  updateSelectedDisplay();
})();
