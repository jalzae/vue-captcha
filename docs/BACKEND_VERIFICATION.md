# 🔐 Backend Verification — Server-Side Captcha Validation

## Problem

Current `verifyHuman()` is client-only. Returns `boolean`. Backend has zero knowledge captcha happened.

**Bypasses:**
- Skip `verifyHuman()` call entirely — POST directly to API
- Monkey-patch: `verifyHuman = () => Promise.resolve(true)`
- Console: override `onSuccess` callback
- Scraping tools ignore frontend JS entirely

**Fix:** Server must issue, sign, and validate a token. Frontend only *proves human effort*. Server *accepts or rejects*.

---

## Architecture

```
┌─────────┐    1. GET /captcha/challenge     ┌─────────────┐
│  Client │ ────────────────────────────────▶ │   Backend   │
│ (Vue)   │ ◀──────────────────────────────── │   Server    │
│         │    2. { challengeId, puzzleData }  │             │
│         │                                   │             │
│  ┌───┐  │    3. User solves game             │             │
│  │Vue│  │    4. POST /captcha/verify          │             │
│  │Cpt│  │ ────────────────────────────────▶ │             │
│  │cha│  │    { challengeId, answer, proof }  │             │
│  └───┘  │ ◀──────────────────────────────── │             │
│         │    5. { token: "jwt.hmac.sig" }   │             │
│         │                                   │             │
│         │    6. POST /api/protected         │             │
│         │ ────────────────────────────────▶ │             │
│         │    Authorization: Bearer <token>    │             │
│         │                                   │             │
│         │ ◀──────────────────────────────── │             │
│         │    7. 200 OK or 403 Forbidden      │             │
└─────────┘                                   └─────────────┘
```

---

## Token Design

### Option A: Signed JWT (Stateless — recommended)

No DB needed. Server signs token with HMAC secret. Validate by verifying signature.

```js
// server.js — using jose or jsonwebtoken
import { SignJWT, jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(process.env.CAPTCHA_SECRET)

// Issue token after successful solve
async function issueCaptchaToken(challengeId) {
  return await new SignJWT({
    cid: challengeId,
    scope: 'captcha-verified',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('5m')           // short-lived
    .setJti(crypto.randomUUID())       // one-time use tracking (optional)
    .sign(SECRET)
}

// Validate token on protected endpoints
async function validateCaptchaToken(token) {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload.scope === 'captcha-verified'
  } catch {
    return false                      // expired, tampered, or invalid
  }
}
```

**Middleware:**
```js
// Express/Connect example
function requireCaptcha(req, res, next) {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing captcha token' })

  const token = auth.slice(7)
  validateCaptchaToken(token).then(valid => {
    if (!valid) return res.status(403).json({ error: 'Invalid captcha' })
    next()
  })
}

app.post('/api/submit', requireCaptcha, (req, res) => {
  // Only reachable if captcha token is valid
  res.json({ success: true })
})
```

### Option B: DB-backed challenge (Stateful)

Better for replay protection and rate limiting per challenge.

```sql
CREATE TABLE captcha_challenges (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  puzzle_data JSONB NOT NULL,          -- encrypted puzzle params
  answer      TEXT NOT NULL,           -- correct answer hash
  created_at  TIMESTAMPTZ DEFAULT now(),
  expires_at  TIMESTAMPTZ DEFAULT now() + interval '5 minutes',
  used        BOOLEAN DEFAULT false
);
```

