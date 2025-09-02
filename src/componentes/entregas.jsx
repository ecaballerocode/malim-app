import React, { useEffect, useState } from 'react';
import Header from "./header";
import MenuLateral from "./menu-lateral";
import Footer from "./footer";
import MenuAñadir from "./menu-añadir";
import { db } from "../credenciales";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";

function Entregas() {
  const [menuAbierto, setmenuAbierto] = useState(false);
  const [menuAñadir, setmenuAñadir] = useState(false);
  const [pedidos, setPedidos] = useState([]);
  const [suma, setSuma] = useState(0);
  const [busqueda, setBusqueda] = useState("");


  // Nuevo estado para el modal
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [fechaEntrega, setFechaEntrega] = useState("");

  useEffect(() => {
    const fetchPedidos = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "pedidos"));
        const docsArray = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        const docsFilter = docsArray.filter(
          (doc) => doc.entregado === false && doc.cliente !== "INVENTARIO"
        );
        setPedidos(docsFilter);
      } catch (error) {
        console.error("Error al cargar los documentos", error);
      }
    };
    fetchPedidos();
  }, []);

  useEffect(() => {
    const sumaTotal = pedidos.reduce((suma, doc) => {
      return suma + (doc.precio - doc.pago);
    }, 0);
    setSuma(sumaTotal);
  }, [pedidos]);

  const pedidosAgrupados = pedidos.reduce((acumulado, pedido) => {
    if (!acumulado[pedido.cliente]) {
      acumulado[pedido.cliente] = [];
    }
    acumulado[pedido.cliente].push(pedido);
    return acumulado;
  }, {});

  const clientesFiltrados = Object.keys(pedidosAgrupados).filter(cliente =>
    cliente.toLowerCase().includes(busqueda)
  );

  const manejadorMenu = () => {
    setmenuAbierto(!menuAbierto);
  };

  const manejadorMenuAñadir = () => {
    setmenuAñadir(!menuAñadir);
  };

  // Abrir modal
  const abrirModal = (pedido) => {
    setPedidoSeleccionado(pedido);
    setFechaEntrega(""); // limpiar la fecha
  };

  const handleBusquedaChange = (e) => {
    setBusqueda(e.target.value.toLowerCase());
  };



  // Confirmar y actualizar
  const confirmarEntrega = async () => {
    if (!fechaEntrega) {
      alert("Por favor selecciona una fecha de entrega.");
      return;
    }

    try {
      const pedidoRef = doc(db, "pedidos", pedidoSeleccionado.id);
      await updateDoc(pedidoRef, {
        entregado: true,
        fechaEntrega: fechaEntrega, // Guardamos la fecha en Firestore
      });

      // Actualizar estado local
      setPedidos((prevPedidos) =>
        prevPedidos.filter((pedido) => pedido.id !== pedidoSeleccionado.id)
      );

      setPedidoSeleccionado(null); // cerrar modal
    } catch (error) {
      console.error("Error al actualizar el pedido:", error);
      alert("Ocurrió un error al intentar actualizar el pedido.");
    }
  };

  return (
    <div className="bg-pink-100 min-h-screen">
      <header className="relative">
        <Header menuAbierto={menuAbierto} manejadorMenu={manejadorMenu} />
        <h1 className="fixed inset-x-0 transform pt-2 text-center pointer-events-none text-xl font-bold text-white z-50">
          Prendas por entregar
        </h1>
      </header>
      <MenuLateral menuAbierto={menuAbierto} />
      <MenuAñadir menuAñadir={menuAñadir} />

      <main className="pb-16 pt-10">
        <div className="flex flex-row justify-center text-center">
          <p className="font-bold text-2xl text-pink-600">Total por recuperar:</p>
          <p className="ml-3 font-bold text-2xl text-pink-600">${suma}</p>
        </div>
        <div className="flex justify-start my-4 px-5">
          <input
            type="text"
            placeholder="🔍 Buscar cliente..."
            value={busqueda}
            onChange={handleBusquedaChange}
            className="w-full max-w-md p-2 border-2 border-biege rounded-lg focus:outline-none focus:border-pink-400"
          />
        </div>

        <div className="productos-container bg-pink-100 mx-5 mb-5 space-y-5">
          {clientesFiltrados.map((cliente) => {
            const sumaCliente = pedidosAgrupados[cliente].reduce(
              (total, pedido) => total + (pedido.precio - pedido.pago),
              0
            );

            return (
              <div
                key={cliente}
                className="h-auto border-2 rounded-lg shadow-xl border-pink-200 p-3"
              >
                <div className="flex flex-row justify-between">
                  <h1 className="font-bold text-lg text-pink-600">{cliente}</h1>
                  <h1 className="font-bold text-lg text-pink-600">${sumaCliente}</h1>
                </div>

                <div className="flex overflow-x-auto space-x-3">
                  {pedidosAgrupados[cliente].map((pedido) => (
                    <div
                      key={pedido.id}
                      className="w-4/5 lg:w-1/4 h-auto flex-shrink-0 bg-pink-200 border rounded-lg shadow-sm mb-2"
                    >
                      <div className="lg:h-64 h-64 w-full">
                        {pedido.fotos ? (
                          <img
                            src={pedido.fotos}
                            alt={"Foto del producto"}
                            className="lg:h-64 h-64 w-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center h-full justify-center">
                            <p className="text-center text-gray-600 font-sm">
                              Sin fotos disponibles
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="p-2 text-pink-600">
                        <p className="font-bold lg:text-sm text-pink-700">
                          {pedido.prenda}
                        </p>
                        <div className="flex flex-row justify-between">
                          <p>{pedido.talla}</p>
                          <p className="lg:text-sm text-pink-700">{pedido.color}</p>
                        </div>
                        <div className="flex flex-row justify-between mt-2">
                          <p>{pedido.entrega}</p>
                          <p className="text-pink-700">{pedido.lugar}</p>
                        </div>
                        <div className="flex flex-row justify-between">
                          <div className="flex flex-col justify-center mt-2">
                            <p>Precio:</p>
                            <p>${pedido.precio}</p>
                          </div>
                          <div className="flex flex-col justify-center mt-2">
                            <p>Pagó:</p>
                            <p>${pedido.pago}</p>
                          </div>
                          <div className="flex flex-col justify-center mt-2">
                            <p>Resta:</p>
                            <p className="font-bold">
                              ${pedido.precio - pedido.pago}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-row justify-center px-2 pb-2">
                        <button
                          className="px-2 bg-pink-400 text-white rounded-lg mx-2 shadow-xl"
                          onClick={() => abrirModal(pedido)}
                        >
                          Entregado
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Modal */}
      {pedidoSeleccionado && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-80">
            <h2 className="text-lg font-bold text-pink-600 mb-4">Fecha de entrega</h2>
            <input
              type="date"
              className="w-full border rounded-md p-2 mb-4"
              value={fechaEntrega}
              onChange={(e) => setFechaEntrega(e.target.value)}
            />
            <div className="flex justify-end space-x-2">
              <button
                className="px-3 py-1 bg-gray-300 rounded-lg"
                onClick={() => setPedidoSeleccionado(null)}
              >
                Cancelar
              </button>
              <button
                className="px-3 py-1 bg-pink-500 text-white rounded-lg"
                onClick={confirmarEntrega}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer manejadorMenuAñadir={manejadorMenuAñadir} />
    </div>
  );
}

export default Entregas;
