import React, { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * COMPONENTE: MuroAgentes
 * Gestiona un sistema de mensajería persistente con validación de autoría.
 */
const MuroAgentes = ({ usuarioLogueado }) => {
    // Definición de estados para el manejo de datos y notificaciones
    const [mensajes, setMensajes] = useState([]); // Almacén de transmisiones recuperadas
    const [nuevoTexto, setNuevoTexto] = useState(""); // Captura de entrada del usuario
    const [toast, setToast] = useState(null); // Estado para avisos internos del sistema

    /**
     * Recupera el historial de mensajes desde el servidor Express.
     */
    const cargarMensajes = async () => {
        try {
            const res = await axios.get(`${process.env.REACT_APP_SERVER_URL}/api/muro`);
            setMensajes(res.data);
        } catch (err) {
            console.error("Error cargando el muro:", err);
        }
    };

    /**
     * Ejecuta el borrado de una transmisión tras verificar la propiedad del usuario.
     * @param {number} id_mensaje - Identificador único de la fila en la DB.
     */
    const borrarMensaje = async (id_mensaje) => {
        try {
            // Identificación del autor actual mediante la sesión activa
            const idActual = usuarioLogueado?.id_usuario || usuarioLogueado?.id;
            
            // Petición DELETE enviando el ID del autor para validación en el servidor
            await axios.delete(`${process.env.REACT_APP_SERVER_URL}/api/muro/${id_mensaje}`, {
                data: { id_usuario: idActual } 
            });

            // Notificación de éxito y actualización de la vista
            setToast({ texto: "Transmisión eliminada del registro central", tipo: "marvel" });
            setTimeout(() => setToast(null), 3000);
            cargarMensajes(); 

        } catch (err) {
            console.error("Error al borrar:", err);
            setToast({ texto: "Fallo de seguridad: No se pudo eliminar", tipo: "danger" });
            setTimeout(() => setToast(null), 3000);
        }
    };

    /**
     * Hook de ciclo de vida: Inicializa los datos y establece un sondeo cada 10 segundos.
     */
    useEffect(() => {
        cargarMensajes();
        const intervalo = setInterval(cargarMensajes, 30000);
        return () => clearInterval(intervalo);
    }, []);

    /**
     * Procesa el envío de un nuevo reporte de misión.
     * @param {Event} e - Evento de envío del formulario.
     */
    const enviarMensaje = async (e) => {
        e.preventDefault();
        if (!nuevoTexto.trim() || !usuarioLogueado) return;

        try {
            const idActual = usuarioLogueado?.id_usuario || usuarioLogueado?.id;
            await axios.post(`${process.env.REACT_APP_SERVER_URL}/api/muro`, {
                id_usuario: idActual,
                texto: nuevoTexto
            });
            
            setNuevoTexto("");
            cargarMensajes();
            
            setToast({ texto: "Reporte enviado correctamente", tipo: "marvel" });
            setTimeout(() => setToast(null), 3000);

        } catch (err) {
            setToast({ texto: "Error en el envío de datos", tipo: "danger" });
            setTimeout(() => setToast(null), 3000);
        }
    };

    return (
        <div className="container" style={{ marginTop: '50px', color: 'white', paddingBottom: '100px' }}>
            
            {/* Visualización condicional de notificaciones de estado */}
            {toast && (
                <div 
                    className="position-fixed bottom-0 end-0 m-3 shadow-lg animate__animated animate__fadeInUp" 
                    style={{ 
                        zIndex: 1050, 
                        borderRadius: '8px',
                        backgroundColor: toast.tipo === 'marvel' ? '#e62429' : '#dc3545',
                        color: 'white',
                        padding: '12px 20px',
                        fontWeight: 'bold',
                        border: '1px solid white'
                    }}
                >
                    <i className="bi bi-shield-fill-check me-2"></i>{toast.texto}
                </div>
            )}

            <h2 className="text-info border-bottom border-info pb-3 mb-4">
                <i className="bi bi-chat-right-dots-fill me-2"></i>MURO DE TRANSMISIONES OMEGA
            </h2>

            {/* Interfaz de redacción de reportes */}
            <div className="bg-dark p-4 rounded mb-5 border border-secondary shadow-lg">
                <form onSubmit={enviarMensaje}>
                    <textarea
                        className="form-control bg-black text-white border-secondary mb-1"
                        rows="3"
                        maxLength={500}
                        placeholder={usuarioLogueado ? "Redactar reporte de misión..." : "⚠️ Inicia sesión para reportar"}
                        value={nuevoTexto}
                        onChange={(e) => setNuevoTexto(e.target.value)}
                        disabled={!usuarioLogueado}
                    />
                    <div className={`text-end mb-3 small ${nuevoTexto.length >= 500 ? 'text-danger' : 'text-muted'}`}>
                        {nuevoTexto.length}/500
                    </div>
                    <button
                        type="submit"
                        className="btn btn-info w-100 fw-bold shadow-sm"
                        disabled={!usuarioLogueado || !nuevoTexto.trim()}
                    >
                        ENVIAR REPORTE
                    </button>
                </form>
            </div>

            {/* Mapeo dinámico del historial de transmisiones */}
            <div className="row g-4">
                {mensajes.map((m) => {
                    // Verificación de autoría comparando el ID del usuario actual con el autor del mensaje
                    const miID = usuarioLogueado?.id_usuario || usuarioLogueado?.id;
                    const mensajeIDUser = m.id_usuario || m.ID_USUARIO;
                    const esMiMensaje = usuarioLogueado && String(miID) === String(mensajeIDUser);

                    return (
                        <div key={m.id_mensaje} className={`col-12 d-flex ${esMiMensaje ? 'justify-content-end' : 'justify-content-start'}`}>
                            <div 
                                className={`card p-3 shadow-sm ${esMiMensaje ? 'bg-info text-dark' : 'bg-dark text-white border-secondary'}`} 
                                style={{ maxWidth: '75%', borderRadius: '15px' }}
                            >
                                <div className="d-flex justify-content-between align-items-center mb-2 border-bottom border-secondary">
                                    <strong className="small text-uppercase">
                                        {esMiMensaje ? 'Tú (Agente)' : `Agente: ${m.nombre}`}
                                    </strong>
                                    <div>
                                        <small className="me-2" style={{fontSize: '0.75rem'}}>
                                            {new Date(m.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </small>
                                        
                                        {/* Control de eliminación restringido exclusivamente al propietario */}
                                        {esMiMensaje && (
                                            <i 
                                                className="bi bi-trash3-fill text-danger" 
                                                style={{ cursor: 'pointer' }} 
                                                onClick={() => borrarMensaje(m.id_mensaje)}
                                                title="Eliminar registro"
                                            ></i>
                                        )}
                                    </div>
                                </div>
                                <p className="mb-0 fw-medium" style={{ wordWrap: 'break-word' }}>{m.texto}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default MuroAgentes;