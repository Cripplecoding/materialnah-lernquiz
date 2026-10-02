'use strict';
const $ = id => document.getElementById(id);
const node = (tag, text, cls) => { const el = document.createElement(tag); if (text !== undefined) el.textContent = text; if (cls) el.className = cls; return el; };
let state, sources = [], busy = false;
function error(message) { $('error').textContent = message; $('error').hidden = !message; }
function setBusy(value, text = '') {
  busy = value; $('activity').hidden = !value; $('activityText').textContent = text;
  document.querySelectorAll('button,input,textarea,select').forEach(el => { el.disabled = value; });
  if (!value && state?.feedback) $('inputs').querySelectorAll('input,textarea,select').forEach(el => { el.disabled = true; });
}
async function request(path, body) {
  const res = await fetch('/api/' + path, body === undefined ? { cache: 'no-store' } : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok) throw Error(data.error || 'Die Anfrage ist fehlgeschlagen.');
  return data;
}
async function action(path, body = {}, message = 'Bitte kurz warten …') {
  if (busy) return;
  setBusy(true, message); error('');
  try { state = await request(path, body); render(true); }
  catch (e) { error(e.message === 'Failed to fetch' ? 'Der lokale Server ist nicht erreichbar. Deine aktuelle Eingabe bleibt erhalten.' : e.message); }
  finally { setBusy(false); }
}
function evidenceBlock(refs, target) {
  for (const ref of refs) { target.append(node('blockquote', ref.quote), node('p', ref.source ? `${ref.source} · ab Zeile ${ref.line}` : `Textabschnitt ${ref.passageId}`, 'muted')); }
}
function render(focus = false) {
  const phase = state.phase;
  for (const id of ['setup', 'overview', 'quiz', 'result']) $(id).hidden = id !== phase;
  if (phase === 'overview') {
    $('stats').textContent = `${state.aspects.length} erkannte Lernaspekte aus ${state.passageCount} Textabschnitten.`;
    $('coverageLabel').textContent = `${state.covered} / ${state.aspects.length}`;
    $('coverageBar').max = Math.max(state.aspects.length, 1); $('coverageBar').value = state.covered;
    $('aspects').replaceChildren();
    for (const aspect of state.aspects) { const detail = node('details'); detail.append(node('summary', `${aspect.practiced ? '✓' : '○'} ${aspect.title}`, aspect.practiced ? 'done' : '')); evidenceBlock(aspect.evidence, detail); $('aspects').append(detail); }
    $('excludedBox').hidden = !state.excluded.length; $('excludedTitle').textContent = `${state.excluded.length} nicht vollständig verwendbare Textstellen prüfen`;
    $('excluded').replaceChildren();
    for (const item of state.excluded) { const d = node('div'); d.append(node('p', item.reason), node('blockquote', item.passage.text), node('p', `${item.passage.source} · ab Zeile ${item.passage.line}`, 'muted')); $('excluded').append(d); }
    $('start').textContent = state.historyCount ? '15 neue Fragen starten ↗' : '15 Fragen starten ↗';
  }
  if (phase === 'quiz') renderQuestion();
  if (phase === 'result') {
    $('score').textContent = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 }).format(state.percent) + ' %';
    $('scoreDetail').textContent = `${state.correct} von 15 Aufgaben vollständig richtig.`;
    $('resultCoverage').textContent = `${state.covered} von ${state.aspects.length} erkannten Lernaspekten bisher geübt. Geübt bedeutet beantwortet, nicht automatisch beherrscht.`;
    $('review').replaceChildren();
    state.review.forEach((item, i) => { const d = node('div'); d.append(node('h3', `${i + 1}. ${item.feedback.correct ? '✓ Richtig' : '✗ Falsch'} · ${item.question}`), node('p', 'Deine Antwort: ' + item.answer), node('p', 'Musterlösung: ' + item.feedback.solution)); evidenceBlock(item.feedback.evidence, d); $('review').append(d); });
  }
  if (focus) $(phase === 'quiz' ? 'questionTitle' : phase + 'Title').focus();
}
function renderQuestion() {
  const q = state.question;
  $('counter').textContent = `FRAGE ${String(state.index + 1).padStart(2, '0')} / 15`;
  $('format').textContent = { mc: 'Multiple Choice', write: 'Schriftliche Abfrage', match: 'Begriffe zuordnen' }[q.kind];
  $('demand').textContent = q.demand; $('progress').value = state.answered; $('questionTitle').textContent = q.prompt;
  $('answerHint').textContent = { mc: 'Wähle genau eine Antwort.', write: 'Antworte in eigenen Worten. Fachlich sinngleiche Formulierungen zählen.', match: 'Ordne alle drei Begriffe richtig zu. Ein Punkt bei drei korrekten Paaren.' }[q.kind];
  if ($('inputs').dataset.question !== q.id || !$('inputs').children.length || (!state.feedback && $('inputs').dataset.checked === 'true')) {
    $('inputs').replaceChildren(); $('inputs').dataset.question = q.id; $('inputs').dataset.checked = 'false';
    if (q.kind === 'mc') for (const option of q.options) { const label = node('label', undefined, 'option'); const input = document.createElement('input'); input.type = 'radio'; input.name = 'answer'; input.value = option.id; input.required = true; label.append(input, node('span', option.text)); $('inputs').append(label); }
    if (q.kind === 'write') { const label = node('label', 'Deine Antwort'); const input = document.createElement('textarea'); input.name = 'answer'; input.required = true; input.maxLength = 6000; input.placeholder = 'Erkläre den Sachverhalt anhand deines Materials …'; label.append(input); $('inputs').append(label); }
    if (q.kind === 'match') for (const left of q.left) { const label = node('label', undefined, 'match-row'); label.append(node('span', left.text)); const select = document.createElement('select'); select.name = left.id; select.required = true; const empty = node('option', 'Bitte zuordnen'); empty.value = ''; empty.disabled = true; empty.selected = true; select.append(empty); for (const right of q.right) { const option = node('option', right.text); option.value = right.id; select.append(option); } label.append(select); $('inputs').append(label); }
  }
  const feedback = state.feedback; $('feedback').hidden = !feedback; $('evidence').hidden = !feedback; $('next').hidden = !feedback; $('check').hidden = !!feedback;
  if (feedback) {
    $('inputs').dataset.checked = 'true'; $('feedback').className = 'feedback ' + (feedback.correct ? 'good' : 'bad');
    $('feedback').replaceChildren(node('h3', feedback.correct ? '✓ Richtig!' : '✗ Noch nicht richtig.'), node('strong', 'Musterlösung'), node('p', feedback.solution));
    if (feedback.missing.length) { $('feedback').append(node('strong', 'Das fehlt noch:')); const list = node('ul'); feedback.missing.forEach(c => list.append(node('li', c))); $('feedback').append(list); }
    $('evidence').replaceChildren(node('strong', 'Nachlesen in deinem Material')); evidenceBlock(feedback.evidence, $('evidence'));
    $('next').textContent = state.index === 14 ? 'Ergebnis ansehen →' : 'Nächste Frage →';
  }
}
$('material').oninput = () => { $('charCount').textContent = ($('material').value.length + sources.reduce((n, s) => n + s.text.length, 0)).toLocaleString('de-DE') + ' Zeichen'; };
$('files').onchange = async () => {
  const files = [...$('files').files]; setBusy(true, 'Dateien werden eingelesen …'); error('');
  try {
    if (files.length > 20 || files.some(f => !/\.(txt|md)$/i.test(f.name)) || files.reduce((n, f) => n + f.size, 0) > 240000) throw Error('Bitte höchstens 20 TXT-/Markdown-Dateien und maximal 60.000 Zeichen verwenden.');
    sources = await Promise.all(files.map(async file => ({ name: file.name, text: new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer()) })));
    $('fileStatus').textContent = files.map(f => f.name).join(' · ');
  } catch (e) { sources = []; $('files').value = ''; $('fileStatus').textContent = ''; error(e.message); }
  finally { $('material').oninput(); setBusy(false); }
};
$('prepare').onclick = () => { const all = [...sources]; if ($('material').value.trim()) all.push({ name: 'Eingefügter Text', text: $('material').value }); if (!all.length) return error('Bitte zuerst Lernmaterial auswählen oder einfügen.'); if (all.reduce((n, s) => n + s.text.length, 0) > 60000) return error('Bitte maximal 60.000 Zeichen verwenden.'); action('analyze', { sources: all }, 'Dein Material wird vollständig auf Lernaspekte und Belegstellen geprüft …'); };
$('start').onclick = $('fresh').onclick = () => action('new', {}, '15 Fragen entstehen. Danach werden Quellenbezug, Lösungen und Wiederholungen geprüft. Das kann einige Minuten dauern …');
$('again').onclick = () => action('repeat'); $('back').onclick = () => action('overview');
$('edit').onclick = () => { if (confirm('Neues Material auswerten? Der bisherige Fragenverlauf wird zurückgesetzt.')) action('reset'); };
$('next').onclick = () => action('next', { questionId: state.question.id });
$('answerForm').onsubmit = event => { event.preventDefault(); if (busy || state.feedback) return; const data = new FormData($('answerForm')); const answer = state.question.kind === 'match' ? Object.fromEntries(data.entries()) : data.get('answer'); action('answer', { questionId: state.question.id, answer }, state.question.kind === 'write' ? 'Deine Antwort wird sinngemäß anhand der Quellen bewertet …' : 'Antwort wird geprüft …'); };
(async () => { setBusy(true, 'Lernraum wird geladen …'); try { state = await request('state'); render(); if (!state.configured) { $('connection').hidden = false; $('connection').textContent = 'Der Server hat noch keinen API-Schlüssel. Bitte die lokale Konfiguration prüfen.'; } } catch { error('Bitte die Lernseite über den lokalen Node-Server öffnen. Sie benötigt jetzt eine sichere serverseitige API-Verbindung.'); } finally { setBusy(false); } })();
