import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import calloutRoute from '../routes/callout.js';
import briefingRoute from '../routes/briefing.js';

const app = express();
const allowedOrigins = (process.env.CLIENT_ORIGINS || process.env.CLIENT_ORIGIN || 'http://localhost:5173')
	.split(',').map((origin) => origin.trim().replace(/\/$/, '')).filter(Boolean);
app.use(cors({ origin: (origin, callback) => {
	if (!origin || allowedOrigins.includes(origin.replace(/\/$/, ''))) return callback(null, true);
	return callback(new Error('Origin not allowed by CORS'));
} }));
app.use(express.json({ limit: '16kb' }));
app.get('/api/health', (_request, response) => response.json({ ok: true, service: 'ai-squad-commander' }));
app.use('/api/callout', calloutRoute);
app.use('/api/briefing', briefingRoute);

const port = Number(process.env.PORT || 3001);
app.listen(port, () => console.log(`AI Squad Commander API listening on ${port}`));