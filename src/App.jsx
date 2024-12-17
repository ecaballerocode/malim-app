import React, {useState, useEffect} from "react";
import Header from "./componentes/header";
import MenuLateral from "./componentes/menu-lateral";
import Footer from "./componentes/footer";
import axios from "axios";
import MenuAñadir from "./componentes/menu-añadir";
import logo from "./logo-negro.png";
import arregloFrases from "./arregloFrases";
import { IoMdRefresh } from "react-icons/io";
import { FaShare } from "react-icons/fa";
import { db } from "./credenciales";
import { collection, getDocs } from "firebase/firestore";



//Pagina principal

//Establecer el motor de traduccion


function App(){

//Estado para manejar el menu laeral
  const [menuAbierto, setmenuAbierto] = useState(false);
//Estado que guarda la frase del dia
  const [frase, setFrase] = useState("")
  const [autor, setAutor] = useState("")
  //Estado para controlar el menu añadir
  const [menuAñadir, setmenuAñadir] = useState(false);
  const [pedidos, setPedidos] = useState([]);


//creamos el useffect que va a pedir la frase a la api cuando se renderice el componente
  useEffect (()=>{
    const obtenerFrase = async () => {
      try {
        const respuesta = await axios.get("/api/phrase");
        setFrase(respuesta.data.phrase);
        setAutor(respuesta.data.author)
      } catch (error) {
        console.error("Error al obtener o traducir")
      }
    }
    obtenerFrase();
  }, []); 

  useEffect(() => {
    const fetchPedidos = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "pedidos"));
        const docsArray = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        docsArray.sort((a, b) => b.fecha.localeCompare(a.fecha));
        setPedidos(docsArray);
      } catch (error) {
        console.error("Error al cargar los documentos", error);
      }
    };
    fetchPedidos();
  }, []);


//funcion que maneja el estado del menu lateral
  const manejadorMenu = ()=>{
    setmenuAbierto(!menuAbierto);
  }

//funcion que maneja el estado del menu añadir
  const manejadorMenuAñadir =()=>{
    setmenuAñadir(!menuAñadir);
  }

  //Funciones y estados para manejar la solicitud de frases

  const [quote, setQuote] = useState("")

  const fetchRandomQuote = () =>{
   const fraseRandom = arregloFrases[Math.floor(Math.random()*arregloFrases.length)]
    setQuote(fraseRandom);
  }

  //Funcion para enviar la frase por whatsapp

  const enviarWhatsapp = (quote) =>{
    const url = `https://wa.me/?text=${encodeURIComponent(quote)}`;
    window.open(url, "_blank");
  }

  const filtrarPedidos = () =>{
    return pedidos.filter((pedido) => pedido.comprado === false);
  }

  const inversion = () =>{
    const pedidosFiltrados = pedidos.filter((pedido) => pedido.comprado === false);
    return pedidosFiltrados.reduce((acumulador, pedido)=>acumulador + pedido.costo, 0);
  }

  //Fncion para calcular cuanto hay po cobrar
  const porCobrar = () => {
    return pedidos.reduce((suma, doc)=> 
     suma + (doc.precio - doc.pago), 0)
}

const utilidad = () => {
    return filtrarPedidos().reduce((suma, pedido) => suma + (pedido.precio - pedido.costo), 0);
}


  return (
    <div className="h-screen flex flex-col overflow-hidden bg-pink-100 pb-16 pt-10">
      <header>
        <Header menuAbierto={menuAbierto} manejadorMenu={manejadorMenu}/>
      </header>
      <div>
        <MenuLateral menuAbierto={menuAbierto}/>
      </div>
      <div >
        <MenuAñadir menuAñadir={menuAñadir}/>
      </div>
      {/*creamos el contenedor pricpal */}
      <main className="flex-1">
        <div className="flex justify-center w-full h-16">
          {/*Imagen del logotipo */}
          <img src={logo} alt="logo de malim" />
        </div>
        {/*Div en el que se va a ver la frase del dia */}
        <div className="bg-pink-400 mx-10 p-2 h-32 lg:mx-64 shadow-xl text-center rounded-lg flex flex-col items-center justify-center relative text-white">
          <p className="flex-grow font-bold mt-10">{quote}</p>
          <div className="flex flex-row mt-auto justify-between w-full">
            <button className="text-pink-100 mx-3 px-2" onClick={fetchRandomQuote}>
              <IoMdRefresh className="text-2xl"/>
            </button>
            <button className="text-pink-100 mx-3 px-2" onClick={() => enviarWhatsapp(quote)}>
              <FaShare className="text-xl"/>
            </button>
          </div>
        </div>
        {/*Creamos el div que vaa albergar las estadidticas */}
        <div className="bg-pink-400 z-0 mx-10 mt-10 p-2 h-64 lg:mx-64 shadow-xl text-center rounded-lg ">
          <h1 className="text-pink-800 text-lg font-bold mt-3 mb-2">Estadísticas</h1>
          {/*este div va a contener el grid con las dos filas y dos columnas */}
          <div className="grid grid-cols-2 gap-4 m-5">
            <div>
              <p className="text-center leading-none text-white">Ventas de la semana:</p>
              <p className="text-pink-800 text-lg mt-1 font-bold">{filtrarPedidos().length}</p>
            </div>
            <div>
              <p className="text-center leading-none text-white">Inversión necesaria:</p>
              <p className="text-pink-800 text-lg mt-1 font-bold">${inversion()}</p>
            </div>
            <div className="mt-5">
              <p className="text-center leading-none text-white">Por cobrar:</p>
              <p className="text-pink-800 text-lg mt-1 font-bold">${porCobrar()}</p>
            </div>
            <div className="mt-5">
              <p className="text-center leading-none text-white">Utilidad:</p>
              <p className="text-pink-800 text-lg mt-1 font-bold">${utilidad()}</p>
            </div>
          </div>
        </div>
      </main>
      
      <div>
        <Footer manejadorMenuAñadir={manejadorMenuAñadir}/>
      </div>
    </div>
  );
}

export default App;
