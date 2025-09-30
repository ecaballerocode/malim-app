import React, { createContext, useContext, useState, useEffect } from 'react';

// 🛑 IMPORTANTE: Ya NO importamos onAuthStateChanged directamente aquí
// import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../credenciales"; // Seguimos importando la instancia 'auth'

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(undefined);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Validación de la instancia auth
        if (!auth) {
            console.error("Firebase Auth no inicializado correctamente.");
            setLoading(false);
            return;
        }

        // 💡 CARGA DINÁMICA: Importamos la función onAuthStateChanged aquí dentro.
        // Esto le dice a Rollup que no intente empaquetarla en el módulo principal de inmediato.
        const loadAuthListener = async () => {
            try {
                // Importación dinámica de la función específica
                const { onAuthStateChanged } = await import("firebase/auth");
                
                // Suscribirse una vez que la función está disponible
                const unsubscribe = onAuthStateChanged(auth, (usuarioFirebase) => {
                    setUser(usuarioFirebase);
                    setLoading(false);
                });
                
                // Limpieza del listener
                return unsubscribe;

            } catch (error) {
                console.error("Error al cargar dinámicamente onAuthStateChanged:", error);
                setLoading(false);
                return () => {}; // Devuelve una función vacía para evitar errores
            }
        };

        const cleanup = loadAuthListener();
        
        // La limpieza se maneja cuando la promesa se resuelve
        return () => {
            if (typeof cleanup.then === 'function') {
                cleanup.then(unsub => {
                    if (unsub) unsub();
                });
            }
        };
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
