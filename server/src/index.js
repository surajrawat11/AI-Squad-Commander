import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import calloutRoute from '../routes/callout.js';
import briefingRoute from '../routes/briefing.js';

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());
app.get('/api/health', (_request, response) => response.json({ ok: true, service: 'ai-squad-commander' }));
app.use('/api/callout', calloutRoute);
app.use('/api/briefing', briefingRoute);

const port = Number(process.env.PORT || 3001);
app.listen(port, () => console.log(`AI Squad Commander API listening on ${port}`));