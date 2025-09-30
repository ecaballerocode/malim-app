import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Select from "react-select";
import { doc, getDoc, updateDoc, getDocs, collection, deleteDoc } from "firebase/firestore";
import { db } from "../credenciales";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Header from "./header";
import MenuLateral from "./menu-lateral";
import Footer from "./footer";
import MenuAñadir from "./menu-añadir";

function DetallePrenda() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    prenda: "",
    detalles: "",
    costo: "",
    precio: "",
    talla: [],
    categoria: null,
    proveedor: null,
    fotos: [],
  });
  const [loading, setLoading] = useState(false);
  const [proveedores, setProveedores] = useState([]);
  const [menuAbierto, setmenuAbierto] = useState(false);
  const [menuAñadir, setmenuAñadir] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

  // 🔥 CORRECCIÓN: Eliminamos los espacios al final de la URL
  const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || "https://malim-backend.vercel.app").trim();


  const manejadorMenu = () => {
    setmenuAbierto(!menuAbierto);
  };

  const manejadorMenuAñadir = () => {
    setmenuAñadir(!menuAñadir);
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

  const manejarClickVender = (id) => {
    navigate(`/FormVender/${id}`);
  };

  const proveedoresOptions = proveedores.map((prov) => ({
    value: prov.id,
    label: prov.proveedor,
  }));

  useEffect(() => {
    const fetchPrenda = async () => {
      try {
        const prendaRef = doc(db, "disponible", id);
        const prendaDoc = await getDoc(prendaRef);

        if (prendaDoc.exists()) {
          const data = prendaDoc.data();
          setFormData({
            prenda: data.prenda,
            detalles: data.detalles,
            costo: data.costo,
            precio: data.precio,
            talla: data.talla,
            categoria: { value: data.categoria, label: data.categoria },
            proveedor: { value: data.proveedor, label: data.proveedor },
            fotos: data.fotos || [],
          });
        }
      } catch (error) {
        console.error("Error al obtener la prenda:", error);
      }
    };

    const fetchProveedores = async () => {
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

    fetchPrenda();
    fetchProveedores();
  }, [id]);

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

  const uploadAllImages = async (files) => {
    if (files.length === 0) return [];

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

        if (i < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 800));
        }
      } catch (error) {
        throw new Error(`Fallo en lote ${i + 1}/${batches.length}: ${error.message}`);
      }
    }

    return allUrls;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const prendaRef = doc(db, "disponible", id);
    try {
      await updateDoc(prendaRef, {
        ...formData,
        categoria: formData.categoria.value,
        proveedor: formData.proveedor.value,
      });
      alert("Prenda actualizada con éxito");
    } catch (error) {
      console.error("Error al actualizar la prenda:", error);
      alert("Hubo un error al actualizar la prenda");
    } finally {
      setLoading(false);
    }
  };

  const CLOUDINARY_UPLOAD_PRESET = "malimapp";

  // 🔥 FUNCIÓN CORREGIDA PARA ELIMINAR DE R2
  // 👉 helper para extraer el key desde la URL de R2
  function extractR2KeyFromUrl(urlString) {
    try {
      const u = new URL(urlString);
      let key = u.pathname.startsWith("/") ? u.pathname.slice(1) : u.pathname;
      key = decodeURIComponent(key);

      // Si por alguna razón la URL incluye el bucket en el path, elimínalo:
      const bucket = "malim-bucket"; // pon aquí el nombre exacto de tu bucket
      if (key.startsWith(bucket + "/")) {
        key = key.slice(bucket.length + 1);
      }

      console.log("[extractR2KeyFromUrl] url:", urlString, "-> key:", key);
      return key;
    } catch (err) {
      console.error("[extractR2KeyFromUrl] error:", err, urlString);
      return null;
    }
  }


  // 👉 función principal para eliminar la imagen

  async function deleteImageFromStorage(key) {
    try {
      alert("Key calculada: " + key);

      const url = `${BACKEND_URL}/api/deleteImage?key=${encodeURIComponent(key)}`;
      alert("Enviando DELETE a: " + url);

      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      alert("Request enviada. Status: " + response.status);

      const data = await response.json();
      alert("Respuesta recibida:\n" + JSON.stringify(data));

      if (!response.ok) {
        throw new Error(data.error || "Error desconocido en deleteImage");
      }

      return data;
    } catch (err) {
      alert("Error en deleteImageFromStorage: " + err.message);
      throw err;
    }
  }








  const handleDelete = async () => {
    const confirmDelete = window.confirm("¿Estás seguro de que deseas eliminar esta prenda?");
    if (!confirmDelete) return;

    try {
      setLoading(true);
      console.log("Iniciando eliminación de prenda:", id);


      const deletePromises = formData.fotos.map(fotoUrl => {
        const key = extractR2KeyFromUrl(fotoUrl);
        return deleteImageFromStorage(key)
          .catch(error => {
            console.warn(`Error eliminando imagen ${fotoUrl}:`, error.message);
            return true;
          });
      });


      await Promise.all(deletePromises);
      await deleteDoc(doc(db, "disponible", id));

      alert("✅ Prenda eliminada con éxito");
      navigate("/Disponible");

    } catch (error) {
      console.error("Error general al eliminar la prenda:", error);
      alert("❌ Error al eliminar la prenda: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteImage = async (fotoUrl) => {
    const confirm = window.confirm("¿Seguro que quieres eliminar esta imagen?");
    if (!confirm) return;

    try {
      setLoading(true);
      const key = extractR2KeyFromUrl(fotoUrl);
      await deleteImageFromStorage(key);


      const nuevasFotos = formData.fotos.filter((foto) => foto !== fotoUrl);
      setFormData({ ...formData, fotos: nuevasFotos });

      const prendaRef = doc(db, "disponible", id);
      await updateDoc(prendaRef, { fotos: nuevasFotos });

      alert("✅ Imagen eliminada con éxito");

    } catch (error) {
      console.error("Error al eliminar imagen individual:", error);
      alert("❌ Error al eliminar la imagen: " + error.message);
    } finally {
      setLoading(false);
    }
  };

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

  const enviarWhatsapp = (id) => {
    const message = encodeURIComponent("Conoce nuestras prendas aqui: ");
    const urlId = encodeURIComponent(`https://malim-shop.vercel.app/DetallePrenda/${id}`);
    const url = `https://wa.me/?text=${message}${urlId}`;
    window.open(url, "_blank");
  };

  const handleFileChange = async (e) => {
    const files = [...e.target.files];
    if (!files.length) return;

    if (files.length > 10) {
      alert("⚠️ Máximo 10 imágenes por vez");
      return;
    }

    const totalSize = files.reduce((total, file) => total + file.size, 0);
    if (totalSize > 15 * 1024 * 1024) {
      alert("⚠️ El tamaño total de las imágenes no debe exceder 15MB");
      return;
    }

    try {
      setLoading(true);
      const uploadedUrls = await uploadAllImages(files);
      const nuevasFotos = [...formData.fotos, ...uploadedUrls];
      setFormData({ ...formData, fotos: nuevasFotos });

      const prendaRef = doc(db, "disponible", id);
      await updateDoc(prendaRef, { fotos: nuevasFotos });

      alert(`✅ ${uploadedUrls.length} imágenes añadidas con éxito`);

    } catch (error) {
      alert("❌ Error al subir imágenes: " + error.message);
      console.error(error);
    } finally {
      setLoading(false);
      setUploadProgress({ current: 0, total: 0 });
    }
  };

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
  };

  const categoriaOptions = categorias.map((cat) => ({ value: cat, label: cat }));
  const tallaOptions = tallas.map((talla) => ({ value: talla, label: talla }));

  // 🔥 BOTÓN DE PRUEBA TEMPORAL - BORRA ESTO DESPUÉS
  async function testDeleteDebug() {
    try {
      const fotos = formData.fotos || [];
      if (!fotos.length) { alert("No hay fotos"); return; }
      const url = fotos[0]; // probamos con la primera
      alert("URL a probar: " + url);

      // helper para extraer key: (usa el mismo getR2KeyFromUrl)
      function getR2KeyFromUrl(u) {
        try { const x = new URL(u); return x.pathname.startsWith("/") ? x.pathname.slice(1) : x.pathname; }
        catch (e) { return u.split("/").pop(); }
      }
      const key = getR2KeyFromUrl(url);
      alert("Key calculada (frontend): " + key);

      // Llamada DEBUG: añadimos key también en query para saltar problemas de body en DELETE
      const debugUrl = `${BACKEND_URL}/api/deleteImage?debug=1&key=${encodeURIComponent(key)}`;

      alert("Enviando DELETE a: " + debugUrl);

      const response = await fetch(debugUrl, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "X-Debug": "1"
        },
        body: JSON.stringify({ key }) // lo mandamos igual (por si el server lo lee)
      });

      alert("Request enviada. Status: " + response.status);
      const text = await response.text();
      alert("Respuesta recibida: " + text);
    } catch (err) {
      alert("Error en testDeleteDebug: " + err.message);
    }
  }


  return (
    <div className="bg-pink-100 min-h-screen">
      <header className="relative">
        <Header menuAbierto={menuAbierto} manejadorMenu={manejadorMenu} />
        <h1 className="fixed inset-x-0 transform pt-2 text-center pointer-events-none text-xl font-bold text-white z-50">
          Detalles prenda disponible
        </h1>
      </header>

      <div>
        <MenuLateral menuAbierto={menuAbierto} />
      </div>

      <div>
        <MenuAñadir menuAñadir={menuAñadir} />
      </div>

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

      {formData.fotos.length > 1 ? (
        <Slider {...settings} className="w-64 pt-12 mb-5 mx-auto">
          {formData.fotos.map((foto, index) => (
            <div key={index} className="relative">
              <img
                src={foto}
                alt={`Prenda ${index}`}
                className="w-auto h-64 rounded-lg"
              />
              <button
                type="button"
                onClick={() => handleDeleteImage(foto)}
                className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-md text-sm"
              >
                X
              </button>
            </div>
          ))}
        </Slider>
      ) : formData.fotos.length === 1 ? (
        <div className="w-64 pt-12 mb-5 mx-auto">
          <img
            src={formData.fotos[0]}
            alt="Prenda"
            className="w-auto h-64 rounded-lg"
          />
        </div>
      ) : null}



      <main className="pb-20 flex flex-center justify-center">
        {/* 🔥 BOTÓN DE PRUEBA TEMPORAL - BORRA ESTO DESPUÉS */}
        <button
          type="button"
          onClick={testDeleteDebug}
          className="mt-4 py-2 px-4 bg-yellow-500 text-white rounded-md"
        >
          🧪 Probar eliminar de R2
        </button>










        <form onSubmit={handleSubmit} className="lg:border-2 lg:shadow-xl px-5 lg:py-2 pb-20 mt-2 rounded-lg border-pink-200 max-w-lg w-full">
          <div className="flex flex-col justify-center my-3">
            <input
              type="file"
              id="newFiles"
              multiple
              onChange={handleFileChange}
              className="absolute opacity-0 w-0 h-0"
            />
            <label
              htmlFor="newFiles"
              className="mt-2 py-2 px-4 bg-pink-700 text-center text-white rounded-md cursor-pointer hover:bg-pink-200"
            >
              {loading ? "Subiendo..." : "Añadir imágenes"}
            </label>
          </div>

          <div className="flex flex-col pt-2">
            <label className="px-2 text-pink-800 font-bold">Prenda:</label>
            <input
              type="text"
              name="prenda"
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

          <div className="flex flex-col justify-around">
            <button
              type="submit"
              className="mt-2 py-2 px-4 bg-pink-400 text-white rounded-md cursor-pointer hover:bg-pink-200"
              disabled={loading}
            >
              {loading ? "Actualizando..." : "Actualizar Prenda"}
            </button>
            <button onClick={() => manejarClickVender(id)} className="mt-2 py-2 px-4 bg-pink-700 text-white rounded-md cursor-pointer hover:bg-pink-200"
              type="button">
              Vender
            </button>
            <button className="mt-2 py-2 px-4 bg-red-600 text-white rounded-md cursor-pointer hover:bg-pink-200"
              type="button" onClick={handleDelete}>
              Eliminar prenda
            </button>
            <button className="mt-2 py-2 px-4 bg-green-600 text-white rounded-md cursor-pointer hover:bg-pink-200"
              type="button" onClick={() => enviarWhatsapp(id)}>
              Compartir
            </button>
          </div>
        </form>
      </main>

      <Footer manejadorMenuAñadir={manejadorMenuAñadir} />
    </div>
  );
}

export default DetallePrenda;