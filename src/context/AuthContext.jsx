import React, { createContext, useContext, useState, useEffect } from 'react';
// ✅ Volvemos a la importación estática, ya que el build ahora funciona con .jsx
import { onAuthStateChanged } from "firebase/auth"; 
import { auth } from "../credenciales";

// 1. Crear el Contexto
const AuthContext = createContext();

// 2. Hook personalizado para usar el contexto fácilmente
export const useAuth = () => {
    return useContext(AuthContext);
};

// 3. Componente Proveedor
export const AuthProvider = ({ children }) => {
    // user: undefined (cargando), null (no logueado), object (logueado)
    const [user, setUser] = useState(undefined);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 🛑 Lógica mínima y limpia
        
        // Si la instancia de auth no está lista, simplemente no hacemos nada (aunque esto debería ser raro)
        if (!auth) {
            console.error("Firebase Auth no inicializado correctamente en credenciales.");
            setLoading(false);
            return;
        }

        // Este listener se ejecuta una vez que Firebase está listo
        const unsubscribe = onAuthStateChanged(auth, (usuarioFirebase) => {
            setUser(usuarioFirebase);
            setLoading(false); // La carga termina cuando recibimos el estado
        });

        // Limpieza del listener
        return () => unsubscribe();
        
    // Dependencias vacías, solo se ejecuta en el montaje
    }, []); 

    const value = {
        user,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
