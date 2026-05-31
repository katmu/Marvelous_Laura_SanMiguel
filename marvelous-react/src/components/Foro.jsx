import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const SERVER = process.env.REACT_APP_SERVER_URL;

/**
 * Componente Foro
 * Gestiona la comunidad de agentes: lista de hilos de discusión y vista de detalle
 * con respuestas. Solo los usuarios logueados pueden crear hilos o responder.
 * Cada autor puede eliminar únicamente su propio contenido.
 *
 * Props:
 *   usuarioLogueado — objeto con los datos del agente en sesión (o null si no hay sesión)
 */
const Foro = ({ usuarioLogueado }) => {
  // Lista de hilos para la vista principal
  const [hilos, setHilos] = useState([]);
  // Hilo actualmente abierto (null = vista de lista)
  const [hiloActivo, setHiloActivo] = useState(null);
  // Respuestas del hilo abierto
  const [respuestas, setRespuestas] = useState([]);
  // Indicador de carga inicial de hilos
  const [loading, setLoading] = useState(true);
  // Campos del formulario de nuevo hilo
  const [nuevoHilo, setNuevoHilo] = useState({ titulo: '', texto: '' });
  // Texto de la nueva respuesta
  const [nuevaRespuesta, setNuevaRespuesta] = useState('');
  // Controla si el formulario de nuevo hilo está visible
  const [mostrarFormHilo, setMostrarFormHilo] = useState(false);
  // Notificación emergente (tipo 'ok' o 'error')
  const [toast, setToast] = useState(null);

  // Extraemos el id del usuario logueado admitiendo las dos posibles claves del objeto
  const miId = usuarioLogueado?.id_usuario || usuarioLogueado?.id;

  /**
   * Muestra una notificación emergente durante 3 segundos.
   * Envuelto en useCallback para que sea estable como dependencia de useEffect.
   */
  const showToast = useCallback((texto, tipo = 'ok') => {
    setToast({ texto, tipo });
    setTimeout(() => setToast(null), 3000);
  }, []);

  /**
   * Carga la lista completa de hilos desde el servidor.
   * Envuelto en useCallback para evitar recreaciones en cada render.
   */
  const cargarHilos = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${SERVER}/api/foro/hilos`);
      setHilos(res.data);
    } catch {
      showToast('Error al cargar los hilos', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  /**
   * Carga el detalle de un hilo (datos del hilo + sus respuestas).
   * También actualiza el objeto hiloActivo con los datos más recientes del servidor.
   */
  const cargarRespuestas = useCallback(async (id_hilo) => {
    try {
      const res = await axios.get(`${SERVER}/api/foro/hilos/${id_hilo}`);
      setHiloActivo(prev => ({ ...prev, ...res.data.hilo }));
      setRespuestas(res.data.respuestas);
    } catch {
      showToast('Error al cargar respuestas', 'error');
    }
  }, [showToast]);

  // Cargamos los hilos al montar el componente
  useEffect(() => { cargarHilos(); }, [cargarHilos]);

  // Recargamos las respuestas cada vez que cambia el hilo activo
  useEffect(() => {
    if (hiloActivo?.id_hilo) cargarRespuestas(hiloActivo.id_hilo);
  }, [hiloActivo?.id_hilo, cargarRespuestas]);

  /** Envía el formulario de nuevo hilo al servidor */
  const crearHilo = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${SERVER}/api/foro/hilos`, { id_usuario: miId, ...nuevoHilo });
      setNuevoHilo({ titulo: '', texto: '' });
      setMostrarFormHilo(false);
      cargarHilos();
      showToast('Hilo publicado correctamente');
    } catch {
      showToast('Error al crear el hilo', 'error');
    }
  };

  /** Elimina un hilo completo (con todas sus respuestas por CASCADE) */
  const borrarHilo = async (id_hilo) => {
    try {
      await axios.delete(`${SERVER}/api/foro/hilos/${id_hilo}`, { data: { id_usuario: miId } });
      setHiloActivo(null);
      setRespuestas([]);
      cargarHilos();
      showToast('Hilo eliminado');
    } catch {
      showToast('No puedes borrar este hilo', 'error');
    }
  };

  /** Envía una respuesta al hilo activo */
  const responder = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${SERVER}/api/foro/respuestas`, {
        id_hilo: hiloActivo.id_hilo,
        id_usuario: miId,
        texto: nuevaRespuesta
      });
      setNuevaRespuesta('');
      cargarRespuestas(hiloActivo.id_hilo);
      showToast('Respuesta enviada');
    } catch {
      showToast('Error al enviar la respuesta', 'error');
    }
  };

  /** Elimina una respuesta concreta */
  const borrarRespuesta = async (id_respuesta) => {
    try {
      await axios.delete(`${SERVER}/api/foro/respuestas/${id_respuesta}`, { data: { id_usuario: miId } });
      cargarRespuestas(hiloActivo.id_hilo);
      showToast('Respuesta eliminada');
    } catch {
      showToast('No puedes borrar esta respuesta', 'error');
    }
  };

  /** Formatea una fecha ISO en formato legible en español (dd/mmm/yyyy hh:mm) */
  const fmt = (fecha) =>
    new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

  return (
    <div className="container py-4" style={{ maxWidth: '860px', color: 'white', paddingBottom: '100px' }}>

      {/* ======= TOAST DE NOTIFICACIONES ======= */}
      {toast && (
        <div className="position-fixed bottom-0 end-0 m-3 shadow-lg"
             style={{ zIndex: 1050, borderRadius: '8px', padding: '12px 20px', fontWeight: 'bold',
                      border: '1px solid white', color: 'white',
                      backgroundColor: toast.tipo === 'error' ? '#dc3545' : '#e62429' }}>
          <i className={`bi ${toast.tipo === 'error' ? 'bi-exclamation-triangle' : 'bi-shield-fill-check'} me-2`}></i>
          {toast.texto}
        </div>
      )}

      {hiloActivo === null ? (
        /* ========== VISTA: LISTA DE HILOS ========== */
        <>
          {/* Cabecera con título y botón para abrir nuevo hilo */}
          <div className="d-flex justify-content-between align-items-center border-bottom border-danger pb-3 mb-4">
            <h2 className="text-danger m-0">
              <i className="bi bi-chat-left-text-fill me-2"></i>FORO DE AGENTES
            </h2>
            {/* Solo los agentes logueados pueden crear hilos */}
            {usuarioLogueado && (
              <button
                className="btn btn-outline-danger btn-sm fw-bold"
                onClick={() => setMostrarFormHilo(v => !v)}
              >
                <i className={`bi ${mostrarFormHilo ? 'bi-x-circle' : 'bi-plus-circle'} me-1`}></i>
                {mostrarFormHilo ? 'Cancelar' : 'Nuevo hilo'}
              </button>
            )}
          </div>

          {/* Formulario de creación de nuevo hilo (colapsable) */}
          {mostrarFormHilo && (
            <div className="bg-dark border border-danger rounded p-4 mb-4">
              <h5 className="text-danger mb-3">Abrir nuevo hilo</h5>
              <form onSubmit={crearHilo}>
                <input
                  type="text"
                  className="form-control bg-black text-white border-secondary mb-3"
                  placeholder="Título (ej: ¿Spider-Man vs Batman, quién gana?)"
                  maxLength={200}
                  value={nuevoHilo.titulo}
                  onChange={e => setNuevoHilo({ ...nuevoHilo, titulo: e.target.value })}
                  required
                />
                <textarea
                  className="form-control bg-black text-white border-secondary mb-1"
                  rows={4}
                  maxLength={2000}
                  placeholder="Desarrolla tu mensaje..."
                  value={nuevoHilo.texto}
                  onChange={e => setNuevoHilo({ ...nuevoHilo, texto: e.target.value })}
                  required
                />
                {/* Contador de caracteres para el límite de 2000 */}
                <div className="text-end text-muted small mb-3">{nuevoHilo.texto.length}/2000</div>
                <button type="submit" className="btn btn-danger fw-bold px-4">
                  <i className="bi bi-send me-1"></i>Publicar
                </button>
              </form>
            </div>
          )}

          {/* Estados: cargando / vacío / lista de hilos */}
          {loading ? (
            <div className="text-center mt-5">
              <div className="spinner-border text-danger" role="status"></div>
            </div>
          ) : hilos.length === 0 ? (
            <p className="text-muted text-center mt-5">
              No hay hilos todavía. ¡Sé el primero en abrir uno!
            </p>
          ) : (
            <div className="d-flex flex-column gap-3">
              {hilos.map(hilo => (
                // Cada tarjeta navega al detalle del hilo al hacer clic
                <div
                  key={hilo.id_hilo}
                  className="card bg-dark border-secondary p-3 shadow-sm"
                  style={{ cursor: 'pointer', transition: 'border-color 0.2s' }}
                  onClick={() => setHiloActivo(hilo)}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#e62429'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = ''}
                >
                  <div className="d-flex justify-content-between align-items-start gap-3">
                    <div className="overflow-hidden">
                      <h5 className="text-white mb-1 text-truncate">{hilo.titulo}</h5>
                      <small className="text-muted">
                        <i className="bi bi-person-badge me-1 text-danger"></i>{hilo.nombre_usuario}
                        <span className="mx-2">·</span>
                        <i className="bi bi-clock me-1"></i>{fmt(hilo.fecha)}
                      </small>
                      {/* Vista previa del texto: máximo 2 líneas con overflow oculto */}
                      <p className="text-white-50 small mt-2 mb-0"
                         style={{ overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {hilo.texto}
                      </p>
                    </div>
                    {/* Contador de respuestas del hilo */}
                    <span className="badge bg-secondary flex-shrink-0 align-self-start mt-1">
                      <i className="bi bi-chat me-1"></i>{hilo.num_respuestas}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* ========== VISTA: DETALLE DEL HILO ACTIVO ========== */
        <>
          {/* Botón para volver a la lista */}
          <button
            className="btn btn-sm btn-outline-secondary mb-4"
            onClick={() => { setHiloActivo(null); setRespuestas([]); }}
          >
            <i className="bi bi-arrow-left me-1"></i>Volver al foro
          </button>

          {/* Mensaje original del hilo */}
          <div className="card bg-dark border-danger p-4 mb-4 shadow">
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div>
                <h4 className="text-white mb-1">{hiloActivo.titulo}</h4>
                <small className="text-muted">
                  <i className="bi bi-person-badge me-1 text-danger"></i>
                  {hiloActivo.nombre_usuario || hiloActivo.nombre}
                  <span className="mx-2">·</span>
                  {fmt(hiloActivo.fecha)}
                </small>
              </div>
              {/* Botón de borrado solo visible para el autor del hilo */}
              {String(miId) === String(hiloActivo.id_usuario) && (
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => borrarHilo(hiloActivo.id_hilo)}
                  title="Eliminar hilo"
                >
                  <i className="bi bi-trash3"></i>
                </button>
              )}
            </div>
            {/* pre-wrap para respetar saltos de línea del mensaje original */}
            <p className="text-white mb-0" style={{ whiteSpace: 'pre-wrap' }}>{hiloActivo.texto}</p>
          </div>

          {/* Cabecera de la sección de respuestas con contador */}
          <h5 className="text-danger border-bottom border-danger pb-2 mb-3">
            <i className="bi bi-chat-dots me-2"></i>Respuestas ({respuestas.length})
          </h5>

          {respuestas.length === 0 && (
            <p className="text-muted small mb-4">Sin respuestas. ¡Sé el primero en responder!</p>
          )}

          {/* Lista de respuestas estilo chat:
              - Las propias aparecen a la derecha con fondo gris oscuro
              - Las ajenas aparecen a la izquierda con fondo oscuro */}
          <div className="d-flex flex-column gap-3 mb-4">
            {respuestas.map(r => {
              const esMia = String(miId) === String(r.id_usuario);
              return (
                <div
                  key={r.id_respuesta}
                  className={`card p-3 shadow-sm ${esMia ? 'bg-secondary border-0' : 'bg-dark border-secondary'}`}
                  style={{ maxWidth: '85%', alignSelf: esMia ? 'flex-end' : 'flex-start' }}
                >
                  <div className="d-flex justify-content-between align-items-center mb-1 gap-3">
                    <small className="text-white-50">
                      <i className="bi bi-person me-1"></i>
                      {/* "Tú" para las propias; nombre real para las ajenas */}
                      {esMia ? 'Tú' : r.nombre}
                      <span className="ms-2">{fmt(r.fecha)}</span>
                    </small>
                    {/* Botón de borrado solo para las respuestas propias */}
                    {esMia && (
                      <button
                        className="btn btn-sm p-0 text-danger"
                        onClick={() => borrarRespuesta(r.id_respuesta)}
                        title="Eliminar respuesta"
                      >
                        <i className="bi bi-trash3"></i>
                      </button>
                    )}
                  </div>
                  <p className="text-white mb-0 small" style={{ whiteSpace: 'pre-wrap' }}>{r.texto}</p>
                </div>
              );
            })}
          </div>

          {/* Formulario de respuesta (solo visible si hay sesión activa) */}
          {usuarioLogueado ? (
            <form onSubmit={responder} className="bg-dark border border-secondary rounded p-3">
              <textarea
                className="form-control bg-black text-white border-secondary mb-1"
                rows={3}
                maxLength={1000}
                placeholder="Escribe tu respuesta..."
                value={nuevaRespuesta}
                onChange={e => setNuevaRespuesta(e.target.value)}
                required
              />
              <div className="d-flex justify-content-between align-items-center mt-2">
                {/* Contador de caracteres para el límite de 1000 */}
                <small className="text-muted">{nuevaRespuesta.length}/1000</small>
                <button type="submit" className="btn btn-danger btn-sm fw-bold">
                  <i className="bi bi-send me-1"></i>Responder
                </button>
              </div>
            </form>
          ) : (
            // Aviso para agentes no identificados
            <div className="alert alert-secondary text-center small">
              <i className="bi bi-lock me-1"></i>Inicia sesión para responder en el foro.
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Foro;
