declare module 'mammoth' {
  interface ConversionResult {
    value: string
    messages: Array<{ type: string; message: string; error?: Error }>
  }

  interface ArrayBufferInput {
    arrayBuffer: ArrayBuffer
  }

  export function convertToHtml(input: ArrayBufferInput): Promise<ConversionResult>
}
