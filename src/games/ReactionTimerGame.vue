<template>
  <div class="p-4 text-center">
    <h2 class="text-lg font-semibold mb-4">⚡ Reaction Timer</h2>
    <p class="text-sm text-gray-600 mb-4">Click the target as fast as you can when it appears!</p>

    <!-- Canvas -->
    <div class="flex justify-center mb-4">
      <canvas
        ref="canvas"
        width="320"
        height="220"
        class="border-2 border-gray-400 rounded-lg cursor-pointer bg-gray-100"
        @click="handleClick"
      />
    </div>

    <div v-if="!verified" class="space-y-3">
      <!-- Phase indicator -->
      <div v-if="phase === 'waiting'" class="space-y-3">
        <p class="text-sm font-semibold text-amber-600">⏳ Wait for the target...</p>
        <p class="text-xs text-gray-400">Don't click yet!</p>
      </div>

      <div v-else-if="phase === 'ready'" class="space-y-3">
        <button
          @click="startRound"
          class="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
        >
          🎯 Start Round {{ currentRound }} / {{ totalRounds }}
        </button>
      </div>

      <div v-else-if="phase === 'show'" class="space-y-3">
        <p class="text-sm font-semibold text-red-600 animate-pulse">🎯 CLICK THE TARGET NOW!</p>
      </div>

      <div v-else-if="phase === 'result'" class="space-y-2">
        <p class="text-sm">
          Reaction: <strong>{{ lastReactionMs }}ms</strong>
        </p>
        <button
          v-if="currentRound < totalRounds"
          @click="startRound"
          class="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
        >
          Next Round
        </button>
      </div>

      <p v-if="message" :class="messageClass" class="mt-2 font-semibold text-sm">
        {{ message }}
      </p>
    </div>

    <!-- Success state -->
    <div v-else class="space-y-3">
      <p class="text-5xl">✅</p>
      <p class="text-lg font-semibold text-green-600">Verified! Avg: {{ avgReaction }}ms</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps(['onResult'])

const canvas = ref(null)
const verified = ref(false)
const message = ref('')
const messageClass = ref('')

const phase = ref('ready') // ready | waiting | show | result
const currentRound = ref(0)
const totalRounds = 3
const reactionTimes = ref([])
const lastReactionMs = ref(0)
const avgReaction = ref(0)

const targetX = ref(0)
const targetY = ref(0)
const targetRadius = ref(20)
const appearedAt = ref(0)

let timeoutId = null

const TARGET_SHAPES = ['circle', 'star', 'diamond']
const TARGET_COLORS = ['#e74c3c', '#f39c12', '#2ecc71', '#3498db', '#9b59b6']

const drawCanvas = () => {
  const ctx = canvas.value.getContext('2d')
  const w = canvas.value.width
  const h = canvas.value.height

  // Background
  ctx.fillStyle = '#f5f5f5'
  ctx.fillRect(0, 0, w, h)

  if (phase.value === 'waiting') {
    // Dark background to indicate "wait"
    ctx.fillStyle = '#ddd'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#666'
    ctx.font = 'bold 18px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('Wait for it...', w / 2, h / 2)
  } else if (phase.value === 'show') {
    // Draw the target
    const shape = TARGET_SHAPES[Math.floor(Math.random() * 100) % TARGET_SHAPES.length]
    const color = TARGET_COLORS[Math.floor(Math.random() * 100) % TARGET_COLORS.length]
    const x = targetX.value
    const y = targetY.value
    const r = targetRadius.value

    ctx.fillStyle = color
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'
    ctx.lineWidth = 2

    if (shape === 'circle') {
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    } else if (shape === 'diamond') {
      ctx.beginPath()
      ctx.moveTo(x, y - r)
      ctx.lineTo(x + r, y)
      ctx.lineTo(x, y + r)
      ctx.lineTo(x - r, y)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
    } else {
      // Star
      ctx.beginPath()
      for (let i = 0; i < 5; i++) {
        const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2
        const method = i === 0 ? 'moveTo' : 'lineTo'
        ctx[method](x + Math.cos(angle) * r, y + Math.sin(angle) * r)
      }
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
    }
  } else if (phase.value === 'result') {
    ctx.fillStyle = '#333'
    ctx.font = 'bold 14px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`${lastReactionMs.value}ms`, w / 2, h / 2)
  }
}

const startRound = () => {
  phase.value = 'waiting'
  message.value = ''
  drawCanvas()

  const delay = 1500 + Math.random() * 3000
  timeoutId = setTimeout(() => {
    const w = canvas.value.width
    const h = canvas.value.height
    const r = 15 + Math.random() * 15

    targetX.value = r + 10 + Math.random() * (w - r * 2 - 20)
    targetY.value = r + 10 + Math.random() * (h - r * 2 - 20)
    targetRadius.value = r
    appearedAt.value = Date.now()
    phase.value = 'show'
    drawCanvas()
  }, delay)
}

const handleClick = (e) => {
  if (verified.value) return

  if (phase.value === 'waiting') {
    // Clicked too early!
    clearTimeout(timeoutId)
    phase.value = 'ready'
    message.value = '❌ Too early! Wait for the target.'
    messageClass.value = 'text-red-600'

    const ctx = canvas.value.getContext('2d')
    ctx.fillStyle = '#f5f5f5'
    ctx.fillRect(0, 0, canvas.value.width, canvas.value.height)
    ctx.fillStyle = '#e74c3c'
    ctx.font = 'bold 16px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('Too early! ⏳', canvas.value.width / 2, canvas.value.height / 2)

    setTimeout(() => { message.value = '' }, 2000)
    return
  }

  if (phase.value === 'show') {
    const rect = canvas.value.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top

    const dx = clickX - targetX.value
    const dy = clickY - targetY.value
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist <= targetRadius.value + 10) {
      const reactionMs = Date.now() - appearedAt.value

      // Anti-bot: too fast = suspicious
      if (reactionMs < 100) {
        phase.value = 'ready'
        currentRound.value = 0
        reactionTimes.value = []
        message.value = '❌ Suspiciously fast! Starting over...'
        messageClass.value = 'text-red-600'
        setTimeout(() => { message.value = '' }, 2000)
        drawCanvas()
        return
      }

      lastReactionMs.value = reactionMs
      reactionTimes.value.push(reactionMs)
      currentRound.value++
      phase.value = 'result'
      drawCanvas()

      if (currentRound.value >= totalRounds) {
        // All rounds complete
        avgReaction.value = Math.round(
          reactionTimes.value.reduce((a, b) => a + b, 0) / reactionTimes.value.length
        )
        verified.value = true
        setTimeout(() => props.onResult(true), 1500)
      }
    }
    // Clicked but missed target — ignore
  }
}

onUnmounted(() => {
  if (timeoutId) clearTimeout(timeoutId)
})

onMounted(() => {
  phase.value = 'ready'
  drawCanvas()
})
</script>
