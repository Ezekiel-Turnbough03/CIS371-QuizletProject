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

      this.unsubscribe = onSnapshot(setsRef, async (snapshot) => {
        if (snapshot.empty) {
          await this.DefaultSet();
          return;
        }

        this.sets = snapshot.docs.map((doc) => ({
          id: doc.id!,
          name: doc.data().name,
          cards: []
        }));
        this.setsLoaded = true;

        if (!this.currentSetId && this.sets.length > 0) {
          this.currentSetId = this.sets[0]?.id ?? null;
        }
        if (this.currentSetId) {
          this.loadCards(this.currentSetId);
        }
      });
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

    async DefaultSet() {
      if (!this.user) return;

      if (this.sets.length > 0) return;

      const SetRef = await addDoc(
        collection(db, "users", this.user.uid, "flashcardSets"),
        { name: "CIS371" }
      );

      const defaultCards = [
        { term: "CSS", definition: "Cascading Style Sheet. Used to define the visual presentation of a web page" },
        { term: "DOM Tree", definition: "Document Object Model Tree. Tree-like model where each element of a web page is organized into nodes placed in a parent child hierarchical structure." },
        { term: "Flexbox", definition: "CSS container used to align nested web page elements in within a larger container." },
        { term: "HTML", definition: "Hypertext Markup Language, Not a programming language, but a presentation language, Code for structuring and displaying a web document, An HTML file should have either an .htm or .html file extension" },
        { term: "Web Page", definition: "Document written in HTML (Hypertext Markup Language)" },
        { term: "Web Server", definition: "Computer that stores and delivers web pages" }
      ];

      for (const card of defaultCards) {
        await addDoc(
          collection(db, "users", this.user.uid, "flashcardSets", SetRef.id, "cards"), card
        );
      }
      this.currentSetId = SetRef.id;
    }, 
    }
  },)
