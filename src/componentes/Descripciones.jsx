import React, { useEffect, useState } from "react";
import Header from "./header";
import MenuLateral from "./menu-lateral";
import Footer from "./footer";
import MenuAñadir from "./menu-añadir";
import { db } from "../credenciales";
import { collection, getDocs } from "firebase/firestore";
import Papa from "papaparse";

function Disponible() {
  const [menuAbierto, setmenuAbierto] = useState(false);
  const [menuAñadir, setmenuAñadir] = useState(false);
  const [pedidos, setPedidos] = useState([]);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [tipoFecha, setTipoFecha] = useState("fecha"); // fecha o fechaEntrega

  // Exportar a CSV
  const exportarCSV = () => {
    const datosFiltrados = filtrarPrendas();
    if (datosFiltrados.length === 0) {
      alert("No hay datos para exportar.");
      return;
    }

    const csv = Papa.unparse(
      datosFiltrados.map(
        ({
          fecha,
          fechaEntrega,
          cliente,
          prenda,
          categoria,
          talla,
          costo,
          precio,
          color,
          lugar,
        }) => ({
          Fecha: fecha || "",
          "Fecha de Entrega": fechaEntrega || "",
          Cliente: cliente || "",
          Prenda: prenda || "",
          Categoria: categoria || "",
          Talla: talla || "",
          Costo: costo || "",
          Precio: precio || "",
          Color: color || "",
          Lugar: lugar || "",
        })
      )
    );

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "pedidos_filtrados.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Cargar documentos desde Firestore
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "pedidos"));
        const docsArray = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Ordenar por fecha descendente
        docsArray.sort((a, b) => {
          const fechaA = a.fecha || "1970-01-01";
          const fechaB = b.fecha || "1970-01-01";
          return fechaB.localeCompare(fechaA);
        });

        setPedidos(docsArray);
      } catch (error) {
        console.error("Error al cargar los documentos", error);
      }
    };
    fetchDocuments();
  }, []);

  // Filtrar prendas
  const filtrarPrendas = () => {
    return pedidos.filter((doc) => {
      const campoFecha = tipoFecha === "fecha" ? doc.fecha : doc.fechaEntrega;

      if (!campoFecha) return false; // si no tiene fecha en ese campo, no entra al filtro

      const pedidoFecha = new Date(campoFecha);
      const inicio = fechaInicio ? new Date(fechaInicio) : null;
      const fin = fechaFin ? new Date(fechaFin) : null;

      return (!inicio || pedidoFecha >= inicio) && (!fin || pedidoFecha <= fin);
    });

  };

  const prendasFiltradas = filtrarPrendas();
  const sumaPrecio = prendasFiltradas.reduce((acc, doc) => acc + Number(doc.precio || 0), 0);
  const sumaCosto = prendasFiltradas.reduce((acc, doc) => acc + Number(doc.costo || 0), 0);


  return (
    <div className="min-h-screen bg-pink-100">
      <header className="relative">
        <Header menuAbierto={menuAbierto} manejadorMenu={setmenuAbierto} />
        <h1 className="fixed inset-x-0 transform pt-2 text-center pointer-events-none font-bold text-xl text-white z-50">
          Base de datos
        </h1>
      </header>

      <MenuLateral menuAbierto={menuAbierto} />
      <MenuAñadir menuAñadir={menuAñadir} />

      {/* Contenido */}
      <main className="pb-16 pt-10">
        {/* Filtros */}
        <div className="flex lg:flex-row flex-col justify-between items-center gap-4 px-5">
          <div className="flex flex-row items-center gap-2">
            <label className="text-sm text-pink-800">Filtrar por:</label>
            <select
              value={tipoFecha}
              onChange={(e) => setTipoFecha(e.target.value)}
              className="h-10 rounded-lg p-2 border-gray-200 border-2 bg-white"
            >
              <option value="fecha">Fecha</option>
              <option value="fechaEntrega">Fecha de entrega</option>
            </select>
          </div>
          <div className="flex flex-row items-center gap-2">
            <label className="text-sm text-pink-800">Desde:</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="h-10 rounded-lg p-2 bg-white border-gray-200 border-2"
            />
            <label className="text-sm text-pink-800">Hasta:</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="h-10 rounded-lg p-2 border-gray-200 border-2 bg-white"
            />
          </div>
          <button
            className="bg-pink-400 px-4 py-2 rounded-lg shadow-lg text-white hover:bg-pink-500 transition"
            onClick={exportarCSV}
          >
            Exportar
          </button>
        </div>

        <div className="text-center py-4 font-semibold text-pink-600">
          Total Precio: ${sumaPrecio.toLocaleString()} | Total Costo: ${sumaCosto.toLocaleString()}
        </div>


        {/* Tabla */}
        <div className="overflow-x-auto mx-5 mt-6 shadow-lg rounded-lg">
          <table className="w-full border-collapse bg-white rounded-lg">
            <thead className="bg-pink-400 text-white">
              <tr>
                <th className="px-3 py-2">Fecha</th>
                <th className="px-3 py-2">Fecha de Entrega</th>
                <th className="px-3 py-2">Cliente</th>
                <th className="px-3 py-2">Prenda</th>
                <th className="px-3 py-2">Categoría</th>
                <th className="px-3 py-2">Talla</th>
                <th className="px-3 py-2">Costo</th>
                <th className="px-3 py-2">Precio</th>
                <th className="px-3 py-2">Color</th>
                <th className="px-3 py-2">Lugar</th>
              </tr>
            </thead>
            <tbody>
              {filtrarPrendas().map((doc) => (
                <tr
                  key={doc.id}
                  className="border-b hover:bg-pink-50 transition text-center"
                >
                  <td className="px-3 py-2">{doc.fecha || ""}</td>
                  <td className="px-3 py-2">{doc.fechaEntrega || ""}</td>
                  <td className="px-3 py-2">{doc.cliente || ""}</td>
                  <td className="px-3 py-2">{doc.prenda || ""}</td>
                  <td className="px-3 py-2">{doc.categoria || ""}</td>
                  <td className="px-3 py-2">{doc.talla || ""}</td>
                  <td className="px-3 py-2">{doc.costo || ""}</td>
                  <td className="px-3 py-2">{doc.precio || ""}</td>
                  <td className="px-3 py-2">{doc.color || ""}</td>
                  <td className="px-3 py-2">{doc.lugar || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      <Footer manejadorMenuAñadir={setmenuAñadir} />
    </div>
  );
}

export default Disponible;
