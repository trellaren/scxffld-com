import {
  app,
  BrowserWindow,
  globalShortcut,
  Menu,
  type MenuItemConstructorOptions,
} from "electron";
import path from "path";

const isDev = !app.isPackaged;

function toggleFocusedWindowDevTools() {
  BrowserWindow.getFocusedWindow()?.webContents.toggleDevTools();
}

function createAppMenu() {
  const template: MenuItemConstructorOptions[] = [
    ...(process.platform === "darwin"
      ? [
          {
            label: app.name,
            submenu: [
              { role: "about" },
              { type: "separator" },
              { role: "quit" },
            ],
          },
        ]
      : []),
    {
      label: "View",
      submenu: [
        {
          label: "Toggle Developer Tools",
          accelerator:
            process.platform === "darwin" ? "Alt+Command+I" : "Ctrl+Shift+I",
          click: toggleFocusedWindowDevTools,
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    backgroundColor: "#1e1e1e",
    titleBarStyle: "hiddenInset",
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
