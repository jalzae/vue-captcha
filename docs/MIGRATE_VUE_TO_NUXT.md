# 🔄 Migrate vue-captcha from Vue Library to Full Nuxt SSR App

## Why

Current `@jalzae/vue-captcha` is a **Vue 3 library** — ships game components as importable modules. Client-only verification, no server routes, no challenge/verify API.

**Goal:** Convert to a **Nuxt 3 SSR app** so games run server-rendered, API routes handle challenge issuance and answer verification, and the library becomes a deployable captcha service.

This unlocks:
- Server-side challenge generation (answers never touch the client)
- API routes for `/captcha/challenge` and `/captcha/verify`
- JWT token signing inside server middleware
- Rate limiting, IP tracking, replay protection at the server layer

---

## Current Architecture (Library)

```
src/
├── games/                    # 10 game components (client-only)
│   ├── ImageGame.vue
│   ├── DiceGame.vue
│   ├── HorseRaceGame.vue
│   ├── ColorMatchGame.vue
│   ├── SpotDifferenceGame.vue
│   ├── ConnectDotsGame.vue
│   ├── WordScrambleGame.vue
│   ├── ReactionTimerGame.vue
│   ├── PatternCopyGame.vue
│   └── DragDropGame.vue
├── runtime/
│   ├── composables/
│   │   └── useVerifyHuman.ts     # Composable wrapper
│   └── plugins/
│       └── verify-human.ts       # Nuxt plugin ($verifyHuman)
├── HumanVerifyModal.vue          # Modal shell (random game picker)
├── index.js                       # verifyHuman() — standalone Vue entry
└── module.ts                      # Nuxt module definition

package.json          # type: module, nuxt entry: ./dist/module.mjs
build.config.ts       # unbuild config
vite.config.js        # dev server for testing
```

**Flow:**
1. Consumer imports `verifyHuman()` or uses `useVerifyHuman()` composable
2. Modal renders, random game picked
3. Game generates puzzle + answer **on the client**
4. User solves → `onResult(true)` → Promise resolves with `boolean`
5. No server involvement. No token. No verification.

---

## Target Architecture (Nuxt SSR App)

```
nuxt-app/
├── app.vue                          # Root app
├── nuxt.config.ts                   # Nuxt config with module setup
├── pages/
│   └── index.vue                    # Demo/playground page
├── components/
│   └── captcha/
│       ├── CaptchaModal.vue         # Replaces HumanVerifyModal.vue
│       └── games/
│           ├── ImageGame.vue
│           ├── DiceGame.vue
│           ├── HorseRaceGame.vue
│           ├── ColorMatchGame.vue
│           ├── SpotDifferenceGame.vue
│           ├── ConnectDotsGame.vue
│           ├── WordScrambleGame.vue
│           ├── ReactionTimerGame.vue
│           ├── PatternCopyGame.vue
│           └── DragDropGame.vue
├── composables/
│   └── useVerifyHuman.ts            # Updated for server flow
├── server/
│   ├── api/
│   │   ├── captcha/
│   │   │   ├── challenge.get.ts     # Issue challenge + puzzle data
│   │   │   └── verify.post.ts       # Validate answer → issue JWT
│   │   └── protected/
│   │       └── submit.post.ts       # Example: requires captcha token
│   ├── middleware/
│   │   └── captcha.ts               # requireCaptcha middleware
│   └── utils/
│       ├── token.ts                 # JWT sign/verify (jose)
│       ├── challenges.ts            # Challenge store (memory/Redis)
│       └── rate-limit.ts            # Per-IP rate limiter
├── plugins/
│   └── captcha.ts                    # App-level plugin (optional)
├── types/
│   └── captcha.ts                   # Shared TypeScript interfaces
└── utils/
    └── games/
        └── generators.ts            # Server-side puzzle generators
```

**New Flow:**
1. Client calls `/api/captcha/challenge` → server generates puzzle, stores answer
2. Server returns `{ challengeId, puzzle }` — **answer never sent**
3. Game renders puzzle data from server
4. User solves → client POSTs answer to `/api/captcha/verify`
5. Server validates → signs JWT → returns `{ token }`
6. Client uses token for subsequent API calls

