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

function cargarPersonajes(id_usuario) {
    var node = document.getElementById("listado");
    // Llamada a tu functions.php para traer los IDs favoritos de la DB
    $.ajax({
        url: 'functions.php',
        type: 'POST', 
        data: { 
            action: 'getFavoritos', 
            id_usuario: id_usuario,
            tipo: 'hero'
        },
        success: function(response) {
            var favoritos = JSON.parse(response);
            node.innerHTML = ""; // Limpiar antes de cargar

            favoritos.forEach(function(favorito) {
                // Petición a Comic Vine usando el ID de la base de datos
                $.ajax({
                    url: `${proxyUrl}${baseUrl}/character/4005-${favorito.id_favorito}/?api_key=${apiKey}&format=json&field_list=id,name,image,deck`,
                    type: 'GET',
                    success: function (res) {
                        let hero = res.results;
                        if(hero) {
                            var divCol = document.createElement("div");
                            divCol.classList.add("col-xl-3", "col-lg-4", "col-md-6");
                            divCol.innerHTML = `
                                <div class="gallery-item h-100">
                                    <img src="${hero.image.small_url}" class="img-fluid" style="height:350px; width:100%; object-fit:cover;">
                                    <div class="gallery-links d-flex align-items-center justify-content-center">
                                        <div class="line-clamp module" style="padding:20px;">
                                            <p><strong>${hero.name}</strong></p>
                                            <button class="btn btn-danger" onclick="location.replace('about.html?id=${hero.id}&type=hero')">
                                                Mas info sobre ${hero.id}
                                            </button>
                                        </div>
                                    </div>
                                </div>`;
                            node.appendChild(divCol);
                        }
                    }
                });
            });
        }
    });
}

function cargarComics(id_usuario) {
    var node = document.getElementById("listado");
    $.ajax({
        url: 'functions.php',
        type: 'POST', 
        data: { 
            action: 'getFavoritos', 
            id_usuario: id_usuario,
            tipo: 'comic'
        },
        success: function(response) {
            var favoritos = JSON.parse(response);
            node.innerHTML = "";

            favoritos.forEach(function(favorito) {
                $.ajax({
                    url: `${proxyUrl}${baseUrl}/issue/4000-${favorito.id_favorito}/?api_key=${apiKey}&format=json&field_list=id,name,image,issue_number,volume`,
                    type: 'GET',
                    success: function (res) {
                        let comic = res.results;
                        if(comic) {
                            let titulo = comic.name || (comic.volume.name + " #" + comic.issue_number);
                            var divCol = document.createElement("div");
                            divCol.classList.add("col-xl-3", "col-lg-4", "col-md-6");
                            divCol.innerHTML = `
                                <div class="gallery-item h-100">
                                    <img src="${comic.image.small_url}" class="img-fluid" style="height:350px; width:100%; object-fit:cover;">
                                    <div class="gallery-links d-flex align-items-center justify-content-center">
                                        <div class="line-clamp module" style="padding:20px;">
                                            <p><strong>${titulo}</strong></p>
                                            <button class="btn btn-danger" onclick="location.replace('about.html?id=${comic.id}&type=comic')">
                                                Mas info sobre ${comic.id}
                                            </button>
                                        </div>
                                    </div>
                                </div>`;
                            node.appendChild(divCol);
                        }
                    }
                });
            });
        }
    });
}

// MAIN -----------------------------------------------------------

if (window.location.href.includes("usuario.php")) {
    var urlParams = new URLSearchParams(window.location.search);
    var userId = urlParams.get("usuario");

    if (urlParams.get("filtro") === "personajes") {
        cargarPersonajes(userId);
    } else if (urlParams.get("filtro") === "comics") {
        cargarComics(userId);
    }

    // Modal de error
    if (urlParams.get("error") === "nofiltro") {
        document.getElementById('errorMsg').innerText = "Por favor, marca \"comics\" o \"personajes\" para poder realizar la búsqueda";
        document.getElementById('errorModal').style.display = 'block';
        document.getElementById('closeButton').onclick = () => {
            document.getElementById('errorModal').style.display = 'none';
        }
    }

    // Botón de búsqueda de favoritos
    var divBuscar = document.getElementById("buscar");
    if(divBuscar) {
        var btnBuscar = document.createElement("button");
        btnBuscar.className = "btn btn-danger";
        btnBuscar.textContent = "Buscar favoritos";
        btnBuscar.onclick = function() {
            if (document.getElementById('comics').checked) {
                location.replace("usuario.php?usuario=" + userId + "&filtro=comics");
            } else if (document.getElementById('personaje').checked) {
                location.replace("usuario.php?usuario=" + userId + "&filtro=personajes");
            } else {
                location.replace("usuario.php?usuario=" + userId + "&error=nofiltro");
            }
        }
        divBuscar.appendChild(btnBuscar);
    }
}