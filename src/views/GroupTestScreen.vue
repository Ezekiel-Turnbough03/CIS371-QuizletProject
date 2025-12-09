<template>
  <div class="group-test">
    <nav class="selector_container">
      <router-link class="SelectorCard" to="/">Back</router-link>
    </nav>

    <!-- select mode -->
    <div v-if="mode === 'choose'" class="mode-select">
      <h2>Group Test</h2>
      <button @click="mode = 'host'">Host Game</button>
      <button @click="mode = 'join'">Join Game</button>
    </div>

    <!-- host setup -->
    <div v-else-if="mode === 'host' && !gameCode">
      <h2>Host a Game</h2>
      <p>Use your currently selected flashcard set.</p>
      <input
        v-model="hostNickname"
        class="input"
        placeholder="Enter your nickname"
      />
      <button @click="hostGame">Create Game</button>
    </div>

    <!-- lobby -->
    <div v-else-if="mode === 'host' && gameCode && phase === 'lobby'">
      <h2>Game Code: {{ gameCode }}</h2>
      <p>Share this code with your friends.</p>

      <h3>Players Joined:</h3>
      <ul>
        <li v-for="p in players" :key="p.name">
          {{ p.name }} (score: {{ p.score }})
        </li>
      </ul>

      <button @click="startGame" :disabled="players.length === 0">
        Start Game
      </button>
    </div>

    <!-- question -->
    <div v-else-if="phase === 'question' && cards.length > 0">
      <h2>Question {{ currentIndex + 1 }} / {{ cards.length }}</h2>
      <p v-if="gameCode">Game Code: {{ gameCode }}</p>

      <div class="question-box">
        {{ currentCard.definition }}
      </div>

      <div class="choices">
        <button
          v-for="choice in choices"
          :key="choice"
          class="choice-button"
          :disabled="hasAnswered"
          @click="submitChoice(choice)"
        >
          {{ choice }}
        </button>
      </div>

      <h3>Scores</h3>
      <ul>
        <li v-for="p in sortedPlayers" :key="p.name">
          {{ p.name }} – {{ p.score }}
        </li>
      </ul>

      <p v-if="hasAnswered">You have answered. Waiting for others...</p>
    </div>

    <!-- scoreboard -->
    <div v-else-if="phase === 'scoreboard'">
      <h2>Scoreboard</h2>
      <p>Results for Question {{ currentIndex + 1 }}</p>

      <ul>
        <li
          v-for="p in sortedPlayers"
          :key="p.name"
          :class="{ correct: p.lastAnswerCorrect }"
        >
          {{ p.name }} – {{ p.score }}
          <span v-if="p.lastAnswerCorrect"> (correct)</span>
        </li>
      </ul>

      <p>Next question starting soon...</p>
    </div>

    <!-- finished -->
    <div v-else-if="phase === 'finished'">
      <h2>Game Finished!</h2>
      <h3>Final Standings</h3>
      <ul>
        <li v-for="p in sortedPlayers" :key="p.name">
          {{ p.name }} – {{ p.score }}
        </li>
      </ul>

      <button @click="resetLocal">Back to Mode Select</button>
    </div>

    <!-- join -->
    <div v-else-if="mode === 'join' && !joined">
      <h2>Join a Game</h2>
      <input
        v-model="joinCode"
        class="input"
        placeholder="Enter Game Code"
      />
      <input
        v-model="nickname"
        class="input"
        placeholder="Enter Nickname"
      />
      <button @click="joinGame">Join</button>
    </div>

    <!-- waiting room -->
    <div v-else-if="mode === 'join' && joined && phase === 'lobby'">
      <h2>Waiting for Host to Start...</h2>
      <p>Game Code: {{ gameCode }}</p>
      <h3>Players:</h3>
      <ul>
        <li v-for="p in players" :key="p.name">
          {{ p.name }} – {{ p.score }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue"
import { db } from "@/firebase"
import { useFlashcardStore } from "@/stores/FlashcardStore"
import {
  doc,
  setDoc,
  updateDoc,
  collection,
  onSnapshot,
  getDoc
} from "firebase/firestore"

const flashcardStore = useFlashcardStore()

// variables
const mode = ref<"choose" | "host" | "join">("choose")
const gameCode = ref("")
const phase = ref<"lobby" | "question" | "scoreboard" | "finished">("lobby")
const hostNickname = ref("")
const joinCode = ref("")
const nickname = ref("")
const joined = ref(false)
const isHostClient = ref(false)
const cards = ref<any[]>([])
const currentIndex = ref(0)
const choices = ref<string[]>([])
const players = ref<any[]>([])
const hasAnswered = ref(false)
const scoredForIndex = ref<number | null>(null)

// create lobby code
function generateCode() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  return (
    letters[Math.floor(Math.random() * 26)] +
    letters[Math.floor(Math.random() * 26)] +
    Math.floor(100 + Math.random() * 900)
  )
}

