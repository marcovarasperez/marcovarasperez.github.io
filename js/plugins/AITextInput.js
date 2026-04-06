AITextInput.showInput = function(interpreter) {
        interpreter.setWaitMode('ai_input');

        var old = document.getElementById('ai-input-overlay');
        if (old) document.body.removeChild(old);

        var text = '';
        var overlay = document.createElement('div');
        overlay.id = 'ai-input-overlay';
        
        // Estilo fijo abajo para evitar que desaparezca
        overlay.style.cssText = `
            position: fixed;
            bottom: 0; left: 0;
            width: 100%; height: 100%;
            background: rgba(0,0,0,0.6);
            z-index: 20000;
            display: flex;
            flex-direction: column;
            justify-content: flex-end; /* Empuja el teclado al borde inferior */
            align-items: center;
            padding-bottom: 5px;
            touch-action: none;
        `;

        var box = document.createElement('div');
        // Reducimos padding y márgenes al mínimo
        box.style.cssText = 'background:#1a1a2e; border:1px solid #e0c97f; border-radius:4px; padding:4px; width:98%; max-width:350px; box-sizing:border-box;';

        var screen = document.createElement('div');
        screen.style.cssText = 'background:#000; border:1px solid #e0c97f; border-radius:3px; padding:4px; min-height:22px; color:#fff; font-size:13px; margin-bottom:4px; word-break:break-all; text-align:center; font-family:monospace;';
        
        function updateScreen() { screen.textContent = text; }

        function onConfirm() {
            if (text.trim() === '') return;
            $gameVariables.setValue(2, text.trim());
            document.body.removeChild(overlay);
            interpreter.setWaitMode('');
        }

        // Función de click/toque mejorada
        function bind(btn, fn) {
            btn.addEventListener('pointerdown', function(e) {
                e.preventDefault();
                e.stopPropagation();
                fn();
            }, { passive: false });
        }

        var rows = [
            ['1','2','3','4','5','6','7','8','9','0'],
            ['Q','W','E','R','T','Y','U','I','O','P'],
            ['A','S','D','F','G','H','J','K','L','Ñ'],
            ['Z','X','C','V','B','N','M','⌫'],
            ['ESPACIO','CONFIRMAR']
        ];

        // Botones más bajos (padding: 5px)
        var btnBase = 'background:#2a2a4e; color:#e0c97f; border:1px solid #e0c97f; border-radius:2px; padding:5px 0; font-size:12px; font-weight:bold; flex:1; margin:1px; touch-action:manipulation; user-select:none; -webkit-user-select:none;';

        rows.forEach(function(row) {
            var rowDiv = document.createElement('div');
            rowDiv.style.display = 'flex';
            rowDiv.style.width = '100%';

            row.forEach(function(key) {
                var btn = document.createElement('button');
                btn.textContent = key;
                btn.style.cssText = btnBase;

                if (key === 'CONFIRMAR') {
                    btn.style.background = '#e0c97f';
                    btn.style.color = '#1a1a2e';
                    btn.style.flex = '2';
                    btn.style.fontSize = '10px';
                    bind(btn, onConfirm);
                } else if (key === 'ESPACIO') {
                    btn.style.flex = '3';
                    bind(btn, function() { if(text.length < 50) { text += ' '; updateScreen(); }});
                } else if (key === '⌫') {
                    btn.style.flex = '1.2';
                    bind(btn, function() { text = text.slice(0,-1); updateScreen(); });
                } else {
                    bind(btn, function() { if(text.length < 50) { text += key.toLowerCase(); updateScreen(); }});
                }
                rowDiv.appendChild(btn);
            });
            box.appendChild(rowDiv);
        });

        box.insertBefore(screen, box.firstChild);
        overlay.appendChild(box);
        document.body.appendChild(overlay);
    };