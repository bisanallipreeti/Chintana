import PDFDocument from "pdfkit";
import { Parser } from "json2csv";
import { Thought } from "../../models/Thought.js";

function buildFilter(userId, query) {
  const filter = { user: userId };

  if (query.search) {
    filter.text = { $regex: query.search, $options: "i" };
  }

  if (query.category) {
    filter.category = query.category;
  }

  if (query.type) {
    filter.type = query.type;
  }

  if (query.minScore !== undefined || query.maxScore !== undefined) {
    filter.score = {};
    if (query.minScore !== undefined) filter.score.$gte = query.minScore;
    if (query.maxScore !== undefined) filter.score.$lte = query.maxScore;
  }

  if (query.dateFrom || query.dateTo) {
    filter.createdAt = {};
    if (query.dateFrom) filter.createdAt.$gte = new Date(query.dateFrom);
    if (query.dateTo) filter.createdAt.$lte = new Date(query.dateTo);
  }

  return filter;
}

async function listThoughts(userId, query) {
  const sortField = query.sort === "score" ? "score" : "createdAt";
  const sortDirection = query.order === "asc" ? 1 : -1;

  return Thought.find(buildFilter(userId, query))
    .sort({ [sortField]: sortDirection })
    .limit(5000)
    .lean();
}

function toRows(thoughts) {
  return thoughts.map((thought) => ({
    id: thought._id.toString(),
    createdAt: thought.createdAt,
    category: thought.category,
    type: thought.type,
    score: thought.score,
    stressLevel: thought.stressLevel,
    energyImpact: thought.energyImpact,
    text: thought.text,
    suggestion: thought.suggestion,
  }));
}

function formatTimestamp(value) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";

  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

function toPrintable(value) {
  if (value === null || value === undefined || value === "") {
    return "N/A";
  }

  return String(value);
}

function ensureRoom(doc, minHeight = 120) {
  const bottomLimit = doc.page.height - doc.page.margins.bottom;
  if (doc.y + minHeight > bottomLimit) {
    doc.addPage();
  }
}

export const exportService = {
  async buildCsv(userId, query) {
    const thoughts = await listThoughts(userId, query);
    const rows = toRows(thoughts);

    const parser = new Parser({
      fields: [
        "id",
        "createdAt",
        "category",
        "type",
        "score",
        "stressLevel",
        "energyImpact",
        "text",
        "suggestion",
      ],
    });

    return {
      buffer: Buffer.from(parser.parse(rows), "utf8"),
      count: rows.length,
    };
  },

  async buildPdf(user, query) {
    const thoughts = await listThoughts(user._id, query);

    const doc = new PDFDocument({ margin: 56, size: "A4" });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));

    doc.font("Times-Bold").fontSize(21).fillColor("#111827").text("Chintana Thought Export");
    doc.moveDown(0.4);
    doc.font("Times-Roman").fontSize(11).fillColor("#111827").text(`Account: ${user.fullName} (${user.email})`);
    doc.text(`Generated On: ${formatTimestamp(new Date())}`);
    doc.text(`Total Thoughts: ${thoughts.length}`);
    doc.moveDown(0.8);
    doc.moveTo(doc.page.margins.left, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).stroke("#D1D5DB");
    doc.moveDown(1);

    if (thoughts.length === 0) {
      doc.font("Times-Roman").fontSize(12).fillColor("#1F2937").text("No thoughts matched the selected filters for this export.", {
        align: "justify",
      });
    }

    thoughts.forEach((thought, index) => {
      ensureRoom(doc, 210);

      doc.font("Times-Bold").fontSize(14).fillColor("#111827").text(`Thought ${index + 1}`);
      doc.moveDown(0.25);

      doc.font("Times-Roman").fontSize(11).fillColor("#1F2937").text(`Category: ${toPrintable(thought.category)}`);
      doc.text(`Label: ${toPrintable(thought.type)}`);
      doc.text(`Cognitive Classification: ${toPrintable(thought.classification)}`);
      doc.text(`Cognitive Score: ${toPrintable(thought.score)}/100`);
      doc.text(`Stress Level: ${toPrintable(thought.stressLevel)}`);
      doc.text(`Mental Energy Impact: ${toPrintable(thought.energyImpact)}`);
      doc.text(`Created At: ${formatTimestamp(thought.createdAt)}`);
      doc.text(`Updated At: ${formatTimestamp(thought.updatedAt)}`);
      doc.moveDown(0.45);

      doc.font("Times-Bold").fontSize(11).fillColor("#111827").text("Thought Content");
      doc.moveDown(0.2);
      doc.font("Times-Roman").fontSize(11).fillColor("#1F2937").text(toPrintable(thought.text), {
        align: "justify",
      });
      doc.moveDown(0.45);

      doc.font("Times-Bold").fontSize(11).fillColor("#111827").text("Cognitive Skill Insight");
      doc.moveDown(0.2);
      doc.font("Times-Roman").fontSize(11).fillColor("#1F2937").text(toPrintable(thought.suggestion), {
        align: "justify",
      });
      doc.moveDown(0.9);
      doc.moveTo(doc.page.margins.left, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).stroke("#E5E7EB");
      doc.strokeColor("#000000");
      doc.moveDown(0.9);
    });

    doc.fillColor("#111827").font("Times-Roman");

    doc.end();

    return await new Promise((resolve) => {
      doc.on("end", () => {
        resolve({
          buffer: Buffer.concat(chunks),
          count: thoughts.length,
        });
      });
    });
  },
};
