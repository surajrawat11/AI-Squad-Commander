# AI Squad Commander

AI Squad Commander is a browser-based top-down shooter prototype for an AI x Gaming hackathon. Pick a mock previous-raid profile, receive a grounded commander briefing, then test whether an AI teammate adapts its combat posture and communication style to you.

## Run It

Requirements: Node.js 20+ and npm.

1. Install all dependencies from the repository root:

	```powershell
	npm run install:all
	```

2. Create a local environment file. Keep it out of Git:

	```powershell
	Copy-Item .env.example .env
	```

	Add `GROQ_API_KEY` and `TAVILY_API_KEY` to `.env`. Keys are used only by the server. Set `OFFLINE_MODE=true` for a venue without reliable Wi-Fi; the game will use the same deterministic fallback experience without external calls.

3. Start the client and server together:

	```powershell
	npm run dev
	```

	Open `http://localhost:5173`.

The server can also be run alone with `npm start`, and the client production bundle can be checked with `npm run build`.

`VITE_API_BASE_URL` is read at client build time. It should be the full API prefix, including `/api`, for example `https://ai-squad-commander-api.onrender.com/api`. If it is omitted locally, the client uses `http://localhost:3001/api`.

## Public Deployment

Deploy the API and frontend as two services. The frontend is a static Vite build on Vercel; the Express API runs as a Node web service on Render.

### 1. Push the repository

From the repository root:

```powershell
git pull origin main
git status --short --branch
git push origin main
```

### 2. Deploy the server to Render

In Render, choose **New + > Web Service**, connect the GitHub repository, and use:

- Root Directory: `server`
- Runtime: `Node`
- Build Command: `npm install`
- Start Command: `npm start`
- Instance type: Free is sufficient for a demo, but it may sleep when idle

Add these environment variables in the Render dashboard. Never put the real values in GitHub or source code:

```text
GROQ_API_KEY=your_real_groq_key
TAVILY_API_KEY=your_real_tavily_key
OFFLINE_MODE=false
CLIENT_ORIGINS=http://localhost:5173,https://your-vercel-project.vercel.app
```

Render supplies `PORT` automatically. After the first deploy, copy the service URL, such as `https://ai-squad-commander-api.onrender.com`.

Verify the server before deploying the client:

```powershell
Invoke-RestMethod https://ai-squad-commander-api.onrender.com/api/health
Invoke-RestMethod "https://ai-squad-commander-api.onrender.com/api/briefing?tier=beginner"
Invoke-RestMethod -Method Post `
	-Uri https://ai-squad-commander-api.onrender.com/api/callout `
	-ContentType "application/json" `
	-Body '{"eventType":"enemy_spotted","tier":"beginner"}'
```

### 3. Deploy the client to Vercel

In Vercel, choose **Add New > Project**, import the same GitHub repository, and set:

- Root Directory: `client`
- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`

Add this Vercel environment variable before deploying:

```text
VITE_API_BASE_URL=https://ai-squad-commander-api.onrender.com/api
```

The included `client/vercel.json` routes direct browser requests to the Vite entry page. Copy the resulting Vercel URL and add that exact origin to Render's `CLIENT_ORIGINS` value, separated by commas if you also need local development. Redeploy Render after changing its environment variable, then redeploy Vercel if its API URL changes.

### 4. Production smoke test

Open the Vercel URL and test the complete path:

1. Lobby loads without a console error.
2. Beginner and Pro profiles show different Skill Sync settings.
3. Intel briefing appears after the Render service wakes from sleep.
4. Deploy enters the playable arena.
5. Movement, aiming, shooting, cover, AI behavior, downed state, revive, reinforcements, and restart work.

Test CORS from PowerShell using the deployed frontend origin:

```powershell
Invoke-WebRequest `
	-Uri https://ai-squad-commander-api.onrender.com/api/health `
	-Headers @{ Origin = "https://your-vercel-project.vercel.app" }
```

The response should include `Access-Control-Allow-Origin` for the Vercel origin. If it does not, update `CLIENT_ORIGINS` in Render to match the Vercel URL exactly, without a trailing slash.

### 5. Offline and cold-start safety

The client has a 2.5-second request deadline and local fallback briefing/callout text. A sleeping Render service may cause the first briefing to fall back while the game remains playable; later requests can use the API once Render wakes. To run the deployed API without provider calls, set `OFFLINE_MODE=true` in Render and remove the provider keys. To test the complete no-key path locally:

```powershell
$env:OFFLINE_MODE = "true"
Remove-Item Env:GROQ_API_KEY -ErrorAction SilentlyContinue
Remove-Item Env:TAVILY_API_KEY -ErrorAction SilentlyContinue
npm start
```

The Phaser game does not require the API to move, shoot, revive, or finish a match. The server keys are never bundled into the Vercel client.

## Judge Demo Path

Choose Beginner, read the Intel Briefing, and deploy. Move with `WASD` or arrow keys and fire with `Space` or mouse click. The AI follows cautiously, uses simple encouraging calls, and reliably moves to revive the player after the scripted 10-second down event. Restart the browser, choose Pro, and repeat: the teammate follows more aggressively, reacts faster, aims better, and uses terse tactical terminology.

## Skill Sync

`server/services/skillSync.js` is the centerpiece. It normalizes five mock raid statistics into one composite score: K/D 30%, average damage 20%, accuracy 20%, survival time 20%, and revive count 10%. The score maps to Beginner, Intermediate, or Pro. Each tier returns `{ aimAccuracy, reactionDelayMs, aggressionLevel, calloutComplexity }`, a follow distance, and a tier-specific Groq system prompt.

This makes the contrast explainable in under a minute: the same teammate abstraction receives a different configuration, so both its decisions and voice adapt to the selected player history.

## Groq And Tavily

- Groq powers short in-combat callouts through `POST /api/callout`. Requests cap output at 30 tokens and use a hard 2.5-second server timeout. The HUD shows `COMMANDER is thinking...` while the request is pending, then logs the returned line.
- Tavily powers one pre-match search through `GET /api/briefing?tier=...`, searching generic cover and rotation strategy concepts. The result is cached per tier and rewritten by Groq before the game displays it; raw search text is never shown. It has the same 2.5-second timeout and a hardcoded tier fallback.
- Missing keys, API errors, timeouts, or `OFFLINE_MODE=true` all return local fallback lines. Combat never waits on Tavily.

## Project Map

The Phaser client lives in `client/src` with scenes, entities, combat, HUD, profile data, and the backend callout client separated by responsibility. The Express API lives in `server` with routes, services, and fallback JSON. There is no database; profiles, session cache, and match state are in memory.

## Future Scope

- Track real player performance through a game backend instead of mock profiles.
- Expand Tavily into carefully cached live meta-analysis between matches.
- Offer matchmaking-as-a-service and adaptive squad intelligence as a studio integration pitch.