```js
// 1. Issue challenge
app.get('/captcha/challenge', async (req, res) => {
  const id = crypto.randomUUID()
  const puzzle = generatePuzzle()         // your game logic
  const answerHash = await hash(puzzle.answer + process.env.PEPPER)

  await db.query(
    'INSERT INTO captcha_challenges (id, puzzle_data, answer, expires_at) VALUES ($1, $2, $3, now() + interval \'5 minutes\')',
    [id, JSON.stringify(puzzle.public), answerHash]
  )

  res.json({ challengeId: id, puzzle: puzzle.public })
})

// 2. Verify answer
app.post('/captcha/verify', async (req, res) => {
  const { challengeId, answer } = req.body
  const row = await db.query(
    'SELECT * FROM captcha_challenges WHERE id = $1 AND used = false AND expires_at > now()',
    [challengeId]
  )

  if (!row.rows[0]) return res.status(400).json({ error: 'Invalid or expired challenge' })

  const answerHash = await hash(answer + process.env.PEPPER)
  if (answerHash !== row.rows[0].answer) {
    return res.status(400).json({ error: 'Wrong answer' })
  }

  // Mark used (single-use)
  await db.query('UPDATE captcha_challenges SET used = true WHERE id = $1', [challengeId])

  // Issue short-lived token
  const token = await issueCaptchaToken(challengeId)
  res.json({ token })
})
```

---

## Integration with `@jalzae/vue-captcha`

### What needs to change

Currently `onResult(success: boolean)` — no token emitted. Need to:

1. **Server generates challenge + puzzle data**
2. **Frontend receives challenge, renders game**
3. **On success, frontend sends answer to server**
4. **Server validates, returns signed token**
5. **Frontend stores token, sends with subsequent API calls**

### Proposed API changes to the library

```typescript
// New: verifyHuman with server validation
export interface ServerVerifyOptions {
  challengeEndpoint: string       // GET — returns challenge data
  verifyEndpoint: string          // POST — sends answer, returns token
}

export async function verifyHumanServer(options: ServerVerifyOptions): Promise<{
  success: boolean
  token?: string                   // signed JWT from server
  error?: string
}>
```

### Usage in consumer app

```vue
<script setup>
import { verifyHumanServer } from '@jalzae/vue-captcha'

const token = ref(null)
const loading = ref(false)

const handleVerify = async () => {
  loading.value = true
  const result = await verifyHumanServer({
    challengeEndpoint: '/api/captcha/challenge',
    verifyEndpoint: '/api/captcha/verify',
  })

  if (result.success) {
    token.value = result.token       // store for API calls
  }
  loading.value = false
}

const submitForm = async () => {
  if (!token.value) return

  const res = await fetch('/api/submit', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token.value}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formData),
  })

  if (res.status === 403) {
    // Token expired or invalid — re-verify
    token.value = null
    await handleVerify()
  }
}
</script>
```

---

## Security Checklist

| Layer | What | Why |
|-------|------|-----|
| **HTTPS only** | All captcha endpoints over TLS | Prevent MITM token theft |
| **Short TTL** | Token expires in 5 min | Reduce replay window |
| **Single-use** | Mark challenge used after verify | Prevent replay |
| **HMAC secret** | Server-side only, env var | Prevent token forgery |
| **CORS** | Lock challenge/verify to your origin | Prevent cross-origin abuse |
| **Rate limit** | Max N challenges per IP/min | Prevent brute-force answers |
| **Answer hashing** | Store answer hash, not plaintext | DB leak = no answer exposure |
| **Pepper** | Add server-secret to answer hash | Prevent rainbow table attacks |
| **Proof of work** | Include solve timing, mouse trajectory | Optional: server-side bot scoring |

---

## Implementation Roadmap

### Phase 1 — Minimal server integration (JWT)

1. Add `verifyHumanServer()` to `src/index.js`
2. Fetch challenge from server endpoint → pass puzzle data to modal
3. On game success → POST answer to server → receive token
4. Return `{ success, token }` to caller
5. Consumer sends token in `Authorization` header

### Phase 2 — Game-specific challenge data

Each game generates puzzle data client-side today. Move to server:

