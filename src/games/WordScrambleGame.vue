<template>
  <div class="p-4 text-center">
    <h2 class="text-lg font-semibold mb-4">🔤 Word Scramble</h2>
    <p class="text-sm text-gray-600 mb-4">Unscramble the word shown in the image!</p>

    <!-- Canvas -->
    <div class="flex justify-center mb-4">
      <canvas
        ref="canvas"
        width="320"
        height="100"
        class="border-2 border-gray-400 rounded-lg bg-white"
      />
    </div>

    <!-- Input -->
    <div v-if="!verified" class="space-y-3">
      <input
        v-model="userInput"
        type="text"
        placeholder="Type the unscrambled word"
        class="w-full border-2 border-gray-300 p-3 rounded text-lg tracking-widest text-center uppercase"
        @keyup.enter="handleSubmit"
      />
      <button
        @click="handleSubmit"
        :disabled="!userInput.trim()"
        class="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white font-bold py-2 px-4 rounded-lg transition-colors"
      >
        ✓ Submit
      </button>

      <button
        @click="generateWord"
        class="text-sm text-blue-500 hover:text-blue-700 underline"
      >
        🔄 New word
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
const userInput = ref('')
const verified = ref(false)
const message = ref('')
const messageClass = ref('')
const correctWord = ref('')

const WORDS = [
  'HORSE', 'RIVER', 'CLOUD', 'FLAME', 'STONE', 'OCEAN', 'BRAVE',
  'STORM', 'LIGHT', 'PLANT', 'DREAM', 'TIGER', 'SWIFT', 'EAGLE',
  'MAPLE', 'FROST', 'CROWN', 'PIXEL', 'GRAIN', 'SPARK', 'QUEST',
]

const FONTS = ['Arial', 'Georgia', 'Courier New', 'Verdana', 'Impact']

// Fisher-Yates shuffle
const shuffle = (arr) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const scrambleWord = (word) => {
  const arr = word.split('')
  let scrambled = shuffle(arr).join('')
  let attempts = 0
  while (scrambled === word && attempts < 20) {
    scrambled = shuffle(arr).join('')
    attempts++
  }
  return scrambled
}

const drawScrambledWord = () => {
  const ctx = canvas.value.getContext('2d')
  const w = canvas.value.width
  const h = canvas.value.height

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, w, h)
  grad.addColorStop(0, '#fef9f0')
  grad.addColorStop(1, '#f0eef5')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)

  // Noise lines
  for (let i = 0; i < 6; i++) {
    ctx.strokeStyle = `rgba(140, 140, 140, ${Math.random() * 0.15})`
    ctx.lineWidth = Math.random() * 1.5 + 0.5
    ctx.beginPath()
    ctx.moveTo(Math.random() * w, Math.random() * h)
    ctx.lineTo(Math.random() * w, Math.random() * h)
    ctx.stroke()
  }

  // Noise dots
  for (let i = 0; i < 25; i++) {
    ctx.fillStyle = `rgba(120, 120, 120, ${Math.random() * 0.2})`
    ctx.beginPath()
    ctx.arc(Math.random() * w, Math.random() * h, Math.random() * 1.5, 0, Math.PI * 2)
    ctx.fill()
  }

  // Draw each scrambled character
  const scrambled = scrambleWord(correctWord.value)
  const charWidth = w / (scrambled.length + 1)
  const colors = ['#8e44ad', '#2980b9', '#c0392b', '#27ae60', '#d35400']

  scrambled.split('').forEach((char, i) => {
    ctx.save()

    const x = charWidth * (i + 0.8) + (Math.random() - 0.5) * 8
    const y = h / 2 + (Math.random() - 0.5) * 6
    const font = FONTS[i % FONTS.length]
    const size = 42 + Math.floor(Math.random() * 10)

    ctx.translate(x, y)
    ctx.rotate((Math.random() - 0.5) * 0.25)
    ctx.scale(1 + (Math.random() - 0.5) * 0.08, 1 + (Math.random() - 0.5) * 0.08)

    ctx.font = `bold ${size}px ${font}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.06)'
    ctx.fillText(char, 2, 2)

    // Main char
    ctx.fillStyle = colors[i % colors.length]
    ctx.fillText(char, 0, 0)

    ctx.restore()
  })

  // Border
  ctx.strokeStyle = '#ccc'
  ctx.lineWidth = 2
  ctx.strokeRect(0, 0, w, h)
}

const generateWord = () => {
  correctWord.value = WORDS[Math.floor(Math.random() * WORDS.length)]
  userInput.value = ''
  message.value = ''
  verified.value = false
  drawScrambledWord()
}

const handleSubmit = () => {
  if (!userInput.value.trim()) {
    message.value = '❌ Type a word!'
    messageClass.value = 'text-red-600'
    return
  }

  if (userInput.value.trim().toUpperCase() === correctWord.value) {
    verified.value = true
    message.value = ''
    setTimeout(() => props.onResult(true), 1500)
  } else {
    message.value = '❌ Wrong! Try again...'
    messageClass.value = 'text-red-600'
    userInput.value = ''
    setTimeout(generateWord, 1000)
  }
}

onMounted(() => {
  generateWord()
})
</script>
