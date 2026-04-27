import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  minimizeWindow: () => ipcRenderer.send("window:minimize"),
  maximizeWindow: () => ipcRenderer.send("window:maximize"),
  closeWindow: () => ipcRenderer.send("window:close"),
  writeLog: (level: string, message: string, timestamp: string) =>
    ipcRenderer.send("log:write", { level, message, timestamp }),
  getLogPath: () => ipcRenderer.invoke("log:getPath"),
  readLog: () => ipcRenderer.invoke("log:read"),
});
