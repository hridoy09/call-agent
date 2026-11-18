# Guava Voice Desk

A local Next.js application for testing real Guava browser calls and a customer intake agent. Uses your supplied public WebRTC code, phone number and SIP code. The API key stays on the agent process, never in browser code.

## Start

Requires Node.js 22.13 or newer and npm.

```powershell
npm install
Copy-Item .env.example .env.local
```

Edit `.env.local` and replace `replace-with-a-new-key` with a fresh Guava API key. Rotate the key previously shared in chat. Do not prefix the API key with `NEXT_PUBLIC_`.

Start the website:

```powershell
npm run dev
```

Open http://localhost:3000. In a second terminal, in this same project directory, start the customer intake agent:

```powershell
npm run agent
```

Click **Start a test call** and allow microphone access. Use Chrome or Edge with headphones. Alternatively dial **+1 (267) 747-0494** from a phone. Telephone/carrier charges and Guava usage limits apply; the app does not change your billing plan.

The agent listens to WebRTC, phone and SIP with Guava Runner. These channels must belong to the account used by your key and must not already be occupied by another agent. To test only browser calls, set `GUAVA_CHANNELS=webrtc` in `.env.local`. Add `phone` or `sip` separated by commas as needed. Phone number and SIP are separate listeners; the app does not change provider-side routing or claim the number is configured.

## What is implemented

- Browser calls through the official `@guava-ai/guava-sdk/webrtc` client, with connection states, a timer, errors, and hangup.
- An intake agent that introduces itself as AI, requests permission, collects name, callback number and request, and asks for confirmation.
- Confirmed task results saved in `data/records.jsonl`. The page polls `/api/records` every three seconds and shows the newest 100 records. Calls handled by a different hosted agent do not populate this file.
- Local agent readiness from the SDK health endpoint. The app never pretends the agent is ready just because the page loaded.
- A prompt asking the agent to use the caller’s language. Bangla voice/recognition support must be tested with Guava; a prompt alone does not guarantee language quality.

Keep both processes open while testing. Stop them with Ctrl+C. This is a local demo: records are stored on disk without accounts or encryption, and are not a production CRM. The dev server binds to loopback. Add authentication, access controls and durable storage before deploying to a shared environment.

## Verify

```powershell
npm run typecheck
npm run build
```

## Troubleshooting

- Agent not running: set a fresh key in `.env.local` and run `npm run agent`.
- Agent not ready: check channel ownership and stop any competing hosted agent, or narrow `GUAVA_CHANNELS`.
- Call does not connect: check your WebRTC code has not expired and that the agent is listening to it. This demo assumes a public WebRTC code; token-protected codes need backend-issued client tokens.
- Microphone denied: allow the microphone in browser site settings. Use localhost or HTTPS.
- Phone call does not reach the agent: confirm the number and routing in the Guava dashboard. Browser and telephone availability are independent.

Official docs: https://docs.goguava.ai/guides/webrtc-calls and https://docs.goguava.ai/getting-started/quickstart
