/*:
 * @target MV MZ
 * @plugindesc Barra de entrada nativa (Teclado de móvil/PC)
 * @author Gemini AI
 * * @help
 * Comando de Plugin (MV): NATIVE_INPUT
 * Comando de Plugin (MZ): Usar el nombre del comando NATIVE_INPUT
 * * El texto se guarda automáticamente en la Variable de Juego 2.
 */

var NativeTextInput = NativeTextInput || {};

(function() {

    NativeTextInput.showInput = function(interpreter) {
        interpreter.setWaitMode('native_input');

        // 1. Crear el contenedor principal (Overlay)
        var overlay = document.createElement('div');
        overlay.id = 'native-input-overlay';
        overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); z-index:100000; display:flex; flex-direction:column; align-items:center; justify-content:center; touch-action:none;';

        // 2. Caja de la interfaz
        var box = document.createElement('div');
        box.style.cssText = 'background:#1a1a2e; border:2px solid #e0c97f; border-radius:10px; padding:15px; width:90vw; max-width:400px; box-sizing:border-box; box-shadow: 0 5px 25px rgba(0,0,0,0.8);';

        // Título
        var title = document.createElement('p');
        title.textContent = 'Escribe tu mensaje:';
        title.style.cssText = 'color:#e0c97f; font-size:14px; margin:0 0 10px 0; font-family: sans-serif; font-weight: bold;';

        // 3. El Input Real (La barra mágica)
        var input = document.createElement('input');
        input.type = 'text';
        input.id = 'native-input-field';
        input.placeholder = 'Toca para escribir...';
        
        // Configuraciones para evitar comportamientos extraños
        input.setAttribute('autocorrect', 'on'); // Activado para comodidad del usuario
        input.setAttribute('autocomplete', 'off');
        input.setAttribute('spellcheck', 'true');

        // Estilo de la barra (Ancha y clara para tocar fácil)
        input.style.cssText = 'width:100%; background:#0f0f1a; border:1px solid #e0c97f; border-radius:5px; padding:12px; color:#ffffff; font-size:16px; box-sizing:border-box; outline:none; margin-bottom:15px;';

        // 4. Botón Aceptar
        var btnConfirm = document.createElement('button');
        btnConfirm.textContent = 'ACEPTAR';
        btnConfirm.style.cssText = 'width:100%; background:#e0c97f; color:#1a1a2e; border:none; border-radius:5px; padding:12px; font-weight:bold; cursor:pointer; font-size:14px; transition: opacity 0.2s;';

        // --- LÓGICA DE CIERRE Y GUARDADO ---
        var closeAndSave = function() {
            var finalValue = input.value.trim();
            
            // Guardar en la variable 2 de RPG Maker
            $gameVariables.setValue(2, finalValue);
            
            // Eliminar elementos del DOM
            if (document.body.contains(overlay)) {
                document.body.removeChild(overlay);
            }
            
            // Quitar el modo espera del intérprete para que el juego siga
            interpreter.setWaitMode('');
        };

        // Evento al pulsar el botón
        btnConfirm.addEventListener('pointerdown', function(e) {
            e.preventDefault();
            closeAndSave();
        });

        // Evento al pulsar Enter en el teclado físico/virtual
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                input.blur(); // Quita el foco para esconder teclado móvil
                closeAndSave();
            }
            e.stopPropagation(); // Evita que las teclas afecten al juego de fondo
        });

        // 5. Ensamblaje
        box.appendChild(title);
        box.appendChild(input);
        box.appendChild(btnConfirm);
        overlay.appendChild(box);
        document.body.appendChild(overlay);

        // 6. Autofoco (Intenta abrir el teclado al aparecer)
        setTimeout(function() {
            input.focus();
        }, 200);
    };

    // --- REGISTRO DEL COMANDO ---
    var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);
        if (command === 'NATIVE_INPUT') {
            NativeTextInput.showInput(this);
        }
    };

    // --- MANEJO DEL MODO ESPERA ---
    var _Game_Interpreter_updateWaitMode = Game_Interpreter.prototype.updateWaitMode;
    Game_Interpreter.prototype.updateWaitMode = function() {
        if (this._waitMode === 'native_input') {
            return true;
        }
        return _Game_Interpreter_updateWaitMode.call(this);
    };

})();