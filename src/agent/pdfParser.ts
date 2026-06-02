// Define DOMMatrix globally for Node.js to prevent pdf-parse crash
if (typeof global !== "undefined" && !(global as any).DOMMatrix) {
  (global as any).DOMMatrix = class DOMMatrix {
    constructor() {}
  };
}

import { createRequire } from "module";

// Use native Node.js createRequire to import CommonJS modules in ESM
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

/**
 * Extracts raw text buffers from a mechanical PDF datasheet.
 * @param pdfBuffer Binary buffer of the PDF file
 * @returns Parsed text content
 */
export async function extractTextFromPdf(pdfBuffer: Buffer): Promise<string> {
  console.log(`[PDF PARSER] Parsing PDF datasheet (${pdfBuffer.length} bytes)...`);
  try {
    const data = await pdf(pdfBuffer);
    
    // Clean up empty lines and redundant whitespace
    const text = (data.text || "")
      .replace(/\r\n/g, "\n")
      .replace(/[ \t]+/g, " ")
      .split("\n")
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0)
      .join("\n");
      
    console.log(`[PDF PARSER] Extraction successful. Character length: ${text.length}`);
    return text;
  } catch (error: any) {
    console.error("[PDF PARSER] Extraction failed:", error);
    throw new Error(`PDF extraction failed: ${error.message}`);
  }
}
