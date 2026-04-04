/* ================================================================
   JAVASCRIPT.JS — Black Diamond Gym · Boxing Center
   ================================================================
   Este archivo controla toda la interactividad del sitio web.
   Está dividido en módulos independientes, cada uno con su
   función específica. Los comentarios explican qué hace cada
   bloque de código y por qué existe.
================================================================ */


/* ================================================================
   1. ESPERAR A QUE EL DOM ESTÉ LISTO
   ================================================================
   'DOMContentLoaded' se dispara cuando el navegador terminó de
   leer y parsear el HTML completo (sin esperar imágenes ni CSS).
   Todo el código que manipula elementos HTML debe ir aquí dentro
   para garantizar que los elementos ya existen en la página.
================================================================ */

/* ── PANTALLA DE CARGA ── */
(function() {
    const loader = document.getElementById('pageLoader');
    if (!loader) return;
    window.addEventListener('load', function() {
        const msg = loader.querySelector('p:last-child');
        if (msg) msg.textContent = '✅ ¡Listo!';
        setTimeout(() => {
            loader.style.opacity = '0';
            setTimeout(() => loader.remove(), 500);
        }, 600);
    });
})();

document.addEventListener('DOMContentLoaded', function () {


    /* ============================================================
       2. SCROLL INDICATOR — Flecha animada en el hero
       ============================================================
       El indicador de scroll le dice al usuario que puede
       desplazarse hacia abajo. Al hacer clic, hace scroll suave
       hasta la siguiente sección (#nosotros). Además, se oculta
       automáticamente cuando el usuario ya empezó a scrollear,
       porque en ese punto ya no es necesario.
    ============================================================ */
    const scrollIndicator = document.getElementById('scrollIndicator');

    if (scrollIndicator) {

        // Cambiar texto SCROLL → TAP en dispositivos táctiles
        const scrollText = document.getElementById('scrollText');
        if (scrollText && ('ontouchstart' in window || navigator.maxTouchPoints > 0)) {
            scrollText.textContent = 'TAP';
        }

        // Al hacer clic en la flecha, desplazarse suavemente
        // hasta la sección "nosotros" que es la que sigue al hero
        scrollIndicator.addEventListener('click', function () {
            const target = document.getElementById('nosotros');
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });

        // Escuchar el scroll de la página para ocultar la flecha
        // cuando el usuario ya no la necesita (bajó más de 100px)
        window.addEventListener('scroll', function () {
            if (window.scrollY > 100) {
                // Añade la clase 'hidden' que aplica opacity:0 via CSS
                scrollIndicator.classList.add('hidden');
            } else {
                // Si vuelve al top, la flecha reaparece
                scrollIndicator.classList.remove('hidden');
            }
        });
    }


    /* ============================================================
       3. HEADER SCROLL — Efecto glow al bajar la página
       ============================================================
       El header es fijo (position: fixed) y siempre visible.
       Cuando el usuario hace scroll hacia abajo, añadimos la
       clase 'scrolled' que en CSS activa una sombra roja sutil
       para darle más presencia visual al header.
    ============================================================ */
    const header = document.querySelector('header');

    if (header) {
        window.addEventListener('scroll', function () {
            // classList.toggle(clase, condicion):
            // - Si condicion es true  → añade la clase
            // - Si condicion es false → la quita
            header.classList.toggle('scrolled', window.scrollY > 60);
        });
    }


    /* ============================================================
       4. HORARIO DE HOY — Muestra el horario del día actual
       ============================================================
       En la sección de contacto hay una tarjeta que muestra el
       horario de atención del día en curso. Esta función calcula
       qué día de la semana es hoy y muestra el horario correcto.
       Se actualiza automáticamente cada vez que se carga la página.
    ============================================================ */
    const horarioHoy = document.getElementById('horario-hoy');

    if (horarioHoy) {
        // ── Hora actual en Colombia (UTC-5, sin horario de verano) ──
        const ahora      = new Date();
        const hoy        = new Date(ahora.toLocaleString('en-US', { timeZone: 'America/Bogota' }));
        const anio       = hoy.getFullYear();
        const mes        = hoy.getMonth() + 1; // 1-12
        const dia        = hoy.getDate();
        const diaSemana  = hoy.getDay();       // 0=Dom … 6=Sáb

        // ── Calcular Semana Santa (Pascua) ──────────────────────
        // Algoritmo de Butcher para obtener el domingo de Pascua
        function pascua(y) {
            const a = y % 19, b = Math.floor(y / 100), c = y % 100;
            const d = Math.floor(b / 4), e = b % 4;
            const f = Math.floor((b + 8) / 25);
            const g = Math.floor((b - f + 1) / 3);
            const h = (19 * a + b - d - g + 15) % 30;
            const i = Math.floor(c / 4), k = c % 4;
            const l = (32 + 2 * e + 2 * i - h - k) % 7;
            const m = Math.floor((a + 11 * h + 22 * l) / 451);
            const mes = Math.floor((h + l - 7 * m + 114) / 31);
            const dia = ((h + l - 7 * m + 114) % 31) + 1;
            return new Date(y, mes - 1, dia);
        }

        function agregarDias(fecha, dias) {
            const d = new Date(fecha);
            d.setDate(d.getDate() + dias);
            return d;
        }

        const domPascua    = pascua(anio);
        const juevesSanto  = agregarDias(domPascua, -3);
        const viernesSanto = agregarDias(domPascua, -2);

        // ── Lista de festivos fijos colombianos ─────────────────
        // Formato: 'MM-DD'
        const festivosFijos = [
            '01-01', // Año Nuevo
            '05-01', // Día del Trabajo
            '07-04', // — (traslado Sagrado Corazón, variable pero approx)
            '07-20', // Independencia de Colombia
            '08-07', // Batalla de Boyacá
            '12-08', // Inmaculada Concepción
            '12-25', // Navidad
        ];

        // ── Festivos móviles que se trasladan al lunes ──────────
        // En Colombia varios festivos se mueven al lunes siguiente
        function proximoLunes(mes, dia) {
            const f = new Date(anio, mes - 1, dia);
            const dow = f.getDay();
            if (dow === 1) return f; // ya es lunes
            const diff = dow === 0 ? 1 : 8 - dow;
            return agregarDias(f, diff);
        }

        const festivosMoviles = [
            proximoLunes(1, 6),   // Reyes Magos
            proximoLunes(3, 19),  // San José
            agregarDias(domPascua, -3), // Jueves Santo
            agregarDias(domPascua, -2), // Viernes Santo
            agregarDias(domPascua, 43), // Ascensión (39+4 por traslado)
            agregarDias(domPascua, 64), // Corpus Christi
            agregarDias(domPascua, 71), // Sagrado Corazón
            proximoLunes(6, 29),  // San Pedro y San Pablo
            proximoLunes(8, 15),  // Asunción de la Virgen
            proximoLunes(10, 12), // Día de la Raza
            proximoLunes(11, 1),  // Todos los Santos
            proximoLunes(11, 11), // Independencia de Cartagena
        ];

        // ── Verificar si hoy es festivo ─────────────────────────
        function dosDigitos(n) { return String(n).padStart(2, '0'); }
        const claveHoy = dosDigitos(mes) + '-' + dosDigitos(dia);

        const esFestivoFijo = festivosFijos.includes(claveHoy);

        const esFestivoMovil = festivosMoviles.some(f => {
            const fm = new Date(f.toLocaleString('en-US', { timeZone: 'America/Bogota' }));
            return fm.getFullYear() === anio &&
                   (fm.getMonth() + 1) === mes &&
                   fm.getDate() === dia;
        });

        const esFestivo = esFestivoFijo || esFestivoMovil;

        // ── Horarios normales por día ───────────────────────────
        const horarios = {
            0: '8:00 a.m. – 1:00 p.m.',
            1: '6:00 a.m. – 10:00 p.m.',
            2: '6:00 a.m. – 10:00 p.m.',
            3: '6:00 a.m. – 10:00 p.m.',
            4: '6:00 a.m. – 10:00 p.m.',
            5: '6:00 a.m. – 10:00 p.m.',
            6: '8:00 a.m. – 5:00 p.m.'
        };

        const nombresDias = {
            0: 'Domingo', 1: 'Lunes', 2: 'Martes',
            3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado'
        };

        // ── Mostrar resultado ───────────────────────────────────
        if (esFestivo) {
            horarioHoy.innerHTML =
                '<strong>🎉 Día Festivo</strong><br>' +
                'Consulta nuestras redes sociales<br>o panel de noticias';
        } else {
            horarioHoy.innerHTML =
                '<strong>' + nombresDias[diaSemana] + ':</strong><br>' +
                horarios[diaSemana];
        }
    }


    /* ============================================================
       5. CONTADORES ANIMADOS — Números que cuentan al aparecer
       ============================================================
       Los elementos .stat-num tienen un atributo data-target con
       el número final (ej: data-target="15"). Esta función hace
       que el número cuente desde 0 hasta ese valor con una
       animación suave cuando el elemento entra en el viewport.
       Usa IntersectionObserver para detectar cuándo es visible.
    ============================================================ */

    // Función que anima un contador de 0 hasta su valor objetivo
    function animarContador(elemento) {
        const valorFinal = parseInt(elemento.dataset.target, 10);
        let valorActual  = 0;

        // Calcular el incremento para que dure ~25 pasos
        const incremento = Math.ceil(valorFinal / 25);

        // setInterval ejecuta la función cada 50ms (≈20fps)
        const temporizador = setInterval(function () {
            valorActual = Math.min(valorActual + incremento, valorFinal);
            elemento.textContent = valorActual;

            // Cuando llegamos al número final, detenemos el timer
            if (valorActual >= valorFinal) {
                clearInterval(temporizador);
            }
        }, 50);
    }


    /* ============================================================
       6. SCROLL REVEAL — Elementos que aparecen al hacer scroll
       ============================================================
       IntersectionObserver es una API del navegador que notifica
       cuando un elemento entra o sale del área visible (viewport).
       Lo usamos para aplicar animaciones de entrada a las secciones
       solo cuando el usuario llega a ellas, no todas a la vez.

       Funcionamiento:
       1. Todos los .sr-target empiezan con clase 'sr-hidden' (invisible)
       2. Cuando entran en el viewport, se les agrega 'sr-visible'
       3. El CSS transiciona de opacidad 0 → 1 y translateY(36px) → 0
       4. Dejamos de observar el elemento para no re-animar
    ============================================================ */
    const elementosReveal = document.querySelectorAll('.sr-target');

    // Marcamos todos como ocultos al inicio
    elementosReveal.forEach(function (el) {
        el.classList.add('sr-hidden');
    });

    // Creamos el observador con un umbral de 10% de visibilidad
    const observadorReveal = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (entrada) {
            if (!entrada.isIntersecting) return; // Si no es visible, ignorar

            // Leer el delay personalizado desde la variable CSS --delay
            // Esto permite escalonar la animación de elementos en fila
            const estilos = getComputedStyle(entrada.target);
            const delay   = parseFloat(estilos.getPropertyValue('--delay')) || 0;

            // Aplicar la animación con el delay correspondiente
            setTimeout(function () {
                entrada.target.classList.add('sr-visible');
            }, delay * 1000);

            // Activar contadores si el elemento contiene alguno
            entrada.target.querySelectorAll('.stat-num').forEach(animarContador);

            // Dejar de observar — el elemento ya se reveló
            observadorReveal.unobserve(entrada.target);
        });
    }, { threshold: 0.1 }); // 0.1 = 10% del elemento debe ser visible

    // Registrar cada elemento para ser observado
    elementosReveal.forEach(function (el) {
        observadorReveal.observe(el);
    });


    /* ============================================================
       7. CARRUSEL 3D — Planes y Precios
       ============================================================
       El carrusel posiciona las tarjetas de precios en un círculo
       imaginario en 3D usando CSS transforms (translateX, translateZ,
       rotateY). La tarjeta activa está al frente y las demás orbitan
       detrás con menor escala y opacidad, creando profundidad visual.

       Matemática del círculo 3D:
       - Dividimos 360° entre el número de tarjetas → ángulo por paso
       - Para cada tarjeta calculamos su ángulo relativo a la activa
       - Convertimos ese ángulo a coordenadas X y Z usando seno y coseno
       - A mayor distancia angular del frente → menor escala y opacidad
    ============================================================ */
    (function iniciarCarrusel3D() {

        const pista   = document.getElementById('carousel3d');
        const btnPrev = document.getElementById('prevPlan');
        const btnNext = document.getElementById('nextPlan');
        const nombre  = document.getElementById('planName');
        const puntos  = document.getElementById('dots3d');

        // Si no existe el carrusel en esta página, salir
        if (!pista) return;

        const tarjetas    = Array.from(pista.querySelectorAll('.price-card-3d'));
        const total       = tarjetas.length;
        const nombrePlanes = ['BOXEO MENSUAL', 'GYM MENSUAL', 'VALERA 15 DÍAS', 'PLAN DÍA'];
        let   actual      = 0;    // Índice de la tarjeta al frente
        let   animando    = false; // Bandera para evitar clics dobles
        const RADIO       = 560;  // Radio del círculo imaginario en píxeles

        /* -- Posicionar todas las tarjetas en el círculo 3D -- */
        function posicionar() {
            const paso = 360 / total; // Ángulo entre cada tarjeta

            tarjetas.forEach(function (tarjeta, i) {
                // Ángulo de esta tarjeta relativo a la que está al frente
                const angulo = (i - actual) * paso;
                const rad    = angulo * (Math.PI / 180); // Convertir a radianes

                // Posición X: seno del ángulo × radio
                // Posición Z: coseno del ángulo × radio (profundidad)
                const tx = Math.sin(rad) * RADIO;
                const tz = Math.cos(rad) * RADIO - RADIO;

                // Calcular qué tan lejos está del frente (0=frente, 1=fondo)
                const anguloAbs  = Math.abs(((angulo % 360) + 360) % 360);
                const anguloNorm = anguloAbs > 180 ? 360 - anguloAbs : anguloAbs;
                const t          = anguloNorm / 180; // Normalizado 0-1

                // Aplicar transform, opacidad y escala según la distancia
                tarjeta.style.transform = 'translateX(' + tx + 'px) translateZ(' + tz + 'px) rotateY(' + (-angulo) + 'deg)';
                tarjeta.style.opacity   = 1 - t * 0.7;   // 1 al frente, 0.3 atrás
                tarjeta.style.zIndex    = Math.round((1 - t) * 10);
                tarjeta.style.scale     = 1 - t * 0.42;  // 1 al frente, 0.58 atrás

                // Marcar visualmente cuál es la activa
                tarjeta.classList.toggle('is-active', i === actual);
            });

            // Actualizar el texto del indicador de plan
            if (nombre) nombre.textContent = nombrePlanes[actual];

            // Actualizar los puntos de navegación
            puntos.querySelectorAll('.dot-3d').forEach(function (punto, i) {
                punto.classList.toggle('active', i === actual);
            });
        }

        /* -- Ir a una tarjeta específica por índice -- */
        function irA(indice) {
            if (animando) return; // Ignorar si ya hay animación en curso
            animando = true;

            // Módulo circular: permite ir del último al primero y viceversa
            actual = ((indice % total) + total) % total;
            posicionar();

            // Desbloquear después de que termine la transición CSS (0.82s)
            setTimeout(function () { animando = false; }, 820);
        }

        /* -- Crear los puntos de navegación dinámicamente -- */
        for (let i = 0; i < total; i++) {
            const punto = document.createElement('button');
            punto.className = 'dot-3d' + (i === 0 ? ' active' : '');
            punto.setAttribute('aria-label', 'Ver plan ' + nombrePlanes[i]);

            // Cada punto lleva directamente a su tarjeta correspondiente
            punto.addEventListener('click', function () { irA(i); });
            puntos.appendChild(punto);
        }

        /* -- Botones de flecha izquierda/derecha -- */
        if (btnPrev) btnPrev.addEventListener('click', function () { irA(actual - 1); });
        if (btnNext) btnNext.addEventListener('click', function () { irA(actual + 1); });

        /* -- Soporte de swipe táctil para móviles -- */
        let touchInicioX = 0;

        pista.addEventListener('touchstart', function (e) {
            // Guardar la posición X donde empezó el toque
            touchInicioX = e.touches[0].clientX;
        });

        pista.addEventListener('touchend', function (e) {
            // Calcular la distancia horizontal del swipe
            const diferencia = touchInicioX - e.changedTouches[0].clientX;

            // Solo actuar si el swipe fue de más de 40px (evita clics accidentales)
            if (Math.abs(diferencia) > 40) {
                irA(actual + (diferencia > 0 ? 1 : -1));
                // diferencia > 0 = swipe hacia la izquierda = siguiente tarjeta
                // diferencia < 0 = swipe hacia la derecha  = tarjeta anterior
            }
        });

        /* -- Clic en tarjeta lateral para seleccionarla directamente -- */
        tarjetas.forEach(function (tarjeta, i) {
            tarjeta.addEventListener('click', function () {
                if (i !== actual) irA(i);
                // Solo actúa si se clickeó una tarjeta que NO es la activa
            });
        });

        /* -- Posicionar al cargar la página -- */
        posicionar();

    })(); // IIFE: se ejecuta inmediatamente y no contamina el scope global


    /* ============================================================
       8. FORMULARIO DE CONTACTO — Validación y feedback visual
       ============================================================
       Al enviar el formulario prevenimos el comportamiento por
       defecto del navegador (que recarga la página) y mostramos
       un mensaje de confirmación visual. Luego de 3 segundos
       el formulario se resetea a su estado original.
    ============================================================ */
    /* ============================================================
       9. HIGHLIGHT DE NAVEGACIÓN ACTIVA — Resaltar sección visible
       ============================================================
       A medida que el usuario hace scroll, detectamos qué sección
       del sitio es la más visible en pantalla y marcamos el link
       correspondiente en el menú como "activo". Esto da feedback
       visual de en qué parte de la página se encuentra el usuario.
    ============================================================ */
    const secciones   = document.querySelectorAll('main section[id]');
    const linksNavRaw = document.querySelectorAll('nav ul li a[href^="#"]');
    const linksNav    = Array.from(linksNavRaw);

    if (secciones.length && linksNav.length) {

        // Crear un observador que rastrea qué secciones son visibles
        const observadorNav = new IntersectionObserver(function (entradas) {
            entradas.forEach(function (entrada) {
                if (!entrada.isIntersecting) return;

                // Obtener el ID de la sección que entró en el viewport
                const idActivo = entrada.target.id;

                // Quitar la clase 'nav-active' de todos los links
                linksNav.forEach(function (link) {
                    link.classList.remove('nav-active');
                });

                // Añadir 'nav-active' solo al link que apunta a esta sección
                const linkActivo = linksNav.find(function (link) {
                    return link.getAttribute('href') === '#' + idActivo;
                });

                if (linkActivo) linkActivo.classList.add('nav-active');
            });

        }, {
            // rootMargin define un área virtual: detecta cuando la sección
            // ocupa el centro de la pantalla (entre -20% top y -70% bottom)
            rootMargin: '-20% 0px -70% 0px',
            threshold: 0
        });

        secciones.forEach(function (seccion) {
            observadorNav.observe(seccion);
        });
    }


    /* ============================================================
       10. PROGRESO DE LECTURA — Barra roja en la parte superior
       ============================================================
       Una barra delgada en la parte superior de la página que
       crece de izquierda a derecha según qué tanto ha scrolleado
       el usuario. Es un indicador visual de progreso en la página.
    ============================================================ */

    // Crear el elemento de la barra de progreso dinámicamente
    const barraProgreso = document.createElement('div');
    barraProgreso.id    = 'barra-progreso';

    // Estilos inline para que funcione sin necesitar CSS extra
    barraProgreso.style.cssText =
        'position:fixed;top:0;left:0;height:3px;width:0%;' +
        'background:linear-gradient(to right,#e31c25,#ff4d4d);' +
        'z-index:9999;transition:width .1s linear;pointer-events:none;';

    // Insertar la barra al inicio del <body>
    document.body.prepend(barraProgreso);

    // Actualizar el ancho de la barra en cada evento de scroll
    window.addEventListener('scroll', function () {
        // Altura total de la página menos la altura de la ventana
        const alturaScrollable = document.documentElement.scrollHeight
                               - document.documentElement.clientHeight;

        // Porcentaje scrolleado (0% arriba, 100% abajo)
        const porcentaje = (window.scrollY / alturaScrollable) * 100;

        barraProgreso.style.width = porcentaje + '%';
    });


    /* ============================================================
       11. LAZY LOADING DE IMÁGENES — Carga diferida
       ============================================================
       Las imágenes con clase 'lazy' no se cargan hasta que estén
       cerca del viewport. Esto acelera la carga inicial de la
       página porque solo descarga las imágenes que el usuario
       va a ver realmente.

       Funciona moviendo la URL de data-src a src cuando la imagen
       entra en el rango de visibilidad (con 200px de margen).
    ============================================================ */
    const imagenesLazy = document.querySelectorAll('img.lazy');

    if (imagenesLazy.length > 0) {

        const observadorLazy = new IntersectionObserver(function (entradas) {
            entradas.forEach(function (entrada) {
                if (!entrada.isIntersecting) return;

                const img = entrada.target;

                // Mover la URL real desde data-src al atributo src
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.classList.remove('lazy'); // Ya no necesita la clase
                }

                // Dejar de observar esta imagen
                observadorLazy.unobserve(img);
            });
        }, {
            rootMargin: '200px' // Empezar a cargar 200px antes de que sea visible
        });

        imagenesLazy.forEach(function (img) {
            observadorLazy.observe(img);
        });
    }
