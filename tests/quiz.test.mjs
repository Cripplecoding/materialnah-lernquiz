import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createApp } from '../server.mjs';
import { passagesFrom, validateAnalysis, validateRound, validateAudit, differentOrder, evaluateFixed } from '../quiz.mjs';

// Synthetic software fixtures only. Never loaded into the learner's material or live API.
const text = 'Alpha gehört zu Eins. Beta gehört zu Zwei. Gamma gehört zu Drei. Delta gehört zu Vier.';
const sources = [{ name: 'TESTFIXTUR.txt', text }];
const evidence = [{ passageId: 'p1', quote: text }];
const analysis = { aspects: [{ title: 'Testzuordnungen', evidence }], excluded: [] };
const questions = Array.from({ length: 15 }, (_, i) => ({
  kind: ['mc', 'write', 'match'][Math.floor(i / 5)], demand: i === 5 ? 'Erklären' : 'Wiedergeben',
  prompt: 'Testfrage ' + i, aspectIds: ['a1'], evidence, solution: 'Alpha gehört zu Eins.', criteria: ['Alpha gehört zu Eins.'],
  options: i < 5 ? ['Alpha', 'Beta', 'Gamma', 'Delta'] : [], correctIndex: i < 5 ? 0 : -1,
  pairs: i >= 10 ? [{ left: 'Alpha', right: 'Eins' }, { left: 'Beta', right: 'Zwei' }, { left: 'Gamma', right: 'Drei' }] : []
}));
const session = () => ({ passages: passagesFrom(sources), aspects: [{ ...analysis.aspects[0], id: 'a1' }], history: [] });
const audit = () => ({ checks: questions.map((_, index) => ({ index, valid: true, reason: '' })) });

test('all text including short/table passages is retained, with original line numbers', () => {
  const p = passagesFrom([{ name: 'test', text: 'A\n\nB | C\n\n' + 'x'.repeat(2501) }]);
  assert.deepEqual(p.map(x => x.line), [1, 3, 5, 5]);
  assert.equal(p.map(x => x.text).join(''), 'AB | C' + 'x'.repeat(2501));
  assert.throws(() => passagesFrom([{ name: 'test', text: 'x'.repeat(60001) }]));
});
test('reject ungrounded quotes and unaccounted source passages', () => {
  assert.throws(() => validateAnalysis({ aspects: [{ title: 'bad', evidence: [{ passageId: 'p1', quote: 'Invented' }] }], excluded: [] }, session().passages));
  assert.throws(() => validateAnalysis(analysis, passagesFrom([{ name: 'test', text: text + '\n\nUncovered.' }])));
});
test('enforce 15 questions, format balance, grounded terms, novelty and complete audit', () => {
  assert.equal(validateRound({ questions }, session()).length, 15);
  assert.throws(() => validateRound({ questions: questions.slice(1) }, session()));
  const invented = structuredClone(questions); invented[0].options[0] = 'Invented';
  assert.throws(() => validateRound({ questions: invented }, session()));
  const duplicate = structuredClone(questions); duplicate[1].prompt = duplicate[0].prompt;
  assert.throws(() => validateRound({ questions: duplicate }, session()));
  assert.throws(() => validateRound({ questions }, { ...session(), history: [questions[0]] }));
  assert.throws(() => validateAudit({ checks: audit().checks.slice(1) }, questions));
  const rejected = audit(); rejected.checks[3].valid = false;
  assert.throws(() => validateAudit(rejected, questions));
});
test('repeat preserves question set and changes order; all three pairs must match', () => {
  const q = questions.map((q, i) => ({ ...q, id: String(i) }));
  const next = differentOrder(q, q);
  assert.notDeepEqual(next.map(x => x.id), q.map(x => x.id));
  assert.deepEqual(next.map(x => x.id).sort(), q.map(x => x.id).sort());
  assert.equal(evaluateFixed(q[10], { 0: '0', 1: '1', 2: '2' }), true);
  assert.equal(evaluateFixed(q[10], { 0: '0', 1: '2', 2: '2' }), false);
  assert.throws(() => evaluateFixed(q[10], { 0: '0' }));
});

async function harness(t, override) {
  let gradeFailure = false;
  const calls = [];
  const server = createApp({ ask: async (name, schema, instruction, data) => {
    calls.push(name);
    if (override) { const response = await override(name, data); if (response !== undefined) return response; }
    if (name === 'material_analysis') return structuredClone(analysis);
    if (name === 'quiz_round') return { questions: structuredClone(questions), reason: '' };
    if (name === 'grounding_audit') return audit();
    if (gradeFailure) throw Error('simulated outage');
    return { criteriaMet: [data.answer === 'sinngemäß richtig'], contradictsMaterial: false, assessable: true };
  }});
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  let cookie = '';
  const req = async (path, body, headers = {}) => {
    const res = await fetch(base + path, { method: body === undefined ? 'GET' : 'POST', headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), Cookie: cookie, ...headers }, body: body === undefined ? undefined : JSON.stringify(body) });
    if (res.headers.has('set-cookie')) cookie = res.headers.get('set-cookie').split(';')[0];
    return { status: res.status, data: await res.json() };
  };
  await req('/api/state');
  return { req, calls, base, setFailure: v => { gradeFailure = v; } };
}

