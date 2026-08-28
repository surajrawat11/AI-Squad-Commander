import { Router } from 'express';
import { generateCallout } from '../services/groqService.js';

const router = Router();
router.post('/', async (request, response) => {
  const { eventType, tier = 'intermediate', state } = request.body || {};
  response.json({ callout: await generateCallout({ eventType, tier, state }) });
});
export default router;