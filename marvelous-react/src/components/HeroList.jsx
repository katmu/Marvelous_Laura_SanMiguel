import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Cards.css';

/**
 * Componente HeroList
 * Muestra la galería de personajes (héroes y villanos) obtenidos de Comic Vine
 * a través del proxy del servidor Express. Cada tarjeta permite marcar/desmarcar
 * el personaje como favorito y abrir su biografía en un modal.
 *
 * Props:
 *   onOpenModal — abre el modal de detalles con los datos del personaje
 *   onToggleFav — añade o elimina el personaje de los favoritos
 *   favoritos   — lista de favoritos actuales para saber cuáles están activos
 */
const HeroList = ({ onOpenModal, onToggleFav, favoritos }) => {
  const [heroes, setHeroes] = useState([]);
  // Indicador de carga mientras llega la respuesta del servidor
  const [loading, setLoading] = useState(true);
  // Indicador de error si el servidor no responde
  const [error, setError] = useState(false);

  // Cargamos los personajes al montar el componente (una sola vez)
  useEffect(() => {
    const fetchHeroes = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_SERVER_URL}/api/comicvine/personajes`);
        if (response.data && response.data.results) {
          setHeroes(response.data.results);
        }
      } catch (err) {
        console.error("Error al obtener personajes:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchHeroes();
  }, []);

  // Renderizado condicional: cargando / error / galería
  if (loading) return <div className="text-center text-white mt-5">Invocando héroes al multiverso...</div>;
  if (error) return (
    <div className="text-center text-danger mt-5">
      <i className="bi bi-exclamation-triangle me-2"></i>
      No se pudo conectar con el servidor. Verifica que Express esté corriendo.
    </div>
  );

  return (
    <section id="gallery" className="gallery">
      <div className="container-fluid">
        <div className="row gy-4 justify-content-center">
          {heroes.map((hero) => {
            // Comprobamos si este personaje ya está en la lista de favoritos
            const esFavorito = favoritos.some(f => f.id === hero.id);
            return (
              <div key={hero.id} className="col-xl-3 col-lg-4 col-md-6">
                <div className="gallery-item h-100">

                  {/* Botón de corazón: rojo si es favorito, blanco si no lo es */}
                  <button
                    className={`btn-fav ${esFavorito ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      // Pasamos resource_type 'character' para clasificarlo correctamente en App.js
                      onToggleFav({ ...hero, resource_type: 'character' }, e);
                    }}
                    style={{
                      color: esFavorito ? '#ff4d4d' : 'white',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <i className="bi bi-heart-fill"></i>
                  </button>

                  {/* Foto del personaje */}
                  <img
                    src={hero.image?.small_url || 'https://via.placeholder.com/300x350?text=Sin+imagen'}
                    className="img-fluid"
                    alt={hero.name}
                    style={{ height: '350px', width: '100%', objectFit: 'cover', objectPosition: 'top' }}
                  />

                  {/* Capa de información visible al hacer hover */}
                  <div className="gallery-links d-flex align-items-center justify-content-center">
                    <div className="line-clamp module" style={{ padding: '20px' }}>
                      <p className="text-white">
                        <strong>{hero.name}</strong>
                      </p>
                      {/* Nombre real solo si está disponible en la API */}
                      {hero.real_name && (
                        <p className="text-white-50" style={{ fontSize: '0.8rem' }}>
                          Nombre real: {hero.real_name}
                        </p>
                      )}
                      <p className="text-white" style={{ fontSize: '0.8rem' }}>
                        {hero.deck || 'Ficha de personaje disponible.'}
                      </p>
                      {/* Botón que abre el modal con la biografía completa */}
                      <button
                        className="btn-visit"
                        onClick={() => onOpenModal({
                          name: hero.name,
                          thumbnail: hero.image?.medium_url || hero.image?.small_url,
                          description: hero.deck || hero.description || "Sin descripción disponible.",
                          real_name: hero.real_name,
                          // Convertimos el código numérico de género a texto legible
                          gender: hero.gender === 2 ? "Femenino" : hero.gender === 1 ? "Masculino" : "Otro",
                          origin: hero.origin?.name
                        })}
                      >
                        Ver biografía
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HeroList;
