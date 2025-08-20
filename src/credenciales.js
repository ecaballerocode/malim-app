// Importa las funciones necesarias de Firebase
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // 👈 Importa auth

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAcPmOLCEeL5sRenwhtTWCIBawWNcnD4Ls",
  authDomain: "malim-app.firebaseapp.com",
  projectId: "malim-app",
  storageBucket: "malim-app.appspot.com",
  messagingSenderId: "953747301080",
  appId: "1:953747301080:web:d3cfd18e9be012bb822dad"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Inicializa servicios
const db = getFirestore(app);
const auth = getAuth(app); // 👈 Inicializa Auth

console.log("Firestore inicializado: ", db);
console.log("Auth inicializado: ", auth);

// Exporta las instancias
export { db, auth };
