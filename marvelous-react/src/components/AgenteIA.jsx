import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const SERVER = process.env.REACT_APP_SERVER_URL;

/**
 * Componente AgenteIA — Chatbot JARVIS-C
 * Interfaz de chat con el modelo Gemini 2.5 Flash configurado como experto
 * en el universo Marvel y DC. El historial de conversación se mantiene en el
 * estado local y se envía completo en cada petición para que el servidor pueda
 * reconstruir el contexto (arquitectura stateless).
 */
const AgenteIA = () => {
  // Historial de mensajes: cada elemento tiene { role: 'user'|'model', text: string }
  const [messages, setMessages] = useState([]);
  // Texto del input del usuario
  const [input, setInput] = useState('');
  // Indica si estamos esperando respuesta del servidor
  const [loading, setLoading] = useState(false);
  // Referencia al div final del chat para hacer scroll automático
  const bottomRef = useRef(null);

  // Cada vez que llega un mensaje nuevo o empieza la carga, hacemos scroll al fondo
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  /**
   * Envía el mensaje al servidor y añade la respuesta al historial.
   * El historial previo (sin el mensaje actual) se manda junto a la petición
   * para que Gemini tenga contexto de toda la conversación.
   */
  const enviarMensaje = async (e) => {
    e.preventDefault();
    const texto = input.trim();
    if (!texto || loading) return;

    setInput('');
    // Añadimos el mensaje del usuario al historial antes de esperar la respuesta
    const historialConNuevo = [...messages, { role: 'user', text: texto }];
    setMessages(historialConNuevo);
    setLoading(true);

    try {
      const res = await axios.post(`${SERVER}/api/ia/chat`, {
        history: messages, // historial previo sin el mensaje actual
        message: texto
      });
      // Añadimos la respuesta del modelo al historial
      setMessages([...historialConNuevo, { role: 'model', text: res.data.reply }]);
    } catch {
      // Si falla la conexión, mostramos un mensaje de error como respuesta del bot
      setMessages([...historialConNuevo, {
        role: 'model',
        text: '⚠️ Error de conexión con el servidor. Asegúrate de que Express esté corriendo e inténtalo de nuevo.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4" style={{ maxWidth: '800px', paddingBottom: '80px' }}>

      {/* ======= CABECERA DEL AGENTE ======= */}
      <div className="text-center mb-4">
        <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-danger mb-3"
             style={{ width: 64, height: 64 }}>
          <i className="bi bi-robot text-white" style={{ fontSize: '1.8rem' }}></i>
        </div>
        <h2 className="text-white fw-bold mb-0">JARVIS-C</h2>
        <p className="text-danger small fw-bold mb-0">AGENTE DE INTELIGENCIA ARTIFICIAL · S.H.I.E.L.D.</p>
        <p className="text-white-50 small mt-1">Especialista en el universo Marvel y DC</p>
      </div>

      {/* ======= ÁREA DE CHAT ======= */}
      <div
        className="bg-dark border border-secondary rounded p-3 mb-3"
        style={{ height: '480px', overflowY: 'auto' }}
      >
        {/* Mensaje de bienvenida: solo se muestra si no hay conversación aún.
            No se guarda en el estado ni se envía a la API. */}
        {messages.length === 0 && !loading && (
          <div className="d-flex justify-content-start mb-3">
            <div className="me-2 flex-shrink-0">
              <div className="rounded-circle bg-danger d-flex align-items-center justify-content-center"
                   style={{ width: 36, height: 36 }}>
                <i className="bi bi-robot text-white" style={{ fontSize: '0.85rem' }}></i>
              </div>
            </div>
            <div className="bg-secondary text-white rounded p-3" style={{ maxWidth: '80%', fontSize: '0.9rem' }}>
              ¡Saludos, Agente! Soy JARVIS-C, tu especialista en el multiverso Marvel y DC. Pregúntame sobre héroes, villanos, arcos argumentales, películas, cómics... ¡Todo el universo está a tu disposición!
            </div>
          </div>
        )}

        {/* Renderizamos el historial de mensajes */}
        {messages.map((msg, i) => (
          <div key={i} className={`d-flex mb-3 ${msg.role === 'user' ? 'justify-content-end' : 'justify-content-start'}`}>
            {/* Avatar del bot (izquierda) */}
            {msg.role === 'model' && (
              <div className="me-2 flex-shrink-0">
                <div className="rounded-circle bg-danger d-flex align-items-center justify-content-center"
                     style={{ width: 36, height: 36 }}>
                  <i className="bi bi-robot text-white" style={{ fontSize: '0.85rem' }}></i>
                </div>
              </div>
            )}
            {/* Burbuja del mensaje: roja para el usuario, gris para el bot */}
            <div
              className={`rounded p-3 shadow-sm ${msg.role === 'user' ? 'bg-danger text-white' : 'bg-secondary text-white'}`}
              style={{ maxWidth: '78%', whiteSpace: 'pre-wrap', fontSize: '0.9rem', lineHeight: '1.5' }}
            >
              {msg.text}
            </div>
            {/* Avatar del usuario (derecha) */}
            {msg.role === 'user' && (
              <div className="ms-2 flex-shrink-0">
                <div className="rounded-circle bg-dark border border-secondary d-flex align-items-center justify-content-center"
                     style={{ width: 36, height: 36 }}>
                  <i className="bi bi-person text-white" style={{ fontSize: '0.85rem' }}></i>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Indicador de escritura mientras Gemini procesa la respuesta */}
        {loading && (
          <div className="d-flex justify-content-start mb-3">
            <div className="me-2 flex-shrink-0">
              <div className="rounded-circle bg-danger d-flex align-items-center justify-content-center"
                   style={{ width: 36, height: 36 }}>
                <i className="bi bi-robot text-white" style={{ fontSize: '0.85rem' }}></i>
              </div>
            </div>
            <div className="bg-secondary rounded p-3 d-flex align-items-center gap-2">
              <div className="spinner-border spinner-border-sm text-white" role="status"></div>
              <span className="text-white-50 small">Analizando datos del multiverso...</span>
            </div>
          </div>
        )}

        {/* Ancla invisible al final del chat para el scroll automático */}
        <div ref={bottomRef} />
      </div>

      {/* ======= INPUT DE MENSAJE ======= */}
      <form onSubmit={enviarMensaje} className="d-flex gap-2">
        <input
          type="text"
          className="form-control bg-dark text-white border-secondary"
          placeholder="Pregunta sobre Marvel, DC, héroes, cómics, películas..."
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={loading}
          autoFocus
        />
        {/* El botón se desactiva si no hay texto o si ya hay una petición en curso */}
        <button
          type="submit"
          className="btn btn-danger fw-bold px-4"
          disabled={loading || !input.trim()}
        >
          <i className="bi bi-send-fill"></i>
        </button>
      </form>

      <p className="text-muted text-center small mt-3">
        <i className="bi bi-info-circle me-1"></i>
        Respuestas generadas por IA · Solo para uso relacionado con cómics Marvel y DC
      </p>
    </div>
  );
};

export default AgenteIA;
