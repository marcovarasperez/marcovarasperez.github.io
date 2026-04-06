AITextInput.showInput = function(interpreter) {
        interpreter.setWaitMode('ai_input');

        var existing = document.getElementById('ai-input-overlay');
        if (existing) document.body.removeChild(existing);

        var text = '';
        var overlay = document.createElement('div');
        overlay.id = 'ai-input-overlay';
        
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0,0,0,0.85);
            z-index: 20000;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            touch-action: none;
        `;

        var box = document.createElement('div');
        // Reducido max-width de 400 a 340px para que sea más pequeño
        box.style.cssText = 'background:#1a1a2e; border:2px solid #e0c97f; border-radius:8px; padding:8px; width:90%; max-width:340px; box-sizing:border-box;';

        var screen = document.createElement('div');
        // Padding reducido para ahorrar espacio
        screen.style.cssText = 'background:#000; border:1px solid #e0c97f; border-radius:4px; padding:5px; min-height:30px; color:#fff; font-size:14px; margin-bottom:8px; word-break:break-all; text-align:center; font-family:monospace;';
        
        function updateScreen() { screen.textContent = text; }

        function onConfirm() {
            if (text.trim() === '') return;
            $gameVariables.setValue(2, text.trim());
            document.body.removeChild(overlay);
            interpreter.setWaitMode('');
        }

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

        // Reducido padding de 12px a 8px y fuente a 13px
        var btnBase = 'background:#2a2a4e; color:#e0c97f; border:1px solid #e0c97f; border-radius:4px; padding:8px 1px; font-size:13px; font-weight:bold; flex:1; margin:1px; touch-action:manipulation; user-select:none;';

        rows.forEach(function(row) {
            var rowDiv = document.createElement('div');
            rowDiv.style.display = 'flex';
            rowDiv.style.marginBottom = '2px';

            row.forEach(function(key) {
                var btn = document.createElement('button');
                btn.textContent = key;
                btn.style.cssText = btnBase;

                if (key === 'CONFIRMAR') {
                    btn.style.background = '#e0c97f';
                    btn.style.color = '#1a1a2e';
                    btn.style.flex = '2.5';
                    btn.style.fontSize = '11px'; // Un poco más pequeña para que quepa la palabra
                    bind(btn, onConfirm);
                } else if (key === 'ESPACIO') {
                    btn.style.flex = '3';
                    bind(btn, function() { if(text.length < 50) { text += ' '; updateScreen(); }});
                } else if (key === '⌫') {
                    btn.style.flex = '1.5';
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