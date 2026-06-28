<template>
  <div class="p-4 text-center">
    <h2 class="text-lg font-semibold mb-4">🏇 Horse Racing</h2>
    <p class="text-sm text-gray-600 mb-4">Watch the race and pick the winning horse!</p>

    <!-- Canvas container -->
    <div class="flex justify-center mb-4">
      <canvas
        ref="canvas"
        width="360"
        height="280"
        class="border-4 border-gray-400 rounded-lg bg-gradient-to-b from-green-100 to-green-200"
      />
    </div>

    <!-- Horse selection buttons -->
    <div v-if="racing" class="mb-3">
      <p class="text-sm font-semibold text-amber-600 animate-pulse">🏇 Race in progress...</p>
    </div>

    <div v-else-if="!verified && finished" class="space-y-3">
      <p class="text-sm font-semibold text-gray-700 mb-2">Which horse won? Tap the number!</p>
      <div class="flex gap-2 justify-center mb-4">
        <button
          v-for="horse in horses"
          :key="horse.number"
          @click="selectWinner(horse.number)"
          :class="[
            'w-12 h-12 rounded-lg font-bold text-lg transition-all',
            selectedHorse === horse.number
              ? 'bg-amber-500 text-white scale-110 shadow-lg'
              : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
          ]"
        >
          {{ horse.number }}
        </button>
      </div>

      <button
        @click="handleSubmit"
        :disabled="selectedHorse === null"
        class="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-bold py-2 px-4 rounded-lg transition-colors"
      >
        ✓ Submit Answer
      </button>

      <p v-if="message" :class="messageClass" class="mt-2 font-semibold text-sm">
        {{ message }}
      </p>
    </div>

    <!-- Success state -->
    <div v-else-if="verified" class="space-y-3">
      <p class="text-5xl">✅</p>
      <p class="text-lg font-semibold text-green-600">Correct! Horse #{{ winnerNumber }} wins!</p>
    </div>

    <!-- Pre-race -->
    <div v-else class="space-y-3">
      <button
        @click="startRace"
        class="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
      >
        🏁 Start Race
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps(['onResult'])

const canvas = ref(null)
const ctx = ref(null)

const horses = ref([])
const winnerNumber = ref(0)
const selectedHorse = ref(null)
const racing = ref(false)
const finished = ref(false)
const verified = ref(false)
const message = ref('')
const messageClass = ref('')
const animationId = ref(null)

const HORSE_COUNT = 6
const LANE_HEIGHT = 34
const TRACK_TOP = 50
const TRACK_RIGHT = 340
const HORSE_SIZE = 20

// Generate horses with random speeds
const initHorses = () => {
  const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c']
  horses.value = Array.from({ length: HORSE_COUNT }, (_, i) => ({
    number: i + 1,
    color: colors[i],
    x: 40,
    y: TRACK_TOP + i * LANE_HEIGHT + LANE_HEIGHT / 2,
    speed: 0,
    finished: false,
  }))
}

// Draw the racetrack
const drawTrack = () => {
  const c = canvas.value
  const cx = ctx.value

  // Sky
  const skyGrad = cx.createLinearGradient(0, 0, 0, TRACK_TOP)
  skyGrad.addColorStop(0, '#87ceeb')
  skyGrad.addColorStop(1, '#e0f0ff')
  cx.fillStyle = skyGrad
  cx.fillRect(0, 0, c.width, TRACK_TOP)

  // Lanes
  for (let i = 0; i < HORSE_COUNT; i++) {
    const y = TRACK_TOP + i * LANE_HEIGHT
    cx.fillStyle = i % 2 === 0 ? '#d4e8b0' : '#c5dca0'
    cx.fillRect(30, y, TRACK_RIGHT - 30, LANE_HEIGHT)

    // Lane divider
    cx.strokeStyle = '#a0c070'
    cx.lineWidth = 1
    cx.beginPath()
    cx.moveTo(30, y)
    cx.lineTo(TRACK_RIGHT, y)
    cx.stroke()

    // Horse number label
    cx.fillStyle = '#333'
    cx.font = 'bold 12px Arial'
    cx.textAlign = 'center'
    cx.textBaseline = 'middle'
    cx.fillText(`#${i + 1}`, 18, y + LANE_HEIGHT / 2)
  }

  // Finish line
  cx.strokeStyle = '#000'
  cx.lineWidth = 3
  cx.beginPath()
  cx.moveTo(TRACK_RIGHT, TRACK_TOP)
  cx.lineTo(TRACK_RIGHT, TRACK_TOP + HORSE_COUNT * LANE_HEIGHT)
  cx.stroke()

  // Checkered pattern on finish line
  const checkerSize = 6
  for (let row = 0; row < HORSE_COUNT * LANE_HEIGHT / checkerSize; row++) {
    for (let col = 0; col < 3; col++) {
      cx.fillStyle = (row + col) % 2 === 0 ? '#000' : '#fff'
      cx.fillRect(
        TRACK_RIGHT + col * checkerSize,
        TRACK_TOP + row * checkerSize,
        checkerSize,
        checkerSize
      )
    }
  }

  // Track border
  cx.strokeStyle = '#555'
  cx.lineWidth = 2
  cx.strokeRect(30, TRACK_TOP, TRACK_RIGHT - 30, HORSE_COUNT * LANE_HEIGHT)
}

