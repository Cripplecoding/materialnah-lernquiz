import { QuizError, groundedInstruction } from './quiz.mjs';

export async function askOpenAI(name, schema, instruction, data) {
  if (!process.env.OPENAI_API_KEY) throw new QuizError('Der Server benötigt einen OpenAI-API-Schlüssel. Bitte die lokale Konfiguration prüfen.', 503);
  let response;
  try {
    response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST', signal: AbortSignal.timeout(180000),
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4.1', store: false,
        instructions: groundedInstruction + '\n\n' + instruction,
        input: JSON.stringify(data), max_output_tokens: ({ material_analysis: 10000, quiz_round: 12000, grounding_audit: 3000, written_answer: 1500 })[name] || 500,
        text: { format: { type: 'json_schema', name, strict: true, schema } }
      })
    });
  } catch { throw new QuizError('OpenAI ist nicht erreichbar oder die Anfrage dauerte zu lange. Deine bisherigen Antworten bleiben erhalten.', 503); }
  if (!response.ok) {
    let code;
    try { code = (await response.json()).error?.code; } catch {}
    if (response.status === 429 && ['insufficient_quota', 'billing_hard_limit_reached'].includes(code)) throw new QuizError('Das OpenAI-API-Guthaben oder Projektbudget ist ausgeschöpft. Bitte die API-Abrechnung prüfen.', 503);
    if (response.status === 429 && code === 'rate_limit_exceeded') throw new QuizError('Das API-Anfragelimit ist erreicht (rate_limit_exceeded). Bitte später erneut versuchen oder kleinere Materialabschnitte verwenden.', 503);
    // Never expose response bodies, request headers or credentials in application errors.
    const messages = { 401: 'Der API-Schlüssel wurde nicht akzeptiert.', 403: 'Der API-Zugriff ist für dieses Projekt nicht freigegeben.', 429: 'OpenAI hat die Anfrage mit HTTP 429 abgewiesen. Bitte API-Kontingent und Projektlimits prüfen.', 400: 'Die API hat die Anfrage abgelehnt. Bitte Modell und Konfiguration prüfen.', 404: 'Das konfigurierte API-Modell ist nicht verfügbar.' };
    throw new QuizError(messages[response.status] || 'Die KI-Anfrage ist fehlgeschlagen. Bitte später erneut versuchen.', 503);
  }
  const result = await response.json();
  if (result.status !== 'completed') throw new QuizError('Die KI-Antwort war unvollständig. Es wurden keine neuen Inhalte übernommen.', 503);
  const blocks = (result.output || []).flatMap(item => item.content || []);
  if (blocks.some(b => b.type === 'refusal')) throw new QuizError('Für dieses Material wurde keine Antwort freigegeben.');
  try { return JSON.parse(blocks.filter(b => b.type === 'output_text').map(b => b.text).join('')); }
  catch { throw new QuizError('Die KI-Antwort konnte nicht verarbeitet werden.', 503); }
}
