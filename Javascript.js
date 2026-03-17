// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {

    // 1. Desplazamiento suave (Smooth Scroll) para los enlaces de navegación [cite: 2, 4, 11, 16]
    const navLinks = document.querySelectorAll('header nav ul li a');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);

            if (targetSection) {
                window.scrollTo({
                    top: targetSection.offsetTop - 70, // Ajuste por el encabezado fijo
                    behavior: 'smooth'
                });
            }
        });
    });

    // 2. Manejo del Formulario de Contacto [cite: 108]
    const contactForm = document.querySelector('form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Simulación de envío de datos [cite: 108]
            const formData = new FormData(contactForm);
            const nombre = formData.get('nombre') || 'Usuario';

            alert(`¡Gracias, ${nombre}! Hemos recibido tu mensaje. Nos pondremos en contacto contigo pronto.`);
            contactForm.reset();
        });
    }

    // 3. Interactividad para los botones de "Comenzar" en los planes [cite: 90, 105, 106]
    const planButtons = document.querySelectorAll('.planes button');

    planButtons.forEach(button => {
        button.addEventListener('click', () => {
            const planNombre = button.parentElement.querySelector('h3').innerText;
            alert(`Has seleccionado el Plan ${planNombre}. ¡Prepárate para entrenar como un campeón!`);
        });
    });

    // 4. Efecto visual simple para el botón "Únete Ahora" [cite: 5, 17, 33, 64]
    const joinButtons = document.querySelectorAll('button:contains("ÚNETE AHORA"), button:contains("ONETE AHORA")');
    // Nota: El selector :contains no es nativo, se usa lógica manual:
    document.querySelectorAll('button').forEach(btn => {
        if (btn.innerText.includes('NETE AHORA')) {
            btn.addEventListener('mouseover', () => {
                btn.style.transform = 'scale(1.05)';
                btn.style.transition = '0.3s';
            });
            btn.addEventListener('mouseout', () => {
                btn.style.transform = 'scale(1)';
            });
        }
    });

    // 5. Simulación de reproducción de videos [cite: 54, 55]
    const videoButtons = document.querySelectorAll('.videos-grid button');
    
    videoButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const videoTitulo = btn.previousElementSibling.innerText;
            console.log(`Reproduciendo: ${videoTitulo}`);
            alert(`Iniciando video: ${videoTitulo}`);
        });
    });
});