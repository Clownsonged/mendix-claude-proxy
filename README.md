# mendix-claude-proxy

A lightweight TypeScript/Express proxy server that forwards requests from a Mendix Studio Pro extension to the Anthropic Claude API. Keeps your API key secure on the server rather than inside the extension.

## How it works

```
Mendix Extension → POST /ask-claude → This Server → Anthropic API
                ← { reply: "..." } ←              ←
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check — returns `{ status: "ok" }` |
| POST | `/ask-claude` | Send messages to Claude, get a reply |

### POST /ask-claude

**Request body:**
```json
{
  "messages": [
    { "role": "user", "content": "Hello!" }
  ],
  "system": "Optional system prompt",
  "max_tokens": 1024
}
```

**Response:**
```json
{
  "reply": "Hello! How can I help you?",
  "input_tokens": 10,
  "output_tokens": 12
}
```

---

## Running locally

### Prerequisites
- Node.js 20+
- An Anthropic API key from [console.anthropic.com](https://console.anthropic.com)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Create your .env file
cp .env.example .env
# Then edit .env and add your ANTHROPIC_API_KEY

# 3. Start in dev mode (auto-restarts on changes)
npm run dev
```

The server will be available at `http://localhost:3000`.

---

## Running with Docker

```bash
# 1. Create your .env file
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# 2. Build and start
docker compose up --build

# 3. Run in background
docker compose up -d --build
```

---

## Deploying to Portainer

1. Push this repo to GitHub
2. In Portainer, go to **Stacks → Add stack**
3. Choose **Repository** and point it at your GitHub repo
4. Under **Environment variables**, add `ANTHROPIC_API_KEY` with your key
5. Deploy

To expose the server externally, set up a Cloudflare Tunnel pointing at `localhost:3000`.

---

## Calling from your Mendix extension

```typescript
const response = await fetch("https://your-server-url/ask-claude", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
        messages: [{ role: "user", content: userInput }]
    })
});

const { reply } = await response.json();
```

---

## Environment variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | ✅ | — | Your Anthropic API key |
| `PORT` | ❌ | `3000` | Port the server listens on |
| `ALLOWED_ORIGIN` | ❌ | `*` | CORS origin — restrict in production |