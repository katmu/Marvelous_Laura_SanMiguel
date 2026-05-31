import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Cards.css';

/**
 * Componente ComicList
 * Muestra la galería principal de cómics obtenidos de Comic Vine a través
 * del proxy del servidor Express. Cada tarjeta permite marcar/desmarcar
 * el cómic como favorito y abrir su ficha detallada en un modal.
 *
 * Props:
 *   onOpenModal — abre el modal de detalles con los datos del cómic
 *   onToggleFav — añade o elimina el cómic de los favoritos
 *   favoritos   — lista de favoritos actuales para saber cuáles están activos
 */
const ComicList = ({ onOpenModal, onToggleFav, favoritos }) => {
  const [comics, setComics] = useState([]);
  // Indicador de carga mientras llega la respuesta del servidor
  const [loading, setLoading] = useState(true);
  // Indicador de error si el servidor no responde
  const [error, setError] = useState(false);

  // Cargamos los cómics al montar el componente (una sola vez)
  useEffect(() => {
    const fetchComics = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_SERVER_URL}/api/comicvine/comics`);
        if (response.data && response.data.results) {
          setComics(response.data.results);
        }
      } catch (err) {
        console.error("Error al obtener datos de Comic Vine:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchComics();
  }, []);

  // Renderizado condicional: cargando / error / galería
  if (loading) return <div className="text-center text-white mt-5">Cargando catálogo de cómics...</div>;
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
          {comics.map((comic) => {
            // Comprobamos si este cómic ya está en la lista de favoritos del usuario
            const esFavorito = (favoritos || []).some(f => f.id === comic.id);

            return (
              <div key={comic.id} className="col-xl-3 col-lg-4 col-md-6">
                <div className="gallery-item h-100">

                  {/* Botón de corazón: rojo si es favorito, blanco si no lo es */}
                  <button
                    className={`btn-fav ${esFavorito ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      // Pasamos resource_type 'issue' para que handleToggleFav lo clasifique correctamente
                      onToggleFav({ ...comic, resource_type: 'issue' }, e);
                    }}
                  >
                    <i className="bi bi-heart-fill"></i>
                  </button>

                  {/* Portada del cómic con objectPosition 'top' para evitar cortes en la cabeza */}
                  <img
                    src={comic.image?.small_url || 'https://via.placeholder.com/300x350?text=Sin+imagen'}
                    className="img-fluid"
                    alt={comic.name}
                    style={{ height: '350px', width: '100%', objectFit: 'cover', objectPosition: 'top' }}
                  />

                  {/* Capa de información visible al hacer hover */}
                  <div className="gallery-links d-flex align-items-center justify-content-center">
                    <div className="line-clamp module" style={{ padding: '20px' }}>
                      <p className="text-white">
                        <strong>{comic.name || `${comic.volume?.name} #${comic.issue_number}`}</strong>
                      </p>
                      <p className="text-white" style={{ fontSize: '0.8rem' }}>
                        {comic.deck || 'Sin descripción disponible'}
                      </p>
                      {/* Botón que abre el modal con la ficha completa del cómic */}
                      <button
                        className="btn-visit"
                        onClick={() => onOpenModal({
                          title: `${comic.volume?.name} #${comic.issue_number}`,
                          thumbnail: comic.image?.medium_url || comic.image?.small_url,
                          deck: comic.deck,
                          description: comic.description || comic.deck || "Sin detalles adicionales.",
                          store_date: comic.store_date || "No disponible",
                          cover_date: comic.cover_date || "No disponible",
                          issue: comic.issue_number,
                          volume: comic.volume?.name
                        })}
                      >
                        Más info
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

export default ComicList;
