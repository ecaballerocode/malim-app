import React, {useState} from 'react'
import Header from "./header";
import MenuLateral from "./menu-lateral";
import Footer from "./footer";
import MenuAñadir from "./menu-añadir";
import { addDoc, collection } from 'firebase/firestore';
import { db } from "../credenciales";




function FormAñadirProveedor() {

    const [menuAbierto, setmenuAbierto] = useState(false);
    const [menuAñadir, setmenuAñadir] = useState(false);
    const [proveedor, setProveedor] = useState({})

    const manejadorMenu = () => {
        setmenuAbierto(!menuAbierto);
      };
    
      const manejadorMenuAñadir = () => {
        setmenuAñadir(!menuAñadir);
      };

      const handleSubmit = async (e) => {
        e.preventDefault();
    
        try {
            await addDoc(collection(db, "proveedores"), proveedor);
            alert("Proveedor agregado con exito")
            setProveedor("");
        } catch (error) {
            alert("Error al agregar al proveedor")
        }
      };

      const handleChange = (e) =>{
        const {name, value} = e.target;
        setProveedor({[name]:value})
      }
    
  return (
    <div>
        <header className="relative">
        <Header menuAbierto={menuAbierto} manejadorMenu={manejadorMenu} />
        <h1 className="fixed inset-x-0 transform pt-2 text-center pointer-events-none text-xl font-bold text-white z-50">Añadir proveedor</h1>
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
            <div>
                <label>Proveedor</label>
                <input type="text" name='proveedor' onChange={handleChange} placeholder='Agrega un proveedor' />
            </div>
            <button type='submit'               className="mt-2 py-2 px-4 bg-pink-400 text-white rounded-md cursor-pointer hover:bg-pink-200"
            >
                Guardar proveedor
            </button>
        </form>
      </main>
      <Footer manejadorMenuAñadir={manejadorMenuAñadir}/>
    </div>
  )
}

export default FormAñadirProveedor;