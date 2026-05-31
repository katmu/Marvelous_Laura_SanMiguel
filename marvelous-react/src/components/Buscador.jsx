import React, { useState } from 'react';
import axios from 'axios';

/**
 * Componente Buscador
 * Permite buscar cualquier elemento del multiverso Marvel/DC (personajes, cómics,
 * películas, series y volúmenes) a través de Comic Vine. Incluye filtros rápidos
 * por categoría y muestra los resultados en tarjetas con su tipo identificado.
 *
 * Props:
 *   onOpenModal — abre el modal de detalles con los datos del item
 *   onToggleFav — añade o elimina el item de los favoritos
 *   favoritos   — lista de favoritos actuales para marcar los activos
 */
const Buscador = ({ onOpenModal, onToggleFav, favoritos }) => {
  // Texto introducido en la barra de búsqueda
  const [query, setQuery] = useState('');
  // Resultados devueltos por la API
  const [results, setResults] = useState([]);
  // Indicador de carga durante la búsqueda
  const [loading, setLoading] = useState(false);
  // true solo tras la primera búsqueda, para mostrar el mensaje "sin resultados"
  const [hasBuscado, setHasBuscado] = useState(false);

  /**
   * Función central de búsqueda.
   * Normaliza los nombres de categoría (la API acepta formas en singular)
   * y llama al proxy del servidor en lugar de a Comic Vine directamente.
   *
   * @param {string} textoInput   — texto de búsqueda (sobreescribe el estado query)
   * @param {string} recursoInput — categorías a buscar separadas por comas
   */
  const ejecutarBusqueda = async (textoInput, recursoInput) => {
    const busqueda = textoInput || query || "Avengers";

    // Normalizamos los nombres de categoría eliminando la "s" final que usa la UI
    const categorias = (recursoInput || "movie,issue,character,series,volume")
      .toString()
      .toLowerCase()
      .replace("movies", "movie")
      .replace("volumes", "volume")
      .replace("issues", "issue")
      .replace("characters", "character");

    setLoading(true);

    try {
      const response = await axios.get(`${process.env.REACT_APP_SERVER_URL}/api/comicvine/buscar`, {
        params: { query: busqueda, categorias }
      });
      const datos = response.data.results || [];
      setResults(datos);
      setHasBuscado(true);
      console.log(`✅ ¡Éxito! Encontrados ${datos.length} resultados en [${categorias}]`);
    } catch (error) {
      console.error("❌ Error de comunicación con el Helitransporte:", error);
      setResults([]);
      setHasBuscado(true);
    } finally {
      setLoading(false);
    }
  };

  // Manejador del formulario de búsqueda por texto
  const handleSearchForm = (e) => {
    e.preventDefault();
    ejecutarBusqueda(query);
  };

  // Manejador de los botones de filtro rápido por categoría
  const handleQuickSearch = (tipo) => {
    const busquedaActual = query || "Marvel";
    ejecutarBusqueda(busquedaActual, tipo);
  };

  return (
    <div className="container mt-5">

      {/* ======= BARRA DE BÚSQUEDA ======= */}
      <div className="search-box text-center mb-5">
        <h2 className="text-white mb-4 animate__animated animate__pulse">Explora el Multiverso</h2>
        <form onSubmit={handleSearchForm} className="d-flex justify-content-center">
          <input
            type="text"
            className="form-control w-50"
            placeholder="Escribe un héroe o un cómic..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ borderRadius: '20px 0 0 20px', border: 'none' }}
          />
          <button
            type="submit"
            className="btn btn-danger"
            style={{ borderRadius: '0 20px 20px 0', padding: '0 30px' }}
          >
            <i className="bi bi-search"></i> Buscar
          </button>
        </form>
      </div>

      {/* ======= FILTROS RÁPIDOS POR CATEGORÍA ======= */}
      <div className="container mb-5">
        <div className="row g-3 justify-content-center text-center">
          <p className="text-white-50 small mb-2">BUSCAR CATEGORÍA ESPECÍFICA:</p>

          {/* Todo: busca en todas las categorías a la vez */}
          <div className="col-6 col-md-2">
            <div className="card bg-dark border-secondary h-100 p-2 btn-category shadow-sm"
                 onClick={() => ejecutarBusqueda(query, 'character,issue,movie,series,volume')}>
              <i className="bi bi-grid-fill text-secondary mb-1"></i>
              <span className="text-white d-block small">Todo</span>
            </div>
          </div>

          {/* Series de TV */}
          <div className="col-6 col-md-2">
            <div className="card bg-dark border-danger h-100 p-2 btn-category shadow-sm"
                 onClick={() => handleQuickSearch('series')}>
              <i className="bi bi-tv text-danger mb-1"></i>
              <span className="text-white d-block small">Series</span>
            </div>
          </div>

          {/* Películas */}
          <div className="col-6 col-md-2">
            <div className="card bg-dark border-primary h-100 p-2 btn-category shadow-sm"
                 onClick={() => handleQuickSearch('movies')}>
              <i className="bi bi-film text-primary mb-1"></i>
              <span className="text-white d-block small">Películas</span>
            </div>
          </div>

          {/* Volúmenes de cómics */}
          <div className="col-6 col-md-2">
            <div className="card bg-dark border-warning h-100 p-2 btn-category shadow-sm"
                 onClick={() => handleQuickSearch('volumes')}>
              <i className="bi bi-book text-warning mb-1"></i>
              <span className="text-white d-block small">Volúmenes</span>
            </div>
          </div>
        </div>
      </div>

      {/* ======= INDICADOR DE CARGA ======= */}
      {loading && (
        <div className="text-center text-white mt-5">
          <div className="spinner-border text-info" role="status"></div>
          <p className="mt-2 text-info fw-bold">Calculando coordenadas temporales...</p>
        </div>
      )}

      {/* ======= RESULTADOS ======= */}
      <div className="row gy-4 mt-2 pb-5">

        {/* Mensaje cuando la búsqueda no devuelve resultados */}
        {hasBuscado && results.length === 0 && !loading && (
          <div className="col-12 text-center text-muted py-5">
            <i className="bi bi-search" style={{ fontSize: '3rem' }}></i>
            <p className="mt-3">No se han encontrado activos en este periodo temporal.</p>
          </div>
        )}

        {results.map((item) => {
          const esFavorito = (favoritos || []).some(f => f.id === item.id);
          // Nombre visible: puede estar en distintos campos según el tipo de item
          const nombreVisual = item.name || (item.volume && item.volume.name) || "Elemento sin nombre";
          const imagenVisual = item.image?.small_url || 'https://via.placeholder.com/300x450?text=Marvel+Media';

          return (
            <div key={item.id} className="col-xl-3 col-lg-4 col-md-6">
              <div className="gallery-item h-100" style={{ position: 'relative', paddingBottom: '60px' }}>

                {/* Botón de favorito */}
                <button
                  className={`btn-fav ${esFavorito ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFav(item, e);
                  }}
                  style={{ color: esFavorito ? '#ff4d4d' : 'white' }}
                >
                  <i className="bi bi-heart-fill"></i>
                </button>

                <img
                  src={imagenVisual}
                  alt={nombreVisual}
                  className="img-fluid"
                  style={{ height: '300px', width: '100%', objectFit: 'cover' }}
                />

                <div className="p-3 text-white text-center">
                  <h6 className="text-truncate">{nombreVisual}</h6>

                  {/* Etiqueta de tipo con color e icono diferente para cada categoría */}
                  <p className="small text-muted text-uppercase fw-bold" style={{ letterSpacing: '1px' }}>
                    {item.resource_type === 'character' && <span className="text-info"><i className="bi bi-person"></i> Personaje</span>}
                    {item.resource_type === 'series'    && <span className="text-danger"><i className="bi bi-tv"></i> Serie</span>}
                    {item.resource_type === 'volume'    && <span className="text-warning"><i className="bi bi-book"></i> Volumen</span>}
                    {item.resource_type === 'issue'     && <span className="text-success"><i className="bi bi-journal-text"></i> Cómic</span>}
                    {/* Las películas pueden venir con resource_type 'movie' o sin tipo pero con campo runtime */}
                    {(item.resource_type === 'movie' || (!item.resource_type && (item.runtime || item.release_date))) && (
                      <span className="text-primary"><i className="bi bi-film"></i> Película</span>
                    )}
                  </p>

                  {/* Botón que abre el modal con la ficha del item */}
                  <button
                    className="btn-visit"
                    onClick={() => onOpenModal({
                      name: nombreVisual,
                      thumbnail: item.image?.medium_url || item.image?.small_url,
                      description: item.description || item.deck || "Archivo clasificado de S.H.I.E.L.D. (Sin descripción).",
                      resource_type: item.resource_type || (item.runtime ? 'movie' : 'unknown'),
                      release_date: item.release_date,
                      runtime: item.runtime ? `${item.runtime} min` : null
                    })}
                  >
                    Ver ficha
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Buscador;
