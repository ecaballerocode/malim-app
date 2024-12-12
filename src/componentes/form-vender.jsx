import React from "react";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc, collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "../credenciales";
import Header from "./header";
import MenuLateral from "./menu-lateral";
import Footer from "./footer";
import MenuAñadir from "./menu-añadir";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Select from "react-select";


function FormVender() {

  const [menuAbierto, setmenuAbierto] = useState(false);
  const [menuAñadir, setmenuAñadir] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [fecha, setFecha] = useState("");
  const [imagenSeleccionada, setImagenSeleccionada] = useState("");

  const { id } = useParams(); // Obtiene el ID de la prenda desde la URL

  const ClientesOptions = clientes.map((cliente) => ({
    value: cliente.id,
    label: cliente.cliente,
  }));

  const [Data, setData] = useState({
    prenda: "",
    detalles: "",
    costo: "",
    precio: "",
    tallas:"",
    talla: "",
    categoria: "",
    proveedor: "",
    fotos: [],
    cliente: "",
    fecha:"",
    color:"",
    pago:"",
    lugar:"",
    entrega:"",
    comprado:false,
    entregado:false
  });

  const lugares = [
    "Tlalmanalco", "San Rafael", "Ameca", "CDMX", "Chalco", "Ixtapaluca", "Miraflores"
  ]

  const tallas = [
    "Inf 2-4", "Inf 6-8", "Inf 10-12", "juv 14-16", "XS (3-5)", "(28-30)", "(30-32)", "(32-34)",
    "(34-36)","(36-38)", "(38-40)", "(40-42)", "Unitalla", "5", "7", "9", "11", "13",
    "15", "17", "4", "6", "8", "10", "12", "14", "16", "30", "32", "34", "36", "38",
    "40", "42"
  ];

  const formaEntrega = ["Punto de venta", "A domicilio"]

  const tallaOptions = tallas.map((talla) => ({
    value: talla,
    label: talla,
  }));

  const entregaOptions = formaEntrega.map((entrega) => ({
    value: entrega,
    label: entrega,
  }));

  const lugaresOptions = lugares.map((lugar) => ({
    value: lugar,
    label: lugar,
  }));


  const manejadorMenu = () => {
    setmenuAbierto(!menuAbierto);
  };

  const manejadorMenuAñadir = () => {
    setmenuAñadir(!menuAñadir);
  };

  const manejadorFecha = (e) => {
    const nuevaFecha = e.target.value;
    setFecha(nuevaFecha);
    setData({...Data, fecha: nuevaFecha})
  };

  useEffect(() => {
    const fetchPrenda = async () => {
      try {
        const prendaRef = doc(db, "disponible", id);
        const prendaDoc = await getDoc(prendaRef);

        if (prendaDoc.exists()) {
          const data = prendaDoc.data();
          setData({
            prenda: data.prenda,
            detalles: data.detalles,
            costo: data.costo,
            precio: data.precio,
            tallas: data.talla,
            categoria: data.categoria,
            proveedor: data.proveedor,
            fotos: data.fotos || [],
          });
        }
      } catch (error) {
        console.error("Error al obtener la prenda:", error);
            }
        };    
        fetchPrenda();
    }, [id]);

    useEffect(() => {
        const fetchClientes = async () => {
          try {
            const querySnapshot = await getDocs(collection(db, "clientes"));
            const docsArray = querySnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            setClientes(docsArray);
          } catch (error) {
            console.error("Error al cargar los proveedores", error);
          }
        };
        fetchClientes();
      }, []);

      //Funcion para volver a renderizar el formulario cuando se envian los datos
      const fetchNewPrenda = async () => {
        try {
          const prendaRef = doc(db, "disponible", id);
          const prendaDoc = await getDoc(prendaRef);
  
          if (prendaDoc.exists()) {
            const data = prendaDoc.data();
            setData({
              prenda: data.prenda,
              detalles: data.detalles,
              costo: data.costo,
              precio: data.precio,
              tallas: data.talla,
              talla:"",
              categoria: data.categoria,
              proveedor: data.proveedor,
              fotos: data.fotos || [],
              cliente: "",
              fecha:"",
              color:"",
              pago:"",
              lugar:"",
              entrega:"",
              comprado:false,
              entregado:false
            });
          }
        } catch (error) {
          console.error("Error al obtener la prenda:", error);
              }
          };


      const handleClienteChange = (selectedOption) => {
        setData({ ...Data, cliente: selectedOption });
      };

      const handleTallaChange = (selectedOption) => {
        setData({...Data, talla: selectedOption});
      };

      const handleLugarChange = (selectedOption) => {
        setData({...Data, lugar: selectedOption});
      };

      const handleEntregaChange = (selectedOption) => {
        setData({...Data, entrega: selectedOption});
      };

      const handleChange = (e) => {
        const { name, value } = e.target;
        setData({ ...Data, [name]: value });
      };

      const handleComprado = () => {
        setData({...Data, comprado:!Data.comprado})
      };

      const handleEntregado = () => {
        setData({...Data, entregado:!Data.entregado})
      };

      const handleSubmit = async (e) => {
        e.preventDefault();

      const dataToSubmit = {
        ...Data,
        cliente: Data.cliente?.label || "",
        lugar: Data.lugar?.label || "",
        entrega: Data.entrega?.label || "",
        talla: Data.talla?.label || "",
        fotos: imagenSeleccionada,
        pago: Number(Data.pago),
        comprado: !!Data.comprado, // Asegurar booleano
        entregado: !!Data.entregado
      };
  
      try {
        await addDoc(collection(db, "pedidos"), dataToSubmit);
        alert("Pedido agregado con éxito.");
        
        fetchNewPrenda();
        setFecha("");
        setImagenSeleccionada("");
        
      } catch (error) {
        alert("Hubo un error al agregar el pedido.");
        console.error("Error al agregar el pedido:", error);
      }
    };


    // Configuración del carrusel
  const settings = {
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    beforeChange: (oldIndex, newIndex) => {
      setImagenSeleccionada(Data.fotos[newIndex]);
    },
  };

    
    return(
        <div className="bg-pink-100 min-h-screen">
            <header className="relative">
                <Header menuAbierto={menuAbierto} manejadorMenu={manejadorMenu} />
                <h1 className="fixed inset-x-0 transform pt-2 text-center pointer-events-none text-xl font-bold text-white z-50">Vender prenda</h1>
            </header>
            <div>
                <MenuLateral menuAbierto={menuAbierto} />
            </div>
            <div>
                <MenuAñadir menuAñadir={menuAñadir} />
            </div>
            <main className="pb-16 pt-10 flex flex-row justify-between">
                <div className="h-auto border-2 p-5 rounded-lg shadow-xl border-pink-200 m-10 flex justify-center">
                    <Slider {...settings} className="w-64 mx-auto flex justify-center">
                        {Data.fotos.map((foto, index) => (
                        <div key={index}>
                            <img src={foto} alt={`Prenda ${index}`} className="w-64 h-auto rounded-lg"/>
                        </div>
                    ))}
                    </Slider>
                    <div className="ml-5 mt-10">
                        <p className="mb-5 font-bold text-lg text-pink-700 m-2">{Data.prenda}</p>
                        <p className="text-pink-600 m-2">{Data.proveedor}</p>
                        <p className="text-pink-600 m-2">{Data.categoria}</p>
                        <div className="flex felx-row justify-between m-2">
                            <p className="text-pink-600">${Data.costo}</p>
                            <p className="text-pink-700 font-bold">${Data.precio}</p>
                        </div>
                        <p className="mb-5 text-pink-600 m-2">{Data.tallas}</p>
                        <p className="text-pink-600 text-sm m-2">{Data.detalles}</p>
                    </div>
                </div>
                <form onSubmit={handleSubmit} className="lg:border-2 lg:shadow-xl h-auto px-5 lg:py-2 pb-20 mt-10 mr-10 rounded-lg border-pink-200 max-w-lg w-full">
                  <div className="flex flex-col pt-2">
                    <label className="px-2 text-pink-800 font-bold" htmlFor="datePicker">Fecha</label>
                    <input className="w-full px-2 h-8 bg-white rounded-md shadow-sm" type="date" id="datePicker" value={fecha}
                    onChange={manejadorFecha} placeholder="Fecha"/>
                  </div>
                  <div className="flex flex-col pt-2">
                      <label className="px-2 text-pink-800 font-bold">Cliente:</label>
                      <Select
                          options={ClientesOptions}
                          value={Data.cliente}
                          onChange={handleClienteChange}
                          isClearable
                          placeholder="Seleccionar cliente"
                          />
                    </div>
                    <div className="flex flex-col pt-2">
                      <label className="px-2 text-pink-800 font-bold">Talla:</label>
                      <Select
                          options={tallaOptions}
                          value={Data.talla}
                          onChange={handleTallaChange}
                          isClearable
                          placeholder="Seleccionar talla"
                          />
                    </div>
                    <div className="flex flex-col pt-2">
                      <label className="px-2 text-pink-800 font-bold">Color:</label>
                      <input
                          type="text"
                          name="color"
                          value={Data.color}
                          onChange={handleChange}
                          placeholder="Seleccionar color"
                          required
                          className="px-2 rounded-md h-8 shadow-sm"
                          />
                    </div>
                    <div className="flex flex-col pt-2">
                      <label className="px-2 text-pink-800 font-bold">Pago:</label>
                      <input
                          name="pago"
                          type="number"
                          value={Data.pago}
                          onChange={handleChange}
                          placeholder="¿Cuanto ha pagado?"
                          required
                          className="px-2 rounded-md h-8 shadow-sm"
                          />
                    </div>
                    <div className="flex flex-row justify-between">
                      <div className="flex flex-col pt-2 w-1/2 pr-2">
                        <label className="px-2 text-pink-800 font-bold">Lugar de entrega:</label>
                        <Select
                            options={lugaresOptions}
                            name="lugar"
                            value={Data.lugar}
                            onChange={handleLugarChange}
                            isClearable
                            required
                            placeholder="Seleccionar un lugar"
                            />
                      </div>
                      <div className="flex flex-col pt-2 w-1/2 pl-2">
                        <label className="px-2 text-pink-800 font-bold">Forma de entrega:</label>
                        <Select
                            options={entregaOptions}
                            name="entrega"
                            value={Data.entrega}
                            onChange={handleEntregaChange}
                            isClearable
                            required
                            placeholder="Seleccionar una forma"
                            />
                      </div>
                    </div>
                    <div className="flex flex-row mt-4 mx-10 justify-between">
                      <div className="flex flex-col">
                        <input type="checkbox" checked={Data.comprado} onChange={handleComprado}/>
                        <label className="text-pink-800">¿Comprado?</label>
                      </div>
                      <div className="flex flex-col">
                        <input type="checkbox" checked={Data.entregado} onChange={handleEntregado}/>
                        <label className="text-pink-800">¿Entregado?</label>
                      </div>
                    </div>
                    <div className="flex justify-center pt-2">
                    <button
                      type="submit"
                      className="mt-2 py-2 px-4 bg-pink-400 w-1/2 mb-5 shadow-xl text-white rounded-md cursor-pointer hover:bg-pink-200"
                      >
                      Vender
                    </button>
                  </div>
                </form>
            </main>
            <Footer manejadorMenuAñadir={manejadorMenuAñadir}/>
        </div>
    )
}

export default FormVender;