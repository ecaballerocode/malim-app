import React, { useEffect, useState } from "react";
import Header from "./header";
import MenuLateral from "./menu-lateral";
import Footer from "./footer";
import MenuAñadir from "./menu-añadir";
import { db } from "../credenciales";
import { collection, getDocs } from "firebase/firestore";
import Select from "react-select";
import { useNavigate } from "react-router-dom";


function Disponible() {
  const [menuAbierto, setmenuAbierto] = useState(false);
  const [menuAñadir, setmenuAñadir] = useState(false);
  const [proveedores, setProveedores] = useState([]);
  const [filtroProveedor, setFiltroProveedor] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [prendasDisponibles, setPrendasDisponibles] = useState([]);

  const navigate = useNavigate();  // Hook para navegación
  
  const manejarClickPrenda = (id) => {
    navigate(`/DetallePrenda/${id}`);  // Redirige a la página de detalles
  };
  
  // Nuevo estado para la barra de búsqueda
  const [busqueda, setBusqueda] = useState("");

  // Array con las categorías disponibles
  const categorias = [
    "Abrigos", "Blusas", "Playeras", "Playeras deportivas", "Conjuntos",
    "Conjuntos deportivos", "Chamarras", "Sudaderas", "Maxi sudaderas",
    "Maxi vestidos", "Maxi cobijas", "Ensambles", "Pantalones", "Pants",
    "Shorts", "Infantil niño", "Infantil niña", "Medias", "Leggins",
    "Mallones", "Ropa interior", "Sacos", "Blazers", "Capas", "Palazzos",
    "Camisas", "Gorros", "Calzado", "Chalecos","Blusones", "Pijamas", "Guantes", "Faldas", "Suéteres",
    "Overoles", "Otros", "Sin Categoria"
  ];

  // Convertir categorías a formato compatible con Select
  const categoriaOptions = categorias.map((cat) => ({
    value: cat,
    label: cat,
  }));

  

  // Convertir proveedores a formato compatible con Select
  const proveedoresOptions = proveedores.map((prov) => ({
    value: prov.proveedor,
    label: prov.proveedor,
  }));

  // Función para manejar el estado del menú lateral
  const manejadorMenu = () => {
    setmenuAbierto(!menuAbierto);
  };

  // Función para manejar el estado del menú añadir
  const manejadorMenuAñadir = () => {
    setmenuAñadir(!menuAñadir);
  };

  // Funciones para manejar los cambios de los filtros
  const handleProveedorChange = (selectedOption) => {
    setFiltroProveedor(selectedOption);
  };

  const handleCategoriaChange = (selectedOption) => {
    setFiltroCategoria(selectedOption);
  };

  // Función para manejar la entrada de la barra de búsqueda
  const handleBusquedaChange = (e) => {
    setBusqueda(e.target.value);
  };

  // Cargar los documentos desde Firestore (prendas disponibles)
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "disponible"));
        const docsArray = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setPrendasDisponibles(docsArray);
      } catch (error) {
        console.error("Error al cargar los documentos", error);
      }
    };
    fetchDocuments();
  }, []);

  // Cargar los proveedores desde Firestore
  useEffect(() => {
    const fetchProveedores = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "proveedores"));
        const docsArray = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProveedores(docsArray);
      } catch (error) {
        console.log("Error al cargar proveedores", error);
      }
    };
    fetchProveedores();
  }, []);

  // Función para filtrar las prendas según los filtros seleccionados y la búsqueda
  const filtrarPrendas = () => {
    return prendasDisponibles.filter((doc) => {
      const coincideProveedor = !filtroProveedor || doc.proveedor === filtroProveedor.value;
      const coincideCategoria = !filtroCategoria || doc.categoria === filtroCategoria.value;
      const coincideBusqueda = !busqueda || doc.prenda.toLowerCase().includes(busqueda.toLowerCase());

      return coincideProveedor && coincideCategoria && coincideBusqueda;
    });
  };

  return (
    <div className="min-h-screen bg-pink-100">
      <header className="relative">
        <Header menuAbierto={menuAbierto} manejadorMenu={manejadorMenu} />
        <h1 className="fixed inset-x-0 transform pt-2 text-center pointer-events-none font-bold text-xl text-white z-50">
          Prendas disponibles
        </h1>
      </header>
      <div>
        <MenuLateral menuAbierto={menuAbierto} />
      </div>
      <div>
        <MenuAñadir menuAñadir={menuAñadir} />
      </div>
      {/* Contenedor principal */}
      <main className="pb-16 pt-10">
        {/* Sección de filtros y barra de búsqueda */}
        <div className="flex lg:flex-row flex-col justify-between">
          {/* Filtros de proveedor y categoría */}
          <div className="lg:p-5 px-5 pt-2 flex flex-row items-center">
            <h1 className="font-bold lg:text-sm text-xs text-pink-800 mr-2">Filtrar por:</h1>
            <Select options={proveedoresOptions} onChange={handleProveedorChange} isClearable placeholder="Proveedor" />
            <Select options={categoriaOptions} onChange={handleCategoriaChange} isClearable placeholder="Categoría" />
          </div>
          {/* Barra de búsqueda */}
          <div className="lg:p-5 px-5 pt-1 pb-2 flex flex-row items-center">
            <h1 className="font-bold lg:text-sm text-xs text-pink-800 mr-2">Búsqueda:</h1>
            <input
              type="text"
              placeholder="Buscar"
              className="h-10 rounded-lg p-2 border-gray-200 border-2"
              value={busqueda}
              onChange={handleBusquedaChange}
            />
          </div>
        </div>
        
        {/* Renderización de la lista filtrada */}
        <div className="productos-container bg-pink-100 grid grid-cols-2 lg:grid-cols-5 lg:gap-3 gap-3 mx-5 mb-5">
          {filtrarPrendas().map((doc) => (
            <div key={doc.id} onClick={()=> manejarClickPrenda(doc.id)} className="producto h-auto border-2 rounded-lg shadow-xl border-pink-200">
              <div className="lg:h-64 h-40 w-full rounded-lg">
                {doc.fotos && doc.fotos.length > 0 ? (
                  <img
                    key={doc.fotos[0]}
                    src={doc.fotos[0]}
                    alt={"Foto del producto"}
                    className="lg:h-64 h-40 w-full"
                  />
                ) : (
                  <div className="flex items-center h-full justify-center">
                    <p className="text-center text-gray-600 font-sm">Sin fotos disponibles</p>
                  </div>
                )}
              </div>
              <div className="p-2 text-pink-600">
                <p className="font-bold lg:text-sm text-pink-700">{doc.prenda}</p>
                <div className="flex flex-row justify-start">
                  <p className="lg:text-sm">${doc.costo}</p>
                  <p className="font-bold lg:text-sm ml-5 text-pink-700">${doc.precio}</p>
                </div>
                <p className="lg:text-sm">{doc.talla}</p>
                <p className="lg:text-sm">{doc.proveedor}</p>
                <p className="lg:text-xs">{doc.detalles}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
      <div>
        <Footer manejadorMenuAñadir={manejadorMenuAñadir} />
      </div>
    </div>
  );
}

export default Disponible;
