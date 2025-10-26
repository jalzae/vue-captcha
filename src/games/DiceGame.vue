<template>
  <div class="p-4 text-center">
    <h2 class="text-lg font-semibold mb-4">🎲 Dice Game</h2>
    <p class="text-sm text-gray-600 mb-4">Watch the dice roll and guess the number</p>

    <!-- Canvas container -->
    <div class="flex justify-center mb-6">
      <canvas
        ref="canvas"
        width="240"
        height="240"
        class="border-4 border-gray-400 rounded-lg bg-gradient-to-b from-gray-50 to-gray-100"
      />
    </div>

    <!-- Input section -->
    <div v-if="!verified" class="space-y-3">
      <div class="flex gap-2 justify-center mb-4">
        <button
          v-for="num in 6"
          :key="num"
          @click="selectGuess(num)"
          :class="[
            'w-12 h-12 rounded-lg font-bold text-lg transition-all',
            userGuess === num
              ? 'bg-blue-500 text-white scale-110 shadow-lg'
              : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
          ]"
        >
          {{ num }}
        </button>
      </div>

      <button
        @click="handleSubmit"
        :disabled="userGuess === null"
        class="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-bold py-2 px-4 rounded-lg transition-colors"
      >
        ✓ Submit Guess
      </button>

      <p v-if="message" :class="messageClass" class="mt-2 font-semibold text-sm">
        {{ message }}
      </p>
    </div>

    <!-- Success state -->
    <div v-else class="space-y-3">
      <p class="text-5xl">✅</p>
      <p class="text-lg font-semibold text-green-600">Correct! You guessed {{ diceResult }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"

const props = defineProps(["onResult"])

const canvas = ref(null)
const ctx = ref(null)
const userGuess = ref(null)
const diceResult = ref(0)
const rolling = ref(true)
const message = ref("")
const messageClass = ref("")
const verified = ref(false)
const animationId = ref(null)

// Dice face patterns (dots positions)
const diceFaces = {
  1: [[0.5, 0.5]],
  2: [[0.3, 0.3], [0.7, 0.7]],
  3: [[0.3, 0.3], [0.5, 0.5], [0.7, 0.7]],
  4: [[0.3, 0.3], [0.7, 0.3], [0.3, 0.7], [0.7, 0.7]],
  5: [[0.3, 0.3], [0.7, 0.3], [0.5, 0.5], [0.3, 0.7], [0.7, 0.7]],
  6: [[0.3, 0.3], [0.3, 0.5], [0.3, 0.7], [0.7, 0.3], [0.7, 0.5], [0.7, 0.7]]
}

// Draw a single dice face
const drawDiceFace = (number, rotation = 0, scale = 1) => {
  const canvas = canvas.value
  const ctxLocal = ctx.value
  const size = 200 * scale

  ctxLocal.save()
  ctxLocal.translate(canvas.width / 2, canvas.height / 2)
  ctxLocal.rotate(rotation)

  // Draw white face
  ctxLocal.fillStyle = "white"
  ctxLocal.strokeStyle = "#333"
  ctxLocal.lineWidth = 3
  ctxLocal.fillRect(-size / 2, -size / 2, size, size)
  ctxLocal.strokeRect(-size / 2, -size / 2, size, size)

  // Draw dots
  const face = diceFaces[number]
  ctxLocal.fillStyle = "#333"

  face.forEach(([x, y]) => {
    const dotX = (x - 0.5) * size
    const dotY = (y - 0.5) * size
    ctxLocal.beginPath()
    ctxLocal.arc(dotX, dotY, 8 * scale, 0, Math.PI * 2)
    ctxLocal.fill()
  })

  ctxLocal.restore()
}

// Draw rolling dice with 3D effect
const drawRollingDice = (rotation = 0) => {
  const canvas = canvas.value
  const ctxLocal = ctx.value

  // Clear canvas
  const gradient = ctxLocal.createLinearGradient(0, 0, canvas.width, canvas.height)
  gradient.addColorStop(0, "#e8eef5")
  gradient.addColorStop(1, "#d0dce8")
  ctxLocal.fillStyle = gradient
  ctxLocal.fillRect(0, 0, canvas.width, canvas.height)

  // Draw shadow
  ctxLocal.fillStyle = "rgba(0, 0, 0, 0.1)"
  ctxLocal.beginPath()
  ctxLocal.ellipse(canvas.width / 2, canvas.height - 30, 100, 20, 0, 0, Math.PI * 2)
  ctxLocal.fill()

  // Draw rolling dice
  const randomNum = Math.floor(Math.random() * 6) + 1
  const scale = 0.9
  drawDiceFace(randomNum, rotation, scale)
}

// Animate dice rolling
const animateRoll = () => {
  let frameCount = 0
  const maxFrames = 40 // Rolling animation frames

  const animate = () => {
    drawRollingDice((frameCount / maxFrames) * Math.PI * 4)
    frameCount++

    if (frameCount < maxFrames) {
      animationId.value = requestAnimationFrame(animate)
    } else {
      // Stop at final number
      diceResult.value = Math.floor(Math.random() * 6) + 1
      drawDiceFace(diceResult.value, 0, 0.9)
      rolling.value = false
    }
  }

  animate()
}

// Handle guess selection
const selectGuess = (num) => {
  if (!rolling.value) {
    userGuess.value = userGuess.value === num ? null : num
  }
}

// Handle submission
const handleSubmit = () => {
  if (userGuess.value === null) {
    message.value = "❌ Please select a number"
    messageClass.value = "text-red-600"
    return
  }

  if (userGuess.value === diceResult.value) {
    verified.value = true
    message.value = ""
    setTimeout(() => props.onResult(true), 1500)
  } else {
    message.value = `❌ Wrong! It was ${diceResult.value}. Rolling again...`
    messageClass.value = "text-red-600"
    userGuess.value = null

    setTimeout(() => {
      message.value = ""
      rolling.value = true
      animateRoll()
    }, 1500)
  }
}

// Initialize on mount
onMounted(() => {
  ctx.value = canvas.value.getContext("2d")
  animateRoll()
})
</script>
