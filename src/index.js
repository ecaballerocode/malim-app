import React from 'react';
import ReactDOM from 'react-dom/client';
import {BrowserRouter as Router, Routes, Route} from "react-router-dom"
import App from './App';
import Disponible from './componentes/disponible';
import FormAñadirDisponible from './componentes/form-añadir-disponible';
import DetallePrenda from './componentes/detalle-prenda';
import FormAñadirProveedor from './componentes/form-añadir-proveedor';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Router basename='/malim-app'>
    <Routes>
      <Route path='/' element={<App />}/>
      <Route path='Disponible' element={<Disponible />}/>
      <Route path='FormAñadirDisponible' element={<FormAñadirDisponible />}/>
      <Route path='DetallePrenda/:id' element={<DetallePrenda />}/>
      <Route path='FormAñadirProveedor' element={<FormAñadirProveedor />}/>
    </Routes>
  </Router>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