/* ── MENÚ MÓVIL — Hamburger ── */
const hamburger  = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
const mobileClose = document.getElementById('mobileClose');
const mobLinks   = document.querySelectorAll('.mob-link');

if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', function () {
        mobileMenu.classList.add('open');
        document.body.style.overflow = 'hidden';
    });
    mobileClose.addEventListener('click', function () {
        mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
    });
    mobLinks.forEach(function (link) {
        link.addEventListener('click', function () {
            mobileMenu.classList.remove('open');
            document.body.style.overflow = '';
        });
    });
}

}); // Fin del DOMContentLoaded


/* ================================================================
   12. ÚLTIMA NOTICIA DIARIA — consume la API backend (Node/Express)
   ================================================================
   Llama a GET /api/noticia para obtener la última noticia desde
   MySQL. Muestra la imagen si existe, adapta el layout y aplica
   una animación de entrada.

   URL de la API: ajusta API_BASE según tu entorno.
   · Desarrollo : http://localhost:3000
   · Producción : https://tu-dominio.com
================================================================ */

// ── Configuración ────────────────────────────────────────────
// API_BASE: usa la misma URL del servidor si no es localhost, si no apunta a :3000
const API_BASE = 'https://black-diamond-gym-5d2h.onrender.com';

// ── Función principal — se llama al cargar y al pulsar "Reintentar" ──
async function cargarNoticia() {
    const elLoading = document.getElementById('udLoading');
    const elCard    = document.getElementById('udCard');
    const elError   = document.getElementById('udError');
    const elFecha   = document.getElementById('udFecha');

    // Si la sección no existe en esta página, salir sin errores
    if (!elLoading) return;

    // Mostrar spinner, ocultar el resto
    elLoading.style.display = 'flex';
    elCard.style.display    = 'none';
    elError.style.display   = 'none';

    // Fecha de hoy en la barra superior
    if (elFecha) {
        const hoy = new Date();
        elFecha.textContent = hoy.toLocaleDateString('es-CO', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        });
    }

    try {
        // ── Llamada al endpoint ──────────────────────────────
        const res  = await fetch(`${API_BASE}/api/noticia`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        // ── Poblar el DOM con los datos recibidos ───────────
        document.getElementById('udTitulo').textContent = data.titulo  || 'Sin título';
        document.getElementById('udTexto').textContent  = data.contenido || '';

        // Autor / fecha de publicación
        const autor = document.getElementById('udAuthor');
        if (autor) {
            const pubDate = data.fecha_publicacion
                ? new Date(data.fecha_publicacion).toLocaleDateString('es-CO', { day:'numeric', month:'short', year:'numeric' })
                : '';
            autor.textContent = pubDate
                ? `Publicado el ${pubDate} · Black Diamond Gym`
                : 'Black Diamond Gym · Bosa, Bogotá';
        }

        // Imagen opcional
        const imgWrap = document.getElementById('udImgWrap');
        const img     = document.getElementById('udImg');
        if (data.imagen_url && imgWrap && img) {
            img.src              = data.imagen_url;
            img.alt              = data.titulo || 'Noticia del día';
            imgWrap.style.display = 'block';
            elCard.classList.add('has-image');   // activa layout de 2 columnas
        } else {
            imgWrap.style.display = 'none';
            elCard.classList.remove('has-image');
        }

        // ── Mostrar la tarjeta con animación ────────────────
        elLoading.style.display = 'none';
        elCard.style.display    = 'grid';

    } catch (err) {
        console.error('Error al cargar la noticia:', err);
        elLoading.style.display = 'none';
        elError.style.display   = 'flex';
    }
}

