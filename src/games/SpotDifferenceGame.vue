<template>
  <div class="p-4 text-center">
    <h2 class="text-lg font-semibold mb-4">🔍 Spot the Difference</h2>
    <p class="text-sm text-gray-600 mb-4">Find the area that's different between the two images!</p>

    <!-- Two canvases side by side -->
    <div v-if="!verified" class="flex gap-2 justify-center mb-4">
      <div>
        <p class="text-xs font-semibold text-gray-500 mb-1">A</p>
        <canvas
          ref="canvas1"
          width="180"
          height="160"
          class="border-2 border-gray-400 rounded-lg cursor-pointer bg-white"
          @click="handleCanvas1Click"
        />
      </div>
      <div>
        <p class="text-xs font-semibold text-gray-500 mb-1">B</p>
        <canvas
          ref="canvas2"
          width="180"
          height="160"
          class="border-2 border-gray-400 rounded-lg cursor-pointer bg-white"
          @click="handleCanvas2Click"
        />
      </div>
    </div>

    <!-- Feedback circle overlay -->
    <div v-if="!verified" class="space-y-3">
      <p v-if="message" :class="messageClass" class="font-semibold text-sm">
        {{ message }}
      </p>
      <button
        @click="generatePuzzle"
        class="text-sm text-blue-500 hover:text-blue-700 underline"
      >
        🔄 New puzzle
      </button>
    </div>

    <!-- Success state -->
    <div v-if="verified" class="space-y-3">
      <p class="text-5xl">✅</p>
      <p class="text-lg font-semibold text-green-600">Found it!</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps(['onResult'])

const canvas1 = ref(null)
const canvas2 = ref(null)
const verified = ref(false)
const message = ref('')
const messageClass = ref('')
const diffRegion = ref({ x: 0, y: 0, radius: 18 })

// Procedural scene drawing — shapes, colors, positions
const SCENE_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22']
const SHAPE_TYPES = ['circle', 'rect', 'triangle', 'star']

const randomColor = () => SCENE_COLORS[Math.floor(Math.random() * SCENE_COLORS.length)]
const randomShape = () => SHAPE_TYPES[Math.floor(Math.random() * SHAPE_TYPES.length)]

const drawShape = (ctx, type, x, y, size, color) => {
  ctx.fillStyle = color
  ctx.strokeStyle = 'rgba(0,0,0,0.2)'
  ctx.lineWidth = 1.5

  if (type === 'circle') {
    ctx.beginPath()
    ctx.arc(x, y, size, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  } else if (type === 'rect') {
    ctx.fillRect(x - size, y - size, size * 2, size * 2)
    ctx.strokeRect(x - size, y - size, size * 2, size * 2)
  } else if (type === 'triangle') {
    ctx.beginPath()
    ctx.moveTo(x, y - size)
    ctx.lineTo(x + size, y + size)
    ctx.lineTo(x - size, y + size)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  } else if (type === 'star') {
    ctx.beginPath()
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2
      const method = i === 0 ? 'moveTo' : 'lineTo'
      ctx[method](x + Math.cos(angle) * size, y + Math.sin(angle) * size)
    }
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  }
}

const generateScene = (ctx, w, h) => {
  // Sky gradient
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.6)
  sky.addColorStop(0, '#87ceeb')
  sky.addColorStop(1, '#e0f0ff')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, w, h * 0.6)

  // Ground
  const ground = ctx.createLinearGradient(0, h * 0.6, 0, h)
  ground.addColorStop(0, '#90c77a')
  ground.addColorStop(1, '#6aad55')
  ctx.fillStyle = ground
  ctx.fillRect(0, h * 0.6, w, h * 0.4)

  // Sun
  ctx.fillStyle = '#ffd700'
  ctx.beginPath()
  ctx.arc(w - 25, 25, 18, 0, Math.PI * 2)
  ctx.fill()

  // Random shapes in the scene
  const shapes = []
  const shapeCount = 5 + Math.floor(Math.random() * 3)

  for (let i = 0; i < shapeCount; i++) {
    const type = randomShape()
    const x = 20 + Math.random() * (w - 40)
    const y = 20 + Math.random() * (h - 40)
    const size = 8 + Math.random() * 16
    const color = randomColor()
    shapes.push({ type, x, y, size, color })
    drawShape(ctx, type, x, y, size, color)
  }

  // Cloud
  ctx.fillStyle = 'rgba(255,255,255,0.8)'
  ctx.beginPath()
  ctx.arc(30 + Math.random() * 60, 25, 14, 0, Math.PI * 2)
  ctx.arc(42 + Math.random() * 60, 20, 10, 0, Math.PI * 2)
  ctx.arc(50 + Math.random() * 60, 25, 12, 0, Math.PI * 2)
  ctx.fill()

  // Tree
  const treeX = 20 + Math.random() * (w - 40)
  const treeY = h * 0.55
  ctx.fillStyle = '#8B4513'
  ctx.fillRect(treeX - 4, treeY, 8, 20)
  ctx.fillStyle = '#2d8a4e'
  ctx.beginPath()
  ctx.arc(treeX, treeY - 5, 16, 0, Math.PI * 2)
  ctx.fill()

  return shapes
}

