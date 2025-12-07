import { defineStore } from 'pinia'
import { ref, computed, onMounted } from 'vue'
import { db } from '../firebase'
import type { User } from "firebase/auth"
import { onSnapshot, collection, addDoc, doc } from 'firebase/firestore'

export interface Flashcard {
  id?: string
  term: string
  definition: string
}

export interface FlashcardSet {
  id?: string
  name: string
  cards: Flashcard[]
}

export const useFlashcardStore = defineStore('FlashcardStore', {
  state: () => ({
    sets: [] as FlashcardSet[],
    currentSetId: null as string | null,
    user: null as User | null,
    unsubscribe: null as null | (() => void),
    setsLoaded: false
  }),

  actions: {
    setUser(user: User | null) {
      this.user = user

      if (this.unsubscribe) {
        this.unsubscribe()
        this.unsubscribe = null
      }

      if (!user) {
        this.sets = []
        this.currentSetId = null
        return
      }

      const setsRef = collection(db, "users", user.uid, "flashcardSets")

      this.unsubscribe = onSnapshot(setsRef, (snapshot) => {
        this.sets = snapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
          cards: []
        }))
      })
    },

    // init() {
    //   if (!this.user) return;

    //   if (this.unsubscribe) {
    //     this.unsubscribe();
    //   }

    //   const terms_list = collection(db, "users", this.user.uid, 'flashcards')

    //   this.unsubscribe = onSnapshot(terms_list, (snapshot) => {
    //     this.cards = snapshot.docs.map((doc) => ({
    //       id: doc.id,
    //       ...doc.data()
    //     })) as any;
    //   });
    // },

    async addSet(name: string) {
      if (!this.user) return
      const setsRef = collection(db, "users", this.user.uid, "flashcardSets")
      const newSetRef = await addDoc(setsRef, { name })
      this.sets.push({ id: newSetRef.id, name, cards: [] })
      this.currentSetId = newSetRef.id
    },

    async loadCards(setId: string) {
      if (!this.user) return
      const cardsRef = collection(db, "users", this.user?.uid, "flashcardSets", setId, "cards")
      onSnapshot(cardsRef, snapshot => {
        const set = this.sets.find(s => s.id === setId)
        if (set) {
          set.cards = snapshot.docs.map(doc => ({
            id: doc.id,
            ...(doc.data() as { term: string; definition: string })
          }))
        }
      })
      this.currentSetId = setId
    },

    async addCardToSet(setId: string, card: {term: string; definition: string}) {
      if (!this.user) return;
      const flashcardsRef = collection(db, "users", this.user.uid, 'flashcardSets', setId, "cards")
      await addDoc(flashcardsRef, card)
    },
  },
})
