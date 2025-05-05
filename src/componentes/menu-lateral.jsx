import React from "react";
import { IoCashSharp } from "react-icons/io5";
import { MdOutlineInventory, MdOutlineShoppingCart } from "react-icons/md";
import { Link } from "react-router-dom";
import { FaRegImage } from "react-icons/fa";
import { GoPackageDependents } from "react-icons/go";
import { ImStatsDots } from "react-icons/im";
import { CiTextAlignLeft } from "react-icons/ci";
import { FaPerson } from "react-icons/fa6";

function MenuLateral({ menuAbierto }) {
  return (
    <div
      class={`fixed w-1/2 lg:w-1/4 top-5 shadow-xl border-r-4 border-pink-300 z-30 left-0 h-full bg-pink-200 transform ${
        menuAbierto ? "translate-x-0" : "-translate-x-full"
      } transition-transform duration-300 ease-in-out`}
    >
      <div className="my-10 ml-5 flex flex-col">
        <button className="text-pink-800">
          <Link to="/Pedidos" className="flex flex-row">
            <MdOutlineInventory className="text-xl" />
            <span className="ml-2">Pedidos</span>
          </Link>
        </button>
        <button className="text-pink-800">
          <Link to="/MarcaAgua" className="flex flex-row">
            <FaRegImage className="text-xl" />
            <span className="ml-2">Marca de agua</span>
          </Link>
        </button>
        <button className="text-pink-800">
          <Link to="/Compras" className="flex flex-row">
            <MdOutlineShoppingCart className="text-xl" />
            <span className="ml-2">Compras</span>
          </Link>
        </button>
        <button className="text-pink-800">
          <Link to="/Entregas" className="flex flex-row">
            <GoPackageDependents className="text-xl" />
            <span className="ml-2">Entregas</span>
          </Link>
        </button>
        <button className="text-pink-800">
          <Link to="/Estadisticas" className="flex flex-row">
            <ImStatsDots className="text-xl" />
            <span className="ml-2">Estadísticas</span>
          </Link>
        </button>
        <button className="text-pink-800">
          <Link to="/PorCobrar" className="flex flex-row">
            <IoCashSharp className="text-xl" />
            <span className="ml-2">Por cobrar</span>
          </Link>
        </button>
        <button className="text-pink-800">
          <Link to="/Descripciones" className="flex flex-row">
            <CiTextAlignLeft className="text-xl" />
            <span className="ml-2">Base de datos</span>
          </Link>
        </button>
        <button className="text-pink-800">
          <Link to="/Clientes" className="flex flex-row">
            <FaPerson className="text-xl" />
            <span className="ml-2">Clientes</span>
          </Link>
        </button>
      </div>
    </div>
  );
}

export default MenuLateral;
