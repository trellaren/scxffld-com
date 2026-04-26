# scxffld

A workspace and layout management application for desktop and web — similar to VS Code's multi-pane interface — with support for diagrams, rich text editing, and extensible file types.

## Features

- **Multi-pane layout** powered by [React Resizable Panels](https://github.com/bvaughn/react-resizable-panels)
- **Rich text editing** via [ProseMirror](https://prosemirror.net/)
- **Diagramming** via [React Flow](https://reactflow.dev/)
- **Cross-platform desktop** via [Electron](https://www.electronjs.org/)
- **Browser support** via Vite + React
- **Type-safe** with TypeScript throughout
- **State management** with [Redux Toolkit](https://redux-toolkit.js.org/)

## Tech Stack

| Concern          | Technology                      |
|------------------|---------------------------------|
| Runtime          | Electron (desktop) / Browser    |
| Language         | TypeScript                      |
| UI Framework     | React                           |
| Layout Engine    | react-resizable-panels          |
| State Management | Redux Toolkit                   |
| Text Engine      | ProseMirror                     |
| Graphics Engine  | React Flow                      |
| Build Tool       | Vite                            |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- npm v9+

### Install dependencies

```bash
npm install
```

### Run in browser (development)

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Run as Electron app (development)

```bash
npm run electron:dev
```

### Build for production

```bash
# Web build
npm run build

# Electron build
npm run electron:build
```

## Project Structure

```
scxffld-com/
├── electron/                 # Electron main process
│   └── main.ts
├── src/                      # React renderer / web app
│   ├── components/
│   │   ├── Diagram/          # React Flow diagram canvas
│   │   ├── Editor/           # ProseMirror text editor
│   │   └── Layout/           # react-resizable-panels workspace layout
│   ├── store/                # Redux store and slices
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── vite.config.ts
└── tsconfig.json
```

## License

MIT