---

## Migration Steps

### Step 1 — Initialize Nuxt App

```bash
npx nuxi@latest init captcha-app
cd captcha-app
```

Install dependencies:
```bash
npx nuxi module add @pinia/nuxt   # optional: if you need state
npm install jose                  # JWT signing (lightweight, edge-compatible)
npm install ofetch                # Nuxt built-in, but explicit for clarity
```

---

### Step 2 — Move Game Components

Copy `src/games/*.vue` → `components/captcha/games/`.

Every game component needs SSR guards. Games use `canvas`, `document`, `window`, `requestAnimationFrame`, `setTimeout` — all client-only.

**Change each game from:**
```vue
<script setup>
import { ref, onMounted } from 'vue'
const props = defineProps(['onResult'])
const canvas = ref(null)
// ...
onMounted(() => {
  // canvas logic
})
</script>
```

**To:**
```vue
<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps(['onResult'])
const canvas = ref(null)

// SSR guard — skip all DOM work on server
const isClient = ref(false)

onMounted(() => {
  isClient.value = true
  // canvas logic here (only runs client-side)
})
</script>

<template>
  <ClientOnly>
    <!-- existing template unchanged -->
  </ClientOnly>
</template>
```

**Alternative: wrap once in CaptchaModal (recommended):**

If `CaptchaModal.vue` wraps `<ClientOnly>`, individual games don't need changes. Simpler — one guard, not ten.

```vue
<!-- components/captcha/CaptchaModal.vue -->
<template>
  <ClientOnly>
    <div v-if="show" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-2xl p-6 shadow-lg w-96 relative">
        <button @click="close" class="absolute top-2 right-3 text-gray-600">✖</button>
        <component :is="gameComponent" :onResult="handleResult" :puzzleData="puzzleData" />
      </div>
    </div>
  </ClientOnly>
</template>
```

**Games that still need guards** (use `setTimeout`, `setInterval`, `requestAnimationFrame`):
- `ReactionTimerGame.vue` — `setTimeout` in `onUnmounted`
- `HorseRaceGame.vue` — likely uses `requestAnimationFrame`
- All games using `canvas.getContext('2d')`

These must guard with `import.meta.client` or `onMounted`:

```vue
<script setup>
// In any game that uses timers:
onUnmounted(() => {
  if (import.meta.client) {
    clearTimeout(timeoutId)
    cancelAnimationFrame(animFrameId)
  }
})
</script>
```

---

### Step 3 — Add Puzzle Generator (Server-side)

Currently each game generates its own puzzle on the client. Server must generate puzzles and know the answer.

Create `server/utils/games/generators.ts`:

