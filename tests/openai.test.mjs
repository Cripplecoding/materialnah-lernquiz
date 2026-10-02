import test from 'node:test';
import assert from 'node:assert/strict';
import { askOpenAI } from '../openai.mjs';
import { object } from '../quiz.mjs';

test('Responses adapter: schema, nonstorage, errors, refusals and incomplete replies', async t => {
  const before = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = 'TEST_ONLY_NOT_A_REAL_KEY';
  t.after(() => { if (before === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = before; });
  const schema = object({ quote: { type: 'string' } });
  t.mock.method(globalThis, 'fetch', async (_, options) => {
    const body = JSON.parse(options.body);
    assert.equal(body.store, false); assert.equal(body.text.format.strict, true);
    assert.deepEqual(body.text.format.schema, schema);
    return Response.json({ status: 'completed', output: [{ content: [{ type: 'output_text', text: '{"quote":"test"}' }] }] });
  });
  assert.deepEqual(await askOpenAI('test', schema, 'Test', {}), { quote: 'test' });
  globalThis.fetch.mock.mockImplementation(async () => Response.json({ error: { code: 'insufficient_quota', message: 'do not expose upstream text' } }, { status: 429 }));
  await assert.rejects(askOpenAI('test', schema, '', {}), /Guthaben/);
  globalThis.fetch.mock.mockImplementation(async () => Response.json({ error: { code: 'rate_limit_exceeded' } }, { status: 429 }));
  await assert.rejects(askOpenAI('test', schema, '', {}), /rate_limit_exceeded/);
  globalThis.fetch.mock.mockImplementation(async () => Response.json({ status: 'incomplete', output: [] }));
  await assert.rejects(askOpenAI('test', schema, '', {}), /unvollständig/);
  globalThis.fetch.mock.mockImplementation(async () => Response.json({ status: 'completed', output: [{ content: [{ type: 'refusal', refusal: 'test' }] }] }));
  await assert.rejects(askOpenAI('test', schema, '', {}), /keine Antwort/);
});
