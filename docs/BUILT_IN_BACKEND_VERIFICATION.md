# 🖥️ Built-in Backend Verification — Can This Library Handle It?

## TL;DR

**Yes, for Nuxt apps.** This is a Nuxt module — it can ship server-side utilities via `server/` directory. No separate BE project needed.

**For plain Vue (no Nuxt):** You still need your own backend. The library stays frontend-only for Vue standalone. But we can ship a lightweight standalone server package.

---

## Current State

This library (`@jalzae/vue-captcha`) is built as:

```
src/
  module.ts                    # Nuxt module definition
  index.js                     # verifyHuman() — Vue standalone entry
  HumanVerifyModal.vue         # Modal shell
  games/                       # 10 game components
  runtime/
    composables/useVerifyHuman.ts
    plugins/verify-human.ts
```

Nuxt modules can ship **server code**. The `server/` directory is auto-registered by Nuxt. This is how auth modules (NuxtAuth), session modules, and API-layer modules work.

---

## Approach A: Built-in Nuxt Server Utils (Recommended)

Add server-side code inside this library. Nuxt auto-registers it.

### New directory structure

```
src/
  module.ts                          # add server/ registration
  server/
    utils/
      captcha-challenge.ts           # generate challenge + answer
      captcha-token.ts               # issue/verify JWT tokens
    api/
      captcha/
        challenge.get.ts            # GET /api/captcha/challenge
        verify.post.ts               # POST /api/captcha/verify
    middleware/
      captcha.ts                     # verify token on protected routes
  runtime/
    composables/
      useVerifyHuman.ts              # existing (keep for backward compat)
      useVerifyHumanServer.ts       # NEW — calls server endpoints
    plugins/
      verify-human.ts                # existing (keep)
```

### How it works

```
Consumer's nuxt.config.ts:
  modules: ['@jalzae/vue-captcha']

Nuxt auto-registers:
  - src/server/api/captcha/challenge.get.ts  →  GET /_captcha/challenge
  - src/server/api/captcha/verify.post.ts    →  POST /_captcha/verify
  - src/server/middleware/captcha.ts          →  available for route protection
  - src/runtime/composables/useVerifyHumanServer.ts → auto-imported

Consumer does:
  const { token, success } = await verifyHumanServer()
  // token automatically sent with API calls
```

### Module config changes

```typescript
// src/module.ts — expanded options
export interface ModuleOptions {
  autoImports?: boolean
  addPlugin?: boolean

  // NEW: server-side config
  server?: {
    enabled?: boolean                // enable server endpoints (default: false)
    secret?: string                  // JWT HMAC secret (default: process.env.CAPTCHA_SECRET)
    tokenTTL?: string                // e.g. '5m', '10m' (default: '5m')
    prefix?: string                  // API prefix (default: '/_captcha')
    difficulty?: 'easy' | 'medium' | 'hard'  // game difficulty
  }
}

// In setup():
if (options.server?.enabled) {
  // Register server middleware from library's server/ dir
  nuxt.hook('nitro:config', (nitroConfig) => {
    const { resolve } = createResolver(import.meta.url)
    nitroConfig.handlers = nitroConfig.handlers || []
    // Auto-register server utils and API routes
    nitroConfig.externals = nitroConfig.externals || {}
    // Nuxt resolves src/server/ automatically for modules
  })
}
```

### Server API handler — challenge

```typescript
// src/server/api/captcha/challenge.get.ts
import { defineEventHandler, getQuery } from 'h3'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const secret = config.captchaSecret || process.env.CAPTCHA_SECRET

  // Generate puzzle server-side
  const challengeId = crypto.randomUUID()
  const gameType = pickRandomGame()

  const puzzle = generateChallenge(gameType)  // server-side puzzle generation
  const answer = puzzle.answer                 // answer stays on server

  // Store challenge (in-memory or Redis)
  const store = useStorage('captcha')
  await store.setItem(`challenge:${challengeId}`, {
    answer,
    gameType,
    createdAt: Date.now(),
    used: false,
  }, { ttl: 300 })  // 5 min TTL

  // Return only what client needs to render (no answer)
  return {
    challengeId,
    gameType,
    puzzle: puzzle.publicData,    // everything EXCEPT the answer
  }
})
```

### Server API handler — verify

```typescript
// src/server/api/captcha/verify.post.ts
import { defineEventHandler, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const { challengeId, answer } = await readBody(event)
  const config = useRuntimeConfig(event)

  const store = useStorage('captcha')
  const challenge = await store.getItem(`challenge:${challengeId}`)

  if (!challenge || challenge.used) {
    throw createError({ statusCode: 400, message: 'Invalid challenge' })
  }

  if (answer !== challenge.answer) {
    throw createError({ statusCode: 400, message: 'Wrong answer' })
  }

  // Mark used
  await store.setItem(`challenge:${challengeId}`, { ...challenge, used: true })

  // Issue JWT
  const token = await signToken({
    scope: 'captcha-verified',
    challengeId,
  }, config.captchaSecret, { expiresIn: '5m' })

  return { success: true, token }
})
```

### Server middleware — protect routes

```typescript
// src/server/middleware/captcha.ts
import { defineEventHandler, getHeader, createError } from 'h3'

// Only applies to routes with routeRules: { captcha: true }
export default defineEventHandler(async (event) => {
  const routeRules = event.context.matchedRoute?.meta?.captcha
  if (!routeRules) return  // skip non-protected routes

  const auth = getHeader(event, 'authorization')
  if (!auth?.startsWith('Bearer ')) {
    throw createError({ statusCode: 401, message: 'Captcha token required' })
  }

  const valid = await verifyToken(auth.slice(7), useRuntimeConfig(event).captchaSecret)
  if (!valid) {
    throw createError({ statusCode: 403, message: 'Invalid or expired captcha' })
  }
})
```

