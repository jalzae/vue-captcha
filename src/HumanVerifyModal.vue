<template>
  <div v-if="show" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div class="bg-white rounded-2xl p-6 shadow-lg w-96 relative">
      <button @click="close" class="absolute top-2 right-3 text-gray-600">✖</button>
      <component :is="gameComponent" :onResult="handleResult" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import ImageGame from "./games/ImageGame.vue"
import DiceGame from "./games/DiceGame.vue"

const props = defineProps(["onClose", "onSuccess"])
const show = ref(true)
const gameComponent = ref(null)

onMounted(() => {
  // Use multiple games - randomly select one
  const games = [ImageGame, DiceGame]
  const randomGame = games[Math.floor(Math.random() * games.length)]
  gameComponent.value = randomGame
})

const handleResult = (result) => {
  show.value = false
  props.onSuccess(result)
  props.onClose()
}

const close = () => {
  props.onSuccess(false)
  props.onClose()
}
</script>
