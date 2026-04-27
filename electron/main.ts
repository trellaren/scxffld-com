import {
  app,
  BrowserWindow,
  globalShortcut,
  ipcMain,
  Menu,
  session,
  type MenuItemConstructorOptions,
} from "electron";
import path from "path";
import fs from "fs";

const isDev = !app.isPackaged;

function getWindowBoundsPath() {
  return path.join(app.getPath("userData"), "window-bounds.json");
}

function getLogFilePath() {
  return path.join(app.getPath("userData"), "app.log");
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

const LOG_LEVEL_PADDING = 5;

/**
 * Sanitize a log field by stripping newline and carriage-return characters to
 * prevent log-injection attacks where a compromised renderer could embed fake
 * log lines inside a single message.
 */
function sanitizeLogField(value: unknown): string {
  if (typeof value !== "string") return String(value ?? "");
  return value.replace(/[\r\n]/g, " ");
}

function setupLogHandlers() {
  // Write a session-start marker so sessions are visually separated in the file
  try {
    const marker = `\n=== Session started: ${new Date().toISOString()} ===\n`;
    fs.appendFileSync(getLogFilePath(), marker, "utf-8");
  } catch {
    // non-critical
  }

  ipcMain.on(
    "log:write",
    (_event, data: { level: string; message: string; timestamp: string }) => {
      try {
        const level = sanitizeLogField(data.level);
        const message = sanitizeLogField(data.message);
        const timestamp = sanitizeLogField(data.timestamp);
        const levelTag = level.toUpperCase().padEnd(LOG_LEVEL_PADDING);
        const line = `[${timestamp}] [${levelTag}] ${message}\n`;
        fs.appendFileSync(getLogFilePath(), line, "utf-8");
      } catch {
        // non-critical
      }
    }
  );

  ipcMain.handle("log:getPath", () => getLogFilePath());

  ipcMain.handle("log:read", () => {
    try {
      return fs.readFileSync(getLogFilePath(), "utf-8");
    } catch {
      return "";
    }
  });
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

  // Pick the appropriate icon for the current platform
  const iconPath =
    process.platform === "darwin"
      ? path.join(__dirname, "../public/icons/icons.icns")
      : process.platform === "win32"
      ? path.join(__dirname, "../public/icons/icon.ico")
      : path.join(__dirname, "../public/icons/128x128.png");

  const win = new BrowserWindow({
    width: savedBounds.width,
    height: savedBounds.height,
    ...(savedBounds.x !== undefined && savedBounds.y !== undefined
      ? { x: savedBounds.x, y: savedBounds.y }
      : {}),
    minWidth: 800,
    minHeight: 600,
    frame: false,
    icon: iconPath,
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
  setupLogHandlers();

  // Apply a Content Security Policy to all web content served in the app.
  // This limits where scripts, styles, and other resources can be loaded from,
  // reducing the attack surface from any injected content.
  //
  // In development mode the Vite dev server injects an inline
  // <script type="module"> (the React Fast Refresh preamble) that would be
  // blocked by a strict script-src, causing a completely blank window.  Skip
  // the CSP in dev so all Vite/React tooling works without restriction.
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    if (isDev) {
      callback({ responseHeaders: details.responseHeaders });
      return;
    }

    // Production: apply a strict CSP.  The app is loaded from file:// so we
    // include the file: scheme alongside 'self' for the resource directives.
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [
          "default-src 'self' file:;" +
          " script-src 'self' file:;" +
          " style-src 'self' 'unsafe-inline' file:;" +
          " img-src 'self' data: blob: file:;" +
          " font-src 'self' data: file:;" +
          " connect-src 'self' https://api.openai.com https://api.anthropic.com https://localhost:* http://localhost:*;" +
          " frame-src 'none';" +
          " object-src 'none';"
        ],
      },
    });
  });

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
