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

      // Creates default CIS371 set
      this.unsubscribe = onSnapshot(setsRef, async (snapshot) => {
        if (snapshot.empty) {
          await this.DefaultSet(); // CIS371 set
          return;
        }

        // mao Firestore document to local FlashcardSet object
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

    // Create default Food set
    this.unsubscribe = onSnapshot(setsRef, async (snapshot) => {
      await this.DefaultSet2(); // Food set

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

    // adds new flashcard set for the user
    async addSet(name: string) {
      if (!this.user) return
      const setsRef = collection(db, "users", this.user.uid, "flashcardSets")
      const newSetRef = await addDoc(setsRef, { name })
      this.sets.push({ id: newSetRef.id, name, cards: [] })
      this.currentSetId = newSetRef.id
    },

    async loadCards(setId: string) { // loads all cards from set
      if (!this.user) return
      const cardsRef = collection(db, "users", this.user?.uid, "flashcardSets", setId, "cards")
      onSnapshot(cardsRef, snapshot => { // set up listner for card updates
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

    // add new flashcard to selected set
    async addCardToSet(setId: string, card: {term: string; definition: string}) {
      if (!this.user) return;
      const flashcardsRef = collection(db, "users", this.user.uid, 'flashcardSets', setId, "cards")
      await addDoc(flashcardsRef, card)
    },

    // make first default set
    async DefaultSet() {
      if (!this.user) return;
      if (this.sets.length > 0) return;
      const SetRef = await addDoc(
        collection(db, "users", this.user.uid, "flashcardSets"),
        { name: "CIS371" } // make CIS371 set
      );

      const defaultCards = [ // make flashcards for CIS371 set
        { term: "CSS", definition: "Cascading Style Sheet. Used to define the visual presentation of a web page" },
        { term: "DOM Tree", definition: "Document Object Model Tree. Tree-like model where each element of a web page is organized into nodes placed in a parent child hierarchical structure." },
        { term: "Flexbox", definition: "CSS container used to align nested web page elements in within a larger container." },
        { term: "HTML", definition: "Hypertext Markup Language, Not a programming language, but a presentation language, Code for structuring and displaying a web document, An HTML file should have either an .htm or .html file extension" },
        { term: "Web Page", definition: "Document written in HTML (Hypertext Markup Language)" },
        { term: "Web Server", definition: "Computer that stores and delivers web pages" }
      ];

      for (const card of defaultCards) { // add flashcards to cards Document
        await addDoc(
          collection(db, "users", this.user.uid, "flashcardSets", SetRef.id, "cards"), card
        );
      }
      this.currentSetId = SetRef.id;
    },
    
    // make second default set
    async DefaultSet2() {
      if (!this.user) return;
      if (this.sets.length > 0) return;
      const SetRef = await addDoc(
        collection(db, "users", this.user.uid, "flashcardSets"),
        { name: "Food" } // make food set 
      )

      const defaultCards = [ // make flashcards for food set
        { term: "Cereal", definition: "A grain used for food, such as wheat, oats, or corn." },
        { term: "Rice", definition: "A swamp grass which is widely cultivated as a source of food, especially in Asia." },
        { term: "Broccoli", definition: "A cultivated variety of cabbage bearing heads of green or purplish flower buds that are eaten as a vegetable." },
        { term: "Groud Turkey", definition: "A versatile, minced meat made from turkey, combining dark and light meat with skin and fat, processed into a ground form, offering a leaner, high-protein alternative to ground beef for dishes" },
        { term: "Waffles", definition: "A crisp, batter-based cake with a grid pattern from being cooked in a waffle iron, often served with toppings like syrup or fruit." }
      ];

      for (const card of defaultCards) { // add fflashcards to cards Document
        await addDoc(
          collection(db, "users", this.user.uid, "flashcardSets", SetRef.id, "cards"), card
        );
      }
      this.currentSetId = SetRef.id;
    },

     // create a new flashcard set and load it
    async addNewSet(name: string) {
      if (!this.user) return;
      const setsRef = collection(db, "users", this.user.uid, "flashcardSets");
      const docRef = await addDoc(setsRef, {
        name: name,
      });
      this.currentSetId = docRef.id;
      await this.loadCards(docRef.id);
      }
    }
  },)
