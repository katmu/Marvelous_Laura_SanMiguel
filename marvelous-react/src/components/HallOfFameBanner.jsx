import React from 'react';

/**
 * Componente HallOfFameBanner
 * Muestra un banner decorativo con el top de héroes o cómics encima del catálogo.
 * Aparece solo en las rutas '/' (cómics) y '/personajes' (héroes).
 * En cualquier otra ruta el componente no renderiza nada.
 *
 * Props:
 *   topHeroes — array con los héroes mejor valorados (desde App.js)
 *   topComics — array con los cómics mejor valorados (desde App.js)
 *   pathname  — ruta activa de React Router
 */
const HallOfFameBanner = ({ topHeroes, topComics, pathname }) => {
  // En el perfil y otras rutas no mostramos el banner
  if (pathname === '/perfil') return null;

  /**
   * Renderiza una tarjeta individual del ranking.
   * Muestra la posición, imagen, nombre y promedio de estrellas.
   */
  const renderCardRanking = (item, index) => (
    <div key={index} className="col-md-4 col-lg-3">
      <div className="card bg-black border-warning shadow-lg h-100 position-relative overflow-hidden"
           style={{ border: '2px solid' }}>
        {/* Etiqueta de posición en la esquina superior izquierda */}
        <div className="position-absolute top-0 start-0 bg-warning text-dark px-3 py-1 fw-bold shadow"
             style={{ zIndex: 10, borderRadius: '0 0 10px 0' }}>
          RANK #{index + 1}
        </div>
        {/* Imagen de portada con ligero aumento de contraste */}
        <img
          src={item.imagen_url || 'https://via.placeholder.com/300x220?text=Sin+imagen'}
          className="card-img-top"
          style={{ height: '220px', objectFit: 'cover', filter: 'contrast(1.1)' }}
          alt={item.nombre || 'Top'}
        />
        <div className="card-body p-3 text-center bg-dark">
          <h5 className="text-white fw-bold mb-2 truncate text-uppercase small">{item.nombre}</h5>
          <div className="d-flex justify-content-center align-items-center gap-2">
            {/* Promedio de estrellas con 1 decimal */}
            <span className="text-warning fs-5">
              <i className="bi bi-star-fill"></i> {parseFloat(item.promedio).toFixed(1)}
            </span>
            <span className="badge bg-danger rounded-pill px-3" style={{ fontSize: '0.7rem' }}>
              {item.tipo === 'hero' ? 'HÉROE' : 'CÓMIC'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="hall-of-fame-container container">
      {/* Banner de héroes: solo en la ruta /personajes */}
      {pathname === '/personajes' && topHeroes.length > 0 && (
        <>
          <h2 className="stark-title-glow display-3"><i className="bi bi-trophy-fill me-3"></i>Hall of Fame</h2>
          <p className="omega-subtitle"><span>— TOP AGENTES OMEGA —</span></p>
          <div className="row justify-content-center g-4">
            {topHeroes.map((hero, index) => renderCardRanking(hero, index))}
          </div>
        </>
      )}
      {/* Banner de cómics: solo en la ruta raíz / */}
      {pathname === '/' && topComics.length > 0 && (
        <>
          <h2 className="stark-title-glow display-3"><i className="bi bi-trophy-fill me-3"></i>Hall of Fame</h2>
          <p className="omega-subtitle"><span>— EXPEDIENTES TOP —</span></p>
          <div className="row justify-content-center g-4">
            {topComics.map((comic, index) => renderCardRanking(comic, index))}
          </div>
        </>
      )}
    </div>
  );
};

export default HallOfFameBanner;
