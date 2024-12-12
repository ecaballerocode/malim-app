import React, { useEffect } from 'react'
import { useState } from 'react';
import Header from "./header";
import MenuLateral from "./menu-lateral";
import Footer from "./footer";
import MenuAñadir from "./menu-añadir";
import { db } from "../credenciales";
import { collection, getDocs } from "firebase/firestore";
import Select from "react-select";
import { useNavigate } from 'react-router-dom';


function Compras() {

  const [menuAbierto, setmenuAbierto] = useState(false);
  const [menuAñadir, setmenuAñadir] = useState(false);
  const [pedidos, setPedidos] = useState([]);
  const [suma, setSuma] = useState(0)


  useEffect(() => {
    const fetchPedidos = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "pedidos"));
        const docsArray = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        const docsFilter = docsArray.filter(doc => doc.comprado === false);
        setPedidos(docsFilter);
      } catch (error) {
        console.error("Error al cargar los documentos", error);
      }
    };
    fetchPedidos();
  }, []);

  useEffect(()=>{
    const sumaTotal = pedidos.reduce((suma, doc)=> {
      return suma + doc.costo;
    }, 0)
    setSuma(sumaTotal);
  }, [pedidos]);

  const pedidosAgrupados = pedidos.reduce((acumulado, pedido)=>{
    if(!acumulado[pedido.proveedor]){
      acumulado[pedido.proveedor]=[];
    }
    acumulado[pedido.proveedor].push(pedido);
    return acumulado;
  }, {})


  const manejadorMenu = () => {
    setmenuAbierto(!menuAbierto);
  };

  const manejadorMenuAñadir = () => {
    setmenuAñadir(!menuAñadir);
  };

  
  return (
    <div className="bg-pink-100 min-h-screen">
      <header className="relative">
        <Header menuAbierto={menuAbierto} manejadorMenu={manejadorMenu} />
        <h1 className="fixed inset-x-0 transform pt-2 text-center pointer-events-none text-xl font-bold text-white z-50">Prendas por comprar</h1>
      </header>
      <div>
        <MenuLateral menuAbierto={menuAbierto} />
      </div>
      <div>
        <MenuAñadir menuAñadir={menuAñadir} />
      </div>
      <main className="pb-16 pt-10">
        <div className='flex flex-row justify-center text-center'>
          <p className='font-bold text-2xl text-pink-600'>Total:</p>
          <p className='ml-3 font-bold text-2xl text-pink-600'>${suma}</p>
        </div>
        <div className="productos-container bg-pink-100 grid grid-cols-2 lg:grid-cols-5 lg:gap-3 gap-3 mx-5 mb-5">
          {Object.keys(pedidosAgrupados).map((proveedor) => (
            <div key={proveedor} className="h-auto border-2 rounded-lg shadow-xl border-pink-200">
              <h1>{proveedor}</h1>
              <hr />
              <div className='productos container'>
                {pedidosAgrupados[proveedor].map((pedido)=>(
                  <div>
                    <div className='bg-pink-400 text-white text-center h-auto w-full'>
                    <p className='font-bold'>{pedido.proveedor}</p>
                  </div>
                  <div className="lg:h-64 h-40 w-full">
                    {pedido.fotos ? (
                      <img
                        key={pedido.fotos}
                        src={pedido.fotos}
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
                <p className="font-bold lg:text-sm text-pink-700">{pedido.prenda}</p>
                <div className="flex flex-row justify-between">
                  <p className="lg:text-sm">{pedido.talla}</p>
                  <p className="font-bold lg:text-sm text-pink-700">${pedido.costo}</p>
                </div>
                <div className="flex flex-row justify-between">
                  <p className="lg:text-sm">{pedido.color}</p>
                  <p className="lg:text-sm">{pedido.cliente}</p>
                </div>
              </div>
              </div>
                ))}
            </div>
            </div>
          ))}
        </div>
      </main>
      <Footer manejadorMenuAñadir={manejadorMenuAñadir}/>
    </div>
  )
}

export default Compras;