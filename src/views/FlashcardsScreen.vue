<template>
  <div class="flashcard-screen">
    <nav class="selector_container">
      <router-link class="SelectorCard" to="/">Back</router-link>
    </nav>

    <div class="auth-row">
      <button v-if="!flashcardStore.user" @click="withGoogle">Sign In</button>
      <div v-else class="logged-in-row">
        <span class="user-label">Signed in as {{  flashcardStore.user.email }}</span>
        <button @click="signOutUser">Sign Out</button>
      </div>
    </div>

    <div class="FlashCard" @click="FlipCard">
      <div class="flip-inner" :class="{ 'is-flipped': isFlipped }">
        <div class="flip-face flip-front">
          {{ currentCard?.term ?? 'No cards' }}
        </div>

        <div class="flip-face flip-back">
          {{ currentCard?.definition ?? '' }}
        </div>
      </div>
    </div>

    <div class="Direction">
      <button @click="GoToPreviousCard">Previous</button>
      <button @click="GoToNextCard">Next</button>
    </div>

    <div class="add-card" v-if="flashcardStore.user && currentSet">
      <h3>Add New Flashcard to "{{ currentSet.name }}"</h3>
      <input v-model="newTerm" placeholder="Enter Term" class="input" />
      <input v-model="newDefinition" placeholder="Enter Definition" class="input" />
      <button @click="addCard" class="add-button">Add Flashcard</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useFlashcardStore } from '@/stores/FlashcardStore'
import { withGoogle, signOutUser } from '@/auth'
const flashcardStore = useFlashcardStore()
// flashcardStore.init()

const currentIndex = ref(0)
const isFlipped = ref(false)
const newTerm = ref("")
const newDefinition = ref("")
const newSetName = ref("")
const currentSet = computed(() => flashcardStore.sets.find(s => s.id === flashcardStore.currentSetId))
const currentCard = computed(() => currentSet.value?.cards[currentIndex.value])

// when selected set changes
watch(() => flashcardStore.currentSetId, (id) => {
  currentIndex.value = 0
  isFlipped.value = false
  if (id) flashcardStore.loadCards(id)
})

// when user logs in select first set
watch(() => flashcardStore.user, (user) => {
  if (user && flashcardStore.sets.length > 0 && !flashcardStore.currentSetId) {
    const firstSet = flashcardStore.sets[0]
    if (firstSet?.id) {
      flashcardStore.currentSetId = firstSet.id
    }
  }
})

// when sets load
watch(() => flashcardStore.sets, (sets) => {
  if (sets.length > 0 && !flashcardStore.currentSetId) {
    const firstSet = sets[0]
    if (firstSet?.id) {
      flashcardStore.currentSetId = firstSet.id
    }
    flashcardStore.setsLoaded = true
  }
}, {immediate: true})

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

// add new flashcard to selected set
async function addCard() {
  if (!newTerm.value.trim() || !newDefinition.value.trim() || !currentSet.value) return;
  await flashcardStore.addCardToSet(currentSet.value.id!,{ term: newTerm.value, definition: newDefinition.value });
  newTerm.value = ""
  newDefinition.value = ""
}

</script>

<style scoped>
.auth-row {
  margin-bottom: 12px
}
.user-label {
  margin-right: 8px;
}
</style>