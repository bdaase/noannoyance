// Based on https://github.com/ubuntu/gnome-shell-extension-appindicator

"use strict";

const {
    Gio,
    Gtk,
    GObject
} = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;

const WMCLASS_LIST = 'by-class';
const IGNORELIST_ENABLED = 'enable-ignorelist';

function init() {}

function buildPrefsWidget() {
    let settings = ExtensionUtils.getSettings(
        "org.gnome.shell.extensions.noannoyance"
    );

    let settingsBox = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        spacing: 8,
        margin_bottom: 60,
    });

    let enableIgnorelistBox = new Gtk.Box({
        orientation: Gtk.Orientation.HORIZONTAL,
    });
    let wmClassBox = new Gtk.Box({
        orientation: Gtk.Orientation.HORIZONTAL
    });

    let toggleLabel = new Gtk.Label({
        label: "Enable Ignorelist",
        halign: Gtk.Align.START,
        hexpand: true,
        visible: true,
    });

    let toggle = new Gtk.Switch({
        active: settings.get_boolean(IGNORELIST_ENABLED),
        halign: Gtk.Align.END,
        visible: true,
    });

    enableIgnorelistBox.append(toggleLabel);
    enableIgnorelistBox.append(toggle);

    settings.bind(
        IGNORELIST_ENABLED,
        toggle,
        "active",
        Gio.SettingsBindFlags.DEFAULT
    );

    settingsBox.append(enableIgnorelistBox);

    const customListStore = new Gtk.ListStore();
    customListStore.set_column_types([GObject.TYPE_STRING]);
    const customInitArray = settings.get_strv(WMCLASS_LIST);
    for (let i = 0; i < customInitArray.length; i++) {
        customListStore.set(customListStore.append(), [0], [customInitArray[i]]);
    }
    customListStore.append();

    const customTreeView = new Gtk.TreeView({
        model: customListStore,
        hexpand: true,
        vexpand: true,
    });

    const indicatorIdColumn = new Gtk.TreeViewColumn({
        title: 'WM__CLASS List ("Alt + F2" > Run "lg" > Click "Windows")',
        sizing: Gtk.TreeViewColumnSizing.AUTOSIZE,
    });

    const cellrenderer = new Gtk.CellRendererText({
        editable: true
    });

    indicatorIdColumn.pack_start(cellrenderer, true);
    indicatorIdColumn.add_attribute(cellrenderer, "text", 0);
    customTreeView.insert_column(indicatorIdColumn, 0);
    customTreeView.set_grid_lines(Gtk.TreeViewGridLines.BOTH);

    wmClassBox.append(customTreeView);
    settingsBox.append(wmClassBox);

    cellrenderer.connect("edited", (w, path, text) => {
        this.selection = customTreeView.get_selection();
        const selection = this.selection.get_selected();
        const iter = selection[2];

        customListStore.set(iter, [0], [text]);
        const storeLength = customListStore.iter_n_children(null);
        const customIconArray = [];

        for (let i = 0; i < storeLength; i++) {
            const returnIter = customListStore.iter_nth_child(null, i);
            const [success, iterList] = returnIter;
            if (!success) break;

            if (iterList) {
                const id = customListStore.get_value(iterList, 0);
                if (id) customIconArray.push(id);
            } else {
                break;
            }
        }
        settings.set_strv(WMCLASS_LIST, customIconArray);

        if (storeLength === 1 && text) customListStore.append();

        if (storeLength > 1) {
            if (!text && storeLength - 1 > path) customListStore.remove(iter);
            if (text && storeLength - 1 <= path) customListStore.append();
        }
    });

    return settingsBox;
}
