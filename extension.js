const Main = imports.ui.main;
const WindowAttentionHandler = imports.ui.windowAttentionHandler;
const Shell = imports.gi.Shell;
const Lang = imports.lang;

function StealMyFocus() {
  this._init();
}

function WindowIsReadyRemover() {
  this._init();
}

StealMyFocus.prototype = {
  _init : function() {
    this._tracker = Shell.WindowTracker.get_default();
    this._handlerid = global.display.connect('window-demands-attention', Lang.bind(this, this._onWindowDemandsAttention));
  },

  _onWindowDemandsAttention: function(display, window) {
    Main.activateWindow(window);
  },

  destroy: function () {
    global.display.disconnect(this._handlerid);
  }
}


WindowIsReadyRemover.prototype = {

  _init : function() {
    this._tracker = Shell.WindowTracker.get_default();
    log('Disabling Window Is Ready Notification')
    global.display.disconnect(Main.windowAttentionHandler._windowDemandsAttentionId);
  },

  destroy: function () {
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
