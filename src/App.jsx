import React, { useState, useEffect } from "react";
import Header from "./componentes/header";
import MenuLateral from "./componentes/menu-lateral";
import Footer from "./componentes/footer";
import MenuAñadir from "./componentes/menu-añadir";
import logo from "./logo-negro.png";
import arregloFrases from "./arregloFrases";
import { FaShare } from "react-icons/fa";
import { db } from "./credenciales";
import { collection, getDocs } from "firebase/firestore";


function App() {

  //Estado para manejar el menu laeral
  const [menuAbierto, setmenuAbierto] = useState(false);
  //Estado que guarda la frase del dia
  //Estado para controlar el menu añadir
  const [menuAñadir, setmenuAñadir] = useState(false);
  const [pedidos, setPedidos] = useState([]);
  const [clientes, setClientes] = useState([]);


  //creamos el useffect que va a pedir la frase a la api cuando se renderice el componente

  useEffect(() => {
    const fetchDatos = async () => {
      try {
        const pedidosSnapshot = await getDocs(collection(db, "pedidos"));
        const clientesSnapshot = await getDocs(collection(db, "clientes"));

        const pedidosArray = pedidosSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        pedidosArray.sort((a, b) => b.fecha.localeCompare(a.fecha));

        const clientesArray = clientesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setPedidos(pedidosArray);
        setClientes(clientesArray);
      } catch (error) {
        console.error("Error al cargar los documentos", error);
      }
    };

    fetchDatos();
  }, []);


  //funcion que maneja el estado del menu lateral
  const manejadorMenu = () => {
    setmenuAbierto(!menuAbierto);
  }

  //funcion que maneja el estado del menu añadir
  const manejadorMenuAñadir = () => {
    setmenuAñadir(!menuAñadir);
  }

  const cumpleañerosHoy = () => {
    const hoy = new Date();
    const diaActual = hoy.getDate();
    const mesActual = hoy.getMonth() + 1; // ¡Los meses van del 0 al 11!

    return clientes.filter(cliente => {
      if (!cliente.cumpleaños) return false;
      const [anio, mes, dia] = cliente.cumpleaños.split("-").map(Number);
      return dia === diaActual && mes === mesActual;
    });
  };


  //Funciones para obtener el idice de la frase del dia

  const getIndexForToday = () => {
    const today = new Date();
    const startDate = new Date(1970, 0, 1); // Fecha fija
    const diff = today - startDate; // Diferencia en milisegundos
    const oneDay = 1000 * 60 * 60 * 24; // Milisegundos en un día
    const totalDays = Math.floor(diff / oneDay); // Días totales desde la fecha fija
    return totalDays % arregloFrases.length; // Índice dentro del rango
  };

  const [fraseDelDia, setFraseDelDia] = useState("");

  useEffect(() => {
    const index = getIndexForToday();
    setFraseDelDia(arregloFrases[index]);
  }, [arregloFrases]);

  //Funcion para enviar la frase por whatsapp

  const enviarWhatsapp = (fraseDelDia) => {
    const url = `https://wa.me/?text=${encodeURIComponent(fraseDelDia)}`;
    window.open(url, "_blank");
  }

  const filtrarPedidos = () => {
    return pedidos.filter((pedido) => pedido.comprado === false);
  }

  const inversion = () => {
  const filtroPagadoSuma = pedidos.filter(doc => doc.pagado === false || doc.pagado === undefined);
  const filtroComprado = filtroPagadoSuma.filter(doc => doc.comprado === false);
  return filtroComprado.reduce((total, pedido) => total + Number(pedido.costo || 0), 0);
};

  //Fncion para calcular cuanto hay po cobrar
  const porCobrar = () => {
    const filtroInventario = pedidos.filter(doc => doc.cliente !== "INVENTARIO")
    return filtroInventario.reduce((suma, doc) =>
      suma + (doc.precio - doc.pago), 0)
  }

  const utilidad = () => {
    return filtrarPedidos().reduce((suma, pedido) => suma + (pedido.precio - pedido.costo), 0);
  }


  return (
    <div className="h-screen flex flex-col overflow-hidden bg-pink-100 pb-16 pt-10">
      <header>
        <Header menuAbierto={menuAbierto} manejadorMenu={manejadorMenu} />
      </header>
      <div>
        <MenuLateral menuAbierto={menuAbierto} />
      </div>
      <div >
        <MenuAñadir menuAñadir={menuAñadir} />
      </div>
      {/*creamos el contenedor pricpal */}
      <main className="flex-1 overflow-y-auto px-2">
        <div className="flex justify-center w-full h-16">
          {/*Imagen del logotipo */}
          <img src={logo} alt="logo de malim" />
        </div>
        {/*Div en el que se va a ver la frase del dia */}
        <div className="bg-pink-400 mx-10 p-2 h-32 lg:mx-64 shadow-xl text-center rounded-lg flex flex-col items-center justify-center relative text-white">
          <p className="flex-grow font-bold mt-10">{fraseDelDia}</p>
          <div className="flex flex-row mt-auto justify-end w-full">
            <button className="text-pink-100 mx-3 px-2" onClick={() => enviarWhatsapp(fraseDelDia)}>
              <FaShare className="text-xl" />
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
        {/* Lista de cumpleaños del día */}
        {cumpleañerosHoy().length > 0 && (
          <div className="bg-pink-300 z-0 mx-10 mt-10 p-4 lg:mx-64 shadow-xl text-center rounded-lg">
            <h2 className="text-white text-lg font-bold mb-4">🎉 Cumpleañeros de hoy</h2>
            <ul className="divide-y divide-pink-200">
              {cumpleañerosHoy().map((cliente) => (
                <li key={cliente.id} className="py-2 flex justify-between items-center text-white px-4">
                  <span className="font-medium">{cliente.cliente}</span>
                  <span className="text-sm italic">
                    🎂 {cliente.cumpleaños}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>

      <div>
        <Footer manejadorMenuAñadir={manejadorMenuAñadir} />
      </div>
    </div>
  );
}

export default App;