const currentCard = computed(() => cards.value[currentIndex.value] || {})

const sortedPlayers = computed(() =>
  [...players.value].sort((a, b) => b.score - a.score)
)

// build multiple choices for each question
function buildChoices() {
  const card = currentCard.value
  if (!card || !card.term) {
    choices.value = []
    return
  }

  const correct = card.term
  const others = cards.value.filter((c, i) => i !== currentIndex.value)

  const wrong = [...others].sort(() => Math.random() - 0.5).slice(0, 3)
  const all = [...wrong.map(c => c.term), correct]

  choices.value = all.sort(() => Math.random() - 0.5)
}

// update choices when question changes
watch([() => currentIndex.value, () => cards.value.length, () => phase.value], () => {
  if (phase.value === "question" && cards.value.length > 0) {
    hasAnswered.value = false
    buildChoices()
  }
})

// Firestore listeners
function setupGameListeners(code: string) {
  const gameRef = doc(db, "group_games", code)
  const playersRef = collection(gameRef, "players")

  onSnapshot(gameRef, (snap) => {
    const data = snap.data()
    if (!data) return
    phase.value = data.phase || "lobby"
    currentIndex.value = data.currentQuestionIndex ?? 0
    cards.value = data.cards || []
  })

  onSnapshot(playersRef, (snap) => {
    players.value = snap.docs.map((d) => d.data())

    const everyoneAnswered =
      players.value.length > 0 &&
      players.value.every((p) => p.hasAnswered)

    if (
      isHostClient.value &&
      phase.value === "question" &&
      everyoneAnswered &&
      scoredForIndex.value !== currentIndex.value
    ) {
      scoredForIndex.value = currentIndex.value
      scoreCurrentQuestion()
    }
  })
}

// host creates a game
async function hostGame() {
  if (!hostNickname.value.trim()) {
    alert("Please enter a nickname.")
    return
  }

  if (!flashcardStore.currentSetId) {
    alert("Select a flashcard set first.")
    return
  }

  const set = flashcardStore.sets.find(s => s.id === flashcardStore.currentSetId)
  if (!set || set.cards.length === 0) {
    alert("Selected set has no cards.")
    return
  }

  isHostClient.value = true
  mode.value = "host"

  cards.value = [...set.cards].sort(() => Math.random() - 0.5)
  currentIndex.value = 0

  const code = generateCode()
  gameCode.value = code

  const gameRef = doc(db, "group_games", code)
  await setDoc(gameRef, {
    host: hostNickname.value,
    setId: set.id,
    setName: set.name,
    cards: cards.value,
    currentQuestionIndex: 0,
    phase: "lobby",
    createdAt: Date.now()
  })

  const playersRef = collection(gameRef, "players")
  await setDoc(doc(playersRef, hostNickname.value), {
    name: hostNickname.value,
    score: 0,
    hasAnswered: false,
    lastAnswerCorrect: false,
    lastChoice: "",
    answerTime: 0
  })

  joined.value = true
  setupGameListeners(code)
}

async function startGame() {
  if (!gameCode.value) return

  await updateDoc(doc(db, "group_games", gameCode.value), {
    phase: "question",
    currentQuestionIndex: 0
  })

  scoredForIndex.value = null
}