// Ejecutar al cargar la página
cargarNoticia();
cargarImagenes();
cargarGaleria();
cargarPrecios();
cargarVideos();
cargarCatalogo();
cargarTextosSitio();


/* ================================================================
   13. IMÁGENES DINÁMICAS
================================================================ */
async function cargarImagenes() {
    try {
        const res  = await fetch(`${API_BASE}/api/imagenes`);
        if (!res.ok) return;
        const imgs = await res.json();
        imgs.forEach(({ clave, url }) => {
            if (clave === 'hero_bg') {
                const hero = document.getElementById('inicio');
                if (hero) {
                    hero.style.backgroundImage =
                        `linear-gradient(135deg,rgba(0,0,0,.85) 0%,rgba(0,0,0,.6) 100%),url('${url}')`;
                    hero.style.backgroundSize     = 'cover';
                    hero.style.backgroundPosition = 'center';
                }
            } else if (clave === 'logo_icono') {
                // Actualizar logo en header Y en footer
                ['img-logo_icono', 'img-logo_icono_footer'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.src = url;
                });
            } else {
                const el = document.getElementById(`img-${clave}`);
                if (el) el.src = url;
            }
        });
    } catch(e) { console.warn('Imágenes dinámicas:', e.message); }
}


/* ================================================================
   14. GALERÍA DE FOTOS — dinámica desde /api/galeria
================================================================ */
async function cargarGaleria() {
    const grid    = document.getElementById('photoGrid');
    const loading = document.getElementById('photoGridLoading');
    if (!grid) return;
    try {
        const res = await fetch(`${API_BASE}/api/galeria`);
        if (!res.ok) throw new Error('Sin fotos');
        const fotos = await res.json();

        if (loading) loading.remove();

        if (!fotos.length) {
            grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#333;font-size:.85rem">Galería próximamente.</div>';
            return;
        }

        grid.innerHTML = fotos.map((f, i) => `
            <div class="photo-card sr-target" style="--delay:${(i * 0.08).toFixed(2)}s"
                 onclick="abrirZoom(this)" title="Ver en grande">
                <img src="${f.url}" alt="${f.titulo || 'Galería Black Diamond Gym'}" loading="lazy"
                     onerror="this.parentElement.style.display='none'">
                <div class="cat-img-zoom-icon">🔍</div>
                ${f.titulo ? `<div class="overlay"><span>${f.titulo.toUpperCase()}</span></div>` : ''}
            </div>`).join('');

        // Re-trigger scroll reveal for new cards
        if (typeof observeSRTargets === 'function') observeSRTargets();
        else {
            grid.querySelectorAll('.sr-target').forEach(el => {
                el.style.opacity = '1';
                el.style.transform = 'none';
            });
        }
    } catch(e) {
        if (loading) loading.remove();
        console.warn('Galería:', e.message);
    }
}

