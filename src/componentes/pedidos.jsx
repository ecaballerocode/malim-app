import React, { useEffect } from 'react'
import { useState } from 'react';
import Header from "./header";
import MenuLateral from "./menu-lateral";
import Footer from "./footer";
import MenuAñadir from "./menu-añadir";
import { db } from "../credenciales";
import { collection, getDocs } from "firebase/firestore";
import Select from "react-select";
import { useNavigate } from 'react-router-dom';


function Pedidos() {

  const [menuAbierto, setmenuAbierto] = useState(false);
  const [menuAñadir, setmenuAñadir] = useState(false);
  const [pedidos, setPedidos] = useState([]);
  const [clientes, setClientes] = useState([])
  const [filtroCliente, setFiltroCliente] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  const navigate = useNavigate();


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

  const handleClienteChange = (selectedOption) => {
    setFiltroCliente(selectedOption);
  };

  const handleBusquedaChange = (e) => {
    setBusqueda(e.target.value);
  };

  const manejarClickPrenda = (id) => {
    navigate(`/ModificarPedido/${id}`);  // Redirige a la página de detalles
  };


  const clientesOptions = clientes.map((cli) => ({
    value: cli.cliente,
    label: cli.cliente,
  }));


  const filtrarPrendas = () => {
    return pedidos.filter((doc) => {
      const coincideCliente = !filtroCliente || doc.cliente === filtroCliente.value;
      const coincideBusqueda = !busqueda || doc.prenda.toLowerCase().includes(busqueda.toLowerCase());

      const pedidoFecha = new Date(doc.fecha);
      const inicio = fechaInicio ? new Date(fechaInicio) : null;
      const fin = fechaFin ? new Date(fechaFin) : null;

      const coincideFecha = (!inicio || pedidoFecha >= inicio) && (!fin || pedidoFecha <= fin);


      return coincideCliente && coincideBusqueda && coincideFecha;
    });
  };

  return (
    <div className="bg-pink-100 min-h-screen">
      <header className="relative">
        <Header menuAbierto={menuAbierto} manejadorMenu={manejadorMenu} />
        <h1 className="fixed inset-x-0 transform pt-2 text-center pointer-events-none text-xl font-bold text-white z-50">Pedidos hechos</h1>
      </header>
      <div>
        <MenuLateral menuAbierto={menuAbierto} />
      </div>
      <div>
        <MenuAñadir menuAñadir={menuAñadir} />
      </div>
      <main className="pb-16 pt-10">
        {/* Sección de filtros y barra de búsqueda */}
        <div className="flex lg:flex-row flex-col justify-between">
          {/* Filtros de proveedor y categoría */}
          <div className="lg:p-5 px-5 pt-2 flex flex-row items-center">
            <h1 className="font-bold lg:text-sm text-xs text-pink-800 mr-2">Filtrar por:</h1>
            <Select options={clientesOptions} onChange={handleClienteChange} isClearable placeholder="Cliente" />
          </div>
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
          {/* Barra de búsqueda */}
          <div className="lg:p-5 px-5 pt-1 pb-2 flex flex-row items-center">
            <h1 className="font-bold lg:text-sm text-xs text-pink-800 mr-2">Búsqueda:</h1>
            <input
              type="text"
              placeholder="Buscar"
              className="h-10 rounded-lg p-2 border-gray-200 border-2"
              value={busqueda}
              onChange={handleBusquedaChange}
            />
          </div>
        </div>
        {/* Renderización de la lista filtrada */}
        <div className="productos-container bg-pink-100 grid grid-cols-2 lg:grid-cols-5 lg:gap-3 gap-3 mx-5 mb-5">
          {filtrarPrendas().map((doc) => (
            <div key={doc.id} onClick={() => manejarClickPrenda(doc.id)} className="h-auto border-2 rounded-lg shadow-xl border-pink-200">
              <div className='bg-pink-400 text-white text-center h-auto w-full'>
                <p className='font-bold'>{doc.cliente}</p>
                <p className='text-xs'>{doc.fecha}</p>
              </div>
              <div className="lg:h-64 h-40 w-full">
                {doc.fotos ? (
                  <img
                    key={doc.fotos}
                    src={doc.fotos}
                    alt={"Foto del producto"}
                    className="lg:h-64 h-40 w-full"
                  />
                ) : (
                  <div className="flex items-center h-full justify-center">
                    <p className="text-center text-gray-600 font-sm">Sin fotos disponibles</p>
                  </div>
                )}
              </div>
              <div className="p-2 text-pink-600">
                <p className="font-bold lg:text-sm text-pink-700">{doc.prenda}</p>
                <div className="flex flex-row justify-between">
                  <p className="lg:text-sm">{doc.talla}</p>
                  <p className="font-bold lg:text-sm text-pink-700">${doc.precio}</p>
                </div>
                <p className="lg:text-sm">{doc.proveedor}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer manejadorMenuAñadir={manejadorMenuAñadir}/>
    </div>
  )
}

export default Pedidos;