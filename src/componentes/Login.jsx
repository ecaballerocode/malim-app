// Login.js
import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../credenciales";
import { useNavigate } from "react-router-dom"; // Importamos el hook de navegación

const Login = () => {
  const navigate = useNavigate(); // Inicializamos la navegación
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Limpiamos errores anteriores

    try {
      await signInWithEmailAndPassword(auth, email, password);
      
      // La autenticación fue exitosa.
      // 💡 CORRECCIÓN CLAVE: Forzamos la navegación a la ruta principal ('/')
      // Esto rompe el bucle de redirección en el navegador.
      navigate('/'); 

    } catch (err) {
      // Manejo de errores de Firebase
      setError("Correo o contraseña incorrectos");
      console.error("Error de autenticación:", err.message);
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h2 style={styles.title}>Inicia Sesión</h2>

        {error && <p style={styles.error}>{error}</p>}

        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
          required
        />

        <button type="submit" style={styles.button}>
          Entrar
        </button>
      </form>
    </div>
  );
};

// --- Estilos ---
const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    backgroundColor: "#F5EBDD", // Nude suave
    padding: "1rem",
  },
  form: {
    backgroundColor: "#fff",
    padding: "2rem",
    borderRadius: "1rem",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    width: "100%",
    maxWidth: "400px",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  title: {
    textAlign: "center",
    color: "#3C3C3C",
    marginBottom: "1rem",
  },
  input: {
    padding: "0.75rem",
    borderRadius: "0.5rem",
    border: "1px solid #C2C2C2",
    fontSize: "1rem",
    outline: "none",
    color: "#3C3C3C",
  },
  button: {
    backgroundColor: "#D88C6D",
    color: "#fff",
    padding: "0.75rem",
    border: "none",
    borderRadius: "0.5rem",
    fontSize: "1rem",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "background 0.3s",
  },
  error: {
    color: "red",
    fontSize: "0.9rem",
    textAlign: "center",
  },
};

// Nota: Los estilos de hover no funcionan con objetos inline, 
// se mantienen en el código pero deben manejarse con CSS regular o librerías.
// styles.button[":hover"] = {
//   backgroundColor: "#c0765b",
// };

export default Login;