import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  ShadingType,
  PageNumber,
  NumberFormat,
  Footer,
  Header,
  convertMillimetersToTwip,
  LevelFormat,
} from "docx";
import {
  parseMarkdownContent,
  type ContentBlock,
} from "./markdown-table-parser";

const COLORS = {
  primary: "1F4E79",
  headerBg: "1F4E79",
  headerText: "FFFFFF",
  lightGray: "F2F2F2",
  darkText: "333333",
  mutedText: "666666",
  border: "CCCCCC",
};

const METADATA_LABELS: Record<string, string> = {
  client_name: "Kunde",
  project_name: "Projekt",
  offer_date: "Angebotsdatum",
  valid_until: "Gültig bis",
  total_budget: "Budget",
  contact_person: "Ansprechpartner",
  engagement_type: "Art des Engagements",
  campaign_name: "Kampagnenname",
  campaign_budget: "Kampagnenbudget",
  target_audience: "Zielgruppe",
};

interface ExportOffer {
  title: string;
  metadata: Record<string, string | number>;
  sections: Array<{ sectionKey: string; title: string; content: string }>;
}

export async function generateOfferDocx(offer: ExportOffer): Promise<Buffer> {
  const children: Paragraph[] = [];

  // --- Title ---
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: offer.title,
          bold: true,
          size: 52, // 26pt
          color: COLORS.primary,
          font: "Calibri",
        }),
      ],
      spacing: { after: 200 },
    })
  );

  // --- Metadata block ---
  const metaEntries = Object.entries(offer.metadata).filter(
    ([, val]) => val !== "" && val !== undefined && val !== null
  );

  if (metaEntries.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Angebotsdetails",
            bold: true,
            size: 24,
            color: COLORS.primary,
            font: "Calibri",
          }),
        ],
        spacing: { before: 200, after: 100 },
      })
    );

    for (const [key, value] of metaEntries) {
      const label = METADATA_LABELS[key] || key;
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${label}: `,
              bold: true,
              size: 20,
              color: COLORS.darkText,
              font: "Calibri",
            }),
            new TextRun({
              text: String(value),
              size: 20,
              color: COLORS.darkText,
              font: "Calibri",
            }),
          ],
          spacing: { after: 40 },
        })
      );
    }

    // Separator line
    children.push(
      new Paragraph({
        spacing: { before: 200, after: 200 },
        border: {
          bottom: {
            style: BorderStyle.SINGLE,
            size: 1,
            color: COLORS.border,
          },
        },
      })
    );
  }

  // --- Sections ---
  for (const section of offer.sections) {
    // Section heading
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: section.title,
            bold: true,
            size: 32, // 16pt
            color: COLORS.primary,
            font: "Calibri",
          }),
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      })
    );

    // Check if this is a cost/commercial section
    const isCostSection =
      section.sectionKey === "commercial_terms" ||
      section.sectionKey === "investment_terms" ||
      section.sectionKey === "kostenkalkulation";

    if (isCostSection) {
      const blocks = parseMarkdownContent(section.content);
      for (const block of blocks) {
        if (block.type === "table") {
          children.push(...buildWordTable(block.headers, block.rows));
        } else {
          children.push(...markdownToDocxParagraphs(block.content));
        }
      }
    } else {
      children.push(...markdownToDocxParagraphs(section.content));
    }
  }

  const doc = new Document({
    numbering: {
      config: [
        {
          reference: "bullet-list",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "\u2022",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: { left: convertMillimetersToTwip(10), hanging: convertMillimetersToTwip(5) },
                },
              },
            },
          ],
        },
        {
          reference: "numbered-list",
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: "%1.",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: { left: convertMillimetersToTwip(10), hanging: convertMillimetersToTwip(5) },
                },
              },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              width: convertMillimetersToTwip(210),
              height: convertMillimetersToTwip(297),
            },
            margin: {
              top: convertMillimetersToTwip(25),
              bottom: convertMillimetersToTwip(25),
              left: convertMillimetersToTwip(25),
              right: convertMillimetersToTwip(25),
            },
            pageNumbers: { start: 1 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: offer.title,
                    size: 16,
                    color: COLORS.mutedText,
                    font: "Calibri",
                    italics: true,
                  }),
                ],
                alignment: AlignmentType.RIGHT,
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    children: ["Seite ", PageNumber.CURRENT, " von ", PageNumber.TOTAL_PAGES],
                    size: 16,
                    color: COLORS.mutedText,
                    font: "Calibri",
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer as Buffer;
}

// --- Helpers ---

function buildWordTable(headers: string[], rows: string[][]): Paragraph[] {
  const result: Paragraph[] = [];

  const colCount = headers.length;

  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map(
      (header) =>
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: header,
                  bold: true,
                  size: 20,
                  color: COLORS.headerText,
                  font: "Calibri",
                }),
              ],
              alignment: isCurrencyValue(header)
                ? AlignmentType.RIGHT
                : AlignmentType.LEFT,
            }),
          ],
          shading: {
            type: ShadingType.SOLID,
            fill: COLORS.headerBg,
            color: COLORS.headerBg,
          },
          width: {
            size: Math.floor(100 / colCount),
            type: WidthType.PERCENTAGE,
          },
        })
    ),
  });

  const dataRows = rows.map(
    (row, rowIdx) =>
      new TableRow({
        children: row.map(
          (cell) =>
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: cell,
                      size: 20,
                      color: COLORS.darkText,
                      font: "Calibri",
                    }),
                  ],
                  alignment: isCurrencyValue(cell)
                    ? AlignmentType.RIGHT
                    : AlignmentType.LEFT,
                }),
              ],
              shading:
                rowIdx % 2 === 1
                  ? {
                      type: ShadingType.SOLID,
                      fill: COLORS.lightGray,
                      color: COLORS.lightGray,
                    }
                  : undefined,
              width: {
                size: Math.floor(100 / colCount),
                type: WidthType.PERCENTAGE,
              },
            })
        ),
      })
  );

  const table = new Table({
    rows: [headerRow, ...dataRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });

  // The docx library Table is not a Paragraph, so we need to handle this.
  // We'll return an empty array and push the table directly to children.
  // Actually, Document sections accept both Paragraph and Table as children.
  // We'll change return type to accommodate.
  result.push(table as unknown as Paragraph);
  result.push(new Paragraph({ spacing: { after: 200 } }));

  return result;
}

function isCurrencyValue(text: string): boolean {
  return /(\d+[.,]\d+|\d+)\s*(EUR|€|\$|USD)/.test(text) ||
    /(EUR|€|\$|USD)\s*(\d+[.,]\d+|\d+)/.test(text) ||
    /^\d+[.,]?\d*$/.test(text.trim());
}

function markdownToDocxParagraphs(content: string): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  // Split into paragraph blocks (double newline or single newline for list items)
  const lines = content.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Heading detection
    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      paragraphs.push(
        new Paragraph({
          children: parseInlineFormatting(text),
          heading:
            level === 1
              ? HeadingLevel.HEADING_2
              : level === 2
                ? HeadingLevel.HEADING_3
                : HeadingLevel.HEADING_4,
          spacing: { before: 200, after: 100 },
        })
      );
      continue;
    }

    // Bullet list detection
    const bulletMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (bulletMatch) {
      paragraphs.push(
        new Paragraph({
          children: parseInlineFormatting(bulletMatch[1]),
          numbering: { reference: "bullet-list", level: 0 },
          spacing: { after: 40 },
        })
      );
      continue;
    }

    // Numbered list detection
    const numberedMatch = trimmed.match(/^\d+\.\s+(.+)$/);
    if (numberedMatch) {
      paragraphs.push(
        new Paragraph({
          children: parseInlineFormatting(numberedMatch[1]),
          numbering: { reference: "numbered-list", level: 0 },
          spacing: { after: 40 },
        })
      );
      continue;
    }

    // Regular paragraph
    paragraphs.push(
      new Paragraph({
        children: parseInlineFormatting(trimmed),
        spacing: { after: 120 },
      })
    );
  }

  return paragraphs;
}

function parseInlineFormatting(text: string): TextRun[] {
  const runs: TextRun[] = [];
  // Match bold (**text**), italic (*text*), bold+italic (***text***), and plain text
  const regex = /(\*{3}(.+?)\*{3}|\*{2}(.+?)\*{2}|\*(.+?)\*|([^*]+))/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match[2]) {
      // ***bold italic***
      runs.push(
        new TextRun({
          text: match[2],
          bold: true,
          italics: true,
          size: 20,
          color: COLORS.darkText,
          font: "Calibri",
        })
      );
    } else if (match[3]) {
      // **bold**
      runs.push(
        new TextRun({
          text: match[3],
          bold: true,
          size: 20,
          color: COLORS.darkText,
          font: "Calibri",
        })
      );
    } else if (match[4]) {
      // *italic*
      runs.push(
        new TextRun({
          text: match[4],
          italics: true,
          size: 20,
          color: COLORS.darkText,
          font: "Calibri",
        })
      );
    } else if (match[5]) {
      // plain text
      runs.push(
        new TextRun({
          text: match[5],
          size: 20,
          color: COLORS.darkText,
          font: "Calibri",
        })
      );
    }
  }

  if (runs.length === 0) {
    runs.push(
      new TextRun({
        text,
        size: 20,
        color: COLORS.darkText,
        font: "Calibri",
      })
    );
  }

  return runs;
}
