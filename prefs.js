// Adapted from caffeine@patapon.info

const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const GObject = imports.gi.GObject;
const Config = imports.misc.config;

const Gettext = imports.gettext.domain('gnome-shell-extension-noannoyance');
const _ = Gettext.gettext;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;

const WMCLASS_LIST = 'by-class';
const BLACKLIST_ENABLED = 'enable-blacklist';

const Columns = {
    WM_ID: 0,
    WMCLASS: 1
};


class noAnnoyanceWidget {
    constructor(params) {
        this.w = new Gtk.Grid(params);
        this.w.set_orientation(Gtk.Orientation.VERTICAL);

        this._settings = Convenience.getSettings();
        this._settings.connect('changed', this._refresh.bind(this));
        this._changedPermitted = false;


        let enableBlacklistBox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL,
                                margin: 7});

        let enableBlacklistLabel = new Gtk.Label({label: _("Enable blacklist"),
                                           xalign: 0});

        let enableBlacklistSwitch = new Gtk.Switch({active: this._settings.get_boolean(BLACKLIST_ENABLED)});
        enableBlacklistSwitch.connect('notify::active', button => {
            this._settings.set_boolean(BLACKLIST_ENABLED, button.active);
        });

        enableBlacklistBox.pack_start(enableBlacklistLabel, true, true, 0);
        enableBlacklistBox.add(enableBlacklistSwitch);

        this.w.add(enableBlacklistBox);


        this._store = new Gtk.ListStore();
        this._store.set_column_types([GObject.TYPE_STRING, GObject.TYPE_STRING]);

        this._treeView = new Gtk.TreeView({ model: this._store,
                                            hexpand: true, vexpand: true });
        this._treeView.get_selection().set_mode(Gtk.SelectionMode.SINGLE);

        const appColumn = new Gtk.TreeViewColumn({ expand: true, sort_column_id: Columns.WMCLASS,
                                                 title: _("Blacklisted applications that will not steal focus") });

        const nameRenderer = new Gtk.CellRendererText;
        appColumn.pack_start(nameRenderer, true);
        appColumn.add_attribute(nameRenderer, "text", Columns.WMCLASS);
        this._treeView.append_column(appColumn);

        this.w.add(this._treeView);

        const toolbar = new Gtk.Toolbar();
        toolbar.get_style_context().add_class(Gtk.STYLE_CLASS_INLINE_TOOLBAR);
        this.w.add(toolbar);

        const newButton = new Gtk.ToolButton({ stock_id: Gtk.STOCK_NEW,
                                             label: _("Add application's WM_CLASS"),
                                             is_important: true });
        newButton.connect('clicked', this._createNew.bind(this));
        toolbar.add(newButton);

        const delButton = new Gtk.ToolButton({ stock_id: Gtk.STOCK_DELETE });
        delButton.connect('clicked', this._deleteSelected.bind(this));
        toolbar.add(delButton);

        this._changedPermitted = true;
        this._refresh();
    }

    _createNew() {
        const dialog = new Gtk.Dialog({ title: _("Enter WM_CLASS"),
                                      transient_for: this.w.get_toplevel(),
                                      modal: true });
        dialog.add_button(Gtk.STOCK_CANCEL, Gtk.ResponseType.CANCEL);
        dialog.add_button(_("Add"), Gtk.ResponseType.OK);
        dialog.set_default_response(Gtk.ResponseType.OK);

        const wmId = this._settings.get_strv(WMCLASS_LIST).length;

        const grid = new Gtk.Grid({ column_spacing: 10,
                                  row_spacing: 15,
                                  margin: 10 });
        dialog._appChooser = new Gtk.Entry();
        grid.attach(dialog._appChooser, 0, 0, 2, 1);
        dialog.get_content_area().add(grid);

        dialog.connect('response', (dialog, id) => {
            if (id != Gtk.ResponseType.OK) {
                dialog.destroy();
                return;
            }

            const wmClass = dialog._appChooser.get_text();
            if (!wmClass)
                return;

            this._changedPermitted = false;
            if (!this._appendItem(wmClass)) {
                this._changedPermitted = true;
                return;
            }
            let iter = this._store.append();

            this._store.set(iter,
                            [Columns.WM_ID, Columns.WMCLASS],
                            [wmId, wmClass]);
            this._changedPermitted = true;

            dialog.destroy();
        });
        dialog.show_all();
    }

    _deleteSelected() {
        const [any, , iter] = this._treeView.get_selection().get_selected();

        if (any) {
            log(this._store);
            const wmId = this._store.get_value(iter, Columns.WM_ID);

            this._changedPermitted = false;
            this._removeItem(wmId);
            this._changedPermitted = true;
            this._refresh();
        }
    }

    _refresh() {
        if (!this._changedPermitted)
            // Ignore this notification, model is being modified outside
            return;

        this._store.clear();

        const currentItems = this._settings.get_strv(WMCLASS_LIST);
        const validItems = [ ];
        for (let i = 0; i < currentItems.length; i++) {
            validItems.push(currentItems[i]);

            const iter = this._store.append();
            this._store.set(iter,
                            [Columns.WM_ID, Columns.WMCLASS],
                            [i, currentItems[i]]);
        }
    }

    _appendItem(wmClass) {
        const currentItems = this._settings.get_strv(WMCLASS_LIST);

        currentItems.push(wmClass);
        this._settings.set_strv(WMCLASS_LIST, currentItems);
        return true;
    }

    _removeItem(id) {
        const currentItems = this._settings.get_strv(WMCLASS_LIST);

        if (id < 0)
            return;

        currentItems.splice(id, 1);
        this._settings.set_strv(WMCLASS_LIST, currentItems);
    }
}

function init() {
    Convenience.initTranslations();
}

function buildPrefsWidget() {
    const widget = new noAnnoyanceWidget();
    widget.w.show_all();

    return widget.w;
}
