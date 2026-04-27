import { Document, Packer, Paragraph, TextRun } from 'docx'
import jsPDF from 'jspdf'
import { getEditor } from '../editorRegistry'
import type { Node as PmNode } from 'prosemirror-model'

/** Trigger a browser file download from a Blob */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** Recursively collect plain-text content from a ProseMirror Node */
function collectTextLines(node: PmNode): string[] {
  const lines: string[] = []
  if (node.isText) {
    lines.push(node.text ?? '')
    return lines
  }
  let current = ''
  node.forEach((child) => {
    if (child.isText) {
      current += child.text ?? ''
    } else if (child.type.name === 'hard_break') {
      lines.push(current)
      current = ''
    } else if (child.isBlock) {
      if (current) {
        lines.push(current)
        current = ''
      }
      lines.push(...collectTextLines(child))
    }
  })
  if (current) lines.push(current)
  return lines
}

/** Build docx Paragraphs from a ProseMirror Node */
function buildDocxParagraphs(node: PmNode): Paragraph[] {
  const paragraphs: Paragraph[] = []
  node.forEach((child) => {
    if (child.isBlock) {
      const texts: TextRun[] = []
      child.forEach((inline) => {
        if (inline.isText) {
          const bold = inline.marks.some((m) => m.type.name === 'strong')
          const italic = inline.marks.some((m) => m.type.name === 'em')
          texts.push(new TextRun({ text: inline.text ?? '', bold, italics: italic }))
        }
      })
      paragraphs.push(new Paragraph({ children: texts }))
    }
  })
  return paragraphs
}

// ---------------------------------------------------------------------------
// Text file exports
// ---------------------------------------------------------------------------

export async function exportTextAsTxt(tabId: string, filename: string): Promise<void> {
  const view = getEditor(tabId)
  const text = view ? collectTextLines(view.state.doc).join('\n') : ''
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  downloadBlob(blob, filename)
}

export async function exportTextAsJson(tabId: string, filename: string): Promise<void> {
  const view = getEditor(tabId)
  const json = view ? JSON.stringify(view.state.doc.toJSON(), null, 2) : '{}'
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
  downloadBlob(blob, filename)
}

export async function exportTextAsDocx(tabId: string, filename: string): Promise<void> {
  const view = getEditor(tabId)
  const paragraphs = view ? buildDocxParagraphs(view.state.doc) : [new Paragraph({ children: [] })]
  const doc = new Document({ sections: [{ children: paragraphs }] })
  const blob = await Packer.toBlob(doc)
  downloadBlob(blob, filename)
}

export async function exportTextAsDoc(tabId: string, filename: string): Promise<void> {
  // .doc uses RTF format – a simple human-readable format that Word and LibreOffice open natively
  const view = getEditor(tabId)
  const lines = view ? collectTextLines(view.state.doc) : []
  const escaped = lines
    .map((line) => line.replace(/\\/g, '\\\\').replace(/{/g, '\\{').replace(/}/g, '\\}'))
    .join('\\par\n')
  const rtf = `{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Times New Roman;}}{\\pard ${escaped}\\par}}`
  const blob = new Blob([rtf], { type: 'application/msword' })
  downloadBlob(blob, filename)
}

export async function exportTextAsPdf(tabId: string, filename: string): Promise<void> {
  const view = getEditor(tabId)
  const lines = view ? collectTextLines(view.state.doc) : []
  const pdf = new jsPDF()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 15
  const lineHeight = 8
  let y = margin
  for (const line of lines) {
    if (y + lineHeight > pageHeight - margin) {
      pdf.addPage()
      y = margin
    }
    pdf.text(line || ' ', margin, y)
    y += lineHeight
  }
  pdf.save(filename)
}

// ---------------------------------------------------------------------------
// Diagram exports
// ---------------------------------------------------------------------------

export function exportDiagramAsJson(
  nodes: unknown[],
  edges: unknown[],
  filename: string,
): void {
  const json = JSON.stringify({ nodes, edges }, null, 2)
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
  downloadBlob(blob, filename)
}

/**
 * Build a minimal SVG representation of the diagram from nodes/edges data.
 * We rely on the Redux-stored node positions and labels rather than the live DOM
 * so the export works even when the diagram panel is not currently visible.
 */

const EMPTY_DIAGRAM_WIDTH = 300
const EMPTY_DIAGRAM_HEIGHT = 200
const DIAGRAM_EXPORT_WIDTH = 800
const DIAGRAM_EXPORT_HEIGHT = 600

