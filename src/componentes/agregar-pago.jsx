import React from "react";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../credenciales";
import Header from "./header";
import MenuLateral from "./menu-lateral";
import Footer from "./footer";
import MenuAñadir from "./menu-añadir";
import logo from "../logo-negro.png";
import * as htmlToImage from "html-to-image";

function AgregarPago() {
  const [menuAbierto, setmenuAbierto] = useState(false);
  const [menuAñadir, setmenuAñadir] = useState(false);
  const [fecha, setFecha] = useState("");
  const [monto, setMonto] = useState();
  const [estatus, setEstatus] = useState("")
  const [precioOriginal, setPrecioOriginal] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [imagenPrevia, setImagenPrevia] = useState(null);
  const [mostrarPrevia, setMostrarPrevia] = useState(false);
  const [generandoImagen, setGenerandoImagen] = useState(false);

  const { id } = useParams();

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
    color: "",
    pago: 0,
    lugar: "",
    entrega: "",
    comprado: false,
    entregado: false,
    pagos: []
  });

  // Colores de branding
  const colors = {
    primary: '#F5EBDD',
    secondary: '#D88C6D',
    accent: '#F6D28C',
    lightGray: '#C2C2C2',
    darkText: '#3C3C3C',
  };

  const normalizeImageUrl = (url) => {
    if (!url) return '';
    if (Array.isArray(url)) {
      url = url.length > 0 ? url[0] : '';
    }
    if (typeof url !== 'string') return '';
    if (url.startsWith('//')) {
      url = 'https:' + url;
    }

    if (url.includes('r2.dev') || url.includes('pub-')) {
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}t=${Date.now()}`;
    }

    return url;
  };

  const manejadorMenu = () => {
    setmenuAbierto(!menuAbierto);
  };

  const manejadorMenuAñadir = () => {
    setmenuAñadir(!menuAñadir);
  };

  const manejadorFecha = (e) => {
    setFecha(e.target.value);
  };

  useEffect(() => {
    const fetchPrenda = async () => {
      try {
        const prendaRef = doc(db, "pedidos", id);
        const prendaDoc = await getDoc(prendaRef);

        if (prendaDoc.exists()) {
          const data = prendaDoc.data();
          setPrecioOriginal(data.precio);
          setData({
            prenda: data.prenda || "",
            detalles: data.detalles || "",
            costo: data.costo || "",
            precio: data.precio || "",
            precioOriginal: data.precioOriginal,
            tallas: data.tallas || "",
            talla: data.talla || "",
            categoria: data.categoria || "",
            proveedor: data.proveedor || "",
            fotos: data.fotos || [],
            cliente: data.cliente || "",
            fecha: data.fecha || "",
            color: data.color || "",
            pago: data.pago || 0,
            lugar: data.lugar || "",
            entrega: data.entrega || "",
            comprado: data.comprado || false,
            entregado: data.entregado || false,
            pagos: data.pagos || [],
          });

          if (data.entregado) {
            setEstatus("Pedido entregado");
          } else {
            setEstatus("Entrega pendiente");
          }
        }
      } catch (error) {
        console.error("Error al obtener la prenda:", error);
      }
    };
    fetchPrenda();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const dataToSubmit = {
      ...Data,
      pagos: [...Data.pagos, { fecha: fecha, monto: monto }],
      pago: Number(Data.pago) + Number(monto),
    };

    if (!dataToSubmit.precioOriginal) {
      delete dataToSubmit.precioOriginal;
    }

    try {
      await updateDoc(doc(db, "pedidos", id), dataToSubmit);
      alert("Pago agregado con éxito.");
      setFecha("");
      setMonto("");
      setData((prevState) => ({
        ...prevState,
        pagos: [...prevState.pagos, { fecha, monto }],
        pago: Number(prevState.pago) + Number(monto),
      }));
    } catch (error) {
      alert("Hubo un error al agregar el pedido.");
      console.error("Error al agregar el pedido:", error);
    }
  };

  const handleMonto = (e) => {
    setMonto(Number(e.target.value));
  };

  const waitForImages = (node) => {
    const imgs = Array.from(node.querySelectorAll("img"));
    return Promise.all(
      imgs.map(img => new Promise(resolve => {
        img.crossOrigin = "anonymous";
        if (img.complete && img.naturalWidth !== 0) return resolve();
        img.addEventListener("load", () => resolve(), { once: true });
        img.addEventListener("error", () => resolve(), { once: true });
        setTimeout(() => resolve(), 3000);
      }))
    );
  };

  const exportarNotaComoImagen = async () => {
    setGenerandoImagen(true);
    try {
      const divNota = document.getElementById("Nota");
      if (!divNota) {
        alert("No se encontró la nota.");
        return;
      }

      // Esperar a que las imágenes se carguen (método que funcionaba antes)
      await waitForImages(divNota);
      await new Promise(resolve => setTimeout(resolve, 500));

      // USAR html-to-image COMO ANTES (lo que funcionaba)
      const dataUrl = await htmlToImage.toJpeg(divNota, {
        quality: 1,
        backgroundColor: "#f5ebdd",
        pixelRatio: 5, // Aumentar de 1 a 3 (o hasta 5 para máxima calidad)
      });

      // Descargar directamente como antes
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `nota-${Data.cliente || 'pedido'}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error("Error al exportar la nota como imagen:", error);
      alert("Hubo un error al generar la imagen.");
    } finally {
      setGenerandoImagen(false);
    }
  };

  const previsualizarNota = async () => {
    setGenerandoImagen(true);
    try {
      const divNota = document.getElementById("Nota");
      if (!divNota) {
        alert("No se encontró la nota.");
        return;
      }

      // Esperar a que las imágenes se carguen
      await waitForImages(divNota);
      await new Promise(resolve => setTimeout(resolve, 500));

      // USAR html-to-image para previsualización también
      const dataUrl = await htmlToImage.toJpeg(divNota, {
        quality: 1,
        backgroundColor: "#f5ebdd",
      });

      setImagenPrevia(dataUrl);
      setMostrarPrevia(true);

    } catch (error) {
      console.error("Error al previsualizar la nota:", error);
      alert("Hubo un error al generar la previsualización.");
    } finally {
      setGenerandoImagen(false);
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const ModalPrevisualizacion = () => {
    if (!mostrarPrevia) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white p-4 rounded-lg max-w-md w-full mx-auto">
          <h2 className="text-lg font-bold mb-4 text-pink-800">Previsualización de Nota</h2>
          {imagenPrevia ? (
            <div className="flex flex-col items-center">
              <img
                src={imagenPrevia}
                alt="Nota de pago"
                className="w-full h-auto mb-4 rounded border max-h-96 object-contain"
              />
              <div className="flex flex-col sm:flex-row gap-2 w-full">
                <button
                  onClick={() => setMostrarPrevia(false)}
                  className="bg-gray-300 px-4 py-2 rounded flex-1"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => window.open(imagenPrevia, '_blank')}
                  className="bg-pink-300 px-4 py-2 rounded flex-1"
                >
                  Abrir
                </button>
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = imagenPrevia;
                    link.download = `nota-${Data.cliente || 'pedido'}.jpg`;
                    link.click();
                  }}
                  className="bg-pink-500 text-white px-4 py-2 rounded flex-1"
                >
                  Descargar
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full h-40 bg-gray-100 flex items-center justify-center rounded">
              <span className="text-gray-500">Generando nota...</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-pink-100 min-h-screen">
      <header className="relative">
        <Header menuAbierto={menuAbierto} manejadorMenu={manejadorMenu} />
        <h1 className="fixed inset-x-0 transform pt-2 text-center pointer-events-none text-xl font-bold text-white z-50">
          Agregar pago a {Data.cliente}
        </h1>
      </header>

      <MenuLateral menuAbierto={menuAbierto} />
      <MenuAñadir menuAñadir={menuAñadir} />

      <main className="pb-16 pt-10 w-full flex flex-col lg:flex-row lg:justify-between lg:items-start lg:px-4">
        {/* NOTA A LA IZQUIERDA - FIJADA PARA CAPTURA */}
        <div className="lg:w-1/2 flex justify-center lg:justify-start mb-4 lg:mb-0">
          <div
            id="Nota"
            className="border-2 p-3 rounded-lg shadow-xl w-full max-w-sm border-pink-200 bg-pink-100 lg:ml-0"
            style={{ marginLeft: '0', marginRight: 'auto' }}
          >
            <div className="flex flex-row">
              <div className="w-1/3 flex flex-col items-center">
                {!imageError && Data.fotos ? (
                  <img
                    src={normalizeImageUrl(Data.fotos)}
                    alt="Prenda"
                    crossOrigin="anonymous"
                    className="rounded-lg w-full max-h-28 object-contain"
                    onError={handleImageError}
                  />
                ) : (
                  <div className="w-full h-28 bg-pink-200 flex items-center justify-center rounded-lg">
                    <span className="text-pink-600 text-xs">Sin imagen</span>
                  </div>
                )}
                <img src={logo} alt="Logo" className="w-6 h-6 mt-1" crossOrigin="anonymous" />
              </div>

              <div className="w-2/3 pl-2">
                <p className="font-bold text-center text-pink-700 text-sm mb-1">{Data.cliente}</p>
                <p className="text-center text-pink-700 text-xs mb-1">{Data.prenda}</p>
                <p className="text-pink-600 font-bold text-xs mb-1">Estado: {estatus}</p>
                <div className="flex justify-between mb-1">
                  <span className="text-pink-600 text-xs">{Data.talla}</span>
                  <span className="text-pink-600 text-xs">{Data.color}</span>
                </div>

                <div className="grid grid-cols-3 gap-1 mb-2">
                  <div>
                    <p className="text-pink-600 text-xs">Precio:</p>
                    <p className="text-pink-600 text-xs">
                      ${Data.precioOriginal ?? Data.precio}
                    </p>
                  </div>
                  <div>
                    <p className="text-pink-600 text-xs">Final:</p>
                    <p className="text-pink-600 font-bold text-xs">${Data.precio}</p>
                  </div>
                  <div>
                    <p className="text-pink-600 text-xs">Restante:</p>
                    <p className="text-pink-400 font-bold text-xs">
                      ${Number(Data.precio) - Number(Data.pago)}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="font-bold text-center text-pink-600 text-xs mb-1">Pagos</p>
                  {Data.pagos?.map((pago, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="text-pink-600 text-xs">{pago.fecha}</span>
                      <span className="text-pink-600 text-xs">${pago.monto}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FORMULARIO A LA DERECHA */}
        <div className="lg:w-1/2 flex justify-center lg:justify-end">
          <form onSubmit={handleSubmit} className="border-2 p-4 rounded-lg border-pink-200 w-full max-w-sm bg-white lg:mr-0">
            <div className="mb-3">
              <label className="block text-pink-800 font-bold mb-1">Fecha de pago</label>
              <input
                type="date"
                value={fecha}
                onChange={manejadorFecha}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-pink-800 font-bold mb-1">Monto:</label>
              <input
                type="number"
                value={monto}
                onChange={handleMonto}
                className="w-full p-2 border rounded"
                placeholder="Monto"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <button
                type="submit"
                className="bg-pink-400 text-white p-2 rounded hover:bg-pink-500 disabled:opacity-50"
                disabled={generandoImagen}
              >
                Agregar pago
              </button>
              <button
                type="button"
                onClick={previsualizarNota}
                className="bg-pink-300 text-pink-800 p-2 rounded hover:bg-pink-400 disabled:opacity-50"
                disabled={generandoImagen}
              >
                {generandoImagen ? 'Generando...' : 'Previsualizar'}
              </button>
              <button
                type="button"
                onClick={exportarNotaComoImagen}
                className="bg-pink-500 text-white p-2 rounded hover:bg-pink-600 disabled:opacity-50"
                disabled={generandoImagen}
              >
                {generandoImagen ? 'Generando...' : 'Descargar nota'}
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer manejadorMenuAñadir={manejadorMenuAñadir} />
      <ModalPrevisualizacion />
    </div>
  );
}

export default AgregarPago;