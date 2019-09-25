const Main = imports.ui.main;
const WindowAttentionHandler = imports.ui.windowAttentionHandler;
const Shell = imports.gi.Shell;
const Lang = imports.lang;

class StealMyFocus {
  constructor() {
    this._tracker = Shell.WindowTracker.get_default();
    this._handlerid = global.display.connect('window-demands-attention', Lang.bind(this, this._onWindowDemandsAttention));
  }

  _onWindowDemandsAttention(display, window) {
    Main.activateWindow(window);
  }

  destroy() {
    global.display.disconnect(this._handlerid);
  }
}

class WindowIsReadyRemover {
  constructor() {
    this._tracker = Shell.WindowTracker.get_default();
    log('Disabling Window Is Ready Notification')
    global.display.disconnect(Main.windowAttentionHandler._windowDemandsAttentionId);
  }

  destroy() {
    global.display.disconnect(this._handlerid);
  }
}

let windowIsReadyRemover;
let stealmyfocus;

function init() {
}

function enable() {
  stealmyfocus = new StealMyFocus();
  windowIsReadyRemover = new WindowIsReadyRemover();
}

function disable() {
  stealmyfocus.destroy();
  windowIsReadyRemover.destroy();
}