const drawHighlight = (ctx, x, y, radius, success) => {
  ctx.strokeStyle = success ? '#2ecc71' : '#e74c3c'
  ctx.lineWidth = 3
  ctx.setLineDash(success ? [] : [5, 3])
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.stroke()
  ctx.setLineDash([])
}

const generatePuzzle = () => {
  verified.value = false
  message.value = ''
  selectedColor.value = null

  const ctx1 = canvas1.value.getContext('2d')
  const ctx2 = canvas2.value.getContext('2d')
  const w = canvas1.value.width
  const h = canvas1.value.height

  // Generate base scene shapes
  const shapes = []
  const shapeCount = 5 + Math.floor(Math.random() * 3)

  // Generate shared random params
  const cloudX = 30 + Math.random() * 60
  const treeX = 20 + Math.random() * (w - 40)

  // Draw base scene on both canvases
  const drawBase = (ctx) => {
    const sky = ctx.createLinearGradient(0, 0, 0, h * 0.6)
    sky.addColorStop(0, '#87ceeb')
    sky.addColorStop(1, '#e0f0ff')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, w, h * 0.6)

    const ground = ctx.createLinearGradient(0, h * 0.6, 0, h)
    ground.addColorStop(0, '#90c77a')
    ground.addColorStop(1, '#6aad55')
    ctx.fillStyle = ground
    ctx.fillRect(0, h * 0.6, w, h * 0.4)

    ctx.fillStyle = '#ffd700'
    ctx.beginPath()
    ctx.arc(w - 25, 25, 18, 0, Math.PI * 2)
    ctx.fill()

    // Cloud
    ctx.fillStyle = 'rgba(255,255,255,0.8)'
    ctx.beginPath()
    ctx.arc(cloudX, 25, 14, 0, Math.PI * 2)
    ctx.arc(cloudX + 12, 20, 10, 0, Math.PI * 2)
    ctx.arc(cloudX + 20, 25, 12, 0, Math.PI * 2)
    ctx.fill()

    // Tree
    ctx.fillStyle = '#8B4513'
    ctx.fillRect(treeX - 4, h * 0.55, 8, 20)
    ctx.fillStyle = '#2d8a4e'
    ctx.beginPath()
    ctx.arc(treeX, h * 0.55 - 5, 16, 0, Math.PI * 2)
    ctx.fill()
  }

  drawBase(ctx1)
  drawBase(ctx2)

  // Generate shared shapes
  for (let i = 0; i < shapeCount; i++) {
    const type = randomShape()
    const x = 20 + Math.random() * (w - 40)
    const y = 20 + Math.random() * (h - 40)
    const size = 8 + Math.random() * 16
    const color = randomColor()
    shapes.push({ type, x, y, size, color })
    drawShape(ctx1, type, x, y, size, color)
    drawShape(ctx2, type, x, y, size, color)
  }

  // Choose one random shape to modify on canvas2 — that's the diff
  const diffIndex = Math.floor(Math.random() * shapes.length)
  const diff = shapes[diffIndex]

  // Modify: change its color
  let newColor = randomColor()
  while (newColor === diff.color) {
    newColor = randomColor()
  }

  // Redraw the modified shape on canvas2
  drawShape(ctx2, diff.type, diff.x, diff.y, diff.size, newColor)

  // Store diff region
  diffRegion.value = { x: diff.x, y: diff.y, radius: Math.max(diff.size + 6, 18) }
}

const selectedColor = ref(null)

const handleCanvas1Click = (e) => {
  if (verified.value) return
  const rect = canvas1.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  checkClick(x, y, canvas1.value)
}

const handleCanvas2Click = (e) => {
  if (verified.value) return
  const rect = canvas2.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  checkClick(x, y, canvas2.value)
}

const checkClick = (x, y, canvasEl) => {
  const dx = x - diffRegion.value.x
  const dy = y - diffRegion.value.y
  const dist = Math.sqrt(dx * dx + dy * dy)

  if (dist <= diffRegion.value.radius + 5) {
    // Correct!
    const ctx = canvasEl.getContext('2d')
    drawHighlight(ctx, diffRegion.value.x, diffRegion.value.y, diffRegion.value.radius, true)
    verified.value = true
    message.value = ''
    setTimeout(() => props.onResult(true), 1500)
  } else {
    // Wrong spot
    const ctx = canvasEl.getContext('2d')
    ctx.strokeStyle = 'rgba(231, 76, 60, 0.5)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(x - 6, y - 6)
    ctx.lineTo(x + 6, y + 6)
    ctx.moveTo(x + 6, y - 6)
    ctx.lineTo(x - 6, y + 6)
    ctx.stroke()

    message.value = '❌ Not there! Keep looking...'
    messageClass.value = 'text-red-600'
    setTimeout(() => { message.value = '' }, 1500)
  }
}

onMounted(() => {
  generatePuzzle()
})
</script>
