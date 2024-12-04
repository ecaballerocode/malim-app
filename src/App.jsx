import React, {useState, useEffect} from "react";
import Header from "./componentes/header";
import MenuLateral from "./componentes/menu-lateral";
import Footer from "./componentes/footer";
import axios from "axios";
import MenuAñadir from "./componentes/menu-añadir";



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

//funcion que maneja el estado del menu lateral
  const manejadorMenu = ()=>{
    setmenuAbierto(!menuAbierto);
  }

//funcion que maneja el estado del menu añadir
  const manejadorMenuAñadir =()=>{
    setmenuAñadir(!menuAñadir);
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
          <img src="./logo-negro.png" alt="logo de malim" />
        </div>
        {/*Div en el que se va a ver la frase del dia */}
        <div className="bg-pink-400 mx-10 p-2 h-32 lg:mx-64 shadow-xl text-center rounded-lg flex flex-col items-center justify-center text-white">
          <p>
            Frase del dia
          </p>
          <p className="text-xs mt-2">
            -autor-
          </p>
        </div>
        {/*Creamos el div que vaa albergar las estadidticas */}
        <div className="bg-pink-400 z-0 mx-10 mt-10 p-2 h-64 lg:mx-64 shadow-xl text-center rounded-lg ">
          <h1 className="text-pink-800 text-lg font-bold mt-3 mb-2">Estadísticas</h1>
          {/*este div va a contener el grid con las dos filas y dos columnas */}
          <div className="grid grid-cols-2 gap-4 m-5">
            <div>
              <p className="text-center leading-none text-white">Ventas de la semana:</p>
              <p className="text-pink-800 text-lg mt-1 font-bold">18</p>
            </div>
            <div>
              <p className="text-center leading-none text-white">Inversión necesaria:</p>
              <p className="text-pink-800 text-lg mt-1 font-bold">$1567</p>
            </div>
            <div className="mt-5">
              <p className="text-center leading-none text-white">Por cobrar:</p>
              <p className="text-pink-800 text-lg mt-1 font-bold">$3500</p>
            </div>
            <div className="mt-5">
              <p className="text-center leading-none text-white">Utilidad:</p>
              <p className="text-pink-800 text-lg mt-1 font-bold">$1300</p>
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
