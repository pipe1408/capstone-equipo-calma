// lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAk_BFX2yGGOSOqXj6EWZTQJ6QAbfTfpWs",
  authDomain: "calma-e4469.firebaseapp.com",
  projectId: "calma-e4469",
  storageBucket: "calma-e4469.firebasestorage.app",
  messagingSenderId: "506269325697",
  appId: "1:506269325697:web:ec674f520c54f744f97080"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar la instancia de autenticación
export const auth = getAuth(app);