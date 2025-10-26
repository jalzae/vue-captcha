<template>
  <div class="p-4 text-center">
    <h2 class="text-lg font-semibold mb-2">🎲 Dice Game</h2>
    <p>Guess how many dots the dice will show!</p>
    <div class="text-6xl my-4">{{ dice }}</div>

    <div v-if="rolling">Rolling...</div>

    <div v-else>
      <input
        v-model="input"
        type="number"
        placeholder="Enter 1–6"
        class="border p-2 rounded"
      />
      <button
        @click="handleSubmit"
        class="ml-2 bg-blue-500 text-white px-3 py-1 rounded"
      >
        Submit
      </button>
      <p class="mt-2">{{ message }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"

const props = defineProps(["onResult"])

const dice = ref(1)
const rolling = ref(false)
const input = ref("")
const message = ref("")

const rollDice = () => {
  rolling.value = true
  let rolls = 0
  const interval = setInterval(() => {
    dice.value = Math.floor(Math.random() * 6) + 1
    rolls++
    if (rolls > 10) {
      clearInterval(interval)
      rolling.value = false
    }
  }, 100)
}

onMounted(() => {
  rollDice()
})

const handleSubmit = () => {
  const guess = parseInt(input.value)
  if (guess === dice.value) {
    message.value = "✅ Correct!"
    setTimeout(() => props.onResult(true), 1000)
  } else {
    message.value = "❌ Wrong! Try again."
    rollDice()
  }
}
</script>
