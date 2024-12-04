import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Select from "react-select";
import { doc, getDoc, updateDoc, getDocs, collection } from "firebase/firestore";
import { db } from "../credenciales";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Header from "./header";
import MenuLateral from "./menu-lateral";
import Footer from "./footer";
import MenuAñadir from "./menu-añadir";

function DetallePrenda() {
  const { id } = useParams(); // Obtiene el ID de la prenda desde la URL
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
    "Abrigos", "Blusas", "Playeras", "Playeras deportivas", "Conjuntos",
    "Conjuntos deportivos", "Chamarras", "Sudaderas", "Maxi sudaderas",
    "Maxi vestidos", "Maxi cobijas", "Ensambles", "Pantalones", "Pants",
    "Shorts", "Infantil niño", "Infantil niña", "Medias", "Leggins",
    "Mallones", "Ropa interior", "Sacos", "Blazers", "Capas", "Palazzos",
    "Camisas", "Gorros", "Calzado", "Guantes", "Faldas", "Suéteres",
    "Overoles", "Otros"
  ];

  const tallas = [
    "Inf 2-4", "Inf 6-8", "Inf 10-12", "(28-30)", "(32-34)",
    "(36-38)", "(40-42)", "Unitalla"
  ];

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
      <Slider {...settings} className="w-64 pt-12 mb-5 mx-auto">
        {formData.fotos.map((foto, index) => (
          <div key={index}>
            <img src={foto} alt={`Prenda ${index}`} className="w-auto h-64 rounded-lg"/>
          </div>
        ))}
      </Slider>
      {/* Formulario de edición */}
      <main className="pb-20 flex flex-center justify-center">
      <form onSubmit={handleSubmit} className="lg:border-2 lg:shadow-xl px-5 lg:py-2 pb-20 mt-2 rounded-lg border-pink-200 max-w-lg w-full">
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
          <button className="mt-2 py-2 px-4 bg-pink-600 text-white rounded-md cursor-pointer hover:bg-pink-200"
            type="button">
            Vender 
          </button> 
        </div>
      </form>
      </main>
      <Footer manejadorMenuAñadir={manejadorMenuAñadir}/>
    </div>
  );
}

export default DetallePrenda;