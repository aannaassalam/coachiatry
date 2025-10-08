import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { marked } from "marked";
import logo from "@/public/assets/svg/logo.svg";

export async function generateMarkdownPDF(
  markdown: string,
  title: string,
  category: string
) {
  const htmlContent = marked.parse(markdown);
  const logoUrl = `${window.location.origin}${logo.src}`;
  // 🧱 Create a detached iframe to isolate styles
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.left = "-9999px"; // hide
  iframe.style.width = "1000px";
  iframe.style.height = "1200px";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) throw new Error("Failed to create iframe document");

  // 🧾 Write clean HTML with NO Tailwind/global CSS
  // NOTE: Removed padding from body and .pdf-container to avoid double-margins with PDF margins.
  // Content now starts at edges of canvas; PDF handles margins for Google Docs-like spacing.
  doc.open();
  doc.write(`
    <html>
      <head>
        <style>
          body {
            background-color: #ffffff;
            color: #000000;
            font-family: Inter, Arial, sans-serif;
            line-height: 1.6;
            padding: 0; /* Changed from 30px */
          }
          .pdf-container {
            padding:5px 20px; /* Changed from 30px */
            background-color: #ffffff;
          }
          .pdf-header {
            text-align: center;
            margin-bottom: 20px;
            display:flex;
            flex-direction: column;
            align-items: center;
          }
          .pdf-header h2{
            font-size:30px;
          }
          .pdf-header img {
            height: 50px;
            margin-bottom: 10px;
            align-self: start;
          }
          .pdf-meta {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
            font-size: 16px;
          }
          .pdf-content {
            font-size: 16px;
          }
        </style>
      </head>
      <body>
        <div class="pdf-container">
          <div class="pdf-header">
            <img src="${logoUrl}" alt="Logo" />
            <h2>${title}</h2>
          </div>
          <div class="pdf-meta">
            <span><strong>Category:</strong> ${category}</span>
            <span><strong>Date:</strong> ${new Date().toLocaleDateString()}</span>
          </div>
          <div class="pdf-content">${htmlContent}</div>
        </div>
      </body>
    </html>
  `);
  doc.close();

  // ✅ Wait for content and image to load
  await new Promise((res) => setTimeout(res, 400));

  const container = doc.body;

  console.log("before html2canvas");
  const canvas = await html2canvas(container, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    windowWidth: 1000
  });
  console.log("after html2canvas");

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: "p",
    unit: "pt",
    format: "a4"
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const margin = 20; // Top/bottom/left/right margin in pt (adjust as needed, e.g., 36pt for ~0.5in)
  const leftMargin = margin;
  const topMargin = margin;
  const bottomMargin = margin;
  const contentWidth = pageWidth - 2 * leftMargin;
  const contentHeight = pageHeight - topMargin - bottomMargin;

  const imgWidth = contentWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let usedHeight = 0;
  let isFirstPage = true;

  while (usedHeight < imgHeight) {
    if (!isFirstPage) {
      pdf.addPage();
    }

    const remaining = imgHeight - usedHeight;
    const thisPageContentH = Math.min(remaining, contentHeight);
    const imageY = topMargin - usedHeight;

    // Add the full image with offset to handle splitting
    pdf.addImage(imgData, "PNG", leftMargin, imageY, imgWidth, imgHeight);

    // Cover top margin with white on non-first pages to hide encroaching previous content
    if (!isFirstPage) {
      pdf.setFillColor(255, 255, 255);
      pdf.rect(leftMargin, 0, contentWidth, topMargin, "F");
    }

    // Always cover bottom margin with white to hide encroaching next content
    pdf.setFillColor(255, 255, 255);
    pdf.rect(
      leftMargin,
      pageHeight - bottomMargin,
      contentWidth,
      bottomMargin,
      "F"
    );

    // Draw border around content area (after fills to ensure lines are visible)
    pdf.setDrawColor(0, 0, 0); // Black border
    pdf.setLineWidth(1);
    pdf.rect(leftMargin, topMargin, contentWidth, contentHeight, "S");

    usedHeight += thisPageContentH;
    isFirstPage = false;
  }

  pdf.save(`${title.replace(/\s+/g, "_")}.pdf`);

  document.body.removeChild(iframe);
}
