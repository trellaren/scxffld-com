"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld("electronAPI", {
    minimizeWindow: () => electron_1.ipcRenderer.send("window:minimize"),
    maximizeWindow: () => electron_1.ipcRenderer.send("window:maximize"),
    closeWindow: () => electron_1.ipcRenderer.send("window:close"),
});
//# sourceMappingURL=preload.js.map