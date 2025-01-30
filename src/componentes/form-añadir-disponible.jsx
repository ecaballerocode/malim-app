import React, { useState, useEffect } from "react";
import Select from "react-select";
import Header from "./header";
import MenuLateral from "./menu-lateral";
import Footer from "./footer";
import MenuAñadir from "./menu-añadir";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "../credenciales";
import axios from "axios";

function FormAñadirDisponible() {
  const [formData, setFormData] = useState({
    prenda: "",
    detalles:"",
    costo: "",
    precio: "",
    talla: [],
    categoria: null,
    proveedor: null,
  });
  const [fotos, setFotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [menuAbierto, setmenuAbierto] = useState(false);
  const [menuAñadir, setmenuAñadir] = useState(false);
  const [proveedores, setProveedores] = useState([]);
  const [fecha, setFecha] = useState("");


  const manejadorMenu = () => {
    setmenuAbierto(!menuAbierto);
  };

  const manejadorMenuAñadir = () => {
    setmenuAñadir(!menuAñadir);
  };

  const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/ds4kmouua/image/upload";
  const CLOUDINARY_UPLOAD_PRESET = "malimapp";

  const categorias = [
    "Abrigos", "Blusas", "Playeras", "Playeras deportivas", "Conjuntos",
    "Conjuntos deportivos", "Chamarras", "Sudaderas", "Maxi sudaderas",
    "Maxi vestidos", "Maxi cobijas", "Ensambles", "Pantalones", "Pants",
    "Shorts", "Infantil niño", "Infantil niña", "Medias", "Leggins",
    "Mallones", "Ropa interior", "Sacos", "Blazers", "Capas", "Palazzos",
    "Camisas", "Gorros", "Calzado", "Chalecos","Blusones", "Pijamas", "Guantes", "Faldas", "Suéteres",
    "Overoles", "Otros", "Sin Categoria", "Niños uisex", "Gabardinas", "Vestidos"
  ];

  const tallas = [
    "Inf 2-4", "Inf 6-8", "Inf 10-12", "juv 14-16", "XS (3-5)", "(28-30)", "(30-32)", "(32-34)",
    "(34-36)","(36-38)", "(38-40)", "(40-42)", "(32-36)", "Unitalla", "5", "7", "9", "11", "13",
    "15", "17", "4", "6", "8", "10", "12", "14", "16", "30", "32", "34", "36", "38",
    "40", "42"
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

  const handleFileChange = async (e) => {
    const files = [...e.target.files];
    const uploadedFotos = [];

    try {
      setLoading(true);
      for (let file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

        const uploadResponse = await axios.post(CLOUDINARY_URL, formData);
        const imageUrl = uploadResponse.data.secure_url;
        uploadedFotos.push(imageUrl);
      }
      setFotos(uploadedFotos);
    } catch (error) {
      alert("Hubo un error al subir las imágenes.");
      console.error("Error al subir las imágenes:", error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    const dataToSubmit = {
      ...formData,
      categoria: formData.categoria?.value || "",
      proveedor: formData.proveedor?.label || "",
      precio: Number(formData.precio),
      costo: Number(formData.costo),
      fotos,
    };

    try {
      await addDoc(collection(db, "disponible"), dataToSubmit);
      alert("Prenda agregada con éxito.");

      setFormData({
        prenda: "",
        detalles:"",
        costo: "",
        precio: "",
        talla: [],
        categoria: null,
        proveedor: null,
      });
      setFotos([]);
      setFecha("")
    } catch (error) {
      alert("Hubo un error al agregar el documento.");
      console.error("Error al agregar el producto:", error);
    }
  };

  const manejadorFecha = (e) => {
    const nuevaFecha = e.target.value;
    setFecha(nuevaFecha);
    setFormData({...formData, fecha: nuevaFecha})
  };

  return (
    <div className="bg-pink-100 min-h-screen">
      <header className="relative">
        <Header menuAbierto={menuAbierto} manejadorMenu={manejadorMenu} />
        <h1 className="fixed inset-x-0 transform pt-2 text-center pointer-events-none text-xl font-bold text-white z-50">Añadir prenda disponible</h1>
      </header>
      <div>
        <MenuLateral menuAbierto={menuAbierto} />
      </div>
      <div>
        <MenuAñadir menuAñadir={menuAñadir} />
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
            />
            <label
              htmlFor="file"
              className="mt-2 inline-block py-2 px-4 bg-pink-400 text-center text-white rounded-md cursor-pointer hover:bg-pink-200"
            >
              Elegir imágenes
            </label>
          </div>
          <div className="flex flex-col pt-2">
            <label className="px-2 text-pink-800 font-bold" htmlFor="datePicker">Fecha</label>
            <input className="w-full px-2 h-8 bg-white rounded-md shadow-sm" type="date" id="datePicker" value={fecha}
            onChange={manejadorFecha} placeholder="Fecha"/>
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
          <div className="flex justify-center pt-2">
            <button
              type="submit"
              className="mt-2 py-2 px-4 bg-pink-400 text-white rounded-md cursor-pointer hover:bg-pink-200"
              disabled={loading}
            >
              {loading ? "Subiendo imágenes..." : "Agregar Prenda"}
            </button>
          </div>
        </form>
      </div>
      <Footer manejadorMenuAñadir={manejadorMenuAñadir}/>
    </div>
  );
}

export default FormAñadirDisponible;