test('end-to-end session: grade all formats, reject skip, idempotency, 66.7%, repeat, no answer leaks', async t => {
  const { req } = await harness(t);
  assert.equal((await req('/api/analyze', { sources })).status, 200);
  let s = (await req('/api/new', {})).data;
  const original = [], answers = [];
  assert.equal(s.question.solution, undefined);
  assert.equal(s.question.correctIndex, undefined);
  assert.equal((await req('/api/next', { questionId: s.question.id })).status, 409);
  for (let i = 0; i < 15; i++) {
    const q = s.question; original.push(q.id);
    const correct = i < 10;
    const answer = q.kind === 'mc' ? (correct ? '0' : '1') : q.kind === 'write' ? (correct ? 'sinngemäß richtig' : 'falsch') : (correct ? { 0: '0', 1: '1', 2: '2' } : { 0: '1', 1: '1', 2: '2' });
    s = (await req('/api/answer', { questionId: q.id, answer })).data;
    assert.equal(s.feedback.correct, correct); assert.equal(s.feedback.evidence[0].quote, text);
    const repeated = await req('/api/answer', { questionId: q.id, answer });
    assert.equal(repeated.data.answered, i + 1);
    answers.push(s.feedback.correct);
    s = (await req('/api/next', { questionId: q.id })).data;
  }
  assert.equal(s.phase, 'result'); assert.equal(s.correct, 10); assert.equal(s.percent, 10 / 15 * 100);
  assert.equal(s.review.length, 15);
  s = (await req('/api/repeat', {})).data;
  const repeat = [];
  for (let i = 0; i < 15; i++) {
    const q = s.question; repeat.push(q.id);
    const answer = q.kind === 'mc' ? '0' : q.kind === 'write' ? 'sinngemäß richtig' : { 0: '0', 1: '1', 2: '2' };
    await req('/api/answer', { questionId: q.id, answer });
    s = (await req('/api/next', { questionId: q.id })).data;
  }
  assert.notDeepEqual(repeat, original); assert.deepEqual([...repeat].sort(), [...original].sort());
  assert.equal((await req('/api/new', {})).status, 422);
  assert.equal((await req('/api/state')).data.phase, 'result');
});

test('API failures do not mark answers wrong; rejected audit never starts round', async t => {
  const { req, setFailure } = await harness(t);
  await req('/api/analyze', { sources }); let s = (await req('/api/new', {})).data;
  while (s.question.kind !== 'write') {
    const q = s.question;
    await req('/api/answer', { questionId: q.id, answer: q.kind === 'mc' ? '0' : { 0: '0', 1: '1', 2: '2' } });
    s = (await req('/api/next', { questionId: q.id })).data;
  }
  setFailure(true);
  assert.equal((await req('/api/answer', { questionId: s.question.id, answer: 'sinngemäß richtig' })).status, 500);
  const after = (await req('/api/state')).data;
  assert.equal(after.answered, s.answered); assert.equal(after.feedback, null);
  setFailure(false);
  assert.equal((await req('/api/answer', { questionId: s.question.id, answer: 'sinngemäß richtig' })).data.feedback.correct, true);
  const rejected = await harness(t, name => { if (name === 'grounding_audit') { const a = audit(); a.checks[0].valid = false; return a; } });
  await rejected.req('/api/analyze', { sources });
  assert.equal((await rejected.req('/api/new', {})).status, 422);
  assert.equal((await rejected.req('/api/state')).data.historyCount, 0);
});

test('secrets, source code, cross-origin and malformed requests are denied', async t => {
  const { req, calls, base } = await harness(t);
  for (const path of ['/.env.local', '/server.mjs', '/quiz.mjs', '/.git/config']) assert.equal((await req(path)).status, 404);
  assert.equal((await req('/api/analyze', { sources }, { Origin: 'https://evil.test' })).status, 403);
  const badHostStatus = await new Promise((resolve, reject) => { http.get(base + '/api/state', { headers: { Host: 'evil.test' } }, res => { res.resume(); resolve(res.statusCode); }).on('error', reject); });
  assert.equal(badHostStatus, 403);
  assert.equal((await req('/api/analyze', null)).status, 400);
  assert.equal(calls.length, 0);
});
