"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const isDev = !electron_1.app.isPackaged;
function toggleFocusedWindowDevTools() {
    electron_1.BrowserWindow.getFocusedWindow()?.webContents.toggleDevTools();
}
function createAppMenu() {
    const template = [];
    if (process.platform === "darwin") {
        const appMenu = {
            label: electron_1.app.name,
            submenu: [{ role: "about" }, { type: "separator" }, { role: "quit" }],
        };
        template.push(appMenu);
    }
    const viewMenu = {
        label: "View",
        submenu: [
            {
                label: "Toggle Developer Tools",
                accelerator: process.platform === "darwin" ? "Alt+Command+I" : "Ctrl+Shift+I",
                click: toggleFocusedWindowDevTools,
            },
        ],
    };
    template.push(viewMenu);
    electron_1.Menu.setApplicationMenu(electron_1.Menu.buildFromTemplate(template));
}
function createWindow() {
    const win = new electron_1.BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        frame: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path_1.default.join(__dirname, "preload.js"),
        },
        backgroundColor: "#1e1e1e",
    });
    electron_1.ipcMain.on("window:minimize", () => win.minimize());
    electron_1.ipcMain.on("window:maximize", () => {
        if (win.isMaximized()) {
            win.unmaximize();
        }
        else {
            win.maximize();
        }
    });
    electron_1.ipcMain.on("window:close", () => win.close());
    win.on("closed", () => {
        electron_1.ipcMain.removeAllListeners("window:minimize");
        electron_1.ipcMain.removeAllListeners("window:maximize");
        electron_1.ipcMain.removeAllListeners("window:close");
    });
    if (isDev) {
        win.loadURL("http://localhost:5183");
    }
    else {
        win.loadFile(path_1.default.join(__dirname, "../dist/index.html"));
    }
}
electron_1.app.whenReady().then(() => {
    if (isDev) {
        createAppMenu();
        electron_1.globalShortcut.register("F12", toggleFocusedWindowDevTools);
    }
    createWindow();
});
electron_1.app.on("window-all-closed", () => {
    if (process.platform !== "darwin")
        electron_1.app.quit();
});
electron_1.app.on("activate", () => {
    if (electron_1.BrowserWindow.getAllWindows().length === 0)
        createWindow();
});
electron_1.app.on("will-quit", () => {
    electron_1.globalShortcut.unregisterAll();
});
//# sourceMappingURL=main.js.map