/* ================================================================
   14b. PRECIOS DINÁMICOS
================================================================ */
async function cargarPrecios() {
    try {
        const res    = await fetch(`${API_BASE}/api/planes`);
        if (!res.ok) return;
        const planes = await res.json();
        planes.forEach(({ clave, nombre, descripcion, precio, periodo }) => {
            // Formato COP: 120000 → num="$120" dec=".000" | 75000 → "$75" ".000"
            const formatPartes = (n) => {
                const s = n.toLocaleString('es-CO'); // ej: "120.000"
                const dot = s.lastIndexOf('.');
                if (dot !== -1) {
                    return { num: '$' + s.slice(0, dot), dec: '.' + s.slice(dot + 1) };
                }
                return { num: '$' + s, dec: '' };
            };

            // Planes con price-tag partido (boxeo, gym, valera)
            const numEl = document.getElementById(`precio-${clave}-num`);
            const decEl = document.getElementById(`precio-${clave}-dec`);
            if (numEl && decEl) {
                const { num, dec } = formatPartes(precio);
numEl.firstChild.textContent = num;                decEl.innerHTML   = `${dec}<small id="precio-${clave}-per">${periodo}</small>`;
            }
            // Planes día (span directo)
            const diaEl = document.getElementById(`precio-${clave}`);
            if (diaEl) {
                diaEl.textContent = '$' + precio.toLocaleString('es-CO');
            }
            const nomEl = document.getElementById(`plan-${clave}-nombre`);
            const desEl = document.getElementById(`plan-${clave}-desc`);
            if (nomEl && nombre)      nomEl.textContent = nombre;
            if (desEl && descripcion) desEl.textContent = descripcion;
        });
    } catch(e) { console.warn('Precios dinámicos:', e.message); }
}


