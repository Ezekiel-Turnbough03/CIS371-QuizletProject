<template>
  <div>
    <header>
      <h1 style="margin-left: 80px">Study Guide</h1>

      <nav class="selector_container">
        <router-link class="SelectorCard" to="/flashcards">FlashCards</router-link>
        <router-link class="SelectorCard" to="/matching">Matching</router-link>
        <router-link class="SelectorCard" to="/test">Test</router-link>
        <router-link class="SelectorCard" to="/group-test">GroupTest</router-link>
      </nav>
    </header>

    <button v-if="flashcardStore.sets.length > 0" @click="createNewSet">New Set</button>

    <div v-if="flashcardStore.sets.length > 0" class="set-selector">
      <label>Select Set: </label>
      <select v-model="flashcardStore.currentSetId">
        <option v-for="set in flashcardStore.sets" :key="set.id" :value="set.id">
          {{ set.name }}
        </option>
      </select>
    </div>

    <div class="FlashCard" @click="FlipCard">
      <div class="flip-inner" :class="{ 'is-flipped': isFlipped }">
        <div class="flip-face flip-front">
          {{ currentCard?.term ?? 'No term' }}
        </div>
        <div class="flip-face flip-back">
          {{ currentCard?.definition ?? 'No definition' }}
        </div>
      </div>
    </div>

    <div class="Direction">
      <button @click="GoToPreviousCard">Previous</button>
      <button @click="GoToNextCard">Next</button>
    </div>

    <div class="terms_container">
      <h2>Terms in this set: {{ currentSet?.cards.length ?? 0 }}</h2>

      <div class="TermsBox" v-for="cards in currentSet?.cards" :key="cards.id">
        <div class="term">{{ cards.term }}</div>
        <div class="definition">{{ cards.definition }}</div>
      </div>

      <footer style="margin-left: 80px; margin-top: 40px">
        <p>Names: Ezekiel Turnbough, Ethan Umana, Tristian Paquette</p>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useFlashcardStore } from '@/stores/FlashcardStore'
import { storeToRefs } from 'pinia'

const flashcardStore = useFlashcardStore()
// flashcardStore.init()

const currentIndex = ref(0)
const isFlipped = ref(false)

const currentSet = computed(() =>
  flashcardStore.sets.find((s) => s.id === flashcardStore.currentSetId),
)
const currentCard = computed(() => currentSet.value?.cards[currentIndex.value])

watch(
  () => flashcardStore.currentSetId,
  (id) => {
    if (id) flashcardStore.loadCards(id)
    currentIndex.value = 0
    isFlipped.value = false
  },
)

function FlipCard() {
  if (!currentSet.value || currentSet.value.cards.length === 0) return
  isFlipped.value = !isFlipped.value
}

function GoToNextCard() {
  if (!currentSet.value || currentSet.value.cards.length === 0) return
  currentIndex.value = (currentIndex.value + 1) % currentSet.value.cards.length
  isFlipped.value = false
}

function GoToPreviousCard() {
  if (!currentSet.value || currentSet.value.cards.length === 0) return
  currentIndex.value =
    (currentIndex.value - 1 + currentSet.value.cards.length) % currentSet.value.cards.length
  isFlipped.value = false
}

const createNewSet = () => {
  const name = prompt('Enter The Set Name: ')
  if (name && name.trim().length > 0) {
    flashcardStore.addNewSet(name.trim())
  }
}
</script>
