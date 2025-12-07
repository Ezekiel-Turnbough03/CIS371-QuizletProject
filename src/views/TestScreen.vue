<template>
  <div>
    <h1>Test</h1>

    <nav class="selector_container">
      <router-link class="SelectorCard" to="/">Back</router-link>
    </nav>

    <!-- while loading -->
    <div v-if="!currentSet">
      <p>Loading flashcards...</p>
    </div>

    <!-- Results -->
    <div v-else-if="showResults">
      <h2>Test Complete!</h2>
      <p>You got {{ correctCount }} / {{ shuffledCards.length }} correct.</p>

      <button class="reset" @click="restartTest">TRY AGAIN</button>

      <div v-if="missedQuestions.length > 0" class="missed-section">
        <h3>Missed Questions:</h3>

        <div
          v-for="(item, i) in missedQuestions"
          :key="i"
          class="missed-item"
        >
          <p><strong>Definition:</strong> {{ item.definition }}</p>
          <p><strong>Correct:</strong> {{ item.correctTerm }}</p>
          <p><strong>You wrote:</strong> {{ item.userAnswer }}</p>
        </div>
      </div>
    </div>

    <!-- Question Screen -->
    <div v-else class="test-container">
      <h2>Definition:</h2>

      <div class="tile question-tile">
        {{ currentCard?.definition ?? "No cards found" }}
      </div>

      <input
        v-model="userAnswer"
        class="answer-input"
        placeholder="Type the term here..."
      />

      <button class="reset" @click="submitAnswer">SUBMIT</button>

      <p class="question-counter">
        Question {{ index + 1 }} / {{ shuffledCards.length }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue"
import { useFlashcardStore } from "@/stores/FlashcardStore"

// store
const flashcardStore = useFlashcardStore()
// flashcardStore.init()

const index = ref(0)
const userAnswer = ref("")
const correctCount = ref(0)
const showResults = ref(false)
const shuffledCards = ref<any[]>([])
const missedQuestions = ref<any[]>([])
const currentSet = computed(() => flashcardStore.sets.find(s => s.id === flashcardStore.currentSetId))
const cards = computed(() => currentSet.value?.cards ?? [])


// shuffle cards after loaded
onMounted(() => {
  setTimeout(() => {
    shuffledCards.value = [...cards.value].sort(
      () => Math.random() - 0.5
    )
  }, 200)
})

const currentCard = computed(() => {
  return shuffledCards.value[index.value]
})

// submit answer
function submitAnswer() {
  const card = currentCard.value
  if (!card) return

  const correct = card.term.toLowerCase().trim()
  const typed = userAnswer.value.toLowerCase().trim()

  if (typed === correct) {
    correctCount.value++
  } else {
    missedQuestions.value.push({
      definition: card.definition,
      correctTerm: card.term,
      userAnswer: userAnswer.value
    })
  }

  if (index.value + 1 >= shuffledCards.value.length) {
    showResults.value = true
  } else {
    index.value++
    userAnswer.value = ""
  }
}

function restartTest() {
  index.value = 0
  userAnswer.value = ""
  correctCount.value = 0
  showResults.value = false
  missedQuestions.value = []

  shuffledCards.value = [...cards.value].sort(
    () => Math.random() - 0.5
  )
}
</script>

<style scoped>
.tile {
  background: #ddd;
  padding: 25px;
  text-align: center;
  border-radius: 10px;
  min-height: 80px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 22px;
}

.question-tile {
  margin: 20px auto;
  width: 70%;
  background: rgb(51, 70, 133);
  color: white;
}

.answer-input {
  display: block;
  margin: 10px auto;
  padding: 10px;
  font-size: 18px;
  width: 60%;
  border-radius: 6px;
  border: none;
}

.reset {
  padding: 10px 20px;
  margin-top: 10px;
  background: rgb(51, 70, 133);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: block;
  margin-left: auto;
  margin-right: auto;
}

.reset:hover {
  background: rgb(179, 179, 179);
}

.missed-section {
  margin-top: 20px;
  padding: 10px;
  background: rgb(38, 50, 105);
  border-radius: 8px;
  width: 70%;
  margin-left: auto;
  margin-right: auto;
}

.missed-item {
  background: rgb(51, 70, 133);
  padding: 10px;
  border-radius: 6px;
  margin-bottom: 15px;
  color: white;
}

.question-counter {
  text-align: center;
  margin-top: 15px;
  font-size: 18px;
}
</style>