/* ================================================================
   15. VIDEOS DESTACADOS — con modal para ver en la misma página
   ================================================================
   Al hacer clic en una tarjeta se abre un modal con el embed
   nativo de la plataforma. Si el embed no está disponible
   (TikTok/Facebook privados), se muestra un botón para abrir
   la publicación en la red social directamente.
================================================================ */

/* ── Obtener thumbnail real de Instagram via oEmbed ── */
async function getInstagramThumb(url) {
    try {
        const oembed = await fetch(`https://graph.facebook.com/v18.0/instagram_oembed?url=${encodeURIComponent(url)}&fields=thumbnail_url&access_token=IGQAMissing`);
        // Facebook requiere token — fallback: extraer código y usar CDN
        // Alternativa: usar el scraper de miniatura de Instagram sin auth
        const match = url.match(/instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/);
        if (match) {
            // Instagram permite la imagen del post via embed thumbnail
            return `https://www.instagram.com/p/${match[1]}/media/?size=m`;
        }
    } catch(e) { /* noop */ }
    return null;
}

/* ── Obtener thumbnail de TikTok via oEmbed (sin auth) ── */
async function getTikTokThumb(url) {
    try {
        // Extraer video id del URL
        const match = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
        if (match) {
            const res = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`);
            if (res.ok) {
                const data = await res.json();
                return data.thumbnail_url || null;
            }
        }
    } catch(e) { /* noop */ }
    return null;
}

/* ── Thumbnails de fallback por plataforma ── */
const PLATFORM_THUMBS = {
    instagram: 'MEDIA/instagram.png',
    tiktok:    null, // Sin thumbnail confiable → se mantiene el placeholder genérico
    facebook:  'MEDIA/facebook.png',
};

/* ── Placeholder SVG mientras carga ── */
const THUMB_PLACEHOLDER = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='500' viewBox='0 0 800 500'%3E%3Crect fill='%230d0d0d' width='800' height='500'/%3E%3Ccircle cx='400' cy='230' r='48' fill='%231a1a1a'/%3E%3Cpolygon points='385,210 385,250 425,230' fill='%23e31c25'/%3E%3C/svg%3E`;

async function cargarVideos() {
    const grid = document.getElementById('videoGrid');
    if (!grid) return;
    try {
        const res    = await fetch(`${API_BASE}/api/videos`);
        if (!res.ok) { grid.innerHTML = ''; return; }
        const videos = await res.json();
        if (!videos.length) {
            grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#333;font-size:.85rem">Aún no hay videos destacados.</div>';
            return;
        }

        const iconos = { instagram: '📸', tiktok: '♪', facebook: 'f' };

        // Renderizar cards con placeholder inmediato
        grid.innerHTML = videos.map((v, i) => `
            <div class="video-embed-wrap sr-target">
                <div class="video-embed-link" onclick="abrirVideoModal(${i})" style="cursor:pointer">
                    <img id="vthumb-${i}" src="${THUMB_PLACEHOLDER}" alt="${v.titulo}" class="video-embed-thumb" style="transition:opacity .3s">
                    <div class="video-embed-overlay">
                        <div class="video-play-icon">▶</div>
                        <h3 class="video-embed-title">${v.titulo}</h3>
                    </div>
                    <span class="video-platform-tag">${iconos[v.plataforma] || '▶'} ${v.plataforma}</span>
                </div>
            </div>`).join('');

        // Guardar videos en variable global para el modal
        window._videosData = videos;

        // Cargar thumbnails reales de forma asíncrona
        videos.forEach(async (v, i) => {
            let thumb = null;
if (v.plataforma === 'instagram') {
    thumb = PLATFORM_THUMBS.instagram;
} else if (v.plataforma === 'tiktok') {
                thumb = await getTikTokThumb(v.url);
} else if (v.plataforma === 'facebook') {
    thumb = PLATFORM_THUMBS.facebook;
}
            if (thumb) {
                const img = document.getElementById(`vthumb-${i}`);
                if (img) {
                    const tester = new Image();
                    tester.onload = () => { img.src = thumb; };
                    tester.onerror = () => { /* mantener placeholder */ };
                    tester.src = thumb;
                }
            }
        });

    } catch(e) { console.warn('Videos:', e.message); }
}

/* ── Abrir modal con embed de la plataforma ── */
function abrirVideoModal(index) {
    const v = window._videosData?.[index];
    if (!v) return;

    const modal   = document.getElementById('videoModal');
    const content = document.getElementById('videoModalContent');
    if (!modal || !content) return;

    const plat = v.plataforma;
    const url  = v.url;
    let embedHTML = '';

    if (plat === 'instagram') {
        // Instagram oEmbed: convertir URL de post a embed
        const match = url.match(/instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/);
        if (match) {
            const code = match[1];
            embedHTML = `<iframe
                src="https://www.instagram.com/p/${code}/embed/"
                width="100%" height="480" frameborder="0"
                scrolling="no" allowtransparency="true" allowfullscreen="true"
                style="background:#000"></iframe>`;
        }
    } else if (plat === 'tiktok') {
        // TikTok: usar iframe directo con el video ID — más confiable que blockquote
        const match = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
        if (match) {
            const videoId = match[1];
            embedHTML = `<iframe
                src="https://www.tiktok.com/embed/v2/${videoId}"
                width="100%" height="560" frameborder="0"
                allow="encrypted-media" allowfullscreen="true"
                style="max-width:340px;display:block;margin:0 auto;border-radius:12px"></iframe>`;
        }
    } else if (plat === 'facebook') {
    embedHTML = '';
}

    // Si no se pudo generar embed → mostrar botón de fallback
    if (!embedHTML) {
        const iconos = { instagram: '📸', tiktok: '♪', facebook: 'f' };
        embedHTML = `<div class="video-modal-fallback">
            <span class="vid-platform-icon">${iconos[plat] || '▶'}</span>
            <h3>${v.titulo}</h3>
            <p>Haz clic para ver este video directamente en ${plat}.</p>
            <a href="${url}" target="_blank" rel="noopener noreferrer" class="btn-open-ext">
                VER EN ${plat.toUpperCase()} ↗
            </a>
        </div>`;
    }

    content.innerHTML = embedHTML;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

/* ── Cerrar modal ── */
function cerrarVideoModal(e) {
    // Cerrar si: sin argumento, clic en el fondo, o clic en el botón ✕
    if (e && e.target && e.target !== document.getElementById('videoModal') && !e.target.classList.contains('video-modal-close')) return;
    const modal = document.getElementById('videoModal');
    if (!modal) return;
    modal.style.display = 'none';
    document.body.style.overflow = '';
    // Vaciar content para detener reproducción
    const content = document.getElementById('videoModalContent');
    if (content) content.innerHTML = '';
}

// Cerrar modal con Escape
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') cerrarVideoModal({ target: document.getElementById('videoModal') });
});


/* ================================================================
   16. CATÁLOGO — renderiza tarjetas de productos
================================================================ */
async function cargarCatalogo() {
    const grid = document.getElementById('catalogoGrid');
    if (!grid) return;
    try {
        const res      = await fetch(`${API_BASE}/api/catalogo`);
        if (!res.ok) { grid.innerHTML = ''; return; }
        const productos = await res.json();
        if (!productos.length) { grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px;color:#333;font-size:.85rem">Próximamente productos disponibles.</div>'; return; }

        grid.innerHTML = productos.map(p => {
            // Formato COP correcto para cualquier valor: 1234 → $1.234, 85000 → $85.000, 50 → $50
            const formatCOP = (n) => {
                return '$' + n.toLocaleString('es-CO');
            };
            const precio = formatCOP(p.precio);
            const img = p.imagen_url
                ? `<img src="${p.imagen_url}" alt="${p.nombre}" loading="lazy">`
                : `<div class="catalogo-no-img">🥊</div>`;
            return `
            <div class="catalogo-card sr-target">
                <div class="catalogo-img-wrap">
                    ${img}
                    ${p.categoria ? `<span class="catalogo-badge">${p.categoria}</span>` : ''}
                </div>
                <div class="catalogo-body">
                    <span class="catalogo-cat">${p.categoria || 'Producto'}</span>
                    <h3 class="catalogo-nombre">${p.nombre}</h3>
                    <p class="catalogo-desc">${p.descripcion || ''}</p>
                    <div class="catalogo-footer">
                        <span class="catalogo-precio">${precio}</span>
                        <span class="catalogo-stock">${p.stock > 0 ? `Stock: ${p.stock}` : 'Consultar'}</span>
                    </div>
                    <a href="https://wa.me/${window._waNumber || '573133737590'}?text=Hola,%20me%20interesa%20el%20producto:%20${encodeURIComponent(p.nombre)}" target="_blank" class="catalogo-btn">PEDIR AHORA</a>
                </div>
            </div>`;
        }).join('');
    } catch(e) { console.warn('Catálogo:', e.message); }
}


/* ================================================================
   17. FORMULARIO DE CONTACTO → /api/solicitudes
================================================================ */
/* ── Actualizar hint de contacto en tiempo real ── */
function actualizarReqContacto() {
    const nombre   = (document.getElementById('cf-nombre')?.value  || '').trim();
    const email    = (document.getElementById('cf-email')?.value   || '').trim();
    const wa       = (document.getElementById('cf-whatsapp')?.value|| '').trim();
    const hint     = document.getElementById('cf-contacto-hint');
    const btn      = document.getElementById('cf-btn');
    const waDigits = wa.replace(/\D/g, '');
    const emailValido = email.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const waValido    = waDigits.length >= 10;

    let hintMsg   = '';
    let hintColor = '#888';

    if (!email && !wa) {
        hintMsg   = '⚡ Ingresa tu correo <strong>o</strong> WhatsApp';
        hintColor = '#e31c25';
    } else if (email && !emailValido && !wa) {
        hintMsg   = '⚡ Correo inválido — ej: nombre@gmail.com';
        hintColor = '#e31c25';
    } else if (email && !emailValido && wa && !waValido) {
        hintMsg   = '⚡ Correo inválido y WhatsApp muy corto';
        hintColor = '#e31c25';
    } else if (wa && !waValido && !emailValido) {
        hintMsg   = '⚡ WhatsApp muy corto (mín. 10 dígitos)';
        hintColor = '#e31c25';
    } else {
        hintMsg   = '✅ Contacto válido';
        hintColor = '#25d366';
    }

    const contactoValido = emailValido || waValido;

    if (hint) { hint.style.color = hintColor; hint.innerHTML = hintMsg; }
}

async function enviarSolicitud(e) {
    e.preventDefault();
    const btn = document.getElementById('cf-btn');

    // Reset visual completo del botón
    btn.classList.remove('btn-error', 'btn-success', 'btn-loading');
    clearTimeout(btn._errTimer);

    const nombre   = (document.getElementById('cf-nombre')?.value  || '').trim();
    const email    = (document.getElementById('cf-email')?.value   || '').trim() || null;
    const whatsapp = (document.getElementById('cf-whatsapp')?.value|| '').trim() || null;
    const waDigits = whatsapp ? whatsapp.replace(/\D/g, '') : '';

    // Mostrar error EN el botón y volver a normal en 3.5s
    const btnError = (msg) => {
        // Re-disparar shake quitando y volviendo a poner la clase
        btn.classList.remove('btn-shake');
        void btn.offsetWidth; // forzar reflow para reiniciar animación
        btn.classList.add('btn-error', 'btn-shake');
        btn.textContent = '⚡ ' + msg;
        btn.disabled = false;
        clearTimeout(btn._errTimer);
        btn._errTimer = setTimeout(() => {
            btn.classList.remove('btn-error', 'btn-shake');
            btn.textContent = 'QUIERO INFORMACIÓN';
        }, 3500);
    };

    // — Validaciones —
    const emailValido = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const waValido    = whatsapp && waDigits.length >= 10;

    const plan = document.getElementById('cf-plan')?.value || '';
    if (!nombre)               return btnError('Falta tu nombre');
    if (!email && !whatsapp)   return btnError('Falta correo o WhatsApp');
    if (email && !emailValido) return btnError('Correo inválido');
    if (whatsapp && !waValido) return btnError('WhatsApp muy corto');
    if (!plan)                 return btnError('Elige un plan');

    // — Estado: cargando —
    btn.textContent = 'ENVIANDO...';
    btn.classList.add('btn-loading');
    btn.disabled = true;

    try {
        const res = await fetch(`${API_BASE}/api/solicitudes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nombre,
                email,
                whatsapp,
                plan_interes: document.getElementById('cf-plan')?.value || null,
                mensaje     : (document.getElementById('cf-mensaje')?.value || '').trim() || null,
            })
        });

        btn.classList.remove('btn-loading');

        if (!res.ok) {
            let msg = '';
            try { msg = (await res.json()).error || ''; } catch(_) {}
            return btnError(msg || `Error ${res.status} — intenta de nuevo`);
        }

        // — Estado: éxito —
        btn.textContent = '✅ MENSAJE ENVIADO';
        btn.classList.add('btn-success');
        btn.disabled = false;
        document.getElementById('contactForm').reset();
        actualizarReqContacto();
        setTimeout(() => {
            btn.classList.remove('btn-success');
            btn.textContent = 'QUIERO INFORMACIÓN';
        }, 4000);

    } catch(err) {
        btn.classList.remove('btn-loading');
        btnError('Sin conexión — intenta de nuevo');
    } finally {
        btn.disabled = false;
    }
}

/* ================================================================
   ZOOM LIGHTBOX — fotos galería y categorías
================================================================ */
function abrirZoom(el) {
    const img = el.querySelector('img');
    if (!img) return;
    const modal = document.getElementById('zoomModal');
    const zi    = document.getElementById('zoomImg');
    if (!modal || !zi) return;
    zi.src = img.src;
    zi.alt = img.alt;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => modal.classList.add('zoom-open'));
}

function cerrarZoom(e) {
    // Allow close from: backdrop click, close button click, or no-arg call
    if (e && e.target && e.target !== document.getElementById('zoomModal') && !e.target.classList.contains('zoom-close')) return;
    const modal = document.getElementById('zoomModal');
    if (!modal) return;
    modal.classList.remove('zoom-open');
    setTimeout(() => {
        modal.style.display = 'none';
        document.body.style.overflow = '';
        const zi = document.getElementById('zoomImg');
        if (zi) zi.src = '';
    }, 220);
}

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') cerrarZoom({ target: document.getElementById('zoomModal') });
});


/* ================================================================
   FIN DEL ARCHIVO — javascript.js
   Black Diamond Gym · Boxing Center · Bosa, Bogotá
================================================================ */


/* ================================================================
   TEXTOS DINÁMICOS DEL SITIO
   Carga desde /api/textos y aplica al DOM si el elemento existe.
================================================================ */
async function cargarTextosSitio() {
    try {
        const res = await fetch(`${API_BASE}/api/textos`);
        if (!res.ok) return;
        const t = await res.json();

        // ── HERO ──────────────────────────────────────────────
        const h1 = document.querySelector('.hero-content h1');
        if (h1 && (t['hero-linea1'] || t['hero-acento'] || t['hero-linea3'])) {
            const l1 = t['hero-linea1'] || 'FORJA TU';
            const ac = t['hero-acento'] || 'CAMPEÓN';
            const l3 = t['hero-linea3'] || 'INTERIOR';
            h1.innerHTML = `${l1}<br><span class="hero-accent">${ac}</span><br>${l3}`;
        }
        const heroSub = document.querySelector('.hero-sub');
        if (heroSub && t['hero-sub']) heroSub.innerHTML = t['hero-sub'].replace(/\n/g, '<br>');
        const heroEye = document.querySelector('.hero-eyebrow');
        if (heroEye && t['hero-eyebrow']) {
            const dot = heroEye.querySelector('.dot-pulse');
            heroEye.innerHTML = '';
            if (dot) heroEye.appendChild(dot);
            heroEye.append(' ' + t['hero-eyebrow']);
        }

        // ── NOSOTROS ──────────────────────────────────────────
        const nosTit = document.querySelector('.nosotros-text h2');
        if (nosTit && t['nos-titulo']) nosTit.textContent = t['nos-titulo'];
        const estEl = document.getElementById('txt-est-año');
        if (estEl && t['est-año']) estEl.textContent = t['est-año'];
        const nosPs = document.querySelectorAll('.nosotros-text > p:not(.eyebrow-label)');
        if (nosPs[0] && t['nos-p1']) nosPs[0].textContent = t['nos-p1'];
        if (nosPs[1] && t['nos-p2']) nosPs[1].textContent = t['nos-p2'];
        [1, 2, 3].forEach(i => {
            const numEl   = document.getElementById(`stat-num-${i}`);
            const sufEl   = document.getElementById(`stat-suf-${i}`);
            const labelEl = document.getElementById(`stat-label-${i}`);
            const key = `nos-s${i}`;
            if (numEl && t[key]) {
                const val = parseInt(t[key]);
                numEl.dataset.target = val;
                numEl.textContent    = val;
            }
            if (sufEl   && t[key + '-suf']   !== undefined) sufEl.textContent   = t[key + '-suf'];
            if (labelEl && t[key + '-label'])                labelEl.innerHTML   = t[key + '-label'].replace(/\n/g, '<br>');
        });

        // ── CARACTERÍSTICAS DE PRECIOS ─────────────────────────
        const featKeys = [
            'feat-boxeo-1','feat-boxeo-2','feat-boxeo-3','feat-boxeo-4','feat-boxeo-5',
            'feat-gym-1',  'feat-gym-2',  'feat-gym-3',  'feat-gym-4',  'feat-gym-5',
            'feat-valera-1','feat-valera-2','feat-valera-3','feat-valera-4','feat-valera-5',
        ];
        featKeys.forEach(k => {
            const el = document.getElementById(k);
            if (el && t[k]) el.textContent = t[k];
        });

        // ── HORARIOS ──────────────────────────────────────────
        const horTit = document.querySelector('.schedule-left h2');
        if (horTit && t['hor-titulo']) horTit.textContent = t['hor-titulo'];
        const timeChips = document.querySelectorAll('.time-chip');
        if (timeChips[0] && t['hor-lv']) timeChips[0].textContent = t['hor-lv'];
        if (timeChips[1] && t['hor-sa']) timeChips[1].textContent = t['hor-sa'];
        if (timeChips[2] && t['hor-do']) timeChips[2].textContent = t['hor-do'];
        if (timeChips[3] && t['hor-fe']) timeChips[3].textContent = t['hor-fe'];
        const ctaH3 = document.querySelector('.cta-overlay h3');
        if (ctaH3 && t['hor-cta-title']) ctaH3.textContent = t['hor-cta-title'];
        const ctaP = document.querySelector('.cta-overlay p');
        if (ctaP && t['hor-cta-sub']) ctaP.textContent = t['hor-cta-sub'];

        // ── CONTACTO / FOOTER ─────────────────────────────────
        if (t['con-wa']) {
            const wa = t['con-wa'].replace(/\D/g, '');

            // Guardar número globalmente para usarlo en el catálogo y otros componentes dinámicos
            window._waNumber = wa;

            // Actualizar todos los href de WhatsApp
            document.querySelectorAll('a[href*="wa.me"]').forEach(a => {
                const query = a.href.includes('?') ? '?' + a.href.split('?')[1] : '';
                a.href = `https://wa.me/${wa}${query}`;
            });

            // Actualizar textos visibles que muestran el número
            const waLocal = wa.startsWith('57') ? wa.slice(2) : wa;
            const waFormato = `${waLocal.slice(0,3)} ${waLocal.slice(3,6)} ${waLocal.slice(6,10)}`;
            document.querySelectorAll('a[href*="wa.me"]').forEach(a => {
                if (a.textContent.match(/\d{3}[\s.]\d{3}[\s.]\d{3,4}/)) {
                    a.textContent = waFormato;
                }
            });
        }
        if (t['con-ig']) {
            document.querySelectorAll('a[href*="instagram.com"]').forEach(a => a.href = t['con-ig']);
        }
        if (t['con-tk']) {
            document.querySelectorAll('a[href*="tiktok.com"]').forEach(a => a.href = t['con-tk']);
        }
        const footerCopy = document.querySelector('.footer-copy');
        if (footerCopy && t['con-footer']) footerCopy.textContent = t['con-footer'];
        const dirEls = document.querySelectorAll('.footer-dir, .contact-dir');
        if (t['con-dir']) dirEls.forEach(el => el.textContent = t['con-dir']);

    } catch(e) { console.warn('Textos dinámicos:', e.message); }
}