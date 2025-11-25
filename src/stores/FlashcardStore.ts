import { defineStore } from 'pinia'
import { ref, computed, onMounted } from 'vue'
import { db } from '../firebase'
import { doc, getDoc, onSnapshot, QuerySnapshot } from 'firebase/firestore'

export interface Flashcard {
  term: string
  definition: string
}

export const useFlashcardStore = defineStore('FlashcardStore', {
  state: () => ({
    cards: [] as Flashcard[],
    loaded: false,
  }),

  actions: {
    init() {
      const terms_list = doc(db, 'study_guide', 'Terms')

      onSnapshot(terms_list, (snapshot) => {
        if (!snapshot.exists()) {
          console.error('Could not find terms document')
          return
        }
        const data = snapshot.data()

        this.cards = Object.entries(data).map(([term, definition]) => ({
          term,
          definition: String(definition),
        }))
        this.loaded = true
      })
    },
  },
})
