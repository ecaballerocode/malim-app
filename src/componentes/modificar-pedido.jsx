import React from "react";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc, collection, updateDoc, getDocs, deleteDoc, where, query } from "firebase/firestore";
import { db } from "../credenciales";
import Header from "./header";
import MenuLateral from "./menu-lateral";
import Footer from "./footer";
import MenuAñadir from "./menu-añadir";
import Select from "react-select";
import { useNavigate } from "react-router-dom";

// ✅ FUNCIÓN REUTILIZABLE PARA ACTUALIZAR PERFIL DE CLIENTE — ¡CORREGIDA TOTALMENTE!
const actualizarPerfilPorClienteId = async (clienteId, pedidoIdActual = null) => {
  try {
    if (!clienteId) return;

    console.log(`🔄 Actualizando perfil para cliente: ${clienteId}`);

    // ✅ Validar que el cliente exista
    const clienteRef = doc(db, "clientes", clienteId);
    const clienteSnap = await getDoc(clienteRef);
    if (!clienteSnap.exists()) {
      console.error(`❌ Cliente con ID ${clienteId} no existe.`);
      return false;
    }

    // ✅ Calcular fecha de hace 1 año como string (YYYY-MM-DD)
    const unAnioAtras = new Date();
    unAnioAtras.setFullYear(unAnioAtras.getFullYear() - 1);
    const unAnioAtrasStr = unAnioAtras.toISOString().split('T')[0];

    // ✅ Consultar pedidos del último año
    const q = await getDocs(
      query(
        collection(db, "pedidos"),
        where("clienteId", "==", clienteId),
        where("fecha", ">=", unAnioAtrasStr)
      )
    );

    let pedidos = q.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        fecha: new Date(data.fecha)
      };
    });

    // ✅ NUEVA LÓGICA: Manejar inclusión/exclusión según existencia del pedido
    if (pedidoIdActual) {
      const pedidoRef = doc(db, "pedidos", pedidoIdActual);
      const pedidoSnap = await getDoc(pedidoRef);

      if (pedidoSnap.exists()) {
        // Pedido existe → asegurar inclusión
        if (!pedidos.some(p => p.id === pedidoIdActual)) {
          console.warn(`⚠️ Pedido ${pedidoIdActual} no encontrado en consulta. Forzando inclusión.`);
          const data = pedidoSnap.data();
          const pedidoForzado = {
            id: pedidoSnap.id,
            ...data,
            fecha: new Date(data.fecha)
          };
          const fechaLimite = new Date(unAnioAtrasStr);
          if (pedidoForzado.fecha >= fechaLimite) {
            pedidos.push(pedidoForzado);
            console.log(`✅ Pedido ${pedidoIdActual} incluido manualmente.`);
          } else {
            console.log(`📅 Pedido ${pedidoIdActual} está fuera del rango de 12 meses.`);
          }
        }
      } else {
        // ✅ Pedido NO existe (fue eliminado) → asegurar exclusión
        const indice = pedidos.findIndex(p => p.id === pedidoIdActual);
        if (indice !== -1) {
          pedidos.splice(indice, 1);
          console.log(`🗑️ Pedido ${pedidoIdActual} eliminado de los cálculos.`);
        }
      }
    }

    console.log(`📅 Pedidos encontrados: ${pedidos.length}`);

    // ✅ CASO 1: No hay pedidos → perfil "sin actividad"
    if (pedidos.length === 0) {
      await updateDoc(clienteRef, {
        perfil_recomendacion: {
          sin_actividad: true,
          actualizado_en: new Date() // ← Timestamp
        }
      }, { merge: true }); // ← ¡CLAVE! No borrar otros campos

      console.log(`✅ Perfil actualizado como 'sin actividad' para cliente ${clienteId}`);
      return true;
    }

    // ✅ CASO 2: Sí hay pedidos → calcular perfil completo
    const gastoTotal = pedidos.reduce((sum, p) => sum + (p.precio || 0), 0);
    const gastoPromedio = pedidos.length > 0 ? gastoTotal / pedidos.length : 0;

    const categorias = {};
    const prendas = {};
    const colores = {};
    const tallas = {};

    pedidos.forEach(p => {
      if (p.categoria) categorias[p.categoria] = (categorias[p.categoria] || 0) + 1;
      if (p.prenda) prendas[p.prenda] = (prendas[p.prenda] || 0) + 1;
      if (p.color) colores[p.color] = (colores[p.color] || 0) + 1;
      if (p.talla) tallas[p.talla] = (tallas[p.talla] || 0) + 1;
    });

    const topCategorias = Object.entries(categorias).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([n]) => n);
    const topPrendas = Object.entries(prendas).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([n]) => n);
    const topColores = Object.entries(colores).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([n]) => n);
    const topTallas = Object.entries(tallas).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([n]) => n);

    const precios = pedidos.map(p => p.precio).filter(p => p != null);
    const precioMin = precios.length > 0 ? Math.min(...precios) : 0;
    const precioMax = precios.length > 0 ? Math.max(...precios) : 0;

    const ultimaCompraDoc = pedidos.reduce((latest, p) => p.fecha > latest.fecha ? p : latest, pedidos[0]);
    const ultimaCompra = ultimaCompraDoc.fecha;
    const diasDesdeUltimaCompra = Math.floor((new Date() - ultimaCompra) / (1000 * 60 * 60 * 24));

    let tipoCliente = "nuevo";
    if (pedidos.length >= 8) tipoCliente = "vip";
    else if (pedidos.length >= 4) tipoCliente = "frecuente";
    else if (diasDesdeUltimaCompra > 60) tipoCliente = "inactivo";

    let presupuesto = "bajo";
    if (gastoPromedio > 800) presupuesto = "alto";
    else if (gastoPromedio > 400) presupuesto = "medio";

    const variedadColores = Object.keys(colores).length;
    const estiloCompra = variedadColores > 3 ? "aventurero" : "conservador";

    // ✅ Construir objeto COMPLETO de perfil
    const nuevoPerfil = {
      total_pedidos_12m: pedidos.length,
      gasto_promedio_por_compra: parseFloat(gastoPromedio.toFixed(2)),
      frecuencia_compra_mensual: parseFloat((pedidos.length / 12).toFixed(2)),
      ultima_compra: ultimaCompra.toISOString().split('T')[0],
      dias_desde_ultima_compra: diasDesdeUltimaCompra,
      tipo_cliente: tipoCliente,
      presupuesto_estimado: presupuesto,
      categorias_favoritas: topCategorias,
      prendas_mas_compradas: topPrendas,
      colores_favoritos: topColores,
      tallas_mas_usadas: topTallas,
      rango_precio_min: precioMin,
      rango_precio_max: precioMax,
      estilo_compra: estiloCompra,
      variedad_colores: variedadColores,
      actualizado_en: new Date(), // ← Timestamp
      periodo_analisis: "12_meses",
      sin_actividad: false // ← ¡IMPORTANTE! Si tiene pedidos, NO está inactivo
    };

    // ✅ SOBREESCRIBIR COMPLETAMENTE perfil_recomendacion (pero sin borrar otros campos del cliente)
    await updateDoc(clienteRef, {
      perfil_recomendacion: nuevoPerfil
    }, { merge: true }); // ← ¡SIEMPRE merge: true!

    console.log(`✅ Perfil actualizado correctamente para cliente ${clienteId}`);
    return true;

  } catch (error) {
    console.error("🔥 Error actualizando perfil:", error);
    return false;
  }
};

