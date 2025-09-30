// Importa las funciones necesarias de Firebase
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; 

// Configuración de Firebase (Tus claves estáticas)
const firebaseConfig = {
  apiKey: "AIzaSyAcPmOLCEeL5sRenwhtTWCIBawWNcnD4Ls",
  authDomain: "malim-app.firebaseapp.com",
  projectId: "malim-app",
  storageBucket: "malim-app.appspot.com",
  messagingSenderId: "953747301080",
  appId: "1:953747301080:web:d3cfd18e9be012bb822dad"
};

// 1. Inicializa la aplicación principal
const app = initializeApp(firebaseConfig);

// 2. Inicializa y exporta las instancias separadamente
// Esto asegura que cada módulo se carga correctamente.
export const db = getFirestore(app);
export const auth = getAuth(app); 

// Si usas storage en algún lugar:
// export const storage = getStorage(app); 

// Nota: No necesitamos el console.log en producción.
