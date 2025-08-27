import React, { useState, useRef, useEffect, useCallback } from "react";
import JSZip from "jszip";
import Header from "./header";
import MenuLateral from "./menu-lateral";
import Footer from "./footer";
import MenuAñadir from "./menu-añadir";
import imageCompression from "browser-image-compression";

function MarcaAgua() {
  const [menuAbierto, setmenuAbierto] = useState(false);
  const [menuAñadir, setmenuAñadir] = useState(false);
  const [images, setImages] = useState([]);
  const [originalImages, setOriginalImages] = useState([]);
  const [watermark, setWatermark] = useState(null);
  const [watermarkFile, setWatermarkFile] = useState(null); // Nuevo estado para el archivo
  const [watermarkPosition, setWatermarkPosition] = useState({ x: 50, y: 50 });
  const [watermarkSize, setWatermarkSize] = useState(0.2);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [format, setFormat] = useState("jpeg");
  const canvasRef = useRef(null);

  const manejadorMenu = () => {
    setmenuAbierto(!menuAbierto);
  };

  const manejadorMenuAñadir = () => {
    setmenuAñadir(!menuAñadir);
  };

  const handleImagesUpload = (e) => {
    const files = Array.from(e.target.files);
    const imageUrls = files.map((file) => URL.createObjectURL(file));
    setImages(imageUrls);
    setOriginalImages(files);
  };

  const handleWatermarkUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setWatermarkFile(file); // Guardar el archivo
      setWatermark(URL.createObjectURL(file)); // Crear URL para previsualización
    }
  };

  const loadImage = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      // 👇 solo aplicamos crossOrigin si la imagen NO es un blob local
      if (!src.startsWith("blob:")) {
        img.crossOrigin = "anonymous";
      }
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`No se pudo cargar la imagen: ${src}`));
      img.src = src;
    });
  };


  // Función para comprimir imágenes
  const compressImage = async (imageFile, index, total) => {
    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: `image/${format}`,
        initialQuality: format === "jpeg" ? 0.82 : 0.9,
      };

      const compressedFile = await imageCompression(imageFile, options);

      // Actualizar progreso
      setProgress(Math.round(((index + 1) / total) * 100));

      return compressedFile;
    } catch (error) {
      console.error("Error comprimiendo imagen:", error);
      return imageFile; // Si falla, devolver la original
    }
  };

  const renderPreview = useCallback(async () => {
    if (!images.length || !watermark) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const image = await loadImage(images[0]);
    const watermarkImage = await loadImage(watermark);

    canvas.width = image.width;
    canvas.height = image.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    const watermarkWidth = watermarkImage.width * watermarkSize;
    const watermarkHeight = watermarkImage.height * watermarkSize;

    ctx.drawImage(
      watermarkImage,
      watermarkPosition.x,
      watermarkPosition.y,
      watermarkWidth,
      watermarkHeight
    );
  }, [images, watermark, watermarkSize, watermarkPosition]);

  useEffect(() => {
    renderPreview();
  }, [renderPreview]);

  const applyWatermark = async () => {
    if (!canvasRef.current || !images.length || !watermark) return;

    setIsProcessing(true);
    setProgress(0);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const zip = new JSZip();

    try {
      // Procesar cada imagen
      for (let i = 0; i < images.length; i++) {
        const imageSrc = images[i];
        const image = await loadImage(imageSrc);
        const watermarkImage = await loadImage(watermark);

        canvas.width = image.width;
        canvas.height = image.height;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        const watermarkWidth = watermarkImage.width * watermarkSize;
        const watermarkHeight = watermarkImage.height * watermarkSize;

        ctx.drawImage(
          watermarkImage,
          watermarkPosition.x,
          watermarkPosition.y,
          watermarkWidth,
          watermarkHeight
        );

        // Obtener imagen como blob
        const blob = await new Promise(resolve =>
          canvas.toBlob(resolve, `image/${format}`, format === "jpeg" ? 0.82 : 0.9)
        );

        // Comprimir la imagen con marca de agua
        const compressedBlob = await compressImage(blob, i, images.length);

        // Añadir al ZIP
        zip.file(`image_${i + 1}_watermarked.${format}`, compressedBlob);
      }

      // Generar y descargar ZIP
      const content = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: {
          level: 6
        }
      });

      const link = document.createElement("a");
      link.href = URL.createObjectURL(content);
      link.download = "watermarked_images.zip";
      link.click();

      // Limpiar
      URL.revokeObjectURL(link.href);

    } catch (error) {
      console.error("Error aplicando marca de agua:", error);
      alert("Error al procesar las imágenes: " + (error.message || error));
    } finally {

      setIsProcessing(false);
      setProgress(0);
    }
  };

  // Limpiar URLs al desmontar el componente
  useEffect(() => {
    return () => {
      images.forEach(url => URL.revokeObjectURL(url));
      if (watermark) URL.revokeObjectURL(watermark);
    };
  }, []); // 👈 sin dependencias, solo al desmontar


  return (
    <div className="app bg-pink-100 min-h-screen">
      <header className="relative">
        <Header menuAbierto={menuAbierto} manejadorMenu={manejadorMenu} />
        <h1 className="fixed inset-x-0 transform pt-2 text-center pointer-events-none text-xl font-bold text-white z-50">
          Marca de agua
        </h1>
      </header>

      <div>
        <MenuLateral menuAbierto={menuAbierto} />
      </div>

      <div>
        <MenuAñadir menuAñadir={menuAñadir} />
      </div>

      <main className="flex flex-center flex-col justify-center pt-10 pb-16 px-4">
        <div className="w-full max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-pink-800 mb-4">Añadir marca de agua a imágenes</h2>

          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="block mb-2 font-medium text-pink-700">Imágenes a procesar</label>
              <input
                type="file"
                multiple
                id="file"
                accept="image/*"
                onChange={handleImagesUpload}
                className="block mb-2 absolute opacity-0 w-0 h-0"
              />
              <label
                htmlFor="file"
                className="inline-block py-2 px-4 bg-pink-400 text-center text-white rounded-md cursor-pointer hover:bg-pink-300 transition-colors"
              >
                📸 Elegir imágenes
              </label>
              {images.length > 0 && (
                <p className="text-sm text-gray-600 mt-2">
                  {images.length} imagen(es) seleccionada(s)
                </p>
              )}
            </div>

            <div className="flex flex-col">
              <label className="block mb-2 font-medium text-pink-700">Marca de agua</label>
              <input
                type="file"
                id="marca"
                accept="image/*"
                onChange={handleWatermarkUpload}
                className="block absolute opacity-0 w-0 h-0"
              />
              <label
                htmlFor="marca"
                className="inline-block py-2 px-4 bg-pink-400 text-center text-white rounded-md cursor-pointer hover:bg-pink-300 transition-colors"
              >
                🖼️ Elegir marca de agua
              </label>
              {watermark && (
                <p className="text-sm text-gray-600 mt-2">Marca de agua seleccionada</p>
              )}
            </div>
          </div>

          <div className="mb-6">
            <label className="block mb-2 font-medium text-pink-700">Formato de salida:</label>
            <div className="flex gap-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="jpeg"
                  checked={format === "jpeg"}
                  onChange={(e) => setFormat(e.target.value)}
                  className="form-radio text-pink-600"
                />
                <span className="ml-2">JPEG (más liviano)</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="png"
                  checked={format === "png"}
                  onChange={(e) => setFormat(e.target.value)}
                  className="form-radio text-pink-600"
                />
                <span className="ml-2">PNG (mejor calidad)</span>
              </label>
            </div>
          </div>

          <div className="mb-6">
            <label className="block mb-2 font-medium text-pink-700">
              Tamaño de Marca de Agua: {Math.round(watermarkSize * 100)}%
            </label>
            <input
              type="range"
              className="w-full"
              min="0.05"
              max="0.5"
              step="0.05"
              value={watermarkSize}
              onChange={(e) => setWatermarkSize(parseFloat(e.target.value))}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Pequeña</span>
              <span>Mediana</span>
              <span>Grande</span>
            </div>
          </div>

          {images.length > 0 && watermark && (
            <div className="mb-6 p-4 bg-pink-50 rounded-lg">
              <h3 className="font-medium text-pink-700 mb-2">Vista previa:</h3>
              <div className="flex justify-center">
                <canvas
                  ref={canvasRef}
                  className="border border-pink-300 rounded shadow-sm"
                  style={{ width: "100%", maxWidth: "300px", height: "auto" }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Vista previa de la primera imagen
              </p>
            </div>
          )}

          {isProcessing && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <p className="font-medium text-blue-700 mb-2">Procesando imágenes... {progress}%</p>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-pink-500 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          <div className="flex justify-center">
            <button
              onClick={applyWatermark}
              disabled={!images.length || !watermark || isProcessing}
              className="py-2 px-6 bg-pink-600 text-white rounded-md hover:bg-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Procesando...
                </>
              ) : (
                '💾 Descargar con Marca de Agua'
              )}
            </button>
          </div>

          <div className="mt-6 text-xs text-gray-500">
            <p>📝 <strong>Nota:</strong> Las imágenes se comprimirán a máximo 1MB y se convertirán a {format.toUpperCase()} para reducir su tamaño.</p>
          </div>
        </div>
      </main>

      <Footer manejadorMenuAñadir={manejadorMenuAñadir} />
    </div>
  );
}

export default MarcaAgua;