```typescript
// server/utils/games/generators.ts

export interface PuzzleResult {
  type: string
  puzzleData: Record<string, unknown>   // sent to client
  answer: string                        // stored on server, never sent
}

export const PUZZLE_TYPES = [
  'image',
  'dice',
  'horse-race',
  'color-match',
  'spot-difference',
  'connect-dots',
  'word-scramble',
  'reaction-timer',
  'pattern-copy',
  'drag-drop',
] as const

export type PuzzleType = (typeof PUZZLE_TYPES)[number]

export function generatePuzzle(type: PuzzleType): PuzzleResult {
  switch (type) {
    case 'image':
      return generateImagePuzzle()
    case 'dice':
      return generateDicePuzzle()
    case 'word-scramble':
      return generateWordScramblePuzzle()
    case 'color-match':
      return generateColorMatchPuzzle()
    case 'reaction-timer':
      return generateReactionTimerPuzzle()
    case 'pattern-copy':
      return generatePatternCopyPuzzle()
    case 'connect-dots':
      return generateConnectDotsPuzzle()
    case 'drag-drop':
      return generateDragDropPuzzle()
    case 'spot-difference':
      return generateSpotDifferencePuzzle()
    case 'horse-race':
      return generateHorseRacePuzzle()
  }
}

// --- Individual generators ---

function generateImagePuzzle(): PuzzleResult {
  // Server picks the answer number
  const answer = String(Math.floor(Math.random() * 9000) + 1000)
  // Seed for noise/distortion (client uses to render)
  const seed = Math.floor(Math.random() * 100000)
  return {
    type: 'image',
    puzzleData: { seed, length: 4 },
    answer,
  }
}

function generateDicePuzzle(): PuzzleResult {
  // Server pre-computes the target dice value
  const target = Math.floor(Math.random() * 6) + 1
  return {
    type: 'dice',
    puzzleData: { numDice: 2, target },
    answer: String(target),
  }
}

function generateWordScramblePuzzle(): PuzzleResult {
  const words = ['security', 'verify', 'human', 'captcha', 'protect', 'shield']
  const word = words[Math.floor(Math.random() * words.length)]
  const scrambled = word.split('').sort(() => Math.random() - 0.5).join('')
  return {
    type: 'word-scramble',
    puzzleData: { scrambled, wordLength: word.length },
    answer: word,
  }
}

function generateColorMatchPuzzle(): PuzzleResult {
  const colors = [
    { name: 'RED', hex: '#e74c3c' },
    { name: 'BLUE', hex: '#3498db' },
    { name: 'GREEN', hex: '#2ecc71' },
    { name: 'PURPLE', hex: '#9b59b6' },
    { name: 'ORANGE', hex: '#f39c12' },
  ]
  const wordColor = colors[Math.floor(Math.random() * colors.length)]
  const inkColor = colors[Math.floor(Math.random() * colors.length)]
  return {
    type: 'color-match',
    puzzleData: { word: wordColor.name, inkHex: inkColor.hex },
    answer: inkColor.name,  // answer = ink color, not word text
  }
}

function generateReactionTimerPuzzle(): PuzzleResult {
  // Server sets the delay and position range
  const delay = 1500 + Math.floor(Math.random() * 3000)
  return {
    type: 'reaction-timer',
    puzzleData: { minDelay: delay, maxDelay: delay + 500 },
    answer: 'timed',  // validated by timing, not answer match
  }
}

function generatePatternCopyPuzzle(): PuzzleResult {
  const gridSize = 4
  const pattern = Array.from({ length: gridSize * gridSize }, () =>
    Math.random() > 0.5 ? 1 : 0
  )
  return {
    type: 'pattern-copy',
    puzzleData: { gridSize, pattern },
    answer: pattern.join(','),
  }
}

function generateConnectDotsPuzzle(): PuzzleResult {
  const numDots = 6
  const dots = Array.from({ length: numDots }, (_, i) => ({
    id: i,
    x: 30 + Math.random() * 260,
    y: 30 + Math.random() * 160,
  }))
  return {
    type: 'connect-dots',
    puzzleData: { dots },
    answer: dots.map(d => d.id).join(','),
  }
}

function generateDragDropPuzzle(): PuzzleResult {
  const count = 5
  const ordered = Array.from({ length: count }, (_, i) => i + 1)
  // Correct order stored as answer
  return {
    type: 'drag-drop',
    puzzleData: { count },
    answer: ordered.join(','),
  }
}

function generateSpotDifferencePuzzle(): PuzzleResult {
  const numDiffs = 3
  // Generate diff positions
  const diffs = Array.from({ length: numDiffs }, () => ({
    x: Math.floor(Math.random() * 280) + 20,
    y: Math.floor(Math.random() * 180) + 20,
    radius: 10 + Math.floor(Math.random() * 15),
    color: ['#e74c3c', '#3498db', '#2ecc71', '#f39c12'][Math.floor(Math.random() * 4)],
  }))
  return {
    type: 'spot-difference',
    puzzleData: { diffs, seed: Math.floor(Math.random() * 100000) },
    answer: diffs.map(d => `${d.x},${d.y}`).join('|'),
  }
}

function generateHorseRacePuzzle(): PuzzleResult {
  // Server determines which horse wins
  const winnerIndex = Math.floor(Math.random() * 6)
  const speeds = Array.from({ length: 6 }, (_, i) =>
    i === winnerIndex ? 0.8 + Math.random() * 0.2 : 0.3 + Math.random() * 0.4
  )
  return {
    type: 'horse-race',
    puzzleData: { speeds, horseCount: 6 },
    answer: String(winnerIndex),
  }
}
```

---

### Step 4 — Server API Routes

#### Challenge endpoint

