# 🚀 @jalzae/vue-captcha - Nuxt Module Documentation

Complete guide for using `@jalzae/vue-captcha` as a Nuxt 3 module.

---

## 📦 Installation

```bash
npm install @jalzae/vue-captcha
```

---

## ⚙️ Quick Setup

### 1. Add to `nuxt.config.ts`

```typescript
export default defineNuxtConfig({
  modules: [
    '@jalzae/vue-captcha'
  ]
})
```

That's it! The module is now enabled with default settings.

### 2. Use in Your Component

```vue
<script setup>
const { verifyHuman, isVerifying } = useVerifyHuman()

const handleClick = async () => {
  const verified = await verifyHuman()
  if (verified) {
    alert('✅ You are verified!')
  }
}
</script>

<template>
  <button @click="handleClick" :disabled="isVerifying">
    {{ isVerifying ? 'Verifying...' : 'Verify I\'m Human' }}
  </button>
</template>
```

---

## ⚙️ Module Configuration

### Default Options

```typescript
export default defineNuxtConfig({
  modules: [
    '@jalzae/vue-captcha'
  ],
  verifyCaptcha: {
    // Automatically import useVerifyHuman composable
    autoImports: true,

    // Provide $verifyHuman via plugin
    addPlugin: true
  }
})
```

### Configuration Options

#### `autoImports` (boolean)
- **Default:** `true`
- **Description:** Auto-imports the `useVerifyHuman` composable so you don't need to manually import it in every component

```typescript
// With autoImports: true (default)
const { verifyHuman } = useVerifyHuman() // ✅ Works directly

// With autoImports: false
import { useVerifyHuman } from '@jalzae/vue-captcha'
const { verifyHuman } = useVerifyHuman() // ✅ Need manual import
```

#### `addPlugin` (boolean)
- **Default:** `true`
- **Description:** Registers the `$verifyHuman` plugin for access via `useNuxtApp()`

```typescript
// With addPlugin: true (default)
const { $verifyHuman } = useNuxtApp()
const result = await $verifyHuman() // ✅ Works

// With addPlugin: false
// $verifyHuman is not available via useNuxtApp()
```

---

## 📚 Usage Methods

### Method 1: Composable (Recommended)

Best for components that need reactive state and error handling.

```vue
<script setup>
const {
  verifyHuman,    // Function to trigger verification
  reset,          // Reset verification state
  isVerifying,    // Loading state while modal is open
  verified,       // Whether last verification succeeded
  error           // Error message if any
} = useVerifyHuman()

const handleVerify = async () => {
  const result = await verifyHuman()
  if (result) {
    console.log('✅ Verification successful')
    // Proceed with action
  } else {
    console.log('❌ Verification cancelled')
  }
}

const handleReset = () => {
  reset() // Clear all state
}
</script>

<template>
  <div class="verify-container">
    <!-- Verification button -->
    <button
      @click="handleVerify"
      :disabled="isVerifying"
      class="verify-btn"
    >
      {{ isVerifying ? 'Verifying...' : 'Verify I\'m Human' }}
    </button>

    <!-- Status messages -->
    <div v-if="verified" class="success-message">
      ✅ You have been verified!
    </div>

    <div v-if="error" class="error-message">
      ⚠️ {{ error }}
    </div>

    <!-- Reset button -->
    <button v-if="verified" @click="handleReset" class="reset-btn">
      Start Over
    </button>
  </div>
</template>

<style scoped>
.verify-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.verify-btn {
  padding: 10px 20px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
}

.verify-btn:disabled {
  background: #95a5a6;
  cursor: not-allowed;
  opacity: 0.7;
}

.success-message {
  color: green;
  font-weight: bold;
}

.error-message {
  color: red;
  font-weight: bold;
}

.reset-btn {
  padding: 8px 16px;
  background: #f39c12;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>
```

#### Composable API Reference

```typescript
const {
  /**
   * Triggers the verification modal
   * @returns {Promise<boolean>} true if verified, false if cancelled
   */
  verifyHuman: () => Promise<boolean>,

  /**
   * Resets all verification state
   */
  reset: () => void,

  /**
   * Reactive: Whether verification modal is open/loading
   */
  isVerifying: Ref<boolean>,

  /**
   * Reactive: Whether last verification succeeded
   */
  verified: Ref<boolean>,

  /**
   * Reactive: Error message if verification failed
   */
  error: Ref<string | null>
} = useVerifyHuman()
```

---

### Method 2: Plugin via useNuxtApp()

Simple method for basic usage without reactive state.

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

### Method 3: Direct Import

Works in any Vue app (not specific to Nuxt).

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

## 💡 Real-World Examples

### Example 1: Login Form with Verification

```vue
<template>
  <form @submit.prevent="handleSubmit">
    <div class="form-group">
      <label>Email</label>
      <input v-model="email" type="email" required />
    </div>

    <div class="form-group">
      <label>Password</label>
      <input v-model="password" type="password" required />
    </div>

    <button
      type="submit"
      :disabled="isLoading"
      class="submit-btn"
    >
      {{ isLoading ? 'Logging in...' : 'Login' }}
    </button>

    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="success" class="success">✅ Login successful!</div>
  </form>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const email = ref('')
const password = ref('')
const isLoading = ref(false)
const error = ref('')
const success = ref(false)

const router = useRouter()
const { verifyHuman } = useVerifyHuman()

const handleSubmit = async () => {
  error.value = ''
  isLoading.value = true

  try {
    // Step 1: Verify human
    const verified = await verifyHuman()
    if (!verified) {
      error.value = 'Verification cancelled'
      return
    }

    // Step 2: Login
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.value,
        password: password.value
      })
    })

    if (!response.ok) {
      const data = await response.json()
      error.value = data.message || 'Login failed'
      return
    }

    success.value = true
    setTimeout(() => {
      router.push('/dashboard')
    }, 1500)

  } catch (err) {
    error.value = err instanceof Error ? err.message : 'An error occurred'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.form-group {
  margin-bottom: 16px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
}

input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
}

.submit-btn {
  width: 100%;
  padding: 10px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.submit-btn:disabled {
  background: #95a5a6;
  cursor: not-allowed;
}

.error {
  color: red;
  margin-top: 10px;
  font-weight: bold;
}

.success {
  color: green;
  margin-top: 10px;
  font-weight: bold;
}
</style>
```

