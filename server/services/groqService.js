import fallbackCallouts from '../data/fallbackCallouts.json' with { type: 'json' };
import { tierPrompts } from './skillSync.js';

const timeoutFetch = (url, options, timeoutMs = 2600) => Promise.race([
  fetch(url, options),
  new Promise((_, reject) => setTimeout(() => reject(new Error('Groq timeout')), timeoutMs)),
]);

export async function generateCallout({ eventType, tier, state = {} }) {
  const fallback = fallbackCallouts[tier]?.[eventType] || fallbackCallouts.intermediate.enemy_spotted;
  if (process.env.OFFLINE_MODE === 'true' || !process.env.GROQ_API_KEY) return fallback;
  const started = Date.now();
  try {
    const response = await timeoutFetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant', temperature: 0.55, max_tokens: 30, messages: [
        { role: 'system', content: tierPrompts[tier] || tierPrompts.intermediate },
        { role: 'user', content: `Event: ${eventType}. Direction: ${state.direction || 'unknown'}. Distance: ${state.distance || 'near'}. Return only one callout.` },
      ] }),
    });
    if (!response.ok) throw new Error(`Groq HTTP ${response.status}`);
    const payload = await response.json();
    const text = payload.choices?.[0]?.message?.content?.trim();
    console.log(`[Groq] ${eventType} ${Date.now() - started}ms`);
    return text || fallback;
  } catch (error) {
    console.warn(`[Groq] fallback for ${eventType}: ${error.message}`);
    return fallback;
  }
}

export async function rewriteBriefing(rawTip, tier) {
  if (process.env.OFFLINE_MODE === 'true' || !process.env.GROQ_API_KEY) return rawTip;
  try {
    const response = await timeoutFetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST', headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant', temperature: 0.4, max_tokens: 55, messages: [
        { role: 'system', content: `${tierPrompts[tier]}. Rephrase the intel as one in-character commander briefing.` },
        { role: 'user', content: `Tactical intel: ${rawTip}` },
      ] }),
    });
    if (!response.ok) throw new Error(`Groq HTTP ${response.status}`);
    return (await response.json()).choices?.[0]?.message?.content?.trim() || rawTip;
  } catch (error) {
    console.warn(`[Groq] briefing fallback: ${error.message}`);
    return rawTip;
  }
}