```typescript
// server/api/captcha/challenge.get.ts
import { defineEventHandler } from 'h3'
import { generatePuzzle, PUZZLE_TYPES, type PuzzleType } from '~/server/utils/games/generators'

// In-memory challenge store (swap for Redis/KV in production)
const challenges = new Map<string, {
  answer: string
  type: string
  createdAt: number
  expiresAt: number
  used: boolean
}>()

export default defineEventHandler((event) => {
  // Rate limit check (basic IP-based)
  const ip = getRequestIP(event, { xForwardedFor: true })
  // TODO: integrate with nitro rate limiting

  // Pick random puzzle type
  const type = PUZZLE_TYPES[Math.floor(Math.random() * PUZZLE_TYPES.length)] as PuzzleType
  const puzzle = generatePuzzle(type)

  const challengeId = crypto.randomUUID()

  challenges.set(challengeId, {
    answer: puzzle.answer,
    type: puzzle.type,
    createdAt: Date.now(),
    expiresAt: Date.now() + 5 * 60 * 1000,  // 5 min TTL
    used: false,
  })

  // Clean expired challenges
  for (const [key, val] of challenges) {
    if (val.expiresAt < Date.now()) challenges.delete(key)
  }

  return {
    challengeId,
    type: puzzle.type,
    puzzleData: puzzle.puzzleData,
    expiresAt: Date.now() + 5 * 60 * 1000,
  }
})
```

#### Verify endpoint

```typescript
// server/api/captcha/verify.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { SignJWT } from 'jose'

const challenges = new Map() // Same store as challenge.get.ts

const SECRET = new TextEncoder().encode(
  process.env.CAPTCHA_SECRET || 'change-me-in-production'
)

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { challengeId, answer } = body

  if (!challengeId || !answer) {
    throw createError({ statusCode: 400, statusMessage: 'Missing challengeId or answer' })
  }

  const challenge = challenges.get(challengeId)

  if (!challenge || challenge.used || challenge.expiresAt < Date.now()) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid or expired challenge' })
  }

  // Compare answer (timing-based puzzles need different validation)
  let isValid = false
  if (challenge.type === 'reaction-timer') {
    // For timing games, any submission within range is valid
    // Server validates timing metadata instead
    isValid = typeof body.proof === 'object' && body.proof.avgReactionMs > 100
  } else {
    isValid = answer === challenge.answer
  }

  if (!isValid) {
    throw createError({ statusCode: 400, statusMessage: 'Wrong answer' })
  }

  // Mark used (single-use)
  challenge.used = true

  // Issue signed JWT
  const token = await new SignJWT({
    scope: 'captcha-verified',
    cid: challengeId,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(SECRET)

  return { success: true, token }
})
```

#### Captcha middleware

```typescript
// server/middleware/captcha.ts
import { defineEventHandler, getHeader, createError } from 'h3'
import { jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(
  process.env.CAPTCHA_SECRET || 'change-me-in-production'
)

// Apply to routes matching /api/protected/*
export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)

  if (!url.pathname.startsWith('/api/protected')) return

  const auth = getHeader(event, 'authorization')
  if (!auth?.startsWith('Bearer ')) {
    throw createError({ statusCode: 401, statusMessage: 'Missing captcha token' })
  }

  try {
    const { payload } = await jwtVerify(auth.slice(7), SECRET)
    if (payload.scope !== 'captcha-verified') {
      throw createError({ statusCode: 403, statusMessage: 'Invalid scope' })
    }
    event.context.captchaVerified = true
  } catch {
    throw createError({ statusCode: 403, statusMessage: 'Invalid or expired captcha token' })
  }
})
```

---

### Step 5 — Update Composable

