import { useState } from 'react';
import axios from 'axios';

// Longitud mínima para nombre de usuario y contraseña
const MIN_LENGTH = 6;

/**
 * Componente RegistroUser
 * Formulario de alta de nuevos agentes. Valida los campos en el cliente antes
 * de enviar al servidor: longitud mínima de nombre y contraseña, y que ambas
 * contraseñas coincidan. Los errores se muestran inline sin alertas del navegador.
 *
 * Props:
 *   onToggleVista — callback para volver a la vista de login tras el registro exitoso
 */
const RegistroUser = ({ onToggleVista }) => {
  // Datos del nuevo usuario (nombre y contraseña)
  const [nuevoUsuario, setNuevoUsuario] = useState({ nombre: '', password: '' });
  // Campo de confirmación de contraseña (solo para validación en cliente)
  const [confirmPassword, setConfirmPassword] = useState('');
  // Mensaje de error inline (vacío = sin error)
  const [error, setError] = useState('');

  /**
   * Valida los campos y envía el registro al servidor.
   * Si tiene éxito, vuelve a la vista de login mediante el callback.
   */
  const handleRegistro = async (e) => {
    e.preventDefault();
    setError(''); // Limpiamos cualquier error previo

    // Validaciones en el cliente para no hacer peticiones innecesarias al servidor
    if (nuevoUsuario.nombre.length < MIN_LENGTH) {
      return setError(`El ID de Agente debe tener al menos ${MIN_LENGTH} caracteres.`);
    }
    if (nuevoUsuario.password.length < MIN_LENGTH) {
      return setError(`La clave debe tener al menos ${MIN_LENGTH} caracteres.`);
    }
    if (nuevoUsuario.password !== confirmPassword) {
      return setError('Las claves no coinciden. Verifica e inténtalo de nuevo.');
    }

    try {
      const response = await axios.post(`${process.env.REACT_APP_SERVER_URL}/registro`, nuevoUsuario);
      if (response.data.success) {
        // Registro exitoso: volvemos al formulario de login
        onToggleVista();
      } else {
        // El servidor rechazó el registro (ej. nombre ya en uso)
        setError(response.data.message);
      }
    } catch (err) {
      setError('Error de conexión con el servidor de Stark.');
    }
  };

  return (
    <div className="stark-terminal p-5">
      <h2 className="text-white mb-4">REGISTRO DE NUEVO AGENTE</h2>

      {/* Mensaje de error inline: solo visible cuando hay un error */}
      {error && (
        <div className="alert alert-danger py-2 small" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>{error}
        </div>
      )}

      <form onSubmit={handleRegistro}>
        {/* Campo: ID de Agente (nombre de usuario) */}
        <div className="mb-3">
          <label className="text-danger small fw-bold">ID DE AGENTE (mín. {MIN_LENGTH} caracteres)</label>
          <input
            type="text"
            className="form-control bg-transparent text-white border-secondary"
            value={nuevoUsuario.nombre}
            onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, nombre: e.target.value })}
            required
          />
        </div>

        {/* Campo: Contraseña */}
        <div className="mb-3">
          <label className="text-danger small fw-bold">CLAVE DE ENCRIPTACIÓN (mín. {MIN_LENGTH} caracteres)</label>
          <input
            type="password"
            className="form-control bg-transparent text-white border-secondary"
            value={nuevoUsuario.password}
            onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, password: e.target.value })}
            required
          />
        </div>

        {/* Campo: Confirmación de contraseña — borde rojo si no coinciden */}
        <div className="mb-4">
          <label className="text-danger small fw-bold">CONFIRMAR CLAVE</label>
          <input
            type="password"
            className={`form-control bg-transparent text-white border-secondary ${
              confirmPassword && nuevoUsuario.password !== confirmPassword ? 'border-danger' : ''
            }`}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          {/* Aviso en tiempo real si las contraseñas no coinciden */}
          {confirmPassword && nuevoUsuario.password !== confirmPassword && (
            <small className="text-danger">Las claves no coinciden.</small>
          )}
        </div>

        <button type="submit" className="btn btn-outline-danger w-100 fw-bold">
          CONFIRMAR ALTA EN EL SISTEMA
        </button>
      </form>

      {/* Enlace para volver al login */}
      <button className="btn btn-link text-muted mt-3" onClick={onToggleVista}>
        ¿Ya tienes cuenta? Volver al Acceso
      </button>
    </div>
  );
};

export default RegistroUser;
