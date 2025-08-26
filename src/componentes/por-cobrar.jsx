import React, { useEffect } from 'react'
import { useState } from 'react';
import Header from "./header";
import MenuLateral from "./menu-lateral";
import Footer from "./footer";
import MenuAñadir from "./menu-añadir";
import { db } from "../credenciales";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";



function PorCobrar() {
  const [busqueda, setBusqueda] = useState("");
  const [menuAbierto, setmenuAbierto] = useState(false);
  const [menuAñadir, setmenuAñadir] = useState(false);
  const [pedidos, setPedidos] = useState([]);
  const [suma, setSuma] = useState(0)


  useEffect(() => {
    const fetchPedidos = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "pedidos"));
        const docsArray = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        const docsFilter = docsArray.filter(doc => doc.precio - doc.pago > 0 && doc.cliente !== "INVENTARIO");
        setPedidos(docsFilter);
      } catch (error) {
        console.error("Error al cargar los documentos", error);
      }
    };
    fetchPedidos();
  }, []);

  useEffect(()=>{
    const sumaTotal = pedidos.reduce((suma, doc)=> {
      return suma + (doc.precio - doc.pago);
    }, 0)
    setSuma(sumaTotal);
  }, [pedidos]);

  // Filtrar clientes según la búsqueda


  const pedidosAgrupados = pedidos.reduce((acumulado, pedido)=>{
    if(!acumulado[pedido.cliente]){
      acumulado[pedido.cliente]=[];
    }
    acumulado[pedido.cliente].push(pedido);
    return acumulado;
  }, {})

  const clientesFiltrados = Object.keys(pedidosAgrupados).filter(cliente => 
  cliente.toLowerCase().includes(busqueda)
);


  const manejadorMenu = () => {
    setmenuAbierto(!menuAbierto);
  };

  const manejadorMenuAñadir = () => {
    setmenuAñadir(!menuAñadir);
  };

  const navigate = useNavigate();


  const handleAgregarPago = (id) => {
    navigate(`/AgregarPago/${id}`);  // Redirige a la página de detalles
  };

  const handleBusquedaChange = (e) => {
  setBusqueda(e.target.value.toLowerCase());
};

    
  
  return (
    <div className="bg-pink-100 min-h-screen">
      <header className="relative">
        <Header menuAbierto={menuAbierto} manejadorMenu={manejadorMenu} />
        <h1 className="fixed inset-x-0 transform pt-2 text-center pointer-events-none text-xl font-bold text-white z-50">Por cobrar</h1>
      </header>
      <div>
        <MenuLateral menuAbierto={menuAbierto} />
      </div>
      <div>
        <MenuAñadir menuAñadir={menuAñadir} />
      </div>
      <main className="pb-16 pt-10">
        <div className="flex flex-row justify-center text-center">
          <p className="font-bold text-2xl text-pink-600">Total por recuperar:</p>
          <p className="ml-3 font-bold text-2xl text-pink-600">${suma}</p>
        </div>
        {/* Barra de búsqueda */}
<div className="flex justify-start my-4 px-5">
  <input
    type="text"
    placeholder="🔍 Buscar cliente..."
    value={busqueda}
    onChange={handleBusquedaChange}
    className="w-full max-w-md p-2 border-2 border-biege rounded-lg focus:outline-none focus:border-pink-400"
  />
</div>

        <div className="productos-container bg-pink-100 mx-5 mb-5 space-y-5">
  {clientesFiltrados.map((cliente) => {
    // Sumar los costos de los pedidos de este proveedor
    const sumaCliente = pedidosAgrupados[cliente].reduce((total, pedido) => total + (pedido.precio - pedido.pago), 0);

    return (
      <div key={cliente} className="h-auto border-2 rounded-lg shadow-xl border-pink-200 p-3">
        {/* Separador con el nombre del proveedor */}
        <div className="flex flex-row justify-between">
          <h1 className="font-bold text-lg text-pink-600">{cliente}</h1>
          <h1 id="costo-proveedor" className="font-bold text-lg text-pink-600">
            ${sumaCliente}
          </h1>
        </div>

        {/* Contenedor horizontal para los productos del cliente */}
        <div className="flex overflow-x-auto space-x-3">
          {pedidosAgrupados[cliente].map((pedido) => (
            <div key={pedido.id} className="w-4/5 lg:w-1/4 h-auto flex-shrink-0 bg-pink-200 border rounded-lg shadow-sm mb-2">
              {/* Información del producto */}
              <div className="lg:h-64 h-64 w-full">
                {pedido.fotos ? (
                  <img
                    src={pedido.fotos}
                    alt={"Foto del producto"}
                    className="lg:h-64 h-64 w-full object-cover"
                  />
                ) : (
                  <div className="flex items-center h-full justify-center">
                    <p className="text-center text-gray-600 font-sm">Sin fotos disponibles</p>
                  </div>
                )}
              </div>
              <div className="p-2 text-pink-600">
                <p className="font-bold text-sm text-pink-700">{pedido.prenda}</p>
                <div className="flex flex-row justify-between">
                  <p className="">{pedido.talla}</p>
                  <p className="text-pink-700">{pedido.color}</p>
                </div>
                <div className="flex flex-row justify-between mt-2">
                  <p className="">{pedido.entrega}</p>
                  <p className="text-pink-700">{pedido.lugar}</p>
                </div>
                <div className="flex flex-row justify-between">
                  <div className='flex flex-col justify-center mt-2'>
                    <p className="">Precio:</p>
                    <p className="">${pedido.precio}</p>
                  </div>
                  <div className='flex flex-col justify-center mt-2'>
                    <p className="">Pagó:</p>
                    <p className="">${pedido.pago}</p>
                  </div>
                  <div className='flex flex-col justify-center mt-2'>
                    <p className="">Resta:</p>
                    <p className="font-bold" >${pedido.precio - pedido.pago}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-row justify-center text-white text-center px-2 pb-2">
                <button onClick={()=>handleAgregarPago(pedido.id)} className="px-2 bg-pink-400 text-white rounded-lg mx-2 shadow-xl">
                  Agregar pago
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  })}
</div>
      </main>
      <Footer manejadorMenuAñadir={manejadorMenuAñadir}/>
    </div>
  )
}

export default PorCobrar;