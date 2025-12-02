<template>
  <div>
    <h1>Matching</h1>

    <nav class="selector_container">
      <router-link class="SelectorCard" to="/">Back</router-link>
    </nav>

    <div class="grid">
      <div
        v-for="tile in tiles"
        :key="tile.id"
        class="tile"
        :class="{
          revealed: tile.revealed || tile.matched,
          matched: tile.matched
        }"
        @click="selectTile(tile)"
      >
        <span v-if="tile.revealed || tile.matched">
          {{ tile.value }}
        </span>
      </div>
    </div>

    <div class="score">
      Matches: {{ matchedCount }} / {{ totalPairs }}
    </div>

    <button class="reset" @click="resetGame">RESET</button>
  </div>
</template>


<script setup lang="ts">
import {ref, computed, onMounted, watch } from "vue"
import { useFlashcardStore } from "@/stores/FlashcardStore";
import FlashcardsScreen from "./FlashcardsScreen.vue";

// Store
const flashcardStore = useFlashcardStore()
flashcardStore.init()

//tile type
interface Tile {
  id: number
  matchedId: number
  value: string
  type: "term" | "definition"
  revealed: boolean
  matched: boolean
}

const tiles = ref<Tile[]>([])
const selected = ref<Tile[]>([])
const totalPairs = computed(() => flashcardStore.cards.length)

// build 4x4 grid
onMounted(() => {
  // wait untul snapshot loads
  const unwatch = watch(
    () => flashcardStore.cards,
    (cards) => {
      if (cards.length > 0) {
        buildTiles()
      }
    },
    {immediate: true}
  )
})

function buildTiles() {
  const baseTiles: Tile[] = []

  flashcardStore.cards.forEach((card, index) => {
    baseTiles.push({
      id: index*2,
      matchedId: index,
      type: "term",
      value: card.term,
      revealed: false,
      matched: false
    })
    baseTiles.push({
      id: index * 2 + 1,
      matchedId: index,
      type: "definition",
      value: card.definition,
      revealed: false,
      matched: false
    })
  })

  //shuffle
  tiles.value = baseTiles
    .sort(() => Math.random() - .5)
    .slice(0, 16)
}

function selectTile(tile: Tile) {
  if (tile.revealed || tile.matched) return
  if (selected.value.length === 2) return

  tile.revealed = true
  selected.value.push(tile)

  if (selected.value.length === 2) {
    const [first, second] = selected.value

    if(!first || !second) return

    if (first.matchedId === second.matchedId) {
      first.matched = true
      second.matched = true
      selected.value = []
    } else {
      setTimeout(() => {
        first.revealed = false
        second.revealed = false
        selected.value = []
      }, 900)
    }
  }
}
const matchedCount = computed(() =>
  tiles.value.filter((tile) => tile.matched).length / 2)

function resetGame() {
  selected.value = [];
  tiles.value = [];
  buildTiles();
}


</script>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  padding: 20px;
}

.tile {
  background: #ddd;
  padding: 25px;
  text-align: center;
  border-radius: 10px;
  cursor: pointer;
  user-select: none;
  min-height: 80px;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: .3s;
}

.tile.revealed {
  background: black;
}

.tile.matched {
  background: green;
  cursor: default;
}

.score {
  text-align: center;
  margin-top: 10px;
  font-size: 18px;
}
</style>