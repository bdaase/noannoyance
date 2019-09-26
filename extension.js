const Main = imports.ui.main;
const WindowAttentionHandler = imports.ui.windowAttentionHandler;
const Shell = imports.gi.Shell;

class StealMyFocus {
  constructor() {
    this._tracker = Shell.WindowTracker.get_default();
    log("Disabling 'Window Is Ready' notification");
    global.display.disconnect(Main.windowAttentionHandler._windowDemandsAttentionId);
    this._handlerid = global.display.connect('window-demands-attention', this._onWindowDemandsAttention.bind(this));
  }

  _onWindowDemandsAttention(display, window) {
    Main.activateWindow(window);
  }

  destroy() {
    log("Reenabling 'Window Is Ready' notification");
    global.display.disconnect(this._handlerid);
    global.display.connect('window-demands-attention', Main.windowAttentionHandler._onWindowDemandsAttention.bind(Main.windowAttentionHandler));
  }
}

let stealmyfocus;

function init() {
}

function enable() {
  stealmyfocus = new StealMyFocus();
}

function disable() {
  stealmyfocus.destroy();
}
