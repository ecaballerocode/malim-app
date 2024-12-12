import React, {useState} from 'react'
import Header from "./header";
import MenuLateral from "./menu-lateral";
import Footer from "./footer";
import MenuAñadir from "./menu-añadir";
import { addDoc, collection } from 'firebase/firestore';
import { db } from "../credenciales";




function FormAñadirCliente() {

    const [menuAbierto, setmenuAbierto] = useState(false);
    const [menuAñadir, setmenuAñadir] = useState(false);
    const [cliente, setCliente] = useState({})

    const manejadorMenu = () => {
        setmenuAbierto(!menuAbierto);
      };
    
      const manejadorMenuAñadir = () => {
        setmenuAñadir(!menuAñadir);
      };

      const handleSubmit = async (e) => {
        e.preventDefault();
    
        try {
            await addDoc(collection(db, "clientes"), cliente);
            alert("Cliente agregado con exito")
            setCliente("");
            
        } catch (error) {
            alert("Error al agregar al cliente")
        }
      };

      const handleChange = (e) =>{
        const {name, value} = e.target;
        setCliente({[name]:value})
      }
    
  return (
    <div className='bg-pink-100 min-h-screen'>
        <header className="relative">
        <Header menuAbierto={menuAbierto} manejadorMenu={manejadorMenu} />
        <h1 className="fixed inset-x-0 transform pt-2 text-center pointer-events-none text-xl font-bold text-white z-50">Añadir cliente</h1>
      </header>
      <div>
        <MenuLateral menuAbierto={menuAbierto} />
      </div>
      <div>
        <MenuAñadir menuAñadir={menuAñadir} />
      </div>
      <main className="flex flex-center justify-center pt-10">
        <form onSubmit={handleSubmit}
          className="lg:border-2 lg:shadow-xl px-5 lg:py-2 pb-20 rounded-lg border-pink-200 mt-10 max-w-lg w-full">
            <div className='flex flex-col'>
                <label className="px-2 text-pink-800 font-bold">Cliente:</label>
                <input className="px-2 rounded-md h-8 shadow-sm" type="text" name='cliente' onChange={handleChange} placeholder='Agrega un cliente' />
            </div>
            <button type='submit' className="mt-2 py-2 px-4 bg-pink-400 text-white rounded-md cursor-pointer hover:bg-pink-200"
            >
                Guardar cliente
            </button>
        </form>
      </main>
      <Footer manejadorMenuAñadir={manejadorMenuAñadir}/>
    </div>
  )
}

export default FormAñadirCliente;