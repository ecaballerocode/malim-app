import React from "react";
import { IoMenu } from "react-icons/io5";

//Creacion del componente header

function Header({manejadorMenu}){



    return(
        <div>
            <header class="bg-pink-400 p-3 fixed z-40 top-0 left-0 w-full">
                <IoMenu class="text-white" onClick={manejadorMenu}/>
            </header>
        </div>
    )
}

export default Header;