const fs = require("fs");
const sharp = require("sharp");
const { PDFParse } = require("pdf-parse");
const { createWorker } = require("tesseract.js");

async function extractReportText(filePath, mimetype) {
  if (mimetype === "application/pdf") {
    const parser = new PDFParse({ data: fs.readFileSync(filePath) });
    try {
      const parsed = await parser.getText();
      return normalizeText(parsed.text);
    } finally {
      await parser.destroy();
    }
  }

  const processedImage = await sharp(filePath)
    .rotate()
    .grayscale()
    .normalize()
    .sharpen()
    .png()
    .toBuffer();
  const worker = await createWorker("eng");
  try {
    const result = await worker.recognize(processedImage);
    return normalizeText(result.data.text);
  } finally {
    await worker.terminate();
  }
}

function normalizeText(value) {
  return String(value || "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

module.exports = { extractReportText };
