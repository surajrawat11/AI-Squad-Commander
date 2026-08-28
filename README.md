# AI Squad Commander

AI Squad Commander is a browser-based top-down shooter prototype for an AI x Gaming hackathon. Pick a mock previous-raid profile, receive a grounded commander briefing, then test whether an AI teammate adapts its combat posture and communication style to you.

## Run It

Requirements: Node.js 18+ and npm.

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

## Judge Demo Path

Choose Beginner, read the Intel Briefing, and deploy. Move with `WASD` or arrow keys and fire with `Space` or mouse click. The AI follows cautiously, uses simple encouraging calls, and reliably moves to revive the player after the scripted 10-second down event. Restart the browser, choose Pro, and repeat: the teammate follows more aggressively, reacts faster, aims better, and uses terse tactical terminology.

## Skill Sync

`server/services/skillSync.js` is the centerpiece. It normalizes five mock raid statistics into one composite score: K/D 30%, average damage 20%, accuracy 20%, survival time 20%, and revive count 10%. The score maps to Beginner, Intermediate, or Pro. Each tier returns combat settings (aim accuracy, reaction delay, follow distance, aggression) and a tier-specific Groq system prompt.

This makes the contrast explainable in under a minute: the same teammate abstraction receives a different configuration, so both its decisions and voice adapt to the selected player history.

## Groq And Tavily

- Groq powers short in-combat callouts through `POST /api/callout`. Requests cap output at 30 tokens and use a 2.6-second server timeout. The HUD shows `COMMANDER is thinking...` while the request is pending, then logs the returned line.
- Tavily powers one pre-match search through `GET /api/briefing?tier=...`, searching generic cover and rotation strategy concepts. The result is cached per tier and rewritten by Groq before the game displays it; raw search text is never shown. It has the same timeout and a hardcoded tier fallback.
- Missing keys, API errors, timeouts, or `OFFLINE_MODE=true` all return local fallback lines. Combat never waits on Tavily.

## Project Map

The Phaser client lives in `client/src` with scenes, entities, combat, HUD, profile data, and the backend callout client separated by responsibility. The Express API lives in `server` with routes, services, and fallback JSON. There is no database; profiles, session cache, and match state are in memory.

## Future Scope

- Track real player performance through a game backend instead of mock profiles.
- Expand Tavily into carefully cached live meta-analysis between matches.
- Offer matchmaking-as-a-service and adaptive squad intelligence as a studio integration pitch.