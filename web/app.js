/* AZ-900 Prep — plain JS, no build step. Data comes from data/questions.js + data/notes.js */
(() => {
  'use strict';

  const QUESTIONS = window.QUESTIONS || [];
  const NOTES = window.NOTES || [];
  const CURRICULUM = window.CURRICULUM || [];
  const BY_N = new Map(QUESTIONS.map(q => [q.n, q]));

  const DOMAINS = {
    concepts: { label: 'Cloud concepts', weight: '25–30%', examCount: 13 },
    architecture: { label: 'Architecture & services', weight: '35–40%', examCount: 17 },
    management: { label: 'Management & governance', weight: '30–35%', examCount: 15 },
  };
  const EXAM_MINUTES = 45;
  const PASS = 700;

  // ---------------------------------------------------------------- storage
  const KEY = 'az900.v1';
  const store = load();
  function load() {
    const empty = { ans: {}, flags: {}, exams: [], skills: {}, practice: null, exam: null, hist: [], activity: {} };
    try { return Object.assign(empty, JSON.parse(localStorage.getItem(KEY)) || {}); }
    catch { return empty; }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(store)); } catch { /* storage unavailable */ }
  }
  // local calendar day (not UTC) so a late-evening session counts for the right day
  const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  function record(n, ok) {
    const a = store.ans[n] || { tries: 0, okCount: 0 };
    a.tries++; if (ok) a.okCount++;
    a.ok = ok; a.at = Date.now();
    store.ans[n] = a;
    store.hist.push({ n, ok, at: a.at });
    if (store.hist.length > 2000) store.hist.splice(0, store.hist.length - 2000);
    const act = store.activity[dayKey()] = store.activity[dayKey()] || { answered: 0, correct: 0 };
    act.answered++; if (ok) act.correct++;
    save();
  }

  // ---------------------------------------------------------------- helpers
  const $ = (sel, el = document) => el.querySelector(sel);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const app = $('#app');
  const shuffle = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
  const letters = s => (s || '').replace(/[^A-Z]/g, '').split('');
  const sameSet = (a, b) => a.length === b.length && a.every(x => b.includes(x));
  const domainPill = d => `<span class="pill ${d}">${esc(DOMAINS[d]?.label || d)}</span>`;
  const fmtDate = ts => new Date(ts).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

  function parseHash() {
    const [path, qs] = location.hash.replace(/^#\/?/, '').split('?');
    return { view: path || 'learn', params: new URLSearchParams(qs || '') };
  }
  function go(hash) { if (location.hash === hash) route(); else location.hash = hash; }

  let keyHandler = null;
  let timerId = null;
  document.addEventListener('keydown', e => {
    if (e.target.matches('input, select, textarea') || e.metaKey || e.ctrlKey || e.altKey) return;
    if (keyHandler) keyHandler(e);
  });

  // ---------------------------------------------------------------- question rendering
  // collapse: interactive questions already show the image's content as controls, so tuck the image away
  function questionBody(q, collapse) {
    if (collapse) {
      const text = esc(q.text.replace(/\/\/IMG\/\//g, '').replace(/\n(Hot Area|Select and Place|Answer Area):?\s*$/i, '').trim());
      return `<p class="qtext">${text}</p>` + (q.qimg.length ? `<details style="margin:-6px 0 12px"><summary class="small">Show original question image</summary>${q.qimg.map(src => `<img class="qimg" src="${esc(src)}" alt="question image">`).join('')}</details>` : '');
    }
    const imgs = q.qimg.slice();
    let html = esc(q.text).replace(/\/\/IMG\/\//g, () => imgs.length ? `<img class="qimg" src="${esc(imgs.shift())}" alt="question image">` : '');
    html = `<p class="qtext">${html}</p>`;
    html += imgs.map(src => `<img class="qimg" src="${esc(src)}" alt="question image">`).join('');
    return html;
  }
  const IX_LABEL = { yesno: 'Yes / No', dropdown: 'Drop-down', match: 'Drag & drop', multiselect: 'Select all that apply' };

  function choicesHtml(q, selected, reveal) {
    const correct = letters(q.answer);
    return `<div class="choices">${Object.entries(q.choices).map(([k, v]) => {
      let cls = selected.includes(k) ? 'sel' : '';
      if (reveal) {
        if (correct.includes(k)) cls = 'correct';
        else if (selected.includes(k)) cls = 'wrong';
      }
      return `<div class="choice ${cls}" data-k="${k}"><span class="key">${k}</span><span>${esc(v)}</span></div>`;
    }).join('')}</div>`;
  }

  // ---- interactive (converted image) questions: q.ix = {kind, prompt, items|options+answers, confidence, note}
  const gradable = q => q.mc || !!q.ix;
  const ixEmpty = q => q.ix.kind === 'multiselect' ? [] : q.ix.items.map(() => null);
  function ixAnswered(q, sel) {
    if (!sel) return false;
    return q.ix.kind === 'multiselect' ? sel.length > 0 : sel.every(v => v !== null);
  }
  function ixScore(q, sel) {
    sel = sel || ixEmpty(q);
    if (q.ix.kind === 'multiselect') {
      const ans = q.ix.answers;
      const hit = sel.filter(o => ans.includes(o)).length, miss = sel.filter(o => !ans.includes(o)).length;
      return { got: Math.max(0, hit - miss), total: ans.length, ok: sameSet(sel, ans) };
    }
    const got = q.ix.items.filter((it, i) => sel[i] === it.answer).length;
    return { got, total: q.ix.items.length, ok: got === q.ix.items.length };
  }
  // fraction of points for a question (MC is all-or-nothing, ix gives partial credit like the real exam)
  function scoreOf(q, given) {
    if (q.ix) { const s = ixScore(q, given); return { frac: s.got / s.total, ok: s.ok }; }
    const ok = sameSet(given || [], letters(q.answer));
    return { frac: ok ? 1 : 0, ok };
  }
  function givenText(q, given) {
    if (!given || !given.length) return '—';
    if (q.mc) return given.join('');
    const s = ixScore(q, given);
    return `${s.got}/${s.total}`;
  }

  function ixHtml(q, sel, reveal) {
    const ix = q.ix;
    let html = ix.prompt ? `<div class="small muted" style="margin-bottom:8px">${esc(ix.prompt)}</div>` : '';
    if (ix.kind === 'multiselect') {
      html += `<div class="choices">${ix.options.map((o, i) => {
        const on = sel.includes(o), right = ix.answers.includes(o);
        let cls = on ? 'sel' : '';
        if (reveal) cls = right ? (on ? 'correct' : 'missed') : (on ? 'wrong' : '');
        return `<div class="choice ${cls}" data-o="${i}"><span class="key">${on ? '✓' : ''}</span><span>${esc(o)}</span></div>`;
      }).join('')}</div><div class="small muted">Select all that apply.</div>`;
      return html;
    }
    html += `<div class="ix">${ix.items.map((it, i) => {
      const v = sel[i];
      const mark = reveal ? (v === it.answer ? '<span class="ixmark ok">✓</span>' : `<span class="ixmark bad">✗ ${esc(it.answer)}</span>`) : '';
      if (ix.kind === 'yesno') {
        const btn = o => {
          let cls = v === o ? 'on' : '';
          if (reveal) cls = o === it.answer ? (v === o ? 'correct' : 'missed') : (v === o ? 'wrong' : '');
          return `<button class="yn ${cls}" data-i="${i}" data-v="${esc(o)}" ${reveal ? 'disabled' : ''}>${esc(o)}</button>`;
        };
        return `<div class="ixrow"><div class="ixlabel">${esc(it.label)}</div><div class="ixctl">${it.options.map(btn).join('')}${mark}</div></div>`;
      }
      const select = `<select data-i="${i}" ${reveal ? 'disabled' : ''} class="${reveal ? (v === it.answer ? 'correct' : 'wrong') : ''}">
        <option value="">— select —</option>${it.options.map(o => `<option ${v === o ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
      if (ix.kind === 'dropdown' && it.label.includes('___')) {
        const [a, ...b] = it.label.split('___');
        return `<div class="ixrow"><div class="ixlabel">${esc(a)}${select}${esc(b.join('___'))} ${mark}</div></div>`;
      }
      return `<div class="ixrow"><div class="ixlabel">${esc(it.label)}</div><div class="ixctl">${select}${mark}</div></div>`;
    }).join('')}</div>`;
    return html;
  }

  // wires ix controls; onChange(newSel) is called with a fresh selection array
  function bindIx(root, q, getSel, onChange) {
    root.querySelectorAll('.ix button.yn').forEach(b => b.onclick = () => {
      const s = getSel().slice(); s[+b.dataset.i] = b.dataset.v; onChange(s);
    });
    root.querySelectorAll('.ix select').forEach(el => el.onchange = () => {
      const s = getSel().slice(); s[+el.dataset.i] = el.value || null; onChange(s, true);
    });
    if (q.ix.kind === 'multiselect') root.querySelectorAll('.choice[data-o]').forEach(el => el.onclick = () => {
      const o = q.ix.options[+el.dataset.o]; const s = getSel();
      onChange(s.includes(o) ? s.filter(x => x !== o) : [...s, o]);
    });
  }

  function relatedNotes(q) {
    const stop = new Set('describe azure purpose with that this from your which what when following using about other their there these into each should company'.split(' '));
    const qt = (q.text + ' ' + Object.values(q.choices || {}).join(' ')).toLowerCase();
    const hits = [];
    NOTES.forEach(n => headings(n.md).forEach(h => {
      const words = h.text.toLowerCase().match(/[a-z]{4,}/g) || [];
      const sig = words.filter(w => !stop.has(w));
      const score = sig.filter(w => qt.includes(w)).length;
      if (score && score >= Math.min(2, sig.length)) hits.push({ note: n.id, h, score });
    }));
    return hits.sort((a, b) => b.score - a.score).slice(0, 3);
  }

  function explanation(q) {
    const site = letters(q.site), comm = q.community;
    let html = '';
    if (q.mc) {
      html += `<div class="small">Correct answer: <b>${esc(q.answer || '—')}</b>`;
      if (comm.length) html += ` · Community vote: ${comm.map(c => `${esc(c.ans)} (${c.pct}%)`).join(', ')}`;
      html += `</div>`;
      if (q.site && comm.length && !sameSet(site, letters(comm[0].ans))) {
        html += `<div class="warnbox">The site's suggested answer (${esc(q.site)}) differs from the community's top vote (${esc(comm[0].ans)}). Graded against the community vote — check the discussion below.</div>`;
      }
    }
    if (q.review_note) html += `<div class="warnbox">Possibly outdated: ${esc(q.review_note)}</div>`;
    if (q.ix?.note) html += `<div class="warnbox">${esc(q.ix.note)}</div>`;
    if (q.aimg.length) html += (q.ix ? '<div class="small muted" style="margin-top:10px">Official answer image:</div>' : '') + q.aimg.map(src => `<img class="qimg" src="${esc(src)}" alt="answer image">`).join('');
    if (q.desc) html += `<div class="desc small" style="margin-top:8px">${linkify(esc(q.desc))}</div>`;
    const rel = relatedNotes(q);
    if (rel.length) html += `<div class="small" style="margin-top:10px">📒 Your notes: ${rel.map(r => `<a href="#/notes?doc=${r.note}&h=${r.h.id}">${esc(r.h.text)}</a>`).join(' · ')}</div>`;
    if (q.comments?.length) {
      html += `<details><summary>Top community comments (${q.comments.length})</summary>${q.comments.map(c =>
        `<div class="comment"><div class="votes">▲ ${c.u}</div>${linkify(esc(c.c))}</div>`).join('')}</details>`;
    }
    return html;
  }
  const linkify = s => s.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');

  // ---------------------------------------------------------------- dashboard
  function viewDashboard() {
    const total = QUESTIONS.length;
    const seen = QUESTIONS.filter(q => store.ans[q.n]);
    const right = seen.filter(q => store.ans[q.n].ok).length;
    const flagged = Object.keys(store.flags).length;
    const lastExam = store.exams[store.exams.length - 1];

    const domainRows = Object.entries(DOMAINS).map(([d, info]) => {
      const qs = QUESTIONS.filter(q => q.domain === d);
      const s = qs.filter(q => store.ans[q.n]);
      const ok = s.filter(q => store.ans[q.n].ok).length;
      return `<div class="card">
        <div class="row">${domainPill(d)}<span class="spacer"></span><span class="small muted">exam weight ${info.weight}</span></div>
        <div class="small" style="margin-top:10px">Covered ${s.length}/${qs.length}</div>
        <div class="bar"><span style="width:${pct(s.length, qs.length)}%"></span></div>
        <div class="small">Accuracy ${s.length ? pct(ok, s.length) + '%' : '—'}</div>
        <div class="bar ok"><span style="width:${pct(ok, s.length)}%"></span></div>
        <div class="row" style="margin-top:10px">
          <a class="btn" href="#/practice?domain=${d}&status=unseen">Practice unseen</a>
          <a class="btn ghost" href="#/notes?doc=${d}">Notes</a>
        </div>
      </div>`;
    }).join('');

    app.innerHTML = `${planBanner()}
      <h1>AZ-900 Microsoft Azure Fundamentals</h1>
      <p class="sub">${total} exam questions from Examprepper · your Obsidian notes · official skills outline (July 2026). Pass mark ${PASS}/1000.</p>
      ${total ? '' : `<div class="card warnbox">No questions loaded yet — run <code>python3 build.py</code>.</div>`}
      <div class="grid">
        <div class="card stat"><div class="big">${seen.length}<span class="muted small"> / ${total}</span></div><div class="label">Questions attempted</div></div>
        <div class="card stat"><div class="big">${seen.length ? pct(right, seen.length) + '%' : '—'}</div><div class="label">Last-attempt accuracy</div></div>
        <div class="card stat"><div class="big">${lastExam ? lastExam.score : '—'}</div><div class="label">Last exam score ${lastExam ? (lastExam.score >= PASS ? '<span class="pill ok">pass</span>' : '<span class="pill bad">fail</span>') : ''}</div></div>
        <div class="card stat"><div class="big">${flagged}</div><div class="label">Flagged questions</div></div>
      </div>
      <div class="row" style="margin-top:16px">
        <a class="btn primary" href="#/practice">${store.practice ? 'Continue practice' : 'Start practice'}</a>
        <a class="btn" href="#/exam">${store.exam ? 'Resume exam' : 'Mock exam (45 min)'}</a>
        <a class="btn" href="#/practice?status=wrong">Retry mistakes</a>
      </div>
      <h2>By exam domain</h2>
      <div class="grid">${domainRows}</div>
      ${store.exams.length ? `<h2>Exam history</h2><div class="card"><table>
        <tr><th>Date</th><th>Score</th><th>Correct</th>${Object.values(DOMAINS).map(d => `<th>${esc(d.label)}</th>`).join('')}</tr>
        ${store.exams.slice().reverse().map(e => `<tr><td>${fmtDate(e.at)}</td><td><b>${e.score}</b> ${e.score >= PASS ? '<span class="pill ok">pass</span>' : '<span class="pill bad">fail</span>'}</td><td>${e.correct}/${e.total}</td>
          ${Object.keys(DOMAINS).map(d => `<td>${e.domains?.[d] ? pct(e.domains[d][0], e.domains[d][1]) + '%' : '—'}</td>`).join('')}</tr>`).join('')}
      </table></div>` : ''}
      <h2>Progress data</h2>
      <div class="row">
        <button class="btn" id="exportBtn">Export progress</button>
        <label class="btn">Import progress<input type="file" id="importFile" accept="application/json" hidden></label>
        <button class="btn ghost" id="resetBtn">Reset all progress</button>
      </div>`;

    $('#exportBtn').onclick = () => {
      const blob = new Blob([JSON.stringify(store, null, 2)], { type: 'application/json' });
      const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'az900-progress.json' });
      a.click(); URL.revokeObjectURL(a.href);
    };
    $('#importFile').onchange = async e => {
      const f = e.target.files[0]; if (!f) return;
      try { Object.assign(store, JSON.parse(await f.text())); save(); route(); }
      catch { alert('Could not read that file.'); }
    };
    $('#resetBtn').onclick = () => {
      if (!confirm('Delete all answers, flags, exam history, learning path progress and skill ratings? (Exam dates are kept.)')) return;
      Object.assign(store, { ans: {}, flags: {}, exams: [], skills: {}, practice: null, exam: null, hist: [], activity: {}, path: null }); save(); route();
    };
  }

  // ---------------------------------------------------------------- practice
  function filterQuestions(f) {
    return QUESTIONS.filter(q => {
      if (f.domain && f.domain !== 'all' && q.domain !== f.domain) return false;
      if (f.type === 'mc' && !q.mc) return false;
      if (f.type === 'visual' && q.mc) return false;
      const a = store.ans[q.n];
      if (f.status === 'unseen' && a) return false;
      if (f.status === 'wrong' && !(a && !a.ok)) return false;
      if (f.status === 'flagged' && !store.flags[q.n]) return false;
      return true;
    });
  }

  function startPractice(f) {
    let list = filterQuestions(f).map(q => q.n);
    if (f.order === 'random') list = shuffle(list);
    store.practice = { f, list, idx: 0 };
    save();
  }

  function viewPractice(params) {
    if (params.has('n')) {
      // single question deep-link (from review / exam results)
      const n = +params.get('n');
      store.practice = { f: { domain: 'all', status: 'all', type: 'all', order: 'seq' }, list: [n], idx: 0, single: true };
      save();
      history.replaceState(null, '', '#/practice');
    } else if (['domain', 'status', 'type', 'order'].some(k => params.has(k))) {
      startPractice({
        domain: params.get('domain') || 'all', status: params.get('status') || 'all',
        type: params.get('type') || 'all', order: params.get('order') || 'seq',
      });
      history.replaceState(null, '', '#/practice');
    }
    // rebuild when there is no set yet, or the question bank changed since it was saved
    if (store.practice) store.practice.list = store.practice.list.filter(n => BY_N.has(n));
    if (!store.practice || !store.practice.list.length) startPractice(store.practice?.f || { domain: 'all', status: 'all', type: 'all', order: 'seq' });
    const p = store.practice;
    const f = p.f;

    const opt = (name, val, label) => `<option value="${val}" ${f[name] === val ? 'selected' : ''}>${label}</option>`;
    app.innerHTML = `
      <div class="card" style="margin-bottom:16px">
        <div class="row">
          <label class="field">Domain<select id="fDomain">${opt('domain', 'all', 'All domains')}${Object.entries(DOMAINS).map(([k, d]) => opt('domain', k, d.label)).join('')}</select></label>
          <label class="field">Status<select id="fStatus">${opt('status', 'all', 'All')}${opt('status', 'unseen', 'Not attempted')}${opt('status', 'wrong', 'Last attempt wrong')}${opt('status', 'flagged', 'Flagged')}</select></label>
          <label class="field">Type<select id="fType">${opt('type', 'all', 'All')}${opt('type', 'mc', 'Multiple choice')}${opt('type', 'visual', 'Hotspot / drag & drop')}</select></label>
          <label class="field">Order<select id="fOrder">${opt('order', 'seq', 'Sequential')}${opt('order', 'random', 'Random')}</select></label>
          <label class="field">Jump to #<input type="number" id="jump" min="1" style="width:90px"></label>
          <span class="spacer"></span>
          <button class="btn primary" id="applyF">Start set</button>
        </div>
      </div>
      <div id="qwrap"></div>`;

    $('#applyF').onclick = () => {
      startPractice({ domain: $('#fDomain').value, status: $('#fStatus').value, type: $('#fType').value, order: $('#fOrder').value });
      renderPracticeQ();
    };
    $('#jump').onchange = e => {
      const i = p.list.indexOf(+e.target.value);
      if (i >= 0) { p.idx = i; save(); renderPracticeQ(); }
      else if (BY_N.has(+e.target.value)) { go(`#/practice?n=${+e.target.value}`); }
    };
    renderPracticeQ();
  }

  function renderPracticeQ() {
    const p = store.practice;
    const wrap = $('#qwrap');
    if (!p.list.length) {
      wrap.innerHTML = `<div class="card">No questions match this filter. 🎉</div>`;
      keyHandler = null; return;
    }
    p.idx = Math.max(0, Math.min(p.idx, p.list.length - 1));
    const q = BY_N.get(p.list[p.idx]);
    const prev = store.ans[q.n];
    let selected = [];
    let checked = false;
    const need = letters(q.answer).length || 1;
    let ixSel = q.ix ? ixEmpty(q) : null;
    const ready = () => q.ix ? ixAnswered(q, ixSel) : selected.length >= need;

    function draw() {
      wrap.innerHTML = `
        <div class="card ${checked ? 'locked' : ''}">
          <div class="qhead">
            <b>Question ${q.n}</b> ${domainPill(q.domain)}
            ${q.mc ? '' : q.ix ? `<span class="pill">${esc(IX_LABEL[q.ix.kind])}</span>` : '<span class="pill">Hotspot / drag & drop · self-graded</span>'}
            ${prev ? `<span class="pill ${prev.ok ? 'ok' : 'bad'}">last: ${prev.ok ? 'correct' : 'wrong'} (${prev.okCount}/${prev.tries})</span>` : ''}
            <span class="spacer"></span>
            <span class="small muted">${p.idx + 1} / ${p.list.length}</span>
            <button class="btn ghost" id="flagBtn" title="Flag (F)">${store.flags[q.n] ? '🚩 Flagged' : '⚑ Flag'}</button>
          </div>
          ${questionBody(q, !!q.ix)}
          ${q.mc ? choicesHtml(q, selected, checked) + (need > 1 && !checked ? `<div class="small muted">Select ${need} answers.</div>` : '') : ''}
          ${q.ix ? ixHtml(q, ixSel, checked) : ''}
          <div id="fb"></div>
          <div class="qnav">
            <button class="btn" id="prevBtn" ${p.idx === 0 ? 'disabled' : ''}>← Prev</button>
            ${gradable(q)
              ? `<button class="btn primary" id="checkBtn" ${checked || !ready() ? 'disabled' : ''}>Check</button>`
              : (checked ? '' : `<button class="btn primary" id="revealBtn">Reveal answer</button>`)}
            <button class="btn" id="nextBtn" ${p.idx >= p.list.length - 1 ? 'disabled' : ''}>Next →</button>
            <span class="spacer"></span>
            <span class="kbd"><kbd>A</kbd>–<kbd>F</kbd> select · <kbd>Enter</kbd> check/next · <kbd>←</kbd><kbd>→</kbd> · <kbd>F</kbd> flag</span>
          </div>
        </div>`;

      if (checked) {
        const fb = $('#fb');
        if (q.mc) {
          const ok = sameSet(selected, letters(q.answer));
          fb.innerHTML = `<div class="feedback ${ok ? 'ok' : 'bad'}"><div class="title">${ok ? '✓ Correct' : '✗ Incorrect'}</div>${explanation(q)}</div>`;
        } else if (q.ix) {
          const sc = ixScore(q, ixSel);
          fb.innerHTML = `<div class="feedback ${sc.ok ? 'ok' : 'bad'}"><div class="title">${sc.ok ? '✓ Correct' : `✗ ${sc.got} of ${sc.total} correct`}</div>${explanation(q)}</div>`;
        } else {
          fb.innerHTML = `<div class="feedback"><div class="title">Answer</div>${explanation(q)}
            <div class="row" style="margin-top:12px"><span class="small">How did you do?</span>
              <button class="btn ok" id="selfOk">I got it right</button><button class="btn bad" id="selfBad">I got it wrong</button></div></div>`;
          $('#selfOk').onclick = () => { record(q.n, true); next(); };
          $('#selfBad').onclick = () => { record(q.n, false); next(); };
        }
      }

      if (q.mc) wrap.querySelectorAll('.choice').forEach(el => el.onclick = () => toggle(el.dataset.k));
      if (q.ix && !checked) bindIx(wrap, q, () => ixSel, (s, quiet) => {
        ixSel = s;
        if (quiet) { const cb = $('#checkBtn'); if (cb) cb.disabled = !ready(); } else draw();
      });
      $('#flagBtn').onclick = flag;
      $('#prevBtn').onclick = () => { p.idx--; save(); renderPracticeQ(); };
      $('#nextBtn').onclick = next;
      const cb = $('#checkBtn'); if (cb) cb.onclick = check;
      const rb = $('#revealBtn'); if (rb) rb.onclick = () => { checked = true; draw(); };
    }

    function toggle(k) {
      if (checked || !q.mc) return;
      if (need === 1) selected = [k];
      else selected = selected.includes(k) ? selected.filter(x => x !== k) : [...selected, k];
      draw();
    }
    function check() {
      if (!ready() || checked) return;
      checked = true;
      record(q.n, q.ix ? ixScore(q, ixSel).ok : sameSet(selected, letters(q.answer)));
      draw();
    }
    function next() {
      if (p.idx < p.list.length - 1) { p.idx++; save(); renderPracticeQ(); }
      else if (checked) { wrap.insertAdjacentHTML('beforeend', `<div class="card" style="margin-top:12px">End of this set. <a href="#/dashboard">Back to dashboard</a></div>`); }
    }
    function flag() {
      if (store.flags[q.n]) delete store.flags[q.n]; else store.flags[q.n] = 1;
      save(); draw();
    }

    keyHandler = e => {
      const k = e.key.toUpperCase();
      if (q.mc && q.choices) {
        const keys = Object.keys(q.choices);
        if (keys.includes(k) && k !== 'F') return toggle(k);
        if (/^[1-9]$/.test(e.key) && keys[+e.key - 1]) return toggle(keys[+e.key - 1]);
      }
      if (k === 'F') return flag();
      if (e.key === 'ArrowRight') return next();
      if (e.key === 'ArrowLeft' && p.idx > 0) { p.idx--; save(); return renderPracticeQ(); }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (!checked) { if (gradable(q)) check(); else { checked = true; draw(); } }
        else if (gradable(q)) next();
      }
    };
    draw();
    window.scrollTo({ top: 0 });
  }

  // ---------------------------------------------------------------- exam
  function newExam() {
    const pick = [];
    for (const [d, info] of Object.entries(DOMAINS)) {
      pick.push(...shuffle(QUESTIONS.filter(q => q.domain === d && gradable(q))).slice(0, info.examCount).map(q => q.n));
    }
    store.exam = { list: shuffle(pick), answers: {}, flags: {}, idx: 0, ends: Date.now() + EXAM_MINUTES * 60000, started: Date.now() };
    save();
  }

  function viewExam(params) {
    clearInterval(timerId);
    if (params.get('result') !== null && params.has('result')) return viewExamResult(+params.get('result'));
    if (!store.exam) {
      const mcCount = QUESTIONS.filter(gradable).length;
      app.innerHTML = `
        <h1>Mock exam</h1>
        <p class="sub">${Object.values(DOMAINS).reduce((s, d) => s + d.examCount, 0)} questions (multiple choice, Yes/No, drop-down, drag & drop), weighted like the real exam, ${EXAM_MINUTES} minutes. No feedback until you submit. Score scaled to 1000, pass at ${PASS}.</p>
        <div class="card">
          <ul>${Object.values(DOMAINS).map(d => `<li>${esc(d.label)} — ${d.examCount} questions (${d.weight})</li>`).join('')}</ul>
          <p class="small muted">Drawn at random from ${mcCount} auto-graded questions. Multi-part questions earn partial credit, like the real exam.</p>
          <button class="btn primary" id="startExam" ${mcCount ? '' : 'disabled'}>Start exam</button>
        </div>`;
      $('#startExam').onclick = () => { newExam(); viewExam(new URLSearchParams()); };
      keyHandler = null;
      return;
    }
    renderExamQ();
    timerId = setInterval(tick, 1000);
  }

  function tick() {
    const ex = store.exam; const t = $('#timer');
    if (!ex || !t) return clearInterval(timerId);
    const left = Math.max(0, ex.ends - Date.now());
    const m = Math.floor(left / 60000), s = Math.floor(left / 1000) % 60;
    t.textContent = `${m}:${String(s).padStart(2, '0')}`;
    t.classList.toggle('low', left < 5 * 60000);
    if (!left) submitExam();
  }

  function renderExamQ() {
    const ex = store.exam;
    const q = BY_N.get(ex.list[ex.idx]);
    const sel = ex.answers[q.n] || (q.ix ? ixEmpty(q) : []);
    const need = letters(q.answer).length || 1;
    const isDone = n => { const qq = BY_N.get(n), a = ex.answers[n]; return qq.ix ? ixAnswered(qq, a) : !!a?.length; };
    app.innerHTML = `
      <div class="card">
        <div class="qhead">
          <b>Question ${ex.idx + 1} of ${ex.list.length}</b>
          <span class="spacer"></span>
          <span class="timer" id="timer"></span>
          <button class="btn ghost" id="eflag">${ex.flags[q.n] ? '🚩 Marked' : '⚑ Mark for review'}</button>
          <button class="btn" id="submitBtn">Submit exam</button>
        </div>
        ${questionBody(q, !!q.ix)}
        ${q.ix ? ixHtml(q, sel, false) : choicesHtml(q, sel, false) + (need > 1 ? `<div class="small muted">Select ${need} answers.</div>` : '')}
        <div class="qnav">
          <button class="btn" id="eprev" ${ex.idx === 0 ? 'disabled' : ''}>← Prev</button>
          <button class="btn primary" id="enext" ${ex.idx >= ex.list.length - 1 ? 'disabled' : ''}>Next →</button>
          <span class="spacer"></span>
          <span class="small muted">${ex.list.filter(isDone).length} answered</span>
        </div>
        <div class="palette">${ex.list.map((n, i) => `<button data-i="${i}" class="${isDone(n) ? 'done' : ''} ${ex.flags[n] ? 'flag' : ''} ${i === ex.idx ? 'cur' : ''}">${i + 1}</button>`).join('')}</div>
      </div>`;
    tick();

    const toggle = k => {
      let s = ex.answers[q.n] || [];
      s = need === 1 ? [k] : (s.includes(k) ? s.filter(x => x !== k) : [...s, k]);
      ex.answers[q.n] = s; save(); renderExamQ();
    };
    const move = i => { if (i >= 0 && i < ex.list.length) { ex.idx = i; save(); renderExamQ(); } };
    if (q.ix) bindIx(app, q, () => ex.answers[q.n] || ixEmpty(q), s => { ex.answers[q.n] = s; save(); renderExamQ(); });
    else app.querySelectorAll('.choice').forEach(el => el.onclick = () => toggle(el.dataset.k));
    app.querySelectorAll('.palette button').forEach(b => b.onclick = () => move(+b.dataset.i));
    $('#eprev').onclick = () => move(ex.idx - 1);
    $('#enext').onclick = () => move(ex.idx + 1);
    $('#eflag').onclick = () => { if (ex.flags[q.n]) delete ex.flags[q.n]; else ex.flags[q.n] = 1; save(); renderExamQ(); };
    $('#submitBtn').onclick = () => {
      const open = ex.list.length - ex.list.filter(isDone).length;
      if (confirm(open ? `${open} question(s) unanswered. Submit anyway?` : 'Submit exam?')) submitExam();
    };
    keyHandler = e => {
      const k = e.key.toUpperCase(); const keys = q.mc ? Object.keys(q.choices) : [];
      if (keys.includes(k)) return toggle(k);
      if (/^[1-9]$/.test(e.key) && keys[+e.key - 1]) return toggle(keys[+e.key - 1]);
      if (e.key === 'ArrowRight' || e.key === 'Enter') return move(ex.idx + 1);
      if (e.key === 'ArrowLeft') return move(ex.idx - 1);
    };
  }

  function submitExam() {
    clearInterval(timerId);
    const ex = store.exam; if (!ex) return;
    const domains = {};
    let correct = 0, points = 0;
    const items = ex.list.map(n => {
      const q = BY_N.get(n);
      const given = ex.answers[n] || [];
      const { frac, ok } = scoreOf(q, given);
      if (ok) correct++;
      points += frac;
      domains[q.domain] = domains[q.domain] || [0, 0];
      domains[q.domain][1]++; domains[q.domain][0] += frac;
      record(n, ok);
      return { n, given: givenText(q, given), ok };
    });
    store.exams.push({
      at: Date.now(), total: ex.list.length, correct, domains, items,
      score: Math.round(points / ex.list.length * 1000), minutes: Math.round((Date.now() - ex.started) / 60000),
    });
    store.exam = null; save();
    go(`#/exam?result=${store.exams.length - 1}`);
  }

  function viewExamResult(i) {
    const e = store.exams[i];
    if (!e) return go('#/exam');
    keyHandler = null;
    const pass = e.score >= PASS;
    app.innerHTML = `
      <h1>Exam result</h1>
      <p class="sub">${fmtDate(e.at)} · ${e.minutes} min</p>
      <div class="grid">
        <div class="card stat"><div class="big" style="color:var(${pass ? '--ok' : '--bad'})">${e.score}</div><div class="label">Score (pass ${PASS}) ${pass ? '<span class="pill ok">PASS</span>' : '<span class="pill bad">FAIL</span>'}</div></div>
        <div class="card stat"><div class="big">${e.correct}/${e.total}</div><div class="label">Correct</div></div>
        ${Object.entries(DOMAINS).map(([d, info]) => `<div class="card stat"><div class="big">${e.domains[d] ? pct(e.domains[d][0], e.domains[d][1]) + '%' : '—'}</div><div class="label">${esc(info.label)}</div></div>`).join('')}
      </div>
      <h2>Answers</h2>
      <div class="card"><table>
        <tr><th>#</th><th>Question</th><th>Domain</th><th>Yours</th><th>Correct</th></tr>
        ${e.items.map((it, k) => { const q = BY_N.get(it.n); return `<tr class="click" data-n="${it.n}">
          <td>${k + 1}</td><td>${esc(q.text.replace(/\/\/IMG\/\//g, '').slice(0, 110))}…</td><td>${domainPill(q.domain)}</td>
          <td><span class="pill ${it.ok ? 'ok' : 'bad'}">${esc(it.given || '—')}</span></td><td>${esc(q.mc ? q.answer : q.ix ? 'see question' : '')}</td></tr>`; }).join('')}
      </table></div>
      <div class="row" style="margin-top:16px"><a class="btn primary" href="#/exam">New exam</a><a class="btn" href="#/practice?status=wrong">Practice mistakes</a></div>`;
    app.querySelectorAll('tr.click').forEach(tr => tr.onclick = () => go(`#/practice?n=${tr.dataset.n}`));
  }

  // ---------------------------------------------------------------- review
  function viewReview() {
    keyHandler = null;
    const wrong = QUESTIONS.filter(q => store.ans[q.n] && !store.ans[q.n].ok);
    const flagged = QUESTIONS.filter(q => store.flags[q.n]);
    const shaky = QUESTIONS.filter(q => { const a = store.ans[q.n]; return a && a.ok && a.okCount < a.tries; });
    const table = (list, empty) => list.length ? `<div class="card"><table>
      <tr><th>#</th><th>Question</th><th>Domain</th><th>Record</th></tr>
      ${list.map(q => { const a = store.ans[q.n]; return `<tr class="click" data-n="${q.n}"><td>${q.n}</td>
        <td>${esc(q.text.replace(/\/\/IMG\/\//g, '').slice(0, 120))}…</td><td>${domainPill(q.domain)}</td>
        <td class="small">${a ? `${a.okCount}/${a.tries} correct` : '—'}</td></tr>`; }).join('')}
    </table></div>` : `<div class="card muted">${empty}</div>`;

    app.innerHTML = `
      <h1>Review</h1>
      <p class="sub">Questions to revisit. Click a row to open it.</p>
      <div class="row"><a class="btn primary" href="#/practice?status=wrong&order=random">Drill wrong answers (${wrong.length})</a>
        <a class="btn" href="#/practice?status=flagged">Drill flagged (${flagged.length})</a></div>
      <h2>Last attempt wrong (${wrong.length})</h2>${table(wrong, 'Nothing wrong yet.')}
      <h2>Flagged (${flagged.length})</h2>${table(flagged, 'No flags.')}
      <h2>Correct now, but missed before (${shaky.length})</h2>${table(shaky, 'None.')}`;
    app.querySelectorAll('tr.click').forEach(tr => tr.onclick = () => go(`#/practice?n=${tr.dataset.n}`));
  }

  // ---------------------------------------------------------------- notes (mini markdown)
  const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  function headings(md) {
    const out = [];
    md.split('\n').forEach(l => { const m = l.match(/^(#{1,3})\s+(.+)/); if (m) out.push({ level: m[1].length, text: m[2].trim(), id: slug(m[2]) }); });
    return out;
  }

  function inline(s) {
    s = esc(s);
    s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy">');
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    s = s.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, a, b) => `<b>${b || a}</b>`);
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
    s = s.replace(/==([^=]+)==/g, '<mark>$1</mark>');
    s = s.replace(/(^|\s)#([a-zA-Z][\w-]*)/g, '$1<span class="tag">#$2</span>');
    s = s.replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, '$1<a href="$2" target="_blank" rel="noopener">$2</a>');
    return s;
  }

  function renderMd(md) {
    const lines = md.replace(/\r/g, '').split('\n');
    let html = '', i = 0;
    const listStack = [];
    const closeLists = (to = 0) => { while (listStack.length > to) html += `</${listStack.pop().tag}>`; };
    while (i < lines.length) {
      const line = lines[i];
      if (/^```/.test(line)) {
        closeLists(); const buf = []; i++;
        while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
        html += `<pre><code>${esc(buf.join('\n'))}</code></pre>`; i++; continue;
      }
      const h = line.match(/^(#{1,4})\s+(.+)/);
      if (h) { closeLists(); html += `<h${h[1].length} id="${slug(h[2])}">${inline(h[2])}</h${h[1].length}>`; i++; continue; }
      if (/^\s*\|.*\|\s*$/.test(line) && /^\s*\|?[\s:-]+\|/.test(lines[i + 1] || '')) {
        closeLists();
        const row = l => l.trim().replace(/^\||\|$/g, '').split('|').map(c => inline(c.trim()));
        html += `<table><tr>${row(line).map(c => `<th>${c}</th>`).join('')}</tr>`;
        i += 2;
        while (i < lines.length && /^\s*\|/.test(lines[i])) html += `<tr>${row(lines[i++]).map(c => `<td>${c}</td>`).join('')}</tr>`;
        html += '</table>'; continue;
      }
      if (/^\s*>/.test(line)) {
        closeLists(); const buf = [];
        while (i < lines.length && /^\s*>/.test(lines[i])) buf.push(lines[i++].replace(/^\s*>\s?/, '').replace(/^\[!(\w+)\]\s*/, (_, t) => `<b>${t}</b> `));
        html += `<blockquote>${buf.map(b => b.startsWith('<b>') ? b.replace(/^(<b>\w+<\/b> )(.*)$/, (_, a, r) => a + inline(r)) : inline(b)).join('<br>')}</blockquote>`; continue;
      }
      const li = line.match(/^(\s*)([-*+]|\d+[.)])\s+(.*)/);
      if (li) {
        const depth = Math.floor(li[1].replace(/\t/g, '    ').length / 2) + 1;
        const tag = /\d/.test(li[2]) ? 'ol' : 'ul';
        while (listStack.length > depth) html += `</${listStack.pop().tag}>`;
        while (listStack.length < depth) { listStack.push({ tag }); html += `<${tag}>`; }
        html += `<li>${inline(li[3])}</li>`; i++; continue;
      }
      if (!line.trim()) { closeLists(); i++; continue; }
      if (/^(-{3,}|\*{3,})$/.test(line.trim())) { closeLists(); html += '<hr>'; i++; continue; }
      if (/^\s+\S/.test(line) && listStack.length) { html += `<div style="margin-left:${listStack.length * 1.2}em">${inline(line.trim())}</div>`; i++; continue; }
      closeLists();
      html += `<p>${inline(line)}</p>`; i++;
    }
    closeLists();
    return html;
  }

  function viewNotes(params) {
    keyHandler = null;
    const docId = params.get('doc') || NOTES[0]?.id;
    const query = (params.get('q') || '').trim();
    const doc = NOTES.find(n => n.id === docId) || NOTES[0];
    if (!doc) { app.innerHTML = '<div class="card">No notes found. Run <code>python3 build.py</code>.</div>'; return; }

    let body;
    if (query) {
      const re = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'ig');
      const hits = [];
      NOTES.forEach(n => {
        let cur = { text: n.title, id: '' };
        n.md.split('\n').forEach(l => {
          const h = l.match(/^#{1,3}\s+(.+)/); if (h) cur = { text: h[1], id: slug(h[1]) };
          if (re.test(l)) hits.push({ n, cur, l });
          re.lastIndex = 0;
        });
      });
      body = `<h1>Search: “${esc(query)}”</h1><p class="muted">${hits.length} matching lines</p>` + hits.slice(0, 200).map(h =>
        `<div class="comment"><a href="#/notes?doc=${h.n.id}&h=${h.cur.id}">${esc(h.n.title)} › ${esc(h.cur.text)}</a><br>${esc(h.l.trim()).replace(re, m => `<mark>${m}</mark>`)}</div>`).join('');
    } else {
      body = `<div class="md">${renderMd(doc.md)}</div>`;
    }

    app.innerHTML = `
      <div class="notes-layout">
        <aside class="notes-side card">
          <input type="search" id="nq" placeholder="Search notes…" value="${esc(query)}" style="width:100%">
          ${NOTES.map(n => `<a class="doc ${n.id === doc.id && !query ? 'active' : ''}" href="#/notes?doc=${n.id}">${esc(n.title)}</a>
            ${n.id === doc.id && !query ? headings(n.md).filter(h => h.level <= 2).map(h => `<a class="h" href="#/notes?doc=${n.id}&h=${h.id}">${esc(h.text)}</a>`).join('') : ''}`).join('')}
          ${DOMAINS[doc.id] ? `<div style="margin-top:14px"><a class="btn" href="#/practice?domain=${doc.id}&order=random">Practice this domain</a></div>` : ''}
        </aside>
        <article class="card">${body}</article>
      </div>`;
    $('#nq').onkeydown = e => { if (e.key === 'Enter') go(`#/notes?doc=${doc.id}&q=${encodeURIComponent(e.target.value)}`); };
    const target = params.get('h') && document.getElementById(params.get('h'));
    if (target) target.scrollIntoView(); else window.scrollTo({ top: 0 });
  }

  // ---------------------------------------------------------------- official guide
  const LEARN = 'https://learn.microsoft.com/en-us/';

  const SKILLS = Object.keys(DOMAINS).map(d => ({ d, path: (CURRICULUM.find(u => u.domain === d) || {}).path || '',
    groups: CURRICULUM.filter(u => u.domain === d).map(u => [u.title, u.skills.map(s => s.name)]) }));

  function viewOfficial() {
    keyHandler = null;
    const levels = ['Weak', 'OK', 'Strong'];
    const all = SKILLS.flatMap(s => s.groups.flatMap(g => g[1]));
    const rated = all.filter(k => store.skills[k] !== undefined);
    const strong = all.filter(k => store.skills[k] === 2).length;
    app.innerHTML = `
      <h1>Official skills outline</h1>
      <p class="sub">From the Microsoft Learn AZ-900 study guide (skills measured as of July 20, 2026). Rate yourself per skill — ${rated.length}/${all.length} rated, ${strong} strong.</p>
      <div class="grid" style="margin-bottom:8px">
        <div class="card"><ul class="linklist">
          <li><a href="${LEARN}credentials/certifications/resources/study-guides/az-900" target="_blank" rel="noopener">AZ-900 study guide</a> <span class="small muted">skills measured & change log</span></li>
          <li><a href="${LEARN}credentials/certifications/azure-fundamentals/" target="_blank" rel="noopener">Certification page</a> <span class="small muted">schedule exam</span></li>
          <li><a href="${LEARN}credentials/certifications/exams/az-900/practice/assessment?assessment-type=practice&assessmentId=23" target="_blank" rel="noopener">Free official practice assessment</a></li>
          <li><a href="https://aka.ms/examdemo" target="_blank" rel="noopener">Exam sandbox</a> <span class="small muted">try the exam UI</span></li>
          <li><a href="${LEARN}shows/exam-readiness-zone/" target="_blank" rel="noopener">Exam Readiness Zone videos</a></li>
        </ul></div>
      </div>
      ${SKILLS.map(s => `
        <h2>${esc(DOMAINS[s.d].label)} <span class="small muted">(${DOMAINS[s.d].weight})</span></h2>
        <div class="card">
          <div class="row" style="margin-bottom:10px">
            <a class="btn" href="${LEARN}${s.path}" target="_blank" rel="noopener">Microsoft Learn path ↗</a>
            <a class="btn" href="#/notes?doc=${s.d}">My notes</a>
            <a class="btn" href="#/practice?domain=${s.d}&order=random">Practice questions</a>
          </div>
          ${s.groups.map(([g, items]) => `<div class="skill-group"><b>${esc(g)}</b>
            ${items.map(it => `<div class="skill"><span class="name">${esc(it)}</span>
              <a class="small" href="#/notes?q=${encodeURIComponent(searchTerm(it))}">notes</a>
              <span class="conf">${levels.map((l, v) => `<button data-k="${esc(it)}" data-v="${v}" class="c${v} ${store.skills[it] === v ? 'on' : ''}">${l}</button>`).join(' ')}</span></div>`).join('')}
          </div>`).join('')}
        </div>`).join('')}`;
    app.querySelectorAll('.conf button').forEach(b => b.onclick = () => {
      const k = b.dataset.k, v = +b.dataset.v;
      if (store.skills[k] === v) delete store.skills[k]; else store.skills[k] = v;
      save(); viewOfficial();
    });
  }
  function searchTerm(skill) {
    const m = skill.match(/\(([^)]+)\)/);
    if (m && m[1].length <= 6) return m[1];
    return skill.replace(/^(Describe|Define|Compare|Identify|Purpose of)\s+(the\s+)?/i, '').split(/[,:]/)[0].replace(/\b(options|types|benefits)\b/gi, '').trim().split(' ').slice(0, 3).join(' ');
  }

  // ---------------------------------------------------------------- learning path (Duolingo-style)
  // Units = official skill groups, lessons = skills. Lesson quizzes only use real exam questions tagged to the skill.
  const LESSON_SIZE = 6, TEST_SIZE = 10, PASS_PCT = 80, MAX_LEVEL = 3, DAILY_GOAL = 50;
  const UNIT_ICON = { concepts: '☁️', architecture: '🏗️', management: '🧭', extra: '🗄️' };
  const path = () => (store.path = store.path || { lessons: {}, units: {}, xp: 0, days: {}, unlockAll: false });
  const today = () => dayKey();
  const skillQs = id => QUESTIONS.filter(q => q.skill === id && gradable(q));
  const unitQs = u => u.skills.flatMap(s => skillQs(s.id));
  const lessonState = id => path().lessons[id] || { level: 0, best: 0, seen: [] };

  function addXp(n) {
    const p = path(); p.xp += n; p.days[today()] = (p.days[today()] || 0) + n; save();
  }
  function streak() {
    const days = path().days; const d = new Date(); let s = 0;
    if (!days[today()]) d.setDate(d.getDate() - 1); // streak still alive until today ends
    while (days[dayKey(d)]) { s++; d.setDate(d.getDate() - 1); }
    return s;
  }
  const unitPassed = u => !!path().units[u.id]?.passed;
  function unitUnlocked(i) {
    return path().unlockAll || i === 0 || unitPassed(CURRICULUM[i - 1]) || unitPassed(CURRICULUM[i]);
  }
  function lessonUnlocked(ui, si) {
    if (!unitUnlocked(ui)) return false;
    if (si === 0 || path().unlockAll || unitPassed(CURRICULUM[ui])) return true;
    return lessonState(CURRICULUM[ui].skills[si - 1].id).level > 0;
  }
  const unitTestReady = ui => CURRICULUM[ui].skills.every(s => lessonState(s.id).level > 0);

  // prefer questions not yet seen in this lesson, then ones answered wrong, then the rest
  function pickQuestions(pool, seen, size) {
    const rank = q => (seen.includes(q.n) ? 2 : 0) + (store.ans[q.n] && !store.ans[q.n].ok ? -1 : 0);
    return shuffle(pool).sort((a, b) => rank(a) - rank(b)).slice(0, size);
  }

  function noteSection(doc, h) {
    const note = NOTES.find(n => n.id === doc); if (!note) return null;
    const lines = note.md.split('\n'); let start = -1, level = 0;
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(/^(#{1,4})\s+(.+)/);
      if (!m) continue;
      if (start < 0 && slug(m[2]) === h) { start = i; level = m[1].length; }
      else if (start >= 0 && m[1].length <= level) return { title: note.title, md: lines.slice(start, i).join('\n') };
    }
    return start >= 0 ? { title: note.title, md: lines.slice(start).join('\n') } : null;
  }

  function viewLearn() {
    keyHandler = null;
    const p = path();
    const s = streak(), todayXp = p.days[today()] || 0;
    let current = null; // first available, unfinished lesson → gets the START bubble
    CURRICULUM.forEach((u, ui) => u.skills.forEach((sk, si) => {
      if (!current && lessonUnlocked(ui, si) && lessonState(sk.id).level === 0) current = sk.id;
    }));
    const offsets = [0, 55, 85, 55, 0, -55, -85, -55];

    app.innerHTML = `${planBanner()}
      <div class="learn-top">
        <div class="lstat" title="Day streak">🔥 <b>${s}</b> day${s === 1 ? '' : 's'}</div>
        <div class="lstat" title="Total XP">⚡ <b>${p.xp}</b> XP</div>
        <div class="lstat goal" title="Daily goal"><span>Today ${todayXp}/${DAILY_GOAL} XP</span><div class="bar ok"><span style="width:${Math.min(100, pct(todayXp, DAILY_GOAL))}%"></span></div></div>
        <span class="spacer"></span>
        <label class="small muted"><input type="checkbox" id="unlockAll" ${p.unlockAll ? 'checked' : ''}> Unlock everything</label>
      </div>
      <div class="path">
        ${CURRICULUM.map((u, ui) => {
          const unlocked = unitUnlocked(ui);
          const done = u.skills.filter(sk => lessonState(sk.id).level > 0).length;
          let k = 0;
          const nodes = u.skills.map((sk, si) => {
            const st = lessonState(sk.id), open = lessonUnlocked(ui, si), n = skillQs(sk.id).length;
            const cls = !open ? 'locked' : st.level >= MAX_LEVEL ? 'gold' : st.level > 0 ? 'done' : 'open';
            const icon = !open ? '🔒' : st.level > 0 ? '★' : n ? '▶' : '📖';
            return `<div class="node-wrap" style="transform:translateX(${offsets[k++ % offsets.length]}px)">
              ${sk.id === current ? '<div class="bubble">START</div>' : ''}
              <button class="node ${cls}" data-skill="${sk.id}" ${open ? '' : 'disabled'} title="${esc(sk.name)}">${icon}</button>
              <div class="levels">${[1, 2, 3].map(l => `<i class="${st.level >= l ? 'on' : ''}"></i>`).join('')}</div>
              <div class="node-label">${esc(sk.name)}<span class="muted"> · ${n} Q</span></div>
            </div>`;
          }).join('');
          const ready = unitTestReady(ui), passed = unitPassed(u);
          const test = `<div class="node-wrap"><button class="node test ${passed ? 'gold' : unlocked && ready ? 'open' : 'locked'}" data-test="${u.id}">🏆</button>
            <div class="node-label"><b>${passed ? 'Unit test passed' : unlocked && ready ? 'Unit test' : 'Unit test · jump here'}</b><span class="muted"> · ${Math.min(TEST_SIZE, unitQs(u).length)} Q</span></div></div>`;
          return `<section class="unit ${u.domain} ${unlocked ? '' : 'locked'}">
            <div class="unit-head">
              <div><div class="small">${UNIT_ICON[u.domain] || ''} Unit ${ui + 1} · ${esc(DOMAINS[u.domain]?.label || 'Extra')}</div><h2>${esc(u.title)}</h2></div>
              <div class="unit-prog">${done}/${u.skills.length}</div>
            </div>
            <div class="nodes">${nodes}${test}</div>
          </section>`;
        }).join('')}
      </div>`;

    $('#unlockAll').onchange = e => { path().unlockAll = e.target.checked; save(); viewLearn(); };
    app.querySelectorAll('.node[data-skill]').forEach(b => b.onclick = () => go(`#/lesson?skill=${b.dataset.skill}`));
    app.querySelectorAll('.node[data-test]').forEach(b => b.onclick = () => {
      const ui = CURRICULUM.findIndex(u => u.id === b.dataset.test);
      if (!(unitUnlocked(ui) && unitTestReady(ui)) && !unitPassed(CURRICULUM[ui]) &&
        !confirm('Jump ahead? Pass this unit test to unlock the whole unit.')) return;
      go(`#/lesson?test=${b.dataset.test}`);
    });
    const cur = app.querySelector('.bubble'); if (cur) cur.scrollIntoView({ block: 'center' });
  }

  function viewLesson(params) {
    const p = path();
    const testUnit = CURRICULUM.find(u => u.id === params.get('test'));
    let skill = null, unit = testUnit;
    CURRICULUM.forEach(u => u.skills.forEach(s => { if (s.id === params.get('skill')) { skill = s; unit = u; } }));
    if (!unit) return go('#/learn');
    const isTest = !!testUnit;
    const st = skill ? lessonState(skill.id) : null;
    const pool = isTest ? unitQs(unit) : skillQs(skill.id);
    const queue = pickQuestions(pool, st ? st.seen : [], isTest ? TEST_SIZE : LESSON_SIZE);
    const total = queue.length;
    const results = new Map(); // n -> fraction on first attempt
    const retry = [];          // wrong ones come back once at the end (no extra score)
    let xp = 0;

    const shell = inner => {
      app.innerHTML = `<div class="lesson">
        <div class="lesson-top"><a class="btn ghost" href="#/learn" title="Quit lesson">✕</a>
          <div class="bar lesson-bar"><span style="width:${pct(results.size, total || 1)}%"></span></div>
          <span class="small muted">${isTest ? '🏆 ' + esc(unit.title) : esc(skill.name)}</span></div>
        ${inner}</div>`;
    };

    // step 1: learn card from the user's own notes + official link
    function learnStep() {
      keyHandler = e => { if (e.key === 'Enter') { e.preventDefault(); next(); } };
      const secs = (skill?.notes || []).map(r => noteSection(r.doc, r.h)).filter(Boolean);
      const learnUrl = unit.path ? LEARN + unit.path : null;
      shell(`<div class="card learn-card">
        <div class="small muted">${isTest ? 'Unit test' : `Lesson · level ${st.level}/${MAX_LEVEL}`}</div>
        <h1>${esc(isTest ? unit.title : skill.name)}</h1>
        ${isTest ? `<p>${total} real exam questions across this unit. Score ${PASS_PCT}% to pass${unitPassed(unit) ? '' : ' and unlock the next unit'}.</p>`
          : secs.length ? `<p class="small muted">From your notes:</p>${secs.map(s2 => `<div class="md note-snip">${renderMd(s2.md)}</div>`).join('')}`
          : `<p class="muted">Your notes don't cover this skill yet.</p>`}
        ${learnUrl ? `<p class="small"><a href="${learnUrl}" target="_blank" rel="noopener">Microsoft Learn learning path ↗</a></p>` : ''}
        ${total ? `<button class="btn primary big" id="go">${isTest ? 'Start test' : `Start quiz · ${total} questions`}</button>`
          : `<p class="small muted">No exam questions are tagged to this skill — reading it completes the lesson.</p><button class="btn primary big" id="go">Mark as read</button>`}
      </div>`);
      $('#go').onclick = next;
    }

    let cur = null, isRetry = false;
    function next() {
      if (!total) return finish();
      if (queue.length) { cur = queue.shift(); isRetry = false; }
      else if (retry.length) { cur = retry.shift(); isRetry = true; }
      else return finish();
      askStep();
    }

    function askStep() {
      const q = cur;
      let selected = [], ixSel = q.ix ? ixEmpty(q) : null, checked = false;
      const need = letters(q.answer).length || 1;
      const ready = () => q.ix ? ixAnswered(q, ixSel) : selected.length >= need;
      const score = () => scoreOf(q, q.ix ? ixSel : selected);
      function draw() {
        const sc = checked ? score() : null;
        shell(`<div class="card ${checked ? 'locked' : ''}">
          ${isRetry ? '<div class="pill bad" style="margin-bottom:8px">Previous mistake — try again</div>' : ''}
          <div class="qhead"><span class="small muted">Exam question ${q.n}</span>${q.ix ? `<span class="pill">${esc(IX_LABEL[q.ix.kind])}</span>` : ''}</div>
          ${questionBody(q, !!q.ix)}
          ${q.mc ? choicesHtml(q, selected, checked) + (need > 1 && !checked ? `<div class="small muted">Select ${need} answers.</div>` : '') : ixHtml(q, ixSel, checked)}
        </div>
        <div class="lesson-foot ${sc ? (sc.ok ? 'ok' : 'bad') : ''}">
          ${sc ? `<div class="foot-msg"><b>${sc.ok ? '✓ Nice!' : q.ix && sc.frac > 0 ? `${Math.round(sc.frac * 100)}% right` : '✗ Not quite'}</b>
            ${!sc.ok && q.mc ? ` <span>Correct answer: ${esc(q.answer)}</span>` : ''}</div>
            <button class="btn primary big" id="cont">Continue</button>` :
            `<span></span><button class="btn primary big" id="check" ${ready() ? '' : 'disabled'}>Check</button>`}
        </div>
        ${checked ? `<details class="card" style="margin-top:12px"><summary>Explanation & discussion</summary>${explanation(q)}</details>` : ''}`);
        if (!checked) {
          if (q.mc) app.querySelectorAll('.choice').forEach(el => el.onclick = () => toggle(el.dataset.k));
          else bindIx(app, q, () => ixSel, (s2, quiet) => { ixSel = s2; if (quiet) $('#check').disabled = !ready(); else draw(); });
          $('#check').onclick = check;
        } else $('#cont').onclick = next;
      }
      function toggle(k) {
        selected = need === 1 ? [k] : selected.includes(k) ? selected.filter(x => x !== k) : [...selected, k];
        draw();
      }
      function check() {
        if (!ready() || checked) return;
        checked = true;
        const { frac, ok } = score();
        if (!isRetry) {
          results.set(q.n, frac);
          record(q.n, ok);
          xp += ok ? 10 : frac > 0 ? 5 : 0;
          if (!ok) retry.push(q);
        }
        draw();
      }
      keyHandler = e => {
        if (e.key === 'Enter') { e.preventDefault(); return checked ? next() : check(); }
        if (checked || !q.mc) return;
        const k = e.key.toUpperCase(), keys = Object.keys(q.choices);
        if (keys.includes(k)) toggle(k);
        else if (/^[1-9]$/.test(e.key) && keys[+e.key - 1]) toggle(keys[+e.key - 1]);
      };
      draw();
      window.scrollTo({ top: 0 });
    }

    function finish() {
      keyHandler = null;
      const scorePct = total ? Math.round([...results.values()].reduce((a, b) => a + b, 0) / total * 100) : 100;
      const passed = scorePct >= PASS_PCT;
      if (passed) xp += isTest ? 50 : 10;
      addXp(xp);
      let msg = '';
      if (isTest) {
        const us = p.units[unit.id] = p.units[unit.id] || { passed: false, best: 0 };
        us.best = Math.max(us.best, scorePct);
        if (passed && !us.passed) {
          us.passed = true;
          unit.skills.forEach(s2 => { const ls = p.lessons[s2.id] = lessonState(s2.id); ls.level = Math.max(ls.level, 1); });
          msg = 'Unit complete — next unit unlocked!';
        }
      } else {
        const ls = p.lessons[skill.id] = lessonState(skill.id);
        ls.best = Math.max(ls.best, scorePct);
        ls.seen = [...new Set([...ls.seen, ...results.keys()])];
        if (passed && ls.level < MAX_LEVEL) { ls.level++; msg = `Level ${ls.level} reached!`; }
      }
      save();
      shell(`<div class="card finish">
        <div class="big-emoji">${passed ? '🎉' : '💪'}</div>
        <h1>${passed ? (isTest ? 'Unit test passed!' : 'Lesson complete!') : 'Almost there'}</h1>
        <p>${total ? `Score <b>${scorePct}%</b> · ` : ''}+<b>${xp}</b> XP · 🔥 ${streak()} day streak</p>
        ${msg ? `<p><b>${msg}</b></p>` : ''}
        ${!passed ? `<p class="muted">You need ${PASS_PCT}% to pass. Missed questions are in Review.</p>` : ''}
        <div class="row" style="justify-content:center;margin-top:16px">
          <a class="btn primary big" href="#/learn">Continue</a>
          <button class="btn big" id="again">${passed ? 'Practice again' : 'Try again'}</button>
        </div>
      </div>`);
      $('#again').onclick = () => viewLesson(params);
    }

    learnStep();
  }

  // ---------------------------------------------------------------- study plan / on-track tracker
  // Phases: learn the whole path by (ready − 4d), cover the question bank by (ready − 2d),
  // mock exams in the final days; "ready" = all checks green by the ready date.
  const DAY = 86400000;
  const parseDay = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (s, n) => { const d = parseDay(s); d.setDate(d.getDate() + n); return dayKey(d); };
  const daysBetween = (a, b) => Math.round((parseDay(b) - parseDay(a)) / DAY);
  const fmtDay = s => parseDay(s).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
  const COVERAGE_TARGET = 0.9, ACC_TARGET = 80, MOCK_TARGET = 800, MOCKS_NEEDED = 3;

  function plan() {
    if (!store.plan) { store.plan = { exam: '2026-11-17', ready: '2026-11-14', start: dayKey() }; save(); }
    return store.plan;
  }

  function planStatus() {
    const pl = plan(), t = dayKey();
    const learnBy = addDays(pl.ready, -4), coverBy = addDays(pl.ready, -2);
    // expected progress after `daysDone` full days of the plan (today counts once it is over)
    const linear = (total, deadline, daysDone = daysBetween(pl.start, t) + 1) => {
      const span = daysBetween(pl.start, deadline);
      if (span <= 0) return total;
      return total * Math.min(1, Math.max(0, daysDone / (span + 1)));
    };
    const elapsed = daysBetween(pl.start, t); // full days before today
    const status = (actual, expected) => actual >= expected - 0.001 ? 'ok' : actual >= expected * 0.8 ? 'warn' : 'bad';

    const lessonsTotal = CURRICULUM.reduce((s, u) => s + u.skills.length, 0);
    const lessonsDone = CURRICULUM.reduce((s, u) => s + u.skills.filter(sk => lessonState(sk.id).level > 0).length, 0);
    const unitsTotal = CURRICULUM.length;
    const unitsDone = CURRICULUM.filter(unitPassed).length;
    const unitsReady = CURRICULUM.filter((u, ui) => unitPassed(u) || unitTestReady(ui)).length;
    const bank = QUESTIONS.filter(gradable);
    const covered = bank.filter(q => store.ans[q.n]).length;
    const coverGoal = Math.ceil(bank.length * COVERAGE_TARGET);
    const recent = store.hist.slice(-100);
    const acc = recent.length ? Math.round(recent.filter(h => h.ok).length / recent.length * 100) : null;
    const mocks = store.exams.filter(e => e.total >= 30);
    const last3 = mocks.slice(-MOCKS_NEEDED);
    const mockAvg = last3.length ? Math.round(last3.reduce((s, e) => s + e.score, 0) / last3.length) : null;
    const mockDue = d => d < learnBy ? 0 : Math.min(MOCKS_NEEDED, Math.ceil(MOCKS_NEEDED * (daysBetween(learnBy, d) + 1) / (daysBetween(learnBy, pl.ready) + 1)));
    const mockExpected = t < learnBy ? 0 : Math.min(MOCKS_NEEDED, Math.ceil(MOCKS_NEEDED * (daysBetween(learnBy, t) + 1) / (daysBetween(learnBy, pl.ready) + 1)));

    const domainAcc = Object.keys(DOMAINS).map(d => {
      const seen = QUESTIONS.filter(q => q.domain === d && store.ans[q.n]);
      return { d, n: seen.length, acc: seen.length ? Math.round(seen.filter(q => store.ans[q.n].ok).length / seen.length * 100) : null };
    });

    // expected = target by end of today (shown); due = where you should be by end of yesterday (judged)
    const checks = [
      { label: 'Learning path lessons', actual: lessonsDone, goal: lessonsTotal, by: learnBy,
        expected: Math.ceil(linear(lessonsTotal, learnBy)), due: Math.floor(linear(lessonsTotal, learnBy, elapsed)) },
      // unit tests follow the lessons: every unit whose lessons are all done should have its test passed (one may be pending)
      { label: 'Unit tests passed', actual: unitsDone, goal: unitsTotal, by: learnBy,
        expected: unitsReady, due: Math.max(0, unitsReady - 1) },
      { label: 'Exam questions attempted', actual: covered, goal: coverGoal, by: coverBy,
        expected: Math.ceil(linear(coverGoal, coverBy)), due: Math.floor(linear(coverGoal, coverBy, elapsed)) },
      { label: 'Mock exams taken (45 Q)', actual: Math.min(mocks.length, MOCKS_NEEDED), goal: MOCKS_NEEDED, by: pl.ready,
        expected: mockExpected, due: mockDue(addDays(t, -1)) },
    ];
    checks.forEach(c => { c.status = status(c.actual, c.due); c.done = c.actual >= c.goal; });
    // quality checks: thresholds, not pace
    const quality = [
      { label: 'Accuracy, last 100 answers', value: acc, unit: '%', goal: ACC_TARGET,
        status: acc === null || recent.length < 30 ? 'na' : acc >= ACC_TARGET ? 'ok' : acc >= ACC_TARGET - 10 ? 'warn' : 'bad',
        hint: recent.length < 30 ? `${recent.length}/30 answers needed to measure` : '' },
      { label: `Mock exam score, avg of last ${MOCKS_NEEDED}`, value: mockAvg, unit: '', goal: MOCK_TARGET,
        status: mockAvg === null ? 'na' : mockAvg >= MOCK_TARGET ? 'ok' : mockAvg >= 700 ? 'warn' : 'bad',
        hint: mockAvg === null ? 'Take mock exams from ' + fmtDay(learnBy) : 'Pass mark is 700 — aim for 800 as a buffer' },
    ];

    const pctOf = (a, b) => b ? Math.min(1, a / b) : 1;
    const readiness = Math.round(100 * (
      0.25 * pctOf(lessonsDone, lessonsTotal) + 0.10 * pctOf(unitsDone, unitsTotal) + 0.20 * pctOf(covered, coverGoal) +
      0.25 * (acc === null || recent.length < 30 ? 0 : pctOf(acc, ACC_TARGET)) +
      0.20 * (mockAvg === null ? 0 : pctOf(mockAvg, MOCK_TARGET) * pctOf(mocks.length, MOCKS_NEEDED))));

    // quality only counts toward the verdict once enough is measured (accuracy) or the mock phase started
    const states = [...checks.map(c => c.status), ...quality.filter(q => q.status !== 'na' && (q.unit === '%' || t >= learnBy)).map(q => q.status)];
    const overall = states.includes('bad') ? 'bad' : states.includes('warn') ? 'warn' : 'ok';
    const ready = checks.every(c => c.done) && quality.every(q => q.status === 'ok');

    // today's to-do, recalculated from what's left
    const daysTo = d => Math.max(1, daysBetween(t, d) + 1);
    const todo = [];
    if (t <= learnBy && lessonsDone < lessonsTotal) {
      todo.push({ text: `${Math.ceil((lessonsTotal - lessonsDone) / daysTo(learnBy))} lesson(s) on the Learn path`, href: '#/learn' });
      if (unitsDone < unitsTotal) todo.push({ text: `Unit test whenever a unit's lessons are done (${unitsTotal - unitsDone} left)`, href: '#/learn' });
    }
    if (t <= coverBy && covered < coverGoal) {
      todo.push({ text: `${Math.ceil((coverGoal - covered) / daysTo(coverBy))} new exam questions (lesson questions count)`, href: '#/practice?status=unseen&order=random' });
    }
    if (t >= learnBy && t <= pl.ready) todo.push({ text: '1 mock exam, then review every mistake', href: '#/exam' });
    if (QUESTIONS.some(q => store.ans[q.n] && !store.ans[q.n].ok)) todo.push({ text: 'Drill questions you got wrong', href: '#/practice?status=wrong&order=random' });
    if (t > pl.ready) todo.unshift({ text: 'Light review only: flagged questions and your notes — rest before the exam', href: '#/review' });
    const todayAct = store.activity[t] || { answered: 0, correct: 0 };
    const todayGoal = t <= coverBy ? Math.ceil(Math.max(0, coverGoal - covered + todayAct.answered) / daysTo(coverBy)) : 45;

    return { pl, t, learnBy, coverBy, checks, quality, readiness, overall, ready, todo, todayAct, todayGoal, domainAcc,
      daysToExam: daysBetween(t, pl.exam), daysToReady: daysBetween(t, pl.ready) };
  }

  const STATUS_TEXT = { ok: 'On track', warn: 'Slightly behind', bad: 'Behind', na: 'Not measured yet' };

  function planBanner() {
    const s = planStatus();
    const msg = s.ready ? 'Exam-ready ✓' : STATUS_TEXT[s.overall];
    return `<a class="plan-banner ${s.ready ? 'ok' : s.overall}" href="#/plan">
      <span><b>${s.daysToExam > 0 ? `${s.daysToExam} days to the exam` : s.daysToExam === 0 ? 'Exam day — good luck!' : 'Exam done'}</b> · ${msg} · readiness ${s.readiness}%</span>
      <span class="small">Today ${s.todayAct.answered}/${s.todayGoal} questions →</span></a>`;
  }

  function viewPlan() {
    keyHandler = null;
    const s = planStatus(), pl = s.pl;
    const bar = (a, g, exp) => `<div class="bar plan-bar"><span style="width:${pct(Math.min(a, g), g)}%"></span>
      ${exp !== undefined ? `<i class="marker" style="left:${pct(Math.min(exp, g), g)}%" title="Target: ${exp}"></i>` : ''}</div>`;

    // calendar from plan start to exam day, shaded by questions answered
    const cal = [];
    for (let d = pl.start; d <= pl.exam; d = addDays(d, 1)) {
      const a = store.activity[d]?.answered || 0;
      const lvl = a === 0 ? 0 : a < 20 ? 1 : a < 45 ? 2 : 3;
      const tag = d === pl.exam ? 'exam' : d === pl.ready ? 'ready' : d === s.learnBy ? 'learn' : '';
      cal.push(`<div class="cal-day l${lvl} ${tag} ${d === s.t ? 'today' : ''} ${d > s.t ? 'future' : ''}" title="${fmtDay(d)}: ${a} questions"><span>${parseDay(d).getDate()}</span></div>`);
    }

    const phases = [
      { from: pl.start, to: s.learnBy, name: 'Learn', text: 'Work through every lesson + unit test; practice new questions daily' },
      { from: addDays(s.learnBy, 1), to: pl.ready, name: 'Mock exams', text: `${MOCKS_NEEDED}+ mock exams, fix weak domains, finish question coverage` },
      { from: addDays(pl.ready, 1), to: addDays(pl.exam, -1), name: 'Buffer', text: 'Light review only — you should already be ready' },
      { from: pl.exam, to: pl.exam, name: 'Exam', text: 'AZ-900' },
    ];

    app.innerHTML = `
      <h1>Exam plan</h1>
      <p class="sub">Exam on <b>${fmtDay(pl.exam)}</b>, aiming to be ready by <b>${fmtDay(pl.ready)}</b>${s.daysToReady > 0 ? ` (${s.daysToReady} days from today)` : ''}.</p>

      <div class="grid">
        <div class="card stat verdict ${s.ready ? 'ok' : s.overall}">
          <div class="big">${s.ready ? 'Ready ✓' : STATUS_TEXT[s.overall]}</div>
          <div class="label">${s.ready ? 'All checks green — keep it warm with light review.' : s.overall === 'ok' ? 'You are where you need to be today.' : 'Catch up with the to-do list below.'}</div>
        </div>
        <div class="card stat"><div class="big">${s.readiness}%</div><div class="label">Readiness score</div><div class="bar ok"><span style="width:${s.readiness}%"></span></div></div>
        <div class="card stat"><div class="big">${Math.max(0, s.daysToExam)}</div><div class="label">Days until the exam</div></div>
      </div>

      <h2>Today</h2>
      <div class="card">
        <div class="row"><b>Questions today: ${s.todayAct.answered} / ${s.todayGoal}</b><span class="spacer"></span>
          <span class="small muted">${s.todayAct.answered ? `${pct(s.todayAct.correct, s.todayAct.answered)}% correct` : ''}</span></div>
        <div class="bar ok"><span style="width:${pct(Math.min(s.todayAct.answered, s.todayGoal), s.todayGoal || 1)}%"></span></div>
        <ul class="todo">${s.todo.map(x => `<li><a href="${x.href}">${esc(x.text)}</a></li>`).join('')}</ul>
      </div>

      <h2>On-track checks</h2>
      <div class="card">
        ${s.checks.map(c => `<div class="check">
          <div class="row"><span class="dot ${c.done ? 'ok' : c.status}"></span><b>${esc(c.label)}</b><span class="spacer"></span>
            <span class="small">${c.actual} / ${c.goal}</span></div>
          ${bar(c.actual, c.goal, c.expected)}
          <div class="small muted">${c.done ? 'Done ✓' : `${STATUS_TEXT[c.status]}${c.due > c.actual ? ` (${c.due - c.actual} behind)` : ''} — ${c.expected > c.actual ? `reach ${c.expected} by end of today, ` : ''}all by ${fmtDay(c.by)}`}</div>
        </div>`).join('')}
        ${s.quality.map(q => `<div class="check">
          <div class="row"><span class="dot ${q.status}"></span><b>${esc(q.label)}</b><span class="spacer"></span>
            <span class="small">${q.value === null ? '—' : q.value + q.unit} (goal ${q.goal}${q.unit})</span></div>
          ${q.value === null ? '' : bar(q.value, q.unit === '%' ? 100 : 1000, q.goal)}
          <div class="small muted">${q.hint || STATUS_TEXT[q.status]}</div>
        </div>`).join('')}
        <div class="check"><b>Accuracy by domain</b>
          <div class="grid" style="margin-top:8px">${s.domainAcc.map(x => `<div>${domainPill(x.d)} <b>${x.acc === null ? '—' : x.acc + '%'}</b> <span class="small muted">(${x.n} answered)</span>
            ${x.acc !== null && x.acc < 75 && x.n >= 10 ? `<div class="small"><a href="#/practice?domain=${x.d}&status=wrong">Weak — drill mistakes</a></div>` : ''}</div>`).join('')}</div>
        </div>
      </div>

      <h2>Phases</h2>
      <div class="card"><ol class="phases">${phases.map(ph => {
        const state = s.t > ph.to ? 'past' : s.t >= ph.from ? 'now' : '';
        return `<li class="${state}"><b>${esc(ph.name)}</b> <span class="small muted">${ph.from === ph.to ? fmtDay(ph.from) : `${fmtDay(ph.from)} – ${fmtDay(ph.to)}`}</span><div class="small">${esc(ph.text)}</div></li>`;
      }).join('')}</ol></div>

      <h2>Activity</h2>
      <div class="card">
        <div class="cal">${cal.join('')}</div>
        <div class="small muted cal-legend"><span class="cal-day l0"></span>0 <span class="cal-day l1"></span>1–19 <span class="cal-day l2"></span>20–44 <span class="cal-day l3"></span>45+ questions ·
          <span class="cal-day learn"></span> learn phase ends <span class="cal-day ready"></span> ready <span class="cal-day exam"></span> exam</div>
      </div>

      <h2>Settings</h2>
      <div class="card row">
        <label class="field">Exam date<input type="date" id="pExam" value="${pl.exam}"></label>
        <label class="field">Ready by<input type="date" id="pReady" value="${pl.ready}"></label>
        <label class="field">Plan started<input type="date" id="pStart" value="${pl.start}"></label>
      </div>`;

    const upd = (k, el) => el.onchange = () => { if (el.value) { pl[k] = el.value; save(); viewPlan(); } };
    upd('exam', $('#pExam')); upd('ready', $('#pReady')); upd('start', $('#pStart'));
  }

  // ---------------------------------------------------------------- router
  function route() {
    clearInterval(timerId);
    const { view, params } = parseHash();
    document.querySelectorAll('#nav a').forEach(a => a.classList.toggle('active', a.dataset.view === (view === 'lesson' ? 'learn' : view)));
    const views = { learn: viewLearn, lesson: viewLesson, plan: viewPlan, dashboard: viewDashboard, practice: viewPractice, exam: viewExam, review: viewReview, notes: viewNotes, official: viewOfficial };
    (views[view] || viewLearn)(params);
  }
  window.addEventListener('hashchange', route);
  route();
})();
