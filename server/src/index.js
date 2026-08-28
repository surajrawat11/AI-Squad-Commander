import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());
app.get('/api/health', (_request, response) => response.json({ ok: true, service: 'ai-squad-commander' }));

const port = Number(process.env.PORT || 3001);
app.listen(port, () => console.log(`AI Squad Commander API listening on ${port}`));