// Draw a single horse
const drawHorse = (horse) => {
  const cx = ctx.value
  const x = horse.x
  const y = horse.y
  const s = HORSE_SIZE

  cx.save()

  // Body
  cx.fillStyle = horse.color
  cx.beginPath()
  cx.ellipse(x, y, s, s * 0.55, 0, 0, Math.PI * 2)
  cx.fill()

  // Head
  cx.beginPath()
  cx.ellipse(x + s * 0.7, y - s * 0.4, s * 0.3, s * 0.25, -0.3, 0, Math.PI * 2)
  cx.fill()

  // Eye
  cx.fillStyle = '#fff'
  cx.beginPath()
  cx.arc(x + s * 0.8, y - s * 0.5, 2, 0, Math.PI * 2)
  cx.fill()
  cx.fillStyle = '#000'
  cx.beginPath()
  cx.arc(x + s * 0.8, y - s * 0.5, 1, 0, Math.PI * 2)
  cx.fill()

  // Legs (animated based on speed)
  cx.strokeStyle = horse.color
  cx.lineWidth = 3
  cx.lineCap = 'round'
  const legPhase = (x * 0.1) % (Math.PI * 2)
  // Front legs
  cx.beginPath()
  cx.moveTo(x + s * 0.4, y + s * 0.3)
  cx.lineTo(x + s * 0.4 + Math.sin(legPhase) * 6, y + s * 0.7)
  cx.stroke()
  // Back legs
  cx.beginPath()
  cx.moveTo(x - s * 0.3, y + s * 0.3)
  cx.lineTo(x - s * 0.3 + Math.sin(legPhase + Math.PI) * 6, y + s * 0.7)
  cx.stroke()

  // Number on body
  cx.fillStyle = '#fff'
  cx.font = 'bold 11px Arial'
  cx.textAlign = 'center'
  cx.textBaseline = 'middle'
  cx.fillText(horse.number, x, y)

  cx.restore()
}

// Animation loop
const animateRace = () => {
  const cx = ctx.value

  // Clear and redraw track
  drawTrack()

  // Update each horse
  let allFinished = true
  let firstFinisher = null

  horses.value.forEach((horse) => {
    if (horse.finished) {
      drawHorse(horse)
      return
    }

    // Random speed variation each frame (simulates real race unpredictability)
    horse.speed = 1.2 + Math.random() * 2.8
    horse.x += horse.speed

    // Check if finished
    if (horse.x >= TRACK_RIGHT - HORSE_SIZE) {
      horse.x = TRACK_RIGHT - HORSE_SIZE
      horse.finished = true
      if (!firstFinisher) {
        firstFinisher = horse
      }
    } else {
      allFinished = false
    }

    drawHorse(horse)
  })

  if (firstFinisher && !winnerNumber.value) {
    winnerNumber.value = firstFinisher.number
  }

  if (!allFinished) {
    animationId.value = requestAnimationFrame(animateRace)
  } else {
    // Race complete — show selection UI
    racing.value = false
    finished.value = true
  }
}

// Start the race
const startRace = () => {
  racing.value = true
  finished.value = false
  verified.value = false
  selectedHorse.value = null
  winnerNumber.value = 0
  message.value = ''
  initHorses()
  animateRace()
}

// Select winner
const selectWinner = (num) => {
  selectedHorse.value = selectedHorse.value === num ? null : num
}

// Handle submission
const handleSubmit = () => {
  if (selectedHorse.value === null) {
    message.value = '❌ Please pick a horse!'
    messageClass.value = 'text-red-600'
    return
  }

  if (selectedHorse.value === winnerNumber.value) {
    verified.value = true
    message.value = ''
    setTimeout(() => props.onResult(true), 1500)
  } else {
    message.value = `❌ Wrong! Horse #${winnerNumber.value} won. Racing again...`
    messageClass.value = 'text-red-600'
    selectedHorse.value = null

    setTimeout(() => {
      message.value = ''
      startRace()
    }, 1500)
  }
}

onMounted(() => {
  ctx.value = canvas.value.getContext('2d')
  initHorses()
  drawTrack()
  // Draw horses at starting position
  horses.value.forEach(drawHorse)
})

onUnmounted(() => {
  if (animationId.value) {
    cancelAnimationFrame(animationId.value)
  }
})
</script>
