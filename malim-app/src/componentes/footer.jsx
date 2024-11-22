import React from "react";
import { IoMdHome, IoMdAddCircleOutline } from "react-icons/io";
import { MdOutlineInventory, MdInventory } from "react-icons/md";
import { GiClothes } from "react-icons/gi";


function Footer({manejadorMenuAñadir}){

    return(
        <footer className=" text-white bg-pink-400 fixed bottom-0 w-full justify-around items-center">
            {/*Botones laterales */}
            <div className="flex justify-around px-8 w-full relative">
                {/*Botones izquierda */}
                <div className="flex space-x-4 justify-around mr-10">
                    {/*Boton inicio */}
                    <button className="flex flex-col items-center w-16">
                        <IoMdHome className="text-3xl"/>
                        <span className="text-xs">Inicio</span>
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
                <div className="flex space-x-4 justify-around ml-10">
                    {/*Boton inventario */}
                    <button className="flex flex-col items-center w-16">
                        <MdInventory className="text-3xl"/>
                        <span className="text-xs">Inventario</span>
                    </button>
                    <button className="flex flex-col items-center w-16">
                        <GiClothes className="text-3xl"/>
                        <span className="text-xs">Disponible</span>
                    </button>
                </div>
            </div>
        </footer>
    )
}

export default Footer;