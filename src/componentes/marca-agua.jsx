import React, { useState, useRef, useEffect, useCallback } from "react";
import JSZip from "jszip";
import Header from "./header";
import MenuLateral from "./menu-lateral";
import Footer from "./footer";
import MenuAñadir from "./menu-añadir";

function MarcaAgua() {

    const [menuAbierto, setmenuAbierto] = useState(false);
    const [menuAñadir, setmenuAñadir] = useState(false);
  const [images, setImages] = useState([]);
  const [watermark, setWatermark] = useState(null);
  const [watermarkPosition, setWatermarkPosition] = useState({ x: 50, y: 50 });
  const [watermarkSize, setWatermarkSize] = useState(0.2); // 20% del tamaño original
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
  };

  const handleWatermarkUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setWatermark(URL.createObjectURL(file));
    }
  };

  const loadImage = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous"; // Permitir cross-origin para las descargas
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
      img.src = src;
    });
  };

  const renderPreview = useCallback(async () => {
    if (!images.length || !watermark) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const image = await loadImage(images[0]); // Previsualización de la primera imagen
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

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const zip = new JSZip();

    await Promise.all(
      images.map(async (imageSrc, index) => {
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

        const dataUrl = canvas.toDataURL("image/png");
        const base64Data = dataUrl.split(",")[1];
        zip.file(`image_${index + 1}_watermarked.png`, base64Data, {
          base64: true,
        });
      })
    );

    const content = await zip.generateAsync({ type: "blob" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(content);
    link.download = "watermarked_images.zip";
    link.click();
  };

  return (
    <div className="app bg-pink-100 min-h-screen">
        <header className="relative">
        <Header menuAbierto={menuAbierto} manejadorMenu={manejadorMenu} />
        <h1 className="fixed inset-x-0 transform pt-2 text-center pointer-events-none text-xl font-bold text-white z-50">Marca de agua</h1>
      </header>
      <div>
        <MenuLateral menuAbierto={menuAbierto} />
      </div>
      <div>
        <MenuAñadir menuAñadir={menuAñadir} />
      </div>
      <main className="flex flex-center flex-col justify-center pt-10 pb-16">
      <div className="mb-4 flex flex-col justify-center">
        <div className="flex justify-center">
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
                className="mt-2 lg:w-1/4 w-3/4 inline-block py-2 px-4 bg-pink-400 text-center text-white rounded-md cursor-pointer hover:bg-pink-200"
                >
                Elegir imágenes
            </label>
        </div>
        <div className="flex justify-center">
            <input
            type="file"
            id="marca"
            accept="image/*"
            onChange={handleWatermarkUpload}
            className="block absolute opacity-0 w-0 h-0"
            />
            <label
                htmlFor="marca"
                className="mt-2 lg:w-1/4 w-3/4 inline-block py-2 px-4 bg-pink-400 text-center text-white rounded-md cursor-pointer hover:bg-pink-200"
                >
                Elegir marca de agua
            </label>
        </div>
        
      </div>

      <div className="mb-4 flex flex-col text-center justify-center h-full">
        <label className="block mb-2">Tamaño de Marca de Agua:</label>
        <div className="w-full">
            <input
            type="range"
            className="lg:w-1/4 w-3/4"
            min="0.1"
            max="1"
            step="0.1"
            value={watermarkSize}
            onChange={(e) => setWatermarkSize(parseFloat(e.target.value))}
            />
        </div>
      </div>

      <div className="flex justify-center">
        <canvas
          ref={canvasRef}
          className="border border-pink-500"
          style={{ width: "100%", maxWidth: "300px", height: "auto" }}
        />
      </div>
        <div className="flex justify-center">
            <button
            onClick={applyWatermark}
            className="mt-4 py-2 px-4 bg-pink-600 text-white rounded-md hover:bg-pink-400"
        >
            Descargar con Marca de Agua
            </button>
        </div>
      </main>
      <Footer manejadorMenuAñadir={manejadorMenuAñadir}/>
    </div>
  );
}

export default MarcaAgua;
