/**
 * PDF Export Library
 * 
 * Generates properly formatted screenplay PDFs using jsPDF.
 * Follows industry-standard formatting: Courier 12pt, specific margins.
 * 
 * Features:
 * - Standard screenplay formatting
 * - Watermark support (diagonal, header, footer)
 * - Revision colored pages
 * - Revision asterisks in margin
 */

import { jsPDF } from 'jspdf';

export interface ScriptElement {
  type: string;
  text: string;
  hasRevision?: boolean; // For asterisk marking
}

export interface TitlePageData {
  title: string;
  writtenBy: string;
  draftDate?: string;
  contact?: string;
}

export interface WatermarkConfig {
  enabled: boolean;
  text: string;
  opacity: number;
  position: 'diagonal' | 'footer' | 'header';
  fontSize: number;
}

export interface RevisionConfig {
  enabled: boolean;
  colorName: string;
  colorHex: string;
  date?: string;
  showAsterisks: boolean;
}

// Standard revision colors (with hex values for PDF)
export const REVISION_COLORS: Record<string, { hex: string; rgb: [number, number, number] }> = {
  'WHITE': { hex: '#ffffff', rgb: [255, 255, 255] },
  'BLUE': { hex: '#cce5ff', rgb: [204, 229, 255] },
  'PINK': { hex: '#ffe0eb', rgb: [255, 224, 235] },
  'YELLOW': { hex: '#fff9c4', rgb: [255, 249, 196] },
  'GREEN': { hex: '#c8e6c9', rgb: [200, 230, 201] },
  'GOLDENROD': { hex: '#ffe082', rgb: [255, 224, 130] },
  'BUFF': { hex: '#fff8e1', rgb: [255, 248, 225] },
  'SALMON': { hex: '#ffccbc', rgb: [255, 204, 188] },
  'CHERRY': { hex: '#f8bbd9', rgb: [248, 187, 217] },
};

// Screenplay page dimensions (in points, 72 points = 1 inch)
const PAGE_WIDTH = 612;  // 8.5 inches
const PAGE_HEIGHT = 792; // 11 inches

// Margins in points
const MARGIN_LEFT = 108;   // 1.5 inches
const MARGIN_RIGHT = 72;   // 1 inch
const MARGIN_TOP = 72;     // 1 inch
const MARGIN_BOTTOM = 72;  // 1 inch

// Content area
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

// Font settings
const FONT_SIZE = 12;
const LINE_HEIGHT = 12; // 12pt Courier is standard

// Element-specific formatting (left margin offsets from MARGIN_LEFT)
const ELEMENT_FORMATTING: Record<string, { leftOffset: number; maxWidth: number; uppercase?: boolean; centered?: boolean }> = {
  'scene-heading': { leftOffset: 0, maxWidth: CONTENT_WIDTH, uppercase: true },
  'action': { leftOffset: 0, maxWidth: CONTENT_WIDTH },
  'character': { leftOffset: 144, maxWidth: 252, uppercase: true }, // 2" from left edge of action
  'dialogue': { leftOffset: 72, maxWidth: 252 }, // ~3.5" wide
  'parenthetical': { leftOffset: 108, maxWidth: 180 }, // Narrower than dialogue
  'transition': { leftOffset: 0, maxWidth: CONTENT_WIDTH, uppercase: true },
};

/**
 * Generate a PDF from script elements
 */
