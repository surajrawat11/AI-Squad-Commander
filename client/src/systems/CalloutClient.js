const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
export async function requestCallout(eventType, tier, state = {}) {
  try {
    const response = await fetch(`${API_URL}/callout`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ eventType, tier, state }), signal: AbortSignal.timeout(3000) });
    if (!response.ok) throw new Error('Callout unavailable');
    return (await response.json()).callout;
  } catch (_error) { return 'Stay focused. I have your back.'; }
}
export async function requestBriefing(tier) {
  try {
    const response = await fetch(`${API_URL}/briefing?tier=${tier}`, { signal: AbortSignal.timeout(3000) });
    if (!response.ok) throw new Error('Briefing unavailable');
    return (await response.json()).briefing;
  } catch (_error) { return 'Keep close to cover and move early when the zone shifts.'; }
}