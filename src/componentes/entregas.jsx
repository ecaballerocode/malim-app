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


function Entregas() {

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
        const docsFilter = docsArray.filter(doc => doc.entregado === false);
        setPedidos(docsFilter);
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

  
  return (
    <div className="bg-pink-100 min-h-screen">
      <header className="relative">
        <Header menuAbierto={menuAbierto} manejadorMenu={manejadorMenu} />
        <h1 className="fixed inset-x-0 transform pt-2 text-center pointer-events-none text-xl font-bold text-white z-50">Prendas por entregar</h1>
      </header>
      <div>
        <MenuLateral menuAbierto={menuAbierto} />
      </div>
      <div>
        <MenuAñadir menuAñadir={menuAñadir} />
      </div>
      <main className="pb-16 pt-10">
        <div className="productos-container bg-pink-100 grid grid-cols-2 lg:grid-cols-5 lg:gap-3 gap-3 mx-5 mb-5">
          {pedidos.map((doc) => (
            <div key={doc.id} className="h-auto border-2 rounded-lg shadow-xl border-pink-200">
              <div className='bg-pink-400 text-white text-center h-auto w-full'>
                <p className='font-bold'>{doc.cliente}</p>
              </div>
              <div className="lg:h-64 h-40 w-full">
                {doc.fotos ? (
                  <img
                    key={doc.fotos}
                    src={doc.fotos}
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
                <div className="flex flex-row justify-between">
                  <p className="lg:text-sm">{doc.talla}</p>
                </div>
                <div className="flex flex-row justify-between">
                  <p className="lg:text-sm text-pink-700">${doc.precio}</p>
                  <p className="lg:text-sm">{doc.pago}</p>
                  <p className="lg:text-sm">{doc.precio - doc.pago}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer manejadorMenuAñadir={manejadorMenuAñadir}/>
    </div>
  )
}

export default Entregas;