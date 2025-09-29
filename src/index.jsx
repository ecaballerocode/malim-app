import React, { useState, useEffect } from "react";
import ReactDOM from 'react-dom/client';
// Asegúrate de que importas BrowserRouter como Router para mantener tu código JSX
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { onAuthStateChanged } from "firebase/auth";
import { auth } from './credenciales';

// Importaciones de Componentes
import App from './App';
import Disponible from './componentes/disponible';
import FormAñadirDisponible from './componentes/form-añadir-disponible';
import DetallePrenda from './componentes/detalle-prenda';
import FormAñadirProveedor from './componentes/form-añadir-proveedor';
import MarcaAgua from './componentes/marca-agua';
import FormVender from './componentes/form-vender';
import Pedidos from './componentes/pedidos';
import ModificarPedido from './componentes/modificar-pedido';
import FormAñadirCliente from './componentes/form-añadir-cliente';
import Compras from './componentes/compras';
import Entregas from './componentes/entregas';
import PorCobrar from './componentes/por-cobrar';
import AgregarPago from './componentes/agregar-pago';
import Inventario from './componentes/inventario';
import FormVenderInventario from './componentes/form-vender-inventario';
import Estadisticas from './componentes/estadisticas';
import AñadirPedidoDirecto from './componentes/añadir-pedido-directo';
import Descripciones from "./componentes/Descripciones";
import Clientes from "./componentes/clientes";
import EditarCliente from './componentes/editar-cliente';
import Login from './componentes/Login';
import FinancialStatementsGenerator from "./componentes/FinancialStatementsGenerator";


function Root() {
    // 💡 CAMBIO CLAVE: Inicializamos a 'undefined' para indicar "cargando/verificando sesión".
    const [user, setUser] = useState(undefined); 

    useEffect(() => {
        // onAuthStateChanged se dispara inmediatamente y nos da el estado real de Firebase.
        const unsubscribe = onAuthStateChanged(auth, (usuarioFirebase) => {
            // Esto será el objeto de usuario (logueado) O null (no logueado).
            setUser(usuarioFirebase); 
        });
        return () => unsubscribe();
    }, []);

    // 1. Manejar el estado de Carga/Espera
    if (user === undefined) {
        // Muestra un mensaje simple mientras Firebase verifica el token del usuario.
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#F5EBDD' }}>
                <p style={{ color: '#D88C6D', fontSize: '1.2rem', fontWeight: 'bold' }}>Cargando sesión...</p>
            </div>
        );
    }

    // 2. Manejar el estado de No Autenticado
    if (user === null) {
        // Muestra el formulario de Login si no hay usuario verificado.
        return <Login />;
    }

    // 3. Manejar el estado de Autenticado (user es el objeto de usuario)
    // El usuario está logueado, devolvemos la aplicación principal.
    return (
        // Dejamos el Router sin "basename" ya que Vercel usa la raíz.
        <Router >
            <Routes>
                <Route path='/' element={<App />} />
                <Route path='Disponible' element={<Disponible />} />
                <Route path='FormAñadirDisponible' element={<FormAñadirDisponible />} />
                <Route path='DetallePrenda/:id' element={<DetallePrenda />} />
                <Route path='FormAñadirProveedor' element={<FormAñadirProveedor />} />
                <Route path='MarcaAgua' element={<MarcaAgua />} />
                <Route path='FormVender/:id' element={<FormVender />} />
                <Route path='Pedidos' element={<Pedidos />} />
                <Route path='ModificarPedido/:id' element={<ModificarPedido />} />
                <Route path='FormAñadirCliente' element={<FormAñadirCliente />} />
                <Route path='Compras' element={<Compras />} />
                <Route path='Entregas' element={<Entregas />} />
                <Route path='PorCobrar' element={<PorCobrar />} />
                <Route path='AgregarPago/:id' element={<AgregarPago />} />
                <Route path='Inventario' element={<Inventario />} />
                <Route path='FormVenderInventario/:id' element={<FormVenderInventario />} />
                <Route path='Estadisticas' element={<Estadisticas />} />
                <Route path='AñadirPedidoDirecto' element={<AñadirPedidoDirecto />} />
                <Route path='Descripciones' element={<Descripciones />} />
                <Route path='Clientes' element={<Clientes />} />
                <Route path='EditarCliente/:id' element={<EditarCliente />} />
                <Route path='FinancialStatementsGenerator' element={<FinancialStatementsGenerator />} />
            </Routes>
        </Router>
    );
}


// 💡 Este bloque de código SIEMPRE debe estar FUERA de la función del componente.
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Root />);