import {
  app,
  BrowserWindow,
  globalShortcut,
  ipcMain,
  Menu,
  type MenuItemConstructorOptions,
} from "electron";
import path from "path";
import fs from "fs";

const isDev = !app.isPackaged;

function getWindowBoundsPath() {
  return path.join(app.getPath("userData"), "window-bounds.json");
}

interface SavedBounds {
  width: number;
  height: number;
  x?: number;
  y?: number;
}

function loadWindowBounds(): SavedBounds {
  try {
    const raw = fs.readFileSync(getWindowBoundsPath(), "utf-8");
    const bounds = JSON.parse(raw);
    if (
      typeof bounds.width === "number" &&
      typeof bounds.height === "number"
    ) {
      return bounds as SavedBounds;
    }
  } catch {
    // first launch or corrupt file – use defaults
  }
  return { width: 1280, height: 800 };
}

function saveWindowBounds(win: BrowserWindow) {
  try {
    fs.writeFileSync(getWindowBoundsPath(), JSON.stringify(win.getBounds()), "utf-8");
  } catch {
    // non-critical – ignore write errors
  }
}

function toggleFocusedWindowDevTools() {
  BrowserWindow.getFocusedWindow()?.webContents.toggleDevTools();
}

function createAppMenu() {
  const template: MenuItemConstructorOptions[] = [];

  if (process.platform === "darwin") {
    const appMenu: MenuItemConstructorOptions = {
      label: app.name,
      submenu: [{ role: "about" }, { type: "separator" }, { role: "quit" }],
    };
    template.push(appMenu);
  }

  const viewMenu: MenuItemConstructorOptions = {
    label: "View",
    submenu: [
      {
        label: "Toggle Developer Tools",
        accelerator:
          process.platform === "darwin" ? "Alt+Command+I" : "Ctrl+Shift+I",
        click: toggleFocusedWindowDevTools,
      },
    ],
  };
  template.push(viewMenu);

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function createWindow() {
  const savedBounds = loadWindowBounds();

  const win = new BrowserWindow({
    width: savedBounds.width,
    height: savedBounds.height,
    ...(savedBounds.x !== undefined && savedBounds.y !== undefined
      ? { x: savedBounds.x, y: savedBounds.y }
      : {}),
    minWidth: 800,
    minHeight: 600,
    frame: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
    backgroundColor: "#1e1e1e",
  });

  ipcMain.on("window:minimize", () => win.minimize());
  ipcMain.on("window:maximize", () => {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  });
  ipcMain.on("window:close", () => win.close());

  win.on("close", () => {
    if (!win.isMaximized() && !win.isMinimized()) {
      saveWindowBounds(win);
    }
  });

  win.on("closed", () => {
    ipcMain.removeAllListeners("window:minimize");
    ipcMain.removeAllListeners("window:maximize");
    ipcMain.removeAllListeners("window:close");
  });

  if (isDev) {
    win.loadURL("http://localhost:5183");
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

app.whenReady().then(() => {
  if (isDev) {
    createAppMenu();
    globalShortcut.register("F12", toggleFocusedWindowDevTools);
  }

  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});
