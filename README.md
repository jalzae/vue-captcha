# 🧪 Human Verify Vue

A lightweight, interactive human verification library for Vue 3 and Nuxt 3 applications. Features 10 canvas-based captcha games — including image CAPTCHA, dice, horse racing, color match, spot the difference, connect the dots, word scramble, reaction timer, pattern copy, and drag & drop — to prevent bot access.

![Vue](https://img.shields.io/badge/Vue-3.5+-success)
![License](https://img.shields.io/badge/License-ISC-blue)
![Package Size](https://img.shields.io/badge/Size-~3KB%20gzipped-brightgreen)

---

## ✨ Features

- 🖼️ **Canvas-Based CAPTCHA** - Distorted numbers with noise and visual effects
- 🎲 **Animated Dice Game** - Smooth rolling animation with dot patterns
- 🏇 **Horse Racing** - Watch animated horses race, pick the winner
- 🎨 **Color Match** - Stroop effect: pick ink color, not the word
- 🔍 **Spot the Difference** - Find the difference between two procedural scenes
- 🔗 **Connect the Dots** - Click numbered dots in ascending order
- 🔤 **Word Scramble** - Unscramble a jumbled word rendered on canvas
- ⚡ **Reaction Timer** - Click targets after random delay (3 rounds)
- 🧠 **Pattern Copy** - Memorize a grid pattern and recreate it
- 🔄 **Drag & Drop** - Drag numbered items into ascending order
- 🎯 **Random Game Selection** - Randomly picks from 10 games each time
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- ♿ **User Friendly** - Easy refresh buttons and clear feedback
- ⚡ **Lightweight** - Zero dependencies besides Vue
- 🔒 **Bot-Resistant** - Canvas rendering + timing analysis + randomness
- 🎨 **Customizable** - Easy to extend with your own verification games

---

## 📦 Installation

### Using NPM

```bash
npm install @jalzae/vue-captcha
```

### Using Yarn

```bash
yarn add @jalzae/vue-captcha
```

### Using PNPM

```bash
pnpm add @jalzae/vue-captcha
```

---

## 🚀 Quick Start

### Vue 3 (Standalone)

```javascript
// In your Vue component or page
<script setup>
import { verifyHuman } from '@jalzae/vue-captcha'

const handleVerify = async () => {
  try {
    const result = await verifyHuman()
    if (result) {
      console.log('✅ User verified!')
      // Proceed with your action (login, submit form, etc.)
    } else {
      console.log('❌ Verification failed')
    }
  } catch (error) {
    console.error('Verification error:', error)
  }
}
</script>

<template>
  <button @click="handleVerify" class="btn btn-primary">
    Verify I'm Human
  </button>
</template>
```

### Nuxt 3 - As a Module (Recommended)

#### Step 1: Install

```bash
npm install @jalzae/vue-captcha
```

#### Step 2: Add to `nuxt.config.ts`

```typescript
export default defineNuxtConfig({
  modules: [
    '@jalzae/vue-captcha'
  ],
  // Optional: Configure module options
  verifyCaptcha: {
    autoImports: true,  // Auto-import useVerifyHuman
    addPlugin: true     // Auto-provide $verifyHuman
  }
})
```

#### Step 3: Use in Components

**Method 1: Using Composable (Recommended)**
```vue
<script setup>
const { verifyHuman, isVerifying, verified, error } = useVerifyHuman()

const handleVerify = async () => {
  const result = await verifyHuman()
  if (result) {
    console.log('✅ Verified!')
  }
}
</script>

<template>
  <div>
    <button @click="handleVerify" :disabled="isVerifying">
      {{ isVerifying ? 'Verifying...' : 'Verify I\'m Human' }}
    </button>
    <p v-if="verified" class="success">✅ Verified!</p>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>
```

**Method 2: Using Plugin (via useNuxtApp)**
```vue
<script setup>
const { $verifyHuman } = useNuxtApp()

const handleVerify = async () => {
  const result = await $verifyHuman()
  if (result) {
    console.log('✅ Verified!')
  }
}
</script>

<template>
  <button @click="handleVerify">Verify</button>
</template>
```

**Method 3: Direct Import**
```vue
<script setup>
import { verifyHuman } from '@jalzae/vue-captcha'

const handleVerify = async () => {
  const result = await verifyHuman()
  if (result) {
    console.log('✅ Verified!')
  }
}
</script>

<template>
  <button @click="handleVerify">Verify</button>
</template>
```

---

## 🚀 Nuxt Module Guide

### Module Configuration

Add `@jalzae/vue-captcha` to your `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  modules: [
    '@jalzae/vue-captcha'
  ]
})
```

### Module Options

```typescript
export default defineNuxtConfig({
  modules: [
    '@jalzae/vue-captcha'
  ],
  verifyCaptcha: {
    // Auto-import the useVerifyHuman composable (default: true)
    autoImports: true,

    // Provide $verifyHuman via plugin (default: true)
    addPlugin: true
  }
})
```

### Using `useVerifyHuman` Composable

The module automatically exports a composable for reactive verification:

```vue
<script setup>
const { verifyHuman, isVerifying, verified, error, reset } = useVerifyHuman()

const handleVerify = async () => {
  const result = await verifyHuman()
  console.log(result ? '✅ Verified!' : '❌ Cancelled')
}

const handleReset = () => {
  reset() // Clear verification state
}
</script>

<template>
  <div>
    <button @click="handleVerify" :disabled="isVerifying">
      <span v-if="isVerifying">⏳ Verifying...</span>
      <span v-else>🎮 Verify I'm Human</span>
    </button>

    <!-- Show state indicators -->
    <div v-if="verified" class="success">✅ Verified!</div>
    <div v-if="error" class="error">⚠️ {{ error }}</div>

    <!-- Reset button -->
    <button v-if="verified" @click="handleReset">Reset</button>
  </div>
</template>

<style scoped>
button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.success { color: green; font-weight: bold; }
.error { color: red; font-weight: bold; }
</style>
```

#### Composable API

```typescript
const {
  // Function to trigger verification
  verifyHuman: () => Promise<boolean>,

  // Reset verification state
  reset: () => void,

  // Reactive states
  isVerifying: Ref<boolean>,    // true while modal is open
  verified: Ref<boolean>,       // true if last verification succeeded
  error: Ref<string | null>     // error message if any
} = useVerifyHuman()
```

### Using `$verifyHuman` Plugin

Access the verification function via `useNuxtApp()`:

```vue
<script setup>
const { $verifyHuman } = useNuxtApp()

const handleVerify = async () => {
  const result = await $verifyHuman()
  if (result) {
    console.log('✅ Verified!')
  }
}
</script>

<template>
  <button @click="handleVerify">Verify</button>
</template>
```

---

## 📚 API Reference

### `verifyHuman()`

Main function to show the verification modal.

**Returns:** `Promise<boolean>`
- `true` - User successfully completed verification
- `false` - User closed modal without verification

**Example:**
```javascript
const result = await verifyHuman()

if (result) {
  // User verified - perform your action
  await submitForm()
  await loginUser()
  await submitComment()
} else {
  // Verification failed or cancelled
  showToast('Verification required')
}
```

---

## 🎮 Games Included

### 🖼️ Image CAPTCHA Game

Users must read distorted numbers from a canvas image.

**Features:**
- Random 4-digit numbers (1000-9999)
- Distorted text with rotation and skew
- Noise lines and random dots for security
- Gradient background
- Colored characters for difficulty
- "Can't read? Get a new image" refresh button

**How it works:**
1. Modal appears with distorted number image
2. User reads the numbers
3. User enters the numbers in the input field
4. Press Enter or click Verify
5. On success: Returns `true` and closes
6. On failure: Generates new image, user tries again

---

### 🎲 Dice Game

Users watch an animated dice roll and guess the final number.

**Features:**
- Smooth rolling animation (40 frames)
- Realistic dice with dot patterns
- All 6 faces properly rendered
- Shadow effect
- Gradient background
- Button selection (1-6)
- Feedback on wrong guesses

**How it works:**
1. Modal appears with rolling dice animation
2. Dice rolls and lands on a number (1-6)
3. User clicks the guessed number
4. User clicks "Submit Guess"
5. On success: Returns `true` and closes
6. On failure: Shows correct answer, rolls again

---

### 🏇 Horse Racing Game

Users watch an animated horse race and pick the winning horse number.

**Features:**
- 6 colored horses with animated running legs
- Grass track with alternating lane colors
- Checkered finish line
- Per-frame random speed (unpredictable winner)
- Horse numbers rendered on each body

**How it works:**
1. User clicks "Start Race"
2. 6 horses race across the canvas with varying speed each frame
3. First horse to cross finish line wins
4. User clicks the winning horse's number
5. On success: Returns `true` and closes
6. On failure: New race starts automatically

---

### 🎨 Color Match Game

Stroop effect — user must identify the ink color, not the word itself.

**Features:**
- 6 color options (RED, BLUE, GREEN, YELLOW, PURPLE, ORANGE)
- Word always shows a different color than the text
- Canvas rendering with noise, rotation, scaling
- Shuffled button order each round

**How it works:**
1. A color word (e.g. "RED") appears written in a different ink color (e.g. blue)
2. User clicks the button matching the ink color, not the word
3. On success: Returns `true` and closes
4. On failure: New challenge generated

---

### 🔍 Spot the Difference Game

Two nearly identical procedural scenes side-by-side. User clicks the difference.

**Features:**
- Procedurally generated scenes (sky, ground, sun, clouds, tree, shapes)
- One random shape has its color changed in the right canvas
- Hit tolerance (±5px) for click detection
- X-mark feedback on wrong clicks

**How it works:**
1. Two canvas scenes appear with one subtle difference
2. User clicks on the area that differs
3. On success: Highlighted with green circle, closes
4. On failure: Red X marker, keep looking

---

### 🔗 Connect the Dots Game

Canvas shows numbered dots. User must click them in ascending order.

**Features:**
- 6 randomly positioned dots with collision avoidance
- Connecting lines drawn between correctly clicked dots
- Blue fill on clicked dots, visual progression
- Background grid for depth

**How it works:**
1. Dots numbered 1–6 appear at random positions
2. User clicks dot 1, then 2, then 3, etc.
3. Lines connect clicked dots in order
4. Wrong click: error message, must click correct next dot
5. All dots connected: Returns `true`

---

### 🔤 Word Scramble Game

A jumbled word rendered on canvas. User must unscramble and type it.

**Features:**
- 21-word pool (4-5 letter words: HORSE, RIVER, CLOUD, etc.)
- Canvas rendering with per-char distortion (rotation, scale, font variation)
- Fisher-Yates shuffle ensuring always scrambled
- 5 different fonts cycled across characters

**How it works:**
1. Scrambled word appears on canvas with distortion
2. User types the correct word
3. Case-insensitive matching
4. On success: Returns `true`
5. On failure: New word generated

---

### ⚡ Reaction Timer Game

Target appears at random position after random delay. User must click it quickly.

**Features:**
- 3 rounds per verification
- Random delay (1.5–4.5s) before target appears
- Random target shape (circle, star, diamond) and color
- Anti-bot: <100ms reaction = suspicious, pre-click = fail
- Average reaction time shown on completion

**How it works:**
1. User clicks "Start Round"
2. Canvas shows "Wait for it..." during delay
3. Target appears at random position
4. User clicks the target
5. Repeat for 3 rounds
6. All rounds passed: Returns `true`

---

### 🧠 Pattern Copy Game

A colored grid pattern is shown briefly. User must recreate it from memory.

**Features:**
- 4×4 grid (16 cells), 5 cells lit
- 3-second memorization countdown
- User clicks cells to toggle them
- Exact match required (correct cells in correct positions)

**How it works:**
1. Grid shows 5 highlighted cells for 3 seconds
2. Pattern disappears — all cells go blank
3. User clicks to recreate the pattern
4. Must select exactly 5 cells
5. On correct match: Returns `true`
6. On failure: New pattern generated

---

### 🔄 Drag & Drop Game

Numbered circles in random positions. User drags them into ascending order.

**Features:**
- 5 colored numbered circles
- Mouse and touch support
- Ghost zones showing target positions (faint numbers in background)
- Drop-shadow on dragged item
- Auto-detects correct left-to-right, top-to-bottom order

**How it works:**
1. Numbered circles appear shuffled on canvas
2. User drags each circle to arrange them in order (1→5)
3. Background shows faint target positions
4. When correctly ordered: Returns `true`

---

## 💡 Usage Examples

### Example 1: Simple Login Form

```vue
<script setup>
import { verifyHuman } from '@jalzae/vue-captcha'

const email = ref('')
const password = ref('')
const isVerifying = ref(false)

const handleLogin = async () => {
  isVerifying.value = true

  try {
    // First verify human
    const verified = await verifyHuman()

    if (!verified) {
      alert('Verification required')
      return
    }

    // Then login
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, password: password.value })
    })

    const data = await response.json()
    if (data.success) {
      alert('✅ Login successful!')
      // Redirect or update store
    }
  } finally {
    isVerifying.value = false
  }
}
</script>

<template>
  <form @submit.prevent="handleLogin">
    <input v-model="email" type="email" placeholder="Email" required />
    <input v-model="password" type="password" placeholder="Password" required />
    <button type="submit" :disabled="isVerifying">
      {{ isVerifying ? 'Verifying...' : 'Login' }}
    </button>
  </form>
</template>
```

---

### Example 2: Comment Submission

```vue
<script setup>
import { verifyHuman } from '@jalzae/vue-captcha'

const comment = ref('')

const submitComment = async () => {
  const verified = await verifyHuman()

  if (!verified) {
    console.log('User cancelled verification')
    return
  }

  // Submit comment after verification
  await fetch('/api/comments', {
    method: 'POST',
    body: JSON.stringify({ text: comment.value })
  })

  comment.value = ''
  alert('✅ Comment posted!')
}
</script>

<template>
  <div>
    <textarea v-model="comment" placeholder="Write a comment..."></textarea>
    <button @click="submitComment">Post Comment</button>
  </div>
</template>
```

---

### Example 3: Nuxt Middleware Protection

Create `middleware/verify.ts`:

```typescript
import { verifyHuman } from '@jalzae/vue-captcha'

export default defineRouteMiddleware(async (to, from) => {
  // Check if user already verified
  const verified = useState('userVerified', () => false)

  if (!verified.value && to.path === '/protected-page') {
    const result = await verifyHuman()
    if (!result) {
      return navigateTo('/')
    }
    verified.value = true
  }
})
```

Use in page:

```vue
<script setup>
definePageMeta({
  middleware: 'verify'
})
</script>

<template>
  <div>
    <h1>Protected Content</h1>
    <p>Only humans can see this!</p>
  </div>
</template>
```

---

### Example 4: Form Submission with Error Handling

```vue
<script setup>
import { verifyHuman } from '@jalzae/vue-captcha'

const form = reactive({
  name: '',
  email: '',
  message: ''
})
const loading = ref(false)
const error = ref('')
const success = ref(false)

const handleSubmit = async () => {
  error.value = ''
  loading.value = true

  try {
    // Step 1: Verify human
    const verified = await verifyHuman()

    if (!verified) {
      error.value = 'Verification cancelled'
      return
    }

    // Step 2: Validate form
    if (!form.name || !form.email || !form.message) {
      error.value = 'Please fill all fields'
      return
    }

    // Step 3: Submit form
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })

    if (!response.ok) throw new Error('Failed to submit')

    success.value = true
    Object.assign(form, { name: '', email: '', message: '' })

    setTimeout(() => {
      success.value = false
    }, 3000)

  } catch (err) {
    error.value = err.message || 'An error occurred'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="contact-form">
    <input v-model="form.name" type="text" placeholder="Name" required />
    <input v-model="form.email" type="email" placeholder="Email" required />
    <textarea v-model="form.message" placeholder="Message" required></textarea>

    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="success" class="success">✅ Message sent!</div>

    <button type="submit" :disabled="loading">
      {{ loading ? 'Submitting...' : 'Send' }}
    </button>
  </form>
</template>

<style scoped>
.error { color: red; margin: 10px 0; }
.success { color: green; margin: 10px 0; }
</style>
```

---

## 🎨 Customization

### Styling the Modal

The modal uses default styles, but you can customize it by adding your own CSS:

```css
/* Override modal styles */
.fixed.inset-0.bg-black\/50 {
  /* Modal overlay */
}

.bg-white.rounded-2xl.p-6.shadow-lg.w-96 {
  /* Modal container */
}
```

Or use Tailwind CSS with custom configuration in your `tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#3498db',
      }
    }
  }
}
```

---

## 🛠️ Development

### Local Testing

Clone the repository and run the development server:

```bash
# Install dependencies
npm install

# Start dev server with test page
npm run dev

# Open http://localhost:5173 in your browser
```

The test page allows you to:
- Test both verification games
- See real-time feedback
- Verify the modal works correctly

### Building

```bash
# Build for production
npm run build

# Output files:
# - dist/human-verify-vue.es.js (ESM format)
# - dist/human-verify-vue.umd.js (UMD format)
```

---

## 📋 Browser Support

- Chrome/Edge: ✅ Latest 2 versions
- Firefox: ✅ Latest 2 versions
- Safari: ✅ Latest 2 versions
- Mobile browsers: ✅ All modern versions

Requires:
- Vue 3.5+
- Modern JavaScript (ES2020+)
- Canvas API support

---

## 🔒 Security Considerations

### Best Practices

1. **Always verify on server-side** - Don't rely solely on client-side verification
2. **Add rate limiting** - Limit verification attempts per IP/user
3. **Combine with other security** - Use alongside HTTPS, CORS, etc.
4. **Log verification attempts** - Track failed attempts for abuse detection

### Example Server-Side Verification (Node.js/Express)

```javascript
const express = require('express')
const rateLimit = require('express-rate-limit')

const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many verification attempts'
})

app.post('/api/verify-action', verifyLimiter, (req, res) => {
  // User passed client-side verification
  // Now verify on server side

  // 1. Check user session
  // 2. Verify request came from your domain
  // 3. Process the action
  // 4. Log the action

  res.json({ success: true })
})
```

---

## ⚡ Performance Tips

1. **Lazy load** - Import only when needed
2. **Async handling** - Use `await` to prevent blocking
3. **Debounce** - Prevent multiple verification attempts

```vue
<script setup>
import { debounce } from 'lodash-es'
import { verifyHuman } from '@jalzae/vue-captcha'

const verifyWithDebounce = debounce(async () => {
  const result = await verifyHuman()
  console.log(result)
}, 300)
</script>

<template>
  <button @click="verifyWithDebounce">Verify</button>
</template>
```

---

## 🐛 Troubleshooting

### Modal doesn't appear

**Problem:** The modal is not showing when `verifyHuman()` is called.

**Solution:**
```javascript
// Make sure you're awaiting the promise
const result = await verifyHuman() // ✅ Correct
// const result = verifyHuman() // ❌ Wrong
```

---

### Canvas is blank

**Problem:** The game canvas shows no content.

**Solution:**
- Ensure browser supports Canvas API
- Check browser console for errors
- Refresh the page

```javascript
// Check Canvas support
const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')
if (!ctx) {
  console.warn('Canvas not supported')
}
```

---

### Verification always fails

**Problem:** Every guess is marked as incorrect.

**Solution:**
- The CAPTCHA uses canvas rendering - ensure the font is loaded
- Try clicking the refresh button to get a new image
- The dice game uses exact number matching - ensure you're guessing the displayed number

---

### Import errors in Nuxt

**Problem:** `Cannot find module 'vue-captcha'`

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Or clear Nuxt cache
rm -rf .nuxt
npm run dev
```

---

### TypeScript errors

**Problem:** TypeScript complains about types

**Solution:**
Create `types/vue-captcha.d.ts`:

```typescript
declare module '@jalzae/vue-captcha' {
  export function verifyHuman(): Promise<boolean>
}
```

---

## 📄 License

ISC - Feel free to use in personal and commercial projects!

---

## 🤝 Contributing

Found a bug? Have a feature idea? Feel free to open an issue or submit a PR!

---

## 📞 Support

For issues and questions:
1. Check the [Troubleshooting](#-troubleshooting) section
2. Review the [examples](#-usage-examples) above
3. Test with the dev server: `npm run dev`

---

## 🎉 What's Next?

Ideas for features:
- [x] ~~Custom game components~~ — 10 games included
- [x] ~~More game types~~ — horse racing, color match, spot difference, connect dots, word scramble, reaction timer, pattern copy, drag & drop
- [ ] Backend verification API
- [ ] Multiple language support
- [ ] Accessibility improvements
- [ ] Difficulty scaling (escalate after failed attempts)
- [ ] Slider puzzle game
- [ ] Grid selection (reCAPTCHA-style)

---

## 📊 Stats

- **Size:** ~3KB gzipped
- **Dependencies:** 0 (besides Vue 3)
- **Games:** 10 (Image CAPTCHA, Dice, Horse Racing, Color Match, Spot Difference, Connect Dots, Word Scramble, Reaction Timer, Pattern Copy, Drag & Drop)
- **Browser Support:** Modern browsers
- **Performance:** 60 FPS animations

---

**Made with ❤️ for Vue developers**

For more information, visit our [GitHub repository](https://github.com) or check out the [live demo](http://localhost:5173).