function ModificarPedido() {
  const navigate = useNavigate();
  const [menuAbierto, setmenuAbierto] = useState(false);
  const [menuAñadir, setmenuAñadir] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [fecha, setFecha] = useState("");
  const { id } = useParams();

  const ClientesOptions = clientes.map((cliente) => ({
    value: cliente.id,
    label: cliente.cliente,
  }));

  const [Data, setData] = useState({
    prenda: "",
    detalles: "",
    costo: "",
    precio: "",
    tallas: "",
    talla: "",
    categoria: "",
    proveedor: "",
    fotos: [],
    cliente: "",
    fecha: "",
    fechaEntrega: "",
    color: "",
    pago: "",
    lugar: "",
    entrega: "",
    comprado: false,
    entregado: false,
    clienteIdOriginal: null // ← almacenamos el clienteId original
  });

  const lugares = [
    "Tlalmanalco", "San Rafael", "Ameca", "CDMX", "Chalco", "Ixtapaluca", "Miraflores", "Chihuahua", "Interior"
  ];

  const tallas = [
    "(Inf 2-4)", "(Inf 4-6)", "(Inf 8-10)", "(Inf 10-12)", "(Inf 6-8)", "(Inf 10-12)", "(juv 14-16)", "(XS 3-5)", "(28-30)", "(30-32)", "(30-34)",
    "(32-36)", "(32-34)", "(34-36)", "(36-38)", "(38-40)", "(40-42)", "Unitalla", "(5)", "(7)", "(9)",
    "(11)", "(13)", "(15)", "(17)", "(4)", "(6)", "(8)", "(10)", "(12)", "(14)", "(16)", "(28)", "(30)",
    "(32)", "(34)", "(36)", "(38)", "(40)", "(42)"
  ];

  const formaEntrega = ["Punto de venta", "A domicilio"];

  const tallaOptions = tallas.map((talla) => ({
    value: talla,
    label: talla,
  }));

  const entregaOptions = formaEntrega.map((entrega) => ({
    value: entrega,
    label: entrega,
  }));

  const lugaresOptions = lugares.map((lugar) => ({
    value: lugar,
    label: lugar,
  }));

  const manejadorMenu = () => {
    setmenuAbierto(!menuAbierto);
  };

  const manejadorMenuAñadir = () => {
    setmenuAñadir(!menuAñadir);
  };

  const manejadorFecha = (e) => {
    const nuevaFecha = e.target.value;
    setFecha(nuevaFecha);
    setData({ ...Data, fecha: nuevaFecha });
  };

  useEffect(() => {
    const fetchPrenda = async () => {
      try {
        const prendaRef = doc(db, "pedidos", id);
        const prendaDoc = await getDoc(prendaRef);

        if (prendaDoc.exists()) {
          const data = prendaDoc.data();
          setData({
            prenda: data.prenda,
            detalles: data.detalles,
            costo: data.costo,
            precio: data.precio,
            tallas: data.tallas,
            talla: data.talla ? { value: data.talla, label: data.talla } : null,
            categoria: data.categoria,
            proveedor: data.proveedor,
            fotos: data.fotos,
            cliente: data.cliente ? { value: data.cliente, label: data.cliente } : null,
            fecha: data.fecha,
            fechaEntrega: data.fechaEntrega || "",
            color: data.color,
            pago: data.pago,
            lugar: data.lugar ? { value: data.lugar, label: data.lugar } : null,
            entrega: data.entrega ? { value: data.entrega, label: data.entrega } : null,
            comprado: data.comprado,
            entregado: data.entregado,
            clienteIdOriginal: data.clienteId // ← guardamos el clienteId original
          });
        }
      } catch (error) {
        console.error("Error al obtener la prenda:", error);
      }
    };
    fetchPrenda();
  }, [id]);

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "clientes"));
        const docsArray = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setClientes(docsArray);
      } catch (error) {
        console.error("Error al cargar los proveedores", error);
      }
    };
    fetchClientes();
  }, []);

  const fetchNewPrenda = async () => {
    try {
      const prendaRef = doc(db, "pedidos", id);
      const prendaDoc = await getDoc(prendaRef);

      if (prendaDoc.exists()) {
        const data = prendaDoc.data();
        setData({
          prenda: data.prenda,
          detalles: data.detalles,
          costo: data.costo,
          precio: data.precio,
          tallas: data.talla,
          talla: "",
          categoria: data.categoria,
          proveedor: data.proveedor,
          fotos: data.fotos || [],
          cliente: "",
          fecha: "",
          fechaEntrega: data.fechaEntrega || "",
          color: "",
          pago: "",
          lugar: "",
          entrega: "",
          comprado: false,
          entregado: false,
          clienteIdOriginal: data.clienteId
        });
      }
    } catch (error) {
      console.error("Error al obtener la prenda:", error);
    }
  };

  const handleClienteChange = (selectedOption) => {
    setData({ ...Data, cliente: selectedOption });
  };

  const handleTallaChange = (selectedOption) => {
    setData({ ...Data, talla: selectedOption });
  };

  const handleLugarChange = (selectedOption) => {
    setData({ ...Data, lugar: selectedOption });
  };

  const handleEntregaChange = (selectedOption) => {
    setData({ ...Data, entrega: selectedOption });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData({ ...Data, [name]: value });
  };

  const handleComprado = () => {
    setData({ ...Data, comprado: !Data.comprado });
  };

  const handleEntregado = () => {
    setData({ ...Data, entregado: !Data.entregado });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const clienteIdOriginal = Data.clienteIdOriginal;
    const nuevoClienteId = Data.cliente?.value;

    // ✅ Validación adicional
    if (!nuevoClienteId) {
      alert("Por favor, selecciona un cliente.");
      return;
    }

    const dataToSubmit = {
      ...Data,
      cliente: Data.cliente?.label || "",
      clienteId: nuevoClienteId,
      lugar: Data.lugar?.label || "",
      entrega: Data.entrega?.label || "",
      talla: Data.talla?.label || "",
      pago: Number(Data.pago),
      comprado: !!Data.comprado,
      entregado: !!Data.entregado,
      fechaEntrega: Data.fechaEntrega || ""
    };

    try {
      // 1. Guardar el pedido
      await updateDoc(doc(db, "pedidos", id), dataToSubmit);
      alert("Pedido actualizado con éxito.");

      // 2. Actualizar perfiles — PASANDO EL ID DEL PEDIDO
      if (clienteIdOriginal && clienteIdOriginal !== nuevoClienteId) {
        console.log(`🔄 Actualizando perfil del cliente original: ${clienteIdOriginal}`);
        await actualizarPerfilPorClienteId(clienteIdOriginal, id);
      }

      if (nuevoClienteId) {
        console.log(`🔄 Actualizando perfil del nuevo cliente: ${nuevoClienteId}`);
        await actualizarPerfilPorClienteId(nuevoClienteId, id);
      }

    } catch (error) {
      alert("Hubo un error al actualizar el pedido.");
      console.error("Error al actualizar el pedido:", error);
    }
  };

  // ✅ handleDelete ACTUALIZADO
  const handleDelete = async () => {
    const confirmDelete = window.confirm("¿Estás seguro de que deseas eliminar este pedido?");
    if (!confirmDelete) return;

    try {
      const pedidoRef = doc(db, "pedidos", id);
      const pedidoDoc = await getDoc(pedidoRef);
      const clienteId = pedidoDoc.data()?.clienteId;

      // Eliminamos el pedido
      await deleteDoc(pedidoRef);
      alert("Pedido eliminado con éxito");

      // ✅ ACTUALIZAR PERFIL DEL CLIENTE — PASANDO EL ID DEL PEDIDO ELIMINADO
      if (clienteId) {
        console.log(`🗑️ Actualizando perfil tras eliminar pedido ${id} del cliente ${clienteId}`);
        await actualizarPerfilPorClienteId(clienteId, id);
      }

      navigate("/Pedidos");
    } catch (error) {
      console.error("Error al eliminar el pedido:", error);
      alert("Hubo un error al eliminar el pedido");
    }
  };

  const handleNota = (id) => {
    navigate(`/AgregarPago/${id}`);
  };

  return (
    <div className="bg-pink-100 min-h-screen">
      <header className="relative">
        <Header menuAbierto={menuAbierto} manejadorMenu={manejadorMenu} />
        <h1 className="fixed inset-x-0 transform pt-2 text-center pointer-events-none text-xl font-bold text-white z-50">Modificar pedido</h1>
      </header>
      <div>
        <MenuLateral menuAbierto={menuAbierto} />
      </div>
      <div>
        <MenuAñadir menuAñadir={menuAñadir} />
      </div>
      <main className="pb-16 pt-10 flex lg:flex-row justify-between flex-col">
        <div className="h-96 border-2 p-5 rounded-lg shadow-xl border-pink-200 w-full lg:w-auto lg:m-10 flex justify-center">
          <div className="w-2/3 h-auto mx-auto flex justify-center">
            <img src={Data.fotos} alt={`Prenda`} className="w-auto h-auto rounded-lg" />
          </div>
          <div className="ml-5 mt-10">
            <p className="mb-5 font-bold text-lg text-pink-700 m-2">{Data.prenda}</p>
            <p className="text-pink-600 m-2">{Data.proveedor}</p>
            <p className="text-pink-600 m-2">{Data.categoria}</p>
            <div className="flex felx-row justify-between m-2">
              <p className="text-pink-600">${Data.costo}</p>
              <p className="text-pink-700 font-bold">${Data.precio}</p>
            </div>
            <p className="mb-5 text-pink-600 m-2">{Data.tallas}</p>
            <p className="text-pink-600 text-sm m-2">{Data.detalles}</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="lg:border-2 lg:shadow-xl h-auto px-5 lg:py-2 pb-20 mt-10 mr-10 rounded-lg border-pink-200 max-w-lg w-full">
          <div className="flex flex-col pt-2">
            <label className="px-2 text-pink-800 font-bold" htmlFor="datePicker">Fecha de pedido</label>
            <input className="w-full px-2 h-8 bg-white rounded-md shadow-sm" type="date" id="datePicker" value={Data.fecha}
              onChange={manejadorFecha} placeholder="Fecha" />
          </div>
          <div className="flex flex-col pt-2">
            <label className="px-2 text-pink-800 font-bold" htmlFor="fechaEntrega">Fecha de Entrega</label>
            <input
              className="w-full px-2 h-8 bg-white rounded-md shadow-sm"
              type="date"
              id="fechaEntrega"
              value={Data.fechaEntrega}
              onChange={(e) => setData({ ...Data, fechaEntrega: e.target.value })}
              placeholder="Fecha de entrega"
            />
          </div>
          <div className="flex flex-col pt-2">
            <label className="px-2 text-pink-800 font-bold">Cliente:</label>
            <Select
              options={ClientesOptions}
              value={Data.cliente}
              onChange={handleClienteChange}
              isClearable
              placeholder="Seleccionar cliente"
            />
          </div>
          <div className="flex flex-col pt-2">
            <label className="px-2 text-pink-800 font-bold">Talla:</label>
            <Select
              options={tallaOptions}
              value={Data.talla}
              onChange={handleTallaChange}
              isClearable
              placeholder="Seleccionar talla"
            />
          </div>
          <div className="flex flex-col pt-2">
            <label className="px-2 text-pink-800 font-bold">Color:</label>
            <input
              type="text"
              name="color"
              value={Data.color}
              onChange={handleChange}
              placeholder="Seleccionar color"
              required
              className="px-2 rounded-md h-8 shadow-sm"
            />
          </div>
          <div className="flex flex-row justify-between">
            <div className="flex flex-col pt-2 w-1/2 pr-2">
              <label className="px-2 text-pink-800 font-bold">Lugar de entrega:</label>
              <Select
                options={lugaresOptions}
                name="lugar"
                value={Data.lugar}
                onChange={handleLugarChange}
                isClearable
                required
                placeholder="Seleccionar un lugar"
              />
            </div>
            <div className="flex flex-col pt-2 w-1/2 pl-2">
              <label className="px-2 text-pink-800 font-bold">Forma de entrega:</label>
              <Select
                options={entregaOptions}
                name="entrega"
                value={Data.entrega}
                onChange={handleEntregaChange}
                isClearable
                required
                placeholder="Seleccionar una forma"
              />
            </div>
          </div>
          <div className="flex flex-row mt-4 mx-10 justify-between">
            <div className="flex flex-col">
              <input type="checkbox" checked={Data.comprado} onChange={handleComprado} />
              <label className="text-pink-800">¿Comprado?</label>
            </div>
            <div className="flex flex-col">
              <input type="checkbox" checked={Data.entregado} onChange={handleEntregado} />
              <label className="text-pink-800">¿Entregado?</label>
            </div>
          </div>
          <div className="flex w-full flex-col pt-2">
            <div className="w-full flex justify-center">
              <button className="h-10 px-4 bg-pink-400 w-1/2 mb-1 shadow-xl text-white rounded-md cursor-pointer hover:bg-pink-200"
                type="button" onClick={() => handleNota(id)}>
                Abrir nota
              </button>
            </div>
            <div className="w-full flex justify-center">
              <button
                type="submit"
                className="px-4 h-10 bg-pink-400 w-1/2 mb-1 shadow-xl text-white rounded-md cursor-pointer hover:bg-pink-400"
              >
                Actualizar
              </button>
            </div>
            <div className="w-full flex justify-center">
              <button className="h-10 px-4 bg-red-600 w-1/2 mb-5 shadow-xl text-white rounded-md cursor-pointer hover:bg-pink-200"
                type="button" onClick={handleDelete}>
                Eliminar pedido
              </button>
            </div>
          </div>
        </form>
      </main>
      <Footer manejadorMenuAñadir={manejadorMenuAñadir} />
    </div>
  );
}

export default ModificarPedido;