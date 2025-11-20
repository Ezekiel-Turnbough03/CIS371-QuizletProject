import { createRouter, createWebHistory } from 'vue-router'
import Main from '../views/MainScreen.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: Main },
    { path: '/flashcards', component: () => import('../views/FlashcardsScreen.vue') },
    { path: '/matching', component: () => import('../views/MatchingScreen.vue') },
    { path: '/test', component: () => import('../views/TestScreen.vue') },
    { path: '/group-test', component: () => import('../views/GroupTestScreen.vue') },
  ],
})

export default router
