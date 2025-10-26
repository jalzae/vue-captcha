# 🧪 Human Verify Vue

A lightweight, interactive human verification library for Vue 3 and Nuxt 3 applications. Features canvas-based CAPTCHA image verification and animated dice game challenges to prevent bot access.

![Vue](https://img.shields.io/badge/Vue-3.5+-success)
![License](https://img.shields.io/badge/License-ISC-blue)
![Package Size](https://img.shields.io/badge/Size-~3KB%20gzipped-brightgreen)

---

## ✨ Features

- 🖼️ **Canvas-Based CAPTCHA** - Distorted numbers with noise and visual effects
- 🎲 **Animated Dice Game** - Smooth rolling animation with dot patterns
- 🎯 **Random Game Selection** - Alternates between games for enhanced security
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- ♿ **User Friendly** - Easy refresh buttons and clear feedback
- ⚡ **Lightweight** - Only ~3KB gzipped, zero dependencies besides Vue
- 🔒 **Bot-Resistant** - Canvas-based rendering makes OCR difficult
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
- [ ] Custom game components
- [ ] Backend verification API
- [ ] Multiple language support
- [ ] Accessibility improvements
- [ ] Mobile optimizations
- [ ] More game types (puzzle, slider, etc.)

---

## 📊 Stats

- **Size:** ~3KB gzipped
- **Dependencies:** 0 (besides Vue 3)
- **Games:** 2 (CAPTCHA, Dice)
- **Browser Support:** Modern browsers
- **Performance:** 60 FPS animations

---

**Made with ❤️ for Vue developers**

For more information, visit our [GitHub repository](https://github.com) or check out the [live demo](http://localhost:5173).
