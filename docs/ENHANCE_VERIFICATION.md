# 🔧 Enhancing Verification Games

Guide for adding new captcha types and hardening existing verification logic in `@jalzae/vue-captcha`.

---

## 📐 Architecture Overview

```
verifyHuman()                         # entry: src/index.js
  └→ HumanVerifyModal.vue             # modal shell, randomly picks a game (10 total)
       ├→ games/ImageGame.vue         # canvas CAPTCHA (read distorted numbers)
       ├→ games/DiceGame.vue          # animated dice (guess the roll result)
       ├→ games/HorseRaceGame.vue     # animated horse race (pick the winner)
       ├→ games/ColorMatchGame.vue    # Stroop effect (ink color vs word)
       ├→ games/SpotDifferenceGame.vue # find the diff between two scenes
       ├→ games/ConnectDotsGame.vue  # click dots in ascending order
       ├→ games/WordScrambleGame.vue # unscramble a jumbled word
       ├→ games/ReactionTimerGame.vue # click target after random delay
       ├→ games/PatternCopyGame.vue   # memorize grid pattern, recreate it
       └→ games/DragDropGame.vue      # drag items into ascending order
```

Each game component receives one prop and calls one callback:

| Prop       | Type       | Description                        |
|------------|------------|------------------------------------|
| `onResult` | `(success: boolean) => void` | Call `onResult(true)` on pass, never call on fail (let user retry) |

The modal auto-picks a random game on mount (`Math.floor(Math.random() * games.length)`). Games are resolved eagerly — only one renders per session.

---

## 🎮 Adding a New Game

### Step 1: Create the game component

Create `src/games/<YourGame>.vue`. Follow this contract:

```vue
<template>
  <div class="p-4 text-center">
    <h2 class="text-lg font-semibold mb-4">🎮 Your Game Title</h2>
    <p class="text-sm text-gray-600 mb-4">Instructions for the user</p>

    <!-- Game UI here -->

    <!-- Success state -->
    <div v-if="verified" class="space-y-3">
      <p class="text-5xl">✅</p>
      <p class="text-lg font-semibold text-green-600">Verified!</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps(['onResult'])

// --- Game state ---
const verified = ref(false)

// --- Game logic ---
const handleSuccess = () => {
  verified.value = true
  setTimeout(() => props.onResult(true), 1500)
}

onMounted(() => {
  // Initialize game
})
</script>
```

### Step 2: Register in the modal

Edit `src/HumanVerifyModal.vue`:

```javascript
import YourGame from './games/YourGame.vue'

// In setup:
const games = [ImageGame, DiceGame, YourGame] // ← add here
```

That's it. The modal picks randomly.

### Step 3 (Nuxt): Ensure build picks it up

The module transpiles everything under `./runtime`. If your game uses only Vue APIs (no Node), it's bundled automatically. No extra config needed.

---

## 🏇 Horse Racing Game (Built-in)

**File:** `src/games/HorseRaceGame.vue`
**Status:** ✅ Included — already registered in `HumanVerifyModal.vue`

### How It Works

1. User clicks **"Start Race"** — 6 colored horses appear at the starting line
2. Horses race across the canvas with randomized speed each frame (unpredictable winner)
3. Race finishes — checkered finish line determines the winner
4. User taps the **horse number** they believe won
5. Submit — correct answer = verified, wrong = new race starts

### Visual Details