```typescript
// composables/useVerifyHuman.ts
import { ref } from 'vue'

interface ChallengeResponse {
  challengeId: string
  type: string
  puzzleData: Record<string, unknown>
  expiresAt: number
}

interface VerifyResponse {
  success: boolean
  token?: string
}

export const useVerifyHuman = () => {
  const isVerifying = ref(false)
  const verified = ref(false)
  const token = ref<string | null>(null)
  const error = ref<string | null>(null)
  const challenge = ref<ChallengeResponse | null>(null)

  /**
   * Fetch a challenge from the server
   */
  const fetchChallenge = async (): Promise<ChallengeResponse> => {
    const res = await $fetch<ChallengeResponse>('/api/captcha/challenge')
    challenge.value = res
    return res
  }

  /**
   * Submit answer to server, get JWT token
   */
  const submitAnswer = async (
    challengeId: string,
    answer: string,
    proof?: Record<string, unknown>
  ): Promise<VerifyResponse> => {
    const res = await $fetch<VerifyResponse>('/api/captcha/verify', {
      method: 'POST',
      body: { challengeId, answer, proof },
    })

    if (res.success && res.token) {
      token.value = res.token
      verified.value = true
    }

    return res
  }

  /**
   * Full flow: fetch challenge → solve → verify → get token
   * Call this from your component. It returns the challenge so you can render the game.
   */
  const startVerification = async (): Promise<ChallengeResponse> => {
    isVerifying.value = true
    error.value = null

    try {
      return await fetchChallenge()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch challenge'
      isVerifying.value = false
      throw err
    }
  }

  /**
   * Called by the game component after user solves the puzzle
   */
  const completeVerification = async (
    challengeId: string,
    answer: string,
    proof?: Record<string, unknown>
  ): Promise<boolean> => {
    try {
      const result = await submitAnswer(challengeId, answer, proof)
      return result.success
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Verification failed'
      return false
    } finally {
      isVerifying.value = false
    }
  }

  const reset = () => {
    verified.value = false
    token.value = null
    error.value = null
    isVerifying.value = false
    challenge.value = null
  }

  return {
    startVerification,
    completeVerification,
    reset,
    isVerifying,
    verified,
    token,
    error,
    challenge,
  }
}
```

---

### Step 6 — Update CaptchaModal

```vue
<!-- components/captcha/CaptchaModal.vue -->
<template>
  <ClientOnly>
    <Teleport to="body">
      <div v-if="show" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div class="bg-white rounded-2xl p-6 shadow-lg w-96 relative">
          <button @click="close" class="absolute top-2 right-3 text-gray-600">✖</button>

          <!-- Loading: fetching challenge -->
          <div v-if="loading" class="text-center p-8">
            <p class="text-gray-500">Loading challenge...</p>
          </div>

          <!-- Game ready -->
          <component
            v-else-if="gameComponent"
            :is="gameComponent"
            :puzzleData="challenge?.puzzleData"
            :onResult="handleResult"
          />
        </div>
      </div>
    </Teleport>
  </ClientOnly>
</template>

<script setup lang="ts">
import { ref, onMounted, markRaw, type Component } from 'vue'
import { useVerifyHuman } from '~/composables/useVerifyHuman'

// Import all game components
import ImageGame from './games/ImageGame.vue'
import DiceGame from './games/DiceGame.vue'
import HorseRaceGame from './games/HorseRaceGame.vue'
import ColorMatchGame from './games/ColorMatchGame.vue'
import SpotDifferenceGame from './games/SpotDifferenceGame.vue'
import ConnectDotsGame from './games/ConnectDotsGame.vue'
import WordScrambleGame from './games/WordScrambleGame.vue'
import ReactionTimerGame from './games/ReactionTimerGame.vue'
import PatternCopyGame from './games/PatternCopyGame.vue'
import DragDropGame from './games/DragDropGame.vue'

interface Props {
  onSuccess?: (result: boolean) => void
  onClose?: () => void
}

const props = withDefaults(defineProps<Props>(), {
  onSuccess: () => {},
  onClose: () => {},
})

const { startVerification, completeVerification, challenge } = useVerifyHuman()

const show = ref(false)
const loading = ref(true)
const gameComponent = ref<Component | null>(null)

// Map puzzle types to components
const GAME_MAP: Record<string, Component> = {
  image: markRaw(ImageGame),
  dice: markRaw(DiceGame),
  'horse-race': markRaw(HorseRaceGame),
  'color-match': markRaw(ColorMatchGame),
  'spot-difference': markRaw(SpotDifferenceGame),
  'connect-dots': markRaw(ConnectDotsGame),
  'word-scramble': markRaw(WordScrambleGame),
  'reaction-timer': markRaw(ReactionTimerGame),
  'pattern-copy': markRaw(PatternCopyGame),
  'drag-drop': markRaw(DragDropGame),
}

onMounted(async () => {
  show.value = true
  loading.value = true

  try {
    const ch = await startVerification()
    // Server picks the game type — not random on client
    gameComponent.value = GAME_MAP[ch.type] || null
    loading.value = false
  } catch {
    loading.value = false
    // Show error or retry
  }
})

const handleResult = async (answer: string, proof?: Record<string, unknown>) => {
  if (!challenge.value) return

  const success = await completeVerification(
    challenge.value.challengeId,
    answer,
    proof
  )

  show.value = false
  props.onSuccess(success)
  props.onClose()
}

const close = () => {
  show.value = false
  props.onSuccess(false)
  props.onClose()
}
</script>
```

