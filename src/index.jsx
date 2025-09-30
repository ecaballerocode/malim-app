import React from "react";
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// ✅ IMPORTAMOS EL CONTEXTO Y EL HOOK PARA EL ESTADO (DEBE EXISTIR src/context/AuthContext.jsx)
import { AuthProvider, useAuth } from "./context/AuthContext";

// Importaciones de Componentes (Mantenemos todas las rutas originales)
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
import Login from './componentes/Login'; // Necesario para la ruta de Login
import FinancialStatementsGenerator from "./componentes/FinancialStatementsGenerator";

// --- COMPONENTE PROTEGIDO ---
// Este componente decide si renderizar la página o mostrar la carga/login
const ProtectedRoute = ({ element: Element, ...rest }) => {
    // Usamos el hook para obtener el estado del usuario del contexto
    const { user, loading } = useAuth();
    
    // 1. Mostrar estado de Carga
    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#F5EBDD' }}>
                <p style={{ color: '#D88C6D', fontSize: '1.2rem', fontWeight: 'bold' }}>Cargando sesión...</p>
            </div>
        );
    }
    
    // 2. Si no hay usuario, redirige a la página de Login
    if (!user) {
        return <Login />; 
    }
    
    // 3. Si hay usuario y ya terminó de cargar, renderiza el componente solicitado
    return <Element {...rest} />;
};


function Root() {
    return (
        // El proveedor de autenticación envuelve el router
        <AuthProvider> 
            <Router> 
                <Routes>
                    {/* Ruta de Login (PÚBLICA) - Aquí es donde el usuario inicia sesión */}
                    <Route path='/login' element={<Login />} />
                    
                    {/* Rutas Protegidas - Todas estas rutas requieren un usuario logueado */}
                    {/* Cuando la ruta es '/', usa el componente ProtectedRoute para verificar el estado de Auth, 
                        y si es válido, renderiza App */}
                    <Route path='/' element={<ProtectedRoute element={App} />} /> 
                    <Route path='Disponible' element={<ProtectedRoute element={Disponible} />} />
                    <Route path='FormAñadirDisponible' element={<ProtectedRoute element={FormAñadirDisponible} />} />
                    <Route path='DetallePrenda/:id' element={<ProtectedRoute element={DetallePrenda} />} />
                    <Route path='FormAñadirProveedor' element={<ProtectedRoute element={FormAñadirProveedor} />} />
                    <Route path='MarcaAgua' element={<ProtectedRoute element={MarcaAgua} />} />
                    <Route path='FormVender/:id' element={<ProtectedRoute element={FormVender} />} />
                    <Route path='Pedidos' element={<ProtectedRoute element={Pedidos} />} />
                    <Route path='ModificarPedido/:id' element={<ProtectedRoute element={ModificarPedido} />} />
                    <Route path='FormAñadirCliente' element={<ProtectedRoute element={FormAñadirCliente} />} />
                    <Route path='Compras' element={<ProtectedRoute element={Compras} />} />
                    <Route path='Entregas' element={<ProtectedRoute element={Entregas} />} />
                    <Route path='PorCobrar' element={<ProtectedRoute element={PorCobrar} />} />
                    <Route path='AgregarPago/:id' element={<ProtectedRoute element={AgregarPago} />} />
                    <Route path='Inventario' element={<ProtectedRoute element={Inventario} />} />
                    <Route path='FormVenderInventario/:id' element={<ProtectedRoute element={FormVenderInventario} />} />
                    <Route path='Estadisticas' element={<ProtectedRoute element={Estadisticas} />} />
                    <Route path='AñadirPedidoDirecto' element={<ProtectedRoute element={AñadirPedidoDirecto} />} />
                    <Route path='Descripciones' element={<ProtectedRoute element={Descripciones} />} />
                    <Route path='Clientes' element={<ProtectedRoute element={Clientes} />} />
                    <Route path='EditarCliente/:id' element={<ProtectedRoute element={EditarCliente} />} />
                    <Route path='FinancialStatementsGenerator' element={<ProtectedRoute element={FinancialStatementsGenerator} />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Root />);
