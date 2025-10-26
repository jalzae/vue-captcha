<template>
  <div class="p-4 text-center">
    <h2 class="text-lg font-semibold mb-4">🖼️ Image Verification</h2>
    <p class="text-sm text-gray-600 mb-4">Read the numbers from the image and enter them below</p>

    <!-- Canvas container -->
    <div class="flex justify-center mb-6 bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-300">
      <canvas
        ref="canvas"
        width="320"
        height="120"
        class="border-2 border-gray-400 rounded bg-white"
      />
    </div>

    <!-- Refresh button -->
    <button
      @click="generateCaptcha"
      class="mb-4 text-sm text-blue-500 hover:text-blue-700 underline"
    >
      🔄 Can't read? Get a new image
    </button>

    <!-- Input section -->
    <div v-if="!verified" class="space-y-3">
      <input
        v-model="userInput"
        type="text"
        placeholder="Enter the numbers you see"
        class="w-full border-2 border-gray-300 p-3 rounded text-lg tracking-widest text-center"
        @keyup.enter="handleSubmit"
      />
      <button
        @click="handleSubmit"
        class="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors"
      >
        ✓ Verify
      </button>
      <p v-if="message" :class="messageClass" class="mt-2 font-semibold">
        {{ message }}
      </p>
    </div>

    <!-- Success state -->
    <div v-else class="space-y-3">
      <p class="text-4xl">✅</p>
      <p class="text-lg font-semibold text-green-600">Verification Successful!</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"

const props = defineProps(["onResult"])

const canvas = ref(null)
const userInput = ref("")
const message = ref("")
const messageClass = ref("")
const verified = ref(false)
const captchaCode = ref("")

// Generate random code
const generateCode = () => {
  return Math.floor(Math.random() * 9000) + 1000 // 4-digit number (1000-9999)
}

// Draw captcha with distortion and noise
const drawCaptcha = () => {
  const ctx = canvas.value.getContext("2d")
  const width = canvas.value.width
  const height = canvas.value.height

  // Clear canvas with gradient background
  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, "#f0f4f8")
  gradient.addColorStop(1, "#e0e8f0")
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  // Draw noise lines
  for (let i = 0; i < 8; i++) {
    ctx.strokeStyle = `rgba(150, 150, 150, ${Math.random() * 0.3})`
    ctx.lineWidth = Math.random() * 2 + 1
    ctx.beginPath()
    ctx.moveTo(Math.random() * width, Math.random() * height)
    ctx.lineTo(Math.random() * width, Math.random() * height)
    ctx.stroke()
  }

  // Draw random dots
  for (let i = 0; i < 30; i++) {
    ctx.fillStyle = `rgba(100, 100, 100, ${Math.random() * 0.5})`
    ctx.beginPath()
    ctx.arc(
      Math.random() * width,
      Math.random() * height,
      Math.random() * 1.5 + 0.5,
      0,
      Math.PI * 2
    )
    ctx.fill()
  }

  // Draw the code text with effects
  const code = captchaCode.value.toString()
  ctx.font = "bold 56px Arial"
  ctx.textBaseline = "middle"

  // Render each character with random transformations
  const charWidth = width / (code.length + 1)
  for (let i = 0; i < code.length; i++) {
    ctx.save()

    // Random color for each character
    const colors = ["#e74c3c", "#3498db", "#2ecc71", "#f39c12", "#9b59b6"]
    ctx.fillStyle = colors[i % colors.length]

    // Position with some randomness
    const x = charWidth * (i + 1) + (Math.random() - 0.5) * 10
    const y = height / 2 + (Math.random() - 0.5) * 8

    // Slight rotation and skew
    ctx.translate(x, y)
    ctx.rotate((Math.random() - 0.5) * 0.3)
    ctx.scale(1 + (Math.random() - 0.5) * 0.1, 1 + (Math.random() - 0.5) * 0.1)

    // Draw shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.1)"
    ctx.fillText(code[i], 2, 2)

    // Draw main text
    ctx.fillStyle = colors[i % colors.length]
    ctx.fillText(code[i], 0, 0)

    ctx.restore()
  }

  // Draw border
  ctx.strokeStyle = "#999"
  ctx.lineWidth = 2
  ctx.strokeRect(0, 0, width, height)
}

// Generate new captcha
const generateCaptcha = () => {
  captchaCode.value = generateCode()
  userInput.value = ""
  message.value = ""
  verified.value = false
  drawCaptcha()
}

// Handle submission
const handleSubmit = () => {
  if (!userInput.value.trim()) {
    message.value = "❌ Please enter the numbers"
    messageClass.value = "text-red-600"
    return
  }

  if (userInput.value.trim() === captchaCode.value.toString()) {
    verified.value = true
    message.value = ""
    setTimeout(() => props.onResult(true), 1500)
  } else {
    message.value = "❌ Incorrect! Try again."
    messageClass.value = "text-red-600"
    userInput.value = ""
    // Generate new code after wrong attempt
    setTimeout(generateCaptcha, 500)
  }
}

// Initialize on mount
onMounted(() => {
  generateCaptcha()
})
</script>
