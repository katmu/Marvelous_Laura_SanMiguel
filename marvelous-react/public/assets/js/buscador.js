document.addEventListener('DOMContentLoaded', () => {
    "use strict";

    const preloader = document.querySelector('#preloader');
    if (preloader) {
        window.addEventListener('load', () => {
            setTimeout(() => { preloader.classList.add('loaded'); }, 1000);
            setTimeout(() => { preloader.remove(); }, 2000);
        });
    }

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

// CONFIGURACIÓN API COMIC VINE
const apiKey = '9a4e6ece617979a4845af21c256266b9a80c578b';
const baseUrl = 'https://comicvine.gamespot.com/api';
const proxyUrl = 'https://cors-anywhere.herokuapp.com/';

function cargarPersonajesNombre(nombre) {
    var node = document.getElementById("listado");
    // Comic Vine utiliza filter=name:NOMBRE
    $.ajax({
        url: `${proxyUrl}${baseUrl}/characters/?api_key=${apiKey}&format=json&filter=name:${nombre}&limit=20`,
        type: 'GET',
        dataType: 'json',
        success: function (res) {
            node.innerHTML = ""; // Limpiar resultados anteriores
            res.results.forEach(hero => {
                var divCol = document.createElement("div");
                divCol.classList.add("col-xl-3", "col-lg-4", "col-md-6");
                divCol.innerHTML = `
                    <div class="gallery-item h-100">
                        <img src="${hero.image.small_url}" class="img-fluid" style="height:350px; width:100%; object-fit:cover;">
                        <div class="gallery-links d-flex align-items-center justify-content-center">
                            <div class="line-clamp module" style="padding:20px;">
                                <p><strong>Nombre</strong>: ${hero.name}</p>
                                <p style="font-size:0.8em; text-align:justify;">${hero.deck || 'Sin descripción'}</p>
                                <button class="btn btn-danger" onclick="location.replace('about.html?id=${hero.id}&type=hero')">
                                    Mas info sobre ${hero.id}
                                </button>
                            </div>
                        </div>
                    </div>`;
                node.appendChild(divCol);
            });
        }
    });
}

function cargarComicsTitulo(titulo) {
    var node = document.getElementById("listado");
    // En Comic Vine buscamos en "issues" filtrando por nombre del volumen
    $.ajax({
        url: `${proxyUrl}${baseUrl}/issues/?api_key=${apiKey}&format=json&filter=name:${titulo}&limit=20`,
        type: 'GET',
        dataType: 'json',
        success: function (res) {
            node.innerHTML = "";
            res.results.forEach(comic => {
                let displayTitle = comic.name || (comic.volume.name + " #" + comic.issue_number);
                var divCol = document.createElement("div");
                divCol.classList.add("col-xl-3", "col-lg-4", "col-md-6");
                divCol.innerHTML = `
                    <div class="gallery-item h-100">
                        <img src="${comic.image.small_url}" class="img-fluid" style="height:350px; width:100%; object-fit:cover;">
                        <div class="gallery-links d-flex align-items-center justify-content-center">
                            <div class="line-clamp module" style="padding:20px;">
                                <p><strong>Título</strong>: ${displayTitle}</p>
                                <p style="font-size:0.8em; text-align:justify;">${comic.deck || 'Sin descripción'}</p>
                                <button class="btn btn-danger" onclick="location.replace('about.html?id=${comic.id}&type=comic')">
                                    Mas info sobre ${comic.id}
                                </button>
                            </div>
                        </div>
                    </div>`;
                node.appendChild(divCol);
            });
        }
    });
}


// --- LÓGICA DEL BUSCADOR ---

if (window.location.href.includes("buscador.php")) {
    var urlParams = new URLSearchParams(window.location.search);
    
    // Ejecutar búsqueda si hay parámetros
    if (urlParams.get("filtro") === "personajes") {
        cargarPersonajesNombre(urlParams.get("buscar"));
    } else if (urlParams.get("filtro") === "comics") {
        cargarComicsTitulo(urlParams.get("buscar"));
    }

    // Manejo de errores (Modales)
    if (urlParams.get("error") === "nofiltro") {
        document.getElementById('errorMsg').innerText = "Por favor, marca \"comics\" o \"personajes\" para poder realizar la búsqueda";
        document.getElementById('errorModal').style.display = 'block';
    } else if (urlParams.get("error") === "notexto") {
        document.getElementById('errorMsg').innerText = "No hay texto para buscar. Por favor introduce un texto";
        document.getElementById('errorModal').style.display = 'block';
    }

    if(document.getElementById('closeButton')){
        document.getElementById('closeButton').onclick = function() {
            document.getElementById('errorModal').style.display = 'none';
        }
    }

    // Botón Buscar dinámico
    var divBuscar = document.getElementById("buscar");
    if(divBuscar) {
        var btnBuscar = document.createElement("button");
        btnBuscar.classList.add("btn", "btn-danger");
        btnBuscar.type = "button";
        btnBuscar.textContent = "Buscar";
        btnBuscar.onclick = function() {
            var texto = document.getElementById("search_text").value;
            if (texto != "") {
                if (document.getElementById('comics').checked) {
                    location.replace("buscador.php?filtro=comics&buscar=" + texto);
                } else if (document.getElementById('personaje').checked) {
                    location.replace("buscador.php?filtro=personajes&buscar=" + texto);
                } else {
                    location.replace("buscador.php?error=nofiltro");
                }
            } else {
                location.replace("buscador.php?error=notexto");
            }
        }
        divBuscar.appendChild(btnBuscar);
    }
}