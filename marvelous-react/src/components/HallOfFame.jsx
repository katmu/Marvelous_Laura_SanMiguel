import React, { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Componente HallOfFame
 * Muestra el top 5 de cada categoría (héroes, películas, series y cómics)
 * ordenado por promedio de estrellas de todos los usuarios.
 * Los datos se cargan en paralelo al montar el componente.
 */
const HallOfFame = () => {
  // Rankings organizados por categoría
  const [rankings, setRankings] = useState({ hero: [], comic: [], movie: [], series: [] });
  // Indicador de carga mientras se esperan las 4 peticiones
  const [loading, setLoading] = useState(true);

  // Cargamos los 4 rankings en paralelo al montar el componente
  useEffect(() => {
    const cargarTodo = async () => {
      try {
        setLoading(true);
        // Promise.all garantiza que esperamos todas las respuestas antes de actualizar el estado
        const [h, c, m, s] = await Promise.all([
          axios.get(`${process.env.REACT_APP_SERVER_URL}/api/hall-of-fame/hero`),
          axios.get(`${process.env.REACT_APP_SERVER_URL}/api/hall-of-fame/comic`),
          axios.get(`${process.env.REACT_APP_SERVER_URL}/api/hall-of-fame/movie`),
          axios.get(`${process.env.REACT_APP_SERVER_URL}/api/hall-of-fame/series`)
        ]);
        setRankings({ hero: h.data, comic: c.data, movie: m.data, series: s.data });
      } catch (error) {
        console.error("Error en el Olimpo Marvel:", error);
      } finally {
        setLoading(false);
      }
    };
    cargarTodo();
  }, []);

  /**
   * Renderiza una sección del ranking con su título, color e icono.
   * Cada item muestra posición, imagen, nombre y promedio de estrellas.
   *
   * @param {string} titulo  — Nombre de la sección
   * @param {Array}  lista   — Array de items del ranking
   * @param {string} color   — Color Bootstrap (danger, primary, warning, success)
   * @param {string} icono   — Clase de Bootstrap Icons
   */
  const renderSeccion = (titulo, lista, color, icono) => (
    <div className="mb-5 animate__animated animate__fadeIn">
      <h3 className={`text-${color} mb-4 border-bottom border-${color} pb-2`}>
        <i className={`bi ${icono} me-2`}></i> {titulo}
      </h3>
      {/* justify-content-center centra las tarjetas cuando hay menos de 5 */}
      <div className="row g-4 justify-content-center">
        {lista.length > 0 ? (
          lista.map((item, index) => (
            <div key={`${item.id_favorito}-${index}`} className="col-xl-2 col-lg-3 col-md-4 col-sm-6 text-center">
              <div className={`card bg-dark border-${color} h-100 shadow-sm`} style={{overflow: 'hidden'}}>
                <div className="position-relative">
                  {/* Imagen de portada con fallback si no hay URL */}
                  <img
                    src={item.imagen_url || 'https://via.placeholder.com/200x180?text=Sin+imagen'}
                    className="card-img-top"
                    alt={item.nombre}
                    style={{height: '180px', objectFit: 'cover'}}
                  />
                  {/* Medalla de posición (#1, #2…) */}
                  <span className={`position-absolute top-0 start-0 badge bg-${color} m-1`}>#{index + 1}</span>
                </div>
                <div className="card-body p-2">
                  <h6 className="text-white small text-truncate m-0" title={item.nombre}>{item.nombre}</h6>
                  {/* Promedio con 1 decimal */}
                  <p className="text-warning m-0" style={{fontSize: '0.7rem'}}>
                    ⭐ {parseFloat(item.promedio).toFixed(1)} promedio
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-muted small ms-3">Esperando nuevos votos en esta categoría...</p>
        )}
      </div>
    </div>
  );

  if (loading) return <div className="text-center text-white mt-5">Cargando el archivo histórico...</div>;

  return (
    <div className="container mt-5">
      <div className="text-center mb-5">
        <h1 className="text-white fw-bold display-4">🏆 HALL OF FAME 🏆</h1>
        <p className="text-danger fw-bold">LOS MÁS BUSCADOS DEL MULTIVERSO</p>
      </div>

      {/* Renderizamos las 4 secciones con sus colores e iconos temáticos */}
      {renderSeccion("Top 5 Leyendas", rankings.hero, "danger", "bi-shield-fill-check")}
      {renderSeccion("Top 5 Taquillazo (Cine)", rankings.movie, "primary", "bi-film")}
      {renderSeccion("Top 5 Series & TV", rankings.series, "warning", "bi-tv")}
      {renderSeccion("Top 5 Lecturas (Cómics)", rankings.comic, "success", "bi-book")}
    </div>
  );
};

export default HallOfFame;
