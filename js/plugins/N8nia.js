(function() {

  var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
  
  Game_Interpreter.prototype.pluginCommand = function(command, args) {
    if (command === 'ASKIA') {
      var npcId = args[0];
      var playerMsg = args.slice(1).join(' ');
      AIDialog.ask(npcId, playerMsg, this);
    }
    _Game_Interpreter_pluginCommand.call(this, command, args);
  };

  var AIDialog = {};

  AIDialog.ask = function(npcId, playerMsg, interpreter) {
    interpreter.setWaitMode('ai_dialog');

    var payload = {
      npc_id: npcId,
      player_name: $gameParty.leader().name(),
      player_message: playerMsg,
      quest_active: $gameSwitches.value(10) ? "buscar_orbe" : "ninguna",
      gold: $gameParty.gold()
    };

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

  var _Game_Interpreter_updateWaitMode = Game_Interpreter.prototype.updateWaitMode;
  Game_Interpreter.prototype.updateWaitMode = function() {
    if (this._waitMode === 'ai_dialog') return true;
    return _Game_Interpreter_updateWaitMode.call(this);
  };

})();