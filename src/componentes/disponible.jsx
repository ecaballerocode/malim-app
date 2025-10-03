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

// ✅ Función para redondear al múltiplo de 5 más cercano hacia arriba
const roundUpToNearest5 = (num) => {
  return Math.ceil(num / 5) * 5;
};

function Disponible() {
  const [menuAbierto, setmenuAbierto] = useState(false);
  const [menuAñadir, setmenuAñadir] = useState(false);
  const [proveedores, setProveedores] = useState([]);
  const [filtroProveedor, setFiltroProveedor] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [prendasDisponibles, setPrendasDisponibles] = useState([]);
  const [busqueda, setBusqueda] = useState("");

  const [modoSeleccion, setModoSeleccion] = useState(false);
  const [seleccionados, setSeleccionados] = useState([]);

  const navigate = useNavigate();

  const toDate = (f) => {
    if (!f) return new Date("1970-01-01");
    if (typeof f === "object" && f.seconds) return new Date(f.seconds * 1000);
    return new Date(f);
  };

  const fetchDocuments = async () => {
    try {
      const q = query(collection(db, "disponible"), orderBy("fecha", "desc"));
      const querySnapshot = await getDocs(q);
      const docsArray = [];
      querySnapshot.forEach((docu) => {
        const data = docu.data();
        // Solo incluir si tiene datos mínimos
        if (data && typeof data === 'object') {
          docsArray.push({
            id: docu.id,
            ...data
          });
        }
      });
      setPrendasDisponibles(docsArray);
    } catch (error) {
      console.error("Error al cargar con orderBy, aplicando sort local:", error);
      try {
        const querySnapshot = await getDocs(collection(db, "disponible"));
        const docsArray = [];
        querySnapshot.forEach((docu) => {
          const data = docu.data();
          if (data && typeof data === 'object') {
            docsArray.push({
              id: docu.id,
              ...data
            });
          }
        });
        // Ordenar localmente solo si hay fecha
        docsArray.sort((a, b) => {
          const dateA = a.fecha ? toDate(a.fecha) : new Date(0);
          const dateB = b.fecha ? toDate(b.fecha) : new Date(0);
          return dateB - dateA;
        });
        setPrendasDisponibles(docsArray);
      } catch (innerError) {
        console.error("Error total al cargar prendas:", innerError);
        setPrendasDisponibles([]); // Si todo falla, array vacío
      }
    }
  };

  // Eliminar en lote (R2 + Firestore) → igual que antes
  const eliminarSeleccionados = async () => {
    const confirmDelete = window.confirm(
      `¿Seguro que deseas eliminar ${seleccionados.length} prendas seleccionadas?`
    );
    if (!confirmDelete) return;

    try {
      const deleteImageFromStorage = async (fotoUrl) => {
        try {
          if (fotoUrl.includes("r2.dev") || fotoUrl.includes("pub-")) {
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
          if (error.message.includes("no fue encontrada") || error.message.includes("not found")) {
            console.warn("Imagen no encontrada, continuando:", fotoUrl);
            return true;
          }
          console.error(`Error eliminando imagen ${fotoUrl}:`, error);
          throw error;
        }
      };

      await Promise.all(
        seleccionados.map(async (id) => {
          const prenda = prendasDisponibles.find((p) => p.id === id);
          if (!prenda) return;

          if (prenda.fotos && prenda.fotos.length > 0) {
            const deletePromises = prenda.fotos.map(fotoUrl =>
              deleteImageFromStorage(fotoUrl).catch(error => {
                console.warn(`Error eliminando imagen ${fotoUrl}:`, error.message);
                return true;
              })
            );
            await Promise.all(deletePromises);
          }

          await deleteDoc(doc(db, "disponible", id));
        })
      );

      alert("Prendas eliminadas con éxito");
      setSeleccionados([]);
      setModoSeleccion(false);
      await fetchDocuments();
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
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      return;
    }
    manejarClickPrenda(id);
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

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
    if (!Array.isArray(prendasDisponibles)) {
      return [];
    }
    return prendasDisponibles.filter((docu) => {
      if (!docu || typeof docu !== 'object') return false;

      const proveedorDoc = String(docu.proveedor || "").trim();
      const categoriaDoc = String(docu.categoria || "").trim();
      const prendaDoc = String(docu.prenda || "").toLowerCase();

      const coincideProveedor = !filtroProveedor || proveedorDoc === String(filtroProveedor.value || "");
      const coincideCategoria = !filtroCategoria || categoriaDoc === String(filtroCategoria.value || "");
      const coincideBusqueda = !busqueda || prendaDoc.includes(String(busqueda).toLowerCase().trim());

      return coincideProveedor && coincideCategoria && coincideBusqueda;
    });
  };

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
        <div className="flex lg:flex-row flex-col justify-between px-5 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-sm text-pink-800">Filtrar por:</span>
            <Select
              options={proveedoresOptions}
              onChange={setFiltroProveedor}
              isClearable
              placeholder="Proveedor"
              className="w-40"
            />
            <Select
              options={categoriaOptions}
              onChange={setFiltroCategoria}
              isClearable
              placeholder="Categoría"
              className="w-40"
            />
          </div>
          <div className="flex items-center mt-2 lg:mt-0">
            <span className="font-bold text-sm text-pink-800 mr-2">Búsqueda:</span>
            <input
              type="text"
              placeholder="Buscar prenda..."
              className="h-10 rounded-lg p-2 border border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-400"
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
        {/* lista de productos */}
        <div className="productos-container grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mx-4 mb-5">
          {(() => {
            const prendasFiltradas = filtrarPrendas();
            if (!Array.isArray(prendasFiltradas) || prendasFiltradas.length === 0) {
              return (
                <div className="col-span-full text-center py-10 text-gray-500">
                  No hay prendas disponibles
                </div>
              );
            }

            return prendasFiltradas.map((docu) => {
              if (!docu || !docu.id) return null;

              // Valores seguros con fallbacks
              const fotos = Array.isArray(docu.fotos) ? docu.fotos : [];
              const prendaNombre = String(docu.prenda || "Sin nombre").trim() || "Sin nombre";
              const precioOriginal = typeof docu.precio === 'number' ? docu.precio : (typeof docu.precio === 'string' ? parseFloat(docu.precio) || 0 : 0);
              const ofertaRaw = docu.oferta;
              let oferta = 0;
              if (typeof ofertaRaw === 'number') {
                oferta = ofertaRaw;
              } else if (typeof ofertaRaw === 'string') {
                oferta = parseFloat(ofertaRaw) || 0;
              }
              const tieneOferta = oferta > 0 && oferta <= 100;
              const descuento = tieneOferta ? (precioOriginal * oferta) / 100 : 0;
              const precioConDescuento = precioOriginal - descuento;
              const precioRedondeado = roundUpToNearest5(precioConDescuento);

              const tallaTexto = docu.talla
                ? Array.isArray(docu.talla)
                  ? docu.talla.join(", ")
                  : String(docu.talla)
                : "";

              return (
                <div
                  key={docu.id}
                  onClick={() => handleCardClick(docu.id)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setModoSeleccion(true);
                    setSeleccionados((prev) => (prev.includes(docu.id) ? prev : [...prev, docu.id]));
                  }}
                  onMouseDown={() => startPress(docu.id)}
                  onMouseUp={cancelPress}
                  onMouseLeave={cancelPress}
                  onTouchStart={() => startPress(docu.id)}
                  onTouchEnd={cancelPress}
                  className={`producto rounded-xl shadow-md overflow-hidden transition-transform hover:scale-[1.02] cursor-pointer ${seleccionados.includes(docu.id)
                      ? "ring-4 ring-red-500 bg-red-50"
                      : "bg-white"
                    }`}
                >
                  <div className="h-40 w-full overflow-hidden">
                    {fotos.length > 0 ? (
                      <img
                        src={fotos[0]}
                        alt={prendaNombre}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath fill='%23ccc' d='M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z'/%3E%3C/svg%3E";
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-gray-100">
                        <span className="text-gray-500 text-sm">Sin imagen</span>
                      </div>
                    )}
                  </div>

                  <div className="p-3">
                    <h3 className="font-bold text-pink-800 text-sm mb-1 line-clamp-2">
                      {prendaNombre}
                    </h3>

                    <div className="mb-2">
                      {tieneOferta ? (
                        <div className="space-y-1">
                          <p className="text-gray-500 text-sm line-through">
                            ${precioOriginal.toFixed(2)}
                          </p>
                          <p className="text-lg font-bold text-green-600">
                            ${precioRedondeado}
                          </p>
                          <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                            -{Math.round(oferta)}%
                          </span>
                        </div>
                      ) : (
                        <p className="text-lg font-bold text-pink-700">
                          ${precioOriginal}
                        </p>
                      )}
                    </div>

                    <div className="text-xs text-gray-600 space-y-0.5">
                      {tallaTexto && (
                        <p className="truncate">
                          <span className="font-medium">Talla:</span> {tallaTexto}
                        </p>
                      )}
                      {docu.proveedor && (
                        <p className="truncate">
                          <span className="font-medium">Prov:</span> {String(docu.proveedor)}
                        </p>
                      )}
                      {docu.detalles && (
                        <p className="truncate text-gray-500">{String(docu.detalles)}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            }).filter(Boolean); // Elimina nulls
          })()}
        </div>
      </main>

      {seleccionados.length > 0 && (
        <button
          onClick={eliminarSeleccionados}
          className="fixed bottom-20 right-5 bg-red-600 text-white p-4 rounded-full shadow-xl active:scale-95 hover:bg-red-700 transition"
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