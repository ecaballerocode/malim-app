import React from "react";
import { FaTshirt } from "react-icons/fa";
import { IoCashSharp } from "react-icons/io5";
import { MdOutlineInventory, MdPlace } from "react-icons/md";
import { AiOutlineShop } from "react-icons/ai";
import { FaPerson } from "react-icons/fa6";
import { Link } from "react-router-dom";

function MenuAñadir({menuAñadir}){

    return(
        <div class={`fixed flex justify-center z-40 bottom-0 w-full shadow-xl h-64 transform ${menuAñadir ? "translate-y-0": "translate-y-full"} transition-transform duration-300 ease-in-out`}>
            <div className="bg-black text-center h-full w-4/5 border-t-4 border-black rounded-xl z-50 opacity-75">
                <div className="w-full">
                    <p className="text-white text-m">Añadir</p>
                </div>
                {/*div con el grid de todos los botones de añadir */}
                <div className="grid grid-cols-3 gap-3 mt-2">
                    <button className="text-white" >
                        <Link to="/FormAñadirDisponible" className="text-center flex items-center flex-col">
                            <FaTshirt className="text-3xl"/>
                            <p className="text-xs">Disponible</p>
                        </Link>
                    </button>
                    <button className="text-white text-center flex items-center flex-col">
                        <Link to="/PorCobrar" className="text-center flex items-center flex-col">
                            <IoCashSharp className="text-3xl"/>
                            <p className="text-xs">Pago</p>
                        </Link>
                    </button>
                    <button className="text-white text-center flex items-center flex-col">
                        <Link className="text-center flex items-center flex-col">
                            <MdOutlineInventory className="text-3xl"/>
                            <p className="text-xs">Pedido</p>
                        </Link>
                    </button>
                    <button className="text-white mt-5 text-center flex items-center flex-col">
                        <Link to="/FormAñadirProveedor" className="text-center flex items-center flex-col">
                            <AiOutlineShop className="text-3xl"/>
                            <p className="text-xs">Proveedor</p>
                        </Link>
                    </button>
                    <button className="text-white mt-5 text-center flex items-center flex-col">
                        <Link to="/FormAñadirCliente" className="text-center flex items-center flex-col">
                            <FaPerson className="text-3xl"/>
                            <p className="text-xs">Cliente</p>
                        </Link>
                    </button>
                    <button className="text-white mt-5 text-center flex items-center flex-col">
                        <Link className="text-center flex items-center flex-col">
                            <MdPlace className="text-3xl"/>
                            <p className="text-xs">Lugar</p>
                        </Link>
                    </button>
                </div>
            </div>
        </div>
    
    )
}

export default MenuAñadir;