// joining a game
async function joinGame() {
  if (!joinCode.value.trim() || !nickname.value.trim()) {
    alert("Enter both fields.")
    return
  }

  const code = joinCode.value.trim().toUpperCase()
  const gameRef = doc(db, "group_games", code)
  const snap = await getDoc(gameRef)

  if (!snap.exists()) {
    alert("Game not found.")
    return
  }

  isHostClient.value = false
  gameCode.value = code

  const data = snap.data()
  cards.value = data?.cards || []
  currentIndex.value = data?.currentQuestionIndex ?? 0
  phase.value = data?.phase || "lobby"

  const playersRef = collection(gameRef, "players")
  await setDoc(doc(playersRef, nickname.value.trim()), {
    name: nickname.value.trim(),
    score: 0,
    hasAnswered: false,
    lastAnswerCorrect: false,
    lastChoice: "",
    answerTime: 0
  })

  joined.value = true
  setupGameListeners(code)
}

// answering
async function submitChoice(choice: string) {
  if (hasAnswered.value || !gameCode.value) return
  if (phase.value !== "question") return

  hasAnswered.value = true

  const card = currentCard.value
  if (!card || !card.term) return

  const correctAnswer = card.term.trim().toLowerCase()
  const picked = choice.trim().toLowerCase()

  const correct = picked === correctAnswer
  const name = isHostClient.value ? hostNickname.value : nickname.value

  const current = players.value.find(p => p.name === name)
  const score = current ? current.score : 0

  await updateDoc(doc(db, "group_games", gameCode.value, "players", name), {
    hasAnswered: true,
    lastAnswerCorrect: correct,
    lastChoice: choice,
    answerTime: Date.now(),
    score
  })
}

// scoring
async function scoreCurrentQuestion() {
  if (!gameCode.value) return

  const gameRef = doc(db, "group_games", gameCode.value)
  const playersRef = collection(gameRef, "players")
  const total = players.value.length

  const correctPlayers = players.value
    .filter(p => p.lastAnswerCorrect)
    .sort((a, b) => (a.answerTime || 0) - (b.answerTime || 0))

  for (let i = 0; i < correctPlayers.length; i++) {
    const p = correctPlayers[i]
    const gain = Math.max(total - i, 1)
    await updateDoc(doc(playersRef, p.name), {
      score: (p.score || 0) + gain
    })
  }

  await updateDoc(gameRef, { phase: "scoreboard" })

  setTimeout(async () => {
    await advanceToNextQuestion()
  }, 4000)
}

async function advanceToNextQuestion() {
  if (!gameCode.value) return

  const gameRef = doc(db, "group_games", gameCode.value)
  const playersRef = collection(gameRef, "players")

  if (currentIndex.value + 1 >= cards.value.length) {
    await updateDoc(gameRef, { phase: "finished" })
    return
  }

  const next = currentIndex.value + 1
  currentIndex.value = next
  scoredForIndex.value = null

  await updateDoc(gameRef, {
    currentQuestionIndex: next,
    phase: "question"
  })

  for (const p of players.value) {
    await updateDoc(doc(playersRef, p.name), {
      hasAnswered: false,
      lastAnswerCorrect: false,
      lastChoice: "",
      answerTime: 0
    })
  }
}

// go back to choose screen
function resetLocal() {
  mode.value = "choose"
  gameCode.value = ""
  joinCode.value = ""
  nickname.value = ""
  hostNickname.value = ""
  joined.value = false
  isHostClient.value = false
  phase.value = "lobby"
  cards.value = []
  currentIndex.value = 0
  players.value = []
  choices.value = []
  hasAnswered.value = false
  scoredForIndex.value = null
}
</script>

<style scoped>
.group-test {
  padding: 20px;
}

.mode-select {
  text-align: center;
}

.question-box {
  margin: 20px auto;
  width: 60%;
  background: #334688;
  color: white;
  padding: 20px;
  border-radius: 10px;
  text-align: center;
}

.input {
  padding: 10px;
  width: 60%;
  margin: 10px auto;
  display: block;
  border-radius: 6px;
  border: none;
}

.choices {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-bottom: 20px;
}

.choice-button {
  padding: 10px 20px;
  min-width: 140px;
  background: rgb(51, 70, 133);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.choice-button:disabled {
  opacity: 0.6;
  cursor: default;
}

button {
  padding: 10px 20px;
  margin: 10px;
  background: rgb(51, 70, 133);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

button:hover {
  background: rgb(179, 179, 179);
}

ul {
  list-style: none;
  padding: 0;
}

.correct {
  color: #4caf50;
  font-weight: bold;
}
</style>
