const API_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api').replace(/\/$/, '');
const FALLBACK_CALLOUT = 'Stay focused. I have your back.';
const FALLBACK_BRIEFING = 'Keep close to cover and move early when the zone shifts.';

async function requestJson(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    if (!response.ok) throw new Error(`API returned ${response.status}`);
    const payload = await response.json();
    return payload;
  } finally {
    clearTimeout(timeout);
  }
}

export async function requestCallout(eventType, tier, state = {}) {
  try {
    const payload = await requestJson(`${API_URL}/callout`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ eventType, tier, state }) });
    if (typeof payload.callout !== 'string' || !payload.callout.trim()) throw new Error('Malformed callout');
    return payload.callout.trim();
  } catch (_error) { return FALLBACK_CALLOUT; }
}
export async function requestBriefing(tier) {
  try {
    const payload = await requestJson(`${API_URL}/briefing?tier=${encodeURIComponent(tier)}`);
    if (typeof payload.briefing !== 'string' || !payload.briefing.trim()) throw new Error('Malformed briefing');
    return payload.briefing.trim();
  } catch (_error) { return FALLBACK_BRIEFING; }
}