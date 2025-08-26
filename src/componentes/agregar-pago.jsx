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

  const normalizeImageUrl = (url) => {
    if (!url) return '';
    if (Array.isArray(url)) {
      url = url.length > 0 ? url[0] : '';
    }
    if (typeof url !== 'string') return '';
    if (url.startsWith('//')) {
      url = 'https:' + url;
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

  const generarImagenNota = async (descargar = false) => {
    setGenerandoImagen(true);
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Tamaño óptimo para nota
      canvas.width = 400;
      canvas.height = 650;
      
      // Fondo
      ctx.fillStyle = '#f5ebdd';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Cargar y dibujar imagen de la prenda si existe
      let yPosition = 30;
      
      if (Data.fotos && !imageError) {
        const imgUrl = normalizeImageUrl(Data.fotos);
        if (imgUrl) {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = imgUrl;
          
          // Esperar a que cargue la imagen o timeout
          await new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
            setTimeout(resolve, 3000);
          });
          
          if (img.complete && img.naturalWidth !== 0) {
            // Dibujar imagen (tamaño reducido)
            const maxWidth = 150;
            const maxHeight = 150;
            const ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
            const width = img.width * ratio;
            const height = img.height * ratio;
            
            ctx.drawImage(img, (canvas.width - width) / 2, yPosition, width, height);
            yPosition += height + 20;
          }
        }
      }
      
      // Dibujar logo
      const logoImg = new Image();
      logoImg.src = logo;
      await new Promise((resolve) => {
        logoImg.onload = resolve;
        logoImg.onerror = resolve;
      });
      ctx.drawImage(logoImg, canvas.width - 40, 10, 30, 30);
      
      // Estilos de texto
      ctx.font = 'bold 18px Arial';
      ctx.fillStyle = '#9d174d';
      ctx.textAlign = 'center';
      
      // Datos de la nota
      const notaData = {
        cliente: Data.cliente || 'Cliente',
        prenda: Data.prenda || '',
        talla: Data.talla || '',
        color: Data.color || '',
        precioOriginal: Data.precioOriginal ?? Data.precio,
        precioFinal: Data.precio,
        saldoPendiente: Number(Data.precio) - Number(Data.pago),
        pagos: Data.pagos || [],
        estatus: estatus
      };
      
      // Cliente
      ctx.fillText(notaData.cliente, canvas.width / 2, yPosition);
      yPosition += 30;
      
      // Prenda
      ctx.font = '16px Arial';
      ctx.fillText(notaData.prenda, canvas.width / 2, yPosition);
      yPosition += 25;
      
      // Talla y Color
      ctx.font = '14px Arial';
      ctx.fillText(`Talla: ${notaData.talla} | Color: ${notaData.color}`, canvas.width / 2, yPosition);
      yPosition += 30;
      
      // Precios
      ctx.fillText(`Precio original: $${notaData.precioOriginal}`, canvas.width / 2, yPosition);
      yPosition += 25;
      
      ctx.font = 'bold 16px Arial';
      ctx.fillText(`Precio final: $${notaData.precioFinal}`, canvas.width / 2, yPosition);
      yPosition += 30;
      
      ctx.fillStyle = '#ec4899';
      ctx.fillText(`Saldo pendiente: $${notaData.saldoPendiente}`, canvas.width / 2, yPosition);
      yPosition += 35;
      
      // Estado
      ctx.fillStyle = '#9d174d';
      ctx.fillText(`Estado: ${notaData.estatus}`, canvas.width / 2, yPosition);
      yPosition += 40;
      
      // Pagos
      ctx.font = 'bold 16px Arial';
      ctx.fillText('PAGOS REALIZADOS', canvas.width / 2, yPosition);
      yPosition += 30;
      
      ctx.font = '14px Arial';
      ctx.fillStyle = '#000000';
      notaData.pagos.forEach((pago, index) => {
        if (yPosition < canvas.height - 20) {
          ctx.fillText(`${pago.fecha}: $${pago.monto}`, canvas.width / 2, yPosition);
          yPosition += 22;
        }
      });
      
      // Línea final
      yPosition += 10;
      ctx.strokeStyle = '#9d174d';
      ctx.beginPath();
      ctx.moveTo(50, yPosition);
      ctx.lineTo(canvas.width - 50, yPosition);
      ctx.stroke();
      
      // Convertir a data URL
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      
      if (descargar) {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `nota-${notaData.cliente}-${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      return dataUrl;
      
    } catch (error) {
      console.error('Error al generar imagen:', error);
      alert('Error al generar la nota: ' + error.message);
      return null;
    } finally {
      setGenerandoImagen(false);
    }
  };

  const previsualizarNota = async () => {
    const dataUrl = await generarImagenNota(false);
    if (dataUrl) {
      setImagenPrevia(dataUrl);
      setMostrarPrevia(true);
    }
  };

  const exportarNotaComoImagen = async () => {
    await generarImagenNota(true);
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

      <main className="pb-16 pt-10 w-full flex flex-col items-center">
        {/* Nota optimizada para móviles */}
        <div
          id="Nota"
          className="border-2 p-3 rounded-lg shadow-xl w-full max-w-sm mx-auto border-pink-200 bg-pink-100"
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

        <div className="w-full flex justify-center mt-4">
          <form onSubmit={handleSubmit} className="border-2 p-4 rounded-lg border-pink-200 w-full max-w-sm bg-white">
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