export function generatePDF(
  elements: ScriptElement[],
  titlePage?: TitlePageData,
  watermark?: WatermarkConfig,
  revision?: RevisionConfig
): jsPDF {
  const doc = new jsPDF({
    unit: 'pt',
    format: 'letter',
  });

  // Use Courier font (built into jsPDF)
  doc.setFont('Courier', 'normal');
  doc.setFontSize(FONT_SIZE);

  let currentPage = 1;
  let currentY = MARGIN_TOP;

  // Add title page if provided
  if (titlePage) {
    addTitlePage(doc, titlePage);
    doc.addPage();
    currentPage++;
  }

  // Apply revision color background to first page
  if (revision?.enabled && revision.colorName !== 'WHITE') {
    addRevisionBackground(doc, revision);
  }

  // Process each element
  for (const element of elements) {
    const formatting = ELEMENT_FORMATTING[element.type] || ELEMENT_FORMATTING['action'];
    let text = element.text.trim();
    
    if (formatting.uppercase) {
      text = text.toUpperCase();
    }

    // Handle page breaks
    if (element.type === 'page-break') {
      doc.addPage();
      currentPage++;
      currentY = MARGIN_TOP;
      addPageNumber(doc, currentPage, revision);
      if (revision?.enabled && revision.colorName !== 'WHITE') {
        addRevisionBackground(doc, revision);
      }
      continue;
    }

    // Calculate text lines
    const x = MARGIN_LEFT + formatting.leftOffset;
    const lines = doc.splitTextToSize(text, formatting.maxWidth);

    // Check if we need a new page
    const requiredHeight = lines.length * LINE_HEIGHT;
    if (currentY + requiredHeight > PAGE_HEIGHT - MARGIN_BOTTOM) {
      doc.addPage();
      currentPage++;
      currentY = MARGIN_TOP;
      addPageNumber(doc, currentPage, revision);
      if (revision?.enabled && revision.colorName !== 'WHITE') {
        addRevisionBackground(doc, revision);
      }
    }

    // Add blank line before scene headings (except at page top)
    if (element.type === 'scene-heading' && currentY > MARGIN_TOP + LINE_HEIGHT) {
      currentY += LINE_HEIGHT;
    }

    // Draw revision asterisk if enabled and element has revision
    if (revision?.showAsterisks && element.hasRevision) {
      doc.setTextColor(100, 100, 100);
      doc.text('*', MARGIN_LEFT - 20, currentY);
      doc.setTextColor(0, 0, 0);
    }

    // Draw text
    for (const line of lines) {
      doc.text(line, x, currentY);
      currentY += LINE_HEIGHT;
    }

    // Add blank line after scene headings and transitions
    if (element.type === 'scene-heading' || element.type === 'transition') {
      currentY += LINE_HEIGHT;
    }
  }

  // Add page number to first content page
  if (currentPage === 1 || (titlePage && currentPage === 2)) {
    addPageNumber(doc, titlePage ? currentPage - 1 : currentPage, revision);
  }

  // Add watermark to all pages
  if (watermark?.enabled) {
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      addWatermark(doc, watermark);
    }
  }

  return doc;
}

/**
 * Add revision background color to page
 */
function addRevisionBackground(doc: jsPDF, revision: RevisionConfig): void {
  const color = REVISION_COLORS[revision.colorName];
  if (!color) return;

  doc.setFillColor(color.rgb[0], color.rgb[1], color.rgb[2]);
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');
}

/**
 * Add watermark to page
 */
function addWatermark(doc: jsPDF, watermark: WatermarkConfig): void {
  const prevFontSize = doc.getFontSize();
  
  doc.setFontSize(watermark.fontSize);
  doc.setTextColor(150, 150, 150);
  
  // Save current state for opacity
  const gState = doc.GState({ opacity: watermark.opacity });
  doc.setGState(gState);

  const centerX = PAGE_WIDTH / 2;
  const centerY = PAGE_HEIGHT / 2;

  switch (watermark.position) {
    case 'diagonal':
      // Rotate and center
      doc.text(watermark.text, centerX, centerY, { 
        align: 'center',
        angle: 45 
      });
      break;
    case 'header':
      doc.text(watermark.text, centerX, MARGIN_TOP / 2, { align: 'center' });
      break;
    case 'footer':
      doc.text(watermark.text, centerX, PAGE_HEIGHT - MARGIN_BOTTOM / 2, { align: 'center' });
      break;
  }

  // Reset state
  doc.setGState(doc.GState({ opacity: 1 }));
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(prevFontSize);
}

/**
 * Add title page
 */
