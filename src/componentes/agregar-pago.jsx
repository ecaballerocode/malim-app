import React from "react";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../credenciales";
import Header from "./header";
import MenuLateral from "./menu-lateral";
import Footer from "./footer";
import MenuAñadir from "./menu-añadir";
import logo from "../logo-negro.png";
import * as htmlToImage from "html-to-image";


function AgregarPago() {


  const [menuAbierto, setmenuAbierto] = useState(false);
  const [menuAñadir, setmenuAñadir] = useState(false);
  const [fecha, setFecha] = useState("");
  const [monto, setMonto] = useState();
  const [estatus, setEstatus] = useState("")

  const { id } = useParams(); // Obtiene el ID de la prenda desde la URL


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
    pago:0,
    lugar:"",
    entrega:"",
    comprado:false,
    entregado:false,
    pagos:[]
  });


  const manejadorMenu = () => {
    setmenuAbierto(!menuAbierto);
  };

  const manejadorMenuAñadir = () => {
    setmenuAñadir(!menuAñadir);
  };

  const manejadorFecha = (e) => {
    const nuevaFecha = e.target.value;
    setFecha(nuevaFecha);
  };

  useEffect(() => {
    const fetchPrenda = async () => {
      try {
        const prendaRef = doc(db, "pedidos", id);
        const prendaDoc = await getDoc(prendaRef);

        if (prendaDoc.exists()) {
          const data = prendaDoc.data();
          setData({
            prenda: data.prenda,
            detalles: data.detalles,
            costo: data.costo,
            precio: data.precio,
            tallas: data.tallas,
            talla: data.talla,
            categoria: data.categoria,
            proveedor: data.proveedor,
            fotos: data.fotos,
            cliente: data.cliente,
            fecha: data.fecha,
            color: data.color,
            pago: data.pago,
            lugar: data.lugar,
            entrega:data.entrega,
            comprado: data.comprado,
            entregado:data.entregado,
            pagos: data.pagos || [], // Garantiza que `pagos` sea un arreglo vacío si no existe

          });
          const manejarEstatus = ()=>{
            if (data.entregado) {
                setEstatus("Pedido entregado")
            } else {
                setEstatus("Entrega pendiente")
            }
        }
        manejarEstatus();
        }
      } catch (error) {
        console.error("Error al obtener la prenda:", error);
            }
        };    
        fetchPrenda();
    }, [id]);

    
      const handleSubmit = async (e) => {
        e.preventDefault();

      const dataToSubmit = {
        ...Data,
        pagos:[...Data.pagos, {fecha:fecha, monto:monto},],
        pago: Data.pago + monto,
      };
  
      try {
        await updateDoc(doc(db, "pedidos", id), dataToSubmit);
        alert("Pago agregado con éxito.");
        setFecha("");
        setMonto("");
        setData((prevState) => ({
            ...prevState,
            pagos: [...prevState.pagos, { fecha, monto }],
            pago: prevState.pago + monto,
          }));
        
      } catch (error) {
        alert("Hubo un error al agregar el pedido.");
        console.error("Error al agregar el pedido:", error);
      }
    };

    useEffect(() => {
        
    },[estatus])

    const handleMonto = (e)=>{
        setMonto(Number(e.target.value));
    };

    const exportarNotaComoImagen = async () => {
      try {
        const divNota = document.getElementById("Nota");
        if (!divNota) {
          alert("No se encontró la nota.");
          return;
        }
    
        // Generar la imagen como JPG
        const dataUrl = await htmlToImage.toJpeg(divNota, {
          quality: 1, // Máxima calidad
          backgroundColor: "#fce7f3", // Asegura el color de fondo
        }); // Ajusta la calidad (0.95 es alta calidad)
    
        // Crear un enlace temporal para descargar la imagen
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = "nota.jpg"; // Cambia la extensión a JPG
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error("Error al exportar la nota como imagen:", error);
        alert("Hubo un error al generar la imagen.");
      }
    };
    

    return(
        <div className="bg-pink-100 min-h-screen">
            <header className="relative">
                <Header menuAbierto={menuAbierto} manejadorMenu={manejadorMenu} />
                <h1 className="fixed inset-x-0 transform pt-2 text-center pointer-events-none text-xl font-bold text-white z-50">Agregar pago a {Data.cliente}</h1>
            </header>
            <div>
                <MenuLateral menuAbierto={menuAbierto} />
            </div>
            <div>
                <MenuAñadir menuAñadir={menuAñadir} />
            </div>
            <main className="pb-16 pt-10 w-full flex lg:justify-center lg:flex-row flex-col">
            <div
                  id="Nota"
                  className="lg:w-2/3 border-2 p-4 rounded-lg shadow-xl w-full border-pink-200 bg-pink-100"
                >
                  <div className="flex flex-row">
                    <div className="w-1/3 flex flex-col items-center">
                      <img src={Data.fotos} alt="Prenda" className="rounded-lg max-w-full h-auto" />
                      <img src={logo} alt="Logo Malim" className="w-8 h-8 mt-2" />
                    </div>
                    <div className="w-2/3 px-4">
                      <p className="mb-2 font-bold text-center text-xl text-pink-700">{Data.cliente}</p>
                      <p className="mb-2 font-bold text-center text-pink-700">{Data.prenda}</p>
                      <p className="mb-2 text-pink-600 font-bold text-xs">Estado: {estatus}</p>
                      <div className="flex flex-row justify-between mb-2">
                        <p className="text-pink-600">{Data.talla}</p>
                        <p className="text-pink-600">{Data.color}</p>
                      </div>
                      <div className="flex flex-row justify-between mb-2">
                        <div className="flex flex-col">
                          <p className="text-pink-600 text-sm">Precio:</p>
                          <p className="text-pink-600">${Data.precio}</p>
                        </div>
                        <div className="flex flex-col">
                          <p className="text-pink-600 text-sm">Restante:</p>
                          <p className="text-pink-600 font-bold">${Data.precio - Data.pago}</p>
                        </div>
                      </div>
                      <div>
                        <p className="font-bold text-center text-pink-700 mb-2">Pagos</p>
                        {Data.pagos.map((pago, index) => (
                          <div className="flex flex-row justify-between" key={index}>
                            <p className="text-pink-600">{pago.fecha}</p>
                            <p className="text-pink-600">${pago.monto}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="w-full flex justify-center">
                <form onSubmit={handleSubmit} className="lg:border-2 lg:shadow-xl h-auto px-5 lg:py-2 pb-20 mt-10 rounded-lg border-pink-200 w-full lg:w-2/3">
                  <div className="flex flex-col pt-2">
                    <label className="px-2 text-pink-800 font-bold" htmlFor="datePicker">Fecha de pago</label>
                    <input className="w-full px-2 h-8 bg-white rounded-md shadow-sm" type="date" id="datePicker" value={fecha}
                    onChange={manejadorFecha} placeholder="Fecha"/>
                  </div>
                  <div className="flex flex-col pt-2">
                    <label className="px-2 text-pink-800 font-bold">Monto:</label>
                    <input className="w-full px-2 h-8 bg-white rounded-md shadow-sm" type="number" value={monto}
                    onChange={handleMonto} placeholder="Monto"/>
                  </div>
                    <div className="flex w-full flex-col pt-2">
                      <div className="w-full flex justify-center">
                        <button
                          type="submit"
                          className="mt-2 py-2 px-4 h-10 mx-5 text-sm bg-pink-400 w-1/2 mb-5 shadow-xl text-white rounded-md cursor-pointer hover:bg-pink-200"
                          >
                          Agregar pago
                        </button>
                        <button type="button" onClick={exportarNotaComoImagen} className="h-10 text-sm w-1/2 mt-2 mx-5 py-2 bg-pink-400 text-white rounded-md">
                          Descargar nota
                        </button>
                      </div>
                  </div>
                </form>
                </div>
            </main>
            <Footer manejadorMenuAñadir={manejadorMenuAñadir}/>
        </div>
    )
}

export default AgregarPago;