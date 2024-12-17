import React, { useEffect } from 'react'
import { useState } from 'react';
import Header from "./header";
import MenuLateral from "./menu-lateral";
import Footer from "./footer";
import MenuAñadir from "./menu-añadir";
import { db } from "../credenciales";
import { collection, getDocs } from "firebase/firestore";

function Estadisticas() {

  const [menuAbierto, setmenuAbierto] = useState(false);
  const [menuAñadir, setmenuAñadir] = useState(false);
  const [pedidos, setPedidos] = useState([]);
  const [clientes, setClientes] = useState([])
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");


  useEffect(() => {
    const fetchPedidos = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "pedidos"));
        const docsArray = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        docsArray.sort((a, b) => b.fecha.localeCompare(a.fecha));
        setPedidos(docsArray);
      } catch (error) {
        console.error("Error al cargar los documentos", error);
      }
    };
    fetchPedidos();
  }, []);

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "clientes"));
        const docsArray = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setClientes(docsArray);
      } catch (error) {
        console.log("Error al cargar proveedores", error);
      }
    };
    fetchClientes();
  }, []);


  const manejadorMenu = () => {
    setmenuAbierto(!menuAbierto);
  };

  const manejadorMenuAñadir = () => {
    setmenuAñadir(!menuAñadir);
  };


  const filtrarPedidos = () => {
    return pedidos.filter((doc) => {
      const pedidoFecha = new Date(doc.fecha);
      const inicio = fechaInicio ? new Date(fechaInicio) : null;
      const fin = fechaFin ? new Date(fechaFin) : null;

      const coincideFecha = (!inicio || pedidoFecha >= inicio) && (!fin || pedidoFecha <= fin);


      return coincideFecha;
    });
  };

  //Funcion para sumar los costos  para calcular la inversion necesaria
  const inversion = () =>{
    const pedidosFiltrados = pedidos.filter((pedido) => pedido.comprado === false);
    return pedidosFiltrados.reduce((acumulador, pedido)=>acumulador + pedido.costo, 0);
  }

  //Fncion para calcular cuanto hay po cobrar
  const porCobrar = () => {
    return pedidos.reduce((suma, doc)=> 
     suma + (doc.precio - doc.pago), 0)
}

const utilidad = () => {
    return filtrarPedidos().reduce((suma, pedido) => suma + (pedido.precio - pedido.costo), 0);
}

  return (
    <div className="bg-pink-100 min-h-screen">
      <header className="relative">
        <Header menuAbierto={menuAbierto} manejadorMenu={manejadorMenu} />
        <h1 className="fixed inset-x-0 transform pt-2 text-center pointer-events-none text-xl font-bold text-white z-50">Estadísticas</h1>
      </header>
      <div>
        <MenuLateral menuAbierto={menuAbierto} />
      </div>
      <div>
        <MenuAñadir menuAñadir={menuAñadir} />
      </div>
      <main className="pb-16 pt-10">
        {/* Sección de filtros y barra de búsqueda */}
        <div className="flex justify-center w-full">
          {/* Filtros de proveedor y categoría */}
          <div className="lg:p-5 px-5 pt-2 flex flex-row items-center">
              <label className="text-xs text-pink-800">Desde:</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="h-10 w-20 rounded-lg p-2 bg-white border-gray-200 border-2"
              />
              <label className="text-xs text-pink-800 ml-2">Hasta:</label>
              <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="h-10 w-20 rounded-lg p-2 border-gray-200 border-2 bg-white"
              />
            </div>
        </div>
        {/* Renderización de la pagina */}
        <div className='grid lg:grid-cols-2 grid-cols-1'>
            <div className="bg-pink-400 z-0 mx-5 mt-2 p-2 h-64 shadow-xl text-center rounded-lg ">
            <h1 className="text-pink-800 text-lg font-bold mt-3 mb-2">Generales</h1>
            {/*este div va a contener el grid con las dos filas y dos columnas */}
                <div className="grid grid-cols-2 gap-4 m-5">
                    <div>
                        <p className="text-center leading-none text-white">Ventas del periodo:</p>
                        <p className="text-pink-800 text-lg mt-1 font-bold">{filtrarPedidos().length}</p>
                    </div>
                    <div>
                        <p className="text-center leading-none text-white">Inversión necesaria:</p>
                        <p className="text-pink-800 text-lg mt-1 font-bold">${inversion()}</p>
                    </div>
                    <div className="mt-5">
                        <p className="text-center leading-none text-white">Por cobrar:</p>
                        <p className="text-pink-800 text-lg mt-1 font-bold">${porCobrar()}</p>
                    </div>
                    <div className="mt-5">
                        <p className="text-center leading-none text-white">Utilidad del periodo:</p>
                        <p className="text-pink-800 text-lg mt-1 font-bold">${utilidad()}</p>
                    </div>
                </div>
            </div>
            <div className="bg-pink-100 z-0 mx-5 mt-2 p-2 h-64 shadow-xl text-center rounded-lg border-pink-400 border-2">
            <h1 className="text-pink-800 text-lg font-bold mt-3 mb-2">Finanzas</h1>
            {/*este div va a contener el grid con las dos filas y dos columnas */}
                <div className="grid grid-cols-2 gap-4 m-5">
                    <div>
                        <p className="text-center text-pink-600 leading-none text-white">Ingresos del periodo:</p>
                        <p className="text-pink-800 text-lg mt-1 font-bold">{filtrarPedidos().length}</p>
                    </div>
                    <div>
                        <p className="text-center text-pink-600 leading-none text-white">Inversión del periodo:</p>
                        <p className="text-pink-800 text-lg mt-1 font-bold">${inversion()}</p>
                    </div>
                    <div className="mt-5">
                        <p className="text-center text-pink-600 leading-none text-white">Utilidad bruta:</p>
                        <p className="text-pink-800 text-lg mt-1 font-bold">${porCobrar()}</p>
                    </div>
                    <div className="mt-5">
                        <p className="text-center text-pink-600 leading-none text-white">Margen de utilidad:</p>
                        <p className="text-pink-800 text-lg mt-1 font-bold">${utilidad()}</p>
                    </div>
                </div>
            </div>
        </div>
      </main>
      <Footer manejadorMenuAñadir={manejadorMenuAñadir}/>
    </div>
  )
}

export default Estadisticas;