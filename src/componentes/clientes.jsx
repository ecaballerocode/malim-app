import React, { useEffect, useState } from "react";
import Header from "./header";
import MenuLateral from "./menu-lateral";
import Footer from "./footer";
import MenuAñadir from "./menu-añadir";
import { db } from "../credenciales";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";


function Clientes() {
  const [menuAbierto, setmenuAbierto] = useState(false);
  const [menuAñadir, setmenuAñadir] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState("");

  const navigate = useNavigate();

  const manejadorMenu = () => {
    setmenuAbierto(!menuAbierto);
  };

  const manejadorMenuAñadir = () => {
    setmenuAñadir(!menuAñadir);
  };

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "clientes"));
        const docsArray = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setClientes(docsArray);
      } catch (error) {
        console.error("Error al cargar los documentos", error);
      }
    };
    fetchDocuments();
  }, []);

  const handleFilaClick = (cliente) => {
    navigate(`/EditarCliente/${cliente.id}`, { state: { cliente } });
  };

  // Filtrado en tiempo real
  const clientesFiltrados = clientes.filter((cliente) =>
    `${cliente.cliente} ${cliente.telefono} ${cliente.cumpleaños}`
      .toLowerCase()
      .includes(busqueda.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-pink-100">
      <header className="relative">
        <Header menuAbierto={menuAbierto} manejadorMenu={manejadorMenu} />
        <h1 className="fixed inset-x-0 pt-2 text-center pointer-events-none font-bold text-xl text-white z-50">
          Clientes
        </h1>
      </header>

      <MenuLateral menuAbierto={menuAbierto} />
      <MenuAñadir menuAñadir={menuAñadir} />

      <main className="pb-16 pt-24 px-4">
        {/* Input de búsqueda */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar cliente, teléfono o cumpleaños..."
            className="w-full px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="shadow-md rounded-lg overflow-hidden">
          {/* Encabezado */}
          <div className="grid grid-cols-3 bg-pink-300 text-white font-semibold text-center py-2">
            <div>Cliente</div>
            <div>Teléfono</div>
            <div>Cumpleaños</div>
          </div>

          {/* Filas filtradas */}
          {clientesFiltrados.map((doc, index) => (
            <div
              key={doc.id}
              onClick={() => handleFilaClick(doc)}
              className={`grid grid-cols-3 text-center py-2 cursor-pointer transition hover:bg-pink-200 ${
                index % 2 === 0 ? "bg-pink-50" : "bg-pink-100"
              }`}
            >
              <div>{doc.cliente}</div>
              <div>{doc.telefono}</div>
              <div>{doc.cumpleaños}</div>
            </div>
          ))}

          {/* Mensaje si no hay resultados */}
          {clientesFiltrados.length === 0 && (
            <div className="text-center py-4 text-pink-500">
              No se encontraron resultados.
            </div>
          )}
        </div>
      </main>

      <Footer manejadorMenuAñadir={manejadorMenuAñadir} />
    </div>
  );
}

export default Clientes;