### Consumer usage

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@jalzae/vue-captcha'],
  captcha: {
    server: {
      enabled: true,
      secret: process.env.CAPTCHA_SECRET,
      tokenTTL: '5m',
      difficulty: 'medium',
    }
  },
  runtimeConfig: {
    captchaSecret: process.env.CAPTCHA_SECRET,
  },
  routeRules: {
    '/api/submit': { captcha: true },         // protected
    '/api/admin/**': { captcha: true },        // wildcard protected
    '/api/public': { captcha: false },         // explicitly unprotected
  }
})
```

```vue
<!-- In any page/component — auto-imported -->
<script setup>
const { verify, token, isVerifying, error } = await useVerifyHumanServer()

async function submitForm() {
  const result = await verify()
  if (!result.success) return

  // token is automatically stored
  // send with request
  const res = await $fetch('/api/submit', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token.value}` },
    body: formData,
  })
}
</script>
```

---

## Approach B: Lightweight Standalone Server (For Vue non-Nuxt)

Ship a separate entry point that consumers can mount on their existing Express/Fastify/Hono server.

```typescript
// src/server/index.ts — standalone captcha server middleware
import { Router } from 'express'

export interface CaptchaServerOptions {
  secret: string
  storage?: StorageAdapter         // default: in-memory Map
  tokenTTL?: string                // default: '5m'
  prefix?: string                  // default: '/captcha'
}

export function createCaptchaServer(options: CaptchaServerOptions): Router {
  const router = Router()

  // GET /captcha/challenge
  router.get('/challenge', (req, res) => { /* ... */ })

  // POST /captcha/verify
  router.post('/verify', (req, res) => { /* ... */ })

  return router
}
```

Consumer mounts on their server:

```js
// consumer's server.js
import express from 'express'
import { createCaptchaServer } from '@jalzae/vue-captcha/server'

const app = express()
app.use('/api/captcha', createCaptchaServer({
  secret: process.env.CAPTCHA_SECRET,
}))

// Protected routes
app.post('/api/submit', requireCaptchaToken, handler)
```

---

## Comparison

| | A: Nuxt Built-in | B: Standalone Server | Current: Client-only |
|---|---|---|---|
| **For Nuxt apps** | ✅ Zero config | ⚠️ Works but unnecessary | ❌ Insecure |
| **For Vue standalone** | ❌ N/A | ✅ Mount on existing server | ❌ Insecure |
| **Separate BE project** | No | No | No |
| **Consumer effort** | `enabled: true` in config | Mount router | None |
| **Token validation** | Nuxt middleware | Express middleware | N/A |
| **Storage** | Nitro `useStorage` (Redis-compatible) | Injected adapter | N/A |

---

## Storage Strategy

Challenge data needs temporary storage. Options (in order of complexity):

```
Level 1: In-memory Map       → dev only, lost on restart
Level 2: Nitro useStorage   → Nuxt built-in, supports redis/lru-cache driver
Level 3: Redis              → production, multi-instance support
Level 4: Database (SQL)     → if you need audit logs + persistence
```

For Nuxt: `useStorage` with `redis` driver is the sweet spot. Works in dev (in-memory) and production (Redis).

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    storage: {
      captcha: {
        driver: 'redis',
        url: process.env.REDIS_URL,
      }
    }
  }
})
```

---

## What Needs to Move to Server

Each game currently generates its puzzle client-side. For server validation, the **answer** must be generated server-side.

| Game | Client currently does | Server must do |
|------|----------------------|----------------|
| ImageGame | Generate random number, render on canvas | Generate number → send to client for rendering only |
| DiceGame | Roll dice, animate, show result | Pre-determine result → send to client |
| HorseRace | Random speeds per frame | Seed the RNG → client replays deterministic race |
| WordScramble | Pick word, scramble | Pick word + scramble → send both |
| ColorMatch | Pick word + ink color | Pick both → send |
| ReactionTimer | Random delay + position | Generate delay + position → send |
| PatternCopy | Random pattern indices | Generate pattern → send |
| ConnectDots | Random positions | Generate positions → send |
| DragDrop | Items + correct order | Generate → send |
| SpotDifference | Base scene + diff | Generate diff coords → send |

**Key:** Game components stay on client (canvas rendering, animations). Only the *answer* moves to server. The `onResult(true/false)` stays — but now we also call server verify endpoint.

---

## Implementation Order

### Step 1 — Server challenge/verify endpoints
Add `src/server/` with challenge generation + JWT signing.

### Step 2 — Move answer generation to server
Each game gets a `generateChallenge()` function on server side. Returns `{ publicData, answer }`.

### Step 3 — New composable `useVerifyHumanServer()`
Calls server endpoints instead of purely client-side `verifyHuman()`.

### Step 4 — Nuxt middleware for route protection
Auto-protect routes flagged with `captcha: true`.

### Step 5 — Backward compatibility
Keep `verifyHuman()` working as-is (client-only mode). `server.enabled: false` = current behavior.

### Step 6 — Standalone server adapter
Extract server logic into framework-agnostic middleware for Express/Fastify/Hono.

---

## Answer to Your Question

> Can this project handle backend verification?

**Yes.** Two paths:

1. **Nuxt apps** → Add `src/server/` to this library. Nuxt auto-registers it. Consumer enables with one config line. No new project.

2. **Vue standalone** → Add `createCaptchaServer()` export. Consumer mounts it on their existing Express/Fastify server. Still no new project — just a new entry point in this package.

You **don't need a separate backend project**. The verification logic is small (generate puzzle, store answer, verify answer, sign token). It fits inside this library as server middleware.
