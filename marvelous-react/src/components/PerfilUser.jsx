import { useState, useEffect } from 'react';
import './Perfil.css';
import axios from 'axios';
import RegistroUser from './RegistroUser';

// Longitud mínima aceptada para la contraseña
const MIN_PASS_LENGTH = 6;

/**
 * Componente PerfilUser
 * Gestiona la autenticación del agente, el registro de nuevos usuarios y el
 * expediente personal: favoritos reclutados con valoración por estrellas y
 * recomendaciones inteligentes basadas en los items mejor puntuados.
 *
 * Props:
 *   favoritos       — lista de favoritos del usuario (sincronizada desde App.js)
 *   onOpenModal     — abre el modal de detalles con un item
 *   onToggleFav     — añade/elimina un favorito
 *   onLogin         — callback al login exitoso
 *   onLogout        — callback al cerrar sesión
 *   usuarioLogueado — objeto con los datos del agente en sesión (o null)
 *   onToast         — muestra una notificación emergente en App.js
 */
const PerfilUser = ({ favoritos: iniciales = [], onToggleFav, onLogin, onLogout, usuarioLogueado, onToast }) => {

  // Credenciales del formulario de login
  const [credenciales, setCredenciales] = useState({ nombre: '', password: '' });
  // Alterna entre el formulario de login y el de registro
  const [mostrarRegistro, setMostrarRegistro] = useState(false);
  // Valor del campo de nueva contraseña
  const [nuevaClave, setNuevaClave] = useState('');
  // Cómics sugeridos por el motor de recomendaciones
  const [sugeridos, setSugeridos] = useState([]);
  // Favorito con 5 estrellas que sirve como semilla para las sugerencias
  const [recomendacion, setRecomendacion] = useState(null);
  // Copia local de favoritos para actualizar estrellas sin refrescar App.js
  const [favoritos, setFavoritos] = useState(iniciales);

  // Sincronización con App.js: si se borra un favorito externamente, actualizamos aquí
  useEffect(() => {
    setFavoritos(iniciales);
  }, [iniciales]);

  /**
   * LOGIN
   * Envía las credenciales al servidor. Si la autenticación es correcta,
   * propaga el usuario hacia App.js mediante el callback onLogin.
   */
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${process.env.REACT_APP_SERVER_URL}/login`, credenciales);
      if (response.data.auth) {
        onLogin(response.data.user);
      } else {
        onToast("❌ Acceso Denegado: " + response.data.message);
      }
    } catch (error) {
      onToast("🚀 Error: El servidor de Stark no responde.");
    }
  };

  /**
   * CAMBIO DE CONTRASEÑA
   * Valida la longitud mínima y envía el hash nuevo al servidor.
   */
  const handleUpdatePass = async () => {
    if (!nuevaClave) return onToast("Escribe una nueva clave de acceso.");
    if (nuevaClave.length < MIN_PASS_LENGTH) return onToast(`La clave debe tener al menos ${MIN_PASS_LENGTH} caracteres.`);
    try {
      const res = await axios.post(`${process.env.REACT_APP_SERVER_URL}/update-pass`, {
        id_usuario: usuarioLogueado.id_usuario,
        nuevaPass: nuevaClave
      });
      if (res.data.success) {
        onToast("🔐 Protocolo completado: Clave actualizada correctamente.");
        setNuevaClave('');
      }
    } catch (error) {
      onToast("🚀 Error al conectar con la central de datos.");
    }
  };

  /**
   * VALORACIÓN POR ESTRELLAS
   * Guarda la puntuación en la base de datos y actualiza el estado local
   * de forma inmediata para que el cambio sea visible sin recargar.
   */
  const handleRate = async (id_fav, valor) => {
    try {
      await axios.post(`${process.env.REACT_APP_SERVER_URL}/favoritos/rate`, {
        id_usuario: usuarioLogueado.id_usuario,
        id_favorito: id_fav,
        estrellas: valor
      });
      // Actualizamos solo el campo estrellas del favorito correspondiente
      setFavoritos(prevFavs =>
        prevFavs.map(fav =>
          fav.id === id_fav ? { ...fav, estrellas: valor } : fav
        )
      );
      console.log(`✨ Valoración de ${valor} estrellas guardada correctamente.`);
    } catch (error) {
      console.error("Error al calificar el activo:", error);
    }
  };

  /**
   * MOTOR DE RECOMENDACIONES — FASE 1
   * Cuando cambia el usuario o su lista de favoritos, pedimos al servidor
   * que nos devuelva un favorito con 5 estrellas al azar (semilla de búsqueda).
   */
  useEffect(() => {
    const obtenerSugerencia = async () => {
      if (usuarioLogueado) {
        try {
          const res = await axios.get(`${process.env.REACT_APP_SERVER_URL}/recomendaciones/${usuarioLogueado.id_usuario}`);
          console.log("🔍 RESPUESTA DEL SERVIDOR:", res.data);
          if (res.data.success && res.data.nombre) {
            console.log("✅ Nombre detectado:", res.data.nombre);
            setRecomendacion(res.data);
          } else {
            console.warn("⚠️ Sin recomendación disponible:", res.data.message);
          }
        } catch (error) {
          console.error("❌ Error en la petición axios:", error);
        }
      }
    };
    obtenerSugerencia();
  }, [usuarioLogueado, favoritos]); // Se re-ejecuta si cambian favoritos o el usuario

  /**
   * MOTOR DE RECOMENDACIONES — FASE 2
   * Una vez tenemos la semilla (recomendacion.nombre), buscamos cómics similares
   * en Comic Vine a través del proxy del servidor.
   */
  useEffect(() => {
    const buscarSugerenciasReales = async () => {
      if (recomendacion && recomendacion.nombre) {
        try {
          const res = await axios.get(`${process.env.REACT_APP_SERVER_URL}/api/comicvine/sugerencias`, {
            params: { nombre: recomendacion.nombre, exclude_id: recomendacion.id_marvel }
          });
          if (res.data.results) {
            setSugeridos(res.data.results);
          }
        } catch (error) {
          console.error("Error en el escaneo de la API:", error);
        }
      }
    };
    buscarSugerenciasReales();
  }, [recomendacion]);

  // ======= RENDERIZADO CONDICIONAL: SIN SESIÓN =======
  // Si no hay usuario logueado mostramos el login o el registro
  if (!usuarioLogueado) {
    return (
      <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        {mostrarRegistro ? (
          // Vista de registro de nuevo agente
          <RegistroUser onToggleVista={() => setMostrarRegistro(false)} />
        ) : (
          // Vista de login
          <div className="stark-terminal p-5 shadow-lg">
            <h2 className="text-white mb-4">ACCESO AL SISTEMA</h2>
            <form onSubmit={handleLogin}>
              <div className="mb-3">
                <label className="text-danger small fw-bold mb-1">ID DE AGENTE</label>
                <input type="text" className="form-control bg-transparent text-white border-secondary"
                  onChange={(e) => setCredenciales({...credenciales, nombre: e.target.value})} required />
              </div>
              <div className="mb-4">
                <label className="text-danger small fw-bold mb-1">CLAVE</label>
                <input type="password" title="pass" className="form-control bg-transparent text-white border-secondary"
                  onChange={(e) => setCredenciales({...credenciales, password: e.target.value})} required />
              </div>
              <button type="submit" className="btn btn-outline-danger w-100 fw-bold">INICIAR PROTOCOLO</button>
            </form>
            <div className="mt-4 text-center">
              <small className="text-muted">¿NUEVO RECLUTA?
                <span className="text-danger ms-1 fw-bold" style={{cursor:'pointer'}}
                  onClick={() => setMostrarRegistro(true)}> REGISTRAR</span>
              </small>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ======= RENDERIZADO: EXPEDIENTE DEL AGENTE =======
  return (
    <div className="container profile-container mt-4">

      {/* Carnet de agente: avatar, nombre y cambio de contraseña */}
      <div className="profile-card mb-5 p-4 border border-secondary shadow">
        <div className="row align-items-center">
          <div className="col-md-3 text-center">
            <img src="/assets/img/logo-no-background.svg" alt="Avatar" className="profile-avatar" style={{maxHeight: '100px'}} />
          </div>
          <div className="col-md-9">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <h5 className="text-danger mb-0">EXPEDIENTE CONFIDENCIAL</h5>
                <h2 className="text-white display-5 fw-bold">{usuarioLogueado.nombre.toUpperCase()}</h2>
              </div>
              <button className="btn btn-sm btn-outline-secondary" onClick={onLogout}>Desconectar</button>
            </div>
            {/* Formulario inline para actualizar contraseña */}
            <div className="mt-3 d-flex gap-2">
              <input type="password" title="newpass" className="form-control form-control-sm bg-dark text-white border-secondary w-50"
                placeholder="Nueva clave..." value={nuevaClave} onChange={(e) => setNuevaClave(e.target.value)} />
              <button className="btn btn-sm btn-outline-danger" onClick={handleUpdatePass}>Actualizar Clave</button>
            </div>
          </div>
        </div>
      </div>

      {/* ======= RECOMENDACIONES INTELIGENTES ======= */}
      {/* Solo se muestra cuando el motor encontró cómics similares */}
      {sugeridos.length > 0 && (
        <div className="alert bg-dark border-danger shadow-lg p-4 mb-5">
          <h5 className="text-danger fw-bold mb-3">
            <i className="bi bi-radar me-2"></i> INTELIGENCIA S.H.I.E.L.D.: ACTIVOS RECOMENDADOS
          </h5>
          <p className="small text-white-50">Detectado interés prioritario en: <strong>{recomendacion.nombre}</strong></p>

          <div className="row g-3">
            {sugeridos.map(sug => (
              <div key={sug.id} className="col-6 col-md-3">
                <div className="card bg-black border-secondary h-100 shadow-sm overflow-hidden" style={{fontSize: '0.75rem'}}>
                  <img
                    src={sug.image?.small_url || "https://via.placeholder.com/150"}
                    className="card-img-top"
                    style={{height: '120px', objectFit: 'cover'}}
                    alt="Sugerencia"
                  />
                  <div className="card-body p-2 d-flex flex-column justify-content-between">
                    <span className="text-white truncate d-block mb-2">
                      {sug.name || sug.volume?.name || "Activo Sugerido"}
                    </span>
                    {/* Botón de reclutamiento rápido desde las sugerencias */}
                    <button
                      className="btn btn-xs btn-outline-danger py-0 fw-bold"
                      onClick={(e) => onToggleFav(sug, e)}
                    >
                      + RECLUTAR
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======= GALERÍA DE FAVORITOS RECLUTADOS ======= */}
      <div className="favoritos-section">
        <h3 className="text-white mb-4 border-bottom border-danger d-inline-block pb-2">
          <i className="bi bi-shield-fill-check me-2"></i>ACTIVOS RECLUTADOS
        </h3>

        <div className="row gy-4">
          {favoritos.length === 0 ? (
            <p className="text-muted text-center py-5">No hay activos vinculados a este ID de agente.</p>
          ) : (
            favoritos.map((fav) => (
              <div key={fav.id} className="col-6 col-md-4 col-lg-3">
                <div className="card bg-dark border-secondary h-100 overflow-hidden position-relative shadow-sm fav-card">

                  {/* Etiqueta de tipo con color e icono según la categoría del favorito */}
                  <span className={`badge position-absolute top-0 end-0 m-2 shadow-sm ${
                    fav.tipo === 'hero'   ? 'bg-danger' :
                    fav.tipo === 'movie'  ? 'bg-primary' :
                    fav.tipo === 'series' ? 'bg-warning text-dark' :
                    'bg-info'
                  }`} style={{ zIndex: 2 }}>
                    <i className={`bi ${
                      fav.tipo === 'hero'   ? 'bi-person-badge' :
                      fav.tipo === 'movie'  ? 'bi-film' :
                      fav.tipo === 'series' ? 'bi-tv' :
                      'bi-book'
                    } me-1`}></i>
                    {fav.tipo === 'hero'   ? 'HÉROE'    :
                     fav.tipo === 'movie'  ? 'PELÍCULA' :
                     fav.tipo === 'series' ? 'SERIE'    :
                     'CÓMIC'}
                  </span>

                  {/* Portada del favorito */}
                  <div className="p-2" style={{ height: '200px', overflow: 'hidden' }}>
                    <img src={fav.imagen_url || "https://via.placeholder.com/300x450"} alt="Activo"
                      className="w-100 h-100" style={{ objectFit: 'contain' }} />
                  </div>

                  {/* Sistema de valoración y botón de eliminación */}
                  <div className="card-body p-2 text-center border-top border-secondary">
                    {/* 5 estrellas clicables: amarillas si están activas, grises si no */}
                    <div className="stars-rating mb-2">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <i
                          key={num}
                          className={`bi ${num <= (fav.estrellas || 0) ? 'bi-star-fill text-warning' : 'bi-star text-secondary'} me-1`}
                          style={{ cursor: 'pointer', fontSize: '1.1rem' }}
                          onClick={() => handleRate(fav.id, num)}
                        ></i>
                      ))}
                    </div>
                    <small className="text-white-50 d-block mb-2">REGISTRO: #{fav.id}</small>

                    {/* Eliminación del favorito: traducimos el tipo interno al resource_type
                        que espera handleToggleFav en App.js */}
                    <button
                      className="btn btn-sm btn-outline-danger w-100"
                      onClick={(e) => {
                        const rt = fav.tipo === 'hero'   ? 'character' :
                                   fav.tipo === 'movie'  ? 'movie'     :
                                   fav.tipo === 'series' ? 'series'    : 'issue';
                        onToggleFav({ id: fav.id, resource_type: rt }, e);
                      }}
                    >
                      <i className="bi bi-trash3-fill me-1"></i>ELIMINAR
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PerfilUser;
