import React from "react";
import { IoMdHome, IoMdAddCircleOutline } from "react-icons/io";
import { MdOutlineInventory, MdInventory } from "react-icons/md";
import { GiClothes } from "react-icons/gi";
import { Link } from "react-router-dom";


function Footer({manejadorMenuAñadir}){

    return(
        <footer className="z-50 text-white bg-pink-400 fixed bottom-0 w-full justify-around items-center">
            {/*Botones laterales */}
            <div className="flex justify-around px-8 relative">
                {/*Botones izquierda */}
                <div className="flex justify-between">
                    {/*Boton inicio */}
                    <button className="flex flex-col items-center w-16">
                        <Link to="/">
                            <IoMdHome className="text-3xl"/>
                            <span className="text-xs">Inicio</span>
                        </Link>                       
                    </button>
                    <button className="flex flex-col items-center w-16">
                        <MdOutlineInventory className="text-3xl"/>
                        <span className="text-xs">Pedidos</span>
                    </button>
                </div>
                <div className="relative flex justify-center">
                    <button onClick={manejadorMenuAñadir} className="absolute border-pink-600 border-2 shadow-lg text-4xl rounded-full -top-10 bg-pink-400 h-16 w-16 flex transform -translate-y-5 justify-center items-center">
                        <IoMdAddCircleOutline />
                    </button>
                </div>
                <div className="flex justify-between">
                    {/*Boton inventario */}
                    <button className="flex flex-col items-center w-16">
                        <MdInventory className="text-3xl"/>
                        <span className="text-xs">Inventario</span>
                    </button>
                    <button className="flex flex-col items-center w-16">
                        <Link to="/Disponible">
                            <GiClothes className="text-3xl"/>
                            <span className="text-xs">Disponible</span>
                        </Link>
                    </button>
                </div>
            </div>
        </footer>
    )
}

export default Footer;