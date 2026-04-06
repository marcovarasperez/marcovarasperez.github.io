var AITextInput = AITextInput || {};

(function() {

    AITextInput.showInput = function(interpreter) {
        interpreter.setWaitMode('ai_input');

        // Neutralizar TouchInput de RPG Maker mientras el overlay esté activo
        AITextInput._origTouchUpdate = TouchInput.update;
        TouchInput.update = function() {};

        var overlay = document.createElement('div');
        overlay.id = 'ai-input-overlay';
        overlay.style.cssText = [
            'position:fixed',
            'top:0','left:0',
            'width:100%','height:100%',
            'background:rgba(0,0,0,0.75)',
            'z-index:9999',
            'display:flex',
            'flex-direction:column',
            'align-items:center',
            'justify-content:center',
            '-webkit-tap-highlight-color:transparent'
        ].join(';');

        var box = document.createElement('div');
        box.style.cssText = [
            'background:#1a1a2e',
            'border:2px solid #e0c97f',
            'border-radius:8px',
            'padding:10px',
            'width:90%',
            'max-width:380px',
            'box-sizing:border-box'
        ].join(';');

        // Título
        var title = document.createElement('p');
        title.textContent = '¿Qué le dices?';
        title.style.cssText = 'color:#e0c97f;font-size:13px;margin:0 0 6px 0;text-align:center;';

        // Pantalla de texto
        var screen = document.createElement('div');
        screen.style.cssText = [
            'background:#0f0f1a',
            'border:1px solid #e0c97f',
            'border-radius:4px',
            'padding:6px 8px',
            'min-height:30px',
            'color:#ffffff',
            'font-size:13px',
            'margin-bottom:8px',
            'word-break:break-all'
        ].join(';');

        var text = '';
        var confirmed = false;

        function updateScreen() {
            screen.textContent = text || '';
        }

        function onKeyDown(e) {
            if (!document.getElementById('ai-input-overlay')) return;
            if (e.key === 'Enter') {
                confirmInput();
            } else if (e.key === 'Backspace') {
                text = text.slice(0, -1);
                updateScreen();
            } else if (e.key.length === 1 && text.length < 80) {
                text += e.key;
                updateScreen();
            }
            e.stopPropagation();
        }
        document.addEventListener('keydown', onKeyDown);

        function confirmInput() {
            if (confirmed) return;
            if (text.trim() === '') return;
            confirmed = true;
            $gameVariables._data[2] = text.trim();
            document.removeEventListener('keydown', onKeyDown);
            if (document.body.contains(overlay)) {
                document.body.removeChild(overlay);
            }
            interpreter.setWaitMode('');
            // Restaurar TouchInput de RPG Maker
            if (AITextInput._origTouchUpdate) {
                TouchInput.update = AITextInput._origTouchUpdate;
                AITextInput._origTouchUpdate = null;
            }
            // Forzar al intérprete a continuar en el siguiente frame
            setTimeout(function() {
                interpreter._waitMode = '';
                if (interpreter._waitCount > 0) interpreter._waitCount = 0;
            }, 50);
        }

        // ── Crear botones ─────────────────────────────────────────────────
        // CORRECCIÓN MÓVIL: usar solo touchend sin flag 'touched',
        // y sin mezclar con click para evitar doble disparo o no disparo.
        function makeButton(label, styleCss, handler) {
            var btn = document.createElement('button');
            btn.textContent = label;
            btn.style.cssText = styleCss;

            // Móvil: touchend dispara el handler directamente
            btn.addEventListener('touchend', function(e) {
                e.preventDefault();
                e.stopPropagation();
                handler();
            }, { passive: false });

            // Escritorio: click normal
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                handler();
            });

            return btn;
        }

        // ── Filas del teclado ─────────────────────────────────────────────
        var rows = [
            ['1','2','3','4','5','6','7','8','9','0'],
            ['Q','W','E','R','T','Y','U','I','O','P'],
            ['A','S','D','F','G','H','J','K','L','Ñ'],
            ['Z','X','C','V','B','N','M','⌫'],
            ['ESPACIO','CONFIRMAR']
        ];

        var btnBase = [
            'background:#2a2a4e',
            'color:#e0c97f',
            'border:1px solid #e0c97f',
            'border-radius:4px',
            'padding:6px 2px',
            'font-size:12px',
            'cursor:pointer',
            'flex:1',
            'margin:1px',
            'min-width:24px',
            'touch-action:manipulation',
            '-webkit-tap-highlight-color:transparent',
            'user-select:none',
            '-webkit-user-select:none'
        ].join(';');

        rows.forEach(function(row) {
            var rowDiv = document.createElement('div');
            rowDiv.style.cssText = 'display:flex;justify-content:center;margin-bottom:3px;';

            row.forEach(function(key) {
                var btn;

                if (key === 'CONFIRMAR') {
                    btn = makeButton(key, [
                        'background:#e0c97f',
                        'color:#1a1a2e',
                        'border:none',
                        'border-radius:4px',
                        'padding:8px 12px',
                        'font-size:12px',
                        'cursor:pointer',
                        'font-weight:bold',
                        'margin:1px',
                        'flex:2',
                        'touch-action:manipulation',
                        '-webkit-tap-highlight-color:transparent',
                        'user-select:none',
                        '-webkit-user-select:none'
                    ].join(';'), function() {
                        confirmInput();
                    });

                } else if (key === 'ESPACIO') {
                    btn = makeButton(key, btnBase + ';flex:3;', function() {
                        if (text.length < 80) {
                            text += ' ';
                            updateScreen();
                        }
                    });

                } else if (key === '⌫') {
                    btn = makeButton(key, btnBase + ';flex:1.5;', function() {
                        text = text.slice(0, -1);
                        updateScreen();
                    });

                } else {
                    btn = makeButton(key, btnBase, function() {
                        if (text.length < 80) {
                            text += key.toLowerCase();
                            updateScreen();
                        }
                    });
                }

                rowDiv.appendChild(btn);
            });

            box.appendChild(rowDiv);
        });

        // Bloquear TODOS los eventos touch/pointer/mouse del overlay
        // para que no lleguen al canvas de RPG Maker
        ['touchstart','touchend','touchmove','touchcancel',
         'pointerdown','pointerup','pointermove',
         'mousedown','mouseup','mousemove','click'].forEach(function(evt) {
            overlay.addEventListener(evt, function(e) {
                e.stopPropagation();
                e.preventDefault();
            }, { passive: false });
        });

        // Pero los botones necesitan su propio preventDefault en touchend
        // así que re-permitimos solo dentro del box
        box.addEventListener('touchstart', function(e) {
            e.stopPropagation();
        }, { passive: true });

        box.insertBefore(screen, box.firstChild);
        box.insertBefore(title, box.firstChild);
        overlay.appendChild(box);
        document.body.appendChild(overlay);
    };

    // ── Plugin Command ────────────────────────────────────────────────────
    var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);
        if (command === 'TEXTINPUT') {
            AITextInput.showInput(this);
        }
    };

    // ── Wait mode ─────────────────────────────────────────────────────────
    var _updateWaitMode = Game_Interpreter.prototype.updateWaitMode;
    Game_Interpreter.prototype.updateWaitMode = function() {
        if (this._waitMode === 'ai_input') {
            // Solo bloquear si el overlay sigue en el DOM
            if (document.getElementById('ai-input-overlay')) {
                return true;
            }
            // Si el overlay ya no existe, liberar el wait mode
            this._waitMode = '';
            return false;
        }
        return _updateWaitMode.call(this);
    };
}());
