import React, { useEffect, useState } from "react";
import Header from "./header";
import MenuLateral from "./menu-lateral";
import Footer from "./footer";
import MenuAñadir from "./menu-añadir";
import { db } from "../credenciales";
import { collection, getDocs } from "firebase/firestore";
import Papa from "papaparse"


function Disponible() {
  const [menuAbierto, setmenuAbierto] = useState(false);
  const [menuAñadir, setmenuAñadir] = useState(false);
  const [pedidos, setPedidos] = useState([]);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  //Funcion para exportar el csv
const exportarCSV = () => {
  const datosFiltrados = filtrarPrendas();

  // Si no hay datos filtrados, no hacer nada
  if (datosFiltrados.length === 0) {
    alert("No hay datos para exportar.");
    return;
  }

  // Convertir los datos a formato CSV
  const csv = Papa.unparse(
    datosFiltrados.map(({ fecha, cliente, prenda, categoria, talla, costo, precio, color, lugar }) => ({
      Fecha: fecha,
      Cliente: cliente,
      Prenda: prenda,
      Categoria: categoria,
      Talla: talla,
      Costo: costo,
      Precio: precio,
      Color: color,
      Lugar: lugar
    }))
  );

  // Crear un Blob y descargar el archivo
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "pedidos_filtrados.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};


  // Función para manejar el estado del menú lateral
  const manejadorMenu = () => {
    setmenuAbierto(!menuAbierto);
  };

  // Función para manejar el estado del menú añadir
  const manejadorMenuAñadir = () => {
    setmenuAñadir(!menuAñadir);
  };

  // Cargar los documentos desde Firestore (prendas disponibles)
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "pedidos"));
        const docsArray = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Asegurarse de que los documentos con fecha sean ordenados correctamente
        docsArray.sort((a, b) => {
          const fechaA = a.fecha || "1970-01-01"; // Si no hay fecha, se usa una fecha muy antigua
          const fechaB = b.fecha || "1970-01-01"; // Igual para b
          return fechaB.localeCompare(fechaA); // Ordenar de más reciente a más antiguo
        });

        setPedidos(docsArray);
      } catch (error) {
        console.error("Error al cargar los documentos", error);
      }
    };
    fetchDocuments();
  }, []);
  
  // Función para filtrar las prendas según los filtros seleccionados y la búsqueda
  const filtrarPrendas = () => {
    return pedidos.filter((doc) => {
      const pedidoFecha = new Date(doc.fecha);
      const inicio = fechaInicio ? new Date(fechaInicio) : null;
      const fin = fechaFin ? new Date(fechaFin) : null;

      const coincideFecha =
        (!inicio || pedidoFecha >= inicio) && (!fin || pedidoFecha <= fin);

      return coincideFecha;
    });
  };

  return (
    <div className="min-h-screen bg-pink-100">
      <header className="relative">
        <Header menuAbierto={menuAbierto} manejadorMenu={manejadorMenu} />
        <h1 className="fixed inset-x-0 transform pt-2 text-center pointer-events-none font-bold text-xl text-white z-50">
          Base de datos
        </h1>
      </header>
      <div>
        <MenuLateral menuAbierto={menuAbierto} />
      </div>
      <div>
        <MenuAñadir menuAñadir={menuAñadir} />
      </div>
      {/* Contenedor principal */}
      <main className="pb-16 pt-10">
        {/* Sección de filtros y barra de búsqueda */}
        <div className="flex lg:flex-row flex-col justify-between">
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
          <button className="bg-pink-400 h-10 w-20 mt-5 mr-10 rounded-lg shadow-lg text-white"
          onClick={exportarCSV}
          >Exportar</button>
        </div>

        {/* Renderización de la lista filtrada */}
        <div className="productos-container bg-pink-100 flex flex-col mx-5 mb-5">
          {filtrarPrendas().map((doc) => (
            <div className="flex justify-between">
              <div className="w-1/5 border-b-2 border-r-2 border-black">
                <p>{doc.fecha}</p>
              </div>
              <div className="w-1/5 border-b-2 border-r-2 border-black">
                <p>{doc.cliente}</p>
              </div>
              <div className="w-1/5 border-b-2 border-r-2 border-black">
                <p>{doc.prenda}</p>
              </div>
              <div className="w-1/5 border-b-2 border-r-2 border-black">
                <p className="text-center">{doc.categoria}</p>
              </div>
              <div className="w-1/5 border-b-2 border-r-2 border-black">
                <p>{doc.talla}</p>
              </div>
              <div className="w-1/5 border-b-2 border-r-2 border-black">
                <p>{doc.costo}</p>
              </div>
              <div className="w-1/5 border-b-2 border-r-2 border-black">
                <p className="text-center">{doc.precio}</p>
              </div>
              <div className="w-1/5 border-b-2 border-r-2 border-black">
                <p>{doc.color}</p>
              </div>
              <div className="w-1/5 border-b-2 border-r-2 border-black">
                <p>{doc.lugar}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
      <div>
        <Footer manejadorMenuAñadir={manejadorMenuAñadir} />
      </div>
    </div>
  );
}

export default Disponible;
