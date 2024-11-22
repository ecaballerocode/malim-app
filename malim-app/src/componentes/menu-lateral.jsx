import React from "react";
import { IoMdHome, IoMdAddCircleOutline } from "react-icons/io";
import { MdOutlineInventory, MdInventory } from "react-icons/md";
import { GiClothes } from "react-icons/gi";


function MenuLateral({menuAbierto}){
return(
    <div class={`fixed w-1/2 lg:w-1/4 top-5 shadow-xl border-r-4 border-pink-300 left-0 h-full bg-pink-200 transform ${menuAbierto ? "translate-x-0": "-translate-x-full"} transition-transform duration-300 ease-in-out`}>
        <div className="my-10 ml-5">
        <button className="flex flex-row text-pink-800">
            <MdOutlineInventory className="text-2xl"/>
            <span className="text-xl ml-2">Pedidos</span>
        </button>
        </div>
    </div>   
)
}

export default MenuLateral;