function buildDiagramSvg(nodes: unknown[], edges: unknown[]): string {
  type RFNode = { id: string; position: { x: number; y: number }; data?: { label?: string } }
  type RFEdge = { id: string; source: string; target: string }

  const rfNodes = nodes as RFNode[]
  const rfEdges = edges as RFEdge[]

  const nodeWidth = 120
  const nodeHeight = 40
  const padding = 40

  // Compute viewBox
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const n of rfNodes) {
    minX = Math.min(minX, n.position.x)
    minY = Math.min(minY, n.position.y)
    maxX = Math.max(maxX, n.position.x + nodeWidth)
    maxY = Math.max(maxY, n.position.y + nodeHeight)
  }
  if (rfNodes.length === 0) {
    minX = 0; minY = 0; maxX = EMPTY_DIAGRAM_WIDTH; maxY = EMPTY_DIAGRAM_HEIGHT
  }
  const vbX = minX - padding
  const vbY = minY - padding
  const vbW = maxX - minX + padding * 2
  const vbH = maxY - minY + padding * 2

  // Build a map of node id → centre point
  const centres = new Map<string, { x: number; y: number }>()
  for (const n of rfNodes) {
    centres.set(n.id, { x: n.position.x + nodeWidth / 2, y: n.position.y + nodeHeight / 2 })
  }

  const edgeSvg = rfEdges
    .map((e) => {
      const src = centres.get(e.source)
      const tgt = centres.get(e.target)
      if (!src || !tgt) return ''
      return `<line x1="${src.x}" y1="${src.y}" x2="${tgt.x}" y2="${tgt.y}" stroke="#aaaaaa" stroke-width="1.5" marker-end="url(#arrow)"/>`
    })
    .join('\n  ')

  const nodeSvg = rfNodes
    .map((n) => {
      const label = n.data?.label ?? n.id
      const { x, y } = n.position
      return `<g>
    <rect x="${x}" y="${y}" width="${nodeWidth}" height="${nodeHeight}" rx="4" fill="#2d2d2d" stroke="#555555" stroke-width="1"/>
    <text x="${x + nodeWidth / 2}" y="${y + nodeHeight / 2 + 4}" text-anchor="middle" fill="#d4d4d4" font-family="sans-serif" font-size="12">${label}</text>
  </g>`
    })
    .join('\n  ')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vbX} ${vbY} ${vbW} ${vbH}">
  <defs>
    <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
      <path d="M0,0 L0,6 L8,3 z" fill="#aaaaaa"/>
    </marker>
  </defs>
  <rect x="${vbX}" y="${vbY}" width="${vbW}" height="${vbH}" fill="#1e1e1e"/>
  ${edgeSvg}
  ${nodeSvg}
</svg>`
}

export function exportDiagramAsSvg(
  nodes: unknown[],
  edges: unknown[],
  filename: string,
): void {
  const svg = buildDiagramSvg(nodes, edges)
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
  downloadBlob(blob, filename)
}

async function svgToCanvas(
  svgString: string,
  width: number,
  height: number,
): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        URL.revokeObjectURL(url)
        reject(new Error('Unable to obtain 2D canvas context'))
        return
      }
      ctx.drawImage(img, 0, 0, width, height)
      URL.revokeObjectURL(url)
      resolve(canvas)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load SVG image'))
    }
    img.src = url
  })
}

export async function exportDiagramAsPng(
  nodes: unknown[],
  edges: unknown[],
  filename: string,
): Promise<void> {
  const svg = buildDiagramSvg(nodes, edges)
  const canvas = await svgToCanvas(svg, DIAGRAM_EXPORT_WIDTH, DIAGRAM_EXPORT_HEIGHT)
  canvas.toBlob((blob) => {
    if (blob) downloadBlob(blob, filename)
  }, 'image/png')
}

export async function exportDiagramAsJpeg(
  nodes: unknown[],
  edges: unknown[],
  filename: string,
): Promise<void> {
  const svg = buildDiagramSvg(nodes, edges)
  const canvas = await svgToCanvas(svg, DIAGRAM_EXPORT_WIDTH, DIAGRAM_EXPORT_HEIGHT)
  canvas.toBlob((blob) => {
    if (blob) downloadBlob(blob, filename)
  }, 'image/jpeg', 0.92)
}

export async function exportDiagramAsPdf(
  nodes: unknown[],
  edges: unknown[],
  filename: string,
): Promise<void> {
  const svg = buildDiagramSvg(nodes, edges)
  const canvas = await svgToCanvas(svg, DIAGRAM_EXPORT_WIDTH, DIAGRAM_EXPORT_HEIGHT)
  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: [DIAGRAM_EXPORT_WIDTH, DIAGRAM_EXPORT_HEIGHT],
  })
  pdf.addImage(imgData, 'PNG', 0, 0, DIAGRAM_EXPORT_WIDTH, DIAGRAM_EXPORT_HEIGHT)
  pdf.save(filename)
}
