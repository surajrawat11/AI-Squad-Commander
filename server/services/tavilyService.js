import fallbackBriefings from '../data/fallbackBriefings.json' with { type: 'json' };
import { rewriteBriefing } from './groqService.js';

const cache = new Map();
export async function getBriefing(tier) {
  if (cache.has(tier)) return cache.get(tier);
  let rawTip = fallbackBriefings[tier] || fallbackBriefings.intermediate;
  if (process.env.OFFLINE_MODE !== 'true' && process.env.TAVILY_API_KEY) {
    try {
      const response = await Promise.race([
        fetch('https://api.tavily.com/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ api_key: process.env.TAVILY_API_KEY, query: 'top-down shooter rotation cover strategy tips', search_depth: 'basic', max_results: 3 }) }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Tavily timeout')), 2500)),
      ]);
      if (!response.ok) throw new Error(`Tavily HTTP ${response.status}`);
      const result = await response.json();
      rawTip = result.results?.[0]?.content || rawTip;
    } catch (error) { console.warn(`[Tavily] fallback: ${error.message}`); }
  }
  const briefing = await rewriteBriefing(rawTip, tier);
  cache.set(tier, briefing);
  return briefing;
}