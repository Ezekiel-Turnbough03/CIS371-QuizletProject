<template>
  <div>
    <header>
      <h1>Study Guide</h1>

      <nav class="selector_container">
        <router-link class="SelectorCard" to="/flashcards">FlashCards</router-link>
        <router-link class="SelectorCard" to="/matching">Matching</router-link>
        <router-link class="SelectorCard" to="/test">Test</router-link>
        <router-link class="SelectorCard" to="/group-test">GroupTest</router-link>
      </nav>
    </header>

    <div class="FlashCard">
      <div class="flip-inner">
        <div class="flip-front">Term 1</div>
        <div class="flip-back">Definition for Term 1</div>
      </div>
    </div>

    <div class="Arrows">
      <button>Previous</button>
      <button>Next</button>
    </div>

    <div class="terms_container">
      <h2>Terms in this set</h2>

      <div class="TermsBox">
        <div class="term">Term 1</div>
        <div class="definition">Sample definition text...</div>
      </div>
      <div class="TermsBox">
        <div class="term">Term 1</div>
        <div class="definition">Sample definition text...</div>
      </div>
      <div class="TermsBox">
        <div class="term">Term 1</div>
        <div class="definition">Sample definition text...</div>
      </div>
      <div class="TermsBox">
        <div class="term">Term 1</div>
        <div class="definition">Sample definition text...</div>
      </div>
      <!-- Add more TermsBox items here -->
    </div>

    <footer>
      <p>© 2024 My Online Store. All rights reserved.</p>
    </footer>
  </div>
</template>

<script setup>
// No script needed yet
</script>
