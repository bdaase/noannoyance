const Main = imports.ui.main;

const Gio = imports.gi.Gio;
const Me = imports.misc.extensionUtils.getCurrentExtension();

function getSettings() {
  let GioSSS = Gio.SettingsSchemaSource;
  let schemaSource = GioSSS.new_from_directory(
      Me.dir.get_child("schemas").get_path(),
      GioSSS.get_default(),
      false
  );
  let schemaObj = schemaSource.lookup('org.gnome.shell.extensions.noannoyance', true);
  if (!schemaObj) {
      throw new Error('cannot find schemas');
  }
  return new Gio.Settings({ settings_schema: schemaObj });
}


class StealMyFocus {
  constructor() {
    this._windowDemandsAttentionId = global.display.connect('window-demands-attention', this._onWindowDemandsAttention.bind(this));
    this._windowMarkedUrgentId = global.display.connect('window-marked-urgent', this._onWindowDemandsAttention.bind(this));
  
    log("Disabling 'Window Is Ready' Notification");
  }

  _onWindowDemandsAttention(display, window) {
    if (!window || window.has_focus() || window.is_skip_taskbar())
            return;

    global.log(window.get_wm_class());

    let settings = getSettings();
    let preventDisable = settings.get_boolean('enable-blacklist');
    let byClassList = settings.get_strv('by-class');

    if (preventDisable) {
      if (byClassList.includes(window.get_wm_class())) {
        global.log("stealing focus ignored");
        return;
      }
    }

    Main.activateWindow(window);
  }

  destroy() {
    global.display.disconnect(this._windowDemandsAttentionId);
    global.display.disconnect(this._windowMarkedUrgentId);
    log("Reenabling 'Window Is Ready' Notification");
  }
}

let stealmyfocus;
let oldHandler;

function init() {
}

function enable() {
  global.display.disconnect(Main.windowAttentionHandler._windowDemandsAttentionId);
  global.display.disconnect(Main.windowAttentionHandler._windowMarkedUrgentId);
  oldHandler = Main.windowAttentionHandler;

  stealmyfocus = new StealMyFocus();

  Main.windowAttentionHandler = stealmyfocus;
}

function disable() {
  stealmyfocus.destroy();

  oldHandler._windowDemandsAttentionId = global.display.connect('window-demands-attention', oldHandler._onWindowDemandsAttention.bind(oldHandler));
  oldHandler._windowMarkedUrgentId = global.display.connect('window-marked-urgent', oldHandler._onWindowDemandsAttention.bind(oldHandler));

  Main.windowAttentionHandler = oldHandler;
}