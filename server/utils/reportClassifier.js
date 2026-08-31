const LAB_PATTERNS = [
  /complete blood count|\bcbc\b/i,
  /blood glucose|fasting glucose|hba1c|hemoglobin a1c/i,
  /lipid profile|cholesterol|triglyceride/i,
  /liver function|kidney function|renal function|thyroid function/i,
  /urine analysis|urinalysis|stool examination/i,
  /reference range|normal range|units?\b/i,
];

const IMAGING_PATTERNS = [
  /x[- ]?ray|radiograph|\bct\b|computed tomography/i,
  /\bmri\b|magnetic resonance|ultrasound|sonograph/i,
  /pet scan|mammograph|radiology/i,
  /imaging study|imaging findings|clinical impression|impression:/i,
];

function score(text, patterns) {
  return patterns.reduce((total, pattern) => total + (pattern.test(text) ? 1 : 0), 0);
}

function classifyReport({ extractedText = "", name = "", fileName = "" } = {}) {
  const content = String(extractedText || "").trim();
  const searchableText = content || `${name} ${fileName}`;
  const labScore = score(searchableText, LAB_PATTERNS);
  const imagingScore = score(searchableText, IMAGING_PATTERNS);

  if (labScore > imagingScore && labScore > 0) return "lab";
  if (imagingScore > labScore && imagingScore > 0) return "imaging";
  return "clinical";
}

module.exports = { classifyReport };
