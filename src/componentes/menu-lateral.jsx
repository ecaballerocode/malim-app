import React from "react";
import { IoMdHome, IoMdAddCircleOutline } from "react-icons/io";
import { MdOutlineInventory, MdInventory, MdOutlineShoppingCart } from "react-icons/md";
import { GiClothes } from "react-icons/gi";
import { Link } from "react-router-dom";
import { FaRegImage } from "react-icons/fa";
import { GoPackageDependents } from "react-icons/go";
import { ImStatsDots } from "react-icons/im";



function MenuLateral({menuAbierto}){
return(
    <div class={`fixed w-1/2 lg:w-1/4 top-5 shadow-xl border-r-4 border-pink-300 z-30 left-0 h-full bg-pink-200 transform ${menuAbierto ? "translate-x-0": "-translate-x-full"} transition-transform duration-300 ease-in-out`}>
        <div className="my-10 ml-5 flex flex-col">
        <button className="text-pink-800">
            <Link to="/Pedidos" className="flex flex-row">
                <MdOutlineInventory className="text-xl"/>
                <span className="ml-2">Pedidos</span>
            </Link>
        </button>
        <button className="text-pink-800">
            <Link to="/MarcaAgua" className="flex flex-row">
                <FaRegImage  className="text-xl"/>
                <span className="ml-2">Marca de agua</span>
            </Link>
        </button>
        <button className="text-pink-800">
            <Link to="/Compras" className="flex flex-row">
                <MdOutlineShoppingCart className="text-xl"/>
                <span className="ml-2">Compras</span>
            </Link>
        </button>
        <button className="text-pink-800">
            <Link to="/Entregas" className="flex flex-row">
                <GoPackageDependents className="text-xl"/>
                <span className="ml-2">Entregas</span>
            </Link>
        </button>
        <button className="text-pink-800">
            <Link to="/Estadisticas" className="flex flex-row">
                <ImStatsDots className="text-xl"/>
                <span className="ml-2">Estadísticas</span>
            </Link>
        </button>
        </div>
    </div>   
)
}

export default MenuLateral;