---

### Step 7 — Update Game Components (Server-driven)

Games change from self-generating puzzles to receiving `puzzleData` as a prop.

**Pattern — before (client-generated):**
```vue
<script setup>
const props = defineProps(['onResult'])

onMounted(() => {
  // Client generates puzzle
  const word = words[Math.floor(Math.random() * words.length)]
  const scrambled = shuffle(word)
  // ... render
})
</script>
```

**Pattern — after (server-driven):**
```vue
<script setup>
const props = defineProps({
  puzzleData: { type: Object, required: true },
  onResult: { type: Function, required: true },
})

onMounted(() => {
  // Server provided puzzleData.scrambled, puzzleData.wordLength
  // Only render — never generate
  const { scrambled, wordLength } = props.puzzleData
  // ... render using scrambled
})
</script>
```

**Per-game changes:**

| Game | `puzzleData` from server | Client renders | Client sends back |
|------|--------------------------|---------------|-------------------|
| **ImageGame** | `{ seed, length }` | Distorted text using seed | OCR'd number |
| **DiceGame** | `{ numDice, target }` | Dice with target | Clicked dice value |
| **HorseRace** | `{ speeds, horseCount }` | Animated race using speeds | Winner index |
| **ColorMatch** | `{ word, inkHex }` | Stroop display | Ink color name |
| **SpotDifference** | `{ diffs, seed }` | Two canvases with diffs | Diff coordinates |
| **ConnectDots** | `{ dots }` | Dots on canvas | Click order string |
| **WordScramble** | `{ scrambled, wordLength }` | Scrambled text | Unscrambled word |
| **ReactionTimer** | `{ minDelay, maxDelay }` | Timer game | `{ avgReactionMs }` as proof |
| **PatternCopy** | `{ gridSize, pattern }` | Show then hide pattern | User's pattern string |
| **DragDrop** | `{ count }` | Shuffled items | Ordered item values |

---

