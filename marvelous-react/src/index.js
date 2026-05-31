import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom'; // Importamos el motor de rutas

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter> {/* Envolvemos App para que funcionen los enlaces para que todas las rutas y enlaces funcionen en toda la aplicación*/}
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
