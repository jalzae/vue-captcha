<template>
  <div class="p-4 text-center">
    <h2 class="text-lg font-semibold mb-4">🎨 Color Match</h2>
    <p class="text-sm text-gray-600 mb-4">Pick the <strong>INK COLOR</strong>, not the word!</p>

    <!-- Canvas display -->
    <div class="flex justify-center mb-4">
      <canvas
        ref="canvas"
        width="320"
        height="120"
        class="border-2 border-gray-400 rounded-lg bg-white"
      />
    </div>

    <!-- Color selection buttons -->
    <div v-if="!verified" class="space-y-3">
      <div class="flex gap-2 justify-center mb-4 flex-wrap">
        <button
          v-for="color in colorOptions"
          :key="color.name"
          @click="selectColor(color)"
          :class="[
            'px-4 py-2 rounded-lg font-bold text-sm transition-all border-2',
            selectedColor?.name === color.name
              ? 'border-gray-800 scale-105 shadow-lg'
              : 'border-transparent hover:border-gray-400'
          ]"
          :style="{ backgroundColor: color.hex, color: '#fff' }"
        >
          {{ color.name }}
        </button>
      </div>

      <button
        @click="handleSubmit"
        :disabled="!selectedColor"
        class="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-bold py-2 px-4 rounded-lg transition-colors"
      >
        ✓ Submit
      </button>

      <p v-if="message" :class="messageClass" class="mt-2 font-semibold text-sm">
        {{ message }}
      </p>
    </div>

    <!-- Success state -->
    <div v-else class="space-y-3">
      <p class="text-5xl">✅</p>
      <p class="text-lg font-semibold text-green-600">Correct!</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps(['onResult'])

const canvas = ref(null)
const selectedColor = ref(null)
const verified = ref(false)
const message = ref('')
const messageClass = ref('')
const correctAnswer = ref(null)

const COLORS = [
  { name: 'RED', hex: '#e74c3c' },
  { name: 'BLUE', hex: '#3498db' },
  { name: 'GREEN', hex: '#2ecc71' },
  { name: 'YELLOW', hex: '#f1c40f' },
  { name: 'PURPLE', hex: '#9b59b6' },
  { name: 'ORANGE', hex: '#e67e22' },
]

// Shuffle helper
const shuffle = (arr) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const colorOptions = ref([])

const generateChallenge = () => {
  const wordColor = COLORS[Math.floor(Math.random() * COLORS.length)]
  let inkColor
  do {
    inkColor = COLORS[Math.floor(Math.random() * COLORS.length)]
  } while (inkColor.name === wordColor.name)

  correctAnswer.value = inkColor.name
  selectedColor.value = null
  message.value = ''
  verified.value = false

  // Draw the word in the ink color on canvas
  const ctx = canvas.value.getContext('2d')
  const w = canvas.value.width
  const h = canvas.value.height

  // Background
  const grad = ctx.createLinearGradient(0, 0, w, h)
  grad.addColorStop(0, '#fefefe')
  grad.addColorStop(1, '#f0f0f0')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)

  // Noise dots
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = `rgba(150, 150, 150, ${Math.random() * 0.2})`
    ctx.beginPath()
    ctx.arc(Math.random() * w, Math.random() * h, Math.random() * 2, 0, Math.PI * 2)
    ctx.fill()
  }

  // Noise lines
  for (let i = 0; i < 4; i++) {
    ctx.strokeStyle = `rgba(120, 120, 120, ${Math.random() * 0.15})`
    ctx.lineWidth = Math.random() * 1.5 + 0.5
    ctx.beginPath()
    ctx.moveTo(Math.random() * w, Math.random() * h)
    ctx.lineTo(Math.random() * w, Math.random() * h)
    ctx.stroke()
  }

  // Draw word with slight rotation and scaling
  ctx.save()
  ctx.translate(w / 2, h / 2)
  ctx.rotate((Math.random() - 0.5) * 0.15)
  ctx.scale(1 + (Math.random() - 0.5) * 0.08, 1 + (Math.random() - 0.5) * 0.08)

  // Shadow
  ctx.font = 'bold 52px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = 'rgba(0, 0, 0, 0.08)'
  ctx.fillText(wordColor.name, 2, 2)

  // Main text in ink color
  ctx.fillStyle = inkColor.hex
  ctx.fillText(wordColor.name, 0, 0)
  ctx.restore()

  // Shuffle button options
  colorOptions.value = shuffle(COLORS)
}

const selectColor = (color) => {
  selectedColor.value = selectedColor.value?.name === color.name ? null : color
}

const handleSubmit = () => {
  if (!selectedColor.value) {
    message.value = '❌ Pick a color!'
    messageClass.value = 'text-red-600'
    return
  }

  if (selectedColor.value.name === correctAnswer.value) {
    verified.value = true
    message.value = ''
    setTimeout(() => props.onResult(true), 1500)
  } else {
    message.value = '❌ Wrong! Try again...'
    messageClass.value = 'text-red-600'
    selectedColor.value = null
    setTimeout(generateChallenge, 1000)
  }
}

onMounted(() => {
  generateChallenge()
})
</script>
