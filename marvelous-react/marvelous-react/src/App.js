import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import DOMPurify from 'dompurify';
import ComicList from './components/ComicList';
import HeroList from './components/HeroList';
import './App.css';
import Buscador from './components/Buscador';
import PerfilUser from './components/PerfilUser';
import axios from 'axios';
import HallOfFame from './components/HallOfFame';
import HallOfFameBanner from './components/HallOfFameBanner';
import Foro from './components/Foro';
import AgenteIA from './components/AgenteIA';

/**
 * Componente raíz de la aplicación.
 * Centraliza el estado global (sesión, favoritos, rankings) y define
 * la navegación principal entre secciones mediante React Router.
 */
function App() {
  // Detectamos la ruta activa para resaltar el enlace del menú correspondiente
  const location = useLocation();

  // Controla la pantalla de carga inicial (splash screen)
  const [showSplash, setShowSplash] = useState(true);

  /**
   * SESIÓN PERSISTENTE
   * Al arrancar, leemos localStorage para restaurar la sesión
   * sin que el usuario tenga que volver a identificarse tras un refresco.
   */
  const [usuario, setUsuario] = useState(() => {
    const guardado = localStorage.getItem("sesionMarvel");
    return guardado ? JSON.parse(guardado) : null;
  });

  // Item seleccionado para mostrar en el modal de detalles
  const [selectedItem, setSelectedItem] = useState(null);
  // Controla la visibilidad del modal de detalles
  const [showModal, setShowModal] = useState(false);
  // Mensaje del sistema de notificaciones emergentes (toast)
  const [toast, setToast] = useState(null);
  // Lista de favoritos del usuario logueado
  const [favoritos, setFavoritos] = useState([]);
  // Top 5 de héroes y cómics para el Hall of Fame Banner
  const [topHeroes, setTopHeroes] = useState([]);
  const [topComics, setTopComics] = useState([]);

  /**
   * SINCRONIZACIÓN DE FAVORITOS
   * Cada vez que cambia el usuario logueado (login / logout),
   * recargamos sus favoritos desde la base de datos.
   */
  useEffect(() => {
    const cargarFavoritos = async () => {
      if (usuario && usuario.id_usuario) {
        try {
          const res = await axios.get(`${process.env.REACT_APP_SERVER_URL}/favoritos/${usuario.id_usuario}`);
          // Normalizamos los datos para que el resto de la app los reconozca
          const favsTransformados = res.data.map(f => ({
            id: f.id_favorito,
            tipo: f.tipo,
            imagen_url: f.imagen_url,
            estrellas: f.estrellas
          }));
          setFavoritos(favsTransformados);
        } catch (err) {
          console.error("Error cargando favoritos de la base de datos", err);
        }
      } else {
        // Sin usuario logueado vaciamos la lista por seguridad
        setFavoritos([]);
      }
    };
    cargarFavoritos();
  }, [usuario]);

  /**
   * LOGIN
   * Guarda los datos del usuario en estado y en localStorage.
   */
  const handleLoginSuccess = (datos) => {
    setUsuario(datos);
    localStorage.setItem("sesionMarvel", JSON.stringify(datos));
  };

  /**
   * LOGOUT
   * Limpia estado y localStorage para dejar la app lista para otro agente.
   */
  const handleLogout = () => {
    setUsuario(null);
    setFavoritos([]);
    localStorage.removeItem("sesionMarvel");
  };

  // Abre el modal de detalles con el item seleccionado
  const handleOpenModal = (item) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  // Cierra el modal y limpia el item seleccionado
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedItem(null);
  };

  /**
   * TOGGLE DE FAVORITOS
   * Envía la petición al servidor para añadir o quitar un favorito
   * y actualiza el estado local de React para que el corazón cambie de color
   * de forma inmediata, sin esperar una recarga de la página.
   */
  const handleToggleFav = async (item, e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.stopPropagation) e.stopPropagation();

    if (!usuario) {
      setToast("⚠️ Acceso denegado: Identifícate en el sistema");
      setTimeout(() => setToast(null), 3000);
      return;
    }

    // Extraemos el nombre del item independientemente de su tipo (héroe, cómic, película…)
    const nombreParaDB = item.name ||
                         item.volume?.name ||
                         item.title ||
                         (item.resource_type === 'character' ? "Héroe" : "Elemento Marvel");

    const idMarvel = item.id;

    // Determinamos el tipo exacto que guardará la base de datos
    let tipoItem = 'comic';
    if (item.resource_type === 'character') {
      tipoItem = 'hero';
    } else if (item.resource_type === 'movie' || item.runtime) {
      tipoItem = 'movie';
    } else if (item.resource_type === 'series') {
      tipoItem = 'series';
    }

    // Usamos la imagen pequeña como URL de portada; si no existe, un placeholder
    const urlFinal = item.image?.small_url ||
                     item.image?.screen_url ||
                     "https://via.placeholder.com/300x450?text=No+Image";

    try {
      const response = await axios.post(`${process.env.REACT_APP_SERVER_URL}/favoritos/toggle`, {
        id_favorito: idMarvel,
        id_usuario: usuario.id_usuario,
        tipo: tipoItem,
        imagen_url: urlFinal,
        nombre: nombreParaDB
      });

      // Actualizamos el estado local sin recargar toda la lista de favoritos
      setFavoritos((prevFavs) => {
        const isAlreadyFav = prevFavs.find(f => f.id === idMarvel);
        if (isAlreadyFav) {
          setToast(`💔 ${nombreParaDB} eliminado de tu colección`);
          return prevFavs.filter(f => f.id !== idMarvel);
        } else {
          setToast(`¡${nombreParaDB} añadido a tu colección!`);
          return [...prevFavs, {
            id: idMarvel,
            tipo: tipoItem,
            imagen_url: urlFinal,
            nombre: nombreParaDB
          }];
        }
      });

      setTimeout(() => setToast(null), 3000);
      console.log(`Respuesta del Servidor (${tipoItem}): ${response.data.message}`);
    } catch (error) {
      console.error("Error en la sincronización:", error);
      setToast("🚀 Error: Fallo en la red de comunicaciones");
      setTimeout(() => setToast(null), 3000);
    }
  };

  // Función auxiliar para mostrar un toast desde componentes hijos (ej. PerfilUser)
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  /**
   * RANKINGS DEL HALL OF FAME
   * Se cargan una sola vez al montar la app; no dependen del usuario logueado.
   */
  useEffect(() => {
    const cargarRankings = async () => {
      try {
        const [resHeroes, resComics] = await Promise.all([
          axios.get(`${process.env.REACT_APP_SERVER_URL}/api/hall-of-fame/hero`),
          axios.get(`${process.env.REACT_APP_SERVER_URL}/api/hall-of-fame/comic`)
        ]);
        setTopHeroes(resHeroes.data);
        setTopComics(resComics.data);
      } catch (error) {
        console.error("Fallo en la sincronización del Hall of Fame");
      }
    };
    cargarRankings();
  }, []);

  // La splash screen se oculta automáticamente tras 3 segundos
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="App">

      {/* ======= PANTALLA DE CARGA INICIAL (SPLASH) ======= */}
      {showSplash && (
        <div className="splash-screen">
          <div className="splash-content">
            <img src="/assets/img/logo-no-background.svg" alt="Marvelous" className="splash-logo" />
            <div className="spinner-border text-danger" role="status"></div>
            <p className="splash-text">Conectando con el Multiverso</p>
          </div>
        </div>
      )}

      {/* ======= CABECERA Y NAVEGACIÓN PRINCIPAL ======= */}
      <header id="header" className="header d-flex align-items-center fixed-top">
        <div className="container-fluid d-flex align-items-center justify-content-between">

          {/* Logo: redirige a la página principal */}
          <Link to="/" className="logo d-flex align-items-center me-auto me-lg-0">
            <img src="/assets/img/logo-no-background.svg" alt="Marvelous Logo" style={{ maxHeight: '65px', marginRight: '10px' }} />
          </Link>

          {/* Menú de navegación: el enlace activo se colorea en naranja */}
          <nav id="navbar" className="navbar">
            <ul>
              <li><Link to="/" className={location.pathname === '/' ? 'active' : ''} style={{ color: location.pathname === '/' ? '#eb5d1e' : 'white', fontWeight: 'bold' }}><i className="bi bi-book me-1"></i> Cómics</Link></li>
              <li><Link to="/personajes" className={location.pathname === '/personajes' ? 'active' : ''} style={{ color: location.pathname === '/personajes' ? '#eb5d1e' : 'white', fontWeight: 'bold' }}><i className="bi bi-people me-1"></i> Personajes</Link></li>
              <li><Link to="/buscador" className={location.pathname === '/buscador' ? 'active' : ''} style={{ color: location.pathname === '/buscador' ? '#eb5d1e' : 'white', fontWeight: 'bold' }}><i className="bi bi-search me-1"></i> Buscador</Link></li>
              <li>
                <Link to="/halloffame" className={location.pathname === '/halloffame' ? 'active' : ''} style={{ color: location.pathname === '/halloffame' ? '#eb5d1e' : 'white', fontWeight: 'bold' }}>
                  <i className="bi bi-trophy me-1"></i> Hall of Fame
                </Link>
              </li>
              <li>
                <Link to="/comunidad" className={location.pathname === '/comunidad' ? 'active' : ''} style={{ color: location.pathname === '/comunidad' ? '#eb5d1e' : 'white', fontWeight: 'bold' }}>
                  <i className="bi bi-chat-left-text me-1"></i> Foro
                </Link>
              </li>
              <li>
                <Link to="/ia" className={location.pathname === '/ia' ? 'active' : ''} style={{ color: location.pathname === '/ia' ? '#eb5d1e' : 'white', fontWeight: 'bold' }}>
                  <i className="bi bi-robot me-1"></i> JARVIS-C
                </Link>
              </li>
              {/* Mostramos el nombre del agente si está logueado */}
              <li>
                <Link to="/perfil" className={location.pathname === '/perfil' ? 'active' : ''} style={{ color: location.pathname === '/perfil' ? '#eb5d1e' : 'white', fontWeight: 'bold' }}>
                  <i className="bi bi-person-badge me-1"></i> {usuario ? usuario.nombre : "Mi Perfil"}
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Banner del Hall of Fame (solo visible en / y /personajes) */}
      <HallOfFameBanner
        topHeroes={topHeroes}
        topComics={topComics}
        pathname={location.pathname}
      />

      {/* ======= ENRUTAMIENTO PRINCIPAL ======= */}
      <main id="main" style={{ marginTop: '120px', minHeight: '80vh' }}>
        <Routes>
          {/* Catálogo de cómics */}
          <Route path="/" element={
            <>
              <div className="container shadow-sm p-3 mb-5 bg-dark rounded">
                <h2 className="text-white text-center">Catálogo de Cómics</h2>
              </div>
              <ComicList onOpenModal={handleOpenModal} onToggleFav={handleToggleFav} favoritos={favoritos} />
            </>
          } />

          {/* Galería de personajes */}
          <Route path="/personajes" element={
            <>
              <div className="container shadow-sm p-3 mb-5 bg-dark rounded">
                <h2 className="text-white text-center">Héroes del Multiverso</h2>
              </div>
              <HeroList onOpenModal={handleOpenModal} onToggleFav={handleToggleFav} favoritos={favoritos} />
            </>
          } />

          {/* Buscador multicriterio */}
          <Route path="/buscador" element={<Buscador onOpenModal={handleOpenModal} onToggleFav={handleToggleFav} favoritos={favoritos} />} />

          {/* Perfil del agente: login, favoritos, cambio de clave */}
          <Route path="/perfil" element={
            <PerfilUser
              favoritos={favoritos}
              onOpenModal={handleOpenModal}
              onToggleFav={handleToggleFav}
              onLogin={handleLoginSuccess}
              onLogout={handleLogout}
              usuarioLogueado={usuario}
              onToast={showToast}
            />
          } />

          {/* Hall of Fame de héroes y cómics mejor valorados */}
          <Route path="/halloffame" element={<HallOfFame />} />

          {/* Foro de la comunidad */}
          <Route path="/comunidad" element={<Foro usuarioLogueado={usuario} />} />

          {/* Chatbot JARVIS-C (Gemini) */}
          <Route path="/ia" element={<AgenteIA />} />
        </Routes>
      </main>

      {/* ======= MODAL DE DETALLES ======= */}
      {/* Se abre al hacer clic en una tarjeta de cómic o personaje */}
      {showModal && selectedItem && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content-marvel" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={handleCloseModal}>&times;</button>
            <div className="modal-body-marvel">
              <div className="modal-img">
                <img src={selectedItem.thumbnail} alt={selectedItem.name} />
              </div>
              <div className="modal-info">
                <h2>{selectedItem.name || selectedItem.title}</h2>
                {/* DOMPurify elimina scripts maliciosos del HTML que viene de la API */}
                <div className="bio-completa" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedItem.description || '') }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======= SISTEMA DE NOTIFICACIONES TOAST ======= */}
      <div className="toast-container">
        {toast && (
          <div className="marvel-toast">
            <i className="bi bi-shield-check"></i>
            <div>
              <strong style={{ display: 'block', color: '#FF5858' }}>SISTEMA DE ALERTAS</strong>
              <span>{toast}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
