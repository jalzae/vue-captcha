<template>
  <div class="p-4 text-center">
    <h2 class="text-lg font-semibold mb-4">🧠 Pattern Copy</h2>
    <p class="text-sm text-gray-600 mb-4">Memorize the pattern, then recreate it!</p>

    <!-- Phase: SHOW pattern -->
    <div v-if="phase === 'show'" class="space-y-3">
      <p class="text-sm font-semibold text-amber-600">
        ⏳ Memorize this pattern! ({{ countdown }}s)
      </p>
      <div class="flex justify-center">
        <div class="grid gap-1" :style="gridStyle">
          <div
            v-for="(cell, idx) in cells"
            :key="idx"
            :class="[
              'w-12 h-12 rounded border-2 transition-all',
              cell.lit
                ? 'bg-blue-500 border-blue-600 shadow-lg'
                : 'bg-gray-200 border-gray-300'
            ]"
          />
        </div>
      </div>
    </div>

    <!-- Phase: INPUT -->
    <div v-if="phase === 'input'" class="space-y-3">
      <p class="text-sm font-semibold text-gray-700">
        🔘 Recreate the pattern ({{ userLitCount }} / {{ patternLength }})
      </p>
      <div class="flex justify-center">
        <div class="grid gap-1" :style="gridStyle">
          <div
            v-for="(cell, idx) in cells"
            :key="idx"
            @click="toggleCell(idx)"
            :class="[
              'w-12 h-12 rounded border-2 cursor-pointer transition-all select-none',
              cell.userLit
                ? 'bg-green-500 border-green-600 shadow-lg'
                : 'bg-gray-100 border-gray-300 hover:bg-gray-200'
            ]"
          />
        </div>
      </div>
      <button
        @click="handleSubmit"
        :disabled="userLitCount !== patternLength"
        class="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-bold py-2 px-4 rounded-lg transition-colors"
      >
        ✓ Submit Pattern
      </button>
      <p v-if="message" :class="messageClass" class="font-semibold text-sm">
        {{ message }}
      </p>
    </div>

    <!-- Success -->
    <div v-if="phase === 'success'" class="space-y-3">
      <p class="text-5xl">✅</p>
      <p class="text-lg font-semibold text-green-600">Perfect match!</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps(['onResult'])

const gridSize = 4
const patternLength = 5
const showTime = 3 // seconds

const phase = ref('show') // show | input | success
const countdown = ref(showTime)
const pattern = ref([]) // indices of lit cells
const cells = ref([]) // { lit, userLit }
const message = ref('')
const messageClass = ref('')

let timer = null

const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
}))

const userLitCount = computed(() =>
  cells.value.filter(c => c.userLit).length
)

const generatePattern = () => {
  const total = gridSize * gridSize
  const indices = new Set()

  while (indices.size < patternLength) {
    indices.add(Math.floor(Math.random() * total))
  }

  pattern.value = [...indices]
  cells.value = Array.from({ length: total }, (_, i) => ({
    lit: indices.has(i),
    userLit: false,
  }))

  phase.value = 'show'
  countdown.value = showTime
  message.value = ''
}

const toggleCell = (idx) => {
  if (phase.value !== 'input') return
  const cell = cells.value[idx]
  if (cell.userLit) {
    cell.userLit = false
  } else if (userLitCount.value < patternLength) {
    cell.userLit = true
  }
}

const handleSubmit = () => {
  if (userLitCount.value !== patternLength) {
    message.value = `❌ Select exactly ${patternLength} cells!`
    messageClass.value = 'text-red-600'
    return
  }

  const userSelected = cells.value
    .map((c, i) => (c.userLit ? i : -1))
    .filter(i => i !== -1)
    .sort((a, b) => a - b)

  const correct = [...pattern.value].sort((a, b) => a - b)

  const isCorrect =
    userSelected.length === correct.length &&
    userSelected.every((v, i) => v === correct[i])

  if (isCorrect) {
    phase.value = 'success'
    setTimeout(() => props.onResult(true), 1500)
  } else {
    message.value = '❌ Wrong pattern! Try again...'
    messageClass.value = 'text-red-600'

    // Reset user selections
    cells.value.forEach(c => { c.userLit = false })

    // Regenerate after delay
    setTimeout(generatePattern, 1500)
  }
}

// Countdown timer for show phase
const startCountdown = () => {
  timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
      phase.value = 'input'
      // Hide the pattern (clear lit state visually — pattern data stays in ref)
      cells.value.forEach(c => { c.lit = false })
    }
  }, 1000)
}

onMounted(() => {
  generatePattern()
  startCountdown()
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>