### Example 2: Protected Route Middleware

Create `middleware/verify.ts`:

```typescript
import { useVerifyHuman } from '@jalzae/vue-captcha'

export default defineRouteMiddleware(async (to, from) => {
  // Check if user is already verified
  const verified = useState('userVerified', () => false)

  if (!verified.value && to.path === '/protected') {
    const { verifyHuman } = useVerifyHuman()
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
    <p>Only verified humans can see this!</p>
  </div>
</template>
```

### Example 3: Comment Submission

```vue
<template>
  <div class="comment-section">
    <textarea
      v-model="comment"
      placeholder="Write a comment..."
      class="comment-input"
    ></textarea>

    <button
      @click="submitComment"
      :disabled="isVerifying || isSubmitting"
      class="submit-btn"
    >
      <span v-if="isVerifying">⏳ Verifying...</span>
      <span v-else-if="isSubmitting">📤 Posting...</span>
      <span v-else>Post Comment</span>
    </button>

    <div v-if="error" class="error-message">{{ error }}</div>
    <div v-if="success" class="success-message">✅ Comment posted!</div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const comment = ref('')
const isSubmitting = ref(false)
const error = ref('')
const success = ref(false)

const { verifyHuman, isVerifying } = useVerifyHuman()

const submitComment = async () => {
  if (!comment.value.trim()) {
    error.value = 'Comment cannot be empty'
    return
  }

  error.value = ''
  success.value = false

  try {
    // Verify before posting
    const verified = await verifyHuman()
    if (!verified) return

    isSubmitting.value = true

    // Submit comment
    const response = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: comment.value })
    })

    if (!response.ok) {
      throw new Error('Failed to post comment')
    }

    success.value = true
    comment.value = ''

    setTimeout(() => {
      success.value = false
    }, 3000)

  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Error posting comment'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.comment-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 600px;
}

.comment-input {
  padding: 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-family: inherit;
  resize: vertical;
  min-height: 100px;
}

.submit-btn {
  padding: 10px 20px;
  background: #2ecc71;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.submit-btn:disabled {
  background: #95a5a6;
  cursor: not-allowed;
  opacity: 0.7;
}

.error-message {
  color: #e74c3c;
  font-weight: bold;
}

.success-message {
  color: #27ae60;
  font-weight: bold;
}
</style>
```

---

## 🔒 Security Best Practices

### 1. Always Verify on Backend

**Important:** Client-side verification alone is not secure! Always verify on your server.

```typescript
// Backend example (Node.js/Express)
app.post('/api/protected-action', async (req, res) => {
  // User passed client-side verification
  // Now verify on server side:

  1. Check user session
  2. Verify request origin
  3. Log verification attempt
  4. Proceed with action

  res.json({ success: true })
})
```

### 2. Rate Limiting

Prevent verification abuse:

```typescript
import rateLimit from 'express-rate-limit'

const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many verification attempts'
})

app.post('/api/verify-action', verifyLimiter, (req, res) => {
  // Handle protected action
})
```

### 3. HTTPS Only

Always use HTTPS in production to prevent man-in-the-middle attacks.

### 4. CORS Configuration

Configure CORS properly:

```typescript
export default defineNuxtConfig({
  nitro: {
    middleware: {
      cors: {
        origin: ['https://yourdomain.com'],
        credentials: true
      }
    }
  }
})
```

---

## 🐛 Troubleshooting

### Issue: Modal Doesn't Appear

**Solution:** Ensure you're awaiting the promise:

```typescript
// ✅ Correct
const result = await verifyHuman()

// ❌ Wrong
verifyHuman() // Missing await
```

### Issue: Composable Not Found

**Ensure autoImports is enabled:**

```typescript
export default defineNuxtConfig({
  verifyCaptcha: {
    autoImports: true // Make sure this is true
  }
})
```

Or manually import:

```typescript
import { useVerifyHuman } from '@jalzae/vue-captcha'
```

### Issue: $verifyHuman Not Available

**Ensure plugin is enabled:**

```typescript
export default defineNuxtConfig({
  verifyCaptcha: {
    addPlugin: true // Make sure this is true
  }
})
```

---

## 📦 What's Included

When you install the module, you get:

- ✅ `verifyHuman()` - Main verification function
- ✅ `useVerifyHuman()` - Composable with state management
- ✅ `$verifyHuman` - Plugin provider
- ✅ Auto-import of composable
- ✅ 2 verification games (CAPTCHA image + dice)
- ✅ Full type support

---

## 🎯 Next Steps

1. **Install:** `npm install @jalzae/vue-captcha`
2. **Add to nuxt.config.ts:** Include in modules array
3. **Use in component:** Call `useVerifyHuman()` and enjoy!
4. **Customize:** Add your own styling and error handling
5. **Deploy:** Remember to verify on backend!

---

## 📞 Support

For issues or questions:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Review the [examples](#-real-world-examples) above
3. Read the main [README.md](./README.md)

---

**Happy verifying! 🚀**
