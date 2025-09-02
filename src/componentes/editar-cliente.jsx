// editar-cliente.js
import React, { useEffect, useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import Header from "./header";
import Footer from "./footer";
import { doc, updateDoc, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "../credenciales";

function EditarCliente() {
  
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [cliente, setCliente] = useState({
    cliente: "",
    telefono: "",
    cumpleaños: "",
  });

  useEffect(() => {
    const fetchCliente = async () => {
      if (location.state?.cliente) {
        setCliente(location.state.cliente);
      } else {
        const docRef = doc(db, "clientes", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCliente({ id: docSnap.id, ...docSnap.data() });
        } else {
          console.error("No se encontró el cliente");
        }
      }
    };
    fetchCliente();
  }, [id, location.state]);

  const handleChange = (e) => {
    setCliente({ ...cliente, [e.target.name]: e.target.value });
  };

  const handleGuardar = async () => {
    try {
      const docRef = doc(db, "clientes", id);
      await updateDoc(docRef, {
        cliente: cliente.cliente,
        telefono: cliente.telefono,
        cumpleaños: cliente.cumpleaños,
      });
      alert("Cliente actualizado con éxito");
      navigate("/clientes");
    } catch (error) {
      console.error("Error al actualizar cliente", error);
    }
  };

  const handleDelete = async () => {
      const confirmDelete = window.confirm("¿Estás seguro de que deseas eliminar este cliente?");
      if (!confirmDelete) return;
      try {
        // Eliminar el documento de Firebase
        await deleteDoc(doc(db, "clientes", id));
        alert("Cliente eliminado con exito");
        navigate("/Clientes"); // Redirige al usuario a la página principal o lista
      } catch (error) {
        console.error("Error al eliminar el pedido:", error);
        alert("Hubo un error al eliminar el pedido");
      }
    };

  return (
    <div className="min-h-screen bg-pink-100">
      <Header />
      <main className="pt-24 px-4 pb-16">
        <h2 className="text-xl font-bold mb-4 text-center text-pink-600">Editar Cliente</h2>
        <div className="space-y-4 max-w-md mx-auto">
          <input
            type="text"
            name="cliente"
            value={cliente.cliente}
            onChange={handleChange}
            placeholder="Nombre del cliente"
            className="w-full px-4 py-2 border rounded-md shadow-sm"
          />
          <input
            type="text"
            name="telefono"
            value={cliente.telefono}
            onChange={handleChange}
            placeholder="Teléfono"
            className="w-full px-4 py-2 border rounded-md shadow-sm"
          />
          <input
            type="date"
            name="cumpleaños"
            value={cliente.cumpleaños}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-md shadow-sm"
          />
          <button
            onClick={handleGuardar}
            className="w-full bg-pink-400 text-white py-2 rounded-lg hover:bg-pink-600"
          >
            Guardar Cambios
          </button>
          <button
            onClick={handleDelete}
            className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-pink-600"
          >
            Eliminar cliente
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default EditarCliente;