- Full racetrack with grass lanes, alternating colors, numbered lanes
- Animated horses with bodies, heads, eyes, and **running legs** (sine-wave animation)
- Checkered finish line pattern
- Horse number rendered on each body for identification
- Each horse has a distinct color (#e74c3c, #3498db, #2ecc71, #f39c12, #9b59b6, #1abc9c)

### Internal Logic

```
Frame loop:
  → randomize speed per horse (1.2 + Math.random() * 2.8)
  → advance x position
  → detect first horse crossing finish line → set winnerNumber
  → all horses finish → show selection buttons
```

### Security Notes

| Aspect | Detail |
|--------|--------|
| **Unpredictable** | Speed randomized every frame — bots can't predict winner from initial state |
| **No DOM leak** | Winner number stored in ref, never in DOM attribute or data attribute |
| **Timing analysis resistant** | Race duration varies per run (1-5 seconds) — no fixed timing pattern |
| **Low luck factor** | With 6 horses, pure guessing = ~16.7% vs dice game's ~16.7%. Watching helps, so humans have advantage |

### Customization Hooks

```javascript
// Change number of horses
const HORSE_COUNT = 6    // increase to 8 for harder difficulty

// Adjust speed range (faster = shorter race = less time to observe)
horse.speed = 1.2 + Math.random() * 2.8   // current: 1.2–4.0
horse.speed = 2.5 + Math.random() * 4.0   // faster: 2.5–6.5

// Tighter lanes = more visual overlap = harder to track individual horses
const LANE_HEIGHT = 34  // decrease to 24 for more difficulty
```

---

## 🧩 More Games (Reference & Implementation Notes)

> Games 6–12 below are **all implemented** as components in `src/games/`. The code snippets here show the core logic patterns used in each.

### 6. Color Match (`ColorMatchGame.vue`) ✅ Implemented

### 1. Slider Puzzle

User drags a slider to align a cut-out piece with its correct position in an image.

```vue
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps(['onResult'])
const canvas = ref(null)
const verified = ref(false)
const sliderX = ref(0)
const targetX = ref(0)
const tolerance = 8 // px

const generatePuzzle = () => {
  const ctx = canvas.value.getContext('2d')
  const w = canvas.value.width
  const h = canvas.value.height

  // Draw background image (or colored pattern)
  const grad = ctx.createLinearGradient(0, 0, w, h)
  grad.addColorStop(0, '#667eea')
  grad.addColorStop(1, '#764ba2')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)

  // Random target X (between 20% and 80% of width)
  targetX.value = Math.floor(w * 0.2 + Math.random() * w * 0.6)
  sliderX.value = 0

  // Draw puzzle piece outline at target
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 2
  ctx.strokeRect(targetX.value - 20, 0, 40, h)
}

const handleSlide = (e) => {
  const rect = canvas.value.getBoundingClientRect()
  sliderX.value = Math.min(Math.max(e.clientX - rect.left, 0), canvas.value.width)

  // Redraw
  generatePuzzle()
  const ctx = canvas.value.getContext('2d')
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
  ctx.fillRect(sliderX.value - 20, 0, 40, canvas.value.height)

  // Check if close enough
  if (Math.abs(sliderX.value - targetX.value) <= tolerance) {
    verified.value = true
    setTimeout(() => props.onResult(true), 1500)
  }
}

onMounted(() => generatePuzzle())
</script>
```

**Security notes:**
- Use server-provided images, not local assets (harder to pre-compute target positions).
- Vary tolerance dynamically: start strict, loosen after N retries.
- Log slider trajectory — bots often move in straight lines; humans have jitter.

---

### 2. Rotate-to-Align

User rotates an image/shape to match a target orientation.

```javascript
// Core logic
const targetAngle = Math.floor(Math.random() * 360)
const currentAngle = ref(0)
const tolerance = 15 // degrees

const checkAngle = () => {
  const diff = Math.abs(((currentAngle.value - targetAngle + 540) % 360) - 180)
  if (diff <= tolerance) {
    verified.value = true
    setTimeout(() => props.onResult(true), 1500)
  }
}
```

**Security notes:**
- Use asymmetric shapes (not circles/squares) — rotation must be visually unambiguous.
- Render on canvas so bots can't read DOM attributes for the angle.

---

### 3. Sequence Memory (Simon Says)

User watches a sequence of highlighted cells, then reproduces it.

```javascript
const sequence = ref([])
const userInput = ref([])
const round = ref(1)

const generateSequence = () => {
  const len = round.value + 2 // starts at 3
  sequence.value = Array.from({ length: len }, () =>
    Math.floor(Math.random() * 9) // 3x3 grid
  )
  userInput.value = []
}

// Highlight cells one by one, then accept input
```

**Security notes:**
- Increase sequence length with each failed attempt (escalating difficulty).
- Add timing constraint: user must complete within N seconds.

---

### 4. Math Challenge

User solves a randomized arithmetic problem rendered on canvas.

```javascript
const generateProblem = () => {
  const ops = ['+', '-', '×']
  const op = ops[Math.floor(Math.random() * ops.length)]
  const a = Math.floor(Math.random() * 20) + 1
  const b = Math.floor(Math.random() * 20) + 1
  // Ensure positive result for subtraction
  const x = op === '-' ? Math.max(a, b) : a
  const y = op === '-' ? Math.min(a, b) : b

  const answer = op === '+' ? x + y : op === '-' ? x - y : x * y
  // Render `${x} ${op} ${y} = ?` on canvas
}
```

**Security notes:**
- Render on canvas — never expose the answer in DOM or attributes.
- Vary font size, color, rotation per character (same as ImageGame).
- Use larger numbers and mixed operators for higher difficulty.

---

### 5. Grid Selection (reCAPTCHA-style)

User selects all cells matching a criterion (e.g., "select all cells containing a cat").

```javascript
const gridSize = 3 // 3x3
const cells = ref(Array(gridSize * gridSize).fill(false))
const correctCells = ref([])

// Populate: some cells have target image, others have distractors
// Compare user selection against correctCells
```

**Security notes:**
- Images must come from a server-side pool — bots can fingerprint static assets.
- Shuffle cell positions each render.
- Use subtle variations of the target (different angles, lighting) to defeat template matching.

---

### 6. Color Match

User sees a color word written in a different color (Stroop effect). Must select the **ink color**, not the word.

```javascript
const colors = [
  { name: 'RED', hex: '#e74c3c' },
  { name: 'BLUE', hex: '#3498db' },
  { name: 'GREEN', hex: '#2ecc71' },
  { name: 'YELLOW', hex: '#f1c40f' },
  { name: 'PURPLE', hex: '#9b59b6' },
]

const generateChallenge = () => {
  const wordColor = colors[Math.floor(Math.random() * colors.length)]
  let inkColor
  do {
    inkColor = colors[Math.floor(Math.random() * colors.length)]
  } while (inkColor.name === wordColor.name) // ensure mismatch

  // Render wordColor.name in inkColor.hex on canvas
  // Correct answer = inkColor.name
}
```

**Security notes:**
- The Stroop effect is cognitively hard for bots (they can read text and parse colors trivially), but this is about *confusing automated reading* — render as canvas pixels so bots must run OCR + color detection in sync.
- Add color noise/grain to the text so simple pixel sampling fails.
- Randomize font, size, and slight rotation per render.

---

### 7. Spot the Difference (`SpotDifferenceGame.vue`) ✅ Implemented

Two nearly identical images side-by-side. User taps the area that differs.

```javascript
const generatePuzzle = () => {
  // Draw a base scene on canvas (simple shapes: house, tree, sun)
  drawBaseScene(ctx1, canvas1)
  drawBaseScene(ctx2, canvas2)

  // Pick a random region to modify
  const diffX = 50 + Math.random() * 200
  const diffY = 50 + Math.random() * 100
  // Modify that region on canvas2 (change color, remove object, flip shape)

  // Store diffRegion for hit-testing user clicks
}
```

**Security notes:**
- Generate scenes procedurally (not static images) — bots can't pre-index differences.
- Use geometric primitives (circles, rects, lines) so image hashing fails.
- Allow small tolerance for click position (±15px) but not too large.

---

### 8. Connect the Dots (`ConnectDotsGame.vue`) ✅ Implemented

Canvas shows numbered dots in a path. User must click them in order (1→2→3...→N) by clicking each dot.

```javascript
const dotCount = 6
const dots = ref([])
const clickedOrder = ref([])

const generateDots = () => {
  dots.value = Array.from({ length: dotCount }, (_, i) => ({
    id: i + 1,
    x: 30 + Math.random() * 260,
    y: 30 + Math.random() * 180,
    radius: 16,
  }))
}

const handleDotClick = (dot) => {
  if (dot.id === clickedOrder.value.length + 1) {
    clickedOrder.value.push(dot.id)
    if (clickedOrder.value.length === dotCount) {
      verified.value = true
      setTimeout(() => props.onResult(true), 1000)
    }
  }
}
```

**Security notes:**
- Randomize dot positions each render — bots can't memorize coordinates.
- Add decoy dots with no numbers (or same number repeated).
- Track click timestamps — bots click in rapid succession (<100ms between clicks).
- Draw lines between correctly clicked dots for visual feedback.

---

### 9. Word Scramble (`WordScrambleGame.vue`) ✅ Implemented

Unscramble a jumbled word displayed on canvas. Type the correct word.

```javascript
const words = ['HORSE', 'RIVER', 'CLOUD', 'FLAME', 'STONE', 'OCEAN']

const scrambleWord = (word) => {
  const arr = word.split('')
  // Fisher-Yates shuffle
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  // Ensure it's actually scrambled (not identical)
  return arr.join('') === word ? scrambleWord(word) : arr.join('')
}
```

**Security notes:**
- Render scrambled letters on canvas with distortion (same as ImageGame).
- Use word pools of 4-6 letter words — short enough to be human-friendly, long enough to increase bot search space.
- Case-insensitive matching.

---

### 10. Reaction Timer (`ReactionTimerGame.vue`) ✅ Implemented

A target appears at a random position after a random delay. User must click it as fast as possible — but bots fail if they click *before* it appears.

```javascript
const showTarget = () => {
  const delay = 1500 + Math.random() * 3000 // 1.5–4.5s random delay
  setTimeout(() => {
    targetX.value = 40 + Math.random() * 240
    targetY.value = 40 + Math.random() * 160
    targetVisible.value = true
    appearedAt.value = Date.now()
  }, delay)
}

const handleClick = (e) => {
  if (targetVisible.value) {
    const reactionMs = Date.now() - appearedAt.value
    // Human range: 200-500ms. Bot range: <50ms or suspiciously consistent
    if (reactionMs < 100) {
      // Too fast — likely a bot or pre-emptive click
      message.value = 'Too fast! Try again.'
    } else {
      verified.value = true
      setTimeout(() => props.onResult(true), 1000)
    }
  } else {
    // Clicked before target appeared — penalty
    message.value = 'Wait for the target!'
  }
}
```

**Security notes:**
- Anti-bot: clicking before target appears = instant fail.
- Track reaction time distribution — humans vary 150-600ms; bots are suspiciously consistent or too fast.
- Use multiple rounds (2-3 targets) to establish a pattern — humans vary, bots don't.
- Random target size/shape each round so bots can't pre-position click coordinates.

---

### 11. Pattern Copy (`PatternCopyGame.vue`) ✅ Implemented

Canvas shows a short pattern (sequence of colored cells in a grid). After it disappears, user must recreate the pattern from memory.

```javascript
const gridSize = 4 // 4x4 grid
const patternLength = 5
const pattern = ref([])
const userPattern = ref([])

const generatePattern = () => {
  const total = gridSize * gridSize
  const indices = new Set()
  while (indices.size < patternLength) {
    indices.add(Math.floor(Math.random() * total))
  }
  pattern.value = [...indices]
}

// Show pattern for 3 seconds, then hide, then accept user input
```

**Security notes:**
- Decrease display time after each failed attempt (3s → 2s → 1.5s).
- Increase pattern length on failure (5 → 6 → 7).
- Canvas-based rendering prevents DOM inspection.

---

### 12. Drag & Drop (`DragDropGame.vue`) ✅ Implemented

Canvas shows numbered items in random positions. User drags them into correct ascending order.

```javascript
const items = ref([])
const itemCount = 5

const generateItems = () => {
  const shuffled = Array.from({ length: itemCount }, (_, i) => ({
    value: i + 1,
    x: 30 + Math.random() * 260,
    y: 30 + Math.random() * 200,
    dragging: false,
  }))
  // Shuffle array order
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  items.value = shuffled
}
```

**Security notes:**
- Track drag trajectory — bots move in straight lines, humans have jitter/overshoot.
- Check total time to complete — bots finish in <1s, humans take 3-10s.
- Items must be rendered on canvas (not DOM drag-and-drop) to prevent programmatic DOM manipulation.

---

## 🔒 Hardening Existing Games

### ImageGame — Anti-OCR Improvements

Current: 4-digit number, noise lines, dots, per-char color/rotation/skew.

Enhancements:

| Technique | How | Why |
|-----------|-----|-----|
| **Variable char spacing** | Randomize `charWidth` gaps | Breaks segmentation-based OCR |
| **Bezier noise lines** | Replace straight lines with cubic beziers | Harder to subtract programmatically |
| **Character overlap** | Allow chars to slightly overlap | Segmentation fails |
| **Variable font per char** | Cycle through `['Arial', 'Georgia', 'Courier', 'Comic Sans']` | Font-specific OCR models fail on mixed fonts |
| **Background pattern** | Add subtle grid/crosshatch pattern | Confuses background-subtraction OCR |
| **Case-insensitive letters** | Mix uppercase letters with digits (`A`, `B`, `O`, `0`, `1`, `I`) | Increases search space |

```javascript
// Example: bezier noise lines
const drawBezierNoise = (ctx, w, h) => {
  for (let i = 0; i < 8; i++) {
    ctx.strokeStyle = `rgba(150, 150, 150, ${Math.random() * 0.3})`
    ctx.lineWidth = Math.random() * 2 + 1
    ctx.beginPath()
    ctx.moveTo(Math.random() * w, Math.random() * h)
    ctx.bezierCurveTo(
      Math.random() * w, Math.random() * h,
      Math.random() * w, Math.random() * h,
      Math.random() * w, Math.random() * h
    )
    ctx.stroke()
  }
}

// Example: variable fonts
const fonts = ['Arial', 'Georgia', 'Courier New', 'Verdana']
// In drawCaptcha():
ctx.font = `bold ${48 + Math.random() * 16}px ${fonts[i % fonts.length]}`
```

### DiceGame — Anti-Automation Improvements

Current: animated roll, user guesses 1-6. 1/6 chance per attempt.

Enhancements:

| Technique | How | Why |
|-----------|-----|-----|
| **Timing check** | Measure time between roll stop and guess submit | Bots answer in <200ms consistently |
| **Mouse trajectory** | Track pointer movement before button click | Bots often move in straight lines to target |
| **Multi-dice mode** | Roll 2 dice, user must sum or multiply | Increases answer space from 6 to 36 (sum) or 11 (multiply) |
| **Fail escalation** | After each wrong guess, roll faster (fewer frames) | Less time to analyze frame-by-frame |

```javascript
// Timing check example
const rollEndTime = ref(0)

// In animateRoll(), when roll stops:
rollEndTime.value = Date.now()

// In handleSubmit():
const reactionTime = Date.now() - rollEndTime.value
if (reactionTime < 500) {
  // Suspiciously fast — possible bot
  // Could force another roll or increase difficulty
}
```

---

## 🏗️ Modal-Level Enhancements

### Weighted Game Selection

Instead of equal probability, weight harder games higher after failed attempts:

```javascript
// In HumanVerifyModal.vue
const attemptCount = ref(0)

const selectGame = () => {
  // Start easy, escalate
  if (attemptCount.value === 0) {
    return ImageGame // easier to read
  }
  // After failures, add harder games to the pool
  const pool = [ImageGame, DiceGame, SliderGame, MathGame]
  return pool[Math.floor(Math.random() * pool.length)]
}
```

### Max Attempts & Lockout

```javascript
const maxAttempts = 3
const attemptCount = ref(0)

// In handleResult (failure path):
attemptCount.value++
if (attemptCount.value >= maxAttempts) {
  props.onResult(false) // Force close, user must retry from scratch
}
```

### Server-Side Token Validation

Generate a one-time token when the modal opens. Include it when calling `onResult`. Verify server-side:

```javascript
// On modal open:
const token = crypto.randomUUID()
const expiresAt = Date.now() + 5 * 60 * 1000 // 5 min

// On success:
props.onResult(true, { token, expiresAt })

// Server validates:
// - Token exists in DB/store
// - Not expired
// - Not previously used
// - Delete token after validation (single-use)
```

---

## 🧪 Testing Custom Games

```bash
# Dev server with hot reload
npm run dev
# Opens test page at http://localhost:5173

# Quick smoke test — open console and run:
await verifyHuman()
```

To test a specific game (bypass random selection), temporarily hardcode it:

```javascript
// In HumanVerifyModal.vue — for testing only
onMounted(() => {
  gameComponent.value = YourNewGame // force specific game
})
```

---

## 📊 Choosing the Right Game

| Game | Difficulty | Bot Resistance | Accessibility | Best For |
|------|-----------|----------------|-------------|----------|
| Image CAPTCHA | Medium | High (canvas OCR-resistant) | Low (screen readers can't read canvas) | General purpose |
| Dice Game | Low | Medium (1/6 luck factor) | Medium (visual only) | Casual sites |
| 🏇 Horse Racing | Medium | High (unpredictable per-frame) | Medium (visual tracking) | Engaging/interactive sites |
| Slider Puzzle | Medium | High (trajectory analysis possible) | Medium | Mobile-friendly |
| Rotate-to-Align | Medium-High | High | Low | High-security forms |
| Sequence Memory | High | Very High | Low | Sensitive operations |
| Math Challenge | Medium | High (if canvas-rendered) | Low (screen readers fail) | Rate-limited endpoints |
| Grid Selection | High | Very High | Low (requires image recognition) | reCAPTCHA alternative |
| Color Match | Low-Medium | Medium (Stroop + canvas noise) | Low | Quick verification |
| Spot the Difference | Medium-High | High (procedural generation) | Low | Engagement-focused sites |
| Connect the Dots | Medium | High (random coords + timing) | Low-Medium | General purpose |
| Word Scramble | Medium | High (scrambled + canvas distortion) | Low | Text-oriented users |
| Reaction Timer | Low | Very High (anti-pre-click) | Medium | Quick verification |
| Pattern Copy | High | Very High (memory + timing) | Low | High-security operations |
| Drag & Drop | Medium | High (jitter detection) | Low | Desktop-focused sites |

**Recommendation:** Use 3-4 games with varying difficulty. Random selection + escalating difficulty after failures gives strong bot resistance without frustrating users. Mix visual games (Horse Racing, Slider) with cognitive games (Math, Word Scramble) and memory games (Sequence, Pattern Copy) for maximum coverage.
