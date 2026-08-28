import { Router } from 'express';
import { getBriefing } from '../services/tavilyService.js';

const router = Router();
router.get('/', async (request, response) => response.json({ briefing: await getBriefing(request.query.tier || 'intermediate') }));
export default router;