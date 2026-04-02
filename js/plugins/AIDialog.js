var AIDialog = AIDialog || {};

(function() {

    var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;

    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);
        if (command === 'ASKIA') {
            var playerMsg = $gameVariables.value(2);
            AIDialog.ask(playerMsg, this);
        }
    };

    AIDialog.ask = function(playerMsg, interpreter) {
        interpreter.setWaitMode('ai_dialog');
console.log('Mensaje que se envía:', playerMsg);
    console.log('Variable 2:', $gameVariables.value(2));
        var payload = { player_message: playerMsg };

        var xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://collins-stereotactic-sanctifiably.ngrok-free.dev/webhook/npc-dialog', true);
        xhr.setRequestHeader('Content-Type', 'application/json');

        xhr.onload = function() {
            if (xhr.status === 200) {
                var data = JSON.parse(xhr.responseText);
                $gameMessage.add(data.dialog);
            }
            interpreter.setWaitMode('');
        };

        xhr.onerror = function() {
            interpreter.setWaitMode('');
        };

        xhr.send(JSON.stringify(payload));
    };

    var _updateWaitMode = Game_Interpreter.prototype.updateWaitMode;
    Game_Interpreter.prototype.updateWaitMode = function() {
        if (this._waitMode === 'ai_dialog') return true;
        return _updateWaitMode.call(this);
    };

}());