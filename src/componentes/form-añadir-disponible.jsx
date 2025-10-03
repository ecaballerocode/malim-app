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
    oferta: null, // ← Nuevo campo
  });

  const [fotos, setFotos] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [menuAbierto, setmenuAbierto] = useState(false);
  const [menuAñadir, setmenuAñadir] = useState(false);
  const [proveedores, setProveedores] = useState([]);
  const [fecha, setFecha] = useState("");
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

  const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || "https://malim-backend.vercel.app").trim();

  const manejadorMenu = () => {
    setmenuAbierto(!menuAbierto);
  };

  const manejadorMenuAñadir = () => {
    setmenuAñadir(!menuAñadir);
  };

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
    "(Inf 2-4)", "(Inf 4-6)", "(Inf 8-10)", "(Inf 10-12)", "(Inf 6-8)", "(Inf 10-12)", "(juv 14-16)", "(XS 3-5)", "(28-30)", "(30-32)", "(30-34)",
    "(32-36)", "(32-34)", "(34-36)", "(36-38)", "(38-40)", "(40-42)", "Unitalla", "(5)", "(7)", "(9)",
    "(11)", "(13)", "(15)", "(17)", "(4)", "(6)", "(8)", "(10)", "(12)", "(14)", "(16)", "(28)", "(30)",
    "(32)", "(34)", "(36)", "(38)", "(40)", "(42)"
  ];

  // ✅ Generar opciones de oferta: 5%, 10%, ..., 100%
  const ofertaOptions = [
    { value: null, label: "Sin oferta" },
    ...Array.from({ length: 20 }, (_, i) => {
      const percent = (i + 1) * 5;
      return { value: percent, label: `${percent}%` };
    })
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

  const handleFileChange = (e) => {
    const files = [...e.target.files];
    if (!files.length) return;

    setFotos(prev => [...prev, ...files]);
    const newPreviewUrls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
  };

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

  const handleOfertaChange = (selectedOption) => {
    setFormData({ ...formData, oferta: selectedOption });
  };

  // ✅ FUNCIÓN PARA SUBIR UN LOTE DE IMÁGENES (MÁXIMO 2 POR LOTE)
  const uploadImageBatch = async (filesBatch, batchNumber) => {
    try {
      const uploadFormData = new FormData();

      filesBatch.forEach((file, index) => {
        const fileName = `malim-${Date.now()}-${batchNumber}-${index}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        uploadFormData.append("files", file, fileName);
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(BACKEND_URL + "/api/upload", {
        method: "POST",
        body: uploadFormData,
        mode: 'cors',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error en lote ${batchNumber + 1}: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      if (data && data.urls && Array.isArray(data.urls)) {
        return data.urls;
      } else {
        throw new Error(`Formato de respuesta inválido en lote ${batchNumber + 1}`);
      }

    } catch (error) {
      console.error(`Error en lote ${batchNumber + 1}:`, error);
      throw error;
    }
  };

  // ✅ FUNCIÓN PRINCIPAL QUE MANEJA LOTES DE MÁXIMO 2 IMÁGENES
  const uploadAllImages = async (files) => {
    if (files.length === 0) return [];

    // Dividir en lotes de máximo 2 imágenes
    const batchSize = 2;
    const batches = [];

    for (let i = 0; i < files.length; i += batchSize) {
      batches.push(files.slice(i, i + batchSize));
    }

    const allUrls = [];
    setUploadProgress({ current: 0, total: batches.length });

    for (let i = 0; i < batches.length; i++) {
      try {
        const batchUrls = await uploadImageBatch(batches[i], i);
        allUrls.push(...batchUrls);

        setUploadProgress({ current: i + 1, total: batches.length });

        // Pequeña pausa entre lotes para no saturar el backend
        if (i < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 800));
        }

      } catch (error) {
        throw new Error(`Fallo en lote ${i + 1}/${batches.length}: ${error.message}`);
      }
    }

    return allUrls;
  };

  // ✅ HANDLE SUBMIT CON MANEJO ROBUSTO DE ERRORES
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (fotos.length > 12) {
      alert("⚠️ Máximo 12 imágenes permitidas por producto");
      return;
    }

    const totalSize = fotos.reduce((total, file) => total + file.size, 0);
    if (totalSize > 20 * 1024 * 1024) {
      alert("⚠️ El tamaño total de las imágenes no debe exceder 20MB");
      return;
    }

    setLoading(true);
    setUploadProgress({ current: 0, total: 0 });

    try {
      let uploadedUrls = [];

      if (fotos.length > 0) {
        try {
          uploadedUrls = await uploadAllImages(fotos);
          console.log(`${uploadedUrls.length} imágenes subidas exitosamente`);
        } catch (uploadError) {
          alert("❌ Error subiendo imágenes: " + uploadError.message);
          setLoading(false);
          setUploadProgress({ current: 0, total: 0 });
          return;
        }
      }

      const dataToSubmit = {
        prenda: formData.prenda,
        detalles: formData.detalles,
        costo: Number(formData.costo),
        precio: Number(formData.precio),
        talla: formData.talla,
        categoria: formData.categoria ? formData.categoria.value : "",
        proveedor: formData.proveedor ? formData.proveedor.label : "",
        oferta: formData.oferta?.value || 0, // ✅ guardar número
        fotos: uploadedUrls,
        fecha: fecha || new Date().toISOString().split("T")[0],
        fechaCreacion: new Date(),
      };

      await addDoc(collection(db, "disponible"), dataToSubmit);

      setFormData({
        prenda: "",
        detalles: "",
        costo: "",
        precio: "",
        talla: [],
        categoria: null,
        proveedor: null,
        oferta: null, // ← Reiniciar
      });
      setFotos([]);
      setPreviewUrls([]);
      setFecha("");
      setUploadProgress({ current: 0, total: 0 });

      alert(`🎉 ¡Prenda agregada con ${uploadedUrls.length} imágenes!`);

    } catch (error) {
      console.error("Error crítico:", error);
      alert("💥 Error al guardar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const removeImage = (index) => {
    const newFotos = [...fotos];
    const newPreviewUrls = [...previewUrls];
    URL.revokeObjectURL(newPreviewUrls[index]);
    newFotos.splice(index, 1);
    newPreviewUrls.splice(index, 1);
    setFotos(newFotos);
    setPreviewUrls(newPreviewUrls);
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

      {/* INDICADOR DE PROGRESO DE SUBIDA */}
      {uploadProgress.total > 0 && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-white p-4 rounded-lg shadow-lg z-50">
          <p className="text-sm font-medium mb-2">
            Subiendo imágenes... {uploadProgress.current}/{uploadProgress.total} lotes
          </p>
          <div className="w-64 bg-gray-200 rounded-full h-2">
            <div
              className="bg-pink-500 h-2 rounded-full transition-all"
              style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

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
              onChange={handleDate}
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

          {/* ✅ NUEVO CAMPO: OFERTA */}
          <div className="flex flex-col pt-2">
            <label className="px-2 text-pink-800 font-bold">Oferta:</label>
            <Select
              options={ofertaOptions}
              value={formData.oferta}
              onChange={handleOfertaChange}
              isClearable={false} // No permitir borrar, siempre debe haber una opción
              placeholder="Seleccionar descuento"
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
            <label className="px-2 text-pink-800 font-bold">Detalles y colores:</label>
            <textarea
              name="detalles"
              placeholder="Detalles de la prenda (ej. color, material, etc.)"
              value={formData.detalles}
              onChange={handleChange}
              rows={4} // ✅ más alto
              className="px-2 py-1 rounded-md shadow-sm resize-y"
            />
          </div>


          <div className="flex justify-center pt-2">
            <button
              type="submit"
              className="mt-2 py-2 px-4 bg-pink-400 text-white rounded-md cursor-pointer hover:bg-pink-200 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? `⏳ Subiendo... (${uploadProgress.current}/${uploadProgress.total})` : "✅ Agregar Prenda"}
            </button>
          </div>
        </form>
      </div>

      <Footer manejadorMenuAñadir={manejadorMenuAñadir} />
    </div>
  );
}

export default FormAñadirDisponible;