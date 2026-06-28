<template>
  <div class="p-4 text-center">
    <h2 class="text-lg font-semibold mb-4">🔗 Connect the Dots</h2>
    <p class="text-sm text-gray-600 mb-4">Click the dots in order from 1 to {{ dotCount }}!</p>

    <!-- Canvas -->
    <div class="flex justify-center mb-4">
      <canvas
        ref="canvas"
        width="320"
        height="220"
        class="border-2 border-gray-400 rounded-lg cursor-pointer bg-white"
        @click="handleCanvasClick"
      />
    </div>

    <div v-if="!verified" class="space-y-3">
      <p class="text-sm text-gray-500">
        Next: dot <strong class="text-blue-600">#{{ nextDot }}</strong>
        of {{ dotCount }}
      </p>

      <p v-if="message" :class="messageClass" class="font-semibold text-sm">
        {{ message }}
      </p>

      <button
        @click="generateDots"
        class="text-sm text-blue-500 hover:text-blue-700 underline"
      >
        🔄 New puzzle
      </button>
    </div>

    <!-- Success state -->
    <div v-else class="space-y-3">
      <p class="text-5xl">✅</p>
      <p class="text-lg font-semibold text-green-600">Perfect!</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps(['onResult'])

const canvas = ref(null)
const verified = ref(false)
const message = ref('')
const messageClass = ref('')
const dotCount = 6
const dots = ref([])
const clickedOrder = ref([])
const nextDot = ref(1)
const lines = ref([])

const DOT_RADIUS = 16
const HIT_TOLERANCE = 22

const generateDots = () => {
  verified.value = false
  message.value = ''
  clickedOrder.value = []
  nextDot.value = 1
  lines.value = []

  const w = canvas.value.width
  const h = canvas.value.height
  const padding = 30

  // Generate random positions, ensure no overlap
  const newDots = []
  let attempts = 0

  while (newDots.length < dotCount && attempts < 200) {
    const x = padding + Math.random() * (w - padding * 2)
    const y = padding + Math.random() * (h - padding * 2)

    // Check minimum distance from existing dots
    const tooClose = newDots.some(d => {
      const dx = d.x - x
      const dy = d.y - y
      return Math.sqrt(dx * dx + dy * dy) < 45
    })

    if (!tooClose) {
      newDots.push({ id: newDots.length + 1, x, y })
    }
    attempts++
  }

  dots.value = newDots
  drawCanvas()
}

const drawCanvas = () => {
  const ctx = canvas.value.getContext('2d')
  const w = canvas.value.width
  const h = canvas.value.height

  // Background
  ctx.fillStyle = '#fafafa'
  ctx.fillRect(0, 0, w, h)

  // Subtle grid
  ctx.strokeStyle = 'rgba(0,0,0,0.03)'
  ctx.lineWidth = 1
  for (let x = 0; x < w; x += 20) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, h)
    ctx.stroke()
  }
  for (let y = 0; y < h; y += 20) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(w, y)
    ctx.stroke()
  }

  // Draw connecting lines between clicked dots
  if (lines.value.length > 1) {
    ctx.strokeStyle = '#3498db'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(lines.value[0].x, lines.value[0].y)
    for (let i = 1; i < lines.value.length; i++) {
      ctx.lineTo(lines.value[i].x, lines.value[i].y)
    }
    ctx.stroke()
  }

  // Draw dots
  dots.value.forEach(dot => {
    const isClicked = clickedOrder.value.includes(dot.id)

    // Outer circle
    ctx.beginPath()
    ctx.arc(dot.x, dot.y, DOT_RADIUS, 0, Math.PI * 2)

    if (isClicked) {
      ctx.fillStyle = '#3498db'
      ctx.fill()
      ctx.strokeStyle = '#2980b9'
    } else {
      ctx.fillStyle = '#fff'
      ctx.fill()
      ctx.strokeStyle = '#bbb'
    }
    ctx.lineWidth = 2
    ctx.stroke()

    // Number
    ctx.fillStyle = isClicked ? '#fff' : '#333'
    ctx.font = 'bold 14px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(dot.id, dot.x, dot.y)
  })
}

const handleCanvasClick = (e) => {
  if (verified.value) return

  const rect = canvas.value.getBoundingClientRect()
  const clickX = e.clientX - rect.left
  const clickY = e.clientY - rect.top

  // Find closest dot within tolerance
  let hitDot = null
  let minDist = Infinity

  dots.value.forEach(dot => {
    if (clickedOrder.value.includes(dot.id)) return // already clicked
    const dx = dot.x - clickX
    const dy = dot.y - clickY
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < HIT_TOLERANCE && dist < minDist) {
      minDist = dist
      hitDot = dot
    }
  })

  if (!hitDot) return

  // Must click next dot in order
  if (hitDot.id === nextDot.value) {
    clickedOrder.value.push(hitDot.id)
    lines.value.push({ x: hitDot.x, y: hitDot.y })
    nextDot.value++

    if (clickedOrder.value.length === dotCount) {
      // All dots connected!
      verified.value = true
      message.value = ''
    }

    drawCanvas()
  } else {
    message.value = `❌ Click dot #${nextDot.value} next!`
    messageClass.value = 'text-red-600'
    setTimeout(() => { message.value = '' }, 1200)
  }
}

onMounted(() => {
  generateDots()
})
</script>