function addTitlePage(doc: jsPDF, data: TitlePageData): void {
  const centerX = PAGE_WIDTH / 2;
  
  doc.setFont('Courier', 'bold');
  doc.setFontSize(24);
  
  // Title (centered, upper third)
  const titleY = PAGE_HEIGHT / 3;
  doc.text(data.title.toUpperCase(), centerX, titleY, { align: 'center' });
  
  // "Written by" (centered below title)
  doc.setFont('Courier', 'normal');
  doc.setFontSize(12);
  doc.text('Written by', centerX, titleY + 48, { align: 'center' });
  doc.text(data.writtenBy, centerX, titleY + 72, { align: 'center' });
  
  // Draft date (bottom left)
  if (data.draftDate) {
    doc.text(data.draftDate, MARGIN_LEFT, PAGE_HEIGHT - MARGIN_BOTTOM);
  }
  
  // Contact info (bottom right)
  if (data.contact) {
    doc.text(data.contact, PAGE_WIDTH - MARGIN_RIGHT, PAGE_HEIGHT - MARGIN_BOTTOM, { align: 'right' });
  }
}

/**
 * Add page number to top right (and revision info if applicable)
 */
function addPageNumber(doc: jsPDF, pageNum: number, revision?: RevisionConfig): void {
  doc.setFont('Courier', 'normal');
  doc.setFontSize(12);
  
  // Page number on right
  doc.text(`${pageNum}.`, PAGE_WIDTH - MARGIN_RIGHT, MARGIN_TOP / 2, { align: 'right' });
  
  // Revision info on left (if revision mode is active)
  if (revision?.enabled && revision.colorName !== 'WHITE') {
    const revisionText = revision.date 
      ? `${revision.colorName} REVISION - ${revision.date}`
      : `${revision.colorName} REVISION`;
    doc.text(revisionText, MARGIN_LEFT, MARGIN_TOP / 2);
  }
}

/**
 * Export and download PDF
 * Uses Tauri native dialog when in Tauri app, browser download otherwise
 */
export async function downloadPDF(
  elements: ScriptElement[],
  filename: string = 'screenplay.pdf',
  titlePage?: TitlePageData,
  config?: { watermark?: WatermarkConfig, revision?: RevisionConfig }
): Promise<void> {
  console.log('[pdfExport] downloadPDF called with', elements.length, 'elements');
  
  if (elements.length === 0) {
    console.warn('[pdfExport] No elements to export');
    return;
  }
  
  try {
    const doc = generatePDF(elements, titlePage, config?.watermark, config?.revision);
    console.log('[pdfExport] PDF generated successfully');
    
    // Check if running in Tauri
    const isTauri = '__TAURI__' in window || '__TAURI_INTERNALS__' in window;
    console.log('[pdfExport] Running in Tauri:', isTauri);
    
    if (isTauri) {
      // Use Tauri native dialog
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        
        // Get PDF as array buffer then convert to Uint8Array
        const arrayBuffer = doc.output('arraybuffer');
        const pdfBytes = Array.from(new Uint8Array(arrayBuffer as ArrayBuffer));
        console.log('[pdfExport] PDF bytes length:', pdfBytes.length);
        
        const result = await invoke('export_pdf_dialog', {
          pdfBytes,
          defaultName: filename
        });
        
        if (result) {
          console.log('[pdfExport] ✅ PDF saved via Tauri to:', result);
        } else {
          console.log('[pdfExport] User cancelled save dialog');
        }
        return;
      } catch (tauriError) {
        console.warn('[pdfExport] Tauri method failed:', tauriError);
        // Fall through to browser method
      }
    }
    
    // Browser fallback - use blob URL
    try {
      const pdfBlob = doc.output('blob');
      console.log('[pdfExport] PDF blob size:', pdfBlob.size);
      
      const blobUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }, 200);
      
      console.log('[pdfExport] ✅ Download initiated via blob URL');
    } catch (blobError) {
      console.error('[pdfExport] All methods failed:', blobError);
      throw blobError;
    }
    
  } catch (error) {
    console.error('[pdfExport] Error generating PDF:', error);
    throw error;
  }
}

/**
 * Get PDF as blob for preview
 */
export function getPDFBlob(
  elements: ScriptElement[],
  titlePage?: TitlePageData
): Blob {
  const doc = generatePDF(elements, titlePage);
  return doc.output('blob');
}
