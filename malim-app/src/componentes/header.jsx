import React from "react";
import { IoMenu } from "react-icons/io5";

//Creacion del componente header

function Header({manejadorMenu}){



    return(
        <div className="pt-0">
            <header class="bg-pink-400 p-3 relative top-0 left-0 w-full z-50 text-xl">
                <IoMenu class="text-white" onClick={manejadorMenu}/>
            </header>
        </div>
    )
}

export default Header;