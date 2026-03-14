/*:
 * @plugindesc Pantalla completa y orientación horizontal en navegador
 * @author Fix
 */
(function() {

    // Pantalla completa al hacer click (los navegadores lo requieren)
    document.addEventListener('click', function() {
        var el = document.documentElement;
        if (!document.fullscreenElement) {
            if (el.requestFullscreen) {
                el.requestFullscreen();
            } else if (el.webkitRequestFullscreen) {
                el.webkitRequestFullscreen();
            }
        }
    }, { once: true }); // Solo se dispara una vez

    // Forzar orientación horizontal (funciona en móvil/tablet)
    if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(function() {
            // Algunos navegadores no permiten bloquear orientación, se ignora
        });
    }

    // Mensaje si el usuario está en vertical (móvil)
    window.addEventListener('orientationchange', function() {
        if (window.orientation === 0 || window.orientation === 180) {
            // Está en vertical, mostrar aviso
            var msg = document.getElementById('rotate-msg');
            if (!msg) {
                msg = document.createElement('div');
                msg.id = 'rotate-msg';
                msg.style.cssText = [
                    'position:fixed', 'top:0', 'left:0',
                    'width:100%', 'height:100%',
                    'background:black', 'color:white',
                    'display:flex', 'align-items:center',
                    'justify-content:center', 'font-size:24px',
                    'z-index:9999', 'text-align:center'
                ].join(';');
                msg.textContent = 'Por favor, gira el dispositivo en horizontal';
                document.body.appendChild(msg);
            }
            msg.style.display = 'flex';
        } else {
            var msg = document.getElementById('rotate-msg');
            if (msg) msg.style.display = 'none';
        }
    });

})();