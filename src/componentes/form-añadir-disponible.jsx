import React, { useState, useEffect } from "react";
import Select from "react-select";
import Header from "./header";
import MenuLateral from "./menu-lateral";
import Footer from "./footer";
import MenuAñadir from "./menu-añadir";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "../credenciales";

function FormAñadirDisponible() {
  const [formData, setFormData] = useState({
    prenda: "",
    detalles: "",
    costo: "",
    precio: "",
    talla: [],
    categoria: null,
    proveedor: null,
  });

  const [fotos, setFotos] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [menuAbierto, setmenuAbierto] = useState(false);
  const [menuAñadir, setmenuAñadir] = useState(false);
  const [proveedores, setProveedores] = useState([]);
  const [fecha, setFecha] = useState("");

  // ✅ URL DEL BACKEND
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://malim-backend.vercel.app";

  const manejadorMenu = () => {
    setmenuAbierto(!menuAbierto);
  };

  const manejadorMenuAñadir = () => {
    setmenuAñadir(!menuAñadir);
  };

  // ✅ FUNCIÓN FALTANTE AGREGADA
  const handleDate = (e) => {
    const newDate = e.target.value;
    setFecha(newDate);
  };

  const categorias = [
    "Abrigos", "Accesorios", "Patria", "Blusas", "Playeras", "Playeras deportivas", "Conjuntos",
    "Conjuntos deportivos", "Chamarras", "Sudaderas", "Maxi sudaderas", "Maxi vestidos", "Maxi cobijas", 
    "Ensambles", "Pantalones", "Pants", "Shorts", "Infantil niño", "Infantil niña", "Medias", "Leggins",
    "Mallones", "Ropa interior", "Sacos", "Blazers", "Capas", "Palazzos", "Camisas", "Gorros", "Calzado", 
    "Chalecos", "Blusones", "Pijamas", "Guantes", "Faldas", "Suéteres", "Overoles", "Otros", "Sin Categoria", 
    "Niños uisex", "Gabardinas", "Vestidos"
  ];

  const tallas = [
    "(Inf 2-4)", "(Inf 6-8)", "(Inf 10-12)", "(juv 14-16)", "(XS 3-5)", "(28-30)", "(30-32)", "(30-34)", 
    "(32-36)", "(32-34)", "(34-36)", "(36-38)", "(38-40)", "(40-42)", "Unitalla", "(5)", "(7)", "(9)", 
    "(11)", "(13)", "(15)", "(17)", "(4)", "(6)", "(8)", "(10)", "(12)", "(14)", "(16)", "(28)", "(30)", 
    "(32)", "(34)", "(36)", "(38)", "(40)", "(42)"
  ];

  const categoriaOptions = categorias.map((cat) => ({
    value: cat,
    label: cat,
  }));

  const tallaOptions = tallas.map((talla) => ({
    value: talla,
    label: talla,
  }));

  const proveedoresOptions = proveedores.map((prov) => ({
    value: prov.id,
    label: prov.proveedor,
  }));

  // ✅ GUARDAR ARCHIVOS SIN SUBIRLOS INMEDIATAMENTE
  const handleFileChange = (e) => {
    const files = [...e.target.files];
    if (!files.length) return;

    setFotos(prev => [...prev, ...files]);
    const newPreviewUrls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
  };

  // ✅ LIMPIAR PREVIEW URLs
  useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "proveedores"));
        const docsArray = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProveedores(docsArray);
      } catch (error) {
        console.error("Error al cargar los proveedores", error);
      }
    };
    fetchDocuments();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCategoriaChange = (selectedOption) => {
    setFormData({ ...formData, categoria: selectedOption });
  };

  const handleTallaChange = (selectedOptions) => {
    const selectedTallas = selectedOptions ? selectedOptions.map((option) => option.value) : [];
    setFormData({ ...formData, talla: selectedTallas });
  };

  const handleProveedorChange = (selectedOption) => {
    setFormData({ ...formData, proveedor: selectedOption });
  };

  // ✅ SUBIR IMÁGENES SOLO AL DAR CLICK EN "AGREGAR PRENDA"
  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    let uploadedUrls = [];

    // ✅ 1. SUBIR IMÁGENES CON DEBUG POR ALERTS
    if (fotos.length > 0) {
      try {
        alert("📤 Iniciando subida de " + fotos.length + " imágenes...");
        
        const uploadFormData = new FormData();
        fotos.forEach((file, index) => {
          const fileName = `malim-${Date.now()}-${index}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          uploadFormData.append("files", file, fileName);
        });

        // ✅ Agregar timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
          alert("⏰ Timeout: La subida está tardando demasiado");
        }, 30000);

        const response = await fetch(BACKEND_URL + "/api/upload", {
          method: "POST",
          body: uploadFormData,
          mode: 'cors',
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        // ✅ MOSTRAR ESTADO DE LA RESPUESTA
        alert("📨 Respuesta recibida. Status: " + response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          alert("❌ Error del servidor: " + response.status + "\n" + errorText);
          throw new Error(`Error ${response.status}: ${errorText}`);
        }

        // ✅ VER RESPUESTA COMO TEXTO
        const responseText = await response.text();
        alert("📝 Respuesta del servidor:\n" + responseText.substring(0, 200) + "...");

        // ✅ INTENTAR PARSEAR JSON
        let data;
        try {
          data = JSON.parse(responseText);
          alert("✅ JSON parseado correctamente");
        } catch (parseError) {
          alert("❌ La respuesta no es JSON válido");
          throw new Error("Respuesta no es JSON: " + responseText.substring(0, 100));
        }

        // ✅ VERIFICAR SI TIENE URLs
        if (data && data.urls && Array.isArray(data.urls)) {
          uploadedUrls = data.urls;
          alert("🎉 " + uploadedUrls.length + " URLs obtenidas:\n" + uploadedUrls.join("\n"));
        } else {
          alert("⚠️ El servidor no devolvió URLs. Respuesta completa:\n" + JSON.stringify(data));
        }

      } catch (uploadError) {
        alert("❌ Error subiendo imágenes: " + uploadError.message);
        // Continuar sin imágenes
      }
    } else {
      alert("ℹ️ No hay imágenes para subir");
    }

    // ✅ 2. PREPARAR DATOS PARA FIRESTORE
    alert("💾 Preparando datos para Firestore...");
    const dataToSubmit = {
      prenda: formData.prenda,
      detalles: formData.detalles,
      costo: Number(formData.costo),
      precio: Number(formData.precio),
      talla: formData.talla,
      categoria: formData.categoria ? formData.categoria.value : "",
      proveedor: formData.proveedor ? formData.proveedor.label : "",
      fotos: uploadedUrls,
      fecha: fecha || new Date().toISOString().split('T')[0],
      fechaCreacion: new Date()
    };

    alert("📦 Datos a guardar:\n" + JSON.stringify({
      prenda: dataToSubmit.prenda,
      costo: dataToSubmit.costo,
      fotos_count: dataToSubmit.fotos.length
    }, null, 2));

    // ✅ 3. GUARDAR EN FIRESTORE
    alert("🔥 Guardando en Firestore...");
    const docRef = await addDoc(collection(db, "disponible"), dataToSubmit);
    alert("✅ ¡Éxito! Documento guardado con ID: " + docRef.id);

    // ✅ 4. RESETEAR FORMULARIO
    setFormData({ prenda: "", detalles: "", costo: "", precio: "", talla: [], categoria: null, proveedor: null });
    setFotos([]);
    setPreviewUrls([]);
    setFecha("");

    alert("🎉 ¡Prenda agregada completamente!");

  } catch (error) {
    alert("💥 Error crítico: " + error.message);
  } finally {
    setLoading(false);
  }
};

  // ✅ ELIMINAR IMAGEN DE LA PREVISUALIZACIÓN
  const removeImage = (index) => {
    const newFotos = [...fotos];
    const newPreviewUrls = [...previewUrls];
    URL.revokeObjectURL(newPreviewUrls[index]);
    newFotos.splice(index, 1);
    newPreviewUrls.splice(index, 1);
    setFotos(newFotos);
    setPreviewUrls(newPreviewUrls);
  };

  // Agrega esta función para probar la conexión
const testBackendConnection = async () => {
  try {
    alert("🔌 Probando conexión con el backend...");
    const response = await fetch(BACKEND_URL + "/api/health", {
      method: "GET",
      mode: "cors"
    });

    const text = await response.text();
    alert("📡 Respuesta de /health:\nStatus: " + response.status + "\n" + text);

  } catch (error) {
    alert("❌ Error de conexión: " + error.message);
  }
};


  return (
    <div className="bg-pink-100 min-h-screen">
      <header className="relative">
        <Header menuAbierto={menuAbierto} manejadorMenu={manejadorMenu} />
        <h1 className="fixed inset-x-0 transform pt-2 text-center pointer-events-none text-xl font-bold text-white z-50">
          Añadir prenda disponible
        </h1>
      </header>

      <div>
        <MenuLateral menuAbierto={menuAbierto} />
      </div>

      <div>
        <MenuAñadir menuAñadir={menuAñadir} />
      </div>

      {/* PREVISUALIZACIÓN DE IMÁGENES */}
      <div className="flex flex-wrap gap-2 mt-2 p-4">
        {previewUrls.map((url, i) => (
          <div key={i} className="relative">
            <img
              src={url}
              alt={`preview-${i}`}
              className="w-24 h-24 object-cover rounded-md shadow"
            />
            <button
              type="button"
              onClick={() => removeImage(i)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="flex flex-center justify-center pt-10 pb-20">
        <form
          onSubmit={handleSubmit}
          className="lg:border-2 lg:shadow-xl px-5 lg:py-2 pb-20 rounded-lg border-pink-200 mt-10 max-w-lg w-full"
        >
          <div className="flex flex-col justify-center">
            <input
              type="file"
              id="file"
              multiple
              onChange={handleFileChange}
              className="absolute opacity-0 w-0 h-0"
              accept="image/*"
            />
            <label
              htmlFor="file"
              className="mt-2 inline-block py-2 px-4 bg-pink-400 text-center text-white rounded-md cursor-pointer hover:bg-pink-200"
            >
              📸 Elegir imágenes
            </label>
            {fotos.length > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                {fotos.length} imagen(es) seleccionada(s)
              </p>
            )}
          </div>

          <div className="flex flex-col pt-2">
            <label className="px-2 text-pink-800 font-bold" htmlFor="datePicker">
              Fecha
            </label>
            <input
              className="w-full px-2 h-8 bg-white rounded-md shadow-sm"
              type="date"
              id="datePicker"
              value={fecha}
              onChange={handleDate} /* ✅ CORREGIDO */
              required
            />
          </div>

          <div className="flex flex-col pt-4">
            <label className="px-2 text-pink-800 font-bold">Prenda:</label>
            <input
              type="text"
              name="prenda"
              placeholder="Escribe qué prenda es"
              value={formData.prenda}
              onChange={handleChange}
              required
              className="px-2 rounded-md h-8 shadow-sm"
            />
          </div>

          <div className="flex flex-col pt-2">
            <label className="px-2 text-pink-800 font-bold">Costo:</label>
            <input
              type="number"
              name="costo"
              placeholder="Costo del proveedor"
              value={formData.costo}
              onChange={handleChange}
              required
              className="px-2 rounded-md h-8 shadow-sm"
            />
          </div>

          <div className="flex flex-col pt-2">
            <label className="px-2 text-pink-800 font-bold">Precio:</label>
            <input
              type="number"
              name="precio"
              placeholder="Precio público"
              value={formData.precio}
              onChange={handleChange}
              required
              className="px-2 rounded-md h-8 shadow-sm"
            />
          </div>

          <div className="flex flex-col pt-2">
            <label className="px-2 text-pink-800 font-bold">Talla:</label>
            <Select
              options={tallaOptions}
              value={formData.talla.map((talla) => ({ value: talla, label: talla }))}
              onChange={handleTallaChange}
              isMulti
              placeholder="Seleccionar tallas"
            />
          </div>

          <div className="flex flex-col pt-2">
            <label className="px-2 text-pink-800 font-bold">Categoría:</label>
            <Select
              options={categoriaOptions}
              value={formData.categoria}
              onChange={handleCategoriaChange}
              isClearable
              placeholder="Seleccionar categoría"
            />
          </div>

          <div className="flex flex-col pt-2">
            <label className="px-2 text-pink-800 font-bold">Proveedor:</label>
            <Select
              options={proveedoresOptions}
              value={formData.proveedor}
              onChange={handleProveedorChange}
              isClearable
              placeholder="Seleccionar proveedor"
            />
          </div>

          <div className="flex flex-col pt-2">
            <label className="px-2 text-pink-800 font-bold">Detalles:</label>
            <input
              type="text"
              name="detalles"
              placeholder="Detalles de la prenda"
              value={formData.detalles}
              onChange={handleChange}
              className="px-2 rounded-md h-8 shadow-sm"
            />
          </div>
          {/* Agrega este botón en tu JSX */}
<div className="flex justify-center space-x-4 mt-4">
  <button
    type="button"
    onClick={testBackendConnection}
    className="py-2 px-4 bg-blue-500 text-white rounded-md"
  >
    🔧 Probar Conexión
  </button>
</div>

          <div className="flex justify-center pt-2">
            <button
              type="submit"
              className="mt-2 py-2 px-4 bg-pink-400 text-white rounded-md cursor-pointer hover:bg-pink-200 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "⏳ Subiendo..." : "✅ Agregar Prenda"}
            </button>
          </div>
        </form>
      </div>

      <Footer manejadorMenuAñadir={manejadorMenuAñadir} />
    </div>
  );
}

export default FormAñadirDisponible;