var AIDialog = AIDialog || {};

(function () {

    var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;

    Game_Interpreter.prototype.pluginCommand = function (command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);
        if (command === 'ASKIA') {
            var playerMsg = $gameVariables.value(2);
            var npcname = $gameVariables.value(3);
            AIDialog.ask(playerMsg, npcname, this);
        }
    };

    AIDialog.ask = function (playerMsg, npcname, interpreter) {
        interpreter.setWaitMode('ai_dialog');

        // Neutralizar TouchInput mientras esperamos respuesta del webhook
        AIDialog._origTouchUpdate = TouchInput.update;
        TouchInput.update = function() {};

        var payload = {
            player_message: playerMsg,
            npcName: npcname
        };

        setTimeout(function() {

            var xhr = new XMLHttpRequest();
            xhr.open('POST', 'http://79.72.55.106:5678/webhook/npc-dialog', true);
            xhr.setRequestHeader('Content-Type', 'application/json');

            xhr.onload = function () {
                if (xhr.status === 200) {

                    if (!xhr.responseText) {
                        AIDialog._restoreTouchInput();
                        interpreter.setWaitMode('');
                        return;
                    }

                    try {
                        var data = JSON.parse(xhr.responseText);
                    } catch (e) {
                        console.log("Error parseando JSON:", e);
                        console.log("Respuesta recibida:", xhr.responseText);
                        AIDialog._restoreTouchInput();
                        interpreter.setWaitMode('');
                        return;
                    }

                    if (data.dialog) {
                        $gameMessage.add(data.dialog);
                    }

                    if (data.estado === "correcto") {
                        $gameVariables.setValue(4, 0);
                    }

                    if (data.estado === "incorrecto") {
                        $gameVariables.setValue(4, 1);
                    }
                }

                setTimeout(function() {
                    AIDialog._restoreTouchInput();
                    interpreter.setWaitMode('');
                }, 50);
            };

            xhr.onerror = function () {
                AIDialog._restoreTouchInput();
                interpreter.setWaitMode('');
            };

            xhr.send(JSON.stringify(payload));

        }, 100);
    };

    AIDialog._restoreTouchInput = function() {
        if (AIDialog._origTouchUpdate) {
            TouchInput.update = AIDialog._origTouchUpdate;
            AIDialog._origTouchUpdate = null;
        }
    };

    var _updateWaitMode = Game_Interpreter.prototype.updateWaitMode;
    Game_Interpreter.prototype.updateWaitMode = function () {
        if (this._waitMode === 'ai_dialog') return true;
        return _updateWaitMode.call(this);
    };

}());