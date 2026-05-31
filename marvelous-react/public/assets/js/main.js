
document.addEventListener('DOMContentLoaded', () => {
    "use strict";

    /**
     * Preloader
     */
    const preloader = document.querySelector('#preloader');
    if (preloader) {
        window.addEventListener('load', () => {
            setTimeout(() => { preloader.classList.add('loaded'); }, 1000);
            setTimeout(() => { preloader.remove(); }, 2000);
        });
    }

    /**
     * Scroll top button
     */
    const scrollTop = document.querySelector('.scroll-top');
    if (scrollTop) {
        const togglescrollTop = function () {
            window.scrollY > 100 ? scrollTop.classList.add('active') : scrollTop.classList.remove('active');
        }
        window.addEventListener('load', togglescrollTop);
        document.addEventListener('scroll', togglescrollTop);
        scrollTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    function aos_init() {
        AOS.init({ duration: 1000, easing: 'ease-in-out', once: true, mirror: false });
    }
    window.addEventListener('load', () => { aos_init(); });
});

// --- CONFIGURACIÓN DE LA API COMIC VINE ---
const apiKey = '9a4e6ece617979a4845af21c256266b9a80c578b';
const baseUrl = 'https://comicvine.gamespot.com/api';
const proxyUrl = 'https://cors-anywhere.herokuapp.com/'; 

/**
 * INDEX: Carga lista de Personajes
 */
function cargarPersonajes() {
    var node = document.getElementById("listado");
    $.ajax({
        url: `${proxyUrl}${baseUrl}/characters/?api_key=${apiKey}&format=json&limit=20&field_list=id,name,image,deck`,
        type: 'GET',
        dataType: 'json',
        success: function (res) {
            res.results.forEach(hero => {
                let divCol = document.createElement("div");
                divCol.classList.add("col-xl-3", "col-lg-4", "col-md-6");
                divCol.innerHTML = `
                    <div class="gallery-item h-100">
                        <img src="${hero.image.small_url}" class="img-fluid" style="height:350px; width:100%; object-fit:cover;">
                        <div class="gallery-links d-flex align-items-center justify-content-center">
                            <div class="line-clamp module" style="padding:20px;">
                                <p><strong>${hero.name}</strong></p>
                                <p style="font-size: 0.8em; text-align: justify;">${hero.deck || 'Sin descripción'}</p>
                                <button class="btn btn-danger" onclick="location.replace('about.html?id=${hero.id}&type=hero')">
                                    Mas info
                                </button>
                            </div>
                        </div>
                    </div>`;
                node.appendChild(divCol);
            });
        }
    });
}

/**
 * INDEX: Carga lista de Cómics (Issues)
 */
function cargarComics() {
    var node = document.getElementById("listado");
    $.ajax({
        url: `${proxyUrl}${baseUrl}/issues/?api_key=${apiKey}&format=json&limit=20&field_list=id,name,image,deck,issue_number,volume`,
        type: 'GET',
        dataType: 'json',
        success: function (res) {
            res.results.forEach(comic => {
                let titulo = comic.name || (comic.volume.name + " #" + comic.issue_number);
                let divCol = document.createElement("div");
                divCol.classList.add("col-xl-3", "col-lg-4", "col-md-6");
                divCol.innerHTML = `
                    <div class="gallery-item h-100">
                        <img src="${comic.image.small_url}" class="img-fluid" style="height:350px; width:100%; object-fit:cover;">
                        <div class="gallery-links d-flex align-items-center justify-content-center">
                            <div class="line-clamp module" style="padding:20px;">
                                <p><strong>${titulo}</strong></p>
                                <p style="font-size: 0.8em; text-align: justify;">${comic.deck || 'Sin descripción'}</p>
                                <button class="btn btn-danger" onclick="location.replace('about.html?id=${comic.id}&type=comic')">
                                    Mas info
                                </button>
                            </div>
                        </div>
                    </div>`;
                node.appendChild(divCol);
            });
        }
    });
}

/**
 * ABOUT: Detalle de Personaje + Sus Cómics (Sustituye a cargarPersonajesAbout)
 */
function aboutHero(id) {
    $.ajax({
        url: `${proxyUrl}${baseUrl}/character/4005-${id}/?api_key=${apiKey}&format=json&field_list=name,image,description,real_name,comic_credits`,
        type: 'GET',
        success: function (res) {
            let hero = res.results;
            document.getElementById("nombre").innerText = hero.name;
            document.getElementById("imagen").src = hero.image.screen_large_url;
            document.getElementById("divInfo").innerHTML = `
                <p><strong>Nombre Real:</strong> ${hero.real_name || "N/A"}</p>
                <div style="text-align:justify">${hero.description || "Sin biografía disponible."}</div>
            `;

            // Carga la lista de cómics relacionados en el contenedor de abajo
            var listadoNode = document.getElementById("listado");
            if (hero.comic_credits && listadoNode) {
                hero.comic_credits.slice(0, 12).forEach(comic => { // Limitamos a 12 para no saturar
                    let divCol = document.createElement("div");
                    divCol.classList.add("col-xl-3", "col-lg-4", "col-md-6");
                    divCol.innerHTML = `
                        <div class="gallery-item h-100" style="background:#222; padding:15px; border-radius:10px; margin-bottom:10px;">
                            <p style="color:white; font-size:0.9em;">${comic.name}</p>
                            <button class="btn btn-sm btn-danger" onclick="location.replace('about.html?id=${comic.id}&type=comic')">Ver Cómic</button>
                        </div>`;
                    listadoNode.appendChild(divCol);
                });
            }
        }
    });
}

/**
 * ABOUT: Detalle de Cómic + Sus Personajes (Sustituye a cargarComicsAbout)
 */
function aboutComic(id) {
    $.ajax({
        url: `${proxyUrl}${baseUrl}/issue/4000-${id}/?api_key=${apiKey}&format=json&field_list=name,image,description,issue_number,volume,character_credits`,
        type: 'GET',
        success: function (res) {
            let comic = res.results;
            document.getElementById("nombre").innerText = comic.name || (comic.volume.name + " #" + comic.issue_number);
            document.getElementById("imagen").src = comic.image.screen_large_url;
            document.getElementById("divInfo").innerHTML = `
                <p><strong>Número:</strong> #${comic.issue_number}</p>
                <div style="text-align:justify">${comic.description || "Sin descripción disponible."}</div>
            `;

            var listadoNode = document.getElementById("listado");
            if (comic.character_credits && listadoNode) {
                comic.character_credits.forEach(char => {
                    let divCol = document.createElement("div");
                    divCol.classList.add("col-xl-3", "col-lg-4", "col-md-6");
                    divCol.innerHTML = `
                        <div class="gallery-item h-100" style="background:#222; padding:15px; border-radius:10px; margin-bottom:10px;">
                            <p style="color:white; font-size:0.9em;">${char.name}</p>
                            <button class="btn btn-sm btn-danger" onclick="location.replace('about.html?id=${char.id}&type=hero')">Ver Personaje</button>
                        </div>`;
                    listadoNode.appendChild(divCol);
                });
            }
        }
    });
}

/**
 * LÓGICA DE CONTROL DE FLUJO
 */
if (window.location.href.includes("index.html") || window.location.pathname.endsWith("/")) {
    const urlParams = new URLSearchParams(window.location.search);
    const divResumen = document.getElementById("resumen");

    if (urlParams.get("catalogo") === "heros") {
        cargarPersonajes();
    } else {
        cargarComics();
    }

    // Estadísticas
    $.ajax({
        url: `${proxyUrl}${baseUrl}/characters/?api_key=${apiKey}&format=json&limit=1`,
        type: 'GET',
        success: function (res) {
            var btn = document.createElement("button");
            btn.className = "btn btn-danger btn-space";
            btn.textContent = "Héroes Vine: " + res.number_of_total_results;
            btn.onclick = () => location.replace("index.html?catalogo=heros");
            divResumen.appendChild(btn);
        }
    });
} else if (window.location.href.includes("about.html")) {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get("id");
    const type = urlParams.get("type");
    if (type === "hero") aboutHero(id);
    else aboutComic(id);
}