import React, { useEffect, useRef, useState } from "react";
import Header from "./header";
import MenuLateral from "./menu-lateral";
import Footer from "./footer";
import MenuAñadir from "./menu-añadir";
import { db } from "../credenciales";
import { collection, getDocs, doc, deleteDoc, query, orderBy } from "firebase/firestore";
import Select from "react-select";
import { useNavigate } from "react-router-dom";
import { FaTrash } from "react-icons/fa";

function Disponible() {
  const [menuAbierto, setmenuAbierto] = useState(false);
  const [menuAñadir, setmenuAñadir] = useState(false);
  const [proveedores, setProveedores] = useState([]);
  const [filtroProveedor, setFiltroProveedor] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [prendasDisponibles, setPrendasDisponibles] = useState([]);
  const [busqueda, setBusqueda] = useState("");

  const [modoSeleccion, setModoSeleccion] = useState(false);
  const [seleccionados, setSeleccionados] = useState([]); // IDs seleccionados

  const navigate = useNavigate();

  // ---- ORDEN POR FECHA (desc) CON FALLBACK ----
  const toDate = (f) => {
    if (!f) return new Date("1970-01-01");
    // Firestore Timestamp
    if (typeof f === "object" && f.seconds) return new Date(f.seconds * 1000);
    // ISO string o similar
    return new Date(f);
  };

  const fetchDocuments = async () => {
    try {
      const q = query(collection(db, "disponible"), orderBy("fecha", "desc"));
      const querySnapshot = await getDocs(q);
      const docsArray = querySnapshot.docs.map((docu) => ({
        id: docu.id,
        ...docu.data(),
      }));
      setPrendasDisponibles(docsArray);
    } catch (error) {
      console.error("Error al cargar con orderBy, aplicando sort local:", error);
      // Fallback: sin orderBy, ordenamos en cliente
      const querySnapshot = await getDocs(collection(db, "disponible"));
      const docsArray = querySnapshot.docs.map((docu) => ({
        id: docu.id,
        ...docu.data(),
      }));
      docsArray.sort((a, b) => toDate(b.fecha) - toDate(a.fecha));
      setPrendasDisponibles(docsArray);
    }
  };

  // Eliminar en lote (R2 + Firestore)
  const eliminarSeleccionados = async () => {
    const confirmDelete = window.confirm(
      `¿Seguro que deseas eliminar ${seleccionados.length} prendas seleccionadas?`
    );
    if (!confirmDelete) return;

    try {
      // Función para eliminar imágenes del storage (solo R2)
      const deleteImageFromStorage = async (fotoUrl) => {
        try {
          if (fotoUrl.includes("r2.dev") || fotoUrl.includes("pub-")) {
            console.log("Eliminando de R2:", fotoUrl);

            const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || "https://malim-backend.vercel.app").trim();
            const encodedUrl = encodeURIComponent(fotoUrl);
            const url = `${BACKEND_URL}/api/deleteImage?url=${encodedUrl}`;

            const response = await fetch(url, {
              method: "DELETE",
              headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
              }
            });

            const result = await response.json();

            if (!response.ok) {
              if (response.status === 404) {
                console.warn("Imagen no encontrada en R2, continuando:", fotoUrl);
                return true;
              }
              throw new Error(result.error || `Error R2: ${response.status}`);
            }

            if (!result.success && !result.message.includes("no se requiere eliminación")) {
              throw new Error(result.error || "Error al eliminar imagen de R2");
            }

            console.log("Imagen de R2 eliminada:", fotoUrl);
            return true;

          } else {
            console.warn("URL de imagen no reconocida, no se elimina:", fotoUrl);
            return true;
          }
        } catch (error) {
          if (error.message.includes("no fue encontrada") ||
              error.message.includes("not found")) {
            console.warn("Imagen no encontrada, continuando:", fotoUrl);
            return true;
          }
          console.error(`Error eliminando imagen ${fotoUrl}:`, error);
          throw error;
        }
      };

      // Procesar cada prenda seleccionada
      await Promise.all(
        seleccionados.map(async (id) => {
          const prenda = prendasDisponibles.find((p) => p.id === id);
          if (!prenda) return;

          // Eliminar imágenes del storage (manejar errores individualmente)
          if (prenda.fotos && prenda.fotos.length > 0) {
            const deletePromises = prenda.fotos.map(fotoUrl =>
              deleteImageFromStorage(fotoUrl)
                .catch(error => {
                  console.warn(`Error eliminando imagen ${fotoUrl}:`, error.message);
                  return true; // Continuar aunque falle una imagen
                })
            );
            await Promise.all(deletePromises);
          }

          // Eliminar documento de Firestore
          await deleteDoc(doc(db, "disponible", id));
        })
      );

      alert("Prendas eliminadas con éxito");
      setSeleccionados([]);
      setModoSeleccion(false);
      await fetchDocuments(); // Recargar la lista

    } catch (error) {
      console.error("Error eliminando prendas:", error);
      alert("Error eliminando algunas prendas");
    }
  };

  const manejarClickPrenda = (id) => {
    if (modoSeleccion) {
      setSeleccionados((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    } else {
      navigate(`/DetallePrenda/${id}`);
    }
  };

  // ---- Long-press (click sostenido) para activar selección en móvil/desktop ----
  const pressTimerRef = useRef(null);
  const longPressTriggeredRef = useRef(false);
  const LONG_PRESS_MS = 2000;

  const startPress = (id) => {
    clearTimeout(pressTimerRef.current);
    longPressTriggeredRef.current = false;
    pressTimerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true;
      setModoSeleccion(true);
      setSeleccionados((prev) => (prev.includes(id) ? prev : [...prev, id]));
    }, LONG_PRESS_MS);
  };

  const cancelPress = () => {
    clearTimeout(pressTimerRef.current);
  };

  const handleCardClick = (id) => {
    // Si el long-press activó selección, evitamos navegar/togglear doble
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      return;
    }
    manejarClickPrenda(id);
  };

  // Cargar prendas
  useEffect(() => {
    fetchDocuments();
  }, []);

  // Cargar proveedores
  useEffect(() => {
    const fetchProveedores = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "proveedores"));
        const docsArray = querySnapshot.docs.map((docu) => ({
          id: docu.id,
          ...docu.data(),
        }));
        setProveedores(docsArray);
      } catch (error) {
        console.log("Error al cargar proveedores", error);
      }
    };
    fetchProveedores();
  }, []);

  // Filtros
  const categoriaOptions = [
    "Abrigos", "Accesorios", "Patria", "Blusas", "Playeras", "Playeras deportivas", "Conjuntos",
    "Conjuntos deportivos", "Chamarras", "Sudaderas", "Maxi sudaderas", "Maxi vestidos", "Maxi cobijas",
    "Ensambles", "Pantalones", "Pants", "Shorts", "Infantil niño", "Infantil niña", "Medias", "Leggins",
    "Mallones", "Ropa interior", "Sacos", "Blazers", "Capas", "Palazzos", "Camisas", "Gorros", "Calzado",
    "Chalecos", "Blusones", "Pijamas", "Guantes", "Faldas", "Suéteres", "Overoles", "Otros", "Sin Categoria",
    "Niños uisex", "Gabardinas", "Vestidos"
  ].map((cat) => ({ value: cat, label: cat }));

  const proveedoresOptions = proveedores.map((prov) => ({
    value: prov.proveedor,
    label: prov.proveedor,
  }));

  const filtrarPrendas = () => {
    return prendasDisponibles.filter((docu) => {
      const coincideProveedor = !filtroProveedor || docu.proveedor === filtroProveedor.value;
      const coincideCategoria = !filtroCategoria || docu.categoria === filtroCategoria.value;
      const coincideBusqueda = !busqueda || (docu.prenda || "").toLowerCase().includes(busqueda.toLowerCase());
      return coincideProveedor && coincideCategoria && coincideBusqueda;
    });
  };

  // UI: barra pequeña cuando hay selección activa
  const limpiarSeleccion = () => {
    setSeleccionados([]);
    setModoSeleccion(false);
  };

  return (
    <div className="min-h-screen bg-pink-100">
      <Header menuAbierto={menuAbierto} manejadorMenu={() => setmenuAbierto(!menuAbierto)} />
      <h1 className="fixed inset-x-0 transform pt-2 text-center pointer-events-none font-bold text-xl text-white z-50">
        Prendas disponibles
      </h1>
      <MenuLateral menuAbierto={menuAbierto} />
      <MenuAñadir menuAñadir={menuAñadir} />

      <main className="pb-16 pt-10">
        {/* filtros */}
        <div className="flex lg:flex-row flex-col justify-between">
          <div className="lg:p-5 px-5 pt-2 flex flex-row items-center gap-2">
            <h1 className="font-bold lg:text-sm text-xs text-pink-800 mr-2">Filtrar por:</h1>
            <Select options={proveedoresOptions} onChange={setFiltroProveedor} isClearable placeholder="Proveedor" />
            <Select options={categoriaOptions} onChange={setFiltroCategoria} isClearable placeholder="Categoría" />
          </div>
          <div className="lg:p-5 px-5 pt-1 pb-2 flex flex-row items-center">
            <h1 className="font-bold lg:text-sm text-xs text-pink-800 mr-2">Búsqueda:</h1>
            <input
              type="text"
              placeholder="Buscar"
              className="h-10 rounded-lg p-2 border-gray-200 border-2"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </div>

        {/* barra selección activa */}
        {modoSeleccion && (
          <div className="fixed top-16 left-0 right-0 bg-red-500 text-white p-3 z-40 flex justify-between items-center shadow-lg">
            <span className="text-sm font-bold">
              {seleccionados.length} prenda(s) seleccionada(s)
            </span>
            <div className="flex gap-2">
              <button
                onClick={limpiarSeleccion}
                className="bg-white text-red-600 px-3 py-1 rounded text-sm font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={eliminarSeleccionados}
                className="bg-white text-red-600 px-3 py-1 rounded text-sm font-bold flex items-center gap-1"
              >
                <FaTrash size={14} /> Eliminar
              </button>
            </div>
          </div>
        )}

        {/* lista de productos */}
        <div className="productos-container bg-pink-100 grid grid-cols-2 lg:grid-cols-5 lg:gap-3 gap-3 mx-5 mb-5">
          {filtrarPrendas().map((docu) => (
            <div
              key={docu.id}
              onClick={() => handleCardClick(docu.id)}
              onContextMenu={(e) => {
                e.preventDefault();
                // click derecho activa selección
                setModoSeleccion(true);
                setSeleccionados((prev) => (prev.includes(docu.id) ? prev : [...prev, docu.id]));
              }}
              onMouseDown={() => startPress(docu.id)}
              onMouseUp={cancelPress}
              onMouseLeave={cancelPress}
              onTouchStart={() => startPress(docu.id)}
              onTouchEnd={cancelPress}
              className={`producto h-auto border-2 rounded-lg shadow-xl cursor-pointer transition ${seleccionados.includes(docu.id) ? "border-red-500 bg-red-100" : "border-pink-200"
                }`}
            >
              <div className="lg:h-64 h-40 w-full rounded-lg overflow-hidden">
                {docu.fotos && docu.fotos.length > 0 ? (
                  <img
                    src={docu.fotos[0]}
                    alt="Foto del producto"
                    className="lg:h-64 h-40 w-full object-cover"
                  />
                ) : (
                  <div className="flex items-center h-full justify-center">
                    <p className="text-center text-gray-600 font-sm">Sin fotos</p>
                  </div>
                )}
              </div>
              <div className="p-2 text-pink-600">
                <p className="font-bold lg:text-sm text-pink-700">{docu.prenda}</p>
                <div className="flex flex-row justify-start">
                  <p className="lg:text-sm">${docu.costo}</p>
                  <p className="font-bold lg:text-sm ml-5 text-pink-700">${docu.precio}</p>
                </div>
                <p className="lg:text-sm">{Array.isArray(docu.talla) ? docu.talla.join(", ") : docu.talla}</p>
                <p className="lg:text-sm">{docu.proveedor}</p>
                <p className="lg:text-xs">{docu.detalles}</p>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* botón eliminar flotante */}
      {seleccionados.length > 0 && (
        <button
          onClick={eliminarSeleccionados}
          className="fixed bottom-20 right-5 bg-red-600 text-white p-4 rounded-full shadow-xl active:scale-95"
          aria-label="Eliminar seleccionados"
          title="Eliminar seleccionados"
        >
          <FaTrash size={20} />
        </button>
      )}

      <Footer manejadorMenuAñadir={() => setmenuAñadir(!menuAñadir)} />
    </div>
  );
}

export default Disponible;