| Game | Server generates | Client receives |
|------|-----------------|-----------------|
| ImageGame | `answer` (the number), noise seed | Canvas renders with seed |
| DiceGame | Pre-computed roll result | Client animates to known result |
| HorseRace | All horse speeds (seeded RNG) | Client animates identically |
| WordScramble | Word + scrambled variant | Displays both |
| ColorMatch | Word + ink color combo | Displays both |
| ReactionTimer | Target delay + position | Client uses server values |
| PatternCopy | Pattern indices | Client shows then hides |
| ConnectDots | Dot coordinates + order | Client renders |
| DragDrop | Correct ordering | Client shuffles from known order |
| SpotDifference | Diff coordinates + original | Client renders both |

Key insight: server knows the answer before client renders anything. Client cannot cheat because answer comes from server.

### Phase 3 — Hardening

- Challenge rotation (discard unused after 5 min)
- Per-IP rate limiting
- Device fingerprinting correlation
- Graduated difficulty (harder puzzles on repeated requests)
- Token refresh flow (re-verify when token expires mid-session)

---

## Quick Start: Minimal Backend (Node.js + Express)

```bash
npm install express jose
```

```js
// server.js
import express from 'express'
import { SignJWT, jwtVerify } from 'jose'

const app = express()
app.use(express.json())

const SECRET = new TextEncoder().encode(process.env.CAPTCHA_SECRET || 'change-me-in-production')

// Challenge store (in-memory for demo — use Redis/DB in production)
const challenges = new Map()

// 1. Issue challenge
app.get('/api/captcha/challenge', (req, res) => {
  const id = crypto.randomUUID()

  // Generate puzzle — example: math challenge
  const a = Math.floor(Math.random() * 20) + 1
  const b = Math.floor(Math.random() * 20) + 1
  const answer = a + b

  challenges.set(id, {
    answer: String(answer),
    expiresAt: Date.now() + 5 * 60 * 1000,
    used: false,
  })

  // Clean old challenges
  for (const [key, val] of challenges) {
    if (val.expiresAt < Date.now()) challenges.delete(key)
  }

  res.json({ challengeId: id, puzzle: { question: `${a} + ${b}` } })
})

// 2. Verify answer → issue token
app.post('/api/captcha/verify', async (req, res) => {
  const { challengeId, answer } = req.body
  const challenge = challenges.get(challengeId)

  if (!challenge || challenge.used || challenge.expiresAt < Date.now()) {
    return res.status(400).json({ error: 'Invalid challenge' })
  }

  if (answer !== challenge.answer) {
    return res.status(400).json({ error: 'Wrong answer' })
  }

  challenge.used = true

  const token = await new SignJWT({ scope: 'captcha-verified' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(SECRET)

  res.json({ token })
})

// 3. Protected endpoint
app.post('/api/submit', async (req, res) => {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' })

  try {
    const { payload } = await jwtVerify(auth.slice(7), SECRET)
    if (payload.scope !== 'captcha-verified') return res.status(403).json({ error: 'Bad scope' })
  } catch {
    return res.status(403).json({ error: 'Invalid token' })
  }

  res.json({ success: true, message: 'Captcha verified — processing request' })
})

app.listen(3000)
```

---

## What this fixes vs what it doesn't

| Attack | Before (client-only) | After (server-validated) |
|--------|---------------------|-------------------------|
| Skip captcha call | ✅ Bypassed | ❌ Blocked (no token = 403) |
| `resolve(true)` monkey-patch | ✅ Bypassed | ❌ Blocked (fake token rejected) |
| Intercept callback | ✅ Bypassed | ❌ Blocked (server never issued token) |
| Replay same answer | N/A | ❌ Blocked (single-use challenge) |
| Token replay | N/A | ❌ Blocked (5 min TTL) |
| Token forgery | N/A | ❌ Blocked (HMAC signed) |
| Selenium/Puppeteer solving | ✅ Works | ⚠️ Still works (bot can actually solve) |
| Manual human with devtools open | ✅ Works | ✅ Still works (legitimate) |

**Bottom line:** Server validation prevents *automated bypass*. It doesn't prevent a bot that *actually solves* the puzzle — that's what the game difficulty handles. The two layers (hard puzzles + server tokens) are complementary.
