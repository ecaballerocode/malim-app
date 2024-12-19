import React, { useEffect } from 'react'
import { useState } from 'react';
import Header from "./header";
import MenuLateral from "./menu-lateral";
import Footer from "./footer";
import MenuAñadir from "./menu-añadir";
import { db } from "../credenciales";
import { collection, getDocs } from "firebase/firestore";

function Estadisticas() {

  const [menuAbierto, setmenuAbierto] = useState(false);
  const [menuAñadir, setmenuAñadir] = useState(false);
  const [pedidos, setPedidos] = useState([]);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  
  
  
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


  const manejadorMenu = () => {
    setmenuAbierto(!menuAbierto);
  };

  const manejadorMenuAñadir = () => {
    setmenuAñadir(!menuAñadir);
  };


  const filtrarPedidos = () => {
    return pedidos.filter((doc) => {
      const pedidoFecha = new Date(doc.fecha);
      const inicio = fechaInicio ? new Date(fechaInicio) : null;
      const fin = fechaFin ? new Date(fechaFin) : null;

      const coincideFecha = (!inicio || pedidoFecha >= inicio) && (!fin || pedidoFecha <= fin);


      return coincideFecha;
    });
  };

  //Funcion para sumar los costos  para calcular la inversion necesaria
  
  const inversion = () =>{
    const filtroPagadoSuma = pedidos.filter(doc => doc.pagado === false || doc.pagado === undefined);
    const filtroComprado = filtroPagadoSuma.filter(doc => doc.comprado === false)
    return filtroComprado.reduce((total, pedido) => total + pedido.costo, 0);
  }

  //Fncion para calcular cuanto hay po cobrar
  const porCobrar = () => {
    const filtroInventario = pedidos.filter(doc => doc.cliente !== "INVENTARIO")
    return filtroInventario.reduce((suma, doc)=> 
     suma + (doc.precio - doc.pago), 0)
}

const utilidad = () => {
    return filtrarPedidos().reduce((suma, pedido) => suma + (pedido.precio - pedido.costo), 0);
}

//Calcular el ingreso total del periodo
const ingresos = () => {
  return filtrarPedidos().reduce((suma, pedido) => {
    return suma + (pedido.pagos ? pedido.pagos.reduce((acum, pago) => acum + pago.monto, 0) : 0);
  }, 0);
};

//Calcular la inversion del periodo seleccionado
const inversionPeriodo = () =>{
  const filtroPagado = filtrarPedidos().filter(pedido => pedido.pagado || pedido.comprado);
  return filtroPagado.reduce((total, pedido) => total + pedido.costo, 0);
}

//Calcular el mejor cliente
const mejorClienteFunction = () => {
  const filtroClienteInventario = filtrarPedidos().filter(pedido => pedido.cliente !== "INVENTARIO");
  const clienteConteo = filtroClienteInventario.reduce((acc, pedido) => {
    acc[pedido.cliente] = (acc[pedido.cliente] || 0) + 1;
    return acc;
  }, {});

  // Encontrar el cliente con el mayor conteo:
  let clienteMasFrecuente = '';
  let maxConteo = 0;
  for (const cliente in clienteConteo) {
    if (clienteConteo[cliente] > maxConteo) {
      maxConteo = clienteConteo[cliente];
      clienteMasFrecuente = cliente;
    }
  }
  //Calcular los ingresos totales del mejor cliente
  const filtroMejorCliente = filtroClienteInventario.filter(cliente => cliente.cliente === clienteMasFrecuente);
  const ingresos = filtroMejorCliente.reduce((suma, pedido)=>suma + pedido.precio, 0);
  const utilidad = filtroMejorCliente.reduce((suma, pedido)=>suma + (pedido.precio - pedido.costo), 0);

  //Contar la cantidad de propiedades del objeto que contiene a los clientes
  const cantidadClientes = Object.keys(clienteConteo);


  return { cliente: clienteMasFrecuente, prendas: maxConteo, ingresosTotales: ingresos, utilidad: utilidad, cantidadClientes: cantidadClientes.length };
};

//Funcion para estadisticas de inventario
const inventarioFunction = () => {
  const filtro = pedidos.filter(pedido => pedido.cliente === "INVENTARIO");
  const sumaInventario = filtro.reduce((suma, pedido) => suma + pedido.precio, 0);
  const sumaInventarioInversion = filtro.reduce((suma, pedido)=>suma + pedido.costo, 0);

  return {suma: sumaInventario, cantidad: filtro.length, inversion: sumaInventarioInversion}
} 

//Funcion para calcular el precio promedio
const precioPromedio = () =>{
  const suma = filtrarPedidos().reduce((suma, pedido) => suma + pedido.precio, 0);
  return Math.round(suma / filtrarPedidos().length);
}

//Funcion para calcular la mejor categoria
const mejorCategoria = () => {
  const filtroClienteInventario = filtrarPedidos().filter(pedido => pedido.cliente !== "INVENTARIO");
  const categoriaConteo = filtroClienteInventario.reduce((suma, pedido) => {
    suma[pedido.categoria] = (suma[pedido.categoria] || 0) + 1;
    return suma;
  }, {});

  let catMasFrecuente = '';
  let maxConteo = 0;
  for (const categoria in categoriaConteo) {
    if (categoriaConteo[categoria] > maxConteo) {
      maxConteo = categoriaConteo[categoria];
      catMasFrecuente = categoria;
    }
  }
  return {mejorCat: catMasFrecuente}
}

//Funcion para calcular la talla mas vedida
const mejorTalla = () => {
  const filtroClienteInventario = filtrarPedidos().filter(pedido => pedido.cliente !== "INVENTARIO");
  const tallaConteo = filtroClienteInventario.reduce((suma, pedido) => {
    suma[pedido.talla] = (suma[pedido.talla] || 0) + 1;
    return suma;
  }, {});

  let tallaMasFrecuente = '';
  let maxConteo = 0;
  for (const talla in tallaConteo) {
    if (tallaConteo[talla] > maxConteo) {
      maxConteo = tallaConteo[talla];
      tallaMasFrecuente = talla;
    }
  }
  return {mejorTalla: tallaMasFrecuente}
}

  return (
    <div className="bg-pink-100 min-h-screen">
      <header className="relative">
        <Header menuAbierto={menuAbierto} manejadorMenu={manejadorMenu} />
        <h1 className="fixed inset-x-0 transform pt-2 text-center pointer-events-none text-xl font-bold text-white z-50">Estadísticas</h1>
      </header>
      <div>
        <MenuLateral menuAbierto={menuAbierto} />
      </div>
      <div>
        <MenuAñadir menuAñadir={menuAñadir} />
      </div>
      <main className="pb-16 pt-10">
        {/* Sección de filtros y barra de búsqueda */}
        <div className="flex justify-center w-full">
          {/* Filtros de proveedor y categoría */}
          <div className="lg:p-5 px-5 pt-2 flex flex-row items-center">
              <label className="text-xs text-pink-800">Desde:</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="h-10 w-20 rounded-lg p-2 bg-white border-gray-200 border-2"
              />
              <label className="text-xs text-pink-800 ml-2">Hasta:</label>
              <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="h-10 w-20 rounded-lg p-2 border-gray-200 border-2 bg-white"
              />
            </div>
        </div>
        {/* Renderización de la pagina */}
        <div className='grid lg:grid-cols-2 grid-cols-1'>
            <div className="bg-pink-400 z-0 mx-5 mt-2 p-2 h-64 shadow-xl text-center rounded-lg ">
            <h1 className="text-pink-800 text-lg font-bold mt-3 mb-2">Generales</h1>
            {/*este div va a contener el grid con las dos filas y dos columnas */}
                <div className="grid grid-cols-2 gap-4 m-5">
                    <div>
                        <p className="text-center leading-none text-white">Ventas del periodo:</p>
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
                        <p className="text-center leading-none text-white">Utilidad del periodo:</p>
                        <p className="text-pink-800 text-lg mt-1 font-bold">${utilidad()}</p>
                    </div>
                </div>
            </div>
            <div className="bg-pink-100 z-0 mx-5 mt-2 p-2 h-64 shadow-xl text-center rounded-lg border-pink-400 border-2">
            <h1 className="text-pink-800 text-lg font-bold mt-3 mb-2">Finanzas</h1>
            {/*este div va a contener el grid con las dos filas y dos columnas */}
                <div className="grid grid-cols-2 gap-4 m-5">
                    <div>
                        <p className="text-center text-pink-600 leading-none text-white">Ingresos del periodo:</p>
                        <p className="text-pink-800 text-lg mt-1 font-bold">${ingresos()}</p>
                    </div>
                    <div>
                        <p className="text-center text-pink-600 leading-none text-white">Inversión del periodo:</p>
                        <p className="text-pink-800 text-lg mt-1 font-bold">${inversionPeriodo()}</p>
                    </div>
                    <div className="mt-5">
                        <p className="text-center text-pink-600 leading-none text-white">Utilidad bruta:</p>
                        <p className="text-pink-800 text-lg mt-1 font-bold">${ingresos()-inversionPeriodo()}</p>
                    </div>
                    <div className="mt-5">
                        <p className="text-center text-pink-600 leading-none text-white">Margen de utilidad:</p>
                        <p className="text-pink-800 text-lg mt-1 font-bold">%{((ingresos()-inversionPeriodo())/ingresos())*100}</p>
                    </div>
                </div>
            </div>
            <div className="lg:bg-pink-100 bg-pink-400 z-0 mx-5 mt-2 p-2 h-64 shadow-xl text-center rounded-lg lg:border-pink-400 border-2">
            <h1 className="text-pink-800 text-lg font-bold mt-3 mb-2">Mejor cliente</h1>
            {/*este div va a contener el grid con las dos filas y dos columnas */}
                <div className="grid grid-cols-2 gap-4 m-5">
                    <div>
                        <p className="text-center lg:text-pink-600 leading-none text-white">Nombre:</p>
                        <p className="text-pink-800 text-lg mt-1 font-bold">{mejorClienteFunction().cliente}</p>
                    </div>
                    <div>
                        <p className="text-center lg:text-pink-600 leading-none text-white">Prendas compradas:</p>
                        <p className="text-pink-800 text-lg mt-1 font-bold">{mejorClienteFunction().prendas}</p>
                    </div>
                    <div className="mt-5">
                        <p className="text-center lg:text-pink-600 leading-none text-white">Ingresos generados:</p>
                        <p className="text-pink-800 text-lg mt-1 font-bold">${mejorClienteFunction().ingresosTotales}</p>
                    </div>
                    <div className="mt-5">
                        <p className="text-center lg:text-pink-600 leading-none text-white">Utilidad generada:</p>
                        <p className="text-pink-800 text-lg mt-1 font-bold">${mejorClienteFunction().utilidad}</p>
                    </div>
                </div>
            </div>
            <div className="bg-pink-100 lg:bg-pink-400 z-0 mx-5 mt-2 p-2 h-64 shadow-xl text-center rounded-lg border-pink-400 border-2">
            <h1 className="text-pink-800 text-lg font-bold mt-3 mb-2">Inventario</h1>
            {/*este div va a contener el grid con las dos filas y dos columnas */}
                <div className="grid grid-cols-2 gap-4 m-5">
                    <div>
                        <p className="text-center text-pink-600 leading-none lg:text-white">Cantidad de prendas:</p>
                        <p className="text-pink-800 text-lg mt-1 font-bold">{inventarioFunction().cantidad}</p>
                    </div>
                    <div>
                        <p className="text-center text-pink-600 leading-none lg:text-white">Valor de inventario:</p>
                        <p className="text-pink-800 text-lg mt-1 font-bold">${inventarioFunction().suma}</p>
                    </div>
                    <div className="mt-5">
                        <p className="text-center text-pink-600 leading-none lg:text-white">Inversion en inventario:</p>
                        <p className="text-pink-800 text-lg mt-1 font-bold">${inventarioFunction().inversion}</p>
                    </div>
                    <div className="mt-5">
                        <p className="text-center text-pink-600 leading-none lg:text-white">Utilidad en inventario:</p>
                        <p className="text-pink-800 text-lg mt-1 font-bold">${inventarioFunction().suma - inventarioFunction().inversion}</p>
                    </div>
                </div>
            </div>
            <div className="bg-pink-100 bg-pink-400 z-0 mx-5 mt-2 p-2 h-64 shadow-xl text-center rounded-lg border-pink-400 border-2">
            <h1 className="text-pink-800 text-lg font-bold mt-3 mb-2">Ventas</h1>
            {/*este div va a contener el grid con las dos filas y dos columnas */}
                <div className="grid grid-cols-2 gap-4 m-5">
                    <div>
                        <p className="text-center  leading-none text-white">Categoria más vendida:</p>
                        <p className="text-pink-800 text-lg mt-1 font-bold">{mejorCategoria().mejorCat}</p>
                    </div>
                    <div>
                        <p className="text-center  leading-none text-white">Talla más vendida:</p>
                        <p className="text-pink-800 text-lg mt-1 font-bold">{mejorTalla().mejorTalla}</p>
                    </div>
                    <div className="mt-5">
                        <p className="text-center  leading-none text-white">Cantidad de clientes:</p>
                        <p className="text-pink-800 text-lg mt-1 font-bold">{mejorClienteFunction().cantidadClientes}</p>
                    </div>
                    <div className="mt-5">
                        <p className="text-center  leading-none text-white">Precio promedio:</p>
                        <p className="text-pink-800 text-lg mt-1 font-bold">${precioPromedio()}</p>
                    </div>
                </div>
            </div>
        </div>
      </main>
      <Footer manejadorMenuAñadir={manejadorMenuAñadir}/>
    </div>
  )
}

export default Estadisticas;