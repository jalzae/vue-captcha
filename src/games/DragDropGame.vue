<template>
  <div class="p-4 text-center">
    <h2 class="text-lg font-semibold mb-4">🔄 Drag & Drop Order</h2>
    <p class="text-sm text-gray-600 mb-4">Drag the numbers into ascending order (1, 2, 3...)</p>

    <!-- Canvas -->
    <div class="flex justify-center mb-4">
      <canvas
        ref="canvas"
        width="320"
        height="220"
        class="border-2 border-gray-400 rounded-lg bg-white"
        @mousedown="handleMouseDown"
        @mousemove="handleMouseMove"
        @mouseup="handleMouseUp"
        @touchstart.prevent="handleTouchStart"
        @touchmove.prevent="handleTouchMove"
        @touchend.prevent="handleTouchEnd"
      />
    </div>

    <div v-if="!verified" class="space-y-3">
      <button
        @click="generateItems"
        class="text-sm text-blue-500 hover:text-blue-700 underline"
      >
        🔄 Shuffle Again
      </button>

      <p v-if="message" :class="messageClass" class="font-semibold text-sm">
        {{ message }}
      </p>
    </div>

    <!-- Success state -->
    <div v-else class="space-y-3">
      <p class="text-5xl">✅</p>
      <p class="text-lg font-semibold text-green-600">Correct order!</p>
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

const itemCount = 5
const itemSize = 36
const items = ref([])
const dragging = ref(null)
const dragOffset = ref({ x: 0, y: 0 })

const ITEM_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6']

// Fisher-Yates shuffle
const shuffle = (arr) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const generateItems = () => {
  const w = canvas.value.width
  const h = canvas.value.height
  const padding = 20
  const cols = 3
  const rows = Math.ceil(itemCount / cols)
  const cellW = (w - padding * 2) / cols
  const cellH = (h - padding * 2) / rows

  // Generate in correct order, then shuffle
  const ordered = Array.from({ length: itemCount }, (_, i) => ({
    value: i + 1,
    color: ITEM_COLORS[i],
  }))

  const shuffled = shuffle(ordered)

  // Position in grid
  items.value = shuffled.map((item, i) => ({
    ...item,
    x: padding + (i % cols) * cellW + cellW / 2,
    y: padding + Math.floor(i / cols) * cellH + cellH / 2,
    origX: padding + (i % cols) * cellW + cellW / 2,
    origY: padding + Math.floor(i / cols) * cellH + cellH / 2,
  }))

  verified.value = false
  message.value = ''
  dragging.value = null
  drawCanvas()
}

const drawCanvas = () => {
  const ctx = canvas.value.getContext('2d')
  const w = canvas.value.width
  const h = canvas.value.height

  // Background
  ctx.fillStyle = '#fafafa'
  ctx.fillRect(0, 0, w, h)

  // Drop zones (light grid)
  const padding = 20
  const cols = 3
  const rows = Math.ceil(itemCount / cols)
  const cellW = (w - padding * 2) / cols
  const cellH = (h - padding * 2) / rows

  for (let i = 0; i < itemCount; i++) {
    const col = i % cols
    const row = Math.floor(i / cols)
    const cx = padding + col * cellW + cellW / 2
    const cy = padding + row * cellH + cellH / 2

    // Zone label (target number)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.06)'
    ctx.font = 'bold 28px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(i + 1, cx, cy)

    // Dashed border
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.strokeRect(
      padding + col * cellW + 4,
      padding + row * cellH + 4,
      cellW - 8,
      cellH - 8
    )
    ctx.setLineDash([])
  }

  // Draw items (non-dragging first, then dragging on top)
  const sortedItems = [...items.value].sort((a, b) => {
    if (a === dragging.value) return 1
    if (b === dragging.value) return -1
    return 0
  })

  sortedItems.forEach(item => {
    const r = itemSize / 2
    const isDragging = item === dragging.value

    // Shadow
    if (isDragging) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'
      ctx.beginPath()
      ctx.arc(item.x + 3, item.y + 3, r, 0, Math.PI * 2)
      ctx.fill()
    }

    // Circle
    ctx.beginPath()
    ctx.arc(item.x, item.y, r, 0, Math.PI * 2)
    ctx.fillStyle = item.color
    ctx.fill()
    ctx.strokeStyle = isDragging ? '#333' : 'rgba(0,0,0,0.2)'
    ctx.lineWidth = isDragging ? 3 : 1.5
    ctx.stroke()

    // Number
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 18px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(item.value, item.x, item.y)
  })
}

const getItemAt = (x, y) => {
  // Check in reverse order (top items first)
  for (let i = items.value.length - 1; i >= 0; i--) {
    const item = items.value[i]
    const dx = item.x - x
    const dy = item.y - y
    if (Math.sqrt(dx * dx + dy * dy) <= itemSize / 2 + 4) {
      return item
    }
  }
  return null
}

const handleMouseDown = (e) => {
  if (verified.value) return
  const rect = canvas.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  dragging.value = getItemAt(x, y)
  if (dragging.value) {
    dragOffset.value = { x: x - dragging.value.x, y: y - dragging.value.y }
  }
}

const handleMouseMove = (e) => {
  if (!dragging.value) return
  const rect = canvas.value.getBoundingClientRect()
  dragging.value.x = e.clientX - rect.left - dragOffset.value.x
  dragging.value.y = e.clientY - rect.top - dragOffset.value.y
  drawCanvas()
}

const handleMouseUp = () => {
  if (!dragging.value) return
  dragging.value = null
  drawCanvas()
  checkOrder()
}

const handleTouchStart = (e) => {
  if (verified.value) return
  const rect = canvas.value.getBoundingClientRect()
  const touch = e.touches[0]
  const x = touch.clientX - rect.left
  const y = touch.clientY - rect.top
  dragging.value = getItemAt(x, y)
  if (dragging.value) {
    dragOffset.value = { x: x - dragging.value.x, y: y - dragging.value.y }
  }
}

const handleTouchMove = (e) => {
  if (!dragging.value) return
  const rect = canvas.value.getBoundingClientRect()
  const touch = e.touches[0]
  dragging.value.x = touch.clientX - rect.left - dragOffset.value.x
  dragging.value.y = touch.clientY - rect.top - dragOffset.value.y
  drawCanvas()
}

const handleTouchEnd = () => {
  if (!dragging.value) return
  dragging.value = null
  drawCanvas()
  checkOrder()
}

const checkOrder = () => {
  if (items.value.length < 2) return

  // Check if items are in ascending order left-to-right, top-to-bottom
  const sorted = [...items.value].sort((a, b) => {
    if (Math.abs(a.y - b.y) > 30) return a.y - b.y
    return a.x - b.x
  })

  const isCorrect = sorted.every((item, i) => item.value === i + 1)

  if (isCorrect) {
    verified.value = true
    message.value = ''
    setTimeout(() => props.onResult(true), 1500)
  }
}

onMounted(() => {
  generateItems()
})
</script>
