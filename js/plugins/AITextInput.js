var AITextInput = AITextInput || {};

(function() {

    AITextInput.showInput = function(interpreter) {
        interpreter.setWaitMode('ai_input');

        // Neutralizar TouchInput de RPG Maker
        AITextInput._origTouchUpdate = TouchInput.update;
        TouchInput.update = function() {};

        var text = '';
        var confirmed = false;

        // ── Input nativo oculto para capturar teclado sin autocorrector ──
        var hiddenInput = document.createElement('input');
        hiddenInput.setAttribute('type', 'text');
        hiddenInput.setAttribute('autocomplete', 'off');
        hiddenInput.setAttribute('autocorrect', 'off');
        hiddenInput.setAttribute('autocapitalize', 'off');
        hiddenInput.setAttribute('spellcheck', 'false');
        hiddenInput.style.cssText = [
            'position:fixed',
            'top:-9999px',
            'left:-9999px',
            'opacity:0',
            'width:1px',
            'height:1px'
        ].join(';');
        document.body.appendChild(hiddenInput);

        // ── Overlay ───────────────────────────────────────────────────────
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
            'justify-content:center'
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

        var title = document.createElement('p');
        title.textContent = '¿Qué le dices?';
        title.style.cssText = 'color:#e0c97f;font-size:13px;margin:0 0 6px 0;text-align:center;';

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

        function updateScreen() {
            screen.textContent = text || '';
        }

        function cleanup() {
            if (document.body.contains(overlay)) document.body.removeChild(overlay);
            if (document.body.contains(hiddenInput)) document.body.removeChild(hiddenInput);
        }

        function confirmInput() {
            if (confirmed) return;
            if (text.trim() === '') return;
            confirmed = true;
            $gameVariables._data[2] = text.trim();
            cleanup();
            // Restaurar TouchInput y liberar intérprete
            if (AITextInput._origTouchUpdate) {
                TouchInput.update = AITextInput._origTouchUpdate;
                AITextInput._origTouchUpdate = null;
            }
            interpreter._waitMode = '';
        }

        // ── Escuchar cambios en el input nativo (PC) ──────────────────────
        hiddenInput.addEventListener('keydown', function(e) {
            e.stopPropagation();
            if (e.key === 'Enter') {
                confirmInput();
                return;
            }
            if (e.key === 'Backspace') {
                text = text.slice(0, -1);
                updateScreen();
                hiddenInput.value = '';
            }
        });

        // ── Crear botón táctil ────────────────────────────────────────────
        function makeBtn(label, styleCss, handler) {
            var btn = document.createElement('button');
            btn.textContent = label;
            btn.style.cssText = styleCss;

            // Solo touchstart: más fiable en móvil, sin delays
            btn.addEventListener('touchstart', function(e) {
                e.preventDefault();
                e.stopPropagation();
                handler();
            }, { passive: false });

            // Click para PC
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
                    btn = makeBtn(key, [
                        'background:#e0c97f',
                        'color:#1a1a2e',
                        'border:none',
                        'border-radius:4px',
                        'padding:8px 12px',
                        'font-size:12px',
                        'font-weight:bold',
                        'cursor:pointer',
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
                    btn = makeBtn(key, btnBase + ';flex:3;', function() {
                        if (text.length < 80) { text += ' '; updateScreen(); }
                    });
                } else if (key === '⌫') {
                    btn = makeBtn(key, btnBase + ';flex:1.5;', function() {
                        text = text.slice(0, -1);
                        updateScreen();
                    });
                } else {
                    btn = makeBtn(key, btnBase, function() {
                        if (text.length < 80) { text += key.toLowerCase(); updateScreen(); }
                    });
                }
                rowDiv.appendChild(btn);
            });

            box.appendChild(rowDiv);
        });

        // Bloquar eventos del overlay sin bloquear los botones
        overlay.addEventListener('touchstart', function(e) {
            if (e.target === overlay) e.preventDefault();
        }, { passive: false });

        box.insertBefore(screen, box.firstChild);
        box.insertBefore(title, box.firstChild);
        overlay.appendChild(box);
        document.body.appendChild(overlay);

        // Enfocar input oculto para capturar teclado físico en PC
        setTimeout(function() { hiddenInput.focus(); }, 100);
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
            if (document.getElementById('ai-input-overlay')) return true;
            this._waitMode = '';
            return false;
        }
        return _updateWaitMode.call(this);
    };

}());