// editar-cliente.js
import React, { useEffect, useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import Header from "./header";
import Footer from "./footer";
import { doc, updateDoc, getDoc, deleteDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../credenciales";

function EditarCliente() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [cliente, setCliente] = useState({
    cliente: "",
    telefono: "",
    cumpleaños: "",
    perfil_recomendacion: {
      tipo_cliente: "",
      dias_desde_ultima_compra: null,
      ultima_compra: null, // Esto será un Timestamp de Firebase
      frecuencia_compra_mensual: 0,
      gasto_promedio_por_compra: 0,
      total_pedidos_12m: 0,
      rango_precio_min: 0,
      rango_precio_max: 0,
      rango_precio_promedio: 0,
      presupuesto_estimado: "bajo",
      estilo_de_compra: "",
      variedad_colores: 0,
      total_categorias_compradas: 0,
      categorias_favoritas: [],
      colores_favoritos: [],
      prendas_mas_compradas: [],
      tallas_mas_usadas: [],
      satisfaccion_promedio: null,
      satisfaccion_ultimas_5: null,
      satisfacciones_recientes: [],
      preferencia_compra: "",   // precio, estilo, confianza, comodidad
      preferencia_canal: "",    // facebook, whatsapp, catalogo digital
    },
  });

  const [modoEdicion, setModoEdicion] = useState(false);
  const [prendasDisponibles, setPrendasDisponibles] = useState([]);
  const [prendasRecomendadas, setPrendasRecomendadas] = useState([]);

  useEffect(() => {
    const fetchCliente = async () => {
      let data;
      if (location.state?.cliente) {
        data = location.state.cliente;
      } else {
        const docRef = doc(db, "clientes", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          data = { id: docSnap.id, ...docSnap.data() };
        } else {
          console.error("No se encontró el cliente");
          return;
        }
      }
      if (!data.perfil_recomendacion) {
        data.perfil_recomendacion = {};
      }
      setCliente(data);
    };
    fetchCliente();
  }, [id, location.state]);

  useEffect(() => {
    const fetchPrendas = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "disponible"));
        const prendas = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPrendasDisponibles(prendas);
      } catch (error) {
        console.error("Error al cargar prendas disponibles", error);
      }
    };
    fetchPrendas();
  }, []);

  useEffect(() => {
    if (cliente && prendasDisponibles.length > 0) {
      const recomendadas = calcularRecomendaciones(cliente, prendasDisponibles);
      setPrendasRecomendadas(recomendadas);
    }
  }, [cliente, prendasDisponibles]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setCliente({
        ...cliente,
        [parent]: {
          ...cliente[parent],
          [child]: value,
        },
      });
    } else {
      setCliente({ ...cliente, [name]: value });
    }
  };

  const handleGuardar = async () => {
    try {
      const docRef = doc(db, "clientes", id);
      await updateDoc(docRef, {
        cliente: cliente.cliente,
        telefono: cliente.telefono,
        cumpleaños: cliente.cumpleaños,
        perfil_recomendacion: cliente.perfil_recomendacion,
      });
      alert("Cliente actualizado con éxito");
      setModoEdicion(false);
    } catch (error) {
      console.error("Error al actualizar cliente", error);
      alert("Error al guardar cambios");
    }
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      "¿Estás seguro de que deseas eliminar este cliente? Esta acción no se puede deshacer."
    );
    if (!confirmDelete) return;
    try {
      await deleteDoc(doc(db, "clientes", id));
      alert("Cliente eliminado con éxito");
      navigate("/clientes");
    } catch (error) {
      console.error("Error al eliminar el cliente:", error);
      alert("Hubo un error al eliminar el cliente");
    }
  };

  // Función para obtener color del puntito según días desde última compra
  const getColorDotClass = (dias) => {
    if (dias === undefined || dias === null) return "bg-red-500";
    if (dias < 21) return "bg-green-500";
    if (dias <= 35) return "bg-yellow-500";
    if (dias <= 63) return "bg-orange-500";
    return "bg-red-500";
  };

  const getColorDotLabel = (dias) => {
    if (dias === undefined || dias === null) return "Sin dato reciente";
    if (dias < 21) return "Activo recientemente";
    if (dias <= 35) return "Moderadamente activo";
    if (dias <= 63) return "Poco activo";
    return "Inactivo";
  };

  // Formatear arrays para mostrar
  const formatArray = (arr) => (Array.isArray(arr) && arr.length > 0 ? arr.join(", ") : "—");

  // Formatear número de forma segura
  const formatNumber = (value) => {
    if (typeof value === "number" && !isNaN(value)) {
      return value.toFixed(2);
    }
    return "0.00";
  };

  // Formatear timestamp de Firebase (maneja Timestamp, Date, string, etc.)
  // formatea cualquier cosa que represente una fecha a una cadena "dd/mm/aaaa"
  const formatDate = (input) => {
    if (!input) return "—";

    // 1) Firestore Timestamp con toDate()
    if (input?.toDate && typeof input.toDate === "function") {
      const d = input.toDate();
      return isNaN(d) ? "—" : d.toLocaleDateString("es-ES");
    }

    // 2) Objeto con seconds / nanoseconds (exportado, JSON, etc.)
    if (typeof input === "object") {
      const seconds = input.seconds ?? input._seconds;
      const nanoseconds = input.nanoseconds ?? input._nanoseconds ?? 0;
      if (typeof seconds === "number") {
        const ms = seconds * 1000 + Math.floor(nanoseconds / 1e6);
        const d = new Date(ms);
        return isNaN(d) ? "—" : d.toLocaleDateString("es-ES");
      }
    }

    // 3) Instancia Date
    if (input instanceof Date && !isNaN(input)) {
      return input.toLocaleDateString("es-ES");
    }

    // 4) Número: puede ser segundos (10 dígitos) o ms (13 dígitos)
    if (typeof input === "number" && !isNaN(input)) {
      let ms = input;
      if (input < 1e12) ms = input * 1000; // asumimos segundos si es pequeño
      const d = new Date(ms);
      return isNaN(d) ? "—" : d.toLocaleDateString("es-ES");
    }

    // 5) String (ISO u otro formato)
    if (typeof input === "string") {
      const d = new Date(input);
      if (!isNaN(d)) return d.toLocaleDateString("es-ES");
      return input; // si no es fecha válida devolvemos el string original
    }

    // Fallback seguro (no devolver [object Object])
    try {
      return String(input);
    } catch {
      return "—";
    }
  };

  // Normaliza y devuelve la "ultima_compra" posible (Date | Timestamp-like | null)
  const obtenerUltimaCompra = (perfil) => {
    if (!perfil) return null;

    const raw = perfil.ultima_compra ?? null;
    // Si ya es Date o Timestamp, devolverlo igual y dejar que formatDate lo procese
    if (!raw) {
      // si no hay ultima_compra, pero hay dias_desde_ultima_compra -> calcular fecha
      if (
        typeof perfil.dias_desde_ultima_compra === "number" &&
        !isNaN(perfil.dias_desde_ultima_compra)
      ) {
        const hoy = new Date();
        const fechaCalculada = new Date(hoy);
        fechaCalculada.setDate(hoy.getDate() - perfil.dias_desde_ultima_compra);
        return fechaCalculada;
      }
      return null;
    }

    // Si raw es un objeto con seconds/nanoseconds sin método toDate, devolverlo tal cual:
    // formatDate lo transformará. Si es Timestamp con toDate, también será correcto.
    return raw;
  };


  // Función para calcular prendas recomendadas
  const calcularRecomendaciones = (cliente, prendas) => {
    const perfil = cliente.perfil_recomendacion || {};
    const categoriasFavoritas = perfil.categorias_favoritas || [];
    const tallasFavoritas = perfil.tallas_mas_usadas || [];
    const coloresFavoritos = perfil.colores_favoritos || [];
    const rangoMin = perfil.rango_precio_min || 0;
    const rangoMax = perfil.rango_precio_max || 999999;

    const prendasConPuntaje = prendas.map((prenda) => {
      let puntaje = 0;
      const coloresCoincidentes = [];

      // 1. Coincidencia por categoría
      if (
        categoriasFavoritas.some((cat) =>
          prenda.categoria?.toLowerCase().includes(cat.toLowerCase())
        )
      ) {
        puntaje += 3;
      }

      // 2. Coincidencia por talla
      if (
        Array.isArray(prenda.talla) &&
        tallasFavoritas.some((t) => prenda.talla.includes(t))
      ) {
        puntaje += 2;
      }

      // 3. Coincidencia por rango de precio
      if (prenda.precio >= rangoMin && prenda.precio <= rangoMax) {
        puntaje += 2;
      }

      // 4. Coincidencia por color en detalles
      const textoDetalles = (prenda.detalles || "").toLowerCase();
      const coloresEncontrados = coloresFavoritos.filter((color) =>
        textoDetalles.includes(color.toLowerCase())
      );

      if (coloresEncontrados.length > 0) {
        puntaje += 1;
        coloresCoincidentes.push(...coloresEncontrados);
      }

      return {
        ...prenda,
        puntaje,
        coloresCoincidentes,
      };
    });

    return prendasConPuntaje
      .filter((p) => p.puntaje > 0)
      .sort((a, b) => b.puntaje - a.puntaje)
      .slice(0, 5);
  };



  return (
    <div className="min-h-screen bg-pink-100">
      <Header />
      <main className="pt-24 px-4 pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <h2 className="text-2xl font-bold text-pink-700 mb-4 md:mb-0">
              {modoEdicion ? "✏️ Editar Cliente" : cliente.cliente || "Cliente"}
            </h2>
            <div className="flex gap-3">
              {modoEdicion ? (
                <>
                  <button
                    onClick={handleGuardar}
                    className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg shadow transition"
                  >
                    💾 Guardar
                  </button>
                  <button
                    onClick={() => setModoEdicion(false)}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg shadow transition"
                  >
                    ❌ Cancelar
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setModoEdicion(true)}
                    className="bg-pink-400 hover:bg-pink-500 text-white px-4 py-2 rounded-lg shadow transition"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={handleDelete}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow transition"
                  >
                    🗑️ Eliminar
                  </button>
                </>
              )}
            </div>
          </div>

          {modoEdicion ? (
            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              <h3 className="text-lg font-semibold mb-4 text-pink-600">Información Básica</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  name="cliente"
                  value={cliente.cliente}
                  onChange={handleChange}
                  placeholder="Nombre del cliente"
                  className="w-full px-4 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-pink-300"
                />
                <input
                  type="text"
                  name="telefono"
                  value={cliente.telefono}
                  onChange={handleChange}
                  placeholder="Teléfono"
                  className="w-full px-4 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-pink-300"
                />
                <input
                  type="date"
                  name="cumpleaños"
                  value={cliente.cumpleaños}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-pink-300"
                />
              </div>

              <h3 className="text-lg font-semibold mt-6 mb-4 text-pink-600">Perfil de Recomendación</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  name="perfil_recomendacion.tipo_cliente"
                  value={cliente.perfil_recomendacion.tipo_cliente || ""}
                  onChange={handleChange}
                  placeholder="Tipo de cliente"
                  className="w-full px-4 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-pink-300"
                />
                <input
                  type="number"
                  name="perfil_recomendacion.dias_desde_ultima_compra"
                  value={cliente.perfil_recomendacion.dias_desde_ultima_compra || ""}
                  onChange={handleChange}
                  placeholder="Días desde última compra"
                  className="w-full px-4 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-pink-300"
                />
                <input
                  type="text"
                  name="perfil_recomendacion.estilo_de_compra"
                  value={cliente.perfil_recomendacion.estilo_de_compra || ""}
                  onChange={handleChange}
                  placeholder="Estilo de compra"
                  className="w-full px-4 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-pink-300"
                />
                <input
                  type="number"
                  name="perfil_recomendacion.frecuencia_compra_mensual"
                  value={cliente.perfil_recomendacion.frecuencia_compra_mensual || ""}
                  onChange={handleChange}
                  placeholder="Frecuencia mensual"
                  className="w-full px-4 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-pink-300"
                />
                <input
                  type="number"
                  name="perfil_recomendacion.gasto_promedio_por_compra"
                  value={cliente.perfil_recomendacion.gasto_promedio_por_compra || ""}
                  onChange={handleChange}
                  placeholder="Gasto promedio por compra"
                  className="w-full px-4 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-pink-300"
                />
                <input
                  type="number"
                  name="perfil_recomendacion.total_pedidos_12m"
                  value={cliente.perfil_recomendacion.total_pedidos_12m || ""}
                  onChange={handleChange}
                  placeholder="Total pedidos últimos 12m"
                  className="w-full px-4 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-pink-300"
                />
                <input
                  type="number"
                  name="perfil_recomendacion.rango_precio_min"
                  value={cliente.perfil_recomendacion.rango_precio_min || ""}
                  onChange={handleChange}
                  placeholder="Rango precio mínimo"
                  className="w-full px-4 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-pink-300"
                />
                <input
                  type="number"
                  name="perfil_recomendacion.rango_precio_max"
                  value={cliente.perfil_recomendacion.rango_precio_max || ""}
                  onChange={handleChange}
                  placeholder="Rango precio máximo"
                  className="w-full px-4 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-pink-300"
                />
                <select
                  name="perfil_recomendacion.presupuesto_estimado"
                  value={cliente.perfil_recomendacion.presupuesto_estimado || "bajo"}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-pink-300"
                >
                  <option value="bajo">Bajo</option>
                  <option value="alto">Alto</option>
                </select>
              </div>

              <h4 className="mt-6 font-medium text-gray-700">Preferencias (separar con comas)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <input
                  type="text"
                  name="perfil_recomendacion.categorias_favoritas"
                  value={formatArray(cliente.perfil_recomendacion.categorias_favoritas)}
                  onChange={(e) =>
                    handleChange({
                      target: {
                        name: "perfil_recomendacion.categorias_favoritas",
                        value: e.target.value.split(",").map((s) => s.trim()),
                      },
                    })
                  }
                  placeholder="Categorías favoritas"
                  className="w-full px-4 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-pink-300"
                />
                <input
                  type="text"
                  name="perfil_recomendacion.colores_favoritos"
                  value={formatArray(cliente.perfil_recomendacion.colores_favoritos)}
                  onChange={(e) =>
                    handleChange({
                      target: {
                        name: "perfil_recomendacion.colores_favoritos",
                        value: e.target.value.split(",").map((s) => s.trim()),
                      },
                    })
                  }
                  placeholder="Colores favoritos"
                  className="w-full px-4 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-pink-300"
                />
                <input
                  type="text"
                  name="perfil_recomendacion.prendas_mas_compradas"
                  value={formatArray(cliente.perfil_recomendacion.prendas_mas_compradas)}
                  onChange={(e) =>
                    handleChange({
                      target: {
                        name: "perfil_recomendacion.prendas_mas_compradas",
                        value: e.target.value.split(",").map((s) => s.trim()),
                      },
                    })
                  }
                  placeholder="Prendas más compradas"
                  className="w-full px-4 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-pink-300"
                />
                <input
                  type="text"
                  name="perfil_recomendacion.tallas_mas_usadas"
                  value={formatArray(cliente.perfil_recomendacion.tallas_mas_usadas)}
                  onChange={(e) =>
                    handleChange({
                      target: {
                        name: "perfil_recomendacion.tallas_mas_usadas",
                        value: e.target.value.split(",").map((s) => s.trim()),
                      },
                    })
                  }
                  placeholder="Tallas más usadas"
                  className="w-full px-4 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-pink-300"
                />
                <h4 className="mt-6 font-medium text-gray-700">Encuesta de Preferencias</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <select
                    name="perfil_recomendacion.preferencia_compra"
                    value={cliente.perfil_recomendacion.preferencia_compra || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-pink-300"
                  >
                    <option value="">-- Selecciona preferencia --</option>
                    <option value="precio">Precio</option>
                    <option value="estilo">Estilo</option>
                    <option value="confianza">Confianza</option>
                    <option value="comodidad">Comodidad</option>
                  </select>

                  <select
                    name="perfil_recomendacion.preferencia_canal"
                    value={cliente.perfil_recomendacion.preferencia_canal || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-pink-300"
                  >
                    <option value="">-- Selecciona canal --</option>
                    <option value="facebook">Facebook</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="catalogo digital">Catálogo digital</option>
                  </select>
                </div>

              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Sección: Estado de Actividad */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-bold text-pink-600 mb-4">📊 Estado de Actividad</h3>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center">
                    <span
                      className={`w-6 h-6 rounded-full ${getColorDotClass(
                        cliente.perfil_recomendacion?.dias_desde_ultima_compra
                      )}`}
                    ></span>
                    <span className="text-xs mt-1 text-gray-600">
                      {getColorDotLabel(cliente.perfil_recomendacion?.dias_desde_ultima_compra)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">
                      Última compra:{" "}
                      <span className="font-normal text-gray-700">
                        {formatDate(obtenerUltimaCompra(cliente.perfil_recomendacion)) || "Sin registro"}
                      </span>
                    </p>
                    <p className="font-medium">
                      Días desde última compra:{" "}
                      <span className="font-normal text-gray-700">
                        {typeof cliente.perfil_recomendacion?.dias_desde_ultima_compra === "number"
                          ? cliente.perfil_recomendacion.dias_desde_ultima_compra + " días"
                          : "Sin registro"}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Datos Básicos */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-bold text-pink-600 mb-4">📋 Datos Básicos</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-700">Nombre</p>
                    <p>{cliente.cliente || "—"}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Teléfono</p>
                    <p>{cliente.telefono || "—"}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Cumpleaños</p>
                    <p>{cliente.cumpleaños || "—"}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Tipo de cliente</p>
                    <p className="font-semibold text-pink-600">
                      {cliente.perfil_recomendacion?.tipo_cliente || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Estilo de compra</p>
                    <p>{cliente.perfil_recomendacion?.estilo_de_compra || "—"}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Presupuesto estimado</p>
                    <p className="font-semibold">
                      {cliente.perfil_recomendacion?.presupuesto_estimado || "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Estadísticas de Compra */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-bold text-pink-600 mb-4">📈 Estadísticas de Compra</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="bg-pink-50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-pink-600">
                      {typeof cliente.perfil_recomendacion?.total_pedidos_12m === "number"
                        ? cliente.perfil_recomendacion.total_pedidos_12m
                        : 0}
                    </p>
                    <p className="text-xs text-gray-600">Pedidos (12m)</p>
                  </div>
                  <div className="bg-pink-50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-pink-600">
                      {typeof cliente.perfil_recomendacion?.frecuencia_compra_mensual === "number"
                        ? cliente.perfil_recomendacion.frecuencia_compra_mensual
                        : 0}
                    </p>
                    <p className="text-xs text-gray-600">Compra/mes</p>
                  </div>
                  <div className="bg-pink-50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-pink-600">
                      ${formatNumber(cliente.perfil_recomendacion?.gasto_promedio_por_compra)}
                    </p>
                    <p className="text-xs text-gray-600">Gasto promedio</p>
                  </div>
                  <div className="bg-pink-50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-pink-600">
                      {cliente.perfil_recomendacion?.presupuesto_estimado || "—"}
                    </p>
                    <p className="text-xs text-gray-600">Presupuesto</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-700">Rango de precios</p>
                    <p>
                      ${formatNumber(cliente.perfil_recomendacion?.rango_precio_min)} - $
                      {formatNumber(cliente.perfil_recomendacion?.rango_precio_max)}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Precio promedio</p>
                    <p>${formatNumber(cliente.perfil_recomendacion?.rango_precio_promedio)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Categorías compradas</p>
                    <p>
                      {typeof cliente.perfil_recomendacion?.total_categorias_compradas === "number"
                        ? cliente.perfil_recomendacion.total_categorias_compradas
                        : 0}
                    </p>
                  </div>
                </div>
              </div>
              {/* Estadísticas de Satisfacción */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-bold text-pink-600 mb-4">😊 Satisfacción del Cliente</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div className="bg-pink-50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-pink-600">
                      {cliente.perfil_recomendacion?.satisfaccion_promedio ?? "—"}
                    </p>
                    <p className="text-xs text-gray-600">Promedio general</p>
                  </div>
                  <div className="bg-pink-50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-pink-600">
                      {cliente.perfil_recomendacion?.satisfaccion_ultimas_5 ?? "—"}
                    </p>
                    <p className="text-xs text-gray-600">Últimas 5 compras</p>
                  </div>
                  <div className="bg-pink-50 rounded-lg p-3">
                    <p className="text-sm text-gray-700">
                      {Array.isArray(cliente.perfil_recomendacion?.satisfacciones_recientes) &&
                        cliente.perfil_recomendacion.satisfacciones_recientes.length > 0
                        ? cliente.perfil_recomendacion.satisfacciones_recientes.join(", ")
                        : "Sin registros"}
                    </p>
                    <p className="text-xs text-gray-600">Satisfacciones recientes</p>
                  </div>
                </div>
              </div>


              {/* Preferencias */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-bold text-pink-600 mb-4">🎨 Preferencias del Cliente</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium text-gray-700 mb-1">Categorías favoritas</p>
                    <p className="bg-pink-50 px-3 py-2 rounded-md text-sm">
                      {formatArray(cliente.perfil_recomendacion?.categorias_favoritas)}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700 mb-1">Colores favoritos</p>
                    <p className="bg-pink-50 px-3 py-2 rounded-md text-sm">
                      {formatArray(cliente.perfil_recomendacion?.colores_favoritos)}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700 mb-1">Prendas más compradas</p>
                    <p className="bg-pink-50 px-3 py-2 rounded-md text-sm">
                      {formatArray(cliente.perfil_recomendacion?.prendas_mas_compradas)}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700 mb-1">Tallas más usadas</p>
                    <p className="bg-pink-50 px-3 py-2 rounded-md text-sm">
                      {formatArray(cliente.perfil_recomendacion?.tallas_mas_usadas)}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700 mb-1">Preferencia de compra</p>
                    <p className="bg-pink-50 px-3 py-2 rounded-md text-sm">
                      {cliente.perfil_recomendacion?.preferencia_compra || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700 mb-1">Canal favorito</p>
                    <p className="bg-pink-50 px-3 py-2 rounded-md text-sm">
                      {cliente.perfil_recomendacion?.preferencia_canal || "—"}
                    </p>
                  </div>

                </div>
              </div>

              {/* Prendas Recomendadas */}
              {prendasRecomendadas.length > 0 && (
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="text-lg font-bold text-pink-600 mb-4">
                    🛍️ Prendas Recomendadas para {cliente.cliente}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {prendasRecomendadas.map((prenda) => (
                      <div
                        key={prenda.id}
                        className="border border-pink-200 rounded-lg p-4 hover:shadow-md transition"
                      >
                        {prenda.fotos && prenda.fotos[0] && (
                          <img
                            src={prenda.fotos[0]}
                            alt={prenda.prenda}
                            className="w-full h-32 object-cover rounded-md mb-3"
                          />
                        )}
                        <h4 className="font-semibold text-gray-800">{prenda.prenda}</h4>
                        <p className="text-sm text-pink-600 font-medium">
                          ${typeof prenda.precio === "number" ? prenda.precio.toFixed(2) : "0.00"}
                        </p>
                        <p className="text-xs text-gray-600">
                          Tallas: {Array.isArray(prenda.talla) ? prenda.talla.join(", ") : "—"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Categoría: {prenda.categoria}</p>

                        <div className="mt-2">
                          {prenda.coloresCoincidentes && prenda.coloresCoincidentes.length > 0 ? (
                            <div className="text-xs">
                              <span className="font-medium text-green-700">🎯 Color sugerido: </span>
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                                {prenda.coloresCoincidentes.join(", ")}
                              </span>
                            </div>
                          ) : (
                            <div className="text-xs text-gray-500 italic">
                              ℹ️ Sin color específico — recomendada por otros criterios.
                            </div>
                          )}
                        </div>

                        <div className="mt-2 flex items-center">
                          <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full">
                            {prenda.puntaje} pts
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {prendasRecomendadas.length === 0 && (
                <div className="bg-white rounded-xl shadow-md p-6 text-center">
                  <p className="text-gray-500">
                    No se encontraron prendas que coincidan con el perfil de {cliente.cliente}.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default EditarCliente;