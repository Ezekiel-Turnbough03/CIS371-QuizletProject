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
      <h2>Terms in this set: {{ flashcardStore.cards.length }}</h2>

      <div class="TermsBox" v-for="cards in flashcardStore.cards" :key="cards.term">
        <div class="term">{{ cards.term }}</div>
        <div class="definition">{{ cards.definition }}</div>
      </div>

      <footer style="margin-left: 80px; margin-top: 40px">
        <p>Names: Ezekiel Turnbough</p>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFlashcardStore } from '@/stores/FlashcardStore'

const flashcardStore = useFlashcardStore()
flashcardStore.init()

const currentIndex = ref(0)
const isFlipped = ref(false)

const currentCard = computed(() => flashcardStore.cards[currentIndex.value])

function FlipCard() {
  if (flashcardStore.cards.length === 0) return
  isFlipped.value = !isFlipped.value
}

function GoToNextCard() {
  if (flashcardStore.cards.length === 0) return
  currentIndex.value = (currentIndex.value + 1) % flashcardStore.cards.length
  isFlipped.value = false
}

function GoToPreviousCard() {
  if (flashcardStore.cards.length === 0) return
  currentIndex.value =
    (currentIndex.value - 1 + flashcardStore.cards.length) % flashcardStore.cards.length
  isFlipped.value = false
}
</script>
