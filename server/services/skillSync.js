const tierPrompts = {
  beginner: 'You are a patient squadmate. Use short, simple, encouraging callouts with basic terminology only. Maximum 8 words.',
  intermediate: 'You are a calm tactical squadmate. Use clear, practical callouts with light tactical vocabulary. Maximum 10 words.',
  pro: 'You are a terse elite squadmate. Use tactical jargon referencing positioning, angles, and utility. Maximum 12 words.',
};

// Composite score: K/D 30%, damage 20%, accuracy 20%, survival 20%, revives 10%.
// Inputs are normalized against hackathon-friendly ceilings, keeping the score readable.
export function buildSkillSync(profile) {
  const score = Math.round((
    Math.min(profile.kd_ratio / 4, 1) * 30
    + Math.min(profile.avg_damage / 600, 1) * 20
    + Math.min(profile.accuracy / 75, 1) * 20
    + Math.min(profile.survival_time / 1800, 1) * 20
    + Math.min(profile.revive_count / 4, 1) * 10
  ));
  const tier = score < 40 ? 'beginner' : score < 70 ? 'intermediate' : 'pro';
  const configs = {
    beginner: { aimAccuracy: 0.48, reactionDelayMs: 720, aggressionLevel: 'passive', calloutComplexity: 'simple', followDistance: 100 },
    intermediate: { aimAccuracy: 0.68, reactionDelayMs: 460, aggressionLevel: 'balanced', calloutComplexity: 'tactical', followDistance: 82 },
    pro: { aimAccuracy: 0.86, reactionDelayMs: 240, aggressionLevel: 'aggressive', calloutComplexity: 'advanced', followDistance: 62 },
  };
  return { score, tier, ...configs[tier], systemPrompt: tierPrompts[tier] };
}

export { tierPrompts };