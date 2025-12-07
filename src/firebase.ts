import { getFirestore } from 'firebase/firestore'
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { getAnalytics } from 'firebase/analytics'

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// const firebaseConfig = {
//   apiKey: "AIzaSyAiu9JFruHnV4nNSdutMmM1DzjvtWukxXo",
//   authDomain: "cis371-ee861.firebaseapp.com",
//   projectId: "cis371-ee861",
//   storageBucket: "cis371-ee861.firebasestorage.app",
//   messagingSenderId: "628607970460",
//   appId: "1:628607970460:web:35f29fa375d11dccd49159",
//   measurementId: "G-MVZWWFVJHX"
// };

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAzgiYzFiK7gYkfLVMMmJT32JMSZMedzMk",
  authDomain: "quizlet-project-bf6c0.firebaseapp.com",
  projectId: "quizlet-project-bf6c0",
  storageBucket: "quizlet-project-bf6c0.firebasestorage.app",
  messagingSenderId: "497819954348",
  appId: "1:497819954348:web:35d3b7a815acb30764c309"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app)
export const auth = getAuth(app)
