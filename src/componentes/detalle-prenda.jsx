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


  // Incluimos 'oferta' en el estado
  const [formData, setFormData] = useState({
    prenda: "",
    detalles: "",
    costo: "",
    precio: "",
    talla: [],
    categoria: null,
    proveedor: null,
    oferta: null, // ← Nuevo campo
    descripcion: "",
    fotos: [],
  });


  const [loading, setLoading] = useState(false);
  const [proveedores, setProveedores] = useState([]);
  const [menuAbierto, setmenuAbierto] = useState(false);
  const [menuAñadir, setmenuAñadir] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });


  const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || "https://malim-backend.vercel.app").trim();
  const OPENROUTER_KEY = import.meta.env.VITE_OPENROUTER_KEY;
  const SPA_DOMAIN = import.meta.env.VITE_SPA_DOMAIN || 'https://malim-shop.vercel.app'; // URL de tu SPA (Frontend)
  const VERCEL_BACKEND_URL = BACKEND_URL; // URL de tu Backend (Vercel)


  const manejadorMenu = () => {
    setmenuAbierto(!menuAbierto)
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


  // ✅ Opciones de oferta: 5%, 10%, ..., 100% + "Sin oferta"
  const ofertaOptions = [
    { value: null, label: "Sin oferta" },
    ...Array.from({ length: 20 }, (_, i) => {
      const percent = (i + 1) * 5;
      return { value: percent, label: `${percent}%` };
    })
  ];


  const manejarClickVender = (id) => {
    navigate(`/FormVender/${id}`);
  };


  const proveedoresOptions = proveedores.map((prov) => ({
    value: prov.id,
    label: prov.proveedor,
  }));


  useEffect(() => {
    if (!id) {
      console.error("ID no proporcionado en la URL");
      navigate("/Disponible");
      return;
    }


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
            categoria: data.categoria
              ? { value: data.categoria, label: data.categoria }
              : null,
            proveedor: data.proveedor
              ? { value: data.proveedor, label: data.proveedor }
              : null,
            oferta: (typeof data.oferta === 'number' && data.oferta > 0 && data.oferta <= 100)
              ? { value: data.oferta, label: `${data.oferta}%` }
              : null,
            fotos: data.fotos || [],
            descripcion: data.descripcion || "",
          });
        } else {
          console.warn("Prenda no encontrada:", id);
          navigate("/Disponible");
        }
      } catch (error) {
        console.error("Error al obtener la prenda:", error);
        navigate("/Disponible");
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
  }, [id, navigate]);


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
        categoria: formData.categoria?.value || "",
        proveedor: formData.proveedor?.value || "",
        oferta: formData.oferta?.value || 0, // ← Guardar 0 si no hay oferta
      });
      alert("Prenda actualizada con éxito");
    } catch (error) {
      console.error("Error al actualizar la prenda:", error);
      alert("Hubo un error al actualizar la prenda");
    } finally {
      setLoading(false);
    }
  };


  async function deleteImageFromStorage(fotoUrl) {
    try {
      const url = `${BACKEND_URL}/api/deleteImage?url=${encodeURIComponent(fotoUrl)}`;
      const response = await fetch(url, { method: "DELETE" });
      const data = await response.json();


      if (!response.ok) {
        throw new Error(data.error || "Error desconocido en deleteImage");
      }
      return data;
    } catch (err) {
      alert("❌ Error en deleteImageFromStorage: " + err.message);
      throw err;
    }
  }


  const handleDelete = async () => {
    const confirmDelete = window.confirm("¿Estás seguro de que deseas eliminar esta prenda?");
    if (!confirmDelete) return;


    try {
      setLoading(true);
      const deletePromises = formData.fotos.map(fotoUrl =>
        deleteImageFromStorage(fotoUrl).catch(error => {
          console.warn(`Error eliminando imagen ${fotoUrl}:`, error.message);
          return true;
        })
      );


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
      await deleteImageFromStorage(fotoUrl);


      const nuevasFotos = formData.fotos.filter(foto => foto !== fotoUrl);
      setFormData({ ...formData, fotos: nuevasFotos });
      await updateDoc(doc(db, "disponible", id), { fotos: nuevasFotos });
      alert("✅ Imagen eliminada con éxito");
    } catch (error) {
      console.error("Error al eliminar imagen:", error);
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


  const handleOfertaChange = (selectedOption) => {
    setFormData({ ...formData, oferta: selectedOption });
  };

  // 🚀 FUNCIÓN PARA GENERAR DESCRIPCIÓN CON IA
  const handleGenerarDescripcion = async () => {
    const SPA_DOMAIN_FOR_REFERER = SPA_DOMAIN; // Usamos la constante definida arriba
    if (!OPENROUTER_KEY) {
      alert("Error: La clave de OpenRouter no está configurada en las variables de entorno.");
      return;
    }

    setLoading(true);

    // 1. Preparar la información de la prenda
    const nombrePrenda = formData.prenda || 'una hermosa prenda';
    const detallesPrenda = formData.detalles || 'sin detalles adicionales';
    const precio = formData.precio || 'precio no especificado';
    const tallas = formData.talla.length > 0 ? formData.talla.join(', ') : 'Unitalla o no especificado';
    
    // 2. Construir el prompt para Qwen
    const prompt = `
        **ROL:** Eres un Copywriter experto en moda femenina con un tono amigable, confiable y cercano.
        
        **TAREA:** Genera una descripción atractiva y muy persuasiva para un post de Facebook sobre la prenda a continuación.

        **AUDIENCIA:** Mujeres de 25 a 55 años.

        **RESTRICCIONES:**
        1. **Longitud:** La descripción completa debe ser de **4 a 6 líneas/párrafos muy cortos máximo**. Sé muy conciso.
        2. **Contenido:** Debes resaltar la **comodidad, versatilidad** (ej. "ideal para el trabajo y un café con amigas"), **estilo, calidad y accesibilidad** de la prenda.
        3. **Formato:** Utiliza emojis y un lenguaje cálido. **NO uses negritas ni viñetas.**

        **DATOS DE LA PRENDA:**
        - Nombre: ${nombrePrenda}
        - Detalles Adicionales: ${detallesPrenda}
        - Tallas Disponibles: ${tallas}
        - PRECIO A MENCIONAR: $${precio} pesos.

        **CIERRE OBLIGATORIO (Call to Action):**
        Incluye esta frase exacta al final del post, después del cuerpo del texto:
        ✨ “Encuentra esta y más opciones en nuestro catálogo, lo encuentras en el primer comentario.”
    `;

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_KEY}`,
          "HTTP-Referer": SPA_DOMAIN_FOR_REFERER,
          "X-Title": "Malim E-Commerce Admin",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": "qwen/qwen3-235b-a22b:free",
          "messages": [
            {
              "role": "user",
              "content": prompt
            }
          ],
          "temperature": 0.8, // Para un resultado más creativo
          "max_tokens": 500 // Suficiente para un post de Facebook
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error ${response.status}: ${errorData.error.message || response.statusText}`);
      }

      const data = await response.json();
      const descripcionGenerada = data.choices[0]?.message?.content?.trim() || "No se pudo generar la descripción.";

      // Actualizar el estado con la descripción generada
      setFormData(prevData => ({
        ...prevData,
        descripcion: descripcionGenerada,
      }));

      alert("✅ Descripción generada con éxito.");

    } catch (error) {
      console.error("Error al generar la descripción:", error);
      alert(`❌ Error al generar la descripción: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };


// ... (asegúrate de que SPA_DOMAIN y VERCEL_BACKEND_URL estén definidos correctamente)

// -------------------------------------------------------------
// FUNCIÓN PRINCIPAL: Genera la URL de Preview con etiquetas OG
// -------------------------------------------------------------

/**
 * Función auxiliar para generar la URL del servicio de Preview.
 * @param {string} id - El ID de la prenda.
 * @param {boolean} useCollage - Si es true, usa el endpoint de collage.
 * @param {string} previewEndpoint - El nombre del endpoint a usar (whatsapp o facebook).
 * @returns {string} La URL final del servicio de previsualización.
 */
const generarPreviewUrlFinal = (id, useCollage = false, previewEndpoint = 'whatsapp') => {
    // 1. Datos para la preview
    const name = formData.prenda || "Prenda sin nombre";
    const tallasStr = formData.talla.length > 0 ? formData.talla.join(', ') : 'Unitalla o no especificada'; 
    const allPhotoUrls = formData.fotos || []; 
    const FALLBACK_IMAGE_URL = `${SPA_DOMAIN}/placeholder.jpg`;

    // 2. URL canónica
    const productUrlSPA = `${SPA_DOMAIN}/DetallePrenda/${id}`;
    
    // 3. ✅ CLAVE: LÓGICA DE DESCRIPCIÓN DINÁMICA
    let finalDescription;
    let descriptionForQuote; // La descripción para la etiqueta OG (la que aparece en la preview)

    if (previewEndpoint === 'facebook') {
        // Para Facebook: Usamos el texto de la IA ('descripcion') en la etiqueta OG description.
        descriptionForQuote = `Tallas: ${tallasStr}. ${formData.detalles || "Consulta los detalles."}`;
        // Y el mismo texto se usa para el 'quote' de la publicación (ver más abajo)
    } else { // whatsapp
        // Para WhatsApp: Usamos las tallas + detalles en la etiqueta OG description.
        descriptionForQuote = `Tallas: ${tallasStr}. ${formData.detalles || "Consulta los detalles."}`;
    }
    
    // 4. Lógica de Imagen (se mantiene igual)
    let imageUrl;
    if (useCollage && allPhotoUrls.length >= 3) {
        const collageParams = new URLSearchParams();
        allPhotoUrls.slice(0, 3).forEach(url => {
            collageParams.append('photo', encodeURIComponent(url)); 
        });
        imageUrl = `${VERCEL_BACKEND_URL}/api/generate-collage?${collageParams.toString()}`;
    } else if (allPhotoUrls.length > 0) {
        imageUrl = allPhotoUrls[0];
    } else {
        imageUrl = FALLBACK_IMAGE_URL;
    }

    // 5. Construir los parámetros de consulta base
    const previewParams = new URLSearchParams();
    previewParams.append('name', name);
    // Usamos la descripción determinada por la lógica anterior
    previewParams.append('desc', descriptionForQuote); 
    previewParams.append('image', imageUrl); 
    previewParams.append('spa_url', productUrlSPA);

    // 6. Generar la URL base del endpoint
    let finalPreviewUrl = `${VERCEL_BACKEND_URL}/api/${previewEndpoint}-preview?${previewParams.toString()}`;
    
    // 7. Si es para Facebook, añadimos self_url y regeneramos la URL.
    if (previewEndpoint === 'facebook') {
        previewParams.append('self_url', finalPreviewUrl);
        // Regeneramos la URL final con el self_url
        finalPreviewUrl = `${VERCEL_BACKEND_URL}/api/facebook-preview?${previewParams.toString()}`;
    }
    
    return finalPreviewUrl;
};

// -------------------------------------------------------------
// FUNCIÓN ESPECÍFICA para WhatsApp (IMAGEN DIRECTA, ENDPOINT WA)
// -------------------------------------------------------------
const enviarWhatsapp = (id) => {
    // Generamos la URL del backend (la que genera la preview)
    const previewUrlBackend = generarPreviewUrlFinal(id, false, 'whatsapp'); 
    
    // Creamos el mensaje usando la URL del backend, pero con texto claro para el usuario.
    const preFilledMessage = 
        `¡Hola hermosa! Nos llegó este ${formData.prenda} y creo que te va a encantar. 
        
Haz clic aquí para ver los detalles: ${previewUrlBackend}`;
    
    // WhatsApp mostrará el texto "Haz clic aquí..." y luego la preview.
    const url = `https://wa.me/?text=${encodeURIComponent(preFilledMessage)}`;

    window.open(url, "_blank");
};

// -------------------------------------------------------------
// FUNCIÓN ESPECÍFICA para Facebook (COLLAGE, ENDPOINT FB)
// -------------------------------------------------------------
const compartirEnFacebook = (id) => {
    // 1. Genera la URL de preview que Facebook rastreará
    const previewUrl = generarPreviewUrlFinal(id, true, 'facebook'); 
    
    // 2. Obtener el texto del textarea. 
    // Usamos el texto largo de la IA, si no, un fallback simple.
    // ⚠️ Importante: Reemplazar saltos de línea por espacios si formData.descripcion permite multilínea.
    const rawDescriptionText = formData.descripcion.trim() || 
                               `¡Mira esta increíble prenda: ${formData.prenda || 'Artículo'}!`;
    
    // 3. Crear la URL base del diálogo de compartir (usando el parámetro 'u' para la preview)
    const baseUrl = 'https://www.facebook.com/sharer/sharer.php';

    // 4. Parámetros principales (solo la URL de preview)
    const fbShareParams = new URLSearchParams();
    fbShareParams.append('u', previewUrl); 

    // 5. Construir la URL final CON el parámetro 'quote' para el texto de la publicación
    // Usamos encodeURIComponent para asegurar que el texto llegue al textarea de Facebook.
    const fbShareUrl = `${baseUrl}?${fbShareParams.toString()}&quote=${encodeURIComponent(rawDescriptionText)}`;

    window.open(fbShareUrl, "_blank", "width=600,height=400");
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


  // Protección temprana si no hay ID
  if (!id) {
    return (
      <div className="min-h-screen bg-pink-100 flex items-center justify-center">
        <p className="text-pink-800 text-lg">ID de prenda no válido</p>
      </div>
    );
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


          {/* ✅ NUEVO CAMPO: OFERTA */}
          <div className="flex flex-col pt-2">
            <label className="px-2 text-pink-800 font-bold">Oferta:</label>
            <Select
              options={ofertaOptions}
              value={formData.oferta}
              onChange={handleOfertaChange}
              isClearable={false}
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
            <label className="px-2 text-pink-800 font-bold">Detalles:</label>
            <textarea
              type="text"
              name="detalles"
              placeholder="Detalles de la prenda"
              value={formData.detalles}
              onChange={handleChange}
              className="px-2 rounded-md shadow-sm"
            ></textarea>
          </div>


          {/* 🚀 INICIO: CAMPO Y BOTÓN DE GENERACIÓN */}
          <div className="flex flex-col pt-2">
            <label className="px-2 text-pink-800 font-bold">Descripción:</label>
            <textarea
              name="descripcion"
              placeholder="Generar o escribir una descripción larga aquí..."
              value={formData.descripcion}
              onChange={handleChange}
              rows="4"
              className="px-2 py-1 rounded-md shadow-sm resize-none"
            ></textarea>
          </div>
          <div className="flex justify-between gap-2">
            <button
              type="button"
              onClick={handleGenerarDescripcion}
              className="mt-2 py-2 px-4 bg-purple-500 text-white rounded-md cursor-pointer hover:bg-purple-700 w-1/2"
              disabled={loading}
            >
              Generar Descripción
            </button>
            <button 
              className="mt-2 py-2 px-4 bg-blue-600 text-white rounded-md cursor-pointer hover:bg-blue-700 w-1/2" 
              type="button" 
              onClick={() => compartirEnFacebook(id)}>
              Compartir en Facebook
            </button>
          </div>


          <div className="flex flex-col justify-around mt-4">
            <button
              type="submit"
              className="mt-2 py-2 px-4 bg-pink-400 text-white rounded-md cursor-pointer hover:bg-pink-500"
              disabled={loading}
            >
              {loading ? "Actualizando..." : "Actualizar Prenda"}
            </button>
            <button onClick={() => manejarClickVender(id)} className="mt-2 py-2 px-4 bg-pink-700 text-white rounded-md cursor-pointer hover:bg-pink-800" type="button">
              Vender
            </button>
            <button className="mt-2 py-2 px-4 bg-red-600 text-white rounded-md cursor-pointer hover:bg-red-700" type="button" onClick={handleDelete}>
              Eliminar prenda
            </button>
            <button 
              className="mt-2 py-2 px-4 bg-green-600 text-white rounded-md cursor-pointer hover:bg-green-700" 
              type="button" 
              onClick={() => enviarWhatsapp(id)}>
              Enviar por whatsapp
            </button>
          </div>
        </form>
      </main>


      <Footer manejadorMenuAñadir={manejadorMenuAñadir} />
    </div>
  );
}


export default DetallePrenda;