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
import axios from "axios"; // 👈 necesitas axios aquí también

function DetallePrenda() {
  const { id } = useParams(); // Obtiene el ID de la prenda desde la URL
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



  const manejadorMenu = () => {
    setmenuAbierto(!menuAbierto);
  };

  const manejadorMenuAñadir = () => {
    setmenuAñadir(!menuAñadir);
  };

  // Categorías y tallas (puedes ajustar estas listas según tu proyecto)
  const categorias = [
    "Abrigos", "Accesorios", "Patria", "Blusas", "Playeras", "Playeras deportivas", "Conjuntos",
    "Conjuntos deportivos", "Chamarras", "Sudaderas", "Maxi sudaderas",
    "Maxi vestidos", "Maxi cobijas", "Ensambles", "Pantalones", "Pants",
    "Shorts", "Infantil niño", "Infantil niña", "Medias", "Leggins",
    "Mallones", "Ropa interior", "Sacos", "Blazers", "Capas", "Palazzos",
    "Camisas", "Gorros", "Calzado", "Chalecos", "Blusones", "Pijamas", "Guantes", "Faldas", "Suéteres",
    "Overoles", "Otros", "Sin Categoria", "Niños uisex", "Gabardinas", "Vestidos"
  ];

  const tallas = [
    "(Inf 2-4)", "(Inf 6-8)", "(Inf 10-12)", "(juv 14-16)", "(XS 3-5)", "(28-30)", "(30-32)", "(30-34)", "(32-36)", "(32-34)",
    "(34-36)", "(36-38)", "(38-40)", "(40-42)", "Unitalla", "(5)", "(7)", "(9)", "(11)", "(13)",
    "(15)", "(17)", "(4)", "(6)", "(8)", "(10)", "(12)", "(14)", "(16)", "(28)", "(30)", "(32)", "(34)", "(36)", "(38)",
    "(40)", "(42)"
  ];

  const manejarClickVender = (id) => {
    navigate(`/FormVender/${id}`);  // Redirige a la página de venta
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

    // Obtener proveedores de la base de datos
    // Similar a lo que ya tienes en tu otro componente
    fetchPrenda();
    fetchProveedores();
  }, [id]);

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

  const obtenerPublicId = (url) => {
    // Extrae el public_id de la URL
    const parts = url.split("/");
    const publicIdWithExtension = parts[parts.length - 1]; // Obtiene el último segmento (incluye extensión)
    const publicId = publicIdWithExtension.split(".")[0]; // Elimina la extensión (.jpg, .png, etc.)
    return `${parts[parts.length - 2]}/${publicId}`; // Incluye el prefijo de la carpeta (si lo hay)
  };

  const CLOUDINARY_UPLOAD_PRESET = "malimapp";

  //funcion para eliminar la prenda
  // Función para eliminar la prenda completa
const handleDelete = async () => {
  const confirmDelete = window.confirm("¿Estás seguro de que deseas eliminar esta prenda?");
  if (!confirmDelete) return;

  try {
    setLoading(true);
    console.log("Iniciando eliminación de prenda:", id);

    // Eliminar imágenes según su origen
    const deletePromises = formData.fotos.map(async (fotoUrl) => {
      try {
        if (fotoUrl.includes("res.cloudinary.com")) {
          // ---- CLOUDINARY ----
          console.log("Eliminando de Cloudinary:", fotoUrl);
          
          // Extraer public_id correctamente
          const urlParts = fotoUrl.split('/');
          const uploadIndex = urlParts.indexOf('upload');
          let publicId = '';
          
          if (uploadIndex !== -1 && urlParts.length > uploadIndex + 2) {
            // Tomar todo después de la versión (v1234567/)
            const versionPart = urlParts[uploadIndex + 1];
            if (versionPart.startsWith('v')) {
              publicId = urlParts.slice(uploadIndex + 2).join('/');
            } else {
              publicId = urlParts.slice(uploadIndex + 1).join('/');
            }
            // Remover extensión del archivo
            publicId = publicId.replace(/\.[^/.]+$/, "");
          }

          if (!publicId) {
            console.warn("No se pudo extraer public_id de:", fotoUrl);
            return;
          }

          const response = await fetch(`https://api.cloudinary.com/v1_1/ds4kmouua/image/destroy`, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              public_id: publicId,
              upload_preset: CLOUDINARY_UPLOAD_PRESET,
            }),
          });

          if (!response.ok) {
            throw new Error(`Cloudinary error: ${response.status}`);
          }

          console.log("Imagen de Cloudinary eliminada:", publicId);

        } else if (fotoUrl.includes("r2.dev") || fotoUrl.includes("pub-")) {
          // ---- CLOUDFLARE R2 ----
          console.log("Eliminando de R2:", fotoUrl);
          
          const response = await fetch(
            `https://malim-backend.vercel.app/api/deleteImage?url=${encodeURIComponent(fotoUrl)}`,
            { 
              method: "DELETE",
              headers: {
                "Accept": "application/json"
              }
            }
          );

          const result = await response.json();
          
          if (!response.ok || !result.success) {
            throw new Error(result.error || `R2 error: ${response.status}`);
          }

          console.log("Imagen de R2 eliminada:", fotoUrl);
        }
      } catch (error) {
        console.error(`Error eliminando imagen ${fotoUrl}:`, error);
        // Continuar aunque falle una imagen individual
      }
    });

    // Esperar a que todas las eliminaciones terminen (aunque algunas fallen)
    await Promise.allSettled(deletePromises);

    // Eliminar el documento de Firebase
    await deleteDoc(doc(db, "disponible", id));
    
    alert("Prenda eliminada con éxito");
    navigate("/Disponible");

  } catch (error) {
    console.error("Error general al eliminar la prenda:", error);
    alert("Error al eliminar la prenda: " + error.message);
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
    const message = encodeURIComponent("Conoce nuestras prendas aqui: ")
    const urlId = encodeURIComponent(`https://malim-shop.vercel.app/DetallePrenda/${id}`)
    const url = `https://wa.me/?text=${message}${urlId}`;
    window.open(url, "_blank");
  }

  const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/ds4kmouua/image/upload";
  // Subir nuevas imágenes
  const handleFileChange = async (e) => {
    const files = [...e.target.files];
    const uploadedFotos = [];

    try {
      setLoading(true);
      for (let file of files) {
        const formDataCloud = new FormData();
        formDataCloud.append("file", file);
        formDataCloud.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

        const uploadResponse = await axios.post(CLOUDINARY_URL, formDataCloud);
        const imageUrl = uploadResponse.data.secure_url;
        uploadedFotos.push(imageUrl);
      }

      // Agregar nuevas imágenes al array existente
      const nuevasFotos = [...formData.fotos, ...uploadedFotos];
      setFormData({ ...formData, fotos: nuevasFotos });

      // Guardar en Firebase
      const prendaRef = doc(db, "disponible", id);
      await updateDoc(prendaRef, { fotos: nuevasFotos });

      alert("Imágenes añadidas con éxito");
    } catch (error) {
      alert("Error al subir imágenes.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Función para eliminar imagen individual
const handleDeleteImage = async (fotoUrl) => {
  const confirm = window.confirm("¿Seguro que quieres eliminar esta imagen?");
  if (!confirm) return;

  try {
    setLoading(true);
    console.log("Eliminando imagen individual:", fotoUrl);

    if (fotoUrl.includes("res.cloudinary.com")) {
      // ---- CLOUDINARY ----
      console.log("Eliminando de Cloudinary:", fotoUrl);
      
      // Extraer public_id correctamente
      const urlParts = fotoUrl.split('/');
      const uploadIndex = urlParts.indexOf('upload');
      let publicId = '';
      
      if (uploadIndex !== -1 && urlParts.length > uploadIndex + 2) {
        const versionPart = urlParts[uploadIndex + 1];
        if (versionPart.startsWith('v')) {
          publicId = urlParts.slice(uploadIndex + 2).join('/');
        } else {
          publicId = urlParts.slice(uploadIndex + 1).join('/');
        }
        publicId = publicId.replace(/\.[^/.]+$/, "");
      }

      if (!publicId) {
        throw new Error("No se pudo extraer public_id de la URL");
      }

      const response = await fetch(`https://api.cloudinary.com/v1_1/ds4kmouua/image/destroy`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          public_id: publicId,
          upload_preset: CLOUDINARY_UPLOAD_PRESET,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error Cloudinary: ${response.status}`);
      }

    } else if (fotoUrl.includes("r2.dev") || fotoUrl.includes("pub-")) {
      // ---- CLOUDFLARE R2 ----
      console.log("Eliminando de R2:", fotoUrl);
      
      const response = await fetch(
        `https://malim-backend.vercel.app/api/deleteImage?url=${encodeURIComponent(fotoUrl)}`,
        { 
          method: "DELETE",
          headers: {
            "Accept": "application/json"
          }
        }
      );

      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || `Error R2: ${response.status}`);
      }

    } else {
      throw new Error("URL de imagen no reconocida (no es Cloudinary ni R2)");
    }

    // Quitar del array de fotos en Firebase
    const nuevasFotos = formData.fotos.filter((foto) => foto !== fotoUrl);
    setFormData({ ...formData, fotos: nuevasFotos });

    const prendaRef = doc(db, "disponible", id);
    await updateDoc(prendaRef, { fotos: nuevasFotos });

    alert("Imagen eliminada con éxito");

  } catch (error) {
    console.error("Error al eliminar imagen individual:", error);
    alert("Error al eliminar la imagen: " + error.message);
  } finally {
    setLoading(false);
  }
};





  // Configuración del carrusel
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
  };

  // Opciones para selects
  const categoriaOptions = categorias.map((cat) => ({ value: cat, label: cat }));
  const tallaOptions = tallas.map((talla) => ({ value: talla, label: talla }));

  return (
    <div className="bg-pink-100 min-h-screen">
      <header className="relative">
        <Header menuAbierto={menuAbierto} manejadorMenu={manejadorMenu} />
        <h1 className="fixed inset-x-0 transform pt-2 text-center pointer-events-none text-xl font-bold text-white z-50">Detalles prenda disponible</h1>
      </header>
      <div>
        <MenuLateral menuAbierto={menuAbierto} />
      </div>
      <div>
        <MenuAñadir menuAñadir={menuAñadir} />
      </div>
      {/* Carrusel de imágenes */}
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
      ) : (
        <div className="w-64 pt-12 mb-5 mx-auto">
          <img
            src={formData.fotos[0]}
            alt="Prenda"
            className="w-auto h-64 rounded-lg"
          />
        </div>
      )}


      {/* Formulario de edición */}
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
              Añadir imágenes
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

          {/* Otros campos (costo, precio, categoría, etc.) */}
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