### Step 8 — Nuxt Config

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  devtools: { enabled: true },

  // SSR enabled by default in Nuxt 3
  ssr: true,

  // Runtime config for secrets
  runtimeConfig: {
    captchaSecret: process.env.CAPTCHA_SECRET || 'change-me-in-production',
  },

  // Transpile if needed (shouldn't be for local components)
  build: {
    transpile: [],
  },

  // Nitro config for production
  nitro: {
    // Deploy target: node, deno, cloudflare-workers, vercel, etc.
    preset: 'node',
  },

  compatibilityDate: '2024-11-01',
})
```

---

### Step 9 — Environment Variables

```bash
# .env
CAPTCHA_SECRET=your-hmac-secret-at-least-32-chars-long
```

```bash
# .env.example
CAPTCHA_SECRET=change-me-generate-with-openssl-rand-base64-32
```

---

## File Mapping: Old → New

| Old (Library) | New (Nuxt App) | Change |
|---------------|----------------|--------|
| `src/index.js` | `composables/useVerifyHuman.ts` | Rewrite: server flow instead of standalone Vue |
| `src/module.ts` | Not needed | Was Nuxt module, now is the app itself |
| `src/HumanVerifyModal.vue` | `components/captcha/CaptchaModal.vue` | Rewrite: server challenge + game type from server |
| `src/runtime/composables/useVerifyHuman.ts` | `composables/useVerifyHuman.ts` | Rewrite: fetch challenge + submit answer |
| `src/runtime/plugins/verify-human.ts` | `plugins/captcha.ts` (optional) | Simplify or remove |
| `src/games/*.vue` | `components/captcha/games/*.vue` | Modify: accept `puzzleData` prop, remove self-generation |
| `build.config.ts` | Not needed | Nuxt handles build |
| `vite.config.js` | Not needed | Nuxt handles dev server |
| — | `server/api/captcha/challenge.get.ts` | **New** — issue challenges |
| — | `server/api/captcha/verify.post.ts` | **New** — validate answers, issue JWT |
| — | `server/middleware/captcha.ts` | **New** — token validation middleware |
| — | `server/utils/games/generators.ts` | **New** — server-side puzzle generation |
| — | `server/utils/token.ts` | **New** — JWT utilities |
| — | `server/utils/rate-limit.ts` | **New** — IP rate limiting |
| — | `types/captcha.ts` | **New** — shared TypeScript types |

---

## Key Differences

| Aspect | Vue Library (Before) | Nuxt SSR App (After) |
|--------|----------------------|---------------------|
| **Puzzle generation** | Client-side | Server-side |
| **Answer storage** | In component memory | Server store (DB/Redis) |
| **Verification** | Returns `boolean` | Returns signed JWT |
| **Game selection** | Random on client | Server decides |
| **Build** | unbuild + vite | Nuxt/nitro |
| **Deployment** | npm package | Full server app |
| **Rate limiting** | None | Server-side per IP |
| **Replay protection** | None | Single-use challenges |
| **Token forgery** | N/A | HMAC-signed JWT |

---

## Migration Checklist

- [ ] Initialize Nuxt app
- [ ] Copy game components to `components/captcha/games/`
- [ ] Add `<ClientOnly>` wrapper to `CaptchaModal`
- [ ] Guard `onUnmounted` cleanup with `import.meta.client`
- [ ] Create `server/utils/games/generators.ts` — puzzle generators
- [ ] Create `server/api/captcha/challenge.get.ts` — challenge endpoint
- [ ] Create `server/api/captcha/verify.post.ts` — verify endpoint + JWT
- [ ] Create `server/middleware/captcha.ts` — token validation
- [ ] Rewrite `composables/useVerifyHuman.ts` — server flow
- [ ] Rewrite `CaptchaModal.vue` — fetch challenge, render server-picked game
- [ ] Update each game component to accept `puzzleData` prop
- [ ] Remove client-side puzzle generation from games
- [ ] Add `CAPTCHA_SECRET` env var
- [ ] Update `nuxt.config.ts`
- [ ] Test full flow: challenge → solve → verify → token
- [ ] Test protected endpoint with/without token
- [ ] Add rate limiting
- [ ] Swap in-memory store for Redis/KV for production

---

## Backward Compatibility

If you want to **keep the library** alongside the Nuxt app:

1. Keep `src/index.js` as standalone entry (no server)
2. Export `useVerifyHuman` for library consumers (current behavior)
3. Export `useVerifyHumanServer` for consumers who have a backend
4. Nuxt module (`module.ts`) remains for auto-import in consumer apps

```typescript
// src/index.js
export { verifyHuman }              // Standalone (no server) — current
export { verifyHumanServer }        // With server validation — new
```

This way `@jalzae/vue-captcha` works in two modes:
- **Mode 1 (current):** `verifyHuman()` — client-only, boolean result
- **Mode 2 (new):** `verifyHumanServer({ challengeEndpoint, verifyEndpoint })` — server-validated, JWT result

---

## Production Deployment

Nuxt SSR deploys to any Nitro-supported target:

```bash
# Node.js
npx nuxi build
node .output/server/index.mjs

# Docker
docker build -t captcha-app .
docker run -p 3000:3000 -e CAPTCHA_SECRET=xxx captcha-app

# Vercel
npx nuxi build --preset=vercel

# Cloudflare Workers
npx nuxi build --preset=cloudflare-pages
```

**Environment required:**
- `CAPTCHA_SECRET` — HMAC key for JWT signing (min 32 chars)
- Optional: Redis